import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type {
  ClubRole,
  ContestStatus,
  MemberState,
  Overview,
  Profile,
  TaskPriority,
  TaskStatus,
  UContest,
  UMember,
  UParticipation,
  UTask,
} from "@/lib/ukk";

type QueryOptions = Record<string, unknown> | undefined;
type MutationOptions = Record<string, unknown> | undefined;

const number = (value: unknown) => Number(value);
const fail = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};

async function callRpc<T>(fn: string, args: Record<string, unknown> = {}) {
  const { data, error } = await supabase.rpc(fn, args);
  fail(error);
  return data as T;
}

async function profileQuery(): Promise<Profile> {
  const rows = await callRpc<
    Array<{
      user_id: number | string;
      display_name: string;
      role: ClubRole;
      state: MemberState;
      is_owner: boolean;
      setup_available: boolean;
    }>
  >("get_profile_context");
  const row = rows?.[0];
  if (!row) throw new Error("プロフィールを取得できませんでした");
  return {
    userId: number(row.user_id),
    displayName: row.display_name,
    role: row.role,
    state: row.state,
    isOwner: row.is_owner,
    setupAvailable: row.setup_available,
  };
}

async function overviewQuery(): Promise<Overview> {
  const profile = await profileQuery();
  const [contestsResult, participantsResult, tasksResult, memberRows] =
    await Promise.all([
      supabase.from("contests").select("*").order("created_at"),
      supabase.from("contest_members").select("*"),
      supabase.from("tasks").select("*").order("created_at"),
      callRpc<
        Array<{
          user_id: number | string;
          display_name: string;
          role: ClubRole;
          state: MemberState;
          email: string | null;
        }>
      >("list_visible_profiles"),
    ]);
  fail(contestsResult.error);
  fail(participantsResult.error);
  fail(tasksResult.error);

  const contests: UContest[] = (contestsResult.data ?? []).map((row) => ({
    id: number(row.id),
    name: row.name,
    description: row.description,
    deadline: row.deadline,
    color: row.color as UContest["color"],
    status: row.status as ContestStatus,
    createdBy: row.created_by === null ? null : number(row.created_by),
    createdAt: row.created_at,
  }));
  const participants: UParticipation[] = (participantsResult.data ?? []).map(
    (row) => ({
      contestId: number(row.contest_id),
      userId: number(row.profile_id),
      duty: row.duty,
      manages: row.manages,
    }),
  );
  const tasks: UTask[] = (tasksResult.data ?? []).map((row) => ({
    id: number(row.id),
    contestId: number(row.contest_id),
    title: row.title,
    description: row.description,
    assigneeId: row.assignee_id === null ? null : number(row.assignee_id),
    dueDate: row.due_date,
    priority: row.priority as TaskPriority,
    status: row.status as TaskStatus,
    createdBy: row.created_by === null ? null : number(row.created_by),
    createdAt: row.created_at,
  }));
  const members: UMember[] = (memberRows ?? []).map((row) => ({
    userId: number(row.user_id),
    displayName: row.display_name,
    role: row.role as ClubRole,
    state: row.state as MemberState,
    email: row.email,
  }));
  return {
    viewerId: profile.userId,
    profile,
    contests,
    participants,
    tasks,
    members,
  };
}

async function currentUser() {
  const { data, error } = await supabase.auth.getUser();
  // Supabase returns AuthSessionMissingError before the first login. That is
  // the ordinary state for the public login page, not an application error.
  if (error?.message === "Auth session missing!") return null;
  fail(error);
  return data.user;
}

const useQueryOptions = (options: QueryOptions) => (options ?? {}) as never;
const useSupabaseMutation = <TInput, TOutput>(
  mutationFn: (input: TInput) => Promise<TOutput>,
  options: MutationOptions,
) => useMutation({ mutationFn, ...(options ?? {}) } as never);

async function voidRpc(fn: string, args: Record<string, unknown>) {
  await callRpc(fn, args);
  return { success: true };
}

