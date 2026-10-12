import { useState, type FormEvent, type ReactNode } from "react";
import { X, Plus, ShieldCheck, UserRound } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  roleLabels,
  memberStateLabels,
  type Overview,
  type UTask,
  type UContest,
  type UMember,
} from "@/lib/ukk";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function Modal({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="ukk-dialog" showCloseButton={false}>
        <header className="modal-heading">
          <div>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {description || "必要な情報を入力して保存してください。"}
            </DialogDescription>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="閉じる">
            <X size={20} />
          </button>
        </header>
        {children}
      </DialogContent>
    </Dialog>
  );
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function TaskForm({
  data,
  task,
  contestId,
  onClose,
}: {
  data: Overview;
  task?: UTask;
  contestId?: number;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    contestId: task?.contestId || contestId || data.contests[0]?.id || 0,
    title: task?.title || "",
    description: task?.description || "",
    assigneeId: task?.assigneeId?.toString() || "",
    dueDate: task?.dueDate || "",
    priority: task?.priority || "medium",
    status: task?.status || "todo",
  });
  const utils = trpc.useUtils();
  const success = () => {
    utils.ukk.overview.invalidate();
    toast.success(task ? "タスクを更新しました" : "タスクを追加しました");
    onClose();
  };
  const create = trpc.ukk.createTask.useMutation({
    onSuccess: success,
    onError: e => toast.error(e.message),
  });
  const update = trpc.ukk.updateTask.useMutation({
    onSuccess: success,
    onError: e => toast.error(e.message),
  });
  const people = data.members.filter(
    m =>
      m.state === "active" &&
      data.participants.some(
        p => p.contestId === form.contestId && p.userId === m.userId
      )
  );
  function submit(e: FormEvent) {
    e.preventDefault();
    const fields = {
      ...form,
      assigneeId: form.assigneeId ? Number(form.assigneeId) : null,
      dueDate: form.dueDate || null,
    };
    if (task) update.mutate({ ...fields, id: task.id });
    else create.mutate(fields);
  }
  return (
    <Modal
      title={task ? "タスクを編集" : "新しいタスク"}
      description="やることを明確にして、チームの一歩につなげよう。"
      onClose={onClose}
    >
      <form onSubmit={submit} className="form-stack">
        <Field label="コンテスト">
          <select
            value={form.contestId}
            disabled={!!task}
            onChange={e =>
              setForm({
                ...form,
                contestId: Number(e.target.value),
                assigneeId: "",
              })
            }
          >
            {data.contests.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="タスク名 *">
          <input
            required
            maxLength={150}
            autoFocus
            placeholder="例：プレゼン資料の構成を考える"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
          />
        </Field>
        <Field label="説明">
          <textarea
            rows={3}
            maxLength={5000}
            placeholder="目標や作業の内容を記入"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />
        </Field>
        <div className="form-row">
          <Field label="担当者">
            <select
              value={form.assigneeId}
              onChange={e => setForm({ ...form, assigneeId: e.target.value })}
            >
              <option value="">未割り当て</option>
              {people.map(m => (
                <option key={m.userId} value={m.userId}>
                  {m.displayName}
                </option>
              ))}
            </select>
          </Field>
          <Field label="締切">
            <input
              type="date"
              value={form.dueDate}
              onChange={e => setForm({ ...form, dueDate: e.target.value })}
            />
          </Field>
        </div>
        <div className="form-row">
          <Field label="優先度">
            <select
              value={form.priority}
              onChange={e =>
                setForm({
                  ...form,
                  priority: e.target.value as typeof form.priority,
                })
              }
            >
              <option value="low">低</option>
              <option value="medium">通常</option>
              <option value="high">高</option>
            </select>
          </Field>
          <Field label="進捗">
            <select
              value={form.status}
              onChange={e =>
                setForm({
                  ...form,
                  status: e.target.value as typeof form.status,
                })
              }
            >
              <option value="todo">未着手</option>
              <option value="doing">進行中</option>
              <option value="done">完了</option>
            </select>
          </Field>
        </div>
        <footer className="modal-footer">
          <button type="button" className="btn secondary" onClick={onClose}>
            キャンセル
          </button>
          <button
            className="btn primary"
            disabled={create.isPending || update.isPending || !form.contestId}
          >
            保存する
          </button>
        </footer>
      </form>
    </Modal>
  );
}
export function ContestForm({
  contest,
  onClose,
}: {
  contest?: UContest;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: contest?.name || "",
    description: contest?.description || "",
    deadline: contest?.deadline || "",
    color: contest?.color || "green",
    status: contest?.status || "active",
  });
  const utils = trpc.useUtils();
  const success = () => {
    utils.ukk.overview.invalidate();
    toast.success("コンテストを保存しました");
    onClose();
  };
  const create = trpc.ukk.createContest.useMutation({
    onSuccess: success,
    onError: e => toast.error(e.message),
  });
  const update = trpc.ukk.updateContest.useMutation({
    onSuccess: success,
    onError: e => toast.error(e.message),
  });
  function submit(e: FormEvent) {
    e.preventDefault();
    const fields = {
      ...form,
      deadline: form.deadline || null,
      color: form.color as "green" | "blue" | "orange" | "purple",
    };
    if (contest) update.mutate({ ...fields, id: contest.id });
    else create.mutate(fields);
  }
  return (
    <Modal
      title={contest ? "コンテストを編集" : "コンテストを作成"}
      onClose={onClose}
    >
      <form className="form-stack" onSubmit={submit}>
        <Field label="コンテスト名 *">
          <input
            required
            autoFocus
            maxLength={100}
            placeholder="例：秋のプログラミングコンテスト"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        <Field label="概要">
          <textarea
            rows={3}
            maxLength={5000}
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />
        </Field>
        <div className="form-row">
          <Field label="締切・開催日">
            <input
              type="date"
              value={form.deadline}
              onChange={e => setForm({ ...form, deadline: e.target.value })}
            />
          </Field>
          <Field label="状態">
            <select
              value={form.status}
              onChange={e =>
                setForm({
                  ...form,
                  status: e.target.value as typeof form.status,
                })
              }
            >
              <option value="active">活動中</option>
              <option value="completed">終了</option>
            </select>
          </Field>
        </div>
        <Field label="テーマカラー">
          <div className="color-options">
            {["green", "blue", "orange", "purple"].map(color => (
              <button
                type="button"
                key={color}
                aria-label={color}
                onClick={() => setForm({ ...form, color })}
                className={`color-swatch ${color} ${form.color === color ? "selected" : ""}`}
              />
            ))}
          </div>
        </Field>
        <footer className="modal-footer">
          <button type="button" className="btn secondary" onClick={onClose}>
            キャンセル
          </button>
          <button
            className="btn primary"
            disabled={create.isPending || update.isPending}
          >
            保存する
          </button>
        </footer>
      </form>
    </Modal>
  );
}
export function MemberForm({
  member,
  onClose,
}: {
  member: UMember;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    displayName: member.displayName,
    role: member.role,
    state: member.state,
  });
  const utils = trpc.useUtils();
  const update = trpc.ukk.updateMember.useMutation({
    onSuccess: () => {
      utils.ukk.invalidate();
      toast.success("メンバー設定を更新しました");
      onClose();
    },
    onError: e => toast.error(e.message),
  });
  return (
    <Modal
      title="メンバーの権限設定"
      description="操作権限の変更は、閲覧・編集できる範囲に反映されます。"
      onClose={onClose}
    >
      <form
        className="form-stack"
        onSubmit={e => {
          e.preventDefault();
          update.mutate({ ...form, userId: member.userId });
        }}
      >
        <Field label="表示名">
          <input
            required
            maxLength={80}
            value={form.displayName}
            onChange={e => setForm({ ...form, displayName: e.target.value })}
          />
        </Field>
        <Field label="操作権限">
          <select
            value={form.role}
            onChange={e =>
              setForm({ ...form, role: e.target.value as typeof form.role })
            }
          >
            {Object.entries(roleLabels).map(([r, label]) => (
              <option key={r} value={r}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="利用状態">
          <select
            value={form.state}
            onChange={e =>
              setForm({ ...form, state: e.target.value as typeof form.state })
            }
          >
            {Object.entries(memberStateLabels).map(([r, label]) => (
              <option key={r} value={r}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <div className="info-note">
          <ShieldCheck size={19} />
          <span>
            部員は参加コンテストのみ閲覧可能。コンテストリーダーには、各コンテストの参加設定で「管理担当」も指定してください。
          </span>
        </div>
        <footer className="modal-footer">
          <button type="button" className="btn secondary" onClick={onClose}>
            キャンセル
          </button>
          <button className="btn primary" disabled={update.isPending}>
            変更を保存
          </button>
        </footer>
      </form>
    </Modal>
  );
}
export function ParticipantsForm({
  contest,
  data,
  onClose,
}: {
  contest: UContest;
  data: Overview;
  onClose: () => void;
}) {
  const [userId, setUserId] = useState("");
  const [duty, setDuty] = useState("");
  const [manages, setManages] = useState(false);
  const utils = trpc.useUtils();
  const add = trpc.ukk.setParticipation.useMutation({
    onSuccess: () => {
      utils.ukk.overview.invalidate();
      setUserId("");
      setDuty("");
      setManages(false);
      toast.success("参加設定を保存しました");
    },
    onError: e => toast.error(e.message),
  });
  const remove = trpc.ukk.removeParticipation.useMutation({
    onSuccess: () => {
      utils.ukk.overview.invalidate();
      toast.success("参加を解除しました");
    },
    onError: e => toast.error(e.message),
  });
  const participants = data.participants.filter(
    p => p.contestId === contest.id
  );
  const selected = data.members.find(m => m.userId === Number(userId));
  return (
    <Modal
      title="参加メンバー・担当ロール"
      description={contest.name}
      onClose={onClose}
    >
      <div className="participants-list">
        {participants.map(p => (
          <div className="participant-row" key={p.userId}>
            <span className="avatar small">
              <UserRound size={16} />
            </span>
            <div className="grow">
              <strong>
                {data.members.find(m => m.userId === p.userId)?.displayName}
              </strong>
              <small>
                {p.duty || "担当未設定"}
                {p.manages ? " · 管理担当" : ""}
              </small>
            </div>
            <button
              className="text-btn"
              onClick={() => {
                setUserId(String(p.userId));
                setDuty(p.duty);
                setManages(p.manages);
              }}
            >
              編集
            </button>
            <button
              className="icon-btn danger"
              aria-label="参加を解除"
              disabled={remove.isPending}
              onClick={() => {
                if (
                  window.confirm(
                    "参加を解除すると、このメンバーの担当タスクは未割り当てになります。解除しますか？"
                  )
                )
                  remove.mutate({ contestId: contest.id, userId: p.userId });
              }}
            >
              <X size={16} />
            </button>
          </div>
        ))}
        {!participants.length && (
          <p className="muted">参加メンバーはまだいません。</p>
        )}
      </div>
      <form
        className="form-stack separated"
        onSubmit={e => {
          e.preventDefault();
          add.mutate({
            contestId: contest.id,
            userId: Number(userId),
            duty,
            manages,
          });
        }}
      >
        <Field label="メンバーを追加・変更">
          <select
            required
            value={userId}
            onChange={e => {
              const p = participants.find(
                p => p.userId === Number(e.target.value)
              );
              setUserId(e.target.value);
              setDuty(p?.duty || "");
              setManages(p?.manages || false);
            }}
          >
            <option value="">メンバーを選択</option>
            {data.members
              .filter(m => m.state === "active")
              .map(m => (
                <option key={m.userId} value={m.userId}>
                  {m.displayName} · {roleLabels[m.role]}
                </option>
              ))}
          </select>
        </Field>
        <Field label="担当ロール（コンテストごと）">
          <input
            maxLength={60}
            placeholder="開発、デザイン、発表など"
            value={duty}
            onChange={e => setDuty(e.target.value)}
          />
        </Field>
        {selected && selected.role !== "member" && (
          <label className="check-field">
            <input
              type="checkbox"
              checked={manages}
              onChange={e => setManages(e.target.checked)}
            />
            このコンテストの管理担当にする
          </label>
        )}
        <button className="btn primary" disabled={!userId || add.isPending}>
          <Plus size={16} />
          参加設定を保存
        </button>
      </form>
    </Modal>
  );
}
