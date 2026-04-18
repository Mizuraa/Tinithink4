import { useState, useEffect } from "react";
import { supabase, getCurrentUser } from "../../lib/supabase";
import { Flame, Gift, Check, Lock, X, Trophy, Star, Zap } from "lucide-react";

// ─── TYPES ─────────────────────────────────────────────────────────────────────
type Reward = {
  type: "heart" | "key" | "shield" | "coins";
  amount: number;
  label: string;
  emoji: string;
};

// ─── MILESTONE CONFIG ─────────────────────────────────────────────────────────
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

const TOTAL_DAYS = 30;

// ─── ACHIEVEMENT BADGES (decorative media below milestones) ───────────────────
const BADGES = [
  { emoji: "🔥", label: "ON FIRE", desc: "3-day streak", unlockAt: 3 },
  { emoji: "⚡", label: "ELECTRIC", desc: "7-day streak", unlockAt: 7 },
  { emoji: "🌟", label: "STAR PUPIL", desc: "14-day streak", unlockAt: 14 },
  { emoji: "🏆", label: "CHAMPION", desc: "21-day streak", unlockAt: 21 },
  { emoji: "👑", label: "ROYALTY", desc: "30-day streak", unlockAt: 30 },
];

// ─── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
  .sc-font { font-family: 'Press Start 2P', cursive; }
  @keyframes scFlame  { 0%,100%{transform:scaleY(1) rotate(-2deg)}50%{transform:scaleY(1.12) rotate(2deg)} }
  @keyframes scPop    { 0%{transform:scale(0.7)}60%{transform:scale(1.15)}100%{transform:scale(1)} }
  @keyframes scSlide  { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
  @keyframes scShine  { 0%,100%{box-shadow:0 0 6px rgba(250,204,21,.3)}50%{box-shadow:0 0 18px rgba(250,204,21,.7)} }
  @keyframes scBounce { 0%,100%{transform:translateY(0)}40%{transform:translateY(-6px)} }
  @keyframes scGlow   { 0%,100%{opacity:.6}50%{opacity:1} }
  @keyframes scRotate { to{transform:rotate(360deg)} }
  @keyframes scBadgePop { 0%{transform:scale(0.5);opacity:0}70%{transform:scale(1.2)}100%{transform:scale(1);opacity:1} }
  .sc-flame  { animation: scFlame  1.4s ease-in-out infinite; display:inline-block; }
  .sc-pop    { animation: scPop    .35s cubic-bezier(.34,1.56,.64,1) both; }
  .sc-slide  { animation: scSlide  .4s ease both; }
  .sc-shine  { animation: scShine  2s ease-in-out infinite; }
  .sc-bounce { animation: scBounce 1.8s ease-in-out infinite; }
  .sc-glow   { animation: scGlow   2.5s ease-in-out infinite; }
  .sc-day {
    aspect-ratio: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 2px solid #2d1060;
    transition: transform .1s, border-color .15s;
    cursor: default;
    position: relative;
    gap: 2px;
  }
  .sc-day.done   { background: linear-gradient(135deg,#14532d,#052e16); border-color:#22c55e; }
  .sc-day.today  { border-color:#facc15; background:linear-gradient(135deg,#422006,#1c0d00); }
  .sc-day.milestone { border-color:#f97316; }
  .sc-day.milestone.done { border-color:#4ade80; }
  .sc-day.future { background:rgba(8,3,24,.5); }
  .sc-claim-btn {
    font-family:'Press Start 2P',cursive; font-size:7px;
    padding:9px 14px; cursor:pointer;
    border:2px solid #f97316; background:rgba(194,65,12,.25); color:#fb923c;
    transition:filter .15s, transform .08s;
    display:flex; align-items:center; justify-content:center; gap:6px;
    width:100%;
  }
  .sc-claim-btn:hover  { filter:brightness(1.2); }
  .sc-claim-btn:active { transform:translateY(1px); }
  .sc-claim-btn:disabled { opacity:.4; cursor:not-allowed; }
  .sc-claimed-btn {
    font-family:'Press Start 2P',cursive; font-size:7px;
    padding:9px 14px;
    border:2px solid #22c55e; background:rgba(20,83,45,.3); color:#86efac;
    display:flex; align-items:center; justify-content:center; gap:6px;
  }
  .sc-modal-bg { position:fixed;inset:0;z-index:50;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center; }
  .sc-modal { background:#0f0820;border:4px solid #7c3aed;padding:28px;max-width:340px;width:90%;box-shadow:12px 12px 0 rgba(88,28,135,.45); }
  .sc-badge {
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    gap:5px; padding:12px 8px;
    border:2px solid; transition:all .2s;
    flex:1; min-width:0;
  }
  .sc-badge.locked { border-color:#1a0a35; background:rgba(8,3,24,.5); opacity:.45; }
  .sc-badge.unlocked { border-color:#f97316; background:rgba(194,65,12,.1); animation:scBadgePop .5s cubic-bezier(.34,1.56,.64,1) both; }
  .sc-badge.mastered { border-color:#22c55e; background:rgba(20,83,45,.25); animation:scBadgePop .5s cubic-bezier(.34,1.56,.64,1) both; }
`;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
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
interface StreakCalendarProps {
  compact?: boolean;
}

export default function StreakCalendar({
  compact = false,
}: StreakCalendarProps) {
  const [streakDays, setStreakDays] = useState(0);
  const [claimedDays, setClaimedDays] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [rewardPopup, setRewardPopup] = useState<Reward | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

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
      if (already.includes(milestone.day)) {
        showToast("ALREADY CLAIMED!");
        return;
      }

      const updates: Record<string, any> = {
        claimed_streak_days: [...already, milestone.day],
      };
      if (milestone.reward.type === "coins") {
        updates.coins = (userData.coins || 0) + milestone.reward.amount;
        try {
          const cur = parseInt(localStorage.getItem("tini_coins") || "0");
          localStorage.setItem(
            "tini_coins",
            String(cur + milestone.reward.amount),
          );
        } catch {}
      }
      if (milestone.reward.type === "heart") updates.bonus_hearts = 1;
      if (milestone.reward.type === "key") updates.bonus_keys = 1;
      if (milestone.reward.type === "shield") updates.bonus_shields = 1;

      await supabase.from("users").update(updates).eq("id", userId);
      setClaimedDays((prev) => [...prev, milestone.day]);
      setRewardPopup(milestone.reward);
    } catch (e: any) {
      showToast("CLAIM FAILED: " + e.message);
    } finally {
      setClaiming(false);
    }
  }

  const claimableMilestones = MILESTONES.filter(
    (m) => streakDays >= m.day && !claimedDays.includes(m.day),
  );

  if (loading)
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <style>{CSS}</style>
        <div className="sc-font" style={{ fontSize: 8, color: "#4c1d95" }}>
          LOADING...
        </div>
      </div>
    );

  // ── COMPACT MODE ─────────────────────────────────────────────────────────────
  if (compact)
    return (
      <div
        style={{
          background: "rgba(8,3,24,.7)",
          border: "2px solid #2d1060",
          padding: "14px 16px",
          boxShadow: "3px 3px 0 #0a0018",
        }}
      >
        <style>{CSS}</style>
        {toast && (
          <div
            style={{
              position: "fixed",
              bottom: 24,
              right: 24,
              zIndex: 999,
              padding: "8px 14px",
              background: "rgba(20,83,45,.95)",
              border: "2px solid #22c55e",
              fontFamily: "'Press Start 2P',cursive",
              fontSize: 8,
              color: "#86efac",
              boxShadow: "4px 4px 0 rgba(0,0,0,.4)",
            }}
          >
            ✓ {toast}
          </div>
        )}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="sc-flame" style={{ fontSize: 18 }}>
              🔥
            </span>
            <div>
              <div
                className="sc-font"
                style={{ fontSize: 9, color: "#facc15" }}
              >
                {streakDays} DAY STREAK
              </div>
              <div
                className="sc-font"
                style={{ fontSize: 6, color: "#4c1d95", marginTop: 2 }}
              >
                PLAY DAILY TO KEEP IT!
              </div>
            </div>
          </div>
          {claimableMilestones.length > 0 && (
            <div
              className="sc-bounce sc-font"
              style={{
                fontSize: 7,
                color: "#fb923c",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Gift size={12} color="#fb923c" /> {claimableMilestones.length}{" "}
              READY
            </div>
          )}
        </div>

        {(() => {
          const next = MILESTONES.find((m) => streakDays < m.day);
          if (!next)
            return (
              <div
                className="sc-font"
                style={{ fontSize: 7, color: "#22c55e" }}
              >
                🏆 ALL MILESTONES REACHED!
              </div>
            );
          const prev =
            MILESTONES.filter((m) => m.day <= streakDays).at(-1)?.day || 0;
          const pct = Math.min(
            ((streakDays - prev) / (next.day - prev)) * 100,
            100,
          );
          return (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <div
                  className="sc-font"
                  style={{ fontSize: 6, color: "#4c1d95" }}
                >
                  NEXT: DAY {next.day}
                </div>
                <div
                  className="sc-font"
                  style={{ fontSize: 6, color: "#f97316" }}
                >
                  {next.reward.emoji} {next.reward.label}
                </div>
              </div>
              <div
                style={{
                  background: "#1a0a35",
                  border: "1px solid #2d1060",
                  height: 8,
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    background: "linear-gradient(90deg,#f97316,#facc15)",
                    transition: "width .5s",
                  }}
                />
              </div>
              <div
                className="sc-font"
                style={{ fontSize: 6, color: "#2d1060", marginTop: 3 }}
              >
                {streakDays} / {next.day} DAYS
              </div>
            </div>
          );
        })()}

        {claimableMilestones.length > 0 && (
          <div
            style={{
              marginTop: 10,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {claimableMilestones.map((m) => (
              <button
                key={m.day}
                className="sc-claim-btn"
                onClick={() => handleClaim(m)}
                disabled={claiming}
              >
                <Gift size={10} /> CLAIM DAY {m.day} — {m.reward.emoji}{" "}
                {m.reward.label}
              </button>
            ))}
          </div>
        )}

        {rewardPopup && (
          <RewardModal
            reward={rewardPopup}
            onClose={() => setRewardPopup(null)}
          />
        )}
      </div>
    );

  // ── FULL MODE — TWO COLUMN LAYOUT ─────────────────────────────────────────────
  return (
    <div style={{ width: "100%", maxWidth: 900 }}>
      <style>{CSS}</style>

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 999,
            padding: "8px 14px",
            background: "rgba(20,83,45,.95)",
            border: "2px solid #22c55e",
            fontFamily: "'Press Start 2P',cursive",
            fontSize: 8,
            color: "#86efac",
            boxShadow: "4px 4px 0 rgba(0,0,0,.4)",
          }}
        >
          ✓ {toast}
        </div>
      )}

      {/* ── Top Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 24,
          padding: "18px 20px",
          background: "rgba(8,3,24,.8)",
          border: "2px solid #2d1060",
          boxShadow: "4px 4px 0 #0a0018",
        }}
      >
        <span className="sc-flame" style={{ fontSize: 38 }}>
          🔥
        </span>
        <div style={{ flex: 1 }}>
          <div
            className="sc-font"
            style={{
              fontSize: 18,
              color: "#facc15",
              textShadow: "0 0 20px rgba(250,204,21,.5)",
              marginBottom: 4,
            }}
          >
            {streakDays} DAY STREAK
          </div>
          <div className="sc-font" style={{ fontSize: 7, color: "#4c1d95" }}>
            PLAY DAILY TO EARN REWARDS
          </div>
        </div>

        {/* Global progress to next milestone */}
        {(() => {
          const next = MILESTONES.find((m) => streakDays < m.day);
          if (!next)
            return (
              <div
                className="sc-font"
                style={{
                  fontSize: 8,
                  color: "#22c55e",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Trophy size={14} color="#22c55e" /> ALL DONE!
              </div>
            );
          const prev =
            MILESTONES.filter((m) => m.day <= streakDays).at(-1)?.day || 0;
          const pct = Math.min(
            ((streakDays - prev) / (next.day - prev)) * 100,
            100,
          );
          return (
            <div style={{ minWidth: 160 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 5,
                }}
              >
                <div
                  className="sc-font"
                  style={{ fontSize: 6, color: "#4c1d95" }}
                >
                  NEXT: DAY {next.day}
                </div>
                <div
                  className="sc-font"
                  style={{ fontSize: 6, color: "#f97316" }}
                >
                  {next.reward.emoji}
                </div>
              </div>
              <div
                style={{
                  background: "#1a0a35",
                  border: "1px solid #2d1060",
                  height: 10,
                  borderRadius: 0,
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    background: "linear-gradient(90deg,#f97316,#facc15)",
                    transition: "width .6s",
                  }}
                />
              </div>
              <div
                className="sc-font"
                style={{ fontSize: 6, color: "#3b1d6a", marginTop: 3 }}
              >
                {streakDays}/{next.day} DAYS
              </div>
            </div>
          );
        })()}

        {claimableMilestones.length > 0 && (
          <div
            className="sc-bounce sc-font"
            style={{
              fontSize: 7,
              color: "#fb923c",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Gift size={14} color="#fb923c" />
            {claimableMilestones.length} READY!
          </div>
        )}
      </div>

      {/* ── TWO COLUMN BODY ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          alignItems: "start",
        }}
      >
        {/* ── LEFT: Calendar Grid ── */}
        <div>
          <div
            className="sc-font"
            style={{ fontSize: 8, color: "#4c1d95", marginBottom: 12 }}
          >
            ◆ 30-DAY CALENDAR
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7,1fr)",
              gap: 5,
              marginBottom: 16,
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
                  className={[
                    "sc-day",
                    done ? "done" : "future",
                    isToday ? "today" : "",
                    milestone ? "milestone" : "",
                  ].join(" ")}
                  title={
                    milestone
                      ? `Day ${day}: ${milestone.reward.emoji} ${milestone.reward.label}`
                      : `Day ${day}`
                  }
                >
                  {milestone && (
                    <span style={{ fontSize: 8, lineHeight: 1 }}>
                      {claimed ? "✓" : done ? milestone.reward.emoji : "🔒"}
                    </span>
                  )}
                  <span
                    className="sc-font"
                    style={{
                      fontSize: 5,
                      color: done
                        ? isToday
                          ? "#facc15"
                          : "#86efac"
                        : "#2d1060",
                    }}
                  >
                    {day}
                  </span>
                  {done && !milestone && (
                    <span style={{ fontSize: 7, lineHeight: 1 }}>🔥</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              marginBottom: 12,
            }}
          >
            {[
              { color: "#22c55e", bg: "rgba(20,83,45,.3)", label: "DONE" },
              { color: "#facc15", bg: "rgba(66,32,6,.5)", label: "TODAY" },
              { color: "#f97316", bg: "rgba(8,3,24,.5)", label: "MILESTONE" },
              { color: "#2d1060", bg: "rgba(8,3,24,.5)", label: "FUTURE" },
            ].map(({ color, bg, label }) => (
              <div
                key={label}
                style={{ display: "flex", alignItems: "center", gap: 5 }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    background: bg,
                    border: `2px solid ${color}`,
                  }}
                />
                <span
                  className="sc-font"
                  style={{ fontSize: 5, color: "#3b1d6a" }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>

          <div
            className="sc-font"
            style={{
              fontSize: 6,
              color: "#2d1060",
              padding: "8px 10px",
              border: "1px solid #1a0a35",
              background: "rgba(8,3,24,.5)",
            }}
          >
            ⚠ MISSING A DAY RESETS YOUR STREAK TO 0
          </div>
        </div>

        {/* ── RIGHT: Milestones + Badges ── */}
        <div>
          <div
            className="sc-font"
            style={{ fontSize: 8, color: "#4c1d95", marginBottom: 12 }}
          >
            ◆ STREAK MILESTONES
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginBottom: 20,
            }}
          >
            {MILESTONES.map((m) => {
              const reached = streakDays >= m.day;
              const claimed = claimedDays.includes(m.day);
              const claimable = reached && !claimed;

              return (
                <div
                  key={m.day}
                  className="sc-slide"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    background: claimed
                      ? "rgba(20,83,45,.25)"
                      : reached
                        ? "rgba(194,65,12,.1)"
                        : "rgba(8,3,24,.5)",
                    border: `2px solid ${claimed ? "#22c55e" : reached ? "#f97316" : "#1a0a35"}`,
                    boxShadow:
                      reached && !claimed
                        ? "0 0 10px rgba(249,115,22,.2)"
                        : "none",
                  }}
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: claimed
                        ? "rgba(20,83,45,.4)"
                        : reached
                          ? "rgba(194,65,12,.2)"
                          : "rgba(8,3,24,.7)",
                      border: `2px solid ${claimed ? "#4ade80" : reached ? "#fb923c" : "#2d1060"}`,
                      fontSize: 16,
                      flexShrink: 0,
                    }}
                  >
                    {claimed ? "✓" : m.reward.emoji}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      className="sc-font"
                      style={{
                        fontSize: 7,
                        color: claimed
                          ? "#4ade80"
                          : reached
                            ? "#fb923c"
                            : "#4c1d95",
                        marginBottom: 2,
                      }}
                    >
                      DAY {m.day}
                    </div>
                    <div
                      className="sc-font"
                      style={{
                        fontSize: 6,
                        color: claimed ? "#86efac" : "#2d1060",
                      }}
                    >
                      {m.reward.label}
                    </div>
                  </div>

                  {/* Status */}
                  {claimed ? (
                    <div
                      className="sc-claimed-btn"
                      style={{ padding: "7px 10px" }}
                    >
                      <Check size={9} /> OK
                    </div>
                  ) : claimable ? (
                    <button
                      className="sc-claim-btn sc-shine"
                      style={{
                        width: "auto",
                        padding: "7px 10px",
                        fontSize: 7,
                      }}
                      onClick={() => handleClaim(m)}
                      disabled={claiming}
                    >
                      <Gift size={9} /> CLAIM
                    </button>
                  ) : (
                    <div
                      className="sc-font"
                      style={{
                        fontSize: 6,
                        color: "#2d1060",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Lock size={9} color="#2d1060" /> {m.day - streakDays}d
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── ACHIEVEMENT BADGES (media / decorative) ── */}
          <div
            className="sc-font"
            style={{ fontSize: 7, color: "#4c1d95", marginBottom: 10 }}
          >
            ◆ ACHIEVEMENT BADGES
          </div>
          <div
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              marginBottom: 12,
            }}
          >
            {BADGES.map((b, idx) => {
              const unlocked = streakDays >= b.unlockAt;
              const mastered = claimedDays.includes(b.unlockAt);
              const status = mastered
                ? "mastered"
                : unlocked
                  ? "unlocked"
                  : "locked";

              return (
                <div
                  key={b.label}
                  className={`sc-badge ${status}`}
                  style={{ animationDelay: `${idx * 80}ms` }}
                  title={b.desc}
                >
                  <span
                    style={{
                      fontSize: unlocked ? 22 : 18,
                      filter: unlocked ? "none" : "grayscale(1)",
                      lineHeight: 1,
                    }}
                  >
                    {b.emoji}
                  </span>
                  <span
                    className="sc-font"
                    style={{
                      fontSize: 5,
                      color: mastered
                        ? "#4ade80"
                        : unlocked
                          ? "#fb923c"
                          : "#1a0a35",
                      textAlign: "center",
                      lineHeight: 1.6,
                    }}
                  >
                    {b.label}
                  </span>
                  {!unlocked && <span style={{ fontSize: 8 }}>🔒</span>}
                  {mastered && (
                    <span
                      className="sc-font"
                      style={{ fontSize: 4, color: "#22c55e" }}
                    >
                      CLAIMED
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Motivational stats bar ── */}
          <div
            style={{
              padding: "12px 14px",
              background: "rgba(8,3,24,.7)",
              border: "2px solid #1a0a35",
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            {[
              {
                icon: <Flame size={12} color="#f97316" />,
                val: streakDays,
                label: "CURRENT",
              },
              {
                icon: <Trophy size={12} color="#facc15" />,
                val: claimedDays.length,
                label: "CLAIMED",
              },
              {
                icon: <Star size={12} color="#a855f7" />,
                val:
                  MILESTONES.length -
                  claimedDays.filter((d) => MILESTONES.some((m) => m.day === d))
                    .length,
                label: "REMAINING",
              },
              {
                icon: <Zap size={12} color="#22d3ee" />,
                val: TOTAL_DAYS - streakDays > 0 ? TOTAL_DAYS - streakDays : 0,
                label: "TO 30-DAY",
              },
            ].map(({ icon, val, label }) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  flex: 1,
                }}
              >
                {icon}
                <span
                  className="sc-font"
                  style={{ fontSize: 10, color: "#facc15" }}
                >
                  {val}
                </span>
                <span
                  className="sc-font"
                  style={{
                    fontSize: 5,
                    color: "#2d1060",
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {rewardPopup && (
        <RewardModal
          reward={rewardPopup}
          onClose={() => setRewardPopup(null)}
        />
      )}
    </div>
  );
}

// ─── REWARD MODAL ─────────────────────────────────────────────────────────────
function RewardModal({
  reward,
  onClose,
}: {
  reward: Reward;
  onClose: () => void;
}) {
  return (
    <div className="sc-modal-bg" onClick={onClose}>
      <div className="sc-modal sc-pop" onClick={(e) => e.stopPropagation()}>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 48,
              marginBottom: 12,
              animation: "scBounce 1.8s ease-in-out infinite",
            }}
          >
            {reward.emoji}
          </div>
          <div
            className="sc-font"
            style={{
              fontSize: 14,
              color: "#facc15",
              marginBottom: 8,
              textShadow: "0 0 16px rgba(250,204,21,.5)",
            }}
          >
            REWARD!
          </div>
          <div
            className="sc-font"
            style={{ fontSize: 9, color: "#c4b5fd", marginBottom: 20 }}
          >
            {reward.label}
          </div>
          <div
            className="sc-font"
            style={{ fontSize: 7, color: "#4c1d95", marginBottom: 16 }}
          >
            ADDED TO YOUR ACCOUNT
          </div>
          <button
            onClick={onClose}
            style={{
              padding: "11px 20px",
              background: "#7c3aed",
              border: "2px solid #a855f7",
              color: "#fff",
              fontFamily: "'Press Start 2P',cursive",
              fontSize: 9,
              cursor: "pointer",
              width: "100%",
            }}
          >
            AWESOME! ✓
          </button>
        </div>
      </div>
    </div>
  );
}
