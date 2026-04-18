import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, updateUserStatus } from "../lib/supabase";
import { Eye, EyeOff } from "lucide-react";

// ── Pixel CAPTCHA ─────────────────────────────────────────────────────────────
type CaptchaData = { question: string; answer: number };

function generateCaptcha(): CaptchaData {
  const ops = ["+", "-", "x"] as const;
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a: number, b: number, answer: number;
  if (op === "+") {
    a = Math.floor(Math.random() * 12) + 1;
    b = Math.floor(Math.random() * 12) + 1;
    answer = a + b;
  } else if (op === "-") {
    a = Math.floor(Math.random() * 12) + 5;
    b = Math.floor(Math.random() * a) + 1;
    answer = a - b;
  } else {
    a = Math.floor(Math.random() * 6) + 2;
    b = Math.floor(Math.random() * 5) + 2;
    answer = a * b;
  }
  return { question: `${a} ${op} ${b} = ?`, answer };
}

// ── Terms Sections ─────────────────────────────────────────────────────────────
const TERMS = [
  {
    num: "1.",
    title: "ACCEPTANCE OF TERMS",
    body: "By accessing and using this website, you agree to comply with and be bound by these Terms and Conditions. If you do not agree, please discontinue use immediately.",
  },
  {
    num: "2.",
    title: "USE OF THE WEBSITE",
    body: "You agree to use this site only for lawful purposes and in a way that does not infringe the rights of, restrict, or inhibit anyone else's use and enjoyment of the site.",
  },
  {
    num: "3.",
    title: "INTELLECTUAL PROPERTY",
    body: "All content, trademarks, and materials on this site are owned by or licensed to TINITHINK. You may not reproduce, distribute, or create derivative works without prior written consent.",
  },
  {
    num: "4.",
    title: "USER ACCOUNTS",
    body: "If you create an account, you are responsible for maintaining the confidentiality of your login details and for all activities under your account.",
  },
  {
    num: "5.",
    title: "LIMITATION OF LIABILITY",
    body: "We are not liable for any direct, indirect, incidental, or consequential damages arising from your use of this website.",
  },
  {
    num: "6.",
    title: "THIRD-PARTY LINKS",
    body: "This site may contain links to third-party websites. We are not responsible for the content or practices of these external sites.",
  },
  {
    num: "7.",
    title: "CHANGES TO TERMS",
    body: "We reserve the right to update or modify these Terms at any time without prior notice. Continued use of the site after changes means you accept the updated Terms.",
  },
  {
    num: "8.",
    title: "GOVERNING LAW",
    body: "These Terms are governed by and construed in accordance with the laws of the Republic of the Philippines.",
  },
  {
    num: "9.",
    title: "CONTACT US",
    body: "If you have any questions about these Terms, please contact us at support@tinithink.com.",
  },
];

