import { useState, useEffect, useRef } from "react";
import {
  Home,
  FolderOpen,
  CreditCard,
  BookOpen,
  Users,
  Gamepad2,
  User,
  Settings,
  LogOut as LogOutIcon,
  Bell,
  Trophy,
  Star,
  ChevronRight,
  Play,
  Flame,
  ClipboardList,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  AlertCircle,
} from "lucide-react";
import Flashcard from "./dashboard/Flashcard";
import Reviewer from "./dashboard/Reviewer";
import MyGames from "./dashboard/MyGames";
import Profile from "./dashboard/Profile";
import SettingsPage from "./dashboard/Settings";
import LogoutPage from "./dashboard/Logout";
import FolderPage from "./dashboard/Folder";
import GroupsPage from "./dashboard/Groups";
import StreakCalendar, {
  updateStreakOnLogin,
} from "./dashboard/Streakcalendar";
import {
  supabase,
  getCurrentUser,
  updateUserStatus,
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  subscribeToNotifications,
} from "../lib/supabase";
import { createContext } from "react";

const ThemeCtx = createContext<boolean>(false);

type MenuKey =
  | "home"
  | "folder"
  | "flashcard"
  | "reviewer"
  | "groups"
  | "mygames"
  | "profile"
  | "settings"
  | "streak"
  | "subscription"
  | "todo"
  | "logout";

// ── Animated grid background ──────────────────────────────────────────────────
function DashBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf: number;
    function resize() {
      canvas!.width = canvas!.offsetWidth;
      canvas!.height = canvas!.offsetHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    const COLS = [
      "#7c3aed",
      "#a855f7",
      "#38bdf8",
      "#f472b6",
      "#4ade80",
      "#facc15",
    ];
    type Dot = {
      x: number;
      y: number;
      phase: number;
      speed: number;
      color: string;
      size: number;
    };
    const dots: Dot[] = Array.from({ length: 60 }, () => ({
      x: Math.random() * (canvas?.offsetWidth || 1200),
      y: Math.random() * (canvas?.offsetHeight || 800),
      phase: Math.random() * Math.PI * 2,
      speed: 0.008 + Math.random() * 0.015,
      color: COLS[Math.floor(Math.random() * COLS.length)],
      size: Math.random() < 0.6 ? 2 : 3,
    }));

    let t = 0;
    function draw() {
      const w = canvas!.width,
        h = canvas!.height;
      ctx.clearRect(0, 0, w, h);
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, "#0d0520");
      bg.addColorStop(0.5, "#0a0f28");
      bg.addColorStop(1, "#080318");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      ctx.globalAlpha = 0.03;
      ctx.strokeStyle = "#6d28d9";
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 36) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 36) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      t += 0.012;
      dots.forEach((d) => {
        d.phase += d.speed;
        const a = 0.15 + 0.5 * Math.abs(Math.sin(d.phase));
        ctx.globalAlpha = a;
        ctx.fillStyle = d.color;
        ctx.shadowColor = d.color;
        ctx.shadowBlur = d.size * 2;
        ctx.fillRect(d.x, d.y, d.size, d.size);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      });
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}

