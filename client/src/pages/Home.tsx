import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronDown,
  Circle,
  CircleCheck,
  Clock3,
  Flag,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  List,
  LogOut,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  X,
  AlertCircle,
  Loader2,
  ChevronRight,
  LayoutGrid,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { canManageContest, canUpdateTaskStatus } from "@shared/permissions";
import {
  dateLabel,
  isLate,
  memberStateLabels,
  priorityLabels,
  roleLabels,
  statusLabels,
  today,
  type Overview,
  type Profile,
  type UTask,
  type UContest,
  type UMember,
} from "@/lib/ukk";
import {
  ContestForm,
  MemberForm,
  Modal,
  ParticipantsForm,
  TaskForm,
} from "@/components/UkkForms";

type Page = "overview" | "tasks" | "my" | "contests" | "members" | "access";
const nav = [
  { id: "overview", label: "ダッシュボード", icon: LayoutDashboard },
  { id: "my", label: "自分のタスク", icon: CircleCheck },
  { id: "tasks", label: "すべてのタスク", icon: ListTodo },
  { id: "contests", label: "コンテスト", icon: Trophy },
] as const;
function Logo() {
  return (
    <div className="brand">
      <span className="brand-mark">
        <span />
        <span />
        <span />
      </span>
      <div>
        <strong>
          UKK<span className="brand-dot">.</span>
        </strong>
        <small>TEAM WORKSPACE</small>
      </div>
    </div>
  );
}
function Empty({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <FolderKanban size={28} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
function Gate({
  profile,
  error,
  onRefresh,
  onLogout,
}: {
  profile?: Profile;
  error?: string;
  onRefresh: () => void;
  onLogout: () => void;
}) {
  const [showSetup, setShowSetup] = useState(false);
  const [code, setCode] = useState("");
  const claim = trpc.ukk.claimOwner.useMutation({
    onSuccess: () => {
      toast.success("アドミンの初期設定が完了しました");
      onRefresh();
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <div className="gate">
      <div className="gate-brand">
        <Logo />
      </div>
      <div className="gate-content">
        <span className="eyebrow">UKK TEAM WORKSPACE</span>
        <h1>
          チームの「やること」を、
          <br />
          <span>ひとつの場所に。</span>
        </h1>
        <p></p>
        <div className="gate-actions">
          {!profile ? (
            <>
              <button
                type="button"
                className="btn primary large"
                onClick={() =>
                  void startLogin().catch((err) => toast.error(err.message))
                }
              >
                Googleでログイン
                <ArrowRight size={18} />
              </button>
              <small>初回ログイン後はアドミンの承認が必要です</small>
            </>
          ) : (
            <div className="gate-notice">
              <ShieldCheck size={25} />
              <h3>
                {profile.state === "pending"
                  ? "登録の承認をお待ちください"
                  : "利用が停止されています"}
              </h3>
              <p>
                {profile.displayName} さんとしてログインしています。
                <br />
                UKKの管理者に連絡してください。
              </p>
              <div className="inline">
                <button className="btn secondary" onClick={onRefresh}>
                  状態を確認
                </button>
                <button className="text-btn" onClick={onLogout}>
                  ログアウト
                </button>
              </div>
              {profile.setupAvailable && (
                <div className="setup-panel">
                  <button
                    className="text-btn"
                    onClick={() => setShowSetup(!showSetup)}
                  >
                    管理者の初期設定
                  </button>
                  {showSetup && (
                    <form
                      className="setup-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        claim.mutate({ code });
                      }}
                    >
                      <label className="field">
                        <span>あなたに渡された設定コード</span>
                        <input
                          type="password"
                          autoComplete="off"
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          required
                          maxLength={100}
                          placeholder="初期設定コード"
                        />
                      </label>
                      <button
                        className="btn primary"
                        disabled={claim.isPending}
                      >
                        アドミンとして登録
                      </button>
                      <small>
                        このコードは一度だけ使用できます。部員には共有しないでください。
                      </small>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}
          {error && <p className="error-text">{error}</p>}
        </div>
        <div className="gate-points">
          <span>
            <ShieldCheck size={17} />
            ロールでアクセス管理
          </span>
          <span>
            <Trophy size={17} />
            コンテスト別の活動
          </span>
          <span>
            <CheckCheck size={17} />
            進捗を共有
          </span>
        </div>
      </div>
      <div className="gate-visual" aria-hidden="true">
        <div className="visual-label">SMALL STEPS. BIG IDEAS.</div>
        <div className="abstract-track">
          <div className="track-line" />
          <span className="track-dot d1">
            <Check size={23} />
          </span>
          <span className="track-dot d2">
            <Flag size={23} />
          </span>
          <span className="track-dot d3">
            <Trophy size={30} />
          </span>
          <span className="floating-label l1">アイデアを形に</span>
          <span className="floating-label l2">一緒に、次の一歩へ。</span>
        </div>
        <p>We build. We learn. We grow.</p>
      </div>
      <footer className="gate-footer">UKK · 一緒につくる、次の一歩。</footer>
    </div>
  );
}
export default function Home() {
  const auth = useAuth();
  const profile = trpc.ukk.profile.useQuery(undefined, {
    enabled: !!auth.user,
    retry: false,
    refetchInterval: 15000,
  });
  const overview = trpc.ukk.overview.useQuery(undefined, {
    enabled: profile.data?.state === "active",
    retry: false,
    refetchInterval: 15000,
  });
  if (
    auth.loading ||
    (auth.user && profile.isLoading) ||
    (profile.data?.state === "active" && overview.isLoading)
  )
    return (
      <div className="loading">
        <Logo />
        <Loader2 className="spin" size={24} />
        <p>ワークスペースを準備しています</p>
      </div>
    );
  if (!auth.user || !profile.data || profile.data.state !== "active")
    return (
      <Gate
        profile={profile.data}
        error={profile.error?.message || auth.error?.message}
        onRefresh={() => profile.refetch()}
        onLogout={() => auth.logout()}
      />
    );
  if (overview.error || !overview.data)
    return (
      <div className="loading">
        <AlertCircle size={32} />
        <h2>ワークスペースを読み込めませんでした</h2>
        <p>{overview.error?.message}</p>
        <button
          className="btn secondary"
          onClick={() => {
            profile.refetch();
            overview.refetch();
          }}
        >
          再読み込み
        </button>
        <button className="text-btn" onClick={() => auth.logout()}>
          ログアウト
        </button>
      </div>
    );
  return <Workspace data={overview.data} logout={() => auth.logout()} />;
}
function Workspace({ data, logout }: { data: Overview; logout: () => void }) {
  const [page, setPage] = useState<Page>("overview");
  const [mobile, setMobile] = useState(false);
  const [query, setQuery] = useState("");
  const [filterContest, setFilterContest] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [view, setView] = useState<"list" | "board">("list");
  const [taskModal, setTaskModal] = useState<{
    task?: UTask;
    contestId?: number;
  } | null>(null);
  const [contestModal, setContestModal] = useState<{
    contest?: UContest;
  } | null>(null);
  const [memberModal, setMemberModal] = useState<UMember | null>(null);
  const [participantModal, setParticipantModal] = useState<UContest | null>(
    null,
  );
  const [detail, setDetail] = useState<UTask | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [participantView, setParticipantView] = useState<UContest | null>(null);
  const utils = trpc.useUtils();
  const profile = data.profile;
  const admin = profile.role === "admin";
  const statusMutation = trpc.ukk.updateStatus.useMutation({
    onSuccess: () => {
      utils.ukk.overview.invalidate();
      toast.success("進捗を更新しました");
    },
    onError: (e) => {
      utils.ukk.invalidate();
      toast.error(e.message);
    },
  });
  const mine = data.tasks.filter((t) => t.assigneeId === data.viewerId);
  const unfinished = data.tasks.filter((t) => t.status !== "done");
  const done = data.tasks.filter((t) => t.status === "done").length;
  const progress = data.tasks.length
    ? Math.round((done / data.tasks.length) * 100)
    : 0;
  const manageable = data.contests.filter((c) =>
    canManageContest(profile, c.id, data.participants),
  );
  const filtered = useMemo(
    () =>
      data.tasks
        .filter(
          (t) =>
            (page !== "my" || t.assigneeId === data.viewerId) &&
            (filterContest === "all" ||
              t.contestId === Number(filterContest)) &&
            (filterStatus === "all" || t.status === filterStatus) &&
            (!query ||
              `${t.title} ${t.description} ${data.contests.find((c) => c.id === t.contestId)?.name} ${data.members.find((m) => m.userId === t.assigneeId)?.displayName}`
                .toLowerCase()
                .includes(query.toLowerCase())),
        )
        .sort(
          (a, b) =>
            (a.status === "done" ? 1 : 0) - (b.status === "done" ? 1 : 0) ||
            (a.dueDate || "9999").localeCompare(b.dueDate || "9999"),
        ),
    [data, page, filterContest, filterStatus, query],
  );
  const titles: Record<Page, string> = {
    overview: "ダッシュボード",
    tasks: "すべてのタスク",
    my: "自分のタスク",
    contests: "コンテスト",
    members: "メンバー",
    access: "ロール・アクセス",
  };
  function navigate(p: Page) {
    setPage(p);
    setMobile(false);
    setQuery("");
    setFilterContest("all");
    setFilterStatus("all");
  }
  function newTask(contestId?: number) {
    if (!manageable.length) {
      toast.info(
        admin
          ? "先にコンテストを作成してください"
          : "タスクを追加できるコンテストがありません",
      );
      return;
    }
    setTaskModal({ contestId });
  }
  function taskRow(t: UTask, compact = false) {
    const c = data.contests.find((c) => c.id === t.contestId);
    const person = data.members.find((m) => m.userId === t.assigneeId);
    const allowed = canUpdateTaskStatus(profile, t, data.participants);
    return (
      <div className={`task-row ${compact ? "compact" : ""}`} key={t.id}>
        <button
          className={`task-check ${t.status}`}
          aria-label={`${t.title}の詳細`}
          onClick={() => setDetail(t)}
        >
          {t.status === "done" ? (
            <Check size={14} />
          ) : t.status === "doing" ? (
            <span />
          ) : null}
        </button>
        <button className="task-main" onClick={() => setDetail(t)}>
          <strong className={t.status === "done" ? "completed-title" : ""}>
            {t.title}
          </strong>
          <span>
            <i className={`dot ${c?.color || "green"}`} />
            {c?.name}
          </span>
        </button>
        <span className={`task-priority ${t.priority}`}>
          <Flag size={12} />
          {priorityLabels[t.priority]}
        </span>
        <span className={`task-date ${isLate(t) ? "late" : ""}`}>
          <CalendarDays size={14} />
          {dateLabel(t.dueDate)}
        </span>
        {!compact && (
          <span className="task-person">
            <span className="avatar tiny">
              {person?.displayName.slice(0, 1) || "–"}
            </span>
            <span>{person?.displayName || "未割り当て"}</span>
          </span>
        )}
        <span className={`status-pill ${t.status}`}>
          {allowed ? (
            <select
              aria-label={`${t.title}の進捗`}
              value={t.status}
              disabled={statusMutation.isPending}
              onChange={(e) =>
                statusMutation.mutate({
                  id: t.id,
                  status: e.target.value as UTask["status"],
                })
              }
            >
              {Object.entries(statusLabels).map(([s, l]) => (
                <option key={s} value={s}>
                  {l}
                </option>
              ))}
            </select>
          ) : (
            statusLabels[t.status]
          )}
        </span>
        <button
          className="icon-btn row-more"
          aria-label={`${t.title}の詳細を開く`}
          onClick={() => setDetail(t)}
        >
          <MoreHorizontal size={17} />
        </button>
      </div>
    );
  }
  function contestCard(c: UContest) {
    const tasks = data.tasks.filter((t) => t.contestId === c.id);
    const completed = tasks.filter((t) => t.status === "done").length;
    const percent = tasks.length
      ? Math.round((completed / tasks.length) * 100)
      : 0;
    const people = data.participants.filter((p) => p.contestId === c.id);
    return (
      <article className="contest-card" key={c.id}>
        <div className="contest-top">
          <span className={`contest-icon ${c.color}`}>
            <Trophy size={21} />
          </span>
          <span
            className={`subtle-badge ${c.status === "completed" ? "gray" : ""}`}
          >
            {c.status === "active" ? "活動中" : "終了"}
          </span>
          {admin && (
            <button
              className="icon-btn"
              aria-label={`${c.name}を編集`}
              onClick={() => setContestModal({ contest: c })}
            >
              <MoreHorizontal size={19} />
            </button>
          )}
        </div>
        <button
          className="contest-name"
          onClick={() => {
            navigate("tasks");
            setFilterContest(String(c.id));
          }}
        >
          {c.name}
          <ChevronRight size={16} />
        </button>
        <p>{c.description || "チームで目標に向かって取り組もう。"}</p>
        <div className="contest-progress">
          <span>
            タスク進捗{" "}
            <strong>
              {completed}/{tasks.length}
            </strong>
          </span>
          <b>{percent}%</b>
        </div>
        <div className="progress-track">
          <span className={c.color} style={{ width: `${percent}%` }} />
        </div>
        <div className="contest-bottom">
          <span>
            <CalendarDays size={14} />
            {dateLabel(c.deadline)}
          </span>
          <button
            className="people-stack"
            onClick={() =>
              admin ? setParticipantModal(c) : setParticipantView(c)
            }
            aria-label={admin ? "参加メンバーを設定" : "参加メンバーを見る"}
            title={admin ? "参加メンバー・担当設定" : "参加メンバーを見る"}
          >
            {people.slice(0, 3).map((p) => (
              <span className="avatar tiny" key={p.userId}>
                {data.members
                  .find((m) => m.userId === p.userId)
                  ?.displayName.slice(0, 1)}
              </span>
            ))}
            <small>{people.length}人</small>
          </button>
        </div>
        {page === "contests" && (
          <div className="contest-actions">
            {admin && (
              <button
                className="btn secondary small-btn"
                onClick={() => setParticipantModal(c)}
              >
                <Users size={14} />
                参加・担当設定
              </button>
            )}
            {canManageContest(profile, c.id, data.participants) && (
              <button className="text-btn" onClick={() => newTask(c.id)}>
                <Plus size={15} />
                タスク追加
              </button>
            )}
          </div>
        )}
      </article>
    );
  }
  return (
    <div className="workspace">
      {mobile && (
        <button
          className="sidebar-backdrop"
          onClick={() => setMobile(false)}
          aria-label="メニューを閉じる"
        />
      )}
      <aside className={`sidebar ${mobile ? "open" : ""}`}>
        <button
          className="brand-home"
          aria-label="ダッシュボードへ戻る"
          title="ダッシュボードへ戻る"
          onClick={() => navigate("overview")}
        >
          <Logo />
        </button>
        <div className="workspace-switch">
          <span className="workspace-icon">U</span>
          <div>
            <strong>UKK ワークスペース</strong>
            <small>部活のチームスペース</small>
          </div>
          <ShieldCheck size={15} />
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {nav.map((n) => (
            <button
              key={n.id}
              className={`nav-item ${page === n.id ? "active" : ""}`}
              onClick={() => navigate(n.id)}
            >
              <n.icon size={19} />
              <span>{n.label}</span>
              {n.id === "my" &&
                mine.filter((t) => t.status !== "done").length > 0 && (
                  <b>{mine.filter((t) => t.status !== "done").length}</b>
                )}
            </button>
          ))}
        </nav>
        {admin && (
          <>
            <div className="nav-label management-label">MANAGEMENT</div>
            <nav>
              <button
                className={`nav-item ${page === "members" ? "active" : ""}`}
                onClick={() => navigate("members")}
              >
                <Users size={19} />
                <span>メンバー</span>
                {data.members.filter((m) => m.state === "pending").length >
                  0 && (
                  <b>
                    {data.members.filter((m) => m.state === "pending").length}
                  </b>
                )}
              </button>
              <button
                className={`nav-item ${page === "access" ? "active" : ""}`}
                onClick={() => navigate("access")}
              >
                <Shield size={19} />
                <span>ロール・アクセス</span>
              </button>
            </nav>
          </>
        )}
        <div className="sidebar-contests">
          <div className="nav-label">
            コンテスト
            {admin && (
              <button
                className="icon-btn"
                aria-label="コンテスト追加"
                onClick={() => setContestModal({})}
              >
                <Plus size={14} />
              </button>
            )}
          </div>
          {data.contests
            .filter((c) => c.status === "active")
            .slice(0, 5)
            .map((c) => (
              <button
                key={c.id}
                className="sidebar-contest"
                onClick={() => {
                  navigate("tasks");
                  setFilterContest(String(c.id));
                }}
              >
                <i className={`dot ${c.color}`} />
                <span>{c.name}</span>
              </button>
            ))}
          {!data.contests.length && (
            <small className="sidebar-empty">まだコンテストがありません</small>
          )}
        </div>
        <div className="sidebar-bottom">
          <div className="team-note">
            <span>ONE TEAM, MANY IDEAS.</span>
            <p>一緒につくる、次の一歩。</p>
            <div className="note-dots">
              <i />
              <i />
              <i />
            </div>
          </div>
          <div className="profile-card">
            <button
              className="profile-trigger"
              aria-label="自分のプロフィールを開く"
              title="自分のプロフィール"
              onClick={() => setProfileOpen(true)}
            >
              <span className="avatar">{profile.displayName.slice(0, 1)}</span>
              <span className="profile-summary">
                <strong>{profile.displayName}</strong>
                <small>{roleLabels[profile.role]}</small>
              </span>
            </button>
            <button
              className="icon-btn"
              aria-label="ログアウト"
              onClick={logout}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-btn menu-trigger"
              onClick={() => setMobile(true)}
              aria-label="メニューを開く"
            >
              <Menu size={20} />
            </button>
            <span>ワークスペース</span>
            <ChevronRight size={13} />
            <strong>{titles[page]}</strong>
          </div>
          <div className="topbar-right">
            <span className="member-only">
              <span />
              部員専用
            </span>
            <button
              className="top-avatar avatar tiny"
              aria-label="自分のプロフィールを開く"
              title="自分のプロフィール"
              onClick={() => setProfileOpen(true)}
            >
              {profile.displayName.slice(0, 1)}
            </button>
          </div>
        </header>
        <main className="main-content">
          <div className="page-heading">
            <div>
              <span className="eyebrow">
                {page === "overview"
                  ? "LET’S MAKE IT HAPPEN"
                  : "UKK TEAM WORKSPACE"}
              </span>
              <h1>
                {page === "overview" ? (
                  <>
                    おかえり、{profile.displayName} さん
                    <span className="hello-dot">.</span>
                  </>
                ) : (
                  titles[page]
                )}
              </h1>
              <p>
                {page === "overview"
                  ? "今日も、チームで一歩ずつ進めよう。"
                  : page === "members"
                    ? "メンバーの登録承認と操作権限を管理します。"
                    : page === "contests"
                      ? "それぞれの挑戦を、チームの力で。"
                      : page === "access"
                        ? "操作権限と担当ロールを分けて、安全に共有。"
                        : "やることを整理して、次のアクションを明確に。"}
              </p>
            </div>
            <div className="heading-actions">
              {page === "overview" && (
                <span className="today-date">
                  <CalendarDays size={15} />
                  {new Intl.DateTimeFormat("ja-JP", {
                    timeZone: "Asia/Tokyo",
                    month: "long",
                    day: "numeric",
                    weekday: "short",
                  }).format(new Date())}
                </span>
              )}
              {(page === "overview" || page === "tasks" || page === "my") &&
                manageable.length > 0 && (
                  <button className="btn primary" onClick={() => newTask()}>
                    <Plus size={17} />
                    タスクを追加
                  </button>
                )}
              {page === "contests" && admin && (
                <button
                  className="btn primary"
                  onClick={() => setContestModal({})}
                >
                  <Plus size={17} />
                  コンテスト作成
                </button>
              )}
            </div>
          </div>
          {page === "overview" && (
            <>
              <div className="stats-row">
                {[
                  {
                    label: "未完了のタスク",
                    value: unfinished.length,
                    sub: `全 ${data.tasks.length} 件のタスク`,
                    icon: ListTodo,
                    tone: "green",
                  },
                  {
                    label: "自分の担当タスク",
                    value: mine.filter((t) => t.status !== "done").length,
                    sub: "次の一歩をチェック",
                    icon: CircleCheck,
                    tone: "blue",
                  },
                  {
                    label: "活動中のコンテスト",
                    value: data.contests.filter((c) => c.status === "active")
                      .length,
                    sub: "チームで進める挑戦",
                    icon: Trophy,
                    tone: "orange",
                  },
                  {
                    label: "締切を過ぎたタスク",
                    value: data.tasks.filter(isLate).length,
                    sub: "優先して確認しよう",
                    icon: Clock3,
                    tone: "purple",
                  },
                ].map((stat) => (
                  <div className="stat" key={stat.label}>
                    <div>
                      <span className="stat-label">{stat.label}</span>
                      <strong>
                        {stat.value}
                        <small>件</small>
                      </strong>
                      <p>{stat.sub}</p>
                    </div>
                    <span className={`stat-icon ${stat.tone}`}>
                      <stat.icon size={21} />
                    </span>
                  </div>
                ))}
              </div>
              {!data.contests.length && (
                <section className="start-banner">
                  <span className="start-icon">
                    <Sparkles size={28} />
                  </span>
                  <div>
                    <span className="eyebrow">FIRST STEP</span>
                    <h2>
                      {admin
                        ? "UKKの最初の挑戦を、ここから。"
                        : "次の挑戦に向けて、準備しよう。"}
                    </h2>
                    <p>
                      {admin
                        ? "コンテストを作成して、メンバーと担当を設定しましょう。"
                        : "管理者が参加コンテストを設定すると、ここに表示されます。"}
                    </p>
                  </div>
                  {admin && (
                    <button
                      className="btn primary"
                      onClick={() => setContestModal({})}
                    >
                      最初のコンテストを作成
                      <ArrowRight size={16} />
                    </button>
                  )}
                </section>
              )}
              <div className="dashboard-split">
                <section className="panel tasks-panel">
                  <div className="section-heading">
                    <div>
                      <h2>
                        次に取り組むタスク
                        <span>
                          {mine.filter((t) => t.status !== "done").length}
                        </span>
                      </h2>
                      <p>あなたの担当タスクを、締切が近い順に。</p>
                    </div>
                    <button
                      className="text-btn muted-link"
                      onClick={() => navigate("my")}
                    >
                      すべて見る
                      <ArrowRight size={15} />
                    </button>
                  </div>
                  {mine.filter((t) => t.status !== "done").length ? (
                    mine
                      .filter((t) => t.status !== "done")
                      .sort((a, b) =>
                        (a.dueDate || "9999").localeCompare(
                          b.dueDate || "9999",
                        ),
                      )
                      .slice(0, 5)
                      .map((t) => taskRow(t, true))
                  ) : (
                    <Empty
                      title="今のところ、担当タスクはありません"
                      text="タスクが割り当てられると、ここで確認できます。"
                    />
                  )}
                </section>
                <section className="panel team-progress">
                  <div className="section-heading">
                    <div>
                      <h2>チームの進捗</h2>
                      <p>小さな一歩の積み重ね。</p>
                    </div>
                    <CheckCheck size={20} />
                  </div>
                  <div
                    className="progress-ring"
                    style={{
                      background: `conic-gradient(#287b60 ${progress}%, #edf1ed 0)`,
                    }}
                  >
                    <div>
                      <strong>
                        {progress}
                        <small>%</small>
                      </strong>
                      <span>タスク完了率</span>
                    </div>
                  </div>
                  <div className="progress-legend">
                    {Object.entries(statusLabels).map(([s, l]) => (
                      <span key={s}>
                        <i className={`dot status-${s}`} />
                        {l}
                        <b>{data.tasks.filter((t) => t.status === s).length}</b>
                      </span>
                    ))}
                  </div>
                </section>
              </div>
              <section className="contests-section">
                <div className="section-heading">
                  <div>
                    <h2>
                      参加コンテスト<span>{data.contests.length}</span>
                    </h2>
                    <p>それぞれの目標に、チームで向かおう。</p>
                  </div>
                  <button
                    className="text-btn muted-link"
                    onClick={() => navigate("contests")}
                  >
                    すべて見る
                    <ArrowRight size={15} />
                  </button>
                </div>
                {data.contests.length ? (
                  <div className="contest-grid">
                    {data.contests.slice(0, 3).map(contestCard)}
                  </div>
                ) : (
                  <div className="no-contest-line">
                    <Trophy size={17} />
                    コンテストを作成・参加すると、進捗がここに表示されます。
                  </div>
                )}
              </section>
            </>
          )}
          {(page === "tasks" || page === "my") && (
            <section className="panel list-panel">
              <div className="task-filters">
                <div className="search-field">
                  <Search size={17} />
                  <input
                    placeholder="タスクを検索…"
                    aria-label="タスクを検索"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <div className="filter-controls">
                  <select
                    aria-label="コンテストで絞り込み"
                    value={filterContest}
                    onChange={(e) => setFilterContest(e.target.value)}
                  >
                    <option value="all">すべてのコンテスト</option>
                    {data.contests.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="進捗で絞り込み"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">すべての進捗</option>
                    {Object.entries(statusLabels).map(([s, l]) => (
                      <option key={s} value={s}>
                        {l}
                      </option>
                    ))}
                  </select>
                  <div className="view-switch">
                    <button
                      aria-label="リスト表示"
                      className={view === "list" ? "active" : ""}
                      onClick={() => setView("list")}
                    >
                      <List size={17} />
                    </button>
                    <button
                      aria-label="ボード表示"
                      className={view === "board" ? "active" : ""}
                      onClick={() => setView("board")}
                    >
                      <LayoutGrid size={16} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="list-caption">
                {filtered.length} 件のタスク
                <span>
                  <ArrowDown size={12} />
                  締切が近い順
                </span>
              </div>
              {!filtered.length ? (
                <Empty
                  title={
                    query || filterStatus !== "all" || filterContest !== "all"
                      ? "条件に合うタスクはありません"
                      : "まだタスクがありません"
                  }
                  text="タスクを追加するか、担当の割り当てを待ちましょう。"
                  action={
                    manageable.length > 0 ? (
                      <button
                        className="btn secondary"
                        onClick={() => newTask()}
                      >
                        <Plus size={16} />
                        タスクを追加
                      </button>
                    ) : undefined
                  }
                />
              ) : view === "list" ? (
                <div className="task-list">
                  {filtered.map((t) => taskRow(t))}
                </div>
              ) : (
                <div className="kanban">
                  {Object.entries(statusLabels).map(([s, l]) => (
                    <div className="kanban-column" key={s}>
                      <h3>
                        <i className={`dot status-${s}`} />
                        {l}
                        <span>
                          {filtered.filter((t) => t.status === s).length}
                        </span>
                      </h3>
                      {filtered
                        .filter((t) => t.status === s)
                        .map((t) => (
                          <button
                            key={t.id}
                            className="kanban-card"
                            onClick={() => setDetail(t)}
                          >
                            <span
                              className={`kanban-contest ${data.contests.find((c) => c.id === t.contestId)?.color}`}
                            >
                              {
                                data.contests.find((c) => c.id === t.contestId)
                                  ?.name
                              }
                            </span>
                            <strong>{t.title}</strong>
                            <p>{t.description || "説明なし"}</p>
                            <footer>
                              <span className={isLate(t) ? "late" : ""}>
                                <CalendarDays size={13} />
                                {dateLabel(t.dueDate)}
                              </span>
                              <span className="avatar tiny">
                                {data.members
                                  .find((m) => m.userId === t.assigneeId)
                                  ?.displayName.slice(0, 1) || "–"}
                              </span>
                            </footer>
                          </button>
                        ))}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
          {page === "contests" &&
            (data.contests.length ? (
              <div className="contest-grid full">
                {data.contests.map(contestCard)}
              </div>
            ) : (
              <section className="panel">
                <Empty
                  title="まだコンテストがありません"
                  text={
                    admin
                      ? "コンテストを作成し、参加メンバーを設定してください。"
                      : "参加コンテストが設定されるとここに表示されます。"
                  }
                  action={
                    admin ? (
                      <button
                        className="btn primary"
                        onClick={() => setContestModal({})}
                      >
                        <Plus size={16} />
                        コンテスト作成
                      </button>
                    ) : undefined
                  }
                />
              </section>
            ))}
          {page === "members" && admin && (
            <>
              <div className="info-note members-note">
                <ShieldCheck size={20} />
                <span>
                  部員が初回ログインすると「承認待ち」に表示されます。「権限設定」から有効にし、コンテストに追加してください。
                </span>
              </div>
              <section className="panel">
                <div className="section-heading">
                  <h2>
                    登録メンバー<span>{data.members.length}</span>
                  </h2>
                  <span className="muted">
                    承認待ち{" "}
                    {data.members.filter((m) => m.state === "pending").length}{" "}
                    人
                  </span>
                </div>
                <div className="member-table">
                  {data.members.map((m) => (
                    <div className="member-row" key={m.userId}>
                      <span className="avatar">
                        {m.displayName.slice(0, 1)}
                      </span>
                      <div className="member-name">
                        <strong>{m.displayName}</strong>
                        <small>
                          {typeof m.email === "string"
                            ? m.email
                            : "メール情報なし"}
                        </small>
                      </div>
                      <span className={`role-tag ${m.role}`}>
                        {roleLabels[m.role]}
                      </span>
                      <span className={`member-state ${m.state}`}>
                        <i />
                        {memberStateLabels[m.state]}
                      </span>
                      <button
                        className="btn secondary small-btn"
                        onClick={() => setMemberModal(m)}
                      >
                        権限設定
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
          {page === "access" && admin && (
            <>
              <div className="access-intro">
                <ShieldCheck size={27} />
                <div>
                  <h2>権限は「操作」、担当は「役割」。</h2>
                  <p>
                    操作権限でアクセス範囲を管理し、開発・デザイン・発表などの担当はコンテストごとに設定します。
                  </p>
                </div>
              </div>
              <section className="panel permission-panel">
                <div className="section-heading">
                  <h2>操作権限のルール</h2>
                  <span className="subtle-badge">
                    <ShieldCheck size={13} />
                    サーバー側で制御
                  </span>
                </div>
                <div className="permission-table">
                  <div className="permission-row heading">
                    <span>操作できること</span>
                    <strong>アドミン</strong>
                    <strong>コンテストリーダー</strong>
                    <strong>メンバー</strong>
                  </div>
                  {[
                    [
                      "コンテストの閲覧",
                      "すべて",
                      "参加コンテスト",
                      "参加コンテスト",
                    ],
                    ["コンテスト作成・編集", "可能", "不可", "不可"],
                    ["参加メンバー・担当設定", "可能", "不可", "不可"],
                    [
                      "タスク追加・編集・割り振り",
                      "すべて",
                      "管理担当のコンテスト",
                      "不可",
                    ],
                    [
                      "タスクの進捗更新",
                      "すべて",
                      "管理対象・自分の担当",
                      "自分の担当のみ",
                    ],
                    ["登録承認・操作権限の変更", "可能", "不可", "不可"],
                  ].map((row) => (
                    <div className="permission-row" key={row[0]}>
                      {row.map((v, i) => (
                        <span key={i} className={v === "不可" ? "muted" : ""}>
                          {v === "可能" ? <Check size={18} /> : v}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="access-footer">
                  <p>
                    コンテストリーダーには、参加設定の「管理担当」を指定すると、そのコンテスト内のタスク管理が許可されます。
                  </p>
                  <button
                    className="btn primary"
                    onClick={() => navigate("members")}
                  >
                    メンバーの権限を設定
                    <ArrowRight size={16} />
                  </button>
                </div>
              </section>
            </>
          )}
          {(page === "members" || page === "access") && !admin && (
            <Empty
              title="アクセス権限がありません"
              text="管理メニューはアドミンのみ利用できます。"
            />
          )}
          <footer className="app-footer">
            <span>UKK WORKSPACE</span>
            <span>一緒につくる、次の一歩。</span>
          </footer>
        </main>
      </div>
      {profileOpen && (
        <Modal
          title="自分のプロフィール"
          description="あなたの役職と、コンテストごとの担当を確認できます。"
          onClose={() => setProfileOpen(false)}
        >
          <div className="profile-details">
            <div className="profile-identity">
              <span className="avatar">{profile.displayName.slice(0, 1)}</span>
              <div>
                <h3>{profile.displayName}</h3>
                <span>
                  {roleLabels[profile.role]}
                  {profile.isOwner ? " · 初期登録者" : ""}
                </span>
              </div>
            </div>
            <div className="info-note">
              <ShieldCheck size={18} />
              <span>
                {admin
                  ? "すべてのコンテスト・タスクと、部員の役職を管理できます。"
                  : profile.role === "manager"
                    ? "参加コンテストを閲覧し、管理担当のコンテストでタスクを追加・編集できます。"
                    : "参加コンテストを閲覧し、自分のタスクの進捗を更新できます。"}
              </span>
            </div>
            <div className="google-link-section">
              <h3 className="profile-section-title">ログイン方法</h3>
              <p>
                GoogleログインはSupabase
                Authで管理されています。役職・参加コンテスト・担当タスクは、このUKKワークスペースに保存されます。
              </p>
            </div>
            <div>
              <h3 className="profile-section-title">参加コンテスト・担当</h3>
              {data.participants
                .filter((p) => p.userId === data.viewerId)
                .map((p) => (
                  <div className="profile-contest-row" key={p.contestId}>
                    <strong>
                      {data.contests.find((c) => c.id === p.contestId)?.name}
                    </strong>
                    <span>
                      {p.duty || "担当未設定"}
                      {p.manages ? " · 管理担当" : ""}
                    </span>
                  </div>
                ))}
              {!data.participants.some((p) => p.userId === data.viewerId) && (
                <p className="muted">参加コンテストはまだありません。</p>
              )}
            </div>
            <footer className="modal-footer">
              {admin && (
                <button
                  className="btn secondary"
                  onClick={() => {
                    setProfileOpen(false);
                    navigate("members");
                  }}
                >
                  部員・役職の管理
                </button>
              )}
              <button
                className="btn primary"
                onClick={() => {
                  setProfileOpen(false);
                  navigate("my");
                }}
              >
                自分のタスク
              </button>
              <button
                className="text-btn"
                onClick={() => {
                  setProfileOpen(false);
                  logout();
                }}
              >
                ログアウト
              </button>
            </footer>
          </div>
        </Modal>
      )}
      {participantView && (
        <Modal
          title="参加メンバー・担当"
          description={participantView.name}
          onClose={() => setParticipantView(null)}
        >
          <div className="participants-list">
            {data.participants
              .filter((p) => p.contestId === participantView.id)
              .map((p) => (
                <div className="participant-row" key={p.userId}>
                  <span className="avatar small">
                    {data.members
                      .find((m) => m.userId === p.userId)
                      ?.displayName.slice(0, 1) || "–"}
                  </span>
                  <div className="grow">
                    <strong>
                      {
                        data.members.find((m) => m.userId === p.userId)
                          ?.displayName
                      }
                    </strong>
                    <small>
                      {p.duty || "担当未設定"}
                      {p.manages ? " · 管理担当" : ""}
                    </small>
                  </div>
                </div>
              ))}
            {!data.participants.some(
              (p) => p.contestId === participantView.id,
            ) && <p className="muted">参加メンバーはまだいません。</p>}
          </div>
        </Modal>
      )}
      {taskModal && manageable.length > 0 && (
        <TaskForm
          data={{ ...data, contests: manageable }}
          task={taskModal.task}
          contestId={taskModal.contestId}
          onClose={() => setTaskModal(null)}
        />
      )}
      {contestModal && admin && (
        <ContestForm
          contest={contestModal.contest}
          onClose={() => setContestModal(null)}
        />
      )}
      {memberModal && admin && (
        <MemberForm
          member={
            data.members.find((m) => m.userId === memberModal.userId) ||
            memberModal
          }
          onClose={() => setMemberModal(null)}
        />
      )}
      {participantModal && admin && (
        <ParticipantsForm
          data={data}
          contest={participantModal}
          onClose={() => setParticipantModal(null)}
        />
      )}
      {detail &&
        data.tasks.some((t) => t.id === detail.id) &&
        (() => {
          const t = data.tasks.find((t) => t.id === detail.id)!;
          const c = data.contests.find((c) => c.id === t.contestId);
          const person = data.members.find((m) => m.userId === t.assigneeId);
          return (
            <Modal
              title={t.title}
              description={c?.name}
              onClose={() => setDetail(null)}
            >
              <div className="task-detail">
                <div className="detail-meta">
                  <span className={`status-pill ${t.status}`}>
                    {statusLabels[t.status]}
                  </span>
                  <span className={`task-priority ${t.priority}`}>
                    <Flag size={14} />
                    優先度：{priorityLabels[t.priority]}
                  </span>
                </div>
                <p className="detail-description">
                  {t.description || "説明はまだありません。"}
                </p>
                <div className="detail-info">
                  <span>
                    担当者<strong>{person?.displayName || "未割り当て"}</strong>
                  </span>
                  <span>
                    締切
                    <strong className={isLate(t) ? "late" : ""}>
                      {t.dueDate || "締切なし"}
                    </strong>
                  </span>
                </div>
                {canUpdateTaskStatus(profile, t, data.participants) && (
                  <label className="field">
                    <span>進捗を更新</span>
                    <select
                      value={t.status}
                      disabled={statusMutation.isPending}
                      onChange={(e) =>
                        statusMutation.mutate({
                          id: t.id,
                          status: e.target.value as UTask["status"],
                        })
                      }
                    >
                      {Object.entries(statusLabels).map(([s, l]) => (
                        <option key={s} value={s}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {canManageContest(profile, t.contestId, data.participants) && (
                  <footer className="modal-footer">
                    <button
                      className="btn primary"
                      onClick={() => {
                        setDetail(null);
                        setTaskModal({ task: t });
                      }}
                    >
                      タスクを編集
                    </button>
                  </footer>
                )}
              </div>
            </Modal>
          );
        })()}
    </div>
  );
}
