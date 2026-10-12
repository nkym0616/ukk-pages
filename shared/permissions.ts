export type AccessMember = {
  userId: number;
  role: "admin" | "manager" | "member";
  state: "pending" | "active" | "suspended";
};
export type AccessParticipation = {
  userId: number;
  contestId: number;
  manages: boolean;
};
export function canViewContest(
  member: AccessMember,
  contestId: number,
  participants: AccessParticipation[]
) {
  return (
    member.state === "active" &&
    (member.role === "admin" ||
      participants.some(
        p => p.userId === member.userId && p.contestId === contestId
      ))
  );
}
export function canManageContest(
  member: AccessMember,
  contestId: number,
  participants: AccessParticipation[]
) {
  return (
    member.state === "active" &&
    (member.role === "admin" ||
      (member.role === "manager" &&
        participants.some(
          p =>
            p.userId === member.userId && p.contestId === contestId && p.manages
        )))
  );
}
export function canUpdateTaskStatus(
  member: AccessMember,
  task: { contestId: number; assigneeId: number | null },
  participants: AccessParticipation[]
) {
  return (
    canManageContest(member, task.contestId, participants) ||
    (canViewContest(member, task.contestId, participants) &&
      task.assigneeId === member.userId)
  );
}