// ── Home / Dashboard content ───────────────────────────────────────────────────
function HomeContent({
  username,
  onNavigate,
  lightMode = false,
}: {
  username: string;
  onNavigate: (k: MenuKey) => void;
  lightMode?: boolean;
}) {
  const [gameCount, setGameCount] = useState<number | null>(null);
  const [recentGames, setRecentGames] = useState<any[]>([]);
  const [streakDays, setStreakDays] = useState(0);
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "GOOD MORNING" : hour < 18 ? "GOOD AFTERNOON" : "GOOD EVENING";

  useEffect(() => {
    async function load() {
      const user = await getCurrentUser();
      if (!user) return;
      const { count } = await supabase
        .from("games")
        .select("id", { count: "exact", head: true })
        .eq("creator_id", user.id);
      setGameCount(count ?? 0);
      const { data: streakData } = await supabase
        .from("users")
        .select("streak_days")
        .eq("id", user.id)
        .single();
      setStreakDays(streakData?.streak_days || 0);
      const { data } = await supabase
        .from("games")
        .select("id, title, is_multiplayer, is_public")
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);
      setRecentGames(data ?? []);
    }
    load();
  }, []);

  const quickActions = [
    {
      key: "mygames" as MenuKey,
      label: "MY GAMES",
      icon: Gamepad2,
      color: "#fffff",
      bg: "#2d0f5a",
      border: "#7c3aed",
      desc: "Create & play",
    },
    {
      key: "flashcard" as MenuKey,
      label: "FLASHCARDS",
      icon: CreditCard,
      color: "#38bdf8",
      bg: "#0c2a3a",
      border: "#0e7490",
      desc: "Study cards",
    },
    {
      key: "reviewer" as MenuKey,
      label: "REVIEWER",
      icon: BookOpen,
      color: "#4ade80",
      bg: "#052e16",
      border: "#15803d",
      desc: "Review notes",
    },
    {
      key: "groups" as MenuKey,
      label: "GROUPS",
      icon: Users,
      color: "#f472b6",
      bg: "#3b0a2a",
      border: "#9d174d",
      desc: "Study together",
    },
    {
      key: "folder" as MenuKey,
      label: "FILES",
      icon: FolderOpen,
      color: "#facc15",
      bg: "#1c1408",
      border: "#a16207",
      desc: "Your files",
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Greeting banner */}
      <div
        className="pixel-box border-2 p-5 relative overflow-hidden"
        style={{
          background: lightMode
            ? "#ffffff"
            : "linear-gradient(135deg,#1e0a40,#0d1a3a)",
          borderColor: lightMode ? "#e2e8f0" : "#7c3aed",
          boxShadow: lightMode
            ? "4px 4px 0 #e2e8f0"
            : "0 0 24px rgba(124,58,237,0.2), 4px 4px 0 #2d1060",
        }}
      >
        <div
          className="absolute top-2 right-3 w-2 h-2"
          style={{ background: "#a855f7" }}
        />
        <div
          className="absolute bottom-2 left-3 w-2 h-2"
          style={{ background: "#38bdf8" }}
        />
        <div
          className="pixel-font text-[8px] mb-1"
          style={{ color: lightMode ? "#9ca3af" : "#4c1d95" }}
        >
          {greeting}
        </div>
        <div
          className="pixel-font text-base sm:text-lg"
          style={{
            color: lightMode ? "#1e0a40" : "#fffff",
            textShadow: lightMode ? "none" : "0 0 16px rgba(192,132,252,0.4)",
          }}
        >
          {username.toUpperCase()} ✦
        </div>
        <div
          className="pixel-font text-[8px] mt-2"
          style={{ color: lightMode ? "#9ca3af" : "#3b1d6a" }}
        >
          READY TO LEARN TODAY?
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "GAMES",
            value: gameCount ?? "—",
            icon: Gamepad2,
            color: "#fffff",
          },
          {
            label: "STREAK",
            value: `🔥 ${streakDays}`,
            icon: Flame,
            color: "#f97316",
            onClick: () => onNavigate("streak"),
          },
          { label: "RANK", value: "#—", icon: Trophy, color: "#38bdf8" },
        ].map(({ label, value, icon: Icon, color, onClick }: any) => (
          <div
            key={label}
            onClick={onClick}
            className="pixel-box border-2 p-3 text-center"
            style={{
              background: lightMode ? "#ffffff" : "#0d0520",
              borderColor: lightMode ? "#e2e8f0" : "#2d1060",
              boxShadow: lightMode
                ? "3px 3px 0 #e2e8f0"
                : `0 0 8px rgba(0,0,0,0.5), 3px 3px 0 #1a0a35`,
              cursor: onClick ? "pointer" : "default",
            }}
          >
            <Icon size={14} style={{ color, margin: "0 auto 6px" }} />
            <div className="pixel-font text-[14px]" style={{ color }}>
              {value}
            </div>
            <div
              className="pixel-font text-[7px] mt-1"
              style={{ color: lightMode ? "#9ca3af" : "#3b1d6a" }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Streak compact widget ── */}
      <div
        onClick={() => onNavigate("streak")}
        style={{ cursor: "pointer" }}
        title="View full streak calendar"
      >
        <StreakCalendar compact />
      </div>

      {/* Quick actions */}
      <div>
        <div
          className="pixel-font text-[8px] mb-3 flex items-center gap-2"
          style={{ color: lightMode ? "#9ca3af" : "#4c1d95" }}
        >
          <Star size={10} style={{ color: "#a855f7" }} /> QUICK ACCESS
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {quickActions.map(
            ({ key, label, icon: Icon, color, bg, border, desc }) => (
              <button
                key={key}
                onClick={() => onNavigate(key)}
                className="pixel-box border-2 p-3 text-left transition-all hover:brightness-125 active:translate-y-px group"
                style={{
                  background: lightMode ? "#ffffff" : bg,
                  borderColor: border,
                  boxShadow: lightMode
                    ? `3px 3px 0 ${border}44`
                    : "3px 3px 0 rgba(0,0,0,0.5)",
                }}
              >
                <Icon size={16} style={{ color, marginBottom: 8 }} />
                <div className="pixel-font text-[9px]" style={{ color }}>
                  {label}
                </div>
                <div
                  className="pixel-font text-[7px] mt-1"
                  style={{ color: lightMode ? "#9ca3af" : "#4c1d95" }}
                >
                  {desc}
                </div>
                <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play size={8} style={{ color }} />
                  <span className="pixel-font text-[7px]" style={{ color }}>
                    OPEN
                  </span>
                </div>
              </button>
            ),
          )}
        </div>
      </div>

      {/* Recent games */}
      {recentGames.length > 0 && (
        <div>
          <div
            className="pixel-font text-[8px] mb-3 flex items-center gap-2"
            style={{ color: lightMode ? "#9ca3af" : "#4c1d95" }}
          >
            <Gamepad2 size={10} style={{ color: "#a855f7" }} /> MY RECENT GAMES
          </div>
          <div className="space-y-2">
            {recentGames.map((game) => (
              <div
                key={game.id}
                className="pixel-box border-2 px-3 py-2 flex items-center gap-3"
                style={{
                  background: lightMode ? "#ffffff" : "#0d0520",
                  borderColor: lightMode ? "#e2e8f0" : "#2d1060",
                }}
              >
                <Gamepad2
                  size={12}
                  style={{ color: lightMode ? "#7c3aed" : "#7c3aed" }}
                />
                <span
                  className="pixel-font text-[9px] flex-1 truncate"
                  style={{ color: lightMode ? "#374151" : "#c4b5fd" }}
                >
                  {game.title}
                </span>
                <span
                  className="pixel-font text-[7px] px-2 py-1 pixel-box border"
                  style={{
                    color: game.is_multiplayer
                      ? "#38bdf8"
                      : lightMode
                        ? "#374151"
                        : "#6b21a8",
                    borderColor: game.is_multiplayer
                      ? "#0e7490"
                      : lightMode
                        ? "#e2e8f0"
                        : "#3b1d6a",
                    background: game.is_multiplayer
                      ? "#0c2a3a"
                      : lightMode
                        ? "#f8fafc"
                        : "#1a0a35",
                  }}
                >
                  {game.is_multiplayer ? "MULTI" : "SOLO"}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={() => onNavigate("mygames")}
            className="pixel-font text-[8px] mt-2 flex items-center gap-1 hover:brightness-125 transition-colors"
            style={{ color: lightMode ? "#9ca3af" : "#4c1d95" }}
          >
            SEE ALL <ChevronRight size={10} />
          </button>
        </div>
      )}

      {/* Subscription banner */}
      <div
        className="pixel-box border-2 p-4 relative overflow-hidden"
        style={{
          background: lightMode
            ? "linear-gradient(135deg,#fdf4ff,#eff6ff)"
            : "linear-gradient(135deg,#1e0a40,#0a1a3a)",
          borderColor: "#a855f7",
          boxShadow: lightMode
            ? "4px 4px 0 #e9d5ff"
            : "0 0 20px rgba(168,85,247,0.2), 4px 4px 0 #2d1060",
        }}
      >
        <div
          className="absolute top-2 right-2 pixel-font text-[7px] px-2 py-0.5 pixel-box border"
          style={{
            background: "#7c3aed",
            borderColor: "#a855f7",
            color: "#e9d5ff",
          }}
        >
          ★ UPGRADE
        </div>
        <div
          className="pixel-font text-[8px] mb-1"
          style={{ color: lightMode ? "#9ca3af" : "#6b21a8" }}
        >
          CURRENT PLAN
        </div>
        <div
          className="pixel-font text-sm mb-1"
          style={{ color: lightMode ? "#1e0a40" : "#e9d5ff" }}
        >
          FREE PLAN
        </div>
        <div
          className="pixel-font text-[8px] mb-3"
          style={{ color: lightMode ? "#6b7280" : "#4c1d95" }}
        >
          3 games/day · Basic flashcards
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => onNavigate("subscription")}
            className="btn-press pixel-box border-2 px-3 py-2 pixel-font text-[8px] transition-all hover:brightness-125"
            style={{
              background: "#7c3aed",
              borderColor: "#a855f7",
              color: "#ffffff",
              boxShadow: "3px 3px 0 #2d1060",
            }}
          >
            ⚡ CLUTCH PASS — ₱99.99/wk
          </button>
          <button
            onClick={() => onNavigate("subscription")}
            className="btn-press pixel-box border-2 px-3 py-2 pixel-font text-[8px] transition-all hover:brightness-125"
            style={{
              background: lightMode ? "#ffffff" : "#0d0520",
              borderColor: "#38bdf8",
              color: "#38bdf8",
              boxShadow: "3px 3px 0 #0e7490",
            }}
          >
            👑 PREMIUM — ₱129.99/mo
          </button>
        </div>
      </div>

      {/* Announcements */}
      <div>
        <div
          className="pixel-font text-[8px] mb-3 flex items-center gap-2"
          style={{ color: lightMode ? "#9ca3af" : "#4c1d95" }}
        >
          <Bell size={10} style={{ color: "#f472b6" }} /> ANNOUNCEMENTS
        </div>
        <div className="space-y-2">
          {[
            {
              icon: "🆕",
              text: "NEW FEATURE – Try the latest game mode!",
              color: "#a855f7",
            },
            {
              icon: "📅",
              text: "CHECK SCHEDULE – Upcoming quizzes.",
              color: "#38bdf8",
            },
            {
              icon: "🏆",
              text: "LEADERBOARD – Compete with classmates.",
              color: "#facc15",
            },
          ].map(({ icon, text, color }) => (
            <div
              key={text}
              className="pixel-box border-2 px-3 py-2 flex items-start gap-2"
              style={{
                background: lightMode ? "#ffffff" : "#0d0520",
                borderColor: lightMode ? "#e2e8f0" : "#2d1060",
              }}
            >
              <span>{icon}</span>
              <span className="pixel-font text-[8px]" style={{ color }}>
                {text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── To-do List Page ────────────────────────────────────────────────────────────
type TodoItem = {
  id: string;
  text: string;
  dueDate: string;
  done: boolean;
  createdAt: string;
};

function TodoPage({ lightMode = false }: { lightMode?: boolean }) {
  const [todos, setTodos] = useState<TodoItem[]>(() => {
    try {
      const saved = localStorage.getItem("tt_todos");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [newText, setNewText] = useState("");
  const [newDue, setNewDue] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  function save(updated: TodoItem[]) {
    setTodos(updated);
    try {
      localStorage.setItem("tt_todos", JSON.stringify(updated));
    } catch {}
  }

  function addTodo() {
    if (!newText.trim()) return;
    const item: TodoItem = {
      id: Date.now().toString(),
      text: newText.trim(),
      dueDate: newDue,
      done: false,
      createdAt: new Date().toISOString(),
    };
    save([item, ...todos]);
    setNewText("");
    setNewDue("");
    setShowAdd(false);
  }

  function toggleDone(id: string) {
    save(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function deleteTodo(id: string) {
    save(todos.filter((t) => t.id !== id));
  }

  function getStatus(
    todo: TodoItem,
  ): "done" | "overdue" | "upcoming" | "nodate" {
    if (todo.done) return "done";
    if (!todo.dueDate) return "nodate";
    const due = new Date(todo.dueDate);
    due.setHours(23, 59, 59);
    return due < new Date() ? "overdue" : "upcoming";
  }

  function formatDue(dueDate: string) {
    if (!dueDate) return "";
    const due = new Date(dueDate);
    return due.toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function daysLabel(dueDate: string, done: boolean) {
    if (done || !dueDate) return null;
    const due = new Date(dueDate);
    due.setHours(23, 59, 59);
    const diff = Math.round((due.getTime() - Date.now()) / 86400000);
    if (diff < 0)
      return `${Math.abs(diff)} day${Math.abs(diff) !== 1 ? "s" : ""} late`;
    if (diff === 0) return "due today";
    return `in ${diff} day${diff !== 1 ? "s" : ""}`;
  }

  const overdue = todos.filter((t) => getStatus(t) === "overdue");
  const upcoming = todos.filter(
    (t) => getStatus(t) === "upcoming" || getStatus(t) === "nodate",
  );
  const done = todos.filter((t) => getStatus(t) === "done");

  const statusStyle = {
    done: {
      border: "#15803d",
      bg: lightMode ? "#f0fdf4" : "#052e16",
      badge: { bg: "#16a34a", color: "#bbf7d0" },
      text: lightMode ? "#14532d" : "#86efac",
      sub: "#15803d",
    },
    overdue: {
      border: "#b91c1c",
      bg: lightMode ? "#fff1f2" : "#450a0a",
      badge: { bg: "#dc2626", color: "#fecaca" },
      text: lightMode ? "#7f1d1d" : "#fca5a5",
      sub: "#b91c1c",
    },
    upcoming: {
      border: lightMode ? "#e2e8f0" : "#2d1060",
      bg: lightMode ? "#ffffff" : "#0d0520",
      badge: { bg: "#1e1b4b", color: "#a5b4fc" },
      text: lightMode ? "#1e0a40" : "#c4b5fd",
      sub: lightMode ? "#9ca3af" : "#4c1d95",
    },
    nodate: {
      border: lightMode ? "#e2e8f0" : "#2d1060",
      bg: lightMode ? "#ffffff" : "#0d0520",
      badge: { bg: "#1e1b4b", color: "#a5b4fc" },
      text: lightMode ? "#1e0a40" : "#c4b5fd",
      sub: lightMode ? "#9ca3af" : "#4c1d95",
    },
  };

  function TodoCard({ todo }: { todo: TodoItem }) {
    const s = getStatus(todo);
    const st = statusStyle[s];
    const days = daysLabel(todo.dueDate, todo.done);
    const outlineColor =
      s === "overdue"
        ? "#dc2626"
        : s === "done"
          ? "#16a34a"
          : s === "upcoming"
            ? "#7c3aed"
            : "#334155";
    const stripColor =
      s === "overdue" ? "#dc2626" : s === "done" ? "#16a34a" : "transparent";
    return (
      <div
        className="pixel-box flex items-stretch overflow-hidden"
        style={{ outline: `2px solid ${outlineColor}` }}
      >
        {/* Color strip on left */}
        <div style={{ width: 5, flexShrink: 0, background: stripColor }} />
        <div
          className="flex items-center gap-3 px-3 py-2 flex-1 min-w-0"
          style={{ background: st.bg }}
        >
          <button
            onClick={() => toggleDone(todo.id)}
            className="shrink-0 transition-all hover:scale-110"
            style={{
              color:
                s === "done"
                  ? "#4ade80"
                  : s === "overdue"
                    ? "#f87171"
                    : "#a855f7",
            }}
          >
            {todo.done ? <CheckSquare size={16} /> : <Square size={16} />}
          </button>
          <div className="flex-1 min-w-0">
            <div
              className="pixel-font text-[9px] truncate"
              style={{
                color: st.text,
                textDecoration: todo.done ? "line-through" : "none",
                opacity: todo.done ? 0.6 : 1,
              }}
            >
              {todo.text}
            </div>
            {todo.dueDate && (
              <div
                className="pixel-font text-[7px] mt-0.5 flex items-center gap-1"
                style={{ color: st.sub }}
              >
                {s === "overdue" && <AlertCircle size={8} />}
                Due {formatDue(todo.dueDate)}
                {days ? ` · ${days}` : ""}
              </div>
            )}
          </div>
          <div
            className="pixel-font text-[7px] px-2 py-0.5 pixel-box border shrink-0"
            style={{
              background: st.badge.bg,
              borderColor: outlineColor,
              color: st.badge.color,
            }}
          >
            {s === "done"
              ? "DONE"
              : s === "overdue"
                ? "LATE"
                : s === "upcoming" && todo.dueDate
                  ? "SOON"
                  : "—"}
          </div>
          <button
            onClick={() => deleteTodo(todo.id)}
            className="shrink-0 hover:opacity-100 opacity-40 transition-opacity"
            style={{ color: "#f87171" }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    );
  }

  function Section({
    label,
    items,
    accent,
  }: {
    label: string;
    items: TodoItem[];
    accent: string;
  }) {
    if (items.length === 0) return null;
    return (
      <div>
        <div
          className="pixel-font text-[8px] mb-2 flex items-center gap-2"
          style={{ color: accent }}
        >
          <span>▸</span> {label} ({items.length})
        </div>
        <div className="space-y-2">
          {items.map((t) => (
            <TodoCard key={t.id} todo={t} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 w-full">
      {/* Header bar */}
      <div
        className="pixel-box border-2 p-4 flex items-center justify-between"
        style={{
          background: lightMode
            ? "linear-gradient(135deg,#fdf4ff,#eff6ff)"
            : "linear-gradient(135deg,#1e0a40,#0a1a3a)",
          borderColor: "#7c3aed",
          boxShadow: "4px 4px 0 #2d1060",
        }}
      >
        <div>
          <div
            className="pixel-font text-[8px] mb-0.5"
            style={{ color: lightMode ? "#9ca3af" : "#6b21a8" }}
          >
            📋 TASK MANAGER
          </div>
          <div
            className="pixel-font text-sm"
            style={{ color: lightMode ? "#1e0a40" : "#e9d5ff" }}
          >
            TO-DO LIST
          </div>
          <div
            className="pixel-font text-[7px] mt-1"
            style={{ color: lightMode ? "#9ca3af" : "#4c1d95" }}
          >
            {todos.filter((t) => !t.done).length} pending · {done.length} done
          </div>
        </div>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="btn-press pixel-box border-2 px-3 py-2 pixel-font text-[8px] flex items-center gap-2 transition-all hover:brightness-125"
          style={{
            background: "#7c3aed",
            borderColor: "#a855f7",
            color: "#ffffff",
            boxShadow: "3px 3px 0 #2d1060",
          }}
        >
          <Plus size={12} /> ADD TASK
        </button>
      </div>

      {/* Add task form */}
      {showAdd && (
        <div
          className="pixel-box border-2 p-4 space-y-3"
          style={{
            background: lightMode ? "#ffffff" : "#0d0520",
            borderColor: "#7c3aed",
          }}
        >
          <div
            className="pixel-font text-[8px]"
            style={{ color: lightMode ? "#9ca3af" : "#4c1d95" }}
          >
            NEW TASK
          </div>
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTodo()}
            placeholder="TASK DESCRIPTION..."
            className="w-full px-3 py-2 pixel-box border-2 pixel-font text-[9px] focus:outline-none transition-colors"
            style={{
              background: lightMode ? "#f8fafc" : "#0a0520",
              borderColor: lightMode ? "#e2e8f0" : "#2d1060",
              color: lightMode ? "#1e0a40" : "#c4b5fd",
            }}
          />
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <div
                className="pixel-font text-[7px] mb-1"
                style={{ color: lightMode ? "#9ca3af" : "#4c1d95" }}
              >
                DUE DATE (optional)
              </div>
              <input
                type="date"
                value={newDue}
                onChange={(e) => setNewDue(e.target.value)}
                className="w-full px-3 py-2 pixel-box border-2 pixel-font text-[9px] focus:outline-none transition-colors"
                style={{
                  background: lightMode ? "#f8fafc" : "#0a0520",
                  borderColor: lightMode ? "#e2e8f0" : "#2d1060",
                  color: lightMode ? "#1e0a40" : "#c4b5fd",
                }}
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={addTodo}
                disabled={!newText.trim()}
                className="btn-press pixel-box border-2 px-3 py-2 pixel-font text-[8px] transition-all hover:brightness-125 disabled:opacity-40"
                style={{
                  background: "#15803d",
                  borderColor: "#4ade80",
                  color: "#ffffff",
                }}
              >
                SAVE
              </button>
              <button
                onClick={() => {
                  setShowAdd(false);
                  setNewText("");
                  setNewDue("");
                }}
                className="btn-press pixel-box border-2 px-3 py-2 pixel-font text-[8px] transition-all hover:brightness-125"
                style={{
                  background: lightMode ? "#ffffff" : "#0d0520",
                  borderColor: "#b91c1c",
                  color: "#f87171",
                }}
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {todos.length === 0 && (
        <div
          className="pixel-box border-2 p-8 text-center"
          style={{
            background: lightMode ? "#ffffff" : "#0d0520",
            borderColor: lightMode ? "#e2e8f0" : "#2d1060",
          }}
        >
          <ClipboardList
            size={28}
            style={{ color: "#4c1d95", margin: "0 auto 12px" }}
          />
          <div
            className="pixel-font text-[9px]"
            style={{ color: lightMode ? "#9ca3af" : "#4c1d95" }}
          >
            NO TASKS YET
          </div>
          <div
            className="pixel-font text-[7px] mt-2"
            style={{ color: lightMode ? "#d1d5db" : "#2d1060" }}
          >
            PRESS + ADD TASK TO GET STARTED
          </div>
        </div>
      )}

      <Section label="OVERDUE" items={overdue} accent="#f87171" />
      <Section
        label="UPCOMING"
        items={upcoming}
        accent={lightMode ? "#7c3aed" : "#a855f7"}
      />
      <Section label="COMPLETED" items={done} accent="#4ade80" />
    </div>
  );
}

// ── Subscription Page ──────────────────────────────────────────────────────────
function SubscriptionPage({ lightMode = false }: { lightMode?: boolean }) {
  const plans = [
    {
      key: "free",
      name: "FREE",
      price: "₱0",
      period: "forever",
      color: "#94a3b8",
      border: "#334155",
      bg: lightMode ? "#f8fafc" : "#0d0520",
      features: [
        "Free access to flashcards",
        "3 games per day",
        "Color hair (free styles)",
      ],
      cta: "CURRENT PLAN",
      disabled: true,
    },
    {
      key: "clutch",
      name: "CLUTCH PASS",
      price: "₱99.99",
      period: "per week",
      color: "#a855f7",
      border: "#7c3aed",
      bg: lightMode ? "#fdf4ff" : "#1e0a40",
      badge: "MOST POPULAR",
      features: ["Access to reviewers", "Unlimited games"],
      cta: "⚡ GET CLUTCH PASS",
      disabled: false,
    },
    {
      key: "premium",
      name: "PREMIUM",
      price: "₱129.99",
      period: "per month",
      color: "#38bdf8",
      border: "#0e7490",
      bg: lightMode ? "#f0f9ff" : "#0c2a3a",
      features: ["Full access to everything", "With accessories"],
      cta: "👑 GET PREMIUM",
      disabled: false,
    },
  ];

  return (
    <div className="space-y-6 w-full">
      <div
        className="pixel-box border-2 p-4"
        style={{
          background: lightMode
            ? "linear-gradient(135deg,#fdf4ff,#eff6ff)"
            : "linear-gradient(135deg,#1e0a40,#0a1a3a)",
          borderColor: "#7c3aed",
          boxShadow: "4px 4px 0 #2d1060",
        }}
      >
        <div
          className="pixel-font text-[8px] mb-1"
          style={{ color: lightMode ? "#9ca3af" : "#6b21a8" }}
        >
          💎 TINITHINK PLANS
        </div>
        <div
          className="pixel-font text-sm"
          style={{ color: lightMode ? "#1e0a40" : "#e9d5ff" }}
        >
          CHOOSE YOUR PLAN
        </div>
        <div
          className="pixel-font text-[8px] mt-1"
          style={{ color: lightMode ? "#6b7280" : "#4c1d95" }}
        >
          Upgrade anytime · Cancel anytime
        </div>
      </div>

      <div className="space-y-3">
        {plans.map((plan) => (
          <div
            key={plan.key}
            className="pixel-box border-2 p-4 relative overflow-hidden"
            style={{
              background: plan.bg,
              borderColor: plan.border,
              boxShadow: `3px 3px 0 ${plan.border}55`,
            }}
          >
            {plan.badge && (
              <div
                className="absolute top-3 right-3 pixel-font text-[7px] px-2 py-0.5 pixel-box border"
                style={{
                  background: "#7c3aed",
                  borderColor: "#a855f7",
                  color: "#e9d5ff",
                }}
              >
                {plan.badge}
              </div>
            )}
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div
                  className="pixel-font text-xs mb-0.5"
                  style={{ color: plan.color }}
                >
                  {plan.name}
                </div>
                <div
                  className="pixel-font text-lg"
                  style={{ color: lightMode ? "#1e0a40" : "#ffffff" }}
                >
                  {plan.price}
                  <span
                    className="text-[9px] ml-1"
                    style={{ color: lightMode ? "#9ca3af" : "#4c1d95" }}
                  >
                    {plan.period}
                  </span>
                </div>
                <div className="mt-2 space-y-1">
                  {plan.features.map((f) => (
                    <div
                      key={f}
                      className="pixel-font text-[8px] flex items-center gap-2"
                      style={{ color: lightMode ? "#374151" : "#c4b5fd" }}
                    >
                      <span style={{ color: plan.color }}>▸</span> {f}
                    </div>
                  ))}
                </div>
              </div>
              <button
                disabled={plan.disabled}
                className="btn-press pixel-box border-2 px-3 py-2 pixel-font text-[8px] self-center transition-all hover:brightness-125 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: plan.disabled
                    ? lightMode
                      ? "#f1f5f9"
                      : "#1a0a35"
                    : plan.border,
                  borderColor: plan.border,
                  color: plan.disabled
                    ? lightMode
                      ? "#9ca3af"
                      : "#4c1d95"
                    : "#ffffff",
                  whiteSpace: "nowrap",
                }}
              >
                {plan.cta}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div
        className="pixel-box border-2 p-3 text-center"
        style={{
          background: lightMode ? "#ffffff" : "#0d0520",
          borderColor: lightMode ? "#e2e8f0" : "#2d1060",
        }}
      >
        <div
          className="pixel-font text-[8px]"
          style={{ color: lightMode ? "#6b7280" : "#4c1d95" }}
        >
          🔒 SECURE PAYMENT · RENEW OR CANCEL ANYTIME FROM THIS PAGE
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [active, setActive] = useState<MenuKey>("home");
  const [username, setUsername] = useState("GUEST");
  const [userId, setUserId] = useState("");
  const [, setStatus] = useState("online");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("tt_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });
  const [lightMode, setLightMode] = useState(() => {
    try {
      return localStorage.getItem("tt_light_mode") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("tt_light_mode", String(lightMode));
    } catch {}
    document.body.classList.toggle("lm-active", lightMode);
  }, [lightMode]);

  useEffect(() => {
    try {
      localStorage.setItem("tt_sidebar_collapsed", String(sidebarCollapsed));
    } catch {}
  }, [sidebarCollapsed]);

  async function loadUser() {
    try {
      const user = await getCurrentUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("users")
        .select("username, status")
        .eq("id", user.id)
        .single();
      if (profile) {
        setUsername((profile.username || "GUEST").toUpperCase());
        setStatus(profile.status || "online");
        setUserId(user.id);
        await updateUserStatus(user.id, "online");
        await updateStreakOnLogin(user.id);
        loadNotifications(user.id);
        subscribeToNotifications(user.id, handleNewNotification);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function loadNotifications(uid: string) {
    try {
      const data = await getNotifications(uid);
      setNotifications(data || []);
      const count = await getUnreadNotificationCount(uid);
      setUnreadCount(count);
    } catch (e) {
      console.error(e);
    }
  }

  function handleNewNotification(payload: any) {
    if (payload.new) {
      setNotifications((p) => [payload.new, ...p]);
      setUnreadCount((p) => p + 1);
    }
  }

  async function handleNotificationClick(notif: any) {
    if (!notif.is_read) {
      await markNotificationAsRead(notif.id);
      setUnreadCount((p) => Math.max(0, p - 1));
      setNotifications((p) =>
        p.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n)),
      );
    }
  }

  async function handleMarkAllRead() {
    if (userId) {
      await markAllNotificationsAsRead(userId);
      setUnreadCount(0);
      setNotifications((p) => p.map((n) => ({ ...n, is_read: true })));
    }
  }

  function navigate(key: MenuKey) {
    setActive(key);
    setSidebarOpen(false);
  }

  const menuItems = [
    { key: "home" as MenuKey, label: "HOME", icon: Home, color: "#c084fc" },
    {
      key: "folder" as MenuKey,
      label: "FILES",
      icon: FolderOpen,
      color: "#facc15",
    },
    {
      key: "flashcard" as MenuKey,
      label: "FLASHCARD",
      icon: CreditCard,
      color: "#38bdf8",
    },
    {
      key: "reviewer" as MenuKey,
      label: "REVIEWER",
      icon: BookOpen,
      color: "#4ade80",
    },
    {
      key: "groups" as MenuKey,
      label: "GROUPS",
      icon: Users,
      color: "#f472b6",
    },
    {
      key: "mygames" as MenuKey,
      label: "GAMES",
      icon: Gamepad2,
      color: "#a855f7",
    },
    {
      key: "todo" as MenuKey,
      label: "TO-DO",
      icon: ClipboardList,
      color: "#fb923c",
    },
    {
      key: "subscription" as MenuKey,
      label: "PLANS",
      icon: Star,
      color: "#a855f7",
    },
    {
      key: "streak" as MenuKey,
      label: "STREAK",
      icon: Flame,
      color: "#f97316",
    },
    {
      key: "profile" as MenuKey,
      label: "PROFILE",
      icon: User,
      color: "#818cf8",
    },
    {
      key: "settings" as MenuKey,
      label: "SETTINGS",
      icon: Settings,
      color: "#94a3b8",
    },
  ];

  function renderContent() {
    switch (active) {
      case "home":
        return (
          <HomeContent
            username={username}
            onNavigate={navigate}
            lightMode={lightMode}
          />
        );
      case "folder":
        return <FolderPage />;
      case "flashcard":
        return <Flashcard />;
      case "reviewer":
        return <Reviewer />;
      case "groups":
        return <GroupsPage />;
      case "mygames":
        return <MyGames />;
      case "todo":
        return <TodoPage lightMode={lightMode} />;
      case "subscription":
        return <SubscriptionPage lightMode={lightMode} />;
      case "streak":
        return <StreakCalendar />;
      case "profile":
        return <Profile />;
      case "settings":
        return (
          <SettingsPage
            lightMode={lightMode}
            onToggleLightMode={() => setLightMode((v: boolean) => !v)}
          />
        );
      case "logout":
        return <LogoutPage />;
      default:
        return null;
    }
  }

  const activeItem = menuItems.find((m) => m.key === active);

  return (
    <div
      className={`min-h-screen flex flex-col relative overflow-hidden${lightMode ? " lm-root" : ""}`}
      style={{
        background: lightMode ? "#ffffff" : undefined,
        color: lightMode ? "#1e0a40" : "white",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .pixel-font { font-family: 'Press Start 2P', cursive; }
        .pixel-box { border-radius: 0; }
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.25s ease forwards; }
        @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        .slide-in { animation: slideIn 0.2s ease forwards; }
        @keyframes notifIn { from { opacity: 0; transform: translateY(-8px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .notif-in { animation: notifIn 0.2s ease forwards; }
        .menu-btn { transition: background 0.15s, border-color 0.15s, transform 0.08s; }
        .menu-btn:hover { filter: brightness(1.2); }
        .menu-btn:active { transform: translateX(2px); }
        /* Sidebar collapse */
        .sidebar-anim { transition: width 0.25s cubic-bezier(0.4,0,0.2,1); overflow: hidden; white-space: nowrap; }
        .sidebar-label { transition: opacity 0.15s ease, transform 0.2s ease; }
        .sidebar-collapsed .sidebar-label { opacity: 0; transform: translateX(-8px); pointer-events: none; }
        .sidebar-expanded .sidebar-label { opacity: 1; transform: translateX(0); }
        .bar-top { transition: transform 0.25s ease; }
        .bar-mid { transition: opacity 0.15s ease; }
        .bar-bot { transition: transform 0.25s ease; }
        .collapsed .bar-top { transform: rotate(45deg) translate(3px, 3px); }
        .collapsed .bar-mid { opacity: 0; }
        .collapsed .bar-bot { transform: rotate(-45deg) translate(3px, -3px); }
        /* Light mode global override */
        .lm-root { background: #ffffff !important; color: #000000 !important; }
        .lm-root *:not(.bar-top):not(.bar-mid):not(.bar-bot) { background-color: #ffffff !important; color: #000000 !important; border-color: #d1d5db !important; box-shadow: none !important; text-shadow: none !important; filter: none !important; }
        .lm-root svg { color: #000000 !important; }
        .lm-root canvas, .lm-root .scan-line { display: none !important; }
        .lm-root input, .lm-root textarea, .lm-root select { background: #ffffff !important; color: #000000 !important; border: 1px solid #d1d5db !important; }
        .lm-root input::placeholder, .lm-root textarea::placeholder { color: #9ca3af !important; }
        .lm-root button { background: #ffffff !important; color: #000000 !important; border-color: #d1d5db !important; }
        .lm-root button:hover { background: #f3f4f6 !important; }
        .lm-root .modal-box { box-shadow: 0 4px 24px rgba(0,0,0,0.12) !important; border-color: #d1d5db !important; }
        .lm-root .toggle-track, .lm-root .toggle-track * { background-color: unset !important; border-color: unset !important; }
        .lm-root *::-webkit-scrollbar { background: #f3f4f6; }
        .lm-root *::-webkit-scrollbar-thumb { background: #d1d5db; }
      `}</style>

      <DashBg />
      {lightMode && (
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "#ffffff",
              zIndex: 0,
              pointerEvents: "none",
            }}
          />
          <style>{`
            #hamburger-mobile, #hamburger-desktop { background-color: #000000 !important; border-color: #000000 !important; }
            #hamburger-mobile *, #hamburger-desktop * { background-color: #ffffff !important; }
          `}</style>
        </>
      )}

      {/* ── TOP BAR ── */}
      <header
        className="relative z-20 flex items-center gap-3 px-4 py-3 border-b-2"
        style={{
          background: lightMode
            ? "rgba(255,255,255,0.97)"
            : "rgba(9,3,28,0.95)",
          borderColor: lightMode ? "#e2e8f0" : "#2d1060",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Mobile hamburger */}
        <button
          id="hamburger-mobile"
          className="lg:hidden pixel-box border-2 p-2 transition-colors hover:brightness-125"
          style={{
            background: lightMode ? "#000000" : "#1a0a35",
            borderColor: lightMode ? "#000000" : "#3b1d6a",
          }}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <div className="space-y-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-4 h-0.5"
                style={{ background: lightMode ? "#000000" : "#a855f7" }}
              />
            ))}
          </div>
        </button>

        {/* Desktop collapse toggle */}
        <button
          id="hamburger-desktop"
          className={`hidden lg:flex flex-col justify-center items-center gap-1 pixel-box border-2 p-2 transition-colors hover:brightness-125 ${sidebarCollapsed ? "collapsed" : ""}`}
          style={{
            background: lightMode ? "#000000" : "#1a0a35",
            borderColor: lightMode ? "#000000" : "#3b1d6a",
            width: 34,
            height: 34,
            flexShrink: 0,
          }}
          onClick={() => setSidebarCollapsed((v) => !v)}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <div
            className="bar-top w-4 h-0.5"
            style={{ background: lightMode ? "#000000" : "#a855f7" }}
          />
          <div
            className="bar-mid w-4 h-0.5"
            style={{ background: lightMode ? "#000000" : "#a855f7" }}
          />
          <div
            className="bar-bot w-4 h-0.5"
            style={{ background: lightMode ? "#000000" : "#a855f7" }}
          />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2 flex-1">
          <div
            className="pixel-font text-sm"
            style={{
              color: "#c084fc",
              textShadow: "0 0 12px rgba(192,132,252,0.5)",
            }}
          >
            TINITHINK
          </div>
          <div
            className="hidden sm:block pixel-font text-[7px] px-2 py-1 pixel-box border"
            style={{
              color: "#fffff",
              borderColor: "#2d1060",
              background: "#0d0520",
            }}
          >
            v3.0
          </div>
        </div>

        {/* Current page label */}
        {activeItem && (
          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1 pixel-box border-2"
            style={{ background: "#1a0a35", borderColor: "#2d1060" }}
          >
            <activeItem.icon size={11} style={{ color: activeItem.color }} />
            <span
              className="pixel-font text-[9px]"
              style={{ color: activeItem.color }}
            >
              {activeItem.label}
            </span>
          </div>
        )}

        {/* User + Bell */}
        <div className="flex items-center gap-2">
          <div
            className="hidden md:flex items-center gap-2 px-3 py-1 pixel-box border-2"
            style={{ background: "#1a0a35", borderColor: "#3b1d6a" }}
          >
            <div
              className="w-2 h-2 pixel-box"
              style={{
                background: "#4ade80",
                boxShadow: "0 0 6px #4ade80",
                animation: "pulse 2s infinite",
              }}
            />
            <span
              className="pixel-font text-[9px]"
              style={{ color: "#c4b5fd" }}
            >
              {username}
            </span>
          </div>

          {/* Notifications bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="pixel-box border-2 p-2 transition-colors hover:brightness-125 relative"
              style={{
                background: unreadCount > 0 ? "#2d0f5a" : "#1a0a35",
                borderColor: unreadCount > 0 ? "#7c3aed" : "#3b1d6a",
                color: unreadCount > 0 ? "#c084fc" : "#4c1d95",
              }}
            >
              <Bell size={15} />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 pixel-box pixel-font text-[7px] w-4 h-4 flex items-center justify-center"
                  style={{ background: "#ef4444", color: "#fff" }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowNotifications(false)}
                />
                <div
                  className="absolute right-0 top-full mt-2 w-72 sm:w-80 pixel-box border-2 z-40 notif-in overflow-hidden"
                  style={{
                    background: "#0d0520",
                    borderColor: "#7c3aed",
                    boxShadow: "6px 6px 0 rgba(124,58,237,0.4)",
                  }}
                >
                  <div
                    className="flex items-center justify-between px-3 py-2 border-b-2"
                    style={{ background: "#1a0a35", borderColor: "#2d1060" }}
                  >
                    <span
                      className="pixel-font text-[9px]"
                      style={{ color: "#a855f7" }}
                    >
                      NOTIFICATIONS
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="pixel-font text-[7px] hover:brightness-125 transition-colors"
                        style={{ color: "#38bdf8" }}
                      >
                        MARK ALL READ
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto hide-scroll">
                    {notifications.length === 0 ? (
                      <div
                        className="p-6 text-center pixel-font text-[8px]"
                        style={{ color: "#3b1d6a" }}
                      >
                        NO NOTIFICATIONS
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className="px-3 py-2 border-b cursor-pointer transition-colors hover:brightness-125"
                          style={{
                            background: n.is_read
                              ? "transparent"
                              : "rgba(124,58,237,0.1)",
                            borderColor: "#1a0a35",
                          }}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span
                              className="pixel-font text-[9px]"
                              style={{
                                color: lightMode ? "#374151" : "#c4b5fd",
                              }}
                            >
                              {n.title}
                            </span>
                            {!n.is_read && (
                              <div
                                className="w-2 h-2 pixel-box"
                                style={{ background: "#38bdf8", flexShrink: 0 }}
                              />
                            )}
                          </div>
                          <p
                            className="pixel-font text-[7px]"
                            style={{ color: "#4c1d95" }}
                          >
                            {n.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="flex flex-1 relative z-10 min-h-0">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 lg:hidden"
            style={{ background: "rgba(0,0,0,0.7)" }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── SIDEBAR ── */}
        <aside
          className={`
            fixed lg:relative inset-y-0 left-0 z-30 lg:z-auto
            flex flex-col border-r-2 sidebar-anim
            transition-transform lg:translate-x-0
            ${sidebarOpen ? "translate-x-0 slide-in" : "-translate-x-full lg:translate-x-0"}
            ${sidebarCollapsed ? "sidebar-collapsed" : "sidebar-expanded"}
          `}
          style={{
            width: sidebarCollapsed ? "56px" : "208px",
            background: lightMode
              ? "rgba(255,255,255,0.98)"
              : "rgba(9,3,28,0.98)",
            borderColor: lightMode ? "#e2e8f0" : "#2d1060",
            backdropFilter: "blur(12px)",
            top: "0",
            paddingTop: "56px",
          }}
        >
          <div
            className="flex-1 overflow-y-auto overflow-x-hidden hide-scroll"
            style={{ padding: sidebarCollapsed ? "16px 6px" : "16px 12px" }}
          >
            <div className="space-y-1">
              {menuItems.map(({ key, label, icon: Icon, color }) => {
                const isActive = active === key;
                return (
                  <button
                    key={key}
                    onClick={() => navigate(key)}
                    title={sidebarCollapsed ? label : undefined}
                    className="menu-btn w-full pixel-box border-2 pixel-font text-[9px] flex items-center gap-3"
                    style={{
                      padding: sidebarCollapsed ? "10px 0" : "8px 12px",
                      justifyContent: sidebarCollapsed
                        ? "center"
                        : "flex-start",
                      textAlign: "left",
                      background: isActive
                        ? lightMode
                          ? "rgba(124,58,237,0.12)"
                          : "rgba(124,58,237,0.2)"
                        : "transparent",
                      borderColor: isActive
                        ? "#7c3aed"
                        : lightMode
                          ? "#e2e8f0"
                          : "#1a0a35",
                      color: isActive
                        ? color
                        : lightMode
                          ? "#374151"
                          : "#3b1d6a",
                      boxShadow: isActive ? `inset 3px 0 0 ${color}` : "none",
                    }}
                  >
                    <Icon
                      size={14}
                      style={{
                        color: isActive
                          ? color
                          : lightMode
                            ? "#374151"
                            : "#3b1d6a",
                        flexShrink: 0,
                      }}
                    />
                    {!sidebarCollapsed && (
                      <>
                        <span className="sidebar-label truncate">{label}</span>
                        {isActive && (
                          <ChevronRight
                            size={9}
                            style={{ color, marginLeft: "auto", flexShrink: 0 }}
                          />
                        )}
                      </>
                    )}
                  </button>
                );
              })}
              <div
                style={{
                  borderTop: `2px solid ${lightMode ? "#e2e8f0" : "#1a0a35"}`,
                  paddingTop: "8px",
                  marginTop: "8px",
                }}
              >
                <button
                  onClick={() => navigate("logout")}
                  title={sidebarCollapsed ? "LOGOUT" : undefined}
                  className="menu-btn w-full pixel-box border-2 pixel-font text-[9px] flex items-center gap-3"
                  style={{
                    padding: sidebarCollapsed ? "10px 0" : "8px 12px",
                    justifyContent: sidebarCollapsed ? "center" : "flex-start",
                    textAlign: "left",
                    background: "transparent",
                    borderColor: lightMode ? "#fecaca" : "#3b0a0a",
                    color: "#f87171",
                  }}
                >
                  <LogOutIcon
                    size={13}
                    style={{ color: "#f87171", flexShrink: 0 }}
                  />
                  {!sidebarCollapsed && (
                    <span className="sidebar-label">LOGOUT</span>
                  )}
                </button>
              </div>
            </div>
          </div>
          {!sidebarCollapsed && (
            <div
              className="px-3 py-4 border-t-2"
              style={{ borderColor: lightMode ? "#e2e8f0" : "#1a0a35" }}
            >
              <div
                className="pixel-box border-2 px-3 py-2"
                style={{
                  background: lightMode ? "#ffffff" : "#0d0520",
                  borderColor: lightMode ? "#e2e8f0" : "#2d1060",
                }}
              >
                <div
                  className="pixel-font text-[9px] truncate mb-1"
                  style={{ color: lightMode ? "#1e0a40" : "#c4b5fd" }}
                >
                  {username}
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 pixel-box"
                    style={{
                      background: "#4ade80",
                      boxShadow: "0 0 5px #4ade80",
                      animation: "pulse 2s infinite",
                    }}
                  />
                  <span
                    className="pixel-font text-[7px]"
                    style={{ color: "#4ade80" }}
                  >
                    ONLINE
                  </span>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main
          className="flex-1 min-w-0 overflow-y-auto hide-scroll"
          style={{ background: lightMode ? "#ffffff" : undefined }}
        >
          <div className="w-full px-6 py-5">
            {/* Page header */}
            {active !== "home" && activeItem && (
              <div className="flex items-center gap-3 mb-5 fade-in">
                <div
                  className="pixel-box border-2 p-2"
                  style={{
                    background: lightMode ? "#ffffff" : "#1a0a35",
                    borderColor: lightMode ? "#e2e8f0" : "#2d1060",
                  }}
                >
                  <activeItem.icon
                    size={16}
                    style={{ color: activeItem.color }}
                  />
                </div>
                <h2
                  className="pixel-font text-sm"
                  style={{ color: activeItem.color }}
                >
                  {activeItem.label}
                </h2>
              </div>
            )}

            {/* Content area */}
            <div className="fade-in">
              <ThemeCtx.Provider value={lightMode}>
                <div key={active}>{renderContent()}</div>
              </ThemeCtx.Provider>
            </div>
          </div>
        </main>
      </div>

      {/* ── FOOTER ── */}
      <footer
        className="relative z-10 flex items-center justify-between px-4 py-2 border-t-2 pixel-font text-[7px]"
        style={{
          background: lightMode
            ? "rgba(255,255,255,0.97)"
            : "rgba(9,3,28,0.95)",
          borderColor: lightMode ? "#e2e8f0" : "#1a0a35",
          color: lightMode ? "#1e0a40" : "#2d1060",
        }}
      >
        <span>© 2026 TINITHINK</span>
        <span className="hidden sm:flex items-center gap-2">
          <div
            className="w-1.5 h-1.5 pixel-box"
            style={{ background: "#4ade80", boxShadow: "0 0 4px #4ade80" }}
          />
          SECURE · v3.0.0
        </span>
        <span>STUDENT HUB</span>
      </footer>
    </div>
  );
}
