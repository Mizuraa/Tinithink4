import { useState, useEffect } from "react";
import { Download } from "lucide-react";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

  @keyframes iawSlideIn {
    from { opacity: 0; right: -80px; }
    to   { opacity: 1; right: 0; }
  }
  @keyframes iawGlow {
    0%, 100% { box-shadow: -3px 0 0 #5b21b6, 0 0 0px rgba(168,85,247,0); }
    50%       { box-shadow: -3px 0 0 #5b21b6, 0 0 14px rgba(168,85,247,0.5); }
  }

  .iaw-tab {
    /* Fixed to right edge of screen */
    position: fixed;
    top: 140px;
    right: 0;
    z-index: 9999;

    /* Rotate so the text reads upward like a book spine */
    transform: rotate(-90deg);
    transform-origin: right bottom;

    display: flex;
    align-items: center;
    gap: 7px;
    padding: 7px 16px 7px 12px;

    background: rgba(10,4,28,0.97);
    border: 2px solid #7c3aed;
    /* hide the right border since it faces the screen edge */
    border-right: none;

    cursor: pointer;
    user-select: none;
    position: fixed;

    animation:
      iawSlideIn 0.5s cubic-bezier(0.34,1.56,0.64,1) 1.2s both,
      iawGlow 3s ease-in-out 2s infinite;

    transition: filter 0.15s, transform 0.15s;
  }

  .iaw-tab:hover {
    filter: brightness(1.3);
    /* nudge slightly out from the edge */
    transform: rotate(-90deg) translateX(4px);
  }
  .iaw-tab:active {
    filter: brightness(1.0);
    transform: rotate(-90deg) translateX(1px);
  }
  .iaw-tab.installing {
    opacity: 0.55;
    cursor: wait;
    pointer-events: none;
  }

  .iaw-tab-text {
    font-family: 'Press Start 2P', cursive;
    font-size: 8px;
    color: #c084fc;
    letter-spacing: 2px;
    white-space: nowrap;
    line-height: 1;
  }

  .iaw-tab-icon {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  /* Small corner accent pips */
  .iaw-pip {
    position: absolute;
    width: 5px;
    height: 5px;
    background: #a855f7;
  }
`;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallAppWidget() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Already running as installed PWA — no need to show
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!visible || dismissed) return null;

  async function handleInstall() {
    if (!deferredPrompt || installing) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") setDismissed(true);
    } finally {
      setInstalling(false);
      setDeferredPrompt(null);
    }
  }

  return (
    <>
      <style>{CSS}</style>
      <div
        className={`iaw-tab${installing ? " installing" : ""}`}
        onClick={handleInstall}
        title="Install TiniThink App"
        role="button"
        aria-label="Install TiniThink App"
      >
        {/* Corner accent pips */}
        <div className="iaw-pip" style={{ top: 0, left: 0 }} />
        <div className="iaw-pip" style={{ top: 0, right: 0 }} />

        <div className="iaw-tab-icon">
          <Download size={11} color="#a855f7" />
        </div>
        <span className="iaw-tab-text">
          {installing ? "INSTALLING..." : "INSTALL APP"}
        </span>
      </div>
    </>
  );
}
