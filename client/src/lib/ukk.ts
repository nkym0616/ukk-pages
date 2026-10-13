export type ClubRole = "admin" | "manager" | "member";
export type MemberState = "pending" | "active" | "suspended";
export type ContestStatus = "active" | "completed";
export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "doing" | "done";

export type Profile = {
  userId: number;
  displayName: string;
  role: ClubRole;
  state: MemberState;
  isOwner: boolean;
  setupAvailable: boolean;
};

export type UMember = {
  userId: number;
  displayName: string;
  role: ClubRole;
  state: MemberState;
  email: string | null;
};

export type UContest = {
  id: number;
  name: string;
  description: string;
  deadline: string | null;
  color: "green" | "blue" | "orange" | "purple";
  status: ContestStatus;
  createdBy: number | null;
  createdAt: string;
};

export type UParticipation = {
  contestId: number;
  userId: number;
  duty: string;
  manages: boolean;
};

export type UTask = {
  id: number;
  contestId: number;
  title: string;
  description: string;
  assigneeId: number | null;
  dueDate: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  createdBy: number | null;
  createdAt: string;
};

export type Overview = {
  viewerId: number;
  profile: Profile;
  contests: UContest[];
  participants: UParticipation[];
  tasks: UTask[];
  members: UMember[];
};

export const roleLabels: Record<ClubRole, string> = {
  admin: "部長",
  manager: "コンテストリーダー",
  member: "部員",
};
export const statusLabels: Record<TaskStatus, string> = {
  todo: "未着手",
  doing: "進行中",
  done: "完了",
};
export const priorityLabels: Record<TaskPriority, string> = {
  low: "低",
  medium: "通常",
  high: "高",
};
export const memberStateLabels: Record<MemberState, string> = {
  pending: "承認待ち",
  active: "有効",
  suspended: "停止中",
};

export function today() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(
    new Date(),
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
