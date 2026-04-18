import React, { useState, useEffect } from "react";
import { supabase, getCurrentUser } from "../../lib/supabase";
import {
  Settings as SettingsIcon,
  Save,
  User,
  Mail,
  Hash,
  School,
  BookOpen,
  Check,
  Lock,
  Eye,
  EyeOff,
  Bell,
  BellOff,
} from "lucide-react";

// ─── AVATAR TYPES & CONSTANTS ─────────────────────────────────────────────────
type AvatarCfg = {
  hairColor: string;
  skinColor: string;
  accessory: "none" | "glasses" | "crown" | "headband";
};
const HAIR_COLORS: { hex: string; name: string }[] = [
  { hex: "#a855f7", name: "PURPLE" },
  { hex: "#38bdf8", name: "SKY" },
  { hex: "#f472b6", name: "PINK" },
  { hex: "#ef4444", name: "RED" },
  { hex: "#4ade80", name: "MINT" },
  { hex: "#facc15", name: "GOLD" },
  { hex: "#f5f5f5", name: "WHITE" },
  { hex: "#1a0820", name: "BLACK" },
];
const SKIN_TONES: { hex: string; name: string }[] = [
  { hex: "#f4c87a", name: "FAIR" },
  { hex: "#e8a96a", name: "WARM" },
  { hex: "#c8854a", name: "TAN" },
  { hex: "#8b5e3c", name: "DEEP" },
];
const ACCESSORIES = ["none", "glasses", "crown", "headband"] as const;
const DEFAULT_AVATAR: AvatarCfg = {
  hairColor: "#a855f7",
  skinColor: "#f4c87a",
  accessory: "none",
};

function loadAvatarLocal(): AvatarCfg {
  try {
    const r = localStorage.getItem("tini_avatar");
    return r ? JSON.parse(r) : DEFAULT_AVATAR;
  } catch {
    return DEFAULT_AVATAR;
  }
}
function saveAvatarLocal(cfg: AvatarCfg) {
  try {
    localStorage.setItem("tini_avatar", JSON.stringify(cfg));
  } catch {}
}
function loadCoinsLocal(): number {
  try {
    return parseInt(localStorage.getItem("tini_coins") || "0");
  } catch {
    return 0;
  }
}

// ─── MINI PIXEL AVATAR (self-contained SVG) ───────────────────────────────────
function MiniAvatar({ cfg, size = 80 }: { cfg: AvatarCfg; size?: number }) {
  const S = size / 16,
    px = (n: number) => n * S;
  const DARK = "#1a0820",
    WHITE = "#fffde7",
    BLUE = "#38bdf8",
    PINK = "#f472b6",
    YELLOW = "#facc15",
    RED = "#f87171";
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "inline-block",
        animation: "avatarFloat 2.5s ease-in-out infinite",
      }}
    >
      <svg
        viewBox={`0 0 ${px(16)} ${px(16)}`}
        width={size}
        height={size}
        style={{ imageRendering: "pixelated", display: "block" }}
      >
        <rect
          x={px(2)}
          y={px(2)}
          width={px(12)}
          height={px(13)}
          fill={cfg.skinColor}
        />
        <rect
          x={px(2)}
          y={px(1)}
          width={px(12)}
          height={px(3)}
          fill={cfg.hairColor}
        />
        <rect
          x={px(1)}
          y={px(2)}
          width={px(2)}
          height={px(2)}
          fill={cfg.hairColor}
        />
        <rect
          x={px(13)}
          y={px(2)}
          width={px(2)}
          height={px(2)}
          fill={cfg.hairColor}
        />
        <rect
          x={px(5)}
          y={px(1)}
          width={px(2)}
          height={px(1)}
          fill={cfg.hairColor}
        />
        <rect
          x={px(9)}
          y={px(0)}
          width={px(2)}
          height={px(2)}
          fill={cfg.hairColor}
        />
        <rect
          x={px(1)}
          y={px(5)}
          width={px(1)}
          height={px(3)}
          fill={cfg.skinColor}
        />
        <rect
          x={px(14)}
          y={px(5)}
          width={px(1)}
          height={px(3)}
          fill={cfg.skinColor}
        />
        {/* Eyes */}
        <rect x={px(3)} y={px(4)} width={px(4)} height={px(4)} fill={WHITE} />
        <rect x={px(5)} y={px(5)} width={px(2)} height={px(2)} fill={DARK} />
        <rect
          x={px(5)}
          y={px(6)}
          width={px(1)}
          height={px(1)}
          fill={WHITE}
          opacity={0.5}
        />
        <rect x={px(9)} y={px(4)} width={px(4)} height={px(4)} fill={WHITE} />
        <rect x={px(11)} y={px(5)} width={px(2)} height={px(2)} fill={DARK} />
        <rect
          x={px(11)}
          y={px(6)}
          width={px(1)}
          height={px(1)}
          fill={WHITE}
          opacity={0.5}
        />
        {/* Mouth */}
        <rect x={px(5)} y={px(10)} width={px(6)} height={px(1)} fill={DARK} />
        <rect x={px(4)} y={px(9)} width={px(1)} height={px(1)} fill={DARK} />
        <rect x={px(11)} y={px(9)} width={px(1)} height={px(1)} fill={DARK} />
        {/* Blush */}
        <rect
          x={px(3)}
          y={px(8)}
          width={px(2)}
          height={px(1)}
          fill={PINK}
          opacity={0.3}
        />
        <rect
          x={px(11)}
          y={px(8)}
          width={px(2)}
          height={px(1)}
          fill={PINK}
          opacity={0.3}
        />
        {/* Accessories */}
        {cfg.accessory === "glasses" && (
          <>
            <rect
              x={px(3)}
              y={px(5)}
              width={px(4)}
              height={px(3)}
              fill="none"
              stroke={DARK}
              strokeWidth={px(0.4)}
            />
            <rect
              x={px(9)}
              y={px(5)}
              width={px(4)}
              height={px(3)}
              fill="none"
              stroke={DARK}
              strokeWidth={px(0.4)}
            />
            <rect
              x={px(7)}
              y={px(6)}
              width={px(2)}
              height={px(1)}
              fill={DARK}
            />
          </>
        )}
        {cfg.accessory === "crown" && (
          <>
            <rect
              x={px(3)}
              y={px(0)}
              width={px(2)}
              height={px(2)}
              fill={YELLOW}
            />
            <rect
              x={px(7)}
              y={px(-1)}
              width={px(2)}
              height={px(3)}
              fill={YELLOW}
            />
            <rect
              x={px(11)}
              y={px(0)}
              width={px(2)}
              height={px(2)}
              fill={YELLOW}
            />
            <rect
              x={px(3)}
              y={px(1)}
              width={px(10)}
              height={px(1)}
              fill={YELLOW}
            />
            <rect x={px(5)} y={px(0)} width={px(1)} height={px(1)} fill={RED} />
            <rect
              x={px(10)}
              y={px(0)}
              width={px(1)}
              height={px(1)}
              fill={BLUE}
            />
          </>
        )}
        {cfg.accessory === "headband" && (
          <>
            <rect
              x={px(1)}
              y={px(3)}
              width={px(14)}
              height={px(2)}
              fill={PINK}
            />
            <rect
              x={px(7)}
              y={px(1)}
              width={px(2)}
              height={px(2)}
              fill={PINK}
            />
          </>
        )}
      </svg>
    </div>
  );
}

