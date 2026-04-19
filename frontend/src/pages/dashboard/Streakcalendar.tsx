import { useState, useEffect } from "react";
import { supabase, getCurrentUser } from "../../lib/supabase";
import { Flame, Gift, Check, Lock, Trophy, Star, Zap } from "lucide-react";
import { AVATAR_IMAGES } from "../../assets/AvatarImages";

// ─── TYPES & HELPERS ──────────────────────────────────────────────────────────
type Reward = {
  type: "heart" | "key" | "shield" | "coins";
  amount: number;
  label: string;
  emoji: string;
};

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

function getAvatarSrc(cfg: AvatarCfg, mood: "happy" | "sad" = "happy"): string {
  const charData = (AVATAR_IMAGES as any)[cfg.gender]?.[cfg.char];
  if (!charData) return "";
  const moodData =
    charData[mood] ?? charData[mood === "happy" ? "sad" : "happy"] ?? {};
  return moodData[cfg.color] ?? charData.base ?? "";
}

function AvatarImage({ cfg, size = 120 }: { cfg: AvatarCfg; size?: number }) {
  const src = getAvatarSrc(cfg);
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {src ? (
        <img
          src={src}
          alt="avatar"
          style={{
            width: "100%",
            height: "100%",
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
            fontSize: 32,
          }}
        >
          👤
        </div>
      )}
    </div>
  );
}

// ─── DATA ────────────────────────────────────────────────────────────────────
const MILESTONES: { day: number; reward: Reward }[] = [
  {
    day: 3,
    reward: { type: "coins", amount: 30, label: "+30 COINS", emoji: "🪙" },
  },
  {
    day: 7,
    reward: { type: "key", amount: 1, label: "PIXEL KEY", emoji: "🔑" },
  },
  {
    day: 14,
    reward: { type: "coins", amount: 75, label: "+75 COINS", emoji: "🪙" },
  },
  {
    day: 21,
    reward: { type: "shield", amount: 1, label: "SHIELD", emoji: "🛡️" },
  },
  {
    day: 30,
    reward: { type: "heart", amount: 1, label: "GOLD HEART", emoji: "❤️" },
  },
];

const BADGES = [
  { emoji: "🔥", label: "ON FIRE", desc: "3-day streak", unlockAt: 3 },
  { emoji: "⚡", label: "ELECTRIC", desc: "7-day streak", unlockAt: 7 },
  { emoji: "🌟", label: "STAR PUPIL", desc: "14-day streak", unlockAt: 14 },
  { emoji: "🏆", label: "CHAMPION", desc: "21-day streak", unlockAt: 21 },
  { emoji: "👑", label: "ROYALTY", desc: "30-day streak", unlockAt: 30 },
];

