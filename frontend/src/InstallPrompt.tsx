import { useState, useEffect } from "react";

function isIOS() {
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isInStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches;
}

export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<
    | (Event & {
        prompt: () => void;
        userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
      })
    | null
  >(null);
  const [isIOSDevice, setIsIOSDevice] = useState(false);

  useEffect(() => {
    if (isInStandaloneMode()) return;

    if (isIOS()) {
      setIsIOSDevice(true);
      setShow(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as any);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShow(false);
      setDeferredPrompt(null);
    }
  };

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        left: 16,
        right: 16,
        background: "#1c1c1e",
        color: "white",
        borderRadius: 12,
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        zIndex: 9999,
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img
            src="/logo-192.png"
            alt="TiniThink"
            style={{ width: 36, height: 36, borderRadius: 8 }}
          />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>TiniThink</div>
            <div style={{ fontSize: 12, color: "#aaa" }}>
              Your Friendly Study App
            </div>
          </div>
        </div>
        <button
          onClick={() => setShow(false)}
          style={{
            background: "none",
            border: "none",
            color: "#aaa",
            fontSize: 20,
            cursor: "pointer",
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>

      {/* iOS instructions */}
      {isIOSDevice ? (
        <p style={{ margin: 0, fontSize: 13, color: "#ccc", lineHeight: 1.6 }}>
          Open in <strong style={{ color: "white" }}>Safari</strong>, tap the{" "}
          <strong style={{ color: "white" }}>Share</strong> button{" "}
          <span style={{ fontSize: 16 }}>⎋</span> at the bottom, then tap{" "}
          <strong style={{ color: "white" }}>"Add to Home Screen"</strong> to
          install this app.
        </p>
      ) : (
        <button
          onClick={handleInstall}
          style={{
            background: "#0a84ff",
            color: "white",
            border: "none",
            borderRadius: 8,
            padding: "10px 0",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Install App
        </button>
      )}
    </div>
  );
}
