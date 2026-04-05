import { db } from "../db/index.js";
import type { MyContext } from "../context.js";

const MEDALS = ["🥇", "🥈", "🥉"];

export async function leaderboardCommand(ctx: MyContext): Promise<void> {
  const isGroup = ctx.chat?.type === "group" || ctx.chat?.type === "supergroup";
  const chatId = ctx.chat?.id;

  if (isGroup && chatId) {
    await sendGroupLeaderboard(ctx, chatId);
    return;
  }

  const top10 = db.getTop10();
  if (top10.length === 0) {
    await ctx.reply(ctx.t("leaderboard-empty"));
    return;
  }

  const userId = ctx.from?.id;
  const lines = [ctx.t("leaderboard-title"), ""];

  top10.forEach((user, index) => {
    const medal = MEDALS[index] || `${index + 1}.`;
    const isCurrentUser = user.user_id === userId;
    const name = isCurrentUser
      ? `<b>${user.first_name}</b> (You)`
      : user.first_name;
    lines.push(
      ctx.t("leaderboard-entry", {
        medal,
        name,
        streak: user.max_streak,
      }),
    );
  });

  await ctx.reply(lines.join("\n"), { parse_mode: "HTML" });
}

async function sendGroupLeaderboard(
  ctx: MyContext,
  chatId: number,
): Promise<void> {
  const top10 = db.getGroupTop10(chatId);
  if (top10.length === 0) {
    await ctx.reply(ctx.t("group-leaderboard-empty"));
    return;
  }

  const userId = ctx.from?.id;
  const rank = userId ? db.getGroupRank(chatId, userId) : null;
  const lines = [ctx.t("group-leaderboard-title"), ""];

  top10.forEach((user, index) => {
    const medal = MEDALS[index] || `${index + 1}.`;
    const isCurrentUser = user.user_id === userId;
    const prefix = isCurrentUser ? "-> " : "";
    const name = isCurrentUser ? `<b>${user.first_name}</b>` : user.first_name;
    lines.push(
      `${prefix}${ctx.t("leaderboard-entry", {
        medal,
        name,
        streak: user.max_streak,
      })}`,
    );
  });

  if (rank) {
    lines.push("");
    lines.push(
      ctx.t("group-rank-position", {
        rank: rank.rank,
        total: rank.total,
      }),
    );
    lines.push(ctx.t("group-rank-cta"));
  }

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
        `${ctx.t("rank-you")} - ${ctx
          .t("rank-entry-simple", { rank: "", streak: user.max_streak })
          .replace(/^\s*[-—]\s*/, "")}`,
      );
      return;
    }

    lines.push(
      ctx.t("rank-entry-simple", {
        rank: `${user.rank}.`,
        streak: user.max_streak,
      }),
    );
  });

  await ctx.reply(lines.join("\n"), { parse_mode: "HTML" });
}
