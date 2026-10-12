import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
export type Overview = inferRouterOutputs<AppRouter>["ukk"]["overview"];
export type Profile = inferRouterOutputs<AppRouter>["ukk"]["profile"];
export type UTask = Overview["tasks"][number];
export type UContest = Overview["contests"][number];
export type UMember = Overview["members"][number];
export const roleLabels = {
  admin: "部長",
  manager: "コンテストリーダー",
  member: "部員",
};
export const statusLabels = { todo: "未着手", doing: "進行中", done: "完了" };
export const priorityLabels = { low: "低", medium: "通常", high: "高" };
export const memberStateLabels = {
  pending: "承認待ち",
  active: "有効",
  suspended: "停止中",
};
export function today() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(
    new Date()
  );
}
export function dateLabel(date: string | null) {
  if (!date) return "締切なし";
  const [, m, d] = date.split("-");
  return `${Number(m)}/${Number(d)}`;
}
export function isLate(task: UTask) {
  return !!task.dueDate && task.dueDate < today() && task.status !== "done";
}
