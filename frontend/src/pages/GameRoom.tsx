import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  supabase,
  getCurrentUser,
  joinGameSession,
  createGameSession,
  subscribeToGameSession,
} from "../lib/supabase";
import {
  Users,
  Clock,
  Trophy,
  ArrowLeft,
  Heart,
  Zap,
  Music,
  VolumeX,
  ShoppingBag,
} from "lucide-react";
import { AVATAR_IMAGES } from "../..//public/AvatarImages";

type DbChoice = {
  id: string;
  question_id: string;
  text: string;
  score: number;
  is_correct: boolean;
};
type DbQuestion = { id: string; text: string; ordering: number };
type QuestionWithChoices = { id: string; text: string; choices: DbChoice[] };
type PlayerScore = {
  user_id: string;
  username: string;
  score: number;
  lives: number;
  is_finished: boolean;
};
type AvatarEmotion = "idle" | "correct" | "wrong" | "win" | "lose" | "thinking";
type Difficulty = "easy" | "normal" | "hard";
type GamePhase = "shop" | "playing";

type AvatarCfg = {
  gender: "female" | "male";
  char: "1" | "2" | "3" | "4";
  color:
    | "purple"
    | "sky"
    | "pink"
    | "red"
    | "mint"
    | "gold"
    | "white"
    | "black";
};

const DEFAULT_AVATAR: AvatarCfg = {
  gender: "female",
  char: "1",
  color: "purple",
};

function loadSavedAvatar(): AvatarCfg {
  try {
    const r = localStorage.getItem("tini_avatar");
    return r ? JSON.parse(r) : DEFAULT_AVATAR;
  } catch {
    return DEFAULT_AVATAR;
  }
}

const COMBO_MSGS: Record<number, { text: string; color: string; sub: string }> =
  {
    3: { text: "NICE STREAK!", color: "#22c55e", sub: "🔥 Keep going!" },
    5: { text: "ON FIRE!", color: "#f97316", sub: "🔥🔥 Blazing!" },
    7: { text: "UNSTOPPABLE!", color: "#ef4444", sub: "💥 Incredible!" },
    10: { text: "LEGENDARY!", color: "#facc15", sub: "⭐ Unreal!" },
  };

const SHOP_ITEMS = [
  {
    id: "heart",
    emoji: "❤️",
    name: "GOLDEN HEART",
    desc: "Restores 1 life instantly",
    price: 150,
  },
  {
    id: "key",
    emoji: "🔑",
    name: "PIXEL KEY",
    desc: "Eliminates wrong answers",
    price: 100,
  },
  {
    id: "shield",
    emoji: "🛡️",
    name: "SHIELD",
    desc: "Protects streak when wrong",
    price: 120,
  },
  {
    id: "double",
    emoji: "⚡",
    name: "DOUBLE XP",
    desc: "2× all points this entire game",
    price: 200,
  },
];

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
  .pixel-font{font-family:'Press Start 2P',cursive;} .pixel-box{border-radius:0;}
  @keyframes shake      {0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}
  @keyframes pop        {0%{transform:scale(1)}40%{transform:scale(1.08)}100%{transform:scale(1)}}
  @keyframes heartLose  {0%{transform:scale(1)}30%{transform:scale(1.5)}60%{transform:scale(0.7)}100%{transform:scale(1)}}
  @keyframes scoreFloat {0%{opacity:1;transform:translateY(0) scale(1)}60%{opacity:1;transform:translateY(-32px) scale(1.15)}100%{opacity:0;transform:translateY(-50px) scale(0.9)}}
  @keyframes avatarBounce{0%,100%{transform:translateY(0) scaleY(1)}20%{transform:translateY(-14px) scaleY(1.05)}50%{transform:translateY(0) scaleY(0.95)}70%{transform:translateY(-7px)}}
  @keyframes avatarPop  {0%{transform:scale(0.8)}50%{transform:scale(1.2)}100%{transform:scale(1)}}
  @keyframes avatarShake{0%,100%{transform:rotate(0)}20%{transform:rotate(-9deg)}40%{transform:rotate(9deg)}60%{transform:rotate(-6deg)}80%{transform:rotate(6deg)}}
  @keyframes avatarFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
  @keyframes floatY     {0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
  @keyframes scoreIn    {0%{opacity:0;transform:scale(0.4) translateY(20px)}100%{opacity:1;transform:scale(1) translateY(0)}}
  @keyframes streakPop  {0%{transform:scale(0.5)}60%{transform:scale(1.25)}100%{transform:scale(1)}}
  @keyframes comboIn    {0%{opacity:0;transform:scale(0.3) translateY(40px)}60%{opacity:1;transform:scale(1.1) translateY(-4px)}100%{opacity:1;transform:scale(1) translateY(0)}}
  @keyframes comboOut   {0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(1.3) translateY(-30px)}}
  @keyframes slideUp    {0%{opacity:0;transform:translateY(32px)}100%{opacity:1;transform:translateY(0)}}
  @keyframes shieldBreak{0%{transform:scale(1) rotate(0)}30%{transform:scale(1.3) rotate(-15deg)}60%{transform:scale(0.8) rotate(10deg)}100%{transform:scale(1) rotate(0)}}
  @keyframes powerupPop {0%{opacity:0;transform:scale(0) translateY(10px)}70%{transform:scale(1.2) translateY(-4px)}100%{opacity:1;transform:scale(1) translateY(0)}}
  @keyframes easyGlow   {0%,100%{box-shadow:0 0 8px rgba(34,197,94,0.3),4px 4px 0 rgba(0,0,0,0.5)}50%{box-shadow:0 0 20px rgba(34,197,94,0.55),4px 4px 0 rgba(0,0,0,0.5)}}
  @keyframes normalGlow {0%,100%{box-shadow:0 0 10px rgba(234,179,8,0.35),4px 4px 0 rgba(0,0,0,0.5)}50%{box-shadow:0 0 26px rgba(234,179,8,0.65),4px 4px 0 rgba(0,0,0,0.5)}}
  @keyframes hardGlow   {0%,100%{box-shadow:0 0 14px rgba(239,68,68,0.4),4px 4px 0 rgba(0,0,0,0.5)}33%{box-shadow:0 0 30px rgba(239,68,68,0.75),4px 4px 0 rgba(0,0,0,0.5)}66%{box-shadow:0 0 18px rgba(239,68,68,0.5),4px 4px 0 rgba(0,0,0,0.5)}}
  @keyframes wrongFlash {0%{background:rgba(239,68,68,0.0)}30%{background:rgba(239,68,68,0.18)}100%{background:rgba(239,68,68,0.0)}}
  .c-shake    {animation:shake 0.45s ease;}
  .c-pop      {animation:pop 0.35s cubic-bezier(0.34,1.56,0.64,1);}
  .h-lose     {animation:heartLose 0.5s ease;}
  .s-float    {animation:scoreFloat 1s ease forwards;}
  .a-bounce   {animation:avatarBounce 0.7s cubic-bezier(0.36,0.07,0.19,0.97) both;}
  .a-pop      {animation:avatarPop 0.4s cubic-bezier(0.34,1.56,0.64,1) both;}
  .a-shake    {animation:avatarShake 0.5s ease both;}
  .a-float    {animation:avatarFloat 2s ease-in-out infinite;}
  .float      {animation:floatY 2.2s ease-in-out infinite;}
  .score-in   {animation:scoreIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards;}
  .streak-pop {animation:streakPop 0.35s cubic-bezier(0.34,1.56,0.64,1);}
  .combo-in   {animation:comboIn 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards;}
  .combo-out  {animation:comboOut 0.4s ease forwards;}
  .slide-up   {animation:slideUp 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards;}
  .shield-break{animation:shieldBreak 0.6s ease;}
  .powerup-pop{animation:powerupPop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards;}
  .wrong-flash{animation:wrongFlash 0.5s ease forwards;}
  .cbtn{transition:transform 0.07s,box-shadow 0.07s,background 0.2s,border-color 0.2s,opacity 0.25s;}
  .cbtn:not(:disabled):hover{transform:translate(-3px,-4px);}
  .cbtn:not(:disabled):active{transform:translate(1px,2px);}
  .door-easy  {animation:easyGlow   2.5s ease-in-out infinite;}
  .door-normal{animation:normalGlow 1.8s ease-in-out infinite;}
  .door-hard  {animation:hardGlow   1.2s ease-in-out infinite;}
