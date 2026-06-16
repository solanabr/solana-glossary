import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/solana-wtf",
  env: {
    NEXT_PUBLIC_BASE_PATH: "/solana-wtf",
  },
};

export default nextConfig;