// ── Terms Modal ────────────────────────────────────────────────────────────────
function TermsModal({
  onClose,
  onAccept,
  accepted,
}: {
  onClose: () => void;
  onAccept: () => void;
  accepted: boolean;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "rgba(4,1,14,0.88)",
        backdropFilter: "blur(6px)",
        animation: "fadeUp 0.25s ease both",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: "rgba(8,3,24,0.97)",
          border: "3px solid #7c3aed",
          position: "relative",
          boxShadow: "0 0 40px rgba(124,58,237,0.45), 8px 8px 0 #3b1d6a",
          animation: "popIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      >
        {/* Corner pixels */}
        {[
          { s: { top: 0, left: 0 }, c: "#a855f7" },
          { s: { top: 0, right: 0 }, c: "#38bdf8" },
          { s: { bottom: 0, left: 0 }, c: "#f472b6" },
          { s: { bottom: 0, right: 0 }, c: "#a855f7" },
        ].map((px, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 8,
              height: 8,
              background: px.c,
              ...px.s,
            }}
          />
        ))}

        {/* Header */}
        <div
          style={{
            padding: "16px 20px 12px",
            borderBottom: "2px solid #2d1060",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>📜</span>
            <span
              className="pf"
              style={{ fontSize: 9, color: "#a855f7", letterSpacing: "0.1em" }}
            >
              TERMS &amp; CONDITIONS
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="pf" style={{ fontSize: 6, color: "#3b1d6a" }}>
              2026
            </span>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "rgba(124,58,237,0.15)",
                border: "2px solid #3b1d6a",
                color: "#7c3aed",
                width: 24,
                height: 24,
                cursor: "pointer",
                fontSize: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
                transition: "border-color 0.15s, color 0.15s",
                borderRadius: 0,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "#ef4444";
                (e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "#3b1d6a";
                (e.currentTarget as HTMLButtonElement).style.color = "#7c3aed";
              }}
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div
          style={{
            maxHeight: 320,
            overflowY: "auto",
            padding: "16px 20px",
            scrollbarWidth: "thin",
            scrollbarColor: "#3b1d6a #0f0820",
          }}
        >
          {TERMS.map((section) => (
            <div key={section.num} style={{ marginBottom: 14 }}>
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  marginBottom: 4,
                  alignItems: "center",
                }}
              >
                <span
                  className="pf"
                  style={{ fontSize: 7, color: "#7c3aed", flexShrink: 0 }}
                >
                  {section.num}
                </span>
                <span className="pf" style={{ fontSize: 7, color: "#c084fc" }}>
                  {section.title}
                </span>
              </div>
              <p
                className="pf"
                style={{
                  fontSize: 6.5,
                  color: "#6b21a8",
                  lineHeight: 2.1,
                  margin: 0,
                  paddingLeft: 14,
                }}
              >
                {section.body}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 20px 16px",
            borderTop: "2px solid #2d1060",
            display: "flex",
            gap: 10,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: "11px 8px",
              fontFamily: "'Press Start 2P', cursive",
              fontSize: 8,
              background: "transparent",
              border: "2px solid #3b1d6a",
              color: "#4c1d95",
              cursor: "pointer",
              borderRadius: 0,
              transition: "border-color 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "#7c3aed";
              (e.currentTarget as HTMLButtonElement).style.color = "#a855f7";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "#3b1d6a";
              (e.currentTarget as HTMLButtonElement).style.color = "#4c1d95";
            }}
          >
            CLOSE
          </button>
          <button
            type="button"
            onClick={() => {
              onAccept();
              onClose();
            }}
            style={{
              flex: 2,
              padding: "11px 8px",
              fontFamily: "'Press Start 2P', cursive",
              fontSize: 8,
              background: accepted ? "rgba(20,83,45,0.4)" : "#7c3aed",
              border: `2px solid ${accepted ? "#22c55e" : "#a855f7"}`,
              color: accepted ? "#4ade80" : "#fff",
              cursor: "pointer",
              borderRadius: 0,
              boxShadow: accepted
                ? "0 0 10px rgba(34,197,94,0.3)"
                : "0 0 10px rgba(168,85,247,0.3), 3px 3px 0 #4c1d95",
              transition: "filter 0.15s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.filter =
                "brightness(1.15)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.filter = "none")
            }
          >
            {accepted ? "✓ ACCEPTED" : "▶ ACCEPT"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Login Component ───────────────────────────────────────────────────────
export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mounted, setMounted] = useState(false);
  const [gateCleared, setGateCleared] = useState(false);
  const [captchaData, setCaptchaData] = useState<CaptchaData>(() =>
    generateCaptcha(),
  );
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaOk, setCaptchaOk] = useState(false);
  const [captchaShake, setCaptchaShake] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => setMounted(true), 80);
  }, []);

  function refreshCaptcha() {
    setCaptchaData(generateCaptcha());
    setCaptchaInput("");
    setCaptchaOk(false);
    setCaptchaShake(false);
  }

  function handleCaptchaChange(val: string) {
    setCaptchaInput(val);
    setCaptchaOk(parseInt(val, 10) === captchaData.answer);
  }

  async function handleLogin() {
    if (!email || !password) {
      setError("FILL ALL FIELDS");
      return;
    }
    if (!termsAccepted) {
      setError("PLEASE ACCEPT THE TERMS & CONDITIONS");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      if (data.user) {
        updateUserStatus(data.user.id, "online").catch(() => {});
        setSuccess("LOGIN SUCCESSFUL!");
        refreshCaptcha();
        setTimeout(() => navigate("/dashboard"), 700);
      }
    } catch (e: any) {
      setError(e.message || "LOGIN FAILED");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup() {
    if (!email || !password || !username) {
      setError("FILL ALL FIELDS");
      return;
    }
    if (!termsAccepted) {
      setError("PLEASE ACCEPT THE TERMS & CONDITIONS");
      return;
    }
    if (password.length < 6) {
      setError("PASSWORD MUST BE 6+ CHARS");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username, display_name: username } },
      });
      if (error) throw error;
      if (data.user) {
        updateUserStatus(data.user.id, "online").catch(() => {});
        setSuccess("WELCOME TO TINITHINK!");
        refreshCaptcha();
        setTimeout(() => navigate("/dashboard"), 700);
      }
    } catch (e: any) {
      setError(e.message || "SIGNUP FAILED");
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") isLogin ? handleLogin() : handleSignup();
  }

  function switchTab(toLogin: boolean) {
    setIsLogin(toLogin);
    setError("");
    setSuccess("");
    setTermsAccepted(false);
    refreshCaptcha();
  }

  // ── Gate screen ──────────────────────────────────────────────────────────────
  if (!gateCleared) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          position: "relative",
          overflow: "hidden",
          background: "#080318",
        }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
          .pf { font-family: 'Press Start 2P', cursive; }
          .pb { border-radius: 0; }
          @keyframes twinkle1 { 0%,100%{opacity:0.1} 50%{opacity:0.8} }
          @keyframes twinkle2 { 0%,100%{opacity:0.4} 60%{opacity:0.05} }
          @keyframes gateGlow { 0%,100%{box-shadow:0 0 16px rgba(124,58,237,0.4),6px 6px 0 #3b1d6a} 50%{box-shadow:0 0 28px rgba(168,85,247,0.55),6px 6px 0 #4c1d95} }
          @keyframes fadeUp   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
          @keyframes shake    { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-5px)} 60%{transform:translateX(5px)} }
          @keyframes robotFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
          @keyframes popIn    { 0%{transform:scale(0.85);opacity:0} 60%{transform:scale(1.04)} 100%{transform:scale(1);opacity:1} }
          .gate-card   { animation: gateGlow 3s ease-in-out infinite; }
          .robot-float { animation: robotFloat 2.5s ease-in-out infinite; }
          .g-fadein    { animation: fadeUp 0.4s ease both; }
          .g-d1        { animation-delay: 0.05s; }
          .g-d2        { animation-delay: 0.15s; }
          .g-d3        { animation-delay: 0.25s; }
          .g-shake     { animation: shake 0.4s ease; }
          .gate-input {
            background: rgba(8,3,24,0.9); border: 2px solid #2d1060;
            color: #e9d5ff; border-radius: 0; padding: 14px 16px;
            font-family: "Press Start 2P", cursive; font-size: 14px;
            text-align: center; outline: none; width: 110px;
            transition: border-color 0.2s, box-shadow 0.2s; box-sizing: border-box;
          }
          .gate-input:focus  { border-color: #a855f7; box-shadow: 0 0 10px rgba(168,85,247,0.3); }
          .gate-input.g-ok   { border-color: #22c55e; box-shadow: 0 0 10px rgba(34,197,94,0.3); color: #86efac; }
          .gate-input.g-err  { border-color: #ef4444; }
          .gate-btn {
            width: 100%; padding: 14px; font-family: "Press Start 2P", cursive; font-size: 11px;
            border-radius: 0; cursor: pointer; border: 2px solid #22d3ee;
            background: #0e7490; color: #fff;
            box-shadow: 0 0 10px rgba(6,182,212,0.3), 4px 4px 0 #0e4d6a;
            transition: filter 0.15s, transform 0.08s;
          }
          .gate-btn:hover:not(:disabled)  { filter: brightness(1.15); }
          .gate-btn:active:not(:disabled) { transform: translateY(1px); }
          .gate-btn:disabled { opacity: 0.4; cursor: not-allowed; }
          .refresh-gate {
            background: transparent; border: 2px solid #2d1060; color: #4c1d95;
            border-radius: 0; padding: 6px 10px; cursor: pointer; font-size: 16px;
            transition: border-color 0.15s, color 0.15s; line-height: 1;
          }
          .refresh-gate:hover { border-color: #7c3aed; color: #a855f7; }
        `}</style>

        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 0,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "linear-gradient(rgba(124,58,237,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,0.04) 1px,transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "20%",
              left: "15%",
              width: 280,
              height: 280,
              borderRadius: "50%",
              background:
                "radial-gradient(circle,rgba(124,58,237,0.12) 0%,transparent 70%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "20%",
              right: "12%",
              width: 240,
              height: 240,
              borderRadius: "50%",
              background:
                "radial-gradient(circle,rgba(30,64,175,0.1) 0%,transparent 70%)",
            }}
          />
          {[
            [8, 12, "#a855f7", "twinkle1 3.1s infinite"],
            [22, 55, "#38bdf8", "twinkle2 2.4s infinite"],
            [45, 20, "#f472b6", "twinkle1 3.8s infinite"],
            [70, 75, "#facc15", "twinkle2 2.8s infinite"],
            [88, 40, "#4ade80", "twinkle1 4.1s infinite"],
            [55, 88, "#c084fc", "twinkle2 3.5s infinite"],
          ].map(([x, y, c, a], i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${x}%`,
                top: `${y}%`,
                width: i % 2 === 0 ? 4 : 2,
                height: i % 2 === 0 ? 4 : 2,
                background: c as string,
                animation: a as string,
                boxShadow: `0 0 4px ${c}`,
              }}
            />
          ))}
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 10,
            width: "100%",
            maxWidth: 360,
          }}
        >
          <div
            className="g-fadein"
            style={{ textAlign: "center", marginBottom: 24 }}
          >
            <div
              className="pf"
              style={{
                fontSize: 20,
                color: "#c084fc",
                textShadow: "0 0 16px rgba(192,132,252,0.5)",
                marginBottom: 6,
              }}
            >
              TINITHINK
            </div>
            <div
              className="pf"
              style={{ fontSize: 7, color: "#2d1060", letterSpacing: "0.3em" }}
            >
              ◆ STUDENT HUB v3.0 ◆
            </div>
          </div>

          <div
            className="gate-card pb g-fadein g-d1"
            style={{
              background: "rgba(8,3,24,0.94)",
              border: "3px solid #7c3aed",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {[
              ["top:0;left:0", "#a855f7"],
              ["top:0;right:0", "#38bdf8"],
              ["bottom:0;left:0", "#f472b6"],
              ["bottom:0;right:0", "#a855f7"],
            ].map(([pos, col]) => (
              <div
                key={pos as string}
                style={{
                  position: "absolute",
                  ...Object.fromEntries(
                    (pos as string).split(";").map((s) => s.split(":")),
                  ),
                  width: 8,
                  height: 8,
                  background: col as string,
                }}
              />
            ))}
            <div style={{ padding: "28px 24px 32px" }}>
              <div
                className="robot-float g-fadein g-d1"
                style={{
                  textAlign: "center",
                  fontSize: 52,
                  marginBottom: 12,
                  lineHeight: 1,
                }}
              >
                🤖
              </div>
              <div
                className="g-fadein g-d2"
                style={{ textAlign: "center", marginBottom: 4 }}
              >
                <div
                  className="pf"
                  style={{
                    fontSize: 11,
                    color: "#a855f7",
                    letterSpacing: "0.1em",
                  }}
                >
                  SECURITY CHECK
                </div>
              </div>
              <div
                className="g-fadein g-d2"
                style={{ textAlign: "center", marginBottom: 24 }}
              >
                <div className="pf" style={{ fontSize: 7, color: "#3b1d6a" }}>
                  PROVE YOU ARE HUMAN
                </div>
              </div>
              {captchaShake && (
                <div
                  className="pb g-shake"
                  style={{
                    border: "2px solid #ef4444",
                    background: "rgba(127,29,29,0.3)",
                    padding: "8px 10px",
                    marginBottom: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ color: "#ef4444" }}>⚠</span>
                  <span
                    className="pf"
                    style={{ fontSize: 7, color: "#fca5a5" }}
                  >
                    WRONG ANSWER! TRY AGAIN
                  </span>
                </div>
              )}
              <div
                className="g-fadein g-d3 pb"
                style={{
                  marginBottom: 18,
                  border: "2px solid #3b1d6a",
                  background: "rgba(45,16,96,0.25)",
                  padding: "16px 14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <div className="pf" style={{ fontSize: 7, color: "#4c1d95" }}>
                    SOLVE THIS:
                  </div>
                  <button
                    type="button"
                    className="refresh-gate"
                    onClick={refreshCaptcha}
                    title="New question"
                  >
                    ↺
                  </button>
                </div>
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                  <div
                    className="pb"
                    style={{
                      display: "inline-block",
                      padding: "12px 24px",
                      border: "3px solid #4c1d95",
                      background: "rgba(8,3,24,0.8)",
                    }}
                  >
                    <span
                      className="pf"
                      style={{
                        fontSize: 20,
                        color: "#e9d5ff",
                        letterSpacing: "0.2em",
                        textShadow: "0 0 12px rgba(192,132,252,0.5)",
                      }}
                    >
                      {captchaData.question}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                  }}
                >
                  <div className="pf" style={{ fontSize: 8, color: "#4c1d95" }}>
                    YOUR ANSWER:
                  </div>
                  <input
                    type="number"
                    value={captchaInput}
                    onChange={(e) => handleCaptchaChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && captchaOk) setGateCleared(true);
                    }}
                    className={`gate-input ${captchaOk ? "g-ok" : captchaInput.length > 0 && !captchaOk ? "g-err" : ""}`}
                    placeholder="?"
                    autoFocus
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 5,
                    marginTop: 14,
                    justifyContent: "center",
                  }}
                >
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: 0,
                        background: captchaOk
                          ? "#22c55e"
                          : i === 0 && captchaInput.length > 0
                            ? "#a855f7"
                            : "#1a0a35",
                        boxShadow: captchaOk ? "0 0 5px #22c55e" : "none",
                        transition: "background 0.3s",
                      }}
                    />
                  ))}
                </div>
              </div>
              <button
                type="button"
                className="gate-btn"
                disabled={!captchaOk}
                onClick={() => setGateCleared(true)}
              >
                {captchaOk ? "▶ ENTER SITE" : "SOLVE TO CONTINUE"}
              </button>
              <div style={{ marginTop: 14, textAlign: "center" }}>
                <span className="pf" style={{ fontSize: 7, color: "#1a0a35" }}>
                  THIS PROTECTS AGAINST BOTS & SPAM
                </span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 16 }}>
            <p
              className="pf"
              style={{ fontSize: 7, color: "#150828", letterSpacing: "0.12em" }}
            >
              © 2026 TINITHINK · ALL RIGHTS RESERVED
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Login / Signup form ──────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        position: "relative",
        overflow: "hidden",
        background: "#080318",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .pf { font-family: 'Press Start 2P', cursive; }
        .pb { border-radius: 0; }
        @keyframes twinkle1 { 0%,100%{opacity:0.1} 50%{opacity:0.8} }
        @keyframes twinkle2 { 0%,100%{opacity:0.4} 60%{opacity:0.05} }
        @keyframes twinkle3 { 0%,100%{opacity:0.6} 40%{opacity:0.1} }
        @keyframes shootStar { 0%{transform:translateX(0) translateY(0);opacity:1} 100%{transform:translateX(200px) translateY(80px);opacity:0} }
        @keyframes glitch {
          0%,92%,100% { text-shadow: 0 0 16px #a855f7, 0 0 32px rgba(168,85,247,0.4); transform: none; }
          93% { text-shadow: 3px 0 #38bdf8, -3px 0 #f472b6; transform: translateX(-2px); }
          96% { text-shadow: -2px 0 #38bdf8, 2px 0 #f472b6; transform: translateX(2px); }
          98% { text-shadow: 0 0 16px #a855f7; transform: none; }
        }
        @keyframes cardGlow {
          0%,100% { box-shadow: 0 0 12px rgba(124,58,237,0.4), 6px 6px 0 #3b1d6a; }
          50%      { box-shadow: 0 0 24px rgba(168,85,247,0.5), 6px 6px 0 #4c1d95; }
        }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shake  { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-4px)} 60%{transform:translateX(4px)} }
        @keyframes popIn  { 0%{opacity:0;transform:scale(0.85)} 60%{transform:scale(1.04)} 100%{opacity:1;transform:scale(1)} }
        @keyframes scanMove { from{top:-10%} to{top:110%} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes captchaShake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-5px)} 60%{transform:translateX(5px)} }
        @keyframes captchaSuccess { 0%{transform:scale(0.9);opacity:0} 60%{transform:scale(1.04)} 100%{transform:scale(1);opacity:1} }

        .logo-glitch  { animation: glitch 5s ease-in-out infinite; }
        .card-glow    { animation: cardGlow 3s ease-in-out infinite; }
        .fade-up      { animation: fadeUp 0.45s ease both; }
        .d1 { animation-delay: 0.05s; }
        .d2 { animation-delay: 0.12s; }
        .d3 { animation-delay: 0.20s; }
        .d4 { animation-delay: 0.28s; }
        .d5 { animation-delay: 0.36s; }
        .d6 { animation-delay: 0.44s; }
        .error-msg    { animation: shake 0.35s ease; }
        .success-msg  { animation: popIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both; }
        .scan-line    { animation: scanMove 6s linear infinite; }
        .captcha-shake   { animation: captchaShake 0.4s ease; }
        .captcha-ok      { animation: captchaSuccess 0.3s cubic-bezier(0.34,1.56,0.64,1) both; }

        .login-input {
          background: rgba(8,3,24,0.9); border: 2px solid #2d1060; color: #e9d5ff;
          border-radius: 0; width: 100%; padding: 12px 14px;
          font-family: 'Press Start 2P', cursive; font-size: 10px; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s; box-sizing: border-box;
        }
        .login-input:focus { border-color: #a855f7; box-shadow: 0 0 10px rgba(168,85,247,0.3), inset 0 0 8px rgba(124,58,237,0.08); }
        .login-input::placeholder { color: #3b1d6a; }
        .login-input:-webkit-autofill { -webkit-box-shadow: 0 0 0 100px #08030f inset !important; -webkit-text-fill-color: #e9d5ff !important; }

        .tab-btn {
          flex: 1; padding: 12px 8px; font-family: 'Press Start 2P', cursive;
          font-size: 10px; border: none; cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .submit-btn {
          width: 100%; padding: 14px; font-family: 'Press Start 2P', cursive;
          font-size: 11px; border-radius: 0; cursor: pointer;
          border: 2px solid #22d3ee; background: #0e7490; color: #fff;
          transition: filter 0.15s, transform 0.08s;
          box-shadow: 0 0 10px rgba(6,182,212,0.3), 4px 4px 0 #0e4d6a;
        }
        .submit-btn:hover:not(:disabled)  { filter: brightness(1.15); }
        .submit-btn:active:not(:disabled) { transform: translateY(1px); box-shadow: 0 0 6px rgba(6,182,212,0.2), 2px 2px 0 #0e4d6a; }
        .submit-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        .captcha-input {
          background: rgba(8,3,24,0.9); border: 2px solid #2d1060; color: #e9d5ff;
          border-radius: 0; padding: 10px 12px;
          font-family: 'Press Start 2P', cursive; font-size: 11px; outline: none;
          width: 90px; text-align: center;
          transition: border-color 0.2s, box-shadow 0.2s; box-sizing: border-box;
        }
        .captcha-input:focus { border-color: #a855f7; box-shadow: 0 0 8px rgba(168,85,247,0.3); }
        .captcha-input.ok  { border-color: #22c55e; box-shadow: 0 0 8px rgba(34,197,94,0.3); }
        .captcha-input.err { border-color: #ef4444; }
        .refresh-btn {
          background: rgba(45,16,96,0.5); border: 2px solid #3b1d6a; color: #6b21a8;
          border-radius: 0; padding: 10px 10px; cursor: pointer; font-size: 14px;
          transition: border-color 0.15s, color 0.15s; line-height: 1;
        }
        .refresh-btn:hover { border-color: #7c3aed; color: #a855f7; }
        .corner-px { position: absolute; width: 8px; height: 8px; }

        /* Terms button */
        .terms-open-btn {
          background: none; border: none; cursor: pointer; padding: 0;
          font-family: 'Press Start 2P', cursive; font-size: 7px;
          color: #38bdf8; text-decoration: underline;
          transition: color 0.15s;
        }
        .terms-open-btn:hover { color: #7dd3fc; }
      `}</style>

      {/* Background */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(124,58,237,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,0.04) 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "15%",
            width: 300,
            height: 300,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "25%",
            right: "10%",
            width: 260,
            height: 260,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(30,64,175,0.1) 0%, transparent 70%)",
          }}
        />
        {[
          [8, 12, "#a855f7", "twinkle1 3.1s infinite"],
          [15, 35, "#38bdf8", "twinkle2 2.4s infinite"],
          [25, 68, "#f472b6", "twinkle3 3.8s infinite"],
          [38, 22, "#facc15", "twinkle1 2.8s infinite"],
          [52, 80, "#a855f7", "twinkle2 4.1s infinite"],
          [63, 45, "#4ade80", "twinkle3 2.2s infinite"],
          [72, 15, "#38bdf8", "twinkle1 3.5s infinite"],
          [85, 72, "#c084fc", "twinkle2 2.9s infinite"],
          [92, 38, "#f472b6", "twinkle3 3.3s infinite"],
          [18, 55, "#818cf8", "twinkle1 4.4s infinite"],
          [44, 90, "#38bdf8", "twinkle2 2.6s infinite"],
          [78, 8, "#a855f7", "twinkle3 3.7s infinite"],
          [30, 42, "#facc15", "twinkle1 2.3s infinite"],
          [60, 28, "#f472b6", "twinkle2 4.8s infinite"],
          [90, 62, "#4ade80", "twinkle1 3.2s infinite"],
          [5, 78, "#38bdf8", "twinkle3 2.1s infinite"],
          [48, 5, "#c084fc", "twinkle1 3.9s infinite"],
          [70, 50, "#a855f7", "twinkle2 4.2s infinite"],
          [22, 18, "#818cf8", "twinkle3 2.7s infinite"],
          [55, 95, "#f472b6", "twinkle1 3.4s infinite"],
        ].map(([x, y, color, anim], i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: i % 3 === 0 ? 4 : 2,
              height: i % 3 === 0 ? 4 : 2,
              background: color as string,
              animation: anim as string,
              boxShadow: `0 0 4px ${color}`,
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "30%",
            width: 60,
            height: 2,
            background: "linear-gradient(90deg,#38bdf8,transparent)",
            animation: "shootStar 4s ease-in-out 2s infinite",
            opacity: 0.7,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "55%",
            left: "60%",
            width: 40,
            height: 1,
            background: "linear-gradient(90deg,#a855f7,transparent)",
            animation: "shootStar 4s ease-in-out 5.5s infinite",
            opacity: 0.5,
          }}
        />
      </div>

      {/* Scan line */}
      <div
        className="scan-line"
        style={{
          position: "fixed",
          left: 0,
          width: "100%",
          height: 14,
          background:
            "linear-gradient(transparent,rgba(168,85,247,0.04),transparent)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* Terms Modal */}
      {showTermsModal && (
        <TermsModal
          onClose={() => setShowTermsModal(false)}
          onAccept={() => setTermsAccepted(true)}
          accepted={termsAccepted}
        />
      )}

      {/* Card */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: 360,
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 0.5s ease, transform 0.5s ease",
        }}
      >
        {/* Logo */}
        <div
          className="fade-up"
          style={{ textAlign: "center", marginBottom: 28 }}
        >
          <div
            className="pf logo-glitch"
            style={{
              fontSize: 26,
              color: "#c084fc",
              marginBottom: 10,
              display: "inline-block",
            }}
          >
            TINITHINK
          </div>
          <div
            className="pf"
            style={{ fontSize: 8, color: "#3b1d6a", letterSpacing: "0.3em" }}
          >
            ◆ STUDENT HUB v3.0 ◆
          </div>
        </div>

        {/* Main card */}
        <div
          className="card-glow pb fade-up d1"
          style={{
            background: "rgba(8,3,24,0.94)",
            border: "3px solid #7c3aed",
            position: "relative",
            overflow: "hidden",
            backdropFilter: "blur(12px)",
          }}
        >
          <div
            className="corner-px"
            style={{ top: 0, left: 0, background: "#a855f7" }}
          />
          <div
            className="corner-px"
            style={{ top: 0, right: 0, background: "#38bdf8" }}
          />
          <div
            className="corner-px"
            style={{ bottom: 0, left: 0, background: "#f472b6" }}
          />
          <div
            className="corner-px"
            style={{ bottom: 0, right: 0, background: "#a855f7" }}
          />

          <div style={{ padding: "24px 24px 28px" }}>
            {/* Tabs */}
            <div
              className="pb fade-up d2"
              style={{
                display: "flex",
                border: "2px solid #2d1060",
                marginBottom: 20,
                overflow: "hidden",
              }}
            >
              <button
                className="tab-btn"
                onClick={() => switchTab(true)}
                style={{
                  background: isLogin ? "#7c3aed" : "transparent",
                  color: isLogin ? "#fff" : "#3b1d6a",
                  borderRight: "1px solid #2d1060",
                }}
              >
                LOGIN
              </button>
              <button
                className="tab-btn"
                onClick={() => switchTab(false)}
                style={{
                  background: !isLogin ? "#7c3aed" : "transparent",
                  color: !isLogin ? "#fff" : "#3b1d6a",
                }}
              >
                SIGNUP
              </button>
            </div>

            {/* Feedback */}
            {error && (
              <div
                className="error-msg pb"
                style={{
                  border: "2px solid #ef4444",
                  background: "rgba(127,29,29,0.35)",
                  padding: "8px 12px",
                  marginBottom: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ color: "#ef4444", fontSize: 12 }}>⚠</span>
                <span className="pf" style={{ fontSize: 8, color: "#fca5a5" }}>
                  {error}
                </span>
              </div>
            )}
            {success && (
              <div
                className="success-msg pb"
                style={{
                  border: "2px solid #22c55e",
                  background: "rgba(20,83,45,0.35)",
                  padding: "8px 12px",
                  marginBottom: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ color: "#22c55e", fontSize: 12 }}>✓</span>
                <span className="pf" style={{ fontSize: 8, color: "#86efac" }}>
                  {success}
                </span>
              </div>
            )}

            {/* Fields */}
            <div onKeyDown={handleKey}>
              {!isLogin && (
                <div className="fade-up d3" style={{ marginBottom: 14 }}>
                  <label
                    className="pf"
                    style={{
                      display: "block",
                      fontSize: 8,
                      color: "#6b21a8",
                      marginBottom: 6,
                    }}
                  >
                    USERNAME
                  </label>
                  <input
                    className="login-input"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="your_username"
                    autoComplete="username"
                  />
                </div>
              )}
              <div
                className={`fade-up ${isLogin ? "d3" : "d4"}`}
                style={{ marginBottom: 14 }}
              >
                <label
                  className="pf"
                  style={{
                    display: "block",
                    fontSize: 8,
                    color: "#6b21a8",
                    marginBottom: 6,
                  }}
                >
                  EMAIL
                </label>
                <input
                  className="login-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@school.com"
                  autoComplete="email"
                />
              </div>
              <div
                className={`fade-up ${isLogin ? "d4" : "d5"}`}
                style={{ marginBottom: 20 }}
              >
                <label
                  className="pf"
                  style={{
                    display: "block",
                    fontSize: 8,
                    color: "#6b21a8",
                    marginBottom: 6,
                  }}
                >
                  PASSWORD
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    className="login-input"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={{
                      position: "absolute",
                      right: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#6b21a8",
                      display: "flex",
                      alignItems: "center",
                      padding: 0,
                    }}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* CAPTCHA */}
              <div
                className={`fade-up pb border-2 ${captchaShake ? "captcha-shake" : ""} ${captchaOk ? "captcha-ok" : ""}`}
                style={{
                  marginBottom: 20,
                  padding: "14px 14px",
                  borderColor: captchaOk ? "#22c55e" : "#2d1060",
                  background: captchaOk
                    ? "rgba(20,83,45,0.15)"
                    : "rgba(45,16,96,0.2)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <span style={{ fontSize: 14 }}>🤖</span>
                    <span
                      className="pf"
                      style={{
                        fontSize: 7,
                        color: captchaOk ? "#4ade80" : "#6b21a8",
                        letterSpacing: "0.1em",
                      }}
                    >
                      {captchaOk ? "✓ VERIFIED" : "SECURITY CHECK"}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="refresh-btn"
                    onClick={refreshCaptcha}
                    title="New question"
                  >
                    ↺
                  </button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    className="pb"
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      border: "2px solid #3b1d6a",
                      background: "rgba(8,3,24,0.7)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      className="pf"
                      style={{
                        fontSize: 13,
                        color: "#c084fc",
                        letterSpacing: "0.15em",
                        textShadow: "0 0 8px rgba(192,132,252,0.4)",
                      }}
                    >
                      {captchaData.question}
                    </span>
                  </div>
                  <input
                    type="number"
                    value={captchaInput}
                    onChange={(e) => handleCaptchaChange(e.target.value)}
                    className={`captcha-input ${captchaOk ? "ok" : captchaInput.length > 0 && !captchaOk ? "err" : ""}`}
                    placeholder="?"
                    min={-99}
                    max={999}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 4,
                    marginTop: 8,
                    justifyContent: "center",
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 0,
                        background: captchaOk
                          ? "#22c55e"
                          : i === 0 && captchaInput.length > 0
                            ? "#facc15"
                            : "#2d1060",
                        transition: "background 0.3s",
                        boxShadow: captchaOk ? "0 0 4px #22c55e" : "none",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className={`fade-up ${isLogin ? "d5" : "d6"}`}>
                <button
                  className="submit-btn"
                  onClick={isLogin ? handleLogin : handleSignup}
                  disabled={loading || !termsAccepted}
                  style={{ opacity: !termsAccepted ? 0.45 : undefined }}
                >
                  {loading ? (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 10,
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          width: 7,
                          height: 7,
                          background: "#38bdf8",
                          animation: "pulse 1s ease-in-out infinite",
                        }}
                      />
                      PROCESSING...
                    </span>
                  ) : (
                    `▶ ${isLogin ? "LOGIN" : "CREATE ACCOUNT"}`
                  )}
                </button>
              </div>

              {/* ── Terms one-liner ── */}
              <div
                className="fade-up"
                style={{
                  marginTop: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                {/* Pixel checkbox */}
                <button
                  type="button"
                  onClick={() => setTermsAccepted((v) => !v)}
                  style={{
                    width: 14,
                    height: 14,
                    flexShrink: 0,
                    border: `2px solid ${termsAccepted ? "#22c55e" : "#7c3aed"}`,
                    background: termsAccepted ? "#14532d" : "transparent",
                    cursor: "pointer",
                    borderRadius: 0,
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: termsAccepted
                      ? "0 0 6px rgba(34,197,94,0.4)"
                      : "none",
                    transition: "border-color 0.2s, background 0.2s",
                  }}
                  title={termsAccepted ? "Uncheck" : "Accept terms"}
                >
                  {termsAccepted && (
                    <span
                      style={{
                        color: "#4ade80",
                        fontSize: 9,
                        lineHeight: 1,
                        fontWeight: "bold",
                      }}
                    >
                      ✓
                    </span>
                  )}
                </button>

                {/* Label */}
                <span
                  className="pf"
                  style={{
                    fontSize: 6.5,
                    color: termsAccepted ? "#4ade80" : "#6b21a8",
                    lineHeight: 2,
                    transition: "color 0.2s",
                  }}
                >
                  I AGREE TO THE{" "}
                  <button
                    type="button"
                    className="terms-open-btn"
                    onClick={() => setShowTermsModal(true)}
                  >
                    TERMS &amp; CONDITIONS
                  </button>
                </span>
              </div>
            </div>

            {/* Switch link */}
            <div style={{ marginTop: 18, textAlign: "center" }}>
              <span className="pf" style={{ fontSize: 8, color: "#2d1060" }}>
                {isLogin ? "NO ACCOUNT? " : "HAVE ONE? "}
              </span>
              <button
                onClick={() => switchTab(!isLogin)}
                style={{
                  fontFamily: "'Press Start 2P',cursive",
                  fontSize: 8,
                  color: "#38bdf8",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                {isLogin ? "SIGNUP" : "LOGIN"}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="fade-up d6"
          style={{ textAlign: "center", marginTop: 20 }}
        >
          <p
            className="pf"
            style={{ fontSize: 7, color: "#1a0a35", letterSpacing: "0.15em" }}
          >
            © 2026 TINITHINK · ALL RIGHTS RESERVED
          </p>
        </div>
      </div>
    </div>
  );
}