`;

// ─── LOCAL WRONG-ANSWER STORE ─────────────────────────────────────────────────
const LOCAL_WA_KEY = "tini_wrong_answers";
type LocalWrongAnswer = {
  id: string;
  user_id: string;
  game_id: string | null;
  game_title: string;
  question_text: string;
  wrong_choice: string;
  correct_choice: string;
  difficulty: string;
  created_at: string;
};
function saveWrongAnswerLocally(entry: LocalWrongAnswer) {
  try {
    const raw = localStorage.getItem(LOCAL_WA_KEY);
    const arr: LocalWrongAnswer[] = raw ? JSON.parse(raw) : [];
    arr.unshift(entry);
    localStorage.setItem(LOCAL_WA_KEY, JSON.stringify(arr.slice(0, 500)));
  } catch {}
}

// ─── GAME AVATAR ──────────────────────────────────────────────────────────────
function GameAvatar({
  emotion,
  size = 64,
  cfg,
}: {
  emotion: AvatarEmotion;
  size?: number;
  cfg: AvatarCfg;
}) {
  const mood = emotion === "wrong" || emotion === "lose" ? "sad" : "happy";
  const charData = (AVATAR_IMAGES as any)[cfg.gender]?.[cfg.char];
  const src =
    charData?.[mood]?.[cfg.color] ??
    charData?.["happy"]?.[cfg.color] ??
    charData?.base ??
    "";

  const animClass =
    emotion === "win"
      ? "a-bounce"
      : emotion === "correct"
        ? "a-pop"
        : emotion === "wrong" || emotion === "lose"
          ? "a-shake"
          : emotion === "thinking"
            ? "a-float"
            : "";

  return (
    <div
      className={animClass}
      style={{ width: size, height: size, display: "inline-block" }}
    >
      <img
        src={src}
        alt="avatar"
        style={{
          width: size,
          height: size,
          imageRendering: "pixelated",
          objectFit: "contain",
        }}
      />
    </div>
  );
}

// ─── COMBO FLASH ──────────────────────────────────────────────────────────────
function ComboFlash({
  data,
  onDone,
}: {
  data: { text: string; color: string; sub: string };
  onDone: () => void;
}) {
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), 1000);
    const t2 = setTimeout(onDone, 1400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
      style={{ background: "rgba(0,0,0,0.35)" }}
    >
      <div
        className={leaving ? "combo-out" : "combo-in"}
        style={{ textAlign: "center" }}
      >
        <div
          className="pixel-font"
          style={{
            fontSize: "clamp(24px,6vw,42px)",
            color: data.color,
            textShadow: `0 0 30px ${data.color},0 0 60px ${data.color}`,
          }}
        >
          {data.text}
        </div>
        <div
          className="pixel-font mt-2"
          style={{ fontSize: "12px", color: "#fff", opacity: 0.9 }}
        >
          {data.sub}
        </div>
      </div>
    </div>
  );
}

// ─── SOUND ENGINE ─────────────────────────────────────────────────────────────
function useSoundEngine() {
  const ctxRef = useRef<AudioContext | null>(null);
  const bgTimerRef = useRef<any>(null);
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
  function getCtx() {
    if (!ctxRef.current)
      ctxRef.current = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
    if (ctxRef.current.state === "suspended") ctxRef.current.resume();
    return ctxRef.current;
  }
  function playTone(
    freq: number,
    type: OscillatorType,
    duration: number,
    vol = 0.3,
    delay = 0,
  ) {
    if (mutedRef.current) return;
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.value = freq;
      const t = ctx.currentTime + delay;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
      osc.start(t);
      osc.stop(t + duration + 0.05);
    } catch {}
  }
  function stopBg() {
    clearTimeout(bgTimerRef.current);
    bgTimerRef.current = null;
  }
  function startBg() {
    if (mutedRef.current) return;
    stopBg();
    const melody = [
      262, 294, 330, 262, 294, 330, 349, 294, 330, 392, 349, 330, 294, 262,
    ];
    let step = 0;
    function tick() {
      if (mutedRef.current) return;
      try {
        playTone(melody[step % melody.length], "triangle", 0.4, 0.055, 0);
      } catch {}
      step++;
      bgTimerRef.current = setTimeout(tick, 440);
    }
    bgTimerRef.current = setTimeout(tick, 300);
  }
  const sounds = {
    correct: () => {
      playTone(523, "sine", 0.1, 0.3, 0);
      playTone(659, "sine", 0.1, 0.3, 0.09);
      playTone(784, "sine", 0.14, 0.35, 0.18);
      playTone(1047, "sine", 0.22, 0.3, 0.29);
    },
    wrong: () => {
      playTone(300, "sawtooth", 0.07, 0.22, 0);
      playTone(220, "sawtooth", 0.07, 0.22, 0.09);
      playTone(160, "sawtooth", 0.14, 0.18, 0.18);
    },
    loseHeart: () => {
      playTone(180, "square", 0.05, 0.35, 0);
      playTone(140, "sawtooth", 0.09, 0.28, 0.06);
      playTone(100, "sawtooth", 0.16, 0.22, 0.14);
      playTone(80, "sine", 0.28, 0.18, 0.22);
    },
    click: () => {
      playTone(880, "square", 0.035, 0.12, 0);
      playTone(660, "square", 0.035, 0.08, 0.04);
    },
    back: () => {
      playTone(440, "triangle", 0.055, 0.18, 0);
      playTone(330, "triangle", 0.07, 0.18, 0.06);
      playTone(220, "sine", 0.11, 0.22, 0.12);
    },
    gameOver: () => {
      playTone(392, "sine", 0.18, 0.28, 0);
      playTone(349, "sine", 0.18, 0.28, 0.22);
      playTone(294, "sine", 0.32, 0.36, 0.44);
      playTone(262, "sine", 0.48, 0.28, 0.78);
    },
    win: () =>
      [523, 659, 784, 659, 784, 1047].forEach((f, i) =>
        playTone(f, "sine", 0.16, 0.32, i * 0.1),
      ),
    powerup: () => {
      playTone(659, "sine", 0.08, 0.25, 0);
      playTone(784, "sine", 0.08, 0.25, 0.08);
      playTone(1047, "sine", 0.14, 0.3, 0.16);
    },
    combo: () => {
      playTone(880, "sine", 0.08, 0.3, 0);
      playTone(1100, "sine", 0.08, 0.3, 0.08);
      playTone(1320, "sine", 0.16, 0.35, 0.16);
    },
    buy: () => {
      playTone(523, "sine", 0.06, 0.2, 0);
      playTone(784, "sine", 0.06, 0.2, 0.06);
      playTone(1047, "sine", 0.12, 0.25, 0.12);
    },
    startBg,
    stopBg,
  };
  function toggleMute() {
    mutedRef.current = !mutedRef.current;
    setMuted(mutedRef.current);
    if (mutedRef.current) stopBg();
    else startBg();
  }
  return { sounds, muted, toggleMute };
}

// ─── SIDE PANEL ───────────────────────────────────────────────────────────────
function SidePanel({ side }: { side: "left" | "right" }) {
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
    const colors = [
      "#a855f7",
      "#818cf8",
      "#c084fc",
      "#38bdf8",
      "#f472b6",
      "#facc15",
      "#4ade80",
    ];
    type P = {
      x: number;
      y: number;
      vy: number;
      vx: number;
      size: number;
      alpha: number;
      color: string;
      phase: number;
    };
    const particles: P[] = Array.from({ length: 30 }, () => ({
      x: Math.random() * 110,
      y: Math.random() * 800,
      vy: -(0.25 + Math.random() * 0.45),
      vx: (Math.random() - 0.5) * 0.2,
      size: Math.random() < 0.5 ? 2 : 4,
      alpha: 0.25 + Math.random() * 0.55,
      color: colors[Math.floor(Math.random() * colors.length)],
      phase: Math.random() * Math.PI * 2,
    }));
    const icons = [
      { yRatio: 0.1, type: 0, colorIdx: 0 },
      { yRatio: 0.26, type: 1, colorIdx: 4 },
      { yRatio: 0.42, type: 2, colorIdx: 1 },
      { yRatio: 0.58, type: 0, colorIdx: 5 },
      { yRatio: 0.73, type: 1, colorIdx: 2 },
      { yRatio: 0.88, type: 2, colorIdx: 3 },
    ];
    function pxStar(cx: number, cy: number, s: number, a: number, c: string) {
      ctx.globalAlpha = a;
      ctx.fillStyle = c;
      ctx.fillRect(cx - s, cy - s * 3, s * 2, s * 2);
      ctx.fillRect(cx - s * 3, cy - s, s * 2, s * 2);
      ctx.fillRect(cx + s, cy - s, s * 2, s * 2);
      ctx.fillRect(cx - s, cy + s, s * 2, s * 2);
      ctx.fillRect(cx - s, cy - s, s * 2, s * 2);
      ctx.globalAlpha = 1;
    }
    function pxHeart(cx: number, cy: number, s: number, a: number, c: string) {
      ctx.globalAlpha = a;
      ctx.fillStyle = c;
      ctx.fillRect(cx - s * 2, cy - s, s, s * 2);
      ctx.fillRect(cx - s, cy - s * 2, s, s);
      ctx.fillRect(cx, cy - s * 2, s, s);
      ctx.fillRect(cx + s, cy - s, s, s * 2);
      ctx.fillRect(cx - s * 2, cy + s, s * 3, s);
      ctx.fillRect(cx + s, cy + s, s, s);
      ctx.fillRect(cx - s, cy + s * 2, s * 3, s);
      ctx.globalAlpha = 1;
    }
    function pxDiamond(
      cx: number,
      cy: number,
      s: number,
      a: number,
      c: string,
    ) {
      ctx.globalAlpha = a;
      ctx.fillStyle = c;
      ctx.fillRect(cx - s, cy - s * 3, s * 2, s);
      ctx.fillRect(cx - s * 2, cy - s * 2, s * 4, s);
      ctx.fillRect(cx - s * 3, cy - s, s * 6, s);
      ctx.fillRect(cx - s * 2, cy, s * 4, s);
      ctx.fillRect(cx - s, cy + s, s * 2, s);
      ctx.globalAlpha = 1;
    }
    let t = 0;
    function draw() {
      const w = canvas!.width,
        h = canvas!.height;
      ctx.clearRect(0, 0, w, h);
      t += 0.018;
      const cx = w * 0.5;
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "rgba(88,28,135,0.15)");
      g.addColorStop(0.5, "rgba(30,10,64,0.05)");
      g.addColorStop(1, "rgba(88,28,135,0.15)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      icons.forEach((icon, i) => {
        const cy = h * icon.yRatio;
        const pulse = 0.35 + 0.3 * Math.sin(t + i * 1.1);
        const color = colors[icon.colorIdx];
        if (icon.type === 0) pxStar(cx, cy, 3, pulse, color);
        else if (icon.type === 1) pxHeart(cx, cy, 3, pulse, color);
        else pxDiamond(cx, cy, 3, pulse, color);
      });
      particles.forEach((p) => {
        p.y += p.vy;
        p.x += p.vx;
        p.phase += 0.045;
        if (p.y < -8) {
          p.y = h + 8;
          p.x = Math.random() * w;
        }
        const a = p.alpha * (0.4 + 0.6 * Math.abs(Math.sin(p.phase)));
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
        ctx.globalAlpha = 1;
      });
      ctx.globalAlpha = 0.035;
      ctx.fillStyle = "#000";
      for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 2);
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return (
    <div
      className="hidden lg:flex flex-col relative overflow-hidden shrink-0"
      style={{
        width: "120px",
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#150830 0%,#0d0520 50%,#150830 100%)",
        borderRight: side === "left" ? "2px solid #2d1060" : "none",
        borderLeft: side === "right" ? "2px solid #2d1060" : "none",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 pointer-events-none select-none pixel-font text-[7px]"
        style={{
          color: "#2d1060",
          writingMode: "vertical-rl",
          letterSpacing: "0.4em",
          opacity: 0.6,
        }}
      >
        {side === "left" ? "◆ TINITHINK ◆" : "◆ PLAY WIN ◆"}
      </div>
    </div>
  );
}

// ─── POWERUP BTN ──────────────────────────────────────────────────────────────
function PowerupBtn({
  emoji,
  label,
  count,
  disabled,
  breaking,
  onClick,
}: {
  emoji: string;
  label: string;
  count: number;
  disabled: boolean;
  breaking?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || count === 0}
      title={`${label} (${count})`}
      className={`pixel-box border-2 flex flex-col items-center justify-center gap-1 relative transition-all hover:brightness-125 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${breaking ? "shield-break" : ""}`}
      style={{
        background: "#1a0a35",
        borderColor: count > 0 ? "#7c3aed" : "#2d1060",
        padding: "10px 8px",
        minWidth: "52px",
      }}
    >
      <span style={{ fontSize: "18px", lineHeight: 1 }}>{emoji}</span>
      <span className="pixel-font text-[6px]" style={{ color: "#c084fc" }}>
        {label}
      </span>
      {count > 0 && (
        <span
          className="absolute -top-1.5 -right-1.5 pixel-box pixel-font text-[6px] w-4 h-4 flex items-center justify-center"
          style={{ background: "#7c3aed", color: "#fff" }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ─── SCREEN: SHOP ─────────────────────────────────────────────────────────────
function ShopScreen({
  avatarCfg,
  coins,
  onBuy,
  onStart,
  onBack,
  inventory,
}: {
  avatarCfg: AvatarCfg;
  coins: number;
  onBuy: (id: string, price: number) => void;
  onStart: () => void;
  onBack: () => void;
  inventory: { heart: number; key: number; shield: number; double: number };
}) {
  return (
    <div
      className="min-h-screen flex"
      style={{ background: "linear-gradient(180deg,#1a0a35,#0f0820)" }}
    >
      <style>{GLOBAL_CSS}</style>
      <SidePanel side="left" />
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-lg slide-up">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={onBack}
              className="pixel-box border-2 p-3 hover:brightness-125"
              style={{
                background: "#1a0a35",
                borderColor: "#3b1d6a",
                color: "#7c3aed",
              }}
            >
              <ArrowLeft size={14} />
            </button>
            <div className="flex-1 text-center">
              <h1
                className="pixel-font"
                style={{ fontSize: "clamp(12px,3vw,18px)", color: "#c084fc" }}
              >
                POWERUP SHOP
              </h1>
            </div>
            <div
              className="pixel-box border-2 px-3 py-2 flex items-center gap-2"
              style={{ background: "#1a0a35", borderColor: "#713f12" }}
            >
              <span style={{ fontSize: "14px" }}>🪙</span>
              <span
                className="pixel-font text-[10px]"
                style={{ color: "#facc15" }}
              >
                {coins}
              </span>
            </div>
          </div>

          {/* ── LARGE AVATAR (same treatment as in-game) ── */}
          <div className="flex justify-center mb-6">
            <div className="relative flex flex-col items-center">
              <div
                className="relative flex items-center justify-center"
                style={{
                  background:
                    "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)",
                  borderRadius: "50%",
                  padding: "8px",
                }}
              >
                <GameAvatar emotion="idle" size={220} cfg={avatarCfg} />
              </div>
              {/* Pixel shadow/platform */}
              <div
                className="mt-1 pixel-box"
                style={{
                  width: "160px",
                  height: "8px",
                  background:
                    "linear-gradient(90deg, transparent, #7c3aed55, transparent)",
                  boxShadow: "0 0 12px #7c3aed88",
                }}
              />
            </div>
          </div>

          <div
            className="pixel-box border-4 p-5 mb-5"
            style={{
              background: "#0f0820",
              borderColor: "#7c3aed",
              boxShadow: "8px 8px 0 rgba(88,28,135,0.35)",
            }}
          >
            <div
              className="pixel-font text-[7px] mb-4 flex items-center gap-2"
              style={{ color: "#38bdf8" }}
            >
              <ShoppingBag size={12} /> AVAILABLE POWERUPS
            </div>
            <div className="flex flex-col gap-3">
              {SHOP_ITEMS.map((item) => {
                const owned = inventory[item.id as keyof typeof inventory];
                const canAfford = coins >= item.price;
                return (
                  <div
                    key={item.id}
                    className="pixel-box border-2 p-4 flex items-center gap-4"
                    style={{ background: "#1a0a35", borderColor: "#2d1060" }}
                  >
                    <span style={{ fontSize: "24px", flexShrink: 0 }}>
                      {item.emoji}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div
                        className="pixel-font text-[8px] mb-1"
                        style={{ color: "#c4b5fd" }}
                      >
                        {item.name}
                      </div>
                      <div
                        className="pixel-font text-[6px]"
                        style={{ color: "#4c1d95" }}
                      >
                        {item.desc}
                      </div>
                      {owned > 0 && (
                        <div
                          className="pixel-font text-[6px] mt-1"
                          style={{ color: "#86efac" }}
                        >
                          OWNED: {owned}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center gap-1">
                        <span style={{ fontSize: "10px" }}>🪙</span>
                        <span
                          className="pixel-font text-[9px]"
                          style={{ color: "#facc15" }}
                        >
                          {item.price}
                        </span>
                      </div>
                      <button
                        onClick={() => onBuy(item.id, item.price)}
                        disabled={!canAfford}
                        className="pixel-box border-2 pixel-font text-[7px] px-3 py-2 transition-all hover:brightness-125 disabled:opacity-40 disabled:cursor-not-allowed active:translate-y-px"
                        style={{
                          background: canAfford ? "#4c1d95" : "#0f0820",
                          borderColor: canAfford ? "#7c3aed" : "#2d1060",
                          color: canAfford ? "#fff" : "#4c1d95",
                        }}
                      >
                        BUY
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div
            className="pixel-font text-center text-[7px] mb-5"
            style={{ color: "#2d1060" }}
          >
            🪙 Earn coins by answering correctly in-game
          </div>
          <button
            onClick={onStart}
            className="w-full py-5 pixel-box border-4 pixel-font text-[11px] hover:brightness-110 active:translate-y-px door-easy"
            style={{
              background: "#14532d",
              borderColor: "#22c55e",
              color: "#fff",
              boxShadow: "6px 6px 0 rgba(20,83,45,0.6)",
            }}
          >
            ▶ ENTER BATTLE
          </button>
        </div>
      </div>
      <SidePanel side="right" />
    </div>
  );
}

// ─── MAIN GAMEROOM ────────────────────────────────────────────────────────────
export default function GameRoom() {
  const { gameId } = useParams<{ gameId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { sounds, muted, toggleMute } = useSoundEngine();

  const DIFF_CONFIG: Record<
    Difficulty,
    {
      choices: number;
      timer: number;
      extraChances: number;
      accentColor: string;
      panelBg: string;
      panelBorder: string;
      label: string;
      doorClass: string;
      borderThickness: string;
    }
  > = {
    easy: {
      choices: 3,
      timer: 30,
      extraChances: 0,
      accentColor: "#22c55e",
      panelBg: "#052e16",
      panelBorder: "#166534",
      label: "EASY",
      doorClass: "door-easy",
      borderThickness: "border-4",
    },
    normal: {
      choices: 4,
      timer: 20,
      extraChances: 0,
      accentColor: "#eab308",
      panelBg: "#1c1400",
      panelBorder: "#854d0e",
      label: "NORMAL",
      doorClass: "door-normal",
      borderThickness: "border-4",
    },
    hard: {
      choices: 5,
      timer: 15,
      extraChances: 0,
      accentColor: "#ef4444",
      panelBg: "#200000",
      panelBorder: "#7f1d1d",
      label: "HARD",
      doorClass: "door-hard",
      borderThickness: "border-4",
    },
  };

  const [avatarConfig] = useState<AvatarCfg>(loadSavedAvatar);
  const [gamePhase, setGamePhase] = useState<GamePhase>("shop");

  const [coins, setCoins] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem("tini_coins") || "200");
    } catch {
      return 200;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("tini_coins", coins.toString());
    } catch {}
  }, [coins]);

  const [shopInventory, setShopInventory] = useState({
    heart: 0,
    key: 0,
    shield: 0,
    double: 0,
  });
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [gameTitle, setGameTitle] = useState<string>("");
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [questions, setQuestions] = useState<QuestionWithChoices[]>([]);
  const [index, setIndex] = useState(0);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answerResult, setAnswerResult] = useState<"correct" | "wrong" | null>(
    null,
  );
  const [isAnimating, setIsAnimating] = useState(false);
  const [finished, setFinished] = useState(false);
  const [won, setWon] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [players, setPlayers] = useState<PlayerScore[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  const [scorePopup, setScorePopup] = useState<number | null>(null);
  const [coinPopup, setCoinPopup] = useState<number | null>(null);
  const [heartShake, setHeartShake] = useState(false);
  const [avatarEmotion, setAvatarEmotion] = useState<AvatarEmotion>("idle");
  const [streak, setStreak] = useState(0);
  const [streakKey, setStreakKey] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [comboFlash, setComboFlash] = useState<{
    text: string;
    color: string;
    sub: string;
  } | null>(null);
  const [goldenHearts, setGoldenHearts] = useState(0);
  const [pixelKeys, setPixelKeys] = useState(0);
  const [shields, setShields] = useState(0);
  const [doubleXP, setDoubleXP] = useState(false);
  const [keyUsed, setKeyUsed] = useState(false);
  const [eliminatedChoices, setEliminatedChoices] = useState<string[]>([]);
  const [hintChoice, setHintChoice] = useState<string | null>(null);
  const [shieldBroken, setShieldBroken] = useState(false);
  const [powerupMsg, setPowerupMsg] = useState<string | null>(null);

  // Refs to track running totals for player_scores upsert
  const totalCorrectRef = useRef(0);
  const totalAnsweredRef = useRef(0);

  const timerRef = useRef<any>(null);
  const livesRef = useRef(3);
  const streakRef = useRef(0);
  const scoreRef = useRef(0);
  const gameTitleRef = useRef("");
  const current = questions[index];

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      sounds.stopBg();
    };
  }, []);
  useEffect(() => {
    if (gamePhase === "playing" && gameId) loadGame(gameId);
  }, [gamePhase]);
  useEffect(() => {
    livesRef.current = lives;
  }, [lives]);
  useEffect(() => {
    streakRef.current = streak;
  }, [streak]);
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);
  useEffect(() => {
    if (!sessionId || !isMultiplayer) return;
    const sub = subscribeToGameSession(sessionId, handlePlayerUpdate);
    return () => {
      sub.unsubscribe();
    };
  }, [sessionId, isMultiplayer]);
  useEffect(() => {
    if (!timerActive) return;
    clearInterval(timerRef.current);
    setAvatarEmotion("thinking");
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timerActive, index]);

  useEffect(() => {
    if (gamePhase !== "playing") return;
    function handleKey(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      const map: Record<string, number> = {
        "1": 0,
        "2": 1,
        "3": 2,
        "4": 3,
        "5": 4,
      };
      const idx = map[e.key];
      if (idx === undefined) return;
      const cfg = DIFF_CONFIG[difficulty];
      const cur = questions[index];
      if (!cur) return;
      const choices = cur.choices.slice(
        0,
        Math.min(cfg.choices, cur.choices.length),
      );
      const choice = choices[idx];
      if (!choice) return;
      if (eliminatedChoices.includes(choice.id)) return;
      handleChoose(choice.id);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [
    gamePhase,
    questions,
    index,
    difficulty,
    eliminatedChoices,
    isAnimating,
    finished,
    selected,
  ]);

  function startTimer(diff?: Difficulty) {
    const d = diff ?? difficulty;
    setTimeLeft(DIFF_CONFIG[d].timer);
    setTimerActive(true);
  }
  function stopTimer() {
    setTimerActive(false);
    clearInterval(timerRef.current);
  }
  function triggerHeartShake() {
    setHeartShake(true);
    setTimeout(() => setHeartShake(false), 600);
  }
  function showPowerupMsg(msg: string) {
    setPowerupMsg(msg);
    setTimeout(() => setPowerupMsg(null), 2000);
  }
  function getMultiplier(s: number) {
    if (s >= 7) return 3;
    if (s >= 5) return 2;
    if (s >= 3) return 1.5;
    return 1;
  }
  function triggerCombo(s: number) {
    const msg = COMBO_MSGS[s];
    if (msg) {
      sounds.combo();
      setComboFlash(msg);
    }
  }

  function handleShopBuy(itemId: string, price: number) {
    if (coins < price) return;
    sounds.buy();
    setCoins((c) => c - price);
    if (itemId === "heart") setGoldenHearts((h) => h + 1);
    if (itemId === "key") setPixelKeys((k) => k + 1);
    if (itemId === "shield") setShields((s) => s + 1);
    if (itemId === "double") {
      setDoubleXP(true);
      showPowerupMsg("⚡ DOUBLE XP active this game!");
    }
    setShopInventory((inv) => ({
      ...inv,
      [itemId]: (inv[itemId as keyof typeof inv] || 0) + 1,
    }));
  }
  function handleShopStart() {
    sounds.click();
    setGamePhase("playing");
  }

  function handleTimeout() {
    if (isAnimating || finished) return;
    setIsAnimating(true);
    setAnswerResult("wrong");
    setAvatarEmotion("wrong");
    sounds.wrong();
    setTimeout(() => {
      sounds.loseHeart();
      triggerHeartShake();
    }, 200);
    if (shields > 0) {
      setShields((s) => s - 1);
      setShieldBroken(true);
      setTimeout(() => setShieldBroken(false), 700);
      showPowerupMsg("🛡️ Shield blocked the timeout!");
    } else {
      setStreak(0);
    }
    const newLives = Math.max(0, livesRef.current - 1);
    livesRef.current = newLives;
    setLives(newLives);

    if (current) {
      totalAnsweredRef.current += 1;
      const correctChoice = current.choices.find((c) => c.is_correct);
      getCurrentUser().then((user) => {
        if (!user) return;
        const waEntry: LocalWrongAnswer = {
          id: `${user.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          user_id: user.id,
          game_id: gameId ?? null,
          game_title: gameTitleRef.current,
          question_text: current.text,
          wrong_choice: "⏰ TIME OUT",
          correct_choice: correctChoice?.text ?? "",
          difficulty: difficulty,
          created_at: new Date().toISOString(),
        };
        saveWrongAnswerLocally(waEntry);
        supabase.from("wrong_answers").insert(waEntry).then();

        supabase
          .from("player_scores")
          .upsert(
            {
              user_id: user.id,
              session_id: sessionId ?? "",
              score: scoreRef.current,
              total_correct: totalCorrectRef.current,
              total_answered: totalAnsweredRef.current,
              streak: 0,
            },
            { onConflict: "user_id,session_id" },
          )
          .then();
      });
    }

    if (newLives <= 0) {
      setTimeout(() => {
        setFinished(true);
        setAvatarEmotion("lose");
        sounds.gameOver();
        sounds.stopBg();
      }, 900);
    }
    setTimeout(() => {
      setSelected(null);
      setAnswerResult(null);
      setIsAnimating(false);
      setKeyUsed(false);
      setEliminatedChoices([]);
      setHintChoice(null);
      if (newLives > 0) {
        setAvatarEmotion("idle");
        advanceQuestion();
      }
    }, 950);
  }

  async function loadGame(gid: string) {
    setLoading(true);
    totalCorrectRef.current = 0;
    totalAnsweredRef.current = 0;
    try {
      const { data: game } = await supabase
        .from("games")
        .select("is_multiplayer,max_players,difficulty,title")
        .eq("id", gid)
        .single();
      const multi = game?.is_multiplayer || false;
      setIsMultiplayer(multi);
      const dbDiff = (game?.difficulty ||
        searchParams.get("difficulty") ||
        "easy") as Difficulty;
      setDifficulty(dbDiff);
      setGameTitle(game?.title ?? "");
      gameTitleRef.current = game?.title ?? "";
      const user = await getCurrentUser();
      if (!user) {
        navigate("/login");
        return;
      }
      const passedSessionId = searchParams.get("session");
      if (multi) {
        let sid = passedSessionId;
        if (sid) {
          setSessionId(sid);
          try {
            await joinGameSession(sid, user.id);
          } catch {}
          await loadPlayers(sid);
          await supabase
            .from("game_sessions")
            .update({ status: "in_progress" })
            .eq("id", sid);
        } else {
          const { data: active } = await supabase
            .from("game_sessions")
            .select("id")
            .eq("game_id", gid)
            .eq("status", "in_progress")
            .limit(1);
          if (active && active.length > 0) {
            sid = active[0].id;
            setSessionId(sid);
            try {
              await joinGameSession(sid!, user.id);
            } catch {}
            await loadPlayers(sid!);
          } else {
            const s = await createGameSession(
              gid,
              user.id,
              true,
              game?.max_players || 4,
            );
            setSessionId(s.id);
            await supabase
              .from("game_sessions")
              .update({ status: "in_progress" })
              .eq("id", s.id);
            await loadPlayers(s.id);
          }
        }
      } else {
        const s = await createGameSession(gid, user.id, false, 1);
        setSessionId(s.id);
        await supabase
          .from("game_sessions")
          .update({ status: "in_progress" })
          .eq("id", s.id);
      }
      const { data: qRows, error: qErr } = await supabase
        .from("questions")
        .select("id,text,ordering")
        .eq("game_id", gid)
        .order("ordering", { ascending: true });
      if (qErr) throw qErr;
      const qs = (qRows ?? []) as DbQuestion[];
      if (qs.length === 0) {
        alert("⚠️ THIS GAME HAS NO QUESTIONS YET!");
        navigate(-1);
        return;
      }
      const { data: cRows, error: cErr } = await supabase
        .from("choices")
        .select("*")
        .in(
          "question_id",
          qs.map((q) => q.id),
        );
      if (cErr) throw cErr;
      const merged: QuestionWithChoices[] = qs.map((q) => ({
        id: q.id,
        text: q.text,
        choices: (cRows ?? []).filter((c) => c.question_id === q.id),
      }));
      setQuestions(merged);
      setIndex(0);
      setLives(3);
      livesRef.current = 3;
      setScore(0);
      scoreRef.current = 0;
      setStreak(0);
      streakRef.current = 0;
      setBestStreak(0);
      setFinished(false);
      setWon(false);
      setSelected(null);
      setAnswerResult(null);
      setWrongAttempts(0);
      setKeyUsed(false);
      setEliminatedChoices([]);
      setHintChoice(null);
      setAvatarEmotion("idle");
      startTimer(dbDiff);
      setTimeout(() => sounds.startBg(), 400);
    } catch (e: any) {
      console.error(e);
      alert("⚠️ ERROR: " + e.message);
      navigate(-1);
    } finally {
      setLoading(false);
    }
  }

  async function loadPlayers(sid: string) {
    try {
      const { data } = await supabase
        .from("game_session_players")
        .select(
          `user_id,score,lives,is_finished,user:users!game_session_players_user_id_fkey (username)`,
        )
        .eq("session_id", sid);
      if (data)
        setPlayers(
          data.map((p: any) => ({
            user_id: p.user_id,
            username: p.user?.username || "Player",
            score: p.score,
            lives: p.lives,
            is_finished: p.is_finished,
          })),
        );
    } catch (e) {
      console.error(e);
    }
  }
  function handlePlayerUpdate(payload: any) {
    if (payload.eventType === "UPDATE" && sessionId) loadPlayers(sessionId);
  }

  async function handleChoose(choiceId: string) {
    if (isAnimating || finished || !current) return;
    stopTimer();
    setSelected(choiceId);
    setIsAnimating(true);
    sounds.click();
    const chosen = current.choices.find((c) => c.id === choiceId);
    const isCorrect = chosen?.is_correct ?? false;
    const cfg = DIFF_CONFIG[difficulty];

    totalAnsweredRef.current += 1;

    if (isCorrect) {
      totalCorrectRef.current += 1;
      setAnswerResult("correct");
      setAvatarEmotion("correct");
      const newStreak = streakRef.current + 1;
      setStreak(newStreak);
      setStreakKey((k) => k + 1);
      setBestStreak((b) => Math.max(b, newStreak));
      const mult = getMultiplier(newStreak);
      const pts = Math.round(
        Math.max(50, timeLeft * 5) * mult * (doubleXP ? 2 : 1),
      );
      const coinsEarned = Math.round((10 + timeLeft) * (doubleXP ? 2 : 1));
      const newScore = scoreRef.current + pts;
      setScore(newScore);
      scoreRef.current = newScore;
      setScorePopup(pts);
      setCoinPopup(coinsEarned);
      setCoins((c) => c + coinsEarned);
      setTimeout(() => setScorePopup(null), 1200);
      setTimeout(() => setCoinPopup(null), 1200);
      setTimeout(() => sounds.correct(), 50);
      setWrongAttempts(0);
      if (COMBO_MSGS[newStreak]) triggerCombo(newStreak);
      if (Math.random() < 0.05) {
        setGoldenHearts((h) => h + 1);
        showPowerupMsg("❤️ RARE DROP! Golden Heart!");
        sounds.powerup();
      }

      try {
        const user = await getCurrentUser();
        if (user) {
          if (sessionId) {
            const { data: player } = await supabase
              .from("game_session_players")
              .select("score,current_question")
              .eq("session_id", sessionId)
              .eq("user_id", user.id)
              .single();
            if (player)
              await supabase
                .from("game_session_players")
                .update({
                  score: player.score + pts,
                  current_question: player.current_question + 1,
                })
                .eq("session_id", sessionId)
                .eq("user_id", user.id);
          }

          await supabase.from("player_scores").upsert(
            {
              user_id: user.id,
              session_id: sessionId ?? "",
              score: newScore,
              total_correct: totalCorrectRef.current,
              total_answered: totalAnsweredRef.current,
              streak: newStreak,
            },
            { onConflict: "user_id,session_id" },
          );
        }
      } catch (e) {
        console.error(e);
      }

      setTimeout(() => {
        setAvatarEmotion("idle");
        advanceQuestion();
      }, 950);
    } else {
      setAnswerResult("wrong");
      setAvatarEmotion("wrong");
      sounds.wrong();
      setWrongAttempts(0);
      setTimeout(() => {
        sounds.loseHeart();
        triggerHeartShake();
      }, 200);
      if (shields > 0) {
        setShields((s) => s - 1);
        setShieldBroken(true);
        setTimeout(() => setShieldBroken(false), 700);
        showPowerupMsg("🛡️ Shield protected your streak!");
      } else {
        setStreak(0);
      }
      const nl = Math.max(0, livesRef.current - 1);
      setLives(nl);
      livesRef.current = nl;

      const correctChoice = current.choices.find((c) => c.is_correct);
      const wrongChoice = current.choices.find((c) => c.id === choiceId);
      getCurrentUser().then((user) => {
        if (!user) return;
        const waEntry: LocalWrongAnswer = {
          id: `${user.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          user_id: user.id,
          game_id: gameId ?? null,
          game_title: gameTitleRef.current,
          question_text: current.text,
          wrong_choice: wrongChoice?.text ?? "",
          correct_choice: correctChoice?.text ?? "",
          difficulty: difficulty,
          created_at: new Date().toISOString(),
        };
        saveWrongAnswerLocally(waEntry);
        supabase
          .from("wrong_answers")
          .insert(waEntry)
          .then(({ error }) => {
            if (error) console.error("wrong_answers insert error:", error);
          });

        supabase
          .from("player_scores")
          .upsert(
            {
              user_id: user.id,
              session_id: sessionId ?? "",
              score: scoreRef.current,
              total_correct: totalCorrectRef.current,
              total_answered: totalAnsweredRef.current,
              streak: 0,
            },
            { onConflict: "user_id,session_id" },
          )
          .then(({ error }) => {
            if (error) console.error("player_scores upsert error:", error);
          });

        if (sessionId) {
          supabase
            .from("game_session_players")
            .update({ lives: nl })
            .eq("session_id", sessionId)
            .eq("user_id", user.id)
            .then();
        }
      });

      if (nl <= 0) {
        setTimeout(() => {
          setFinished(true);
          setAvatarEmotion("lose");
          sounds.gameOver();
          sounds.stopBg();
        }, 950);
      }
      setTimeout(() => {
        setSelected(null);
        setAnswerResult(null);
        setIsAnimating(false);
        setKeyUsed(false);
        setEliminatedChoices([]);
        setHintChoice(null);
        if (nl > 0) {
          setAvatarEmotion("idle");
          advanceQuestion();
        }
      }, 950);
    }
  }

  function advanceQuestion() {
    setIsAnimating(false);
    setSelected(null);
    setAnswerResult(null);
    setWrongAttempts(0);
    setKeyUsed(false);
    setEliminatedChoices([]);
    setHintChoice(null);
    const next = index + 1;
    if (next >= questions.length) {
      setFinished(true);
      setWon(true);
      setAvatarEmotion("win");
      sounds.win();
      sounds.stopBg();
      if (sessionId) {
        getCurrentUser().then((user) => {
          if (!user) return;
          supabase
            .from("game_session_players")
            .update({ is_finished: true })
            .eq("session_id", sessionId!)
            .eq("user_id", user.id)
            .then();
          supabase
            .from("game_sessions")
            .update({ status: "finished" })
            .eq("id", sessionId!)
            .then();
        });
      }
    } else {
      setIndex(next);
      startTimer();
    }
  }

  function restartGame() {
    sounds.click();
    if (gameId) {
      setFinished(false);
      setWon(false);
      setScore(0);
      scoreRef.current = 0;
      setLives(3);
      livesRef.current = 3;
      setIndex(0);
      setSelected(null);
      setAnswerResult(null);
      setWrongAttempts(0);
      setStreak(0);
      streakRef.current = 0;
      setBestStreak(0);
      setAvatarEmotion("idle");
      setKeyUsed(false);
      setEliminatedChoices([]);
      setHintChoice(null);
      setDoubleXP(false);
      totalCorrectRef.current = 0;
      totalAnsweredRef.current = 0;
      setGamePhase("shop");
    }
  }
  function handleBack() {
    sounds.back();
    setTimeout(() => navigate("/dashboard"), 180);
  }

  function useGoldenHeart() {
    if (goldenHearts <= 0 || lives >= 3) return;
    sounds.powerup();
    setGoldenHearts((h) => h - 1);
    setLives((l) => Math.min(3, l + 1));
    livesRef.current = Math.min(3, livesRef.current + 1);
    showPowerupMsg("❤️ Golden Heart! +1 Life!");
  }
  function usePixelKey() {
    if (pixelKeys <= 0 || keyUsed || !current) return;
    sounds.powerup();
    setPixelKeys((k) => k - 1);
    setKeyUsed(true);
    const cfg = DIFF_CONFIG[difficulty];
    const dc = current.choices.slice(0, cfg.choices);
    const correct = dc.find((c) => c.is_correct);
    const wrongs = dc.filter((c) => !c.is_correct);
    const toElim = wrongs
      .slice(0, Math.max(wrongs.length - 1, 0))
      .map((c) => c.id);
    setEliminatedChoices(toElim);
    if (correct) setHintChoice(correct.id);
    showPowerupMsg("🔑 Key used! Wrong choices eliminated!");
  }

  const cfg = DIFF_CONFIG[difficulty];
  const timerPct = (timeLeft / cfg.timer) * 100;
  const timerColor =
    timeLeft > cfg.timer * 0.5
      ? "#22c55e"
      : timeLeft > cfg.timer * 0.25
        ? "#eab308"
        : "#ef4444";
  const multiplier = getMultiplier(streak);

  if (gamePhase === "shop")
    return (
      <ShopScreen
        avatarCfg={avatarConfig}
        coins={coins}
        onBuy={handleShopBuy}
        onStart={handleShopStart}
        onBack={() => {
          sounds.back();
          navigate("/dashboard");
        }}
        inventory={shopInventory}
      />
    );

  if (loading)
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg,#1e1040,#0f0820)" }}
      >
        <style>{GLOBAL_CSS}</style>
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <Zap
              size={48}
              style={{
                color: "#38bdf8",
                filter: "drop-shadow(0 0 12px #38bdf8)",
              }}
            />
            <div className="absolute inset-0 animate-ping">
              <Zap size={48} style={{ color: "#38bdf8", opacity: 0.25 }} />
            </div>
          </div>
          <div className="pixel-font text-[10px]" style={{ color: "#9333ea" }}>
            LOADING...
          </div>
        </div>
      </div>
    );

  if (finished)
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{
          background: won
            ? "linear-gradient(135deg,#0f2800,#1a0a35,#0f2800)"
            : "linear-gradient(135deg,#2a0010,#1a0a35,#2a0010)",
        }}
      >
        <style>{GLOBAL_CSS}</style>
        <div
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 0,
            overflow: "hidden",
          }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: "6px",
                height: "6px",
                background: won ? "#facc15" : "#f472b6",
                left: `${8 + i * 7.5}%`,
                top: "-8px",
                opacity: 0.7,
                animation: `scoreFloat ${1.5 + (i % 3) * 0.4}s ease forwards`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
        <div className="w-full max-w-md relative z-10">
          <div className="float mb-6 flex flex-col items-center gap-3">
            <GameAvatar
              emotion={won ? "win" : "lose"}
              size={100}
              cfg={avatarConfig}
            />
            <div
              className="pixel-font text-[8px]"
              style={{ color: won ? "#86efac" : "#fca5a5" }}
            >
              {won ? "★ CHAMPION ★" : "✗ DEFEATED ✗"}
            </div>
          </div>
          <div
            className="pixel-box border-4 p-8"
            style={{
              background: "#0f0820",
              borderColor: won ? "#facc15" : "#7c3aed",
              boxShadow: `12px 12px 0 ${won ? "rgba(250,204,21,0.25)" : "rgba(124,58,237,0.35)"}`,
            }}
          >
            <h2
              className="pixel-font text-center mb-2"
              style={{ fontSize: "18px", color: won ? "#fbbf24" : "#f472b6" }}
            >
              {won ? "YOU WIN!" : "GAME OVER"}
            </h2>
            <p
              className="pixel-font text-center text-[8px] mb-6"
              style={{ color: "#4c1d95" }}
            >
              {won ? "★ ALL CLEARED ★" : "✗ OUT OF LIVES"}
            </p>
            <div
              className="pixel-box border-2 p-6 mb-4 text-center score-in"
              style={{ background: "#1a0a35", borderColor: "#4c1d95" }}
            >
              <div
                className="pixel-font text-[8px] mb-2"
                style={{ color: "#7e22ce" }}
              >
                FINAL SCORE
              </div>
              <div
                className="pixel-font"
                style={{
                  fontSize: "44px",
                  color: "#facc15",
                  textShadow: "0 0 24px rgba(250,204,21,0.5)",
                }}
              >
                {score}
              </div>
              <div className="flex items-center justify-center gap-3 mt-3 flex-wrap">
                {[
                  `${questions.length} QS`,
                  `${3 - lives} MISS`,
                  cfg.label,
                  doubleXP ? "⚡ 2X" : "",
                ]
                  .filter(Boolean)
                  .map((t, i) => (
                    <span
                      key={i}
                      className="pixel-font text-[7px]"
                      style={{
                        color:
                          i === 2
                            ? cfg.accentColor
                            : i === 3
                              ? "#eab308"
                              : "#581c87",
                      }}
                    >
                      {t}
                    </span>
                  ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div
                className="pixel-box border-2 p-3 text-center"
                style={{ background: "#120730", borderColor: "#2d1060" }}
              >
                <div
                  className="pixel-font text-[6px] mb-1"
                  style={{ color: "#4c1d95" }}
                >
                  BEST STREAK
                </div>
                <div
                  className="pixel-font text-[11px]"
                  style={{ color: "#c084fc" }}
                >
                  🔥 {bestStreak}
                </div>
              </div>
              <div
                className="pixel-box border-2 p-3 text-center"
                style={{ background: "#120730", borderColor: "#2d1060" }}
              >
                <div
                  className="pixel-font text-[6px] mb-1"
                  style={{ color: "#4c1d95" }}
                >
                  TOTAL COINS
                </div>
                <div
                  className="pixel-font text-[11px]"
                  style={{ color: "#facc15" }}
                >
                  🪙 {coins}
                </div>
              </div>
            </div>
            {isMultiplayer && players.length > 0 && (
              <div
                className="pixel-box border-2 mb-5 overflow-hidden"
                style={{ borderColor: "#4c1d95" }}
              >
                <div
                  className="px-4 py-3 pixel-font text-[8px] flex items-center gap-2"
                  style={{ background: "#1e0a40", color: "#38bdf8" }}
                >
                  <Users size={10} /> LEADERBOARD
                </div>
                {players
                  .sort((a, b) => b.score - a.score)
                  .map((p, i) => (
                    <div
                      key={p.user_id}
                      className="flex items-center gap-3 px-4 py-3 border-t-2"
                      style={{ borderColor: "#2d1060" }}
                    >
                      <span
                        className="pixel-font text-[8px] w-5"
                        style={{ color: i === 0 ? "#facc15" : "#6b21a8" }}
                      >
                        #{i + 1}
                      </span>
                      <span
                        className="pixel-font text-[9px] flex-1 truncate"
                        style={{ color: "#c4b5fd" }}
                      >
                        {p.username}
                      </span>
                      <span
                        className="pixel-font text-[9px]"
                        style={{ color: "#facc15" }}
                      >
                        {p.score}
                      </span>
                    </div>
                  ))}
              </div>
            )}
            <div className="flex gap-4">
              <button
                onClick={restartGame}
                className="flex-1 py-4 pixel-box border-2 pixel-font text-[9px] hover:brightness-110 active:translate-y-px"
                style={{
                  background: "#0e7490",
                  borderColor: "#22d3ee",
                  color: "#fff",
                }}
              >
                ▶ AGAIN
              </button>
              <button
                onClick={handleBack}
                className="flex-1 py-4 pixel-box border-2 pixel-font text-[9px] hover:brightness-110 active:translate-y-px flex items-center justify-center gap-2"
                style={{
                  background: "#1a0a35",
                  borderColor: "#4c1d95",
                  color: "#c4b5fd",
                }}
              >
                <ArrowLeft size={11} /> BACK
              </button>
            </div>
          </div>
        </div>
      </div>
    );

  const displayChoices = current
    ? current.choices.slice(0, Math.min(cfg.choices, current.choices.length))
    : [];
  const choiceCount = displayChoices.length;

  function renderChoiceButton(
    choice: DbChoice,
    i: number,
    extraStyle?: React.CSSProperties,
  ) {
    const isSel = selected === choice.id;
    const showC =
      (isSel && answerResult === "correct") ||
      (answerResult !== null && choice.is_correct);
    const showW = isSel && answerResult === "wrong";
    const isDimmed = answerResult !== null && !isSel && !choice.is_correct;
    const isElim = eliminatedChoices.includes(choice.id);
    const isHint = hintChoice === choice.id;
    const bBgs = ["#1e1060", "#0f1e50", "#1a1500", "#1a0820", "#001a1a"];
    const bBds = ["#4c1d95", "#1e3a8a", "#713f12", "#581c87", "#134e4a"];
    const btnBg = isElim
      ? "#0a0a0a"
      : isDimmed
        ? "#0d0820"
        : showC
          ? "#14532d"
          : showW
            ? "#450a0a"
            : isHint
              ? "#1c2d00"
              : bBgs[i % 5];
    const btnBorder = isElim
      ? "#1a1a1a"
      : isDimmed
        ? "#1a0a35"
        : showC
          ? "#22c55e"
          : showW
            ? "#ef4444"
            : isHint
              ? "#86efac"
              : bBds[i % 5];
    const btnOpacity = isElim ? 0.25 : isDimmed ? 0.35 : 1;
    const badgeBg = showC
      ? "#15803d"
      : showW
        ? "#7f1d1d"
        : isHint
          ? "#1a4000"
          : "#2d1060";
    const badgeBorder = showC
      ? "#4ade80"
      : showW
        ? "#f87171"
        : isHint
          ? "#4ade80"
          : cfg.accentColor;
    const badgeColor = showC
      ? "#86efac"
      : showW
        ? "#fca5a5"
        : isHint
          ? "#86efac"
          : "#c084fc";
    const textColor = isElim
      ? "#333"
      : isDimmed
        ? "#3b1d6a"
        : isHint
          ? "#86efac"
          : "#e9d5ff";
    return (
      <button
        key={choice.id}
        onClick={() => !isElim && handleChoose(choice.id)}
        disabled={isAnimating || isElim}
        className={`cbtn pixel-box ${cfg.borderThickness} flex flex-col items-center justify-center gap-3 pixel-font text-[10px] text-center disabled:cursor-not-allowed ${showC ? "c-pop" : showW ? "c-shake" : ""} ${!showC && !showW && !isElim && !isDimmed ? cfg.doorClass : ""}`}
        style={{
          padding: "20px 16px",
          minHeight: choiceCount <= 3 ? "80px" : "110px",
          background: btnBg,
          borderColor: btnBorder,
          opacity: btnOpacity,
          ...extraStyle,
        }}
      >
        <span
          className="pixel-box border-2 w-8 h-8 flex items-center justify-center text-[11px] font-bold shrink-0"
          style={{
            background: badgeBg,
            borderColor: badgeBorder,
            color: badgeColor,
          }}
        >
          {isElim ? (
            "✗"
          ) : (
            <span
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                lineHeight: 1.1,
              }}
            >
              <span
                style={{ fontSize: "6px", opacity: showC || showW ? 0 : 0.65 }}
              >
                {i + 1}
              </span>
              <span>{String.fromCharCode(65 + i)}</span>
            </span>
          )}
        </span>
        <span
          style={{
            color: textColor,
            lineHeight: 1.7,
            textDecoration: isElim ? "line-through" : "none",
          }}
        >
          {choice.text}
        </span>
        {isHint && !isElim && (
          <span className="pixel-font text-[6px]" style={{ color: "#86efac" }}>
            🔑 HINT
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "linear-gradient(180deg,#1a0a35,#0f0820)" }}
    >
      <style>{GLOBAL_CSS}</style>
      {comboFlash && (
        <ComboFlash data={comboFlash} onDone={() => setComboFlash(null)} />
      )}
      <SidePanel side="left" />
      <div className="flex-1 flex flex-col min-w-0">
        {/* HUD */}
        <div className="px-6 pt-6 pb-3 max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={handleBack}
              className="pixel-box border-2 p-3 hover:brightness-125 active:translate-y-px shrink-0"
              style={{
                background: "#1a0a35",
                borderColor: "#3b1d6a",
                color: "#7c3aed",
              }}
            >
              <ArrowLeft size={14} />
            </button>
            <div
              className="pixel-font text-[8px] px-3 py-2 pixel-box border-2 shrink-0"
              style={{
                color: cfg.accentColor,
                borderColor: cfg.accentColor,
                background: "rgba(0,0,0,0.4)",
              }}
            >
              {cfg.label}
            </div>

            <div
              className={`flex items-center gap-2 px-3 py-2 pixel-box border-2 shrink-0 ${heartShake ? "h-lose" : ""}`}
              style={{ background: "#1a0a35", borderColor: "#7c2d12" }}
            >
              {Array.from({ length: 3 }).map((_, i) => (
                <Heart
                  key={i}
                  size={17}
                  className={i < lives ? "fill-red-400" : ""}
                  style={{
                    color: i < lives ? "#f87171" : "#2d1060",
                    filter: i < lives ? "drop-shadow(0 0 5px #f87171)" : "none",
                    transition: "all 0.3s",
                  }}
                />
              ))}
            </div>
            <div
              className="flex items-center gap-2 px-3 py-2 pixel-box border-2 flex-1 justify-center relative"
              style={{ background: "#1a0a35", borderColor: "#713f12" }}
            >
              <Trophy size={13} style={{ color: "#facc15" }} />
              <span
                className="pixel-font text-[11px]"
                style={{ color: "#facc15" }}
              >
                {score}
              </span>
              {scorePopup !== null && (
                <span
                  className="s-float absolute -top-8 left-1/2 -translate-x-1/2 pixel-font text-[9px] whitespace-nowrap"
                  style={{ color: "#4ade80", pointerEvents: "none" }}
                >
                  +{scorePopup}
                  {multiplier > 1 ? ` (${multiplier}x)` : ""}
                  {doubleXP ? " ⚡" : ""}
                </span>
              )}
              {coinPopup !== null && (
                <span
                  className="s-float absolute -top-8 right-0 pixel-font text-[8px] whitespace-nowrap"
                  style={{
                    color: "#facc15",
                    pointerEvents: "none",
                    animationDelay: "0.15s",
                  }}
                >
                  +{coinPopup}🪙
                </span>
              )}
            </div>
            <div
              className="flex items-center gap-1 px-3 py-2 pixel-box border-2 shrink-0"
              style={{ background: "#1a0a35", borderColor: "#713f12" }}
            >
              <span style={{ fontSize: "11px" }}>🪙</span>
              <span
                className="pixel-font text-[8px]"
                style={{ color: "#facc15" }}
              >
                {coins}
              </span>
            </div>
            <div
              className="flex items-center gap-2 px-2 py-2 pixel-box border-2 shrink-0"
              style={{ background: "#1a0a35", borderColor: "#3b1d6a" }}
            >
              <Clock size={12} style={{ color: "#818cf8" }} />
              <span
                className="pixel-font text-[8px]"
                style={{ color: "#818cf8" }}
              >
                {index + 1}/{questions.length}
              </span>
            </div>
            <button
              onClick={toggleMute}
              className="pixel-box border-2 p-3 hover:brightness-125 shrink-0"
              style={{
                background: "#1a0a35",
                borderColor: muted ? "#2d1060" : "#6b21a8",
                color: muted ? "#3b1d6a" : "#a855f7",
              }}
            >
              {muted ? <VolumeX size={14} /> : <Music size={14} />}
            </button>
            {isMultiplayer && (
              <button
                onClick={() => setShowLeaderboard(true)}
                className="pixel-box border-2 p-3 relative shrink-0"
                style={{
                  background: "#0c2a3a",
                  borderColor: "#0e4d6a",
                  color: "#38bdf8",
                }}
              >
                <Users size={14} />
                {players.length > 0 && (
                  <span
                    className="absolute -top-1 -right-1 pixel-font text-[7px] w-4 h-4 flex items-center justify-center pixel-box"
                    style={{ background: "#38bdf8", color: "#000" }}
                  >
                    {players.length}
                  </span>
                )}
              </button>
            )}
          </div>

          {streak > 0 && (
            <div
              key={streakKey}
              className="streak-pop flex items-center justify-between px-4 py-2 pixel-box border-2 mb-3"
              style={{ background: "#1a0030", borderColor: "#7c3aed" }}
            >
              <span
                className="pixel-font text-[7px]"
                style={{ color: "#c084fc" }}
              >
                🔥 STREAK: {streak}
              </span>
              <span
                className="pixel-font text-[8px]"
                style={{
                  color:
                    multiplier >= 2
                      ? "#facc15"
                      : multiplier >= 1.5
                        ? "#f97316"
                        : "#a855f7",
                }}
              >
                {multiplier}x{doubleXP ? " ⚡ 2X" : ""}
              </span>
            </div>
          )}
          {doubleXP && streak === 0 && (
            <div
              className="flex items-center justify-center gap-2 px-4 py-2 pixel-box border-2 mb-3"
              style={{ background: "#1a0030", borderColor: "#eab308" }}
            >
              <span
                className="pixel-font text-[7px]"
                style={{ color: "#facc15" }}
              >
                ⚡ DOUBLE XP ACTIVE
              </span>
            </div>
          )}

          <div
            className="pixel-box border-2 h-4 overflow-hidden mb-1"
            style={{ background: "#0f0820", borderColor: "#2d1060" }}
          >
            <div
              className="h-full"
              style={{
                width: `${timerPct}%`,
                background: timerColor,
                boxShadow: `0 0 10px ${timerColor}`,
                transition: "width 1s linear,background 0.5s",
              }}
            />
          </div>
          <div className="flex justify-between items-center mb-1">
            <div className="pixel-font text-[7px]" style={{ color: "#2d1060" }}>
              TIME
            </div>
            <div
              className="pixel-font text-[8px]"
              style={{ color: timerColor }}
            >
              {timeLeft}s
            </div>
          </div>
        </div>

        {/* Powerups */}
        <div className="px-6 pb-2 max-w-2xl mx-auto w-full">
          <div
            className="flex items-center gap-3 p-3 pixel-box border-2"
            style={{ background: "#0d0520", borderColor: "#2d1060" }}
          >
            <span
              className="pixel-font text-[6px] shrink-0"
              style={{ color: "#4c1d95" }}
            >
              POWERUPS:
            </span>
            <div className="flex gap-2 flex-1">
              <PowerupBtn
                emoji="❤️"
                label="HEART"
                count={goldenHearts}
                disabled={isAnimating || lives >= 3}
                onClick={useGoldenHeart}
              />
              <PowerupBtn
                emoji="🔑"
                label="KEY"
                count={pixelKeys}
                disabled={isAnimating || keyUsed || finished}
                onClick={usePixelKey}
              />
              <PowerupBtn
                emoji="🛡️"
                label="SHIELD"
                count={shields}
                disabled={true}
                breaking={shieldBroken}
                onClick={() => {}}
              />
              {doubleXP && (
                <div
                  className="pixel-box border-2 flex flex-col items-center justify-center gap-1 px-3 py-2"
                  style={{ background: "#1a1000", borderColor: "#eab308" }}
                >
                  <span style={{ fontSize: "16px" }}>⚡</span>
                  <span
                    className="pixel-font text-[6px]"
                    style={{ color: "#facc15" }}
                  >
                    2X ON
                  </span>
                </div>
              )}
            </div>
            {powerupMsg && (
              <div
                className="powerup-pop pixel-font text-[7px] px-2 py-1 pixel-box border-2 ml-auto"
                style={{
                  background: "#1a0a35",
                  borderColor: "#7c3aed",
                  color: "#c4b5fd",
                  whiteSpace: "nowrap",
                }}
              >
                {powerupMsg}
              </div>
            )}
          </div>
        </div>

        {/* Question + Choices */}
        <div className="flex-1 flex items-center justify-center px-6 pb-8">
          <div className="flex items-center gap-6 w-full max-w-5xl">
            {/* Left avatar panel */}
            <div
              className="hidden md:flex flex-col items-center shrink-0"
              style={{ width: "420px" }}
            >
              <div className="relative flex flex-col items-center">
                <div
                  className="mb-2 px-3 py-1 pixel-box border-2 pixel-font text-[7px] transition-all"
                  style={{
                    background:
                      avatarEmotion === "correct"
                        ? "#052e16"
                        : avatarEmotion === "wrong"
                          ? "#2d0a0a"
                          : "#1a0a35",
                    borderColor:
                      avatarEmotion === "correct"
                        ? "#4ade80"
                        : avatarEmotion === "wrong"
                          ? "#f87171"
                          : "#7c3aed",
                    color:
                      avatarEmotion === "correct"
                        ? "#4ade80"
                        : avatarEmotion === "wrong"
                          ? "#f87171"
                          : "#a855f7",
                    minWidth: "70px",
                    textAlign: "center",
                  }}
                ></div>
                <div
                  className="relative flex items-center justify-center"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)",
                    borderRadius: "50%",
                    padding: "8px",
                  }}
                >
                  <GameAvatar
                    emotion={avatarEmotion}
                    size={400}
                    cfg={avatarConfig}
                  />
                </div>
                <div
                  className="mt-1 pixel-box"
                  style={{
                    width: "260px",
                    height: "8px",
                    background:
                      "linear-gradient(90deg, transparent, #7c3aed55, transparent)",
                    boxShadow: "0 0 12px #7c3aed88",
                  }}
                />
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-5">
              <div
                className="pixel-box border-4 p-7 relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg,#1a0a35,#0f0820)",
                  borderColor: "#7c3aed",
                  boxShadow:
                    "0 0 22px rgba(124,58,237,0.25),8px 8px 0 rgba(88,28,135,0.5)",
                }}
              >
                {[
                  "top-1 left-1",
                  "top-1 right-1",
                  "bottom-1 left-1",
                  "bottom-1 right-1",
                ].map((pos) => (
                  <div
                    key={pos}
                    className={`absolute ${pos} w-2 h-2`}
                    style={{ background: "#a855f7" }}
                  />
                ))}
                <div
                  className="pixel-font text-[7px] mb-4 flex items-center justify-between"
                  style={{ color: "#4c1d95" }}
                >
                  <span>
                    QUESTION {index + 1} / {questions.length}
                  </span>
                  <span style={{ color: cfg.accentColor }}>
                    {choiceCount} CHOICES · {cfg.label}
                  </span>
                </div>
                <h3
                  className="pixel-font text-center leading-loose"
                  style={{ fontSize: "14px", color: "#e9d5ff" }}
                >
                  {current?.text}
                </h3>
              </div>

              {choiceCount <= 3 ? (
                <div className="flex flex-col gap-4">
                  {displayChoices.map((choice, i) =>
                    renderChoiceButton(choice, i),
                  )}
                </div>
              ) : choiceCount === 4 ? (
                <div className="grid grid-cols-2 gap-4">
                  {displayChoices.map((choice, i) =>
                    renderChoiceButton(choice, i),
                  )}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    {displayChoices
                      .slice(0, 4)
                      .map((choice, i) => renderChoiceButton(choice, i))}
                  </div>
                  <div className="flex justify-center">
                    {renderChoiceButton(displayChoices[4], 4, {
                      width: "calc(50% - 8px)",
                    })}
                  </div>
                </>
              )}

              <p
                className="pixel-font text-center text-[7px]"
                style={{ color: "#2d1060" }}
              >
                ▼ TAP OR PRESS 1–{choiceCount} ▼
              </p>
            </div>
          </div>
        </div>
      </div>
      <SidePanel side="right" />

      {/* Multiplayer leaderboard overlay */}
      {isMultiplayer && showLeaderboard && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.75)" }}
            onClick={() => setShowLeaderboard(false)}
          />
          <div
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 pixel-box border-4 z-50 overflow-hidden"
            style={{
              background: "#0f0820",
              borderColor: "#7c3aed",
              boxShadow: "8px 8px 0 rgba(88,28,135,0.5)",
              maxWidth: "380px",
              margin: "0 auto",
            }}
          >
            <div
              className="px-5 py-4 flex items-center gap-2 border-b-2 pixel-font text-[9px]"
              style={{
                background: "#1a0a35",
                borderColor: "#2d1060",
                color: "#38bdf8",
              }}
            >
              <Users size={12} /> LIVE SCORES
            </div>
            <div className="max-h-72 overflow-y-auto">
              {players
                .sort((a, b) => b.score - a.score)
                .map((p, i) => (
                  <div
                    key={p.user_id}
                    className="flex items-center gap-3 px-5 py-3 border-b-2"
                    style={{ borderColor: "#1a0a35" }}
                  >
                    <span
                      className="pixel-font text-[8px] w-5"
                      style={{ color: i === 0 ? "#facc15" : "#4c1d95" }}
                    >
                      #{i + 1}
                    </span>
                    <span
                      className="pixel-font text-[9px] flex-1 truncate"
                      style={{ color: "#c4b5fd" }}
                    >
                      {p.username}
                    </span>
                    <div className="flex gap-1">
                      {Array.from({ length: 3 }).map((_, j) => (
                        <Heart
                          key={j}
                          size={11}
                          className={j < p.lives ? "fill-red-400" : ""}
                          style={{ color: j < p.lives ? "#f87171" : "#2d1060" }}
                        />
                      ))}
                    </div>
                    <span
                      className="pixel-font text-[9px]"
                      style={{ color: "#facc15" }}
                    >
                      {p.score}
                    </span>
                  </div>
                ))}
            </div>
            <div className="p-4" style={{ background: "#1a0a35" }}>
              <button
                onClick={() => setShowLeaderboard(false)}
                className="w-full py-3 pixel-box border-2 pixel-font text-[9px] hover:brightness-110"
                style={{
                  background: "#2d1060",
                  borderColor: "#7c3aed",
                  color: "#c4b5fd",
                }}
              >
                CLOSE
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
