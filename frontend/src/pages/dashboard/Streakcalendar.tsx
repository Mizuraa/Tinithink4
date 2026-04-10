import { useState, useEffect } from "react";
import { supabase, getCurrentUser } from "../../lib/supabase";
import { Flame, Gift, Check, Lock, X } from "lucide-react";

// ─── TYPES ─────────────────────────────────────────────────────────────────────
type Reward = {
  type: "heart" | "key" | "shield" | "coins";
  amount: number;
  label: string;
  emoji: string;
};

// ─── MILESTONE CONFIG ─────────────────────────────────────────────────────────
// Edit these to change when rewards unlock and what they give.
// Keep rewards small — shop should still be more valuable.
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

const TOTAL_DAYS = 30; // one full month of streaks shown

// ─── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
  .sc-font { font-family: 'Press Start 2P', cursive; }
  @keyframes scFlame  { 0%,100%{transform:scaleY(1) rotate(-2deg)}50%{transform:scaleY(1.12) rotate(2deg)} }
  @keyframes scPop    { 0%{transform:scale(0.7)}60%{transform:scale(1.15)}100%{transform:scale(1)} }
  @keyframes scSlide  { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
  @keyframes scShine  { 0%,100%{box-shadow:0 0 6px rgba(250,204,21,.3)}50%{box-shadow:0 0 18px rgba(250,204,21,.7)} }
  @keyframes scBounce { 0%,100%{transform:translateY(0)}40%{transform:translateY(-6px)} }
  .sc-flame  { animation: scFlame  1.4s ease-in-out infinite; display:inline-block; }
  .sc-pop    { animation: scPop    .35s cubic-bezier(.34,1.56,.64,1) both; }
  .sc-slide  { animation: scSlide  .4s ease both; }
  .sc-shine  { animation: scShine  2s ease-in-out infinite; }
  .sc-bounce { animation: scBounce 1.8s ease-in-out infinite; }
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
  if (last === today) return; // already played today

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().split("T")[0];

  const newStreak = last === yStr ? (data.streak_days || 0) + 1 : 1;
  await supabase
    .from("users")
    .update({
      streak_days: newStreak,
      last_play_date: today,
    })
    .eq("id", userId);
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
interface StreakCalendarProps {
  compact?: boolean; // true = small card for dashboard embed
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

      // Apply reward
      if (milestone.reward.type === "coins") {
        updates.coins = (userData.coins || 0) + milestone.reward.amount;
        // Also update localStorage so GameRoom sees it immediately
        try {
          const cur = parseInt(localStorage.getItem("tini_coins") || "0");
          localStorage.setItem(
            "tini_coins",
            String(cur + milestone.reward.amount),
          );
        } catch {}
      }
      // For powerups, we increment the relevant column (add if missing)
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

  // Which milestones are claimable right now?
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

  // ── COMPACT MODE (dashboard widget) ──────────────────────────────────────────
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

        {/* Mini progress bar to next milestone */}
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

        {/* Claimable rewards */}
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

  // ── FULL MODE ────────────────────────────────────────────────────────────────
  return (
    <div style={{ width: "100%", maxWidth: 640 }}>
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

      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <span className="sc-flame" style={{ fontSize: 32 }}>
          🔥
        </span>
        <div>
          <div
            className="sc-font"
            style={{
              fontSize: 16,
              color: "#facc15",
              textShadow: "0 0 16px rgba(250,204,21,.5)",
            }}
          >
            {streakDays} DAY STREAK
          </div>
          <div
            className="sc-font"
            style={{ fontSize: 7, color: "#4c1d95", marginTop: 4 }}
          >
            PLAY DAILY TO EARN REWARDS
          </div>
        </div>
        {claimableMilestones.length > 0 && (
          <div
            className="sc-bounce sc-font"
            style={{
              marginLeft: "auto",
              fontSize: 7,
              color: "#fb923c",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Gift size={14} color="#fb923c" />
            {claimableMilestones.length} REWARD
            {claimableMilestones.length > 1 ? "S" : ""} READY!
          </div>
        )}
      </div>

      {/* ── Calendar grid: 30 days ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7,1fr)",
          gap: 6,
          marginBottom: 20,
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
              {/* Milestone icon */}
              {milestone && (
                <span style={{ fontSize: compact ? 8 : 10, lineHeight: 1 }}>
                  {claimed ? "✓" : done ? milestone.reward.emoji : "🔒"}
                </span>
              )}

              {/* Day number */}
              <span
                className="sc-font"
                style={{
                  fontSize: 6,
                  color: done ? (isToday ? "#facc15" : "#86efac") : "#2d1060",
                }}
              >
                {day}
              </span>

              {/* Flame for completed days */}
              {done && !milestone && (
                <span style={{ fontSize: 8, lineHeight: 1 }}>🔥</span>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Milestones detail row ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          marginBottom: 20,
        }}
      >
        <div
          className="sc-font"
          style={{ fontSize: 8, color: "#4c1d95", marginBottom: 4 }}
        >
          ◆ STREAK MILESTONES
        </div>
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
                gap: 12,
                padding: "12px 14px",
                background: claimed
                  ? "rgba(20,83,45,.25)"
                  : reached
                    ? "rgba(194,65,12,.1)"
                    : "rgba(8,3,24,.5)",
                border: `2px solid ${claimed ? "#22c55e" : reached ? "#f97316" : "#1a0a35"}`,
                boxShadow:
                  reached && !claimed ? "0 0 10px rgba(249,115,22,.2)" : "none",
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: claimed
                    ? "rgba(20,83,45,.4)"
                    : reached
                      ? "rgba(194,65,12,.2)"
                      : "rgba(8,3,24,.7)",
                  border: `2px solid ${claimed ? "#4ade80" : reached ? "#fb923c" : "#2d1060"}`,
                  fontSize: 18,
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
                    fontSize: 8,
                    color: claimed
                      ? "#4ade80"
                      : reached
                        ? "#fb923c"
                        : "#4c1d95",
                    marginBottom: 3,
                  }}
                >
                  DAY {m.day}
                </div>
                <div
                  className="sc-font"
                  style={{
                    fontSize: 7,
                    color: claimed ? "#86efac" : "#2d1060",
                  }}
                >
                  {m.reward.label}
                </div>
              </div>

              {/* Status / Claim */}
              {claimed ? (
                <div className="sc-claimed-btn">
                  <Check size={10} /> CLAIMED
                </div>
              ) : claimable ? (
                <button
                  className="sc-claim-btn sc-shine"
                  onClick={() => handleClaim(m)}
                  disabled={claiming}
                >
                  <Gift size={10} /> CLAIM
                </button>
              ) : (
                <div
                  className="sc-font"
                  style={{
                    fontSize: 7,
                    color: "#2d1060",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <Lock size={10} color="#2d1060" /> {m.day - streakDays}d LEFT
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Footer tip ── */}
      <div
        className="sc-font"
        style={{ fontSize: 7, color: "#2d1060", textAlign: "center" }}
      >
        ⚠ MISSING A DAY RESETS YOUR STREAK TO 0
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

// ─── REWARD CLAIMED MODAL ─────────────────────────────────────────────────────
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
