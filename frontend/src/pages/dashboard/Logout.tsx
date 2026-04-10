import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { handleLogout } from "../../lib/supabase";
import { LogOut, ShieldCheck } from "lucide-react";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
  .pf { font-family: 'Press Start 2P', cursive; }
  @keyframes fadeUp   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes popIn    { 0%{opacity:0;transform:scale(0.85)} 60%{transform:scale(1.04)} 100%{opacity:1;transform:scale(1)} }
  @keyframes spin     { to{transform:rotate(360deg)} }
  @keyframes glow     { 0%,100%{box-shadow:0 0 14px rgba(124,58,237,0.4),6px 6px 0 #1e0a40} 50%{box-shadow:0 0 26px rgba(168,85,247,0.6),6px 6px 0 #2d1060} }
  @keyframes scanMove { from{top:-10%} to{top:110%} }
  @keyframes dotFade  { 0%,100%{opacity:0.15} 50%{opacity:1} }
  @keyframes progress { from{width:0%} to{width:100%} }
  .fade-up  { animation: fadeUp 0.45s ease both; }
  .pop-in   { animation: popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }
  .card-glow{ animation: glow 3s ease-in-out infinite; }
  .scan-line{ animation: scanMove 8s linear infinite; }
  .corner-dot { position: absolute; width: 7px; height: 7px; }
  .logout-bar { height: 4px; border-radius: 0; background: linear-gradient(90deg,#7c3aed,#38bdf8,#a855f7); animation: progress 1.2s ease forwards; }
`;

export default function Logout() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 300);
    const t2 = setTimeout(() => setStep(2), 900);
    handleLogout().then(() => {
      const t3 = setTimeout(() => navigate("/login", { replace: true }), 1400);
      return () => clearTimeout(t3);
    });
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [navigate]);

  const steps = ["SAVING SESSION...", "UPDATING STATUS...", "SEE YOU SOON!"];

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#080318",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{STYLES}</style>

      {/* BG */}
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
            top: "30%",
            left: "20%",
            width: 280,
            height: 280,
            borderRadius: "50%",
            background:
              "radial-gradient(circle,rgba(124,58,237,0.1) 0%,transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "25%",
            right: "15%",
            width: 220,
            height: 220,
            borderRadius: "50%",
            background:
              "radial-gradient(circle,rgba(56,189,248,0.07) 0%,transparent 70%)",
          }}
        />
      </div>
      <div
        className="scan-line"
        style={{
          position: "fixed",
          left: 0,
          width: "100%",
          height: 12,
          background:
            "linear-gradient(transparent,rgba(168,85,247,0.04),transparent)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* Card */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: 340,
        }}
      >
        <div
          className="card-glow pop-in"
          style={{
            background: "rgba(8,3,24,0.95)",
            border: "3px solid #7c3aed",
            padding: "36px 28px",
            textAlign: "center",
            position: "relative",
          }}
        >
          <div
            className="corner-dot"
            style={{ top: 0, left: 0, background: "#a855f7" }}
          />
          <div
            className="corner-dot"
            style={{ top: 0, right: 0, background: "#38bdf8" }}
          />
          <div
            className="corner-dot"
            style={{ bottom: 0, left: 0, background: "#f472b6" }}
          />
          <div
            className="corner-dot"
            style={{ bottom: 0, right: 0, background: "#a855f7" }}
          />

          {/* Logo */}
          <div
            className="pf"
            style={{
              fontSize: 10,
              color: "#3b1d6a",
              marginBottom: 24,
              letterSpacing: "0.2em",
            }}
          >
            TINITHINK
          </div>

          {/* Spinner + icon */}
          <div
            style={{
              position: "relative",
              width: 64,
              height: 64,
              margin: "0 auto 20px",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                border: "3px solid #1a0a35",
                borderTopColor: "#7c3aed",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LogOut size={22} color="#a855f7" />
            </div>
          </div>

          <div
            className="pf"
            style={{ fontSize: 12, color: "#c084fc", marginBottom: 8 }}
          >
            LOGGING OUT
          </div>

          {/* Step text */}
          <div
            className="pf"
            style={{
              fontSize: 8,
              color: "#4c1d95",
              marginBottom: 20,
              minHeight: 14,
            }}
          >
            {steps[step] || steps[0]}
          </div>

          {/* Progress bar */}
          <div
            style={{
              height: 4,
              background: "#1a0a35",
              marginBottom: 20,
              overflow: "hidden",
            }}
          >
            <div className="logout-bar" key={step} />
          </div>

          {/* Dots */}
          <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 7,
                  height: 7,
                  background: i <= step ? "#7c3aed" : "#1a0a35",
                  boxShadow: i <= step ? "0 0 5px #7c3aed" : "none",
                  transition: "all 0.3s",
                  animation:
                    i === step ? "dotFade 1s ease-in-out infinite" : "none",
                }}
              />
            ))}
          </div>
        </div>

        <div className="fade-up" style={{ textAlign: "center", marginTop: 16 }}>
          <div
            className="pf"
            style={{ fontSize: 7, color: "#150828", letterSpacing: "0.1em" }}
          >
            YOUR PROGRESS IS SAVED ✦
          </div>
        </div>
      </div>
    </div>
  );
}
