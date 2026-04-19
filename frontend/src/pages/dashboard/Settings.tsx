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
import { AVATAR_IMAGES } from "..//..//assets/AvatarImages";

// ─── AVATAR TYPES & CONSTANTS ─────────────────────────────────────────────────
type AvatarGender = "female" | "male";
type AvatarChar = "1" | "2" | "3" | "4";
type AvatarColor =
  | "purple"
  | "sky"
  | "pink"
  | "red"
  | "mint"
  | "gold"
  | "white"
  | "black";

type AvatarCfg = {
  gender: AvatarGender;
  char: AvatarChar;
  color: AvatarColor;
};

const HAIR_COLORS: { key: AvatarColor; hex: string; name: string }[] = [
  { key: "purple", hex: "#a855f7", name: "PURPLE" },
  { key: "sky", hex: "#38bdf8", name: "SKY" },
  { key: "pink", hex: "#f472b6", name: "PINK" },
  { key: "red", hex: "#ef4444", name: "RED" },
  { key: "mint", hex: "#4ade80", name: "MINT" },
  { key: "gold", hex: "#facc15", name: "GOLD" },
  { key: "white", hex: "#f5f5f5", name: "WHITE" },
  { key: "black", hex: "#1a0820", name: "BLACK" },
];

const DEFAULT_AVATAR: AvatarCfg = {
  gender: "female",
  char: "1",
  color: "purple",
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

// ─── AVATAR IMAGE LOOKUP ──────────────────────────────────────────────────────
function getAvatarSrc(cfg: AvatarCfg, mood: "happy" | "sad" = "happy"): string {
  const charData = (AVATAR_IMAGES as any)[cfg.gender]?.[cfg.char];
  if (!charData) return "";
  const moodData =
    charData[mood] ?? charData[mood === "happy" ? "sad" : "happy"] ?? {};
  return moodData[cfg.color] ?? charData.base ?? "";
}

// ─── AVATAR IMAGE COMPONENT ───────────────────────────────────────────────────
function AvatarImg({
  cfg,
  size = 90,
  mood = "happy",
}: {
  cfg: AvatarCfg;
  size?: number;
  mood?: "happy" | "sad";
}) {
  const src = getAvatarSrc(cfg, mood);
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "avatarFloat 2.5s ease-in-out infinite",
        flexShrink: 0,
      }}
    >
      {src ? (
        <img
          src={src}
          alt={`${cfg.gender} ${cfg.char} ${mood}`}
          style={{
            width: size,
            height: size,
            imageRendering: "pixelated",
            objectFit: "contain",
          }}
        />
      ) : (
        <div
          style={{
            width: size,
            height: size,
            background: "rgba(76,29,149,.2)",
            border: "2px solid #4c1d95",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
          }}
        >
          👤
        </div>
      )}
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
  .color-chip{
    border:2px solid #2d1060;
    transition:transform .12s,box-shadow .12s,border-color .12s;
    flex-shrink:0;
  }
  .swatch-wrap{display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;}
  .swatch-wrap:hover .color-chip{transform:scale(1.1);}
  .swatch-wrap.active .color-chip{
    border-color:#fff !important;
    box-shadow:0 0 0 2px #7c3aed,0 0 8px rgba(168,85,247,.4);
  }
  .swatch-name{
    font-family:'Press Start 2P',cursive;font-size:5px;text-align:center;
    opacity:0;transform:translateY(-2px);
    transition:opacity .15s,transform .15s;pointer-events:none;white-space:nowrap;
  }
  .swatch-wrap:hover .swatch-name{opacity:1;transform:translateY(0);}
  .swatch-wrap.active .swatch-name{opacity:1;transform:translateY(0);font-size:6px;}
  .char-btn{
    border:2px solid #2d1060;background:rgba(8,3,24,.9);
    cursor:pointer;transition:border-color .15s,background .15s;
    padding:4px;display:flex;align-items:center;justify-content:center;
  }
  .char-btn:hover{border-color:#4c1d95;}
  .char-btn.active{border-color:#a855f7;background:rgba(76,29,149,.3);box-shadow:0 0 8px rgba(168,85,247,.3);}
  .gender-btn{
    font-family:'Press Start 2P',cursive;font-size:8px;padding:8px 14px;
    cursor:pointer;border:2px solid #2d1060;background:rgba(8,3,24,.9);color:#7c3aed;
    transition:background .15s,border-color .15s,color .15s;flex:1;
  }
  .gender-btn:hover{border-color:#4c1d95;}
  .gender-btn.active{background:#4c1d95;border-color:#c084fc;color:#fff;}
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
  @keyframes avatarFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
  @keyframes glowPulse{0%,100%{box-shadow:0 0 10px rgba(168,85,247,.25)}50%{box-shadow:0 0 24px rgba(168,85,247,.5)}}
  .avatar-card{animation:glowPulse 2.5s ease-in-out infinite;}
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

const Settings: React.FC<{
  lightMode?: boolean;
  onToggleLightMode?: () => void;
}> = ({ lightMode = false, onToggleLightMode }) => {
  const [avatarCfg, setAvatarCfg] = useState<AvatarCfg>(loadAvatarLocal);
  const [avatarSaved, setAvatarSaved] = useState(false);
  const [coins] = useState(loadCoinsLocal);

  // Profile fields
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [age, setAge] = useState("");
  const [school, setSchool] = useState("");
  const [bio, setBio] = useState("");
  const [orig, setOrig] = useState({
    username: "",
    email: "",
    displayName: "",
    age: "",
    school: "",
    bio: "",
  });

  // UI state
  const [showPwSection, setShowPwSection] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrPw, setShowCurrPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwShake, setPwShake] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [notifFriendReq, setNotifFriendReq] = useState(true);
  const [notifGroupInvite, setNotifGroupInvite] = useState(true);
  const [notifGameInvite, setNotifGameInvite] = useState(true);
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
        if (p.notifications) {
          setNotifFriendReq(p.notifications.friend_requests ?? true);
          setNotifGroupInvite(p.notifications.group_invites ?? true);
          setNotifGameInvite(p.notifications.game_invites ?? true);
        }
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

  // FIXED: This now saves to Supabase as well as local storage
  async function handleSaveAvatar() {
    setAvatarSaved(false);
    try {
      const user = await getCurrentUser();
      if (!user) {
        toast$("LOGIN REQUIRED", "err");
        return;
      }

      // Update Database
      const { error } = await supabase
        .from("users")
        .update({ avatar_config: avatarCfg })
        .eq("id", user.id);

      if (error) throw error;

      // Update Local
      saveAvatarLocal(avatarCfg);
      setAvatarSaved(true);
      setTimeout(() => setAvatarSaved(false), 2200);
      toast$("AVATAR SAVED!", "ok");
    } catch {
      toast$("AVATAR SAVE FAILED", "err");
    }
  }

  async function handleSave() {
    if (!username.trim() || !email.trim()) {
      toast$("REQUIRED FIELDS MISSING", "err");
      return;
    }
    setSaving(true);
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error();
      const { error } = await supabase
        .from("users")
        .update({
          username: username.trim(),
          email: email.trim(),
          display_name: displayName.trim() || null,
          age: age ? parseInt(age, 10) : null,
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
      setOrig({ username, email, displayName, age, school, bio });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast$("SETTINGS SAVED!", "ok");
    } catch {
      toast$("SAVE FAILED", "err");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!currentPw || !newPw || confirmPw !== newPw) {
      setPwShake(true);
      setTimeout(() => setPwShake(false), 400);
      toast$("INVALID PASSWORD INPUT", "err");
      return;
    }
    setChangingPw(true);
    try {
      const user = await getCurrentUser();
      if (!user?.email) throw new Error();
      const { error: authErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPw,
      });
      if (authErr) throw authErr;
      const { error: upErr } = await supabase.auth.updateUser({
        password: newPw,
      });
      if (upErr) throw upErr;
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setShowPwSection(false);
      toast$("PASSWORD UPDATED!", "ok");
    } catch {
      toast$("AUTH ERROR", "err");
    } finally {
      setChangingPw(false);
    }
  }

  const availableColors = HAIR_COLORS.filter(({ key }) => {
    const charData = (AVATAR_IMAGES as any)[avatarCfg.gender]?.[avatarCfg.char];
    return charData?.happy?.[key] || charData?.sad?.[key];
  });

  function setCharSafe(char: AvatarChar) {
    setAvatarCfg((prev) => {
      const moodData = (AVATAR_IMAGES as any)[prev.gender]?.[char];
      const colors = HAIR_COLORS.filter(
        ({ key }) => moodData?.happy?.[key] || moodData?.sad?.[key],
      );
      const colorAvailable = colors.some((c) => c.key === prev.color);
      return {
        ...prev,
        char,
        color: colorAvailable ? prev.color : (colors[0]?.key ?? prev.color),
      };
    });
  }

  function setGenderSafe(gender: AvatarGender) {
    setAvatarCfg((prev) => {
      const moodData = (AVATAR_IMAGES as any)[gender]?.[prev.char];
      const colors = HAIR_COLORS.filter(
        ({ key }) => moodData?.happy?.[key] || moodData?.sad?.[key],
      );
      const colorAvailable = colors.some((c) => c.key === prev.color);
      return {
        ...prev,
        gender,
        color: colorAvailable ? prev.color : (colors[0]?.key ?? prev.color),
      };
    });
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
            <AvatarImg cfg={avatarCfg} size={90} mood="happy" />
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
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: lightMode ? "1px solid #e5e7eb" : "1px solid #2d1060",
            marginBottom: 18,
          }}
        />

        <div style={{ marginBottom: 16 }}>
          <div
            className="pf"
            style={{
              fontSize: 7,
              color: lightMode ? "#4c1d95" : "#6b21a8",
              marginBottom: 10,
            }}
          >
            GENDER
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {(["female", "male"] as AvatarGender[]).map((g) => (
              <button
                key={g}
                type="button"
                className={`gender-btn ${avatarCfg.gender === g ? "active" : ""}`}
                onClick={() => setGenderSafe(g)}
              >
                {g === "female" ? "👧 GIRL" : "👦 BOY"}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div
            className="pf"
            style={{
              fontSize: 7,
              color: lightMode ? "#4c1d95" : "#6b21a8",
              marginBottom: 10,
            }}
          >
            CHARACTER STYLE
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(["1", "2", "3", "4"] as AvatarChar[]).map((c) => {
              const charData = (AVATAR_IMAGES as any)[avatarCfg.gender]?.[c];
              const hasImages =
                charData?.happy && Object.keys(charData.happy).length > 0;
              const previewSrc =
                charData?.happy?.[avatarCfg.color] ?? charData?.base ?? "";
              return (
                <div
                  key={c}
                  className={`char-btn ${avatarCfg.char === c ? "active" : ""}`}
                  style={{
                    opacity: hasImages ? 1 : 0.35,
                    cursor: hasImages ? "pointer" : "not-allowed",
                    width: 56,
                    height: 56,
                  }}
                  onClick={() => hasImages && setCharSafe(c)}
                >
                  {previewSrc ? (
                    <img
                      src={previewSrc}
                      alt={`Style ${c}`}
                      style={{
                        width: 48,
                        height: 48,
                        imageRendering: "pixelated",
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <span
                      className="pf"
                      style={{ fontSize: 10, color: "#4c1d95" }}
                    >
                      {c}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div
            className="pf"
            style={{
              fontSize: 7,
              color: lightMode ? "#4c1d95" : "#6b21a8",
              marginBottom: 10,
            }}
          >
            COLOR
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {availableColors.map(({ key, hex, name }) => (
              <div
                key={key}
                className={`swatch-wrap ${avatarCfg.color === key ? "active" : ""}`}
                onClick={() => setAvatarCfg((a) => ({ ...a, color: key }))}
              >
                <div
                  className="color-chip"
                  style={{
                    width: 30,
                    height: 30,
                    backgroundColor: hex,
                    borderColor:
                      avatarCfg.color === key
                        ? lightMode
                          ? "#7c3aed"
                          : "#fff"
                        : lightMode
                          ? "#d1d5db"
                          : "#2d1060",
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

      {isDirty && (
        <div className="unsaved-banner">
          <div style={{ width: 6, height: 6, background: "#f59e0b" }} />
          <span className="pf" style={{ fontSize: 7, color: "#fde68a" }}>
            UNSAVED CHANGES
          </span>
        </div>
      )}

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
            />
          </Field>
        </div>
      </div>

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
            />
          </Field>
          <div className="fade-up" style={{ animationDelay: "210ms" }}>
            <div
              className="pf"
              style={{ fontSize: 7, color: "#4c1d95", marginBottom: 6 }}
            >
              BIO
            </div>
            <textarea
              className={`s-textarea ${bio !== orig.bio ? "changed" : ""}`}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="TELL US ABOUT YOURSELF..."
            />
          </div>
        </div>
      </div>

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

      <div
        className="section-card"
        style={{ borderColor: lightMode ? "#000000" : "#1a0a35" }}
      >
        <div
          className="corner-dot"
          style={{ top: 0, left: 0, background: "#fbbf24" }}
        />
        <div
          className="pf"
          style={{ fontSize: 7, color: "#2d1060", marginBottom: 14 }}
        >
          ◆ APPEARANCE
        </div>
        <div className="toggle-row" onClick={onToggleLightMode}>
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
                {lightMode ? "BRIGHT & CLEAN" : "EASY ON EYES"}
              </div>
            </div>
          </div>
          <div
            className="toggle-track"
            style={{
              width: 44,
              height: 22,
              background: lightMode ? "#000000" : "#1a0a35",
              border: `2px solid ${lightMode ? "#000000" : "#4c1d95"}`,
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 3,
                left: lightMode ? 22 : 3,
                width: 12,
                height: 12,
                background: lightMode ? "#ffffff" : "#4c1d95",
                transition: "left .22s",
              }}
            />
          </div>
        </div>
      </div>

      <div
        className="section-card"
        style={{ borderColor: showPwSection ? "#ef4444" : "#1a0a35" }}
      >
        <div
          className="corner-dot"
          style={{ top: 0, left: 0, background: "#ef4444" }}
        />
        <div
          className="section-header"
          onClick={() => setShowPwSection(!showPwSection)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Lock size={11} color="#f87171" />
            <span className="pf" style={{ fontSize: 7, color: "#f87171" }}>
              CHANGE PASSWORD
            </span>
          </div>
          <span className={`chevron ${showPwSection ? "open" : ""}`}>▶</span>
        </div>
        {showPwSection && (
          <div
            className={`fade-up ${pwShake ? "shk" : ""}`}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              marginTop: 14,
            }}
          >
            <input
              className="s-input"
              type={showCurrPw ? "text" : "password"}
              placeholder="CURRENT PASSWORD"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
            />
            <input
              className="s-input"
              type={showNewPw ? "text" : "password"}
              placeholder="NEW PASSWORD (8+)"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
            />
            <button
              className="acc-btn"
              onClick={handleChangePassword}
              disabled={changingPw}
            >
              {changingPw ? "SYNCING..." : "UPDATE PASSWORD"}
            </button>
          </div>
        )}
      </div>

      <button
        className={`save-btn ${saved ? "ok" : ""}`}
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? (
          "SAVING..."
        ) : saved ? (
          <>
            <Check size={13} /> SAVED!
          </>
        ) : (
          <>
            <Save size={13} /> SAVE SETTINGS
          </>
        )}
      </button>
    </div>
  );
};

export default Settings;
