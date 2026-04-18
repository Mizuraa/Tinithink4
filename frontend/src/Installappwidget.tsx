import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
  .iaw-font { font-family: 'Press Start 2P', cursive; }

  @keyframes iawSlideIn {
    from { transform: translateX(110%); opacity: 0; }
    to   { transform: translateX(0);    opacity: 1; }
  }
  @keyframes iawPulse {
    0%, 100% { box-shadow: 2px 2px 0 #0a0018, 0 0 0 rgba(168,85,247,0); }
    50%       { box-shadow: 2px 2px 0 #0a0018, 0 0 10px rgba(168,85,247,0.45); }
  }
  @keyframes iawBounceIcon {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-3px); }
  }

  .iaw-widget {
    position: fixed;
    top: 72px;
    right: 0;
    z-index: 9999;
    display: flex;
    align-items: stretch;
    animation: iawSlideIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
    animation-delay: 1.2s;
  }

  /* The visible tab */
  .iaw-tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 10px 7px;
    background: rgba(8,3,24,0.97);
    border: 2px solid #7c3aed;
    border-right: none;
    cursor: pointer;
    animation: iawPulse 3s ease-in-out infinite;
    transition: filter 0.15s, transform 0.1s;
    width: 34px;
  }
  .iaw-tab:hover { filter: brightness(1.25); transform: translateX(-2px); }

  .iaw-tab-icon {
    animation: iawBounceIcon 2s ease-in-out infinite;
  }

  .iaw-tab-label {
    font-family: 'Press Start 2P', cursive;
    font-size: 6px;
    color: #c084fc;
    writing-mode: vertical-rl;
    text-orientation: mixed;
    transform: rotate(180deg);
    letter-spacing: 1px;
    line-height: 1;
  }

  /* Expanded panel */
  .iaw-panel {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 10px;
    padding: 14px 12px;
    background: rgba(8,3,24,0.97);
    border: 2px solid #7c3aed;
    border-right: none;
    max-width: 0;
    overflow: hidden;
    opacity: 0;
    transition: max-width 0.35s cubic-bezier(0.4,0,0.2,1),
                opacity 0.25s ease,
                padding 0.3s ease;
    white-space: nowrap;
  }
  .iaw-panel.open {
    max-width: 220px;
    opacity: 1;
  }

  .iaw-install-btn {
    font-family: 'Press Start 2P', cursive;
    font-size: 8px;
    padding: 9px 13px;
    background: rgba(124,58,237,0.3);
    border: 2px solid #7c3aed;
    color: #c084fc;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 7px;
    transition: filter 0.15s, transform 0.08s;
    width: 100%;
  }
  .iaw-install-btn:hover  { filter: brightness(1.2); }
  .iaw-install-btn:active { transform: translateY(1px); }

  .iaw-close {
    background: none;
    border: none;
    cursor: pointer;
    color: #3b1d6a;
    padding: 0;
    display: flex;
    align-items: center;
    transition: color 0.15s;
    align-self: flex-end;
  }
  .iaw-close:hover { color: #a855f7; }

  .iaw-desc {
    font-family: 'Press Start 2P', cursive;
    font-size: 6px;
    color: #4c1d95;
    line-height: 2;
  }

  /* Corner accent */
  .iaw-corner {
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
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Already installed? hide.
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
    if (!deferredPrompt) return;
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
    <div className="iaw-widget">
      <style>{CSS}</style>

      {/* Expandable info panel */}
      <div className={`iaw-panel${open ? " open" : ""}`}>
        {/* corner accents */}
        <div className="iaw-corner" style={{ top: 0, left: 0 }} />
        <div className="iaw-corner" style={{ bottom: 0, left: 0 }} />

        <button className="iaw-close" onClick={() => setDismissed(true)}>
          <X size={11} />
        </button>

        <div className="iaw-desc">
          INSTALL
          <br />
          TINITHINK
          <br />
          ON YOUR
          <br />
          DEVICE
        </div>

        <button
          className="iaw-install-btn"
          onClick={handleInstall}
          disabled={installing}
        >
          <Download size={11} />
          {installing ? "INSTALLING..." : "INSTALL APP"}
        </button>
      </div>

      {/* The always-visible side tab */}
      <div
        className="iaw-tab"
        onClick={() => setOpen((o) => !o)}
        title="Install TiniThink App"
      >
        <div className="iaw-tab-icon">
          <Download size={13} color="#a855f7" />
        </div>
        <span className="iaw-tab-label">INSTALL</span>
      </div>
    </div>
  );
}
