import { useRef, useState } from "react";
import type { MouseEvent } from "react";
import { useNavigate } from "react-router-dom";

type Props = {
  onClose: () => void;
};

export default function Modal({ onClose }: Props) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  //if de maclose lagoat na
  const closeModal = (e: MouseEvent<HTMLDivElement>) => {
    if (modalRef.current === e.target) onClose();
  };

  async function handleCreate() {
    setMsg(null);
    setLoading(true);

    try {
      await new Promise((r) => setTimeout(r, 600));
      setLoading(false);
      setMsg("Account created — you can now login");
      setTimeout(onClose, 700);
    } catch (err: any) {
      setMsg(err?.message || "Network error");
      setLoading(false);
    }
  }

  return (
    <div
      ref={modalRef}
      onClick={closeModal}
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    >
      <div
        className="w-full max-w-md p-6 relative text-center font-mono"
        style={{
          background: "linear-gradient(135deg, #2c2256 0%, #b993d6 100%)",
          border: "2px solid #b993d6",
          borderRadius: "1rem",
          boxShadow: "0 2px 16px 0 #b993d660",
        }}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-[#b993d6] hover:scale-110"
        >
          ✖️
        </button>

        <h2
          className="text-2xl font-bold mb-5"
          style={{
            color: "#c776d6",
            letterSpacing: "2px",
          }}
        >
          CREATE ACCOUNT
        </h2>

        <div className="space-y-3">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            type="text"
            placeholder="Username"
            className="w-full px-4 py-3 rounded-md focus:outline-none"
            style={{
              background: "#2c2256",
              color: "#e0c3fc",
              border: "1px solid #b993d6",
            }}
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            className="w-full px-4 py-3 rounded-md focus:outline-none"
            style={{
              background: "#2c2256",
              color: "#e0c3fc",
              border: "1px solid #b993d6",
            }}
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            className="w-full px-4 py-3 rounded-md focus:outline-none"
            style={{
              background: "#2c2256",
              color: "#e0c3fc",
              border: "1px solid #b993d6",
            }}
          />

          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full py-3 rounded-md font-bold tracking-widest hover:scale-105 transition"
            style={{
              background: "linear-gradient(90deg, #c776d6 0%, #e0c3fc 100%)",
              color: "white",
              border: "none",
            }}
          >
            {loading ? "Creating..." : "CREATE ACCOUNT"}
          </button>

          {msg && <div className="text-sm mt-2 text-white/80">{msg}</div>}
        </div>
      </div>
    </div>
  );
}