export const trpc: any = {
  useUtils: () => {
    const queryClient = useQueryClient();
    return {
      auth: {
        me: {
          setData: (_input: unknown, data: unknown) =>
            queryClient.setQueryData(["auth", "me"], data),
          invalidate: () =>
            queryClient.invalidateQueries({ queryKey: ["auth", "me"] }),
        },
      },
      ukk: {
        invalidate: () => queryClient.invalidateQueries({ queryKey: ["ukk"] }),
        profile: {
          invalidate: () =>
            queryClient.invalidateQueries({ queryKey: ["ukk", "profile"] }),
        },
        overview: {
          invalidate: () =>
            queryClient.invalidateQueries({ queryKey: ["ukk", "overview"] }),
        },
      },
    };
  },
  auth: {
    me: {
      useQuery: (_input?: unknown, options?: QueryOptions) =>
        useQuery({
          queryKey: ["auth", "me"],
          queryFn: currentUser,
          ...useQueryOptions(options),
        }),
    },
    providers: {
      useQuery: (_input?: unknown, options?: QueryOptions) =>
        useQuery({
          queryKey: ["auth", "providers"],
          queryFn: async () => ({ google: true }),
          ...useQueryOptions(options),
        }),
    },
    logout: {
      useMutation: (options?: MutationOptions) =>
        useSupabaseMutation(async () => {
          const { error } = await supabase.auth.signOut();
          fail(error);
          return { success: true };
        }, options),
    },
  },
  ukk: {
    profile: {
      useQuery: (_input?: unknown, options?: QueryOptions) =>
        useQuery({
          queryKey: ["ukk", "profile"],
          queryFn: profileQuery,
          ...useQueryOptions(options),
        }),
    },
    overview: {
      useQuery: (_input?: unknown, options?: QueryOptions) =>
        useQuery({
          queryKey: ["ukk", "overview"],
          queryFn: overviewQuery,
          ...useQueryOptions(options),
        }),
    },
    claimOwner: {
      useMutation: (options?: MutationOptions) =>
        useSupabaseMutation(
          ({ code }: { code: string }) =>
            voidRpc("claim_initial_owner", { p_code: code }),
          options,
        ),
    },
    syncMembers: {
      useMutation: (options?: MutationOptions) =>
        useSupabaseMutation(async () => ({ success: true }), options),
    },
    updateMember: {
      useMutation: (options?: MutationOptions) =>
        useSupabaseMutation(
          (input: {
            userId: number;
            displayName: string;
            role: ClubRole;
            state: MemberState;
          }) =>
            voidRpc("update_member", {
              p_profile_id: input.userId,
              p_display_name: input.displayName,
              p_role: input.role,
              p_state: input.state,
            }),
          options,
        ),
    },
    createContest: {
      useMutation: (options?: MutationOptions) =>
        useSupabaseMutation(
          (input: Omit<UContest, "id" | "createdBy" | "createdAt">) =>
            callRpc<number>("create_contest", {
              p_name: input.name,
              p_description: input.description,
              p_deadline: input.deadline,
              p_color: input.color,
              p_status: input.status,
            }).then((id) => ({ id: number(id) })),
          options,
        ),
    },
    updateContest: {
      useMutation: (options?: MutationOptions) =>
        useSupabaseMutation(
          (input: Omit<UContest, "createdBy" | "createdAt">) =>
            voidRpc("update_contest", {
              p_contest_id: input.id,
              p_name: input.name,
              p_description: input.description,
              p_deadline: input.deadline,
              p_color: input.color,
              p_status: input.status,
            }),
          options,
        ),
    },
    setParticipation: {
      useMutation: (options?: MutationOptions) =>
        useSupabaseMutation(
          (input: {
            contestId: number;
            userId: number;
            duty: string;
            manages: boolean;
          }) =>
            voidRpc("set_participation", {
              p_contest_id: input.contestId,
              p_profile_id: input.userId,
              p_duty: input.duty,
              p_manages: input.manages,
            }),
          options,
        ),
    },
    removeParticipation: {
      useMutation: (options?: MutationOptions) =>
        useSupabaseMutation(
          (input: { contestId: number; userId: number }) =>
            voidRpc("remove_participation", {
              p_contest_id: input.contestId,
              p_profile_id: input.userId,
            }),
          options,
        ),
    },
    createTask: {
      useMutation: (options?: MutationOptions) =>
        useSupabaseMutation(
          (input: Omit<UTask, "id" | "createdBy" | "createdAt">) =>
            callRpc<number>("create_task", {
              p_contest_id: input.contestId,
              p_title: input.title,
              p_description: input.description,
              p_assignee_id: input.assigneeId,
              p_due_date: input.dueDate,
              p_priority: input.priority,
              p_status: input.status,
            }).then((id) => ({ id: number(id) })),
          options,
        ),
    },
    updateTask: {
      useMutation: (options?: MutationOptions) =>
        useSupabaseMutation(
          (input: Omit<UTask, "createdBy" | "createdAt">) =>
            voidRpc("update_task", {
              p_task_id: input.id,
              p_title: input.title,
              p_description: input.description,
              p_assignee_id: input.assigneeId,
              p_due_date: input.dueDate,
              p_priority: input.priority,
              p_status: input.status,
            }),
          options,
        ),
    },
    updateStatus: {
      useMutation: (options?: MutationOptions) =>
        useSupabaseMutation(
          (input: { id: number; status: TaskStatus }) =>
            voidRpc("update_task_status", {
              p_task_id: input.id,
              p_status: input.status,
            }),
          options,
        ),
    },
  },
};
