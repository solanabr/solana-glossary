"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import nacl from "tweetnacl";
import bs58 from "bs58";

/* ------------------------------------------------------------------ */
/*  Verify wallet signature and create/find user                        */
/* ------------------------------------------------------------------ */

export async function verifyWalletSignature(
  publicKey: string,
  signature: string,
  message: string
): Promise<{ token: string | null; error?: string }> {
  try {
    // Verify the signature
    const publicKeyBytes = bs58.decode(publicKey);
    const signatureBytes = bs58.decode(signature);
    const messageBytes = new TextEncoder().encode(message);

    const isValid = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes
    );

    if (!isValid) {
      return { token: null, error: "Invalid signature" };
    }

    // Use admin client to manage users
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return { token: null, error: "Server configuration error" };
    }

    const adminClient = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check if wallet already linked to a profile
    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("id")
      .eq("wallet_address", publicKey)
      .single();

    let userId: string;

    if (existingProfile) {
      userId = existingProfile.id;
    } else {
      // Create a new user with a deterministic email based on wallet
      const fakeEmail = `${publicKey.slice(0, 8)}@wallet.solana-wtf.local`;

      const { data: newUser, error: createError } =
        await adminClient.auth.admin.createUser({
          email: fakeEmail,
          email_confirm: true,
          user_metadata: {
            full_name: `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`,
            wallet_address: publicKey,
          },
        });

      if (createError || !newUser.user) {
        // Maybe user already exists with this email (re-linking same wallet)
        const { data: existingUser } =
          await adminClient.auth.admin.listUsers();
        const found = existingUser?.users.find(
          (u) => u.email === fakeEmail
        );
        if (!found) {
          return {
            token: null,
            error: createError?.message || "Failed to create user",
          };
        }
        userId = found.id;
      } else {
        userId = newUser.user.id;
      }

      // Link wallet address to profile
      await adminClient
        .from("profiles")
        .update({ wallet_address: publicKey })
        .eq("id", userId);
    }

    // Generate a session token for the user
    const { data: sessionData, error: sessionError } =
      await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email:
          `${publicKey.slice(0, 8)}@wallet.solana-wtf.local`,
      });

    if (sessionError || !sessionData) {
      return {
        token: null,
        error: sessionError?.message || "Failed to generate session",
      };
    }

    // Return the token hash that the client can use to exchange for a session
    const url = new URL(sessionData.properties?.hashed_token ? `https://placeholder.com?token=${sessionData.properties.hashed_token}` : sessionData.properties?.action_link || "");
    const token = url.searchParams.get("token") || sessionData.properties?.hashed_token || null;

    return { token };
  } catch (err) {
    return {
      token: null,
      error: err instanceof Error ? err.message : "Verification failed",
    };
  }
}
