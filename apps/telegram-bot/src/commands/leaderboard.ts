// src/commands/leaderboard.ts
import { db } from "../db/index.js";
import type { MyContext } from "../context.js";

const MEDALS = ["🥇", "🥈", "🥉"];

export async function leaderboardCommand(ctx: MyContext): Promise<void> {
  const top10 = db.getTop10();

  if (top10.length === 0) {
    await ctx.reply(ctx.t("leaderboard-empty"));
    return;
  }

  const userId = ctx.from?.id;
  const lines: string[] = [];
  lines.push(ctx.t("leaderboard-title"));
  lines.push("");

  top10.forEach((user, idx) => {
    const medal = MEDALS[idx] || `${idx + 1}.`;
    const isCurrentUser = user.user_id === userId;
    // Show real name with indicator for current user
    const name = isCurrentUser
      ? `<b>${user.first_name}</b> (You)`
      : user.first_name;
    lines.push(
      ctx.t("leaderboard-entry", { medal, name, streak: user.max_streak }),
    );
  });

  await ctx.reply(lines.join("\n"), { parse_mode: "HTML" });
}

export async function rankCommand(ctx: MyContext): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply(ctx.t("rank-no-user"));
    return;
  }

  const rank = db.getUserRank(userId);
  if (!rank) {
    await ctx.reply(ctx.t("rank-no-streak"));
    return;
  }

  const nearby = db.getNearbyRanks(userId, 2);
  const lines: string[] = [];

  lines.push(ctx.t("rank-position", { rank: rank.rank, total: rank.total }));
  lines.push(ctx.t("rank-max-streak", { max: rank.max_streak }));
  lines.push("");
  lines.push(ctx.t("rank-nearby"));

  nearby.forEach((user) => {
    if (user.isCurrentUser) {
      lines.push(
        ctx.t("rank-you") +
          " — " +
          ctx
            .t("rank-entry-simple", { rank: "", streak: user.max_streak })
            .replace(/^ — /, ""),
      );
    } else {
      lines.push(
        ctx.t("rank-entry-simple", {
          rank: `${user.rank}.`,
          streak: user.max_streak,
        }),
      );
    }
  });

  await ctx.reply(lines.join("\n"), { parse_mode: "HTML" });
}