const S = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
  .pf{font-family:'Press Start 2P',cursive;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes popIn{0%{opacity:0;transform:scale(0.88)}60%{transform:scale(1.03)}100%{opacity:1;transform:scale(1)}}
  @keyframes scanMove{from{top:-10%}to{top:110%}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes saved{0%{transform:scale(1)}40%{transform:scale(1.06)}100%{transform:scale(1)}}
  @keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-4px)}60%{transform:translateX(4px)}}
  .fade-up{animation:fadeUp .35s ease both}
  .scan-line{animation:scanMove 8s linear infinite}
  .shk{animation:shake .35s ease}
  .s-input{
    background:rgba(8,3,24,.9);border:2px solid #2d1060;color:#e9d5ff;
    padding:12px 14px 12px 34px;font-family:'Press Start 2P',cursive;font-size:9px;
    outline:none;width:100%;box-sizing:border-box;transition:border-color .2s,box-shadow .2s;
  }
  .s-input:focus{border-color:#a855f7;box-shadow:0 0 8px rgba(168,85,247,.25)}
  .s-input::placeholder{color:#2d1060;font-size:8px}
  .s-input.no-icon{padding-left:14px}
  .s-input.changed{border-color:#f59e0b}
  .s-textarea{
    background:rgba(8,3,24,.9);border:2px solid #2d1060;color:#e9d5ff;
    padding:12px 14px 12px 34px;font-family:'Press Start 2P',cursive;font-size:9px;
    line-height:1.8;outline:none;width:100%;box-sizing:border-box;resize:none;transition:border-color .2s;
  }
  .s-textarea:focus{border-color:#a855f7}
  .s-textarea::placeholder{color:#2d1060;font-size:8px}
  .save-btn{
    width:100%;padding:14px;font-family:'Press Start 2P',cursive;font-size:11px;
    cursor:pointer;border:2px solid #22d3ee;background:#0e7490;color:#fff;
    box-shadow:0 0 10px rgba(6,182,212,.25),4px 4px 0 #0e4d6a;
    transition:filter .15s,transform .08s;display:flex;align-items:center;justify-content:center;gap:10px;
  }
  .save-btn:hover:not(:disabled){filter:brightness(1.15)}
  .save-btn:active:not(:disabled){transform:translateY(1px)}
  .save-btn:disabled{opacity:.4;cursor:not-allowed}
  .save-btn.ok{border-color:#22c55e;background:rgba(20,83,45,.7);animation:saved .4s ease}
  .section-card{background:rgba(8,3,24,.7);border:2px solid #1a0a35;padding:18px;margin-bottom:14px;box-shadow:3px 3px 0 #0a0018;position:relative;transition:border-color .2s}
  .section-card:focus-within{border-color:#2d1060}
  .section-card.open{border-color:#2d1060}
  .corner-dot{position:absolute;width:6px;height:6px}
  .toast{position:fixed;bottom:24px;right:24px;z-index:999;padding:10px 16px;border:2px solid;font-family:'Press Start 2P',cursive;font-size:8px;animation:popIn .3s ease both;box-shadow:4px 4px 0 rgba(0,0,0,.4)}
  .toast.ok{background:rgba(20,83,45,.95);border-color:#22c55e;color:#86efac}
  .toast.err{background:rgba(127,29,29,.95);border-color:#ef4444;color:#fca5a5}
  .toggle-row{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border:1px solid #1a0a35;background:rgba(8,3,24,.5);cursor:pointer;transition:border-color .15s}
  .toggle-row:hover{border-color:#2d1060}
  .unsaved-banner{background:rgba(146,64,14,.2);border:2px solid #f59e0b;padding:10px 14px;margin-bottom:14px;display:flex;align-items:center;gap:8px;animation:popIn .2s ease}
  .section-header{display:flex;align-items:center;justify-content:space-between;cursor:pointer;margin-bottom:0}
  .section-header.expanded{margin-bottom:14px}
  .chevron{transition:transform .2s;font-size:10px;color:#4c1d95}
  .chevron.open{transform:rotate(90deg)}
  .lm-root .toggle-track.tt-on  { background-color: #000000 !important; border-color: #000000 !important; }
  .lm-root .toggle-track.tt-off { background-color: #ffffff !important; border-color: #000000 !important; }
  .lm-root .toggle-track.tt-on  > div { background-color: #ffffff !important; }
  .lm-root .toggle-track.tt-off > div { background-color: #000000 !important; }
  .color-chip[data-color] { background: attr(data-color) !important; }
  .color-chip { background: var(--chip-color, #888) !important; }
  .lm-root .color-chip { background: var(--chip-color, #888) !important; }
  .color-chip {
    border: 2px solid #2d1060;
    transition: transform .12s, box-shadow .12s, border-color .12s;
    flex-shrink: 0;
  }
  .swatch-wrap:hover .color-chip { transform: scale(1.1); }
  .swatch-wrap.active .color-chip {
    border-color: #fff !important;
    box-shadow: 0 0 0 2px #7c3aed, 0 0 8px rgba(168,85,247,.4);
  }
  .lm-root .color-chip { background: revert !important; }
  .lm-root .swatch-wrap.active .color-chip { border-color: #7c3aed !important; box-shadow: 0 0 0 2px #a855f7 !important; }
  .swatch-wrap { display:flex; flex-direction:column; align-items:center; gap:4px; cursor:pointer; }
  .swatch-name {
    font-family:'Press Start 2P',cursive; font-size:5px; text-align:center;
    opacity:0; transform:translateY(-2px);
    transition:opacity .15s, transform .15s; pointer-events:none;
    white-space:nowrap;
  }
  .swatch-wrap:hover .swatch-name { opacity:1; transform:translateY(0); }
  .swatch-wrap.active .swatch-name { opacity:1; transform:translateY(0); font-size:6px; }
  .lm-root .avatar-card { background: linear-gradient(135deg,rgba(238,232,255,.6),rgba(255,255,255,.95)) !important; border-color: #7c3aed !important; box-shadow: 3px 3px 0 rgba(124,58,237,.15) !important; }
  .lm-root .avatar-card .acc-btn { background: #ffffff !important; border-color: #d1d5db !important; color: #6b21a8 !important; }
  .lm-root .avatar-card .acc-btn:hover { border-color: #7c3aed !important; }
  .lm-root .avatar-card .acc-btn.active { background: #7c3aed !important; border-color: #a855f7 !important; color: #ffffff !important; }
  .lm-root .avatar-card .avatar-save-btn { background: rgba(124,58,237,.1) !important; border-color: #7c3aed !important; color: #4c1d95 !important; }
  .lm-root .avatar-card .avatar-save-btn.ok { background: rgba(20,83,45,.15) !important; border-color: #22c55e !important; color: #166534 !important; }
  .lm-root .avatar-card .glowPulse-ref { animation: none !important; box-shadow: 0 2px 8px rgba(124,58,237,.15) !important; }
  @keyframes avatarFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
  @keyframes glowPulse{0%,100%{box-shadow:0 0 10px rgba(168,85,247,.25)}50%{box-shadow:0 0 24px rgba(168,85,247,.5)}}
  .avatar-card{animation:glowPulse 2.5s ease-in-out infinite;}
  .swatch{cursor:pointer;transition:transform .12s,box-shadow .12s;border:2px solid #2d1060;}
  .swatch:hover{transform:scale(1.18);}
  .swatch.active{transform:scale(1.22);border-color:#fff !important;box-shadow:0 0 0 2px #7c3aed;}
  .acc-btn{
    font-family:'Press Start 2P',cursive;font-size:7px;padding:7px 10px;
    cursor:pointer;border:2px solid #2d1060;background:rgba(8,3,24,.9);color:#7c3aed;
    transition:background .15s,border-color .15s,color .15s;
  }
  .acc-btn:hover{border-color:#4c1d95;}
  .acc-btn.active{background:#4c1d95;border-color:#c084fc;color:#fff;}
  .avatar-save-btn{
    width:100%;padding:11px;font-family:'Press Start 2P',cursive;font-size:9px;
    cursor:pointer;border:2px solid #a855f7;background:rgba(76,29,149,.3);color:#c4b5fd;
    transition:filter .15s,transform .08s,background .2s,border-color .2s;
    display:flex;align-items:center;justify-content:center;gap:8px;
  }
  .avatar-save-btn:hover{filter:brightness(1.15);}
  .avatar-save-btn:active{transform:translateY(1px);}
  .avatar-save-btn.ok{border-color:#22c55e;background:rgba(20,83,45,.7);color:#86efac;animation:saved .4s ease}
`;

type FieldProps = {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
};
function Field({ label, icon, children, delay = 0 }: FieldProps) {
  return (
    <div className="fade-up" style={{ animationDelay: `${delay}ms` }}>
      <div
        className="pf"
        style={{ fontSize: 7, color: "#4c1d95", marginBottom: 6 }}
      >
        {label}
      </div>
      <div style={{ position: "relative" }}>
        <div
          style={{
            position: "absolute",
            left: 11,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 1,
          }}
        >
          {icon}
        </div>
        {children}
      </div>
    </div>
  );
}

type SettingsProps = {
  lightMode?: boolean;
  onToggleLightMode?: () => void;
};

const Settings: React.FC<SettingsProps> = ({
  lightMode = false,
  onToggleLightMode,
}) => {
  // Avatar
  const [avatarCfg, setAvatarCfg] = useState<AvatarCfg>(loadAvatarLocal);
  const [avatarSaved, setAvatarSaved] = useState(false);
  const [coins] = useState(loadCoinsLocal);
  function handleSaveAvatar() {
    saveAvatarLocal(avatarCfg);
    setAvatarSaved(true);
    setTimeout(() => setAvatarSaved(false), 2200);
    toast$("AVATAR SAVED!", "ok");
  }
  // Profile fields
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [age, setAge] = useState("");
  const [school, setSchool] = useState("");
  const [bio, setBio] = useState("");
  // Original values for dirty detection
  const [orig, setOrig] = useState({
    username: "",
    email: "",
    displayName: "",
    age: "",
    school: "",
    bio: "",
  });
  // Password change
  const [showPwSection, setShowPwSection] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrPw, setShowCurrPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwShake, setPwShake] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  // Notifications
  const [notifFriendReq, setNotifFriendReq] = useState(true);
  const [notifGroupInvite, setNotifGroupInvite] = useState(true);
  const [notifGameInvite, setNotifGameInvite] = useState(true);
  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "ok" | "err";
  } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const toast$ = (msg: string, type: "ok" | "err") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const isDirty =
    username !== orig.username ||
    email !== orig.email ||
    displayName !== orig.displayName ||
    age !== orig.age ||
    school !== orig.school ||
    bio !== orig.bio;

  async function loadSettings() {
    try {
      const user = await getCurrentUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data: p } = await supabase
        .from("users")
        .select(
          "username,email,display_name,age,school,bio,notifications,avatar_config",
        )
        .eq("id", user.id)
        .maybeSingle();
      if (p) {
        const vals = {
          username: p.username || "",
          email: p.email || "",
          displayName: p.display_name || "",
          age: p.age != null ? p.age.toString() : "",
          school: p.school || "",
          bio: p.bio || "",
        };
        setUsername(vals.username);
        setEmail(vals.email);
        setDisplayName(vals.displayName);
        setAge(vals.age);
        setSchool(vals.school);
        setBio(vals.bio);
        setOrig(vals);
        const notifs = p.notifications || {};
        if (notifs.friend_requests !== undefined)
          setNotifFriendReq(notifs.friend_requests);
        if (notifs.group_invites !== undefined)
          setNotifGroupInvite(notifs.group_invites);
        if (notifs.game_invites !== undefined)
          setNotifGameInvite(notifs.game_invites);
        if (p.avatar_config) {
          setAvatarCfg(p.avatar_config);
          saveAvatarLocal(p.avatar_config);
        }
      }
    } catch {
      toast$("ERROR LOADING SETTINGS", "err");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!username.trim()) {
      toast$("USERNAME REQUIRED", "err");
      return;
    }
    if (!email.trim()) {
      toast$("EMAIL REQUIRED", "err");
      return;
    }
    const parsedAge = age ? parseInt(age, 10) : null;
    if (age && isNaN(parsedAge!)) {
      toast$("INVALID AGE", "err");
      return;
    }
    setSaving(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        toast$("LOGIN REQUIRED", "err");
        return;
      }
      const { error } = await supabase
        .from("users")
        .update({
          username: username.trim(),
          email: email.trim(),
          display_name: displayName.trim() || null,
          age: parsedAge,
          school: school.trim() || null,
          bio: bio.trim() || null,
          avatar_config: avatarCfg,
          notifications: {
            friend_requests: notifFriendReq,
            group_invites: notifGroupInvite,
            game_invites: notifGameInvite,
          },
        })
        .eq("id", user.id);
      if (error) throw error;
      setOrig({
        username: username.trim(),
        email: email.trim(),
        displayName: displayName.trim(),
        age,
        school: school.trim(),
        bio: bio.trim(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast$("SETTINGS SAVED!", "ok");
    } catch {
      toast$("SAVE FAILED", "err");
    } finally {
      setSaving(false);
    }
  }

  // ─── FIXED: handleChangePassword using re-auth ────────────────────────────
  async function handleChangePassword() {
    if (!currentPw || !newPw || !confirmPw) {
      setPwShake(true);
      setTimeout(() => setPwShake(false), 400);
      toast$("FILL ALL PASSWORD FIELDS", "err");
      return;
    }
    if (newPw.length < 8) {
      toast$("PASSWORD TOO SHORT (8+ CHARS)", "err");
      return;
    }
    if (newPw !== confirmPw) {
      setPwShake(true);
      setTimeout(() => setPwShake(false), 400);
      toast$("PASSWORDS DO NOT MATCH", "err");
      return;
    }
    setChangingPw(true);
    try {
      // Step 1: verify current password by re-authenticating
      const user = await getCurrentUser();
      if (!user?.email) {
        toast$("SESSION EXPIRED - RELOGIN", "err");
        return;
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPw,
      });
      if (signInError) {
        setPwShake(true);
        setTimeout(() => setPwShake(false), 400);
        toast$("CURRENT PASSWORD INCORRECT", "err");
        return;
      }

      // Step 2: update to the new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPw,
      });
      if (updateError) throw updateError;

      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setShowPwSection(false);
      toast$("PASSWORD CHANGED!", "ok");
    } catch (e: any) {
      const msg: string = e?.message || "";
      if (
        msg.toLowerCase().includes("weak") ||
        msg.toLowerCase().includes("strength")
      ) {
        toast$("PASSWORD TOO WEAK", "err");
      } else if (
        msg.toLowerCase().includes("session") ||
        msg.toLowerCase().includes("no user")
      ) {
        toast$("SESSION EXPIRED - RELOGIN", "err");
      } else {
        toast$(
          msg ? `ERR: ${msg.slice(0, 18).toUpperCase()}` : "CHANGE FAILED",
          "err",
        );
      }
    } finally {
      setChangingPw(false);
    }
  }

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 48,
        }}
      >
        <style>{S}</style>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 24,
              height: 24,
              border: "3px solid #7c3aed",
              borderTopColor: "transparent",
              margin: "0 auto 12px",
              animation: "spin 1s linear infinite",
            }}
          />
          <div className="pf" style={{ fontSize: 8, color: "#4c1d95" }}>
            LOADING...
          </div>
        </div>
      </div>
    );

  return (
    <div style={{ width: "100%" }}>
      <style>{S}</style>
      <div
        className="scan-line"
        style={{
          position: "fixed",
          left: 0,
          width: "100%",
          height: 12,
          background:
            "linear-gradient(transparent,rgba(168,85,247,.03),transparent)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === "ok" ? "✓ " : "⚠ "}
          {toast.msg}
        </div>
      )}

      <div
        className="fade-up"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 20,
        }}
      >
        <SettingsIcon size={16} color={lightMode ? "#7c3aed" : "#a855f7"} />
        <span
          className="pf"
          style={{ fontSize: 14, color: lightMode ? "#4c1d95" : "#c084fc" }}
        >
          SETTINGS
        </span>
      </div>

      {/* ═══ AVATAR PROFILE CARD ═══ */}
      <div
        className="section-card avatar-card"
        style={{
          borderColor: lightMode ? "#7c3aed" : "#4c1d95",
          background: lightMode
            ? "linear-gradient(135deg,rgba(238,232,255,.6),rgba(255,255,255,.95))"
            : "linear-gradient(135deg,rgba(76,29,149,.2),rgba(8,3,24,.9))",
          marginBottom: 20,
        }}
      >
        <div
          className="corner-dot"
          style={{ top: 0, left: 0, background: "#a855f7" }}
        />
        <div
          className="corner-dot"
          style={{ top: 0, right: 0, background: "#a855f7" }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          <div style={{ position: "relative", flexShrink: 0 }}>
            <MiniAvatar cfg={avatarCfg} size={90} />
            <div
              style={{
                position: "absolute",
                bottom: -10,
                left: "50%",
                transform: "translateX(-50%)",
                width: 65,
                height: 10,
                borderRadius: "50%",
                background: lightMode
                  ? "rgba(124,58,237,.15)"
                  : "rgba(168,85,247,.3)",
                filter: "blur(6px)",
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <div
              className="pf"
              style={{
                fontSize: 12,
                color: lightMode ? "#1e0a35" : "#e9d5ff",
                marginBottom: 6,
                lineHeight: 1.4,
              }}
            >
              {displayName || username || "PLAYER"}
            </div>
            {displayName && username && (
              <div
                className="pf"
                style={{
                  fontSize: 7,
                  color: lightMode ? "#6b21a8" : "#4c1d95",
                  marginBottom: 10,
                }}
              >
                @{username}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "5px 9px",
                  background: lightMode
                    ? "rgba(161,98,7,.08)"
                    : "rgba(250,204,21,.08)",
                  border: lightMode
                    ? "1px solid rgba(161,98,7,.3)"
                    : "1px solid rgba(250,204,21,.2)",
                }}
              >
                <span style={{ fontSize: 11 }}>🪙</span>
                <span
                  className="pf"
                  style={{
                    fontSize: 8,
                    color: lightMode ? "#92400e" : "#facc15",
                  }}
                >
                  {coins.toLocaleString()}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "5px 9px",
                  background: lightMode
                    ? "rgba(124,58,237,.08)"
                    : "rgba(168,85,247,.08)",
                  border: lightMode
                    ? "1px solid rgba(124,58,237,.25)"
                    : "1px solid rgba(168,85,247,.2)",
                }}
              >
                <span style={{ fontSize: 11 }}>🎮</span>
                <span
                  className="pf"
                  style={{
                    fontSize: 7,
                    color: lightMode ? "#4c1d95" : "#a855f7",
                  }}
                >
                  PLAYER
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: lightMode ? "1px solid #e5e7eb" : "1px solid #2d1060",
            marginBottom: 18,
          }}
        />

        {/* Hair color */}
        <div style={{ marginBottom: 16 }}>
          <div
            className="pf"
            style={{
              fontSize: 7,
              color: lightMode ? "#4c1d95" : "#6b21a8",
              marginBottom: 10,
            }}
          >
            HAIR COLOR
          </div>
          <div
            className="pf"
            style={{
              fontSize: 7,
              color: lightMode ? "#7c3aed" : "#a855f7",
              marginBottom: 8,
              minHeight: 14,
            }}
          >
            {HAIR_COLORS.find((h) => h.hex === avatarCfg.hairColor)?.name || ""}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {HAIR_COLORS.map(({ hex, name }) => (
              <div
                key={hex}
                className={`swatch-wrap ${avatarCfg.hairColor === hex ? "active" : ""}`}
                onClick={() => setAvatarCfg((a) => ({ ...a, hairColor: hex }))}
                title={name}
              >
                <div
                  className="color-chip"
                  style={{
                    width: 30,
                    height: 30,
                    ["--chip-color" as any]: hex,
                    backgroundColor: hex,
                    background: hex,
                    borderColor:
                      avatarCfg.hairColor === hex
                        ? lightMode
                          ? "#7c3aed"
                          : "#fff"
                        : lightMode
                          ? "#d1d5db"
                          : "#2d1060",
                    boxShadow:
                      avatarCfg.hairColor === hex
                        ? `0 0 0 2px ${lightMode ? "#a855f7" : "#7c3aed"}, 0 0 8px rgba(168,85,247,.4)`
                        : "none",
                  }}
                />
                <span
                  className="swatch-name"
                  style={{ color: lightMode ? "#4c1d95" : "#c084fc" }}
                >
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Skin tone */}
        <div style={{ marginBottom: 16 }}>
          <div
            className="pf"
            style={{
              fontSize: 7,
              color: lightMode ? "#4c1d95" : "#6b21a8",
              marginBottom: 10,
            }}
          >
            SKIN TONE
          </div>
          <div
            className="pf"
            style={{
              fontSize: 7,
              color: lightMode ? "#7c3aed" : "#a855f7",
              marginBottom: 8,
              minHeight: 14,
            }}
          >
            {SKIN_TONES.find((s) => s.hex === avatarCfg.skinColor)?.name || ""}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {SKIN_TONES.map(({ hex, name }) => (
              <div
                key={hex}
                className={`swatch-wrap ${avatarCfg.skinColor === hex ? "active" : ""}`}
                onClick={() => setAvatarCfg((a) => ({ ...a, skinColor: hex }))}
                title={name}
              >
                <div
                  className="color-chip"
                  style={{
                    width: 38,
                    height: 38,
                    ["--chip-color" as any]: hex,
                    backgroundColor: hex,
                    background: hex,
                    borderColor:
                      avatarCfg.skinColor === hex
                        ? lightMode
                          ? "#7c3aed"
                          : "#fff"
                        : lightMode
                          ? "#d1d5db"
                          : "#2d1060",
                    boxShadow:
                      avatarCfg.skinColor === hex
                        ? `0 0 0 2px ${lightMode ? "#a855f7" : "#7c3aed"}, 0 0 8px rgba(168,85,247,.4)`
                        : "none",
                  }}
                />
                <span
                  className="swatch-name"
                  style={{ color: lightMode ? "#4c1d95" : "#c084fc" }}
                >
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Accessory */}
        <div style={{ marginBottom: 20 }}>
          <div
            className="pf"
            style={{
              fontSize: 7,
              color: lightMode ? "#4c1d95" : "#6b21a8",
              marginBottom: 10,
            }}
          >
            ACCESSORY
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {ACCESSORIES.map((acc) => (
              <button
                key={acc}
                type="button"
                className={`acc-btn ${avatarCfg.accessory === acc ? "active" : ""}`}
                onClick={() => setAvatarCfg((a) => ({ ...a, accessory: acc }))}
              >
                {acc === "none"
                  ? "NONE"
                  : acc === "glasses"
                    ? "👓 GLASSES"
                    : acc === "crown"
                      ? "👑 CROWN"
                      : "🎀 HEADBAND"}
              </button>
            ))}
          </div>
        </div>

        <button
          className={`avatar-save-btn ${avatarSaved ? "ok" : ""}`}
          onClick={handleSaveAvatar}
        >
          {avatarSaved ? (
            <>
              <Check size={11} /> AVATAR SAVED!
            </>
          ) : (
            <>
              <Save size={11} /> SAVE AVATAR
            </>
          )}
        </button>
      </div>

      {/* Unsaved changes banner */}
      {isDirty && (
        <div className="unsaved-banner">
          <div style={{ width: 6, height: 6, background: "#f59e0b" }} />
          <span className="pf" style={{ fontSize: 7, color: "#fde68a" }}>
            UNSAVED CHANGES
          </span>
        </div>
      )}

      {/* Account section */}
      <div className="section-card">
        <div
          className="corner-dot"
          style={{ top: 0, left: 0, background: "#7c3aed" }}
        />
        <div
          className="pf"
          style={{ fontSize: 7, color: "#2d1060", marginBottom: 14 }}
        >
          ◆ ACCOUNT INFO
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field
            label="USERNAME *"
            icon={<User size={11} color="#3b1d6a" />}
            delay={60}
          >
            <input
              className={`s-input ${username !== orig.username ? "changed" : ""}`}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </Field>
          <Field
            label="EMAIL *"
            icon={<Mail size={11} color="#3b1d6a" />}
            delay={90}
          >
            <input
              className={`s-input ${email !== orig.email ? "changed" : ""}`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </Field>
          <Field
            label="DISPLAY NAME"
            icon={<User size={11} color="#3b1d6a" />}
            delay={120}
          >
            <input
              className={`s-input ${displayName !== orig.displayName ? "changed" : ""}`}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="OPTIONAL"
            />
          </Field>
        </div>
      </div>

      {/* Personal section */}
      <div className="section-card">
        <div
          className="corner-dot"
          style={{ top: 0, left: 0, background: "#38bdf8" }}
        />
        <div
          className="pf"
          style={{ fontSize: 7, color: "#2d1060", marginBottom: 14 }}
        >
          ◆ PERSONAL INFO
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field
            label="AGE"
            icon={<Hash size={11} color="#3b1d6a" />}
            delay={150}
          >
            <input
              className={`s-input ${age !== orig.age ? "changed" : ""}`}
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="YOUR AGE"
              min={1}
              max={120}
            />
          </Field>
          <Field
            label="SCHOOL"
            icon={<School size={11} color="#3b1d6a" />}
            delay={180}
          >
            <input
              className={`s-input ${school !== orig.school ? "changed" : ""}`}
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="YOUR SCHOOL"
            />
          </Field>
          <div className="fade-up" style={{ animationDelay: "210ms" }}>
            <div
              className="pf"
              style={{ fontSize: 7, color: "#4c1d95", marginBottom: 6 }}
            >
              BIO
            </div>
            <div style={{ position: "relative" }}>
              <div
                style={{ position: "absolute", left: 11, top: 13, zIndex: 1 }}
              >
                <BookOpen size={11} color="#3b1d6a" />
              </div>
              <textarea
                className={`s-textarea ${bio !== orig.bio ? "changed" : ""}`}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="TELL US ABOUT YOURSELF..."
                style={{
                  borderColor: bio !== orig.bio ? "#f59e0b" : undefined,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notifications section */}
      <div className="section-card">
        <div
          className="corner-dot"
          style={{ top: 0, left: 0, background: "#4ade80" }}
        />
        <div
          className="pf"
          style={{ fontSize: 7, color: "#2d1060", marginBottom: 14 }}
        >
          ◆ NOTIFICATIONS
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            {
              label: "FRIEND REQUESTS",
              val: notifFriendReq,
              set: setNotifFriendReq,
            },
            {
              label: "GROUP INVITES",
              val: notifGroupInvite,
              set: setNotifGroupInvite,
            },
            {
              label: "GAME INVITES",
              val: notifGameInvite,
              set: setNotifGameInvite,
            },
          ].map(({ label, val, set }) => (
            <div
              key={label}
              className="toggle-row"
              onClick={() => set((v) => !v)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {val ? (
                  <Bell size={11} color={lightMode ? "#000000" : "#4ade80"} />
                ) : (
                  <BellOff
                    size={11}
                    color={lightMode ? "#9ca3af" : "#374151"}
                  />
                )}
                <span
                  className="pf"
                  style={{
                    fontSize: 8,
                    color: val
                      ? lightMode
                        ? "#000000"
                        : "#d1fae5"
                      : lightMode
                        ? "#9ca3af"
                        : "#374151",
                  }}
                >
                  {label}
                </span>
              </div>
              <div
                className={`toggle-track ${val ? "tt-on" : "tt-off"}`}
                style={{
                  width: 34,
                  height: 18,
                  background: val
                    ? lightMode
                      ? "#000000"
                      : "#065f46"
                    : lightMode
                      ? "#ffffff"
                      : "#1a0a35",
                  border: `2px solid ${val ? (lightMode ? "#000000" : "#22c55e") : lightMode ? "#000000" : "#2d1060"}`,
                  position: "relative",
                  transition: "all .2s",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 2,
                    left: val ? 14 : 2,
                    width: 10,
                    height: 10,
                    background: val
                      ? lightMode
                        ? "#ffffff"
                        : "#22c55e"
                      : lightMode
                        ? "#000000"
                        : "#3b1d6a",
                    transition: "left .2s",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Appearance section */}
      <div
        className="section-card"
        style={{ borderColor: lightMode ? "#000000" : "#1a0a35" }}
      >
        <div
          className="corner-dot"
          style={{ top: 0, left: 0, background: "#fbbf24" }}
        />
        <div
          className="corner-dot"
          style={{ top: 0, right: 0, background: "#818cf8" }}
        />
        <div
          className="pf"
          style={{ fontSize: 7, color: "#2d1060", marginBottom: 14 }}
        >
          ◆ APPEARANCE
        </div>
        <div
          className="toggle-row"
          onClick={onToggleLightMode}
          style={{ cursor: "pointer" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 20,
                height: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
              }}
            >
              {lightMode ? "☀️" : "🌙"}
            </div>
            <div>
              <div
                className="pf"
                style={{
                  fontSize: 8,
                  color: lightMode ? "#000000" : "#818cf8",
                  marginBottom: 3,
                }}
              >
                {lightMode ? "LIGHT MODE" : "DARK MODE"}
              </div>
              <div className="pf" style={{ fontSize: 6, color: "#4c1d95" }}>
                {lightMode ? "BRIGHT & CLEAN THEME" : "EASY ON THE EYES THEME"}
              </div>
            </div>
          </div>
          <div
            className={`toggle-track ${lightMode ? "tt-on" : "tt-off"}`}
            style={{
              width: 44,
              height: 22,
              background: lightMode ? "#000000" : "#1a0a35",
              border: `2px solid ${lightMode ? "#000000" : "#4c1d95"}`,
              position: "relative",
              transition: "background .25s, border-color .25s",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: lightMode
                  ? "linear-gradient(90deg,#000000,#374151)"
                  : "linear-gradient(90deg,#1a0a35,#2d1060)",
                transition: "background .25s",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 3,
                left: lightMode ? 22 : 3,
                width: 12,
                height: 12,
                background: lightMode ? "#ffffff" : "#4c1d95",
                transition: "left .22s cubic-bezier(0.4,0,0.2,1)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Password section */}
      <div
        className="section-card"
        style={{ borderColor: showPwSection ? "#ef4444" : "#1a0a35" }}
      >
        <div
          className="corner-dot"
          style={{ top: 0, left: 0, background: "#ef4444" }}
        />
        <div
          className={`section-header ${showPwSection ? "expanded" : ""}`}
          onClick={() => setShowPwSection((v) => !v)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Lock size={11} color="#f87171" />
            <span className="pf" style={{ fontSize: 7, color: "#f87171" }}>
              ◆ CHANGE PASSWORD
            </span>
          </div>
          <span className={`chevron ${showPwSection ? "open" : ""}`}>▶</span>
        </div>

        {showPwSection && (
          <div
            className={`fade-up ${pwShake ? "shk" : ""}`}
            style={{ display: "flex", flexDirection: "column", gap: 10 }}
          >
            {/* Current Password */}
            <div>
              <div
                className="pf"
                style={{ fontSize: 7, color: "#4c1d95", marginBottom: 6 }}
              >
                CURRENT PASSWORD
              </div>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    left: 11,
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 1,
                  }}
                >
                  <Lock size={11} color="#3b1d6a" />
                </div>
                <input
                  className="s-input"
                  type={showCurrPw ? "text" : "password"}
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{ paddingRight: 36 }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrPw((v) => !v)}
                  style={{
                    position: "absolute",
                    right: 11,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#4c1d95",
                    padding: 0,
                    display: "flex",
                  }}
                >
                  {showCurrPw ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <div
                className="pf"
                style={{ fontSize: 7, color: "#4c1d95", marginBottom: 6 }}
              >
                NEW PASSWORD (8+ CHARS)
              </div>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    left: 11,
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 1,
                  }}
                >
                  <Lock size={11} color="#3b1d6a" />
                </div>
                <input
                  className="s-input"
                  type={showNewPw ? "text" : "password"}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  style={{ paddingRight: 36 }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw((v) => !v)}
                  style={{
                    position: "absolute",
                    right: 11,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#4c1d95",
                    padding: 0,
                    display: "flex",
                  }}
                >
                  {showNewPw ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <div
                className="pf"
                style={{ fontSize: 7, color: "#4c1d95", marginBottom: 6 }}
              >
                CONFIRM NEW PASSWORD
              </div>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    left: 11,
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 1,
                  }}
                >
                  <Lock size={11} color="#3b1d6a" />
                </div>
                <input
                  className="s-input"
                  type={showConfirmPw ? "text" : "password"}
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  style={{ paddingRight: 36 }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw((v) => !v)}
                  style={{
                    position: "absolute",
                    right: 11,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#4c1d95",
                    padding: 0,
                    display: "flex",
                  }}
                >
                  {showConfirmPw ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
              </div>
            </div>

            {/* Password strength indicator */}
            {newPw && (
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                {[4, 6, 8, 12].map((len, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: 4,
                      background:
                        newPw.length >= len
                          ? ["#ef4444", "#f59e0b", "#22c55e", "#22d3ee"][i]
                          : "#1a0a35",
                      transition: "background .2s",
                    }}
                  />
                ))}
                <span
                  className="pf"
                  style={{
                    fontSize: 6,
                    color: "#4c1d95",
                    whiteSpace: "nowrap",
                  }}
                >
                  {newPw.length < 4
                    ? "WEAK"
                    : newPw.length < 6
                      ? "FAIR"
                      : newPw.length < 8
                        ? "GOOD"
                        : "STRONG"}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={handleChangePassword}
              disabled={changingPw}
              style={{
                padding: "10px",
                background: "rgba(127,29,29,.4)",
                border: "2px solid #ef4444",
                color: "#f87171",
                cursor: "pointer",
                fontFamily: "'Press Start 2P',cursive",
                fontSize: 9,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "filter .15s",
              }}
            >
              {changingPw ? (
                <>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      border: "2px solid #fff",
                      borderTopColor: "transparent",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  CHANGING...
                </>
              ) : (
                <>
                  <Lock size={10} /> CHANGE PASSWORD
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Save */}
      <div className="fade-up" style={{ animationDelay: "240ms" }}>
        <button
          className={`save-btn ${saved ? "ok" : ""}`}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <div
                style={{
                  width: 10,
                  height: 10,
                  border: "2px solid #fff",
                  borderTopColor: "transparent",
                  animation: "spin 1s linear infinite",
                }}
              />
              SAVING...
            </>
          ) : saved ? (
            <>
              <Check size={13} /> SAVED!
            </>
          ) : (
            <>
              <Save size={13} /> {isDirty ? "SAVE CHANGES ●" : "SAVE SETTINGS"}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Settings;
