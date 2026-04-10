import { useState, useEffect } from "react";
import { supabase, getCurrentUser } from "../../lib/supabase";
import {
  Gamepad2,
  BookOpen,
  FolderOpen,
  Users,
  BookMarked,
  Zap,
  Trophy,
  Flame,
  ArrowRight,
  Play,
} from "lucide-react";

const S = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
  .pf{font-family:'Press Start 2P',cursive;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes popIn{0%{opacity:0;transform:scale(0.88)}60%{transform:scale(1.03)}100%{opacity:1;transform:scale(1)}}
  @keyframes scanMove{from{top:-10%}to{top:110%}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
  @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes countUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
  .fade-up{animation:fadeUp .4s ease both}
  .pop-in{animation:popIn .35s cubic-bezier(.34,1.56,.64,1) both}
  .scan-line{animation:scanMove 8s linear infinite}
  .count-up{animation:countUp .4s ease both}
  .quick-card{
    background:rgba(8,3,24,.7);border:2px solid #1a0a35;padding:16px 14px;position:relative;
    cursor:pointer;transition:border-color .2s,transform .15s,background .2s;overflow:hidden;
  }
  .quick-card:hover{transform:translateY(-3px);background:rgba(45,16,96,.15)}
  .quick-card::before{content:'';position:absolute;inset:0;opacity:0;transition:opacity .2s;background:linear-gradient(135deg,rgba(168,85,247,.06),transparent)}
  .quick-card:hover::before{opacity:1}
  .stat-box{
    background:rgba(8,3,24,.7);border:2px solid #1a0a35;padding:14px 12px;
    display:flex;flex-direction:column;align-items:center;position:relative;overflow:hidden;
    cursor:pointer;transition:border-color .2s,transform .15s;
  }
  .stat-box:hover{transform:translateY(-2px)}
  .stat-box::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px}
  .stat-box.cyan::after{background:linear-gradient(90deg,transparent,#22d3ee,transparent)}
  .stat-box.purple::after{background:linear-gradient(90deg,transparent,#a855f7,transparent)}
  .stat-box.yellow::after{background:linear-gradient(90deg,transparent,#fbbf24,transparent)}
  .stat-box.green::after{background:linear-gradient(90deg,transparent,#4ade80,transparent)}
  .stat-box.pink::after{background:linear-gradient(90deg,transparent,#f472b6,transparent)}
  .game-row{
    display:flex;align-items:center;justify-content:space-between;padding:10px 12px;
    border:1px solid #1a0a35;background:rgba(8,3,24,.4);transition:border-color .15s,background .15s;cursor:pointer;
  }
  .game-row:hover{border-color:#2d1060;background:rgba(45,16,96,.1)}
  .greeting-shimmer{
    background:linear-gradient(90deg,#c084fc,#38bdf8,#a855f7,#c084fc);background-size:200% auto;
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
    animation:shimmer 4s linear infinite;
  }
  .corner-dot{position:absolute;width:5px;height:5px}
  .play-btn{
    display:flex;align-items:center;gap:5px;padding:5px 9px;background:rgba(124,58,237,.3);
    border:1px solid #7c3aed;color:#c084fc;font-family:'Press Start 2P',cursive;font-size:7px;
    cursor:pointer;transition:all .15s;
  }
  .play-btn:hover{background:rgba(124,58,237,.5);color:#e9d5ff}
`;

const SECTIONS = [
  {
    id: "flashcards",
    label: "FLASHCARDS",
    icon: <BookOpen size={18} color="#a855f7" />,
    color: "#a855f7",
    desc: "STUDY CARDS",
    countKey: "flashcards",
  },
  {
    id: "reviewer",
    label: "REVIEWER",
    icon: <BookMarked size={18} color="#38bdf8" />,
    color: "#38bdf8",
    desc: "TERM LIST",
    countKey: "reviewer_terms",
  },
  {
    id: "files",
    label: "FILES",
    icon: <FolderOpen size={18} color="#fbbf24" />,
    color: "#fbbf24",
    desc: "DOCUMENTS",
    countKey: "stored_files",
  },
  {
    id: "groups",
    label: "GROUPS",
    icon: <Users size={18} color="#4ade80" />,
    color: "#4ade80",
    desc: "STUDY GROUPS",
    countKey: "group_members",
  },
  {
    id: "games",
    label: "MY GAMES",
    icon: <Gamepad2 size={18} color="#f472b6" />,
    color: "#f472b6",
    desc: "QUIZ GAMES",
    countKey: "games",
  },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "GOOD MORNING";
  if (h < 17) return "GOOD AFTERNOON";
  return "GOOD EVENING";
}

export default function Home({
  onNavigate,
}: {
  onNavigate?: (page: string) => void;
  onPlayGame?: (id: string) => void;
}) {
  const [username, setUsername] = useState("");
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [recentGames, setRecentGames] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    setTimeout(() => setMounted(true), 50);
    loadData();
  }, []);

  async function loadData() {
    try {
      const user = await getCurrentUser();
      if (!user) return;
      setUserId(user.id);
      const { data: profile } = await supabase
        .from("users")
        .select("username")
        .eq("id", user.id)
        .single();
      if (profile) setUsername(profile.username || "");

      // Fetch all counts in parallel
      const [fc, rv, sf, gm, gms] = await Promise.all([
        supabase
          .from("flashcards")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("reviewer_terms")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("stored_files")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("group_members")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("games")
          .select("*", { count: "exact", head: true })
          .eq("creator_id", user.id),
      ]);
      setCounts({
        flashcards: fc.count || 0,
        reviewer_terms: rv.count || 0,
        stored_files: sf.count || 0,
        group_members: gm.count || 0,
        games: gms.count || 0,
      });

      const { data: games } = await supabase
        .from("games")
        .select("id,title,is_multiplayer,is_public,created_at")
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false })
        .limit(4);
      setRecentGames(games || []);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div
      style={{
        width: "100%",
        opacity: mounted ? 1 : 0,
        transition: "opacity .4s ease",
      }}
    >
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

      {/* Greeting */}
      <div className="fade-up" style={{ marginBottom: 22 }}>
        <div
          className="pf greeting-shimmer"
          style={{ fontSize: 11, marginBottom: 8 }}
        >
          {getGreeting()},
        </div>
        <div className="pf" style={{ fontSize: 16, color: "#e9d5ff" }}>
          {username || "STUDENT"}
        </div>
        <div
          className="pf"
          style={{ fontSize: 7, color: "#2d1060", marginTop: 6 }}
        >
          ◆ WELCOME BACK TO TINITHINK
        </div>
      </div>

      {/* Stats: 5 live counts in a row */}
      <div
        className="fade-up"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5,1fr)",
          gap: 8,
          marginBottom: 20,
          animationDelay: ".07s",
        }}
      >
        {[
          {
            key: "games",
            label: "GAMES",
            icon: <Gamepad2 size={15} color="#22d3ee" />,
            color: "#22d3ee",
            cls: "cyan",
            page: "games",
          },
          {
            key: "flashcards",
            label: "CARDS",
            icon: <BookOpen size={15} color="#a855f7" />,
            color: "#a855f7",
            cls: "purple",
            page: "flashcards",
          },
          {
            key: "reviewer_terms",
            label: "TERMS",
            icon: <BookMarked size={15} color="#38bdf8" />,
            color: "#38bdf8",
            cls: "cyan",
            page: "reviewer",
          },
          {
            key: "stored_files",
            label: "FILES",
            icon: <FolderOpen size={15} color="#fbbf24" />,
            color: "#fbbf24",
            cls: "yellow",
            page: "files",
          },
          {
            key: "group_members",
            label: "GROUPS",
            icon: <Users size={15} color="#4ade80" />,
            color: "#4ade80",
            cls: "green",
            page: "groups",
          },
        ].map(({ key, label, icon, color, cls, page }) => (
          <div
            key={key}
            className={`stat-box ${cls}`}
            onClick={() => onNavigate?.(page)}
          >
            <div style={{ marginBottom: 6 }}>{icon}</div>
            <div
              className={`pf count-up`}
              style={{ fontSize: 14, color, marginBottom: 3 }}
            >
              {counts[key] !== undefined ? (
                counts[key]
              ) : (
                <span style={{ animation: "pulse 1s infinite" }}>—</span>
              )}
            </div>
            <div className="pf" style={{ fontSize: 5, color: "#2d1060" }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Quick access */}
      <div
        className="fade-up"
        style={{ marginBottom: 20, animationDelay: ".12s" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <div style={{ width: 3, height: 14, background: "#a855f7" }} />
          <span className="pf" style={{ fontSize: 8, color: "#6b21a8" }}>
            QUICK ACCESS
          </span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(110px,1fr))",
            gap: 10,
          }}
        >
          {SECTIONS.map((s, i) => (
            <div
              key={s.id}
              className="quick-card fade-up"
              style={{ animationDelay: `${0.14 + i * 0.05}s` }}
              onClick={() => onNavigate?.(s.id)}
            >
              <div
                className="corner-dot"
                style={{ top: 0, left: 0, background: s.color + "66" }}
              />
              <div style={{ marginBottom: 10 }}>{s.icon}</div>
              <div
                className="pf"
                style={{ fontSize: 8, color: s.color, marginBottom: 4 }}
              >
                {s.label}
              </div>
              <div className="pf" style={{ fontSize: 6, color: "#2d1060" }}>
                {s.desc}
              </div>
              {counts[s.countKey] !== undefined && (
                <div
                  className="pf"
                  style={{ fontSize: 6, color: s.color + "88", marginTop: 4 }}
                >
                  {counts[s.countKey]}{" "}
                  {s.countKey === "group_members" ? "JOINED" : "TOTAL"}
                </div>
              )}
              <div
                style={{
                  position: "absolute",
                  bottom: 8,
                  right: 8,
                  opacity: 0.4,
                }}
              >
                <ArrowRight size={10} color={s.color} />
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  background: `linear-gradient(90deg,${s.color}55,transparent)`,
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Recent games */}
      <div className="fade-up" style={{ animationDelay: ".35s" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 3, height: 14, background: "#38bdf8" }} />
            <span className="pf" style={{ fontSize: 8, color: "#0891b2" }}>
              RECENT GAMES
            </span>
          </div>
          <button
            onClick={() => onNavigate?.("games")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span className="pf" style={{ fontSize: 6, color: "#1e3a5f" }}>
              VIEW ALL
            </span>
            <ArrowRight size={9} color="#1e3a5f" />
          </button>
        </div>

        {recentGames.length === 0 ? (
          <div style={{ padding: "24px 0", textAlign: "center" }}>
            <Gamepad2
              size={28}
              color="#1a0a35"
              style={{ margin: "0 auto 8px" }}
            />
            <div className="pf" style={{ fontSize: 7, color: "#1a0a35" }}>
              NO GAMES YET — CREATE ONE!
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {recentGames.map((g, i) => (
              <div
                key={g.id}
                className="game-row fade-up"
                style={{ animationDelay: `${0.38 + i * 0.06}s` }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <Gamepad2 size={12} color="#4c1d95" />
                  <span
                    className="pf"
                    style={{
                      fontSize: 8,
                      color: "#a78bfa",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {g.title}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flexShrink: 0,
                  }}
                >
                  {g.is_multiplayer && (
                    <span
                      style={{
                        padding: "2px 5px",
                        border: "1px solid #1d4ed8",
                        background: "rgba(29,78,216,.2)",
                      }}
                    >
                      <span
                        className="pf"
                        style={{ fontSize: 5, color: "#60a5fa" }}
                      >
                        MULTI
                      </span>
                    </span>
                  )}
                  {g.is_public && (
                    <span
                      style={{
                        padding: "2px 5px",
                        border: "1px solid #166534",
                        background: "rgba(22,101,52,.2)",
                      }}
                    >
                      <span
                        className="pf"
                        style={{ fontSize: 5, color: "#4ade80" }}
                      >
                        PUB
                      </span>
                    </span>
                  )}
                  <button
                    className="play-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate?.(`game/${g.id}`);
                    }}
                  >
                    <Play size={8} />
                    PLAY
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Announcement */}
      <div
        className="fade-up"
        style={{
          marginTop: 20,
          animationDelay: ".5s",
          background: "rgba(45,16,96,.2)",
          border: "1px solid #1a0a35",
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            background: "#a855f7",
            boxShadow: "0 0 6px #a855f7",
            animation: "pulse 2s ease-in-out infinite",
            flexShrink: 0,
          }}
        />
        <span className="pf" style={{ fontSize: 7, color: "#3b1d6a" }}>
          TINITHINK v3.0 — KEEP STUDYING, KEEP GROWING ✦
        </span>
      </div>
    </div>
  );
}