const TOTAL_DAYS = 30;

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
  .sc-font { font-family: 'Press Start 2P', cursive; }

  @keyframes scFlame   { 0%,100%{transform:scaleY(1) rotate(-2deg)} 50%{transform:scaleY(1.15) rotate(2deg)} }
  @keyframes scPop     { 0%{transform:scale(0.7)} 60%{transform:scale(1.15)} 100%{transform:scale(1)} }
  @keyframes scBounce  { 0%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }
  @keyframes scBadgePop{ 0%{transform:scale(0.5);opacity:0} 70%{transform:scale(1.2)} 100%{transform:scale(1);opacity:1} }
  @keyframes scShine   { 0%,100%{box-shadow:0 0 6px rgba(250,204,21,.3)} 50%{box-shadow:0 0 20px rgba(250,204,21,.8)} }

  .sc-flame  { animation: scFlame  1.4s ease-in-out infinite; display:inline-block; }
  .sc-pop    { animation: scPop    .35s cubic-bezier(.34,1.56,.64,1) both; }
  .sc-bounce { animation: scBounce 1.8s ease-in-out infinite; }
  .sc-shine  { animation: scShine  2s ease-in-out infinite; }

  .sc-day {
    aspect-ratio: 1 / 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 2px solid #1a0a35;
    gap: 2px;
    padding: 2px;
    transition: all .15s;
    min-width: 0;
  }
  .sc-day:hover { transform: scale(1.05); z-index: 2; border-color: #7c3aed; }
  .sc-day.done      { background: linear-gradient(135deg,#14532d,#052e16); border-color:#22c55e; }
  .sc-day.today     { border-color:#facc15 !important; background:linear-gradient(135deg,#3a1a00,#1c0d00); }
  .sc-day.milestone { border-color:#f97316; }
  .sc-day.future    { background:rgba(8,3,24,.6); border-color:#1a0a35; }

  .sc-claim-btn {
    font-family:'Press Start 2P',cursive; font-size:8px;
    padding:10px; cursor:pointer;
    border:2px solid #f97316; background:rgba(194,65,12,.2); color:#fb923c;
    display:flex; align-items:center; justify-content:center; gap:8px;
  }
  .sc-claim-btn:disabled { opacity:.4; cursor:not-allowed; }

  .sc-badge {
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    gap:6px; padding:10px 4px; border:2px solid; flex:1; min-width:0;
  }
  .sc-badge.locked   { border-color:#1a0a35; background:rgba(8,3,24,.5); opacity:.4; }
  .sc-badge.unlocked { border-color:#f97316; background:rgba(194,65,12,.1); animation:scBadgePop .5s both; }
  .sc-badge.mastered { border-color:#22c55e; background:rgba(20,83,45,.2); animation:scBadgePop .5s both; }
`;

export async function updateStreakOnLogin(userId: string) {
  const today = new Date().toISOString().split("T")[0];
  const { data } = await supabase
    .from("users")
    .select("streak_days,last_play_date")
    .eq("id", userId)
    .single();
  if (!data) return;
  const last = data.last_play_date;
  if (last === today) return;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().split("T")[0];
  const newStreak = last === yStr ? (data.streak_days || 0) + 1 : 1;
  await supabase
    .from("users")
    .update({ streak_days: newStreak, last_play_date: today })
    .eq("id", userId);
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function StreakCalendar({ compact = false }) {
  const [streakDays, setStreakDays] = useState(0);
  const [claimedDays, setClaimedDays] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [rewardPopup, setRewardPopup] = useState<Reward | null>(null);
  const [avatarCfg, setAvatarCfg] = useState<AvatarCfg>(DEFAULT_AVATAR);

  useEffect(() => {
    async function load() {
      try {
        const user = await getCurrentUser();
        if (!user) return;
        setUserId(user.id);
        const { data } = await supabase
          .from("users")
          .select("streak_days,claimed_streak_days")
          .eq("id", user.id)
          .single();
        if (data) {
          setStreakDays(data.streak_days || 0);
          setClaimedDays(data.claimed_streak_days || []);
        }
        const stored = localStorage.getItem("tini_avatar");
        if (stored) setAvatarCfg(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleClaim(milestone: { day: number; reward: Reward }) {
    if (!userId || claiming) return;
    setClaiming(true);
    try {
      const { data: userData } = await supabase
        .from("users")
        .select("coins,claimed_streak_days")
        .eq("id", userId)
        .single();
      if (!userData) throw new Error("User not found");
      const already = userData.claimed_streak_days || [];
      const updates: any = { claimed_streak_days: [...already, milestone.day] };

      if (milestone.reward.type === "coins")
        updates.coins = (userData.coins || 0) + milestone.reward.amount;
      if (milestone.reward.type === "heart") updates.bonus_hearts = 1;

      await supabase.from("users").update(updates).eq("id", userId);
      setClaimedDays((prev) => [...prev, milestone.day]);
      setRewardPopup(milestone.reward);
    } catch (e) {
      console.error(e);
    } finally {
      setClaiming(false);
    }
  }

  const claimableMilestones = MILESTONES.filter(
    (m) => streakDays >= m.day && !claimedDays.includes(m.day),
  );

  if (compact)
    return (
      <div
        style={{
          padding: 16,
          background: "rgba(8,3,24,.9)",
          border: "2px solid #2d1060",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          minWidth: 220,
        }}
      >
        <style>{CSS}</style>
        <div className="sc-font" style={{ fontSize: 10, color: "#facc15" }}>
          {streakDays} DAY STREAK
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Gift size={14} color="#fb923c" />
          <span className="sc-font" style={{ fontSize: 8, color: "#fb923c" }}>
            {claimableMilestones.length} READY
          </span>
        </div>
      </div>
    );

  if (loading)
    return (
      <div
        className="sc-font"
        style={{ color: "#4c1d95", textAlign: "center", padding: 50 }}
      >
        LOADING...
      </div>
    );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050110",
        color: "#fff",
        padding: "20px",
        boxSizing: "border-box",
      }}
    >
      <style>{CSS}</style>

      {/* HEADER */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
          flexWrap: "wrap",
          padding: "20px",
          background: "rgba(8,3,24,.9)",
          border: "2px solid #2d1060",
          marginBottom: "20px",
        }}
      >
        <span className="sc-flame" style={{ fontSize: 40 }}>
          🔥
        </span>
        <div>
          <h1
            className="sc-font"
            style={{ fontSize: 24, color: "#facc15", margin: 0 }}
          >
            {streakDays} DAY STREAK
          </h1>
          <p
            className="sc-font"
            style={{ fontSize: 8, color: "#4c1d95", marginTop: 5 }}
          >
            KEEP PLAYING TO UNLOCK REWARDS
          </p>
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
          gap: "20px",
          alignItems: "start",
        }}
      >
        {/* LEFT COLUMN: CALENDAR */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              padding: "15px",
              background: "rgba(8,3,24,.6)",
              border: "2px solid #1a0a35",
            }}
          >
            <div
              className="sc-font"
              style={{ fontSize: 10, color: "#7c3aed", marginBottom: 15 }}
            >
              ◆ 30-DAY PROGRESS
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: "8px",
              }}
            >
              {Array.from({ length: TOTAL_DAYS }, (_, i) => {
                const day = i + 1;
                const done = day <= streakDays;
                const isToday = day === streakDays;
                const milestone = MILESTONES.find((m) => m.day === day);
                const claimed = milestone && claimedDays.includes(day);

                return (
                  <div
                    key={day}
                    className={`sc-day ${done ? "done" : "future"} ${isToday ? "today" : ""} ${milestone ? "milestone" : ""}`}
                  >
                    <span
                      className="sc-font"
                      style={{
                        fontSize: 10,
                        color: done ? "#86efac" : "#2d1060",
                      }}
                    >
                      {day}
                    </span>
                    {milestone && (
                      <span style={{ fontSize: 14 }}>
                        {claimed ? "✓" : milestone.reward.emoji}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* STATS ROW */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "10px",
              padding: "15px",
              background: "rgba(8,3,24,.8)",
              border: "2px solid #1a0a35",
            }}
          >
            {[
              {
                icon: <Flame size={20} color="#f97316" />,
                val: streakDays,
                label: "STREAK",
              },
              {
                icon: <Trophy size={20} color="#facc15" />,
                val: claimedDays.length,
                label: "TOTAL",
              },
              {
                icon: <Star size={20} color="#a855f7" />,
                val: 30 - streakDays,
                label: "LEFT",
              },
              {
                icon: <Zap size={20} color="#22d3ee" />,
                val: "30",
                label: "GOAL",
              },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                {s.icon}
                <div
                  className="sc-font"
                  style={{ fontSize: 14, color: "#facc15", margin: "5px 0" }}
                >
                  {s.val}
                </div>
                <div
                  className="sc-font"
                  style={{ fontSize: 6, color: "#3b1d6a" }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: AVATAR & REWARDS */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* AVATAR DISPLAY */}
          <div
            style={{
              padding: "20px",
              background: "rgba(8,3,24,.85)",
              border: "2px solid #2d1060",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <AvatarImage cfg={avatarCfg} size={200} />
            <div
              className="sc-font"
              style={{ fontSize: 8, color: "#facc15", marginTop: 10 }}
            >
              YOUR CHARACTER
            </div>
          </div>

          {/* MILESTONES LIST */}
          <div
            style={{
              background: "rgba(8,3,24,.6)",
              border: "2px solid #1a0a35",
            }}
          >
            <div
              style={{
                padding: "10px",
                background: "rgba(8,3,24,.4)",
                borderBottom: "2px solid #1a0a35",
              }}
            >
              <span
                className="sc-font"
                style={{ fontSize: 10, color: "#7c3aed" }}
              >
                ◆ REWARDS
              </span>
            </div>
            {MILESTONES.map((m) => {
              const reached = streakDays >= m.day;
              const claimed = claimedDays.includes(m.day);
              return (
                <div
                  key={m.day}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "12px",
                    borderBottom: "1px solid #1a0a35",
                    gap: "12px",
                    background: claimed ? "rgba(20,83,45,.1)" : "transparent",
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px solid",
                      borderColor: claimed
                        ? "#22c55e"
                        : reached
                          ? "#f97316"
                          : "#1a0a35",
                      fontSize: 20,
                    }}
                  >
                    {claimed ? "✓" : m.reward.emoji}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      className="sc-font"
                      style={{
                        fontSize: 10,
                        color: reached ? "#f97316" : "#4c1d95",
                      }}
                    >
                      DAY {m.day}
                    </div>
                    <div
                      className="sc-font"
                      style={{ fontSize: 7, color: "#2d1060" }}
                    >
                      {m.reward.label}
                    </div>
                  </div>
                  {reached && !claimed ? (
                    <button
                      className="sc-claim-btn sc-shine"
                      onClick={() => handleClaim(m)}
                    >
                      CLAIM
                    </button>
                  ) : !reached ? (
                    <Lock size={16} color="#1a0a35" />
                  ) : (
                    <Check size={16} color="#22c55e" />
                  )}
                </div>
              );
            })}
          </div>

          {/* BADGES SECTION */}
          <div
            style={{
              background: "rgba(8,3,24,.6)",
              border: "2px solid #1a0a35",
              padding: "10px",
            }}
          >
            <div
              className="sc-font"
              style={{ fontSize: 8, color: "#7c3aed", marginBottom: 10 }}
            >
              ◆ ACHIEVEMENT BADGES
            </div>
            <div style={{ display: "flex", gap: "5px" }}>
              {BADGES.map((b, i) => (
                <div
                  key={i}
                  className={`sc-badge ${streakDays >= b.unlockAt ? "unlocked" : "locked"}`}
                >
                  <span style={{ fontSize: 20 }}>{b.emoji}</span>
                  <span className="sc-font" style={{ fontSize: 6 }}>
                    {b.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* REWARD MODAL */}
      {rewardPopup && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
          onClick={() => setRewardPopup(null)}
        >
          <div
            className="sc-pop"
            style={{
              background: "#0f0820",
              border: "4px solid #7c3aed",
              padding: 40,
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="sc-bounce"
              style={{ fontSize: 60, marginBottom: 20 }}
            >
              {rewardPopup.emoji}
            </div>
            <div className="sc-font" style={{ fontSize: 18, color: "#facc15" }}>
              CLAIMED!
            </div>
            <div className="sc-font" style={{ fontSize: 10, margin: "20px 0" }}>
              {rewardPopup.label}
            </div>
            <button
              className="sc-font"
              style={{
                padding: "10px 20px",
                background: "#7c3aed",
                color: "#fff",
                border: "none",
                cursor: "pointer",
              }}
              onClick={() => setRewardPopup(null)}
            >
              AWESOME!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
