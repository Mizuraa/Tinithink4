import { useState, useEffect, useRef } from "react";
import {
  supabase,
  getCurrentUser,
  getFriends,
  getPendingFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
} from "../../lib/supabase";
import { createContext, useContext } from "react";
const _ThemeCtx = createContext<boolean>(false);
function useLightMode() {
  return useContext(_ThemeCtx);
}
import {
  Users,
  Clock,
  Check,
  X,
  Camera,
  Wifi,
  WifiOff,
  Edit2,
  Save,
  UserPlus,
  Search,
  UserMinus,
} from "lucide-react";

const S = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
  .pf{font-family:'Press Start 2P',cursive;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes popIn{0%{opacity:0;transform:scale(0.88)}60%{transform:scale(1.03)}100%{opacity:1;transform:scale(1)}}
  @keyframes avatarGlow{0%,100%{box-shadow:0 0 12px rgba(168,85,247,.5)}50%{box-shadow:0 0 24px rgba(168,85,247,.8)}}
  @keyframes scanMove{from{top:-10%}to{top:110%}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-4px)}60%{transform:translateX(4px)}}
  .fade-up{animation:fadeUp .35s ease both}
  .pop-in{animation:popIn .3s cubic-bezier(.34,1.56,.64,1) both}
  .scan-line{animation:scanMove 8s linear infinite}
  .av-glow{animation:avatarGlow 3s ease-in-out infinite}
  .shk{animation:shake .35s ease}
  .stat-card{background:rgba(8,3,24,.7);border:2px solid #1a0a35;padding:16px;display:flex;flex-direction:column;align-items:center;cursor:pointer;transition:border-color .2s,transform .15s,background .2s;position:relative}
  .stat-card:hover{border-color:#7c3aed;background:rgba(124,58,237,.08);transform:translateY(-2px)}
  .info-row{padding:11px 14px;border:1px solid #1a0a35;background:rgba(8,3,24,.5);transition:border-color .2s}
  .info-row:hover{border-color:#2d1060}
  .p-input{background:rgba(8,3,24,.9);border:2px solid #2d1060;color:#e9d5ff;padding:9px 12px;font-family:'Press Start 2P',cursive;font-size:9px;outline:none;width:100%;box-sizing:border-box;transition:border-color .2s}
  .p-input:focus{border-color:#a855f7;box-shadow:0 0 6px rgba(168,85,247,.2)}
  .p-input::placeholder{color:#2d1060;font-size:8px}
  .p-textarea{background:rgba(8,3,24,.9);border:2px solid #2d1060;color:#e9d5ff;padding:9px 12px;font-family:'Press Start 2P',cursive;font-size:9px;outline:none;width:100%;box-sizing:border-box;resize:none;transition:border-color .2s;line-height:1.8}
  .p-textarea:focus{border-color:#a855f7}
  .p-btn{display:flex;align-items:center;justify-content:center;gap:6px;padding:10px 14px;cursor:pointer;font-family:'Press Start 2P',cursive;font-size:9px;border:2px solid;transition:filter .15s,transform .08s}
  .p-btn:hover{filter:brightness(1.15)}.p-btn:active{transform:translateY(1px)}.p-btn:disabled{opacity:.4;cursor:not-allowed}
  .p-btn.cyan{background:rgba(14,116,144,.4);border-color:#22d3ee;color:#67e8f9}
  .p-btn.green{background:rgba(20,83,45,.5);border-color:#22c55e;color:#4ade80}
  .p-btn.red{background:rgba(127,29,29,.5);border-color:#ef4444;color:#f87171}
  .p-btn.purple{background:rgba(124,58,237,.3);border-color:#7c3aed;color:#c084fc}
  .p-btn.ghost{background:rgba(45,16,96,.3);border-color:#2d1060;color:#6b21a8}
  .p-btn.sm{padding:6px 10px;font-size:8px}
  .friend-row{display:flex;align-items:center;gap:10px;padding:10px;border:1px solid #1a0a35;background:rgba(8,3,24,.4);transition:border-color .15s}
  .friend-row:hover{border-color:#2d1060}
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(4px);z-index:40;display:flex;align-items:center;justify-content:center;padding:16px}
  .modal-box{background:rgba(8,3,24,.97);border:3px solid #7c3aed;padding:24px;max-width:380px;width:100%;box-shadow:0 0 30px rgba(124,58,237,.3),8px 8px 0 #1e0a40;max-height:80vh;overflow-y:auto;position:relative}
  .corner-dot{position:absolute;width:6px;height:6px}
  .toast{position:fixed;bottom:24px;right:24px;z-index:999;padding:10px 16px;border:2px solid;font-family:'Press Start 2P',cursive;font-size:8px;animation:popIn .3s ease both;box-shadow:4px 4px 0 rgba(0,0,0,.4)}
  .toast.ok{background:rgba(20,83,45,.95);border-color:#22c55e;color:#86efac}
  .toast.err{background:rgba(127,29,29,.95);border-color:#ef4444;color:#fca5a5}
  .search-row{display:flex;align-items:center;gap:8px;padding:8px 12px;border:2px solid #1a0a35;background:rgba(8,3,24,.7);margin-bottom:12px;transition:border-color .2s}
  .search-row:focus-within{border-color:#4c1d95}
  .search-row input{background:none;border:none;color:#e9d5ff;font-family:'Press Start 2P',cursive;font-size:9px;outline:none;flex:1;min-width:0}
  .search-row input::placeholder{color:#2d1060;font-size:8px}
  .lm .stat-card{background:#ffffff;border-color:#e2e8f0;}
  .lm .stat-card:hover{background:#f8fafc;border-color:#7c3aed;}
  .lm .info-row{background:#ffffff;border-color:#e2e8f0;}
  .lm .info-row:hover{border-color:#c4b5fd;}
  .lm .p-input{background:#ffffff;border-color:#e2e8f0;color:#1e0a40;}
  .lm .p-input::placeholder{color:#9ca3af;}
  .lm .p-textarea{background:#ffffff;border-color:#e2e8f0;color:#1e0a40;}
  .lm .friend-row{background:#ffffff;border-color:#e2e8f0;}
  .lm .friend-row:hover{border-color:#c4b5fd;}
  .lm .modal-box{background:#ffffff;border-color:#7c3aed;box-shadow:8px 8px 0 #e2e8f0;}
  .lm .search-row{background:#ffffff;border-color:#e2e8f0;}
  .lm .search-row input{color:#1e0a40;}
  .lm .search-row input::placeholder{color:#9ca3af;}
`;

export default function Profile() {
  const lm = useLightMode();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [school, setSchool] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [userId, setUserId] = useState("");
  const [friends, setFriends] = useState<any[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [showFriends, setShowFriends] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  // editable copies
  const [eName, setEName] = useState("");
  const [eAge, setEAge] = useState("");
  const [eSchool, setESchool] = useState("");
  const [eBio, setEBio] = useState("");
  // add friend
  const [friendSearch, setFriendSearch] = useState("");
  const [friendResults, setFriendResults] = useState<any[]>([]);
  const [sendingInvite, setSendingInvite] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "ok" | "err";
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProfile();
  }, []);
  const toast$ = (msg: string, type: "ok" | "err") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  async function loadProfile() {
    try {
      const user = await getCurrentUser();
      if (!user) return;
      setUserId(user.id);
      const { data: p } = await supabase
        .from("users")
        .select("username,email,age,school,bio,avatar_url")
        .eq("id", user.id)
        .single();
      if (p) {
        setUsername(p.username || "");
        setEmail(p.email || "");
        setAge(p.age != null ? p.age.toString() : "");
        setSchool(p.school || "");
        setBio(p.bio || "");
        setAvatarUrl(p.avatar_url || "");
      }
      const [fd, rd] = await Promise.all([
        getFriends(user.id),
        getPendingFriendRequests(user.id),
      ]);
      setFriends(fd || []);
      setFriendRequests(rd || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function startEdit() {
    setEName(username);
    setEAge(age);
    setESchool(school);
    setEBio(bio);
    setEditing(true);
  }

  async function saveProfile() {
    if (!eName.trim()) {
      toast$("USERNAME REQUIRED", "err");
      return;
    }
    const parsedAge = eAge ? parseInt(eAge, 10) : null;
    if (eAge && isNaN(parsedAge!)) {
      toast$("INVALID AGE", "err");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({
          username: eName.trim(),
          age: parsedAge,
          school: eSchool.trim() || null,
          bio: eBio.trim() || null,
        })
        .eq("id", userId);
      if (error) throw error;
      setUsername(eName.trim());
      setAge(eAge);
      setSchool(eSchool.trim());
      setBio(eBio.trim());
      setEditing(false);
      toast$("PROFILE SAVED!", "ok");
    } catch {
      toast$("SAVE FAILED", "err");
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];

    // Validate type and size
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast$("USE JPG, PNG, GIF OR WEBP", "err");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast$("FILE TOO LARGE (MAX 5MB)", "err");
      return;
    }

    setUploading(true);
    try {
      // Always get uid fresh from session — never rely on state being set
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast$("NOT LOGGED IN", "err");
        return;
      }

      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      // Use same flat path format as original: userId-timestamp.ext
      const fileName = `${user.id}-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true, contentType: file.type });

      if (upErr) {
        console.error("Upload error:", upErr);
        toast$(`UPLOAD FAILED: ${upErr.message.slice(0, 40)}`, "err");
        return;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

      const { error: dbErr } = await supabase
        .from("users")
        .update({ avatar_url: data.publicUrl })
        .eq("id", user.id);

      if (dbErr) {
        console.error("DB error:", dbErr);
        toast$("SAVE FAILED", "err");
        return;
      }

      setAvatarUrl(publicUrl);
      toast$("AVATAR UPDATED!", "ok");
    } catch (err: any) {
      console.error("Avatar error:", err);
      toast$(err?.message ? err.message.slice(0, 40) : "UPLOAD FAILED", "err");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function searchFriends(q: string) {
    setFriendSearch(q);
    if (q.length < 2) {
      setFriendResults([]);
      return;
    }
    const { data } = await supabase
      .from("users")
      .select("id,username,avatar_url")
      .ilike("username", `%${q}%`)
      .neq("id", userId)
      .limit(8);
    const existingIds = new Set(
      friends.map((f: any) => f.friend_id ?? f.friend?.id),
    );
    setFriendResults((data || []).filter((u: any) => !existingIds.has(u.id)));
  }

  async function sendFriendRequest(targetId: string) {
    setSendingInvite(targetId);
    try {
      const { error } = await supabase
        .from("friend_requests")
        .insert({ sender_id: userId, receiver_id: targetId });
      if (error) throw error;
      toast$("REQUEST SENT!", "ok");
      setFriendResults((prev) => prev.filter((u) => u.id !== targetId));
    } catch {
      toast$("REQUEST FAILED", "err");
    } finally {
      setSendingInvite(null);
    }
  }

  async function removeFriend(friendId: string) {
    try {
      await supabase
        .from("friends")
        .delete()
        .or(
          `and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`,
        );
      const [fd] = await Promise.all([getFriends(userId)]);
      setFriends(fd || []);
      toast$("FRIEND REMOVED", "ok");
    } catch {
      toast$("REMOVE FAILED", "err");
    }
  }

  async function handleAcceptRequest(id: string) {
    try {
      await acceptFriendRequest(id);
      const [fd, rd] = await Promise.all([
        getFriends(userId),
        getPendingFriendRequests(userId),
      ]);
      setFriends(fd || []);
      setFriendRequests(rd || []);
      toast$("ACCEPTED!", "ok");
    } catch {
      toast$("FAILED", "err");
    }
  }

  async function handleRejectRequest(id: string) {
    try {
      await rejectFriendRequest(id);
      const [fd, rd] = await Promise.all([
        getFriends(userId),
        getPendingFriendRequests(userId),
      ]);
      setFriends(fd || []);
      setFriendRequests(rd || []);
      toast$("REJECTED", "ok");
    } catch {
      toast$("FAILED", "err");
    }
  }

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 48,
        }}
      >
        <style>{S}</style>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 24,
              height: 24,
              border: "3px solid #7c3aed",
              borderTopColor: "transparent",
              margin: "0 auto 12px",
              animation: "spin 1s linear infinite",
            }}
          />
          <div className="pf" style={{ fontSize: 8, color: "#4c1d95" }}>
            LOADING...
          </div>
        </div>
      </div>
    );

  return (
    <div style={{ width: "100%" }} className={lm ? "lm" : ""}>
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
          display: lm ? "none" : undefined,
        }}
      />
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === "ok" ? "✓ " : "⚠ "}
          {toast.msg}
        </div>
      )}

      {/* Avatar hero */}
      <div
        className="fade-up"
        style={{
          background: lm ? "#ffffff" : "rgba(8,3,24,.88)",
          border: `2px solid ${lm ? "#e2e8f0" : "#2d1060"}`,
          padding: "28px 20px",
          marginBottom: 14,
          textAlign: "center",
          position: "relative",
          boxShadow: lm ? "5px 5px 0 #e2e8f0" : "5px 5px 0 #0a0018",
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

        {/* Edit toggle */}
        <div style={{ position: "absolute", top: 12, right: 12 }}>
          {editing ? (
            <div style={{ display: "flex", gap: 6 }}>
              <button
                className="p-btn green sm"
                onClick={saveProfile}
                disabled={saving}
              >
                {saving ? (
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      border: "2px solid #fff",
                      borderTopColor: "transparent",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                ) : (
                  <>
                    <Save size={9} />
                    SAVE
                  </>
                )}
              </button>
              <button
                className="p-btn ghost sm"
                onClick={() => setEditing(false)}
              >
                <X size={9} />
                CANCEL
              </button>
            </div>
          ) : (
            <button className="p-btn cyan sm" onClick={startEdit}>
              <Edit2 size={9} />
              EDIT
            </button>
          )}
        </div>

        <div
          style={{
            position: "relative",
            display: "inline-block",
            marginBottom: 14,
          }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="av-glow"
              style={{
                width: 96,
                height: 96,
                objectFit: "cover",
                border: "3px solid #7c3aed",
                display: "block",
              }}
            />
          ) : (
            <div
              className="av-glow"
              style={{
                width: 96,
                height: 96,
                background: lm ? "#ede9fe" : "rgba(45,16,96,.6)",
                border: "3px solid #7c3aed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Users size={40} color={lm ? "#7c3aed" : "#4c1d95"} />
            </div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={{
              position: "absolute",
              bottom: -6,
              right: -6,
              background: "#0e7490",
              border: "2px solid #22d3ee",
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            {uploading ? (
              <div
                style={{
                  width: 10,
                  height: 10,
                  border: "2px solid #fff",
                  borderTopColor: "transparent",
                  animation: "spin 1s linear infinite",
                }}
              />
            ) : (
              <Camera size={13} color="#fff" />
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            style={{ display: "none" }}
            disabled={uploading}
          />
        </div>

        {editing ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              maxWidth: 300,
              margin: "0 auto",
            }}
          >
            <input
              className="p-input"
              value={eName}
              onChange={(e) => setEName(e.target.value)}
              placeholder="USERNAME *"
            />
            <input
              className="p-input"
              type="number"
              value={eAge}
              onChange={(e) => setEAge(e.target.value)}
              placeholder="AGE"
            />
            <input
              className="p-input"
              value={eSchool}
              onChange={(e) => setESchool(e.target.value)}
              placeholder="SCHOOL"
            />
            <textarea
              className="p-textarea"
              value={eBio}
              onChange={(e) => setEBio(e.target.value)}
              placeholder="BIO..."
              rows={3}
            />
          </div>
        ) : (
          <>
            <div
              className="pf"
              style={{
                fontSize: 13,
                color: lm ? "#7c3aed" : "#c084fc",
                marginBottom: 5,
              }}
            >
              {username || "—"}
            </div>
            <div
              className="pf"
              style={{ fontSize: 7, color: lm ? "#9ca3af" : "#3b1d6a" }}
            >
              {email}
            </div>
            {school && (
              <div
                className="pf"
                style={{
                  fontSize: 7,
                  color: lm ? "#9ca3af" : "#2d1060",
                  marginTop: 4,
                }}
              >
                🏫 {school}
              </div>
            )}
            {bio && (
              <div
                className="pf"
                style={{
                  fontSize: 7,
                  color: lm ? "#9ca3af" : "#4c1d95",
                  marginTop: 8,
                  maxWidth: 280,
                  margin: "8px auto 0",
                  lineHeight: 1.8,
                }}
              >
                {bio}
              </div>
            )}
          </>
        )}
      </div>

      {/* Stats */}
      <div
        className="fade-up"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 10,
          marginBottom: 14,
          animationDelay: ".05s",
        }}
      >
        <div className="stat-card" onClick={() => setShowFriends(true)}>
          <div style={{ position: "relative", marginBottom: 8 }}>
            <Users size={20} color="#22d3ee" />
            {friends.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: -4,
                  right: -8,
                  width: 14,
                  height: 14,
                  background: "#22d3ee",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'Press Start 2P',cursive",
                  fontSize: 7,
                  color: "#000",
                }}
              >
                {friends.length}
              </div>
            )}
          </div>
          <div
            className="pf"
            style={{ fontSize: 16, color: "#22d3ee", marginBottom: 4 }}
          >
            {friends.length}
          </div>
          <div className="pf" style={{ fontSize: 6, color: "#0891b2" }}>
            FRIENDS
          </div>
        </div>
        <div className="stat-card" onClick={() => setShowRequests(true)}>
          <div style={{ position: "relative", marginBottom: 8 }}>
            <Clock size={20} color="#fbbf24" />
            {friendRequests.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: -4,
                  right: -8,
                  width: 14,
                  height: 14,
                  background: "#ef4444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'Press Start 2P',cursive",
                  fontSize: 7,
                  color: "#fff",
                }}
              >
                {friendRequests.length}
              </div>
            )}
          </div>
          <div
            className="pf"
            style={{ fontSize: 16, color: "#fbbf24", marginBottom: 4 }}
          >
            {friendRequests.length}
          </div>
          <div className="pf" style={{ fontSize: 6, color: "#92400e" }}>
            REQUESTS
          </div>
        </div>
        <div className="stat-card" onClick={() => setShowAddFriend(true)}>
          <UserPlus size={20} color="#4ade80" style={{ marginBottom: 8 }} />
          <div
            className="pf"
            style={{ fontSize: 16, color: "#4ade80", marginBottom: 4 }}
          >
            +
          </div>
          <div className="pf" style={{ fontSize: 6, color: "#166534" }}>
            ADD
          </div>
        </div>
      </div>

      {/* Info panel */}
      {!editing && (
        <div
          className="fade-up"
          style={{
            background: lm ? "#ffffff" : "rgba(8,3,24,.7)",
            border: `2px solid ${lm ? "#e2e8f0" : "#1a0a35"}`,
            padding: "16px",
            boxShadow: lm ? "3px 3px 0 #e2e8f0" : "3px 3px 0 #0a0018",
            animationDelay: ".1s",
          }}
        >
          <div
            className="pf"
            style={{
              fontSize: 7,
              color: lm ? "#9ca3af" : "#2d1060",
              marginBottom: 12,
            }}
          >
            PROFILE INFO
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {[
              { l: "USERNAME", v: username },
              { l: "EMAIL", v: email },
              ...(age ? [{ l: "AGE", v: age }] : []),
              ...(school ? [{ l: "SCHOOL", v: school }] : []),
            ].map(({ l, v }) => (
              <div key={l} className="info-row">
                <div
                  className="pf"
                  style={{
                    fontSize: 6,
                    color: lm ? "#9ca3af" : "#3b1d6a",
                    marginBottom: 4,
                  }}
                >
                  {l}
                </div>
                <div
                  className="pf"
                  style={{
                    fontSize: 9,
                    color: lm ? "#7c3aed" : "#a78bfa",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {v || "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends modal */}
      {showFriends && (
        <div className="modal-overlay" onClick={() => setShowFriends(false)}>
          <div
            className="modal-box pop-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="corner-dot"
              style={{ top: 0, left: 0, background: "#22d3ee" }}
            />
            <div
              className="corner-dot"
              style={{ top: 0, right: 0, background: "#a855f7" }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 14,
              }}
            >
              <Users size={12} color="#22d3ee" />
              <span className="pf" style={{ fontSize: 9, color: "#22d3ee" }}>
                FRIENDS ({friends.length})
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                marginBottom: 14,
              }}
            >
              {friends.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                  <div
                    className="pf"
                    style={{ fontSize: 8, color: lm ? "#9ca3af" : "#1a0a35" }}
                  >
                    NO FRIENDS YET
                  </div>
                </div>
              ) : (
                friends.map((f: any) => (
                  <div key={f.id} className="friend-row">
                    {f.friend?.avatar_url ? (
                      <img
                        src={f.friend.avatar_url}
                        alt=""
                        style={{
                          width: 34,
                          height: 34,
                          border: "2px solid #3b1d6a",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          background: lm ? "#ede9fe" : "rgba(45,16,96,.5)",
                          border: `2px solid ${lm ? "#c4b5fd" : "#2d1060"}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Users size={14} color="#4c1d95" />
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div
                        className="pf"
                        style={{ fontSize: 8, color: "#c084fc" }}
                      >
                        {f.friend?.username}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          marginTop: 3,
                        }}
                      >
                        {f.friend?.status === "online" ? (
                          <Wifi size={8} color="#22c55e" />
                        ) : (
                          <WifiOff size={8} color="#374151" />
                        )}
                        <span
                          className="pf"
                          style={{
                            fontSize: 6,
                            color:
                              f.friend?.status === "online"
                                ? "#22c55e"
                                : "#374151",
                          }}
                        >
                          {(f.friend?.status || "offline").toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <button
                      className="p-btn red sm"
                      onClick={() => removeFriend(f.friend?.id)}
                    >
                      <UserMinus size={9} />
                    </button>
                  </div>
                ))
              )}
            </div>
            <button
              className="p-btn purple"
              style={{ width: "100%" }}
              onClick={() => setShowFriends(false)}
            >
              ✕ CLOSE
            </button>
          </div>
        </div>
      )}

      {/* Requests modal */}
      {showRequests && (
        <div className="modal-overlay" onClick={() => setShowRequests(false)}>
          <div
            className="modal-box pop-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="corner-dot"
              style={{ top: 0, left: 0, background: "#fbbf24" }}
            />
            <div
              className="corner-dot"
              style={{ top: 0, right: 0, background: "#f472b6" }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 14,
              }}
            >
              <Clock size={12} color="#fbbf24" />
              <span className="pf" style={{ fontSize: 9, color: "#fbbf24" }}>
                REQUESTS ({friendRequests.length})
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                marginBottom: 14,
              }}
            >
              {friendRequests.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                  <div
                    className="pf"
                    style={{ fontSize: 8, color: lm ? "#9ca3af" : "#1a0a35" }}
                  >
                    NO PENDING REQUESTS
                  </div>
                </div>
              ) : (
                friendRequests.map((req) => (
                  <div
                    key={req.id}
                    style={{
                      border: "1px solid #2d1060",
                      background: "rgba(45,16,96,.15)",
                      padding: "12px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 10,
                      }}
                    >
                      {req.sender?.avatar_url ? (
                        <img
                          src={req.sender.avatar_url}
                          alt=""
                          style={{
                            width: 34,
                            height: 34,
                            border: "2px solid #3b1d6a",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            background: "rgba(45,16,96,.5)",
                            border: "2px solid #2d1060",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Users size={14} color="#4c1d95" />
                        </div>
                      )}
                      <div>
                        <div
                          className="pf"
                          style={{ fontSize: 8, color: "#c084fc" }}
                        >
                          {req.sender?.username}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="p-btn green"
                        style={{ flex: 1 }}
                        onClick={() => handleAcceptRequest(req.id)}
                      >
                        <Check size={10} />
                        ACCEPT
                      </button>
                      <button
                        className="p-btn red"
                        style={{ flex: 1 }}
                        onClick={() => handleRejectRequest(req.id)}
                      >
                        <X size={10} />
                        REJECT
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button
              className="p-btn purple"
              style={{ width: "100%" }}
              onClick={() => setShowRequests(false)}
            >
              ✕ CLOSE
            </button>
          </div>
        </div>
      )}

      {/* Add Friend modal */}
      {showAddFriend && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowAddFriend(false);
            setFriendSearch("");
            setFriendResults([]);
          }}
        >
          <div
            className="modal-box pop-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="corner-dot"
              style={{ top: 0, left: 0, background: "#4ade80" }}
            />
            <div
              className="corner-dot"
              style={{ top: 0, right: 0, background: "#22d3ee" }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <UserPlus size={12} color="#4ade80" />
              <span className="pf" style={{ fontSize: 9, color: "#4ade80" }}>
                ADD FRIEND
              </span>
            </div>
            <div className="search-row">
              <Search size={12} color="#3b1d6a" />
              <input
                value={friendSearch}
                onChange={(e) => searchFriends(e.target.value)}
                placeholder="SEARCH BY USERNAME..."
              />
              {friendSearch && (
                <button
                  onClick={() => {
                    setFriendSearch("");
                    setFriendResults([]);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#4c1d95",
                    padding: 0,
                  }}
                >
                  <X size={11} />
                </button>
              )}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                maxHeight: 260,
                overflowY: "auto",
                marginBottom: 14,
              }}
            >
              {friendResults.length === 0 && friendSearch.length >= 2 ? (
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                  <div className="pf" style={{ fontSize: 8, color: "#1a0a35" }}>
                    NO USERS FOUND
                  </div>
                </div>
              ) : friendSearch.length < 2 ? (
                <div style={{ textAlign: "center", padding: "16px 0" }}>
                  <div className="pf" style={{ fontSize: 7, color: "#1a0a35" }}>
                    TYPE 2+ CHARS TO SEARCH
                  </div>
                </div>
              ) : (
                friendResults.map((user) => (
                  <div key={user.id} className="friend-row">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt=""
                        style={{
                          width: 32,
                          height: 32,
                          border: "2px solid #3b1d6a",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          background: lm ? "#ede9fe" : "rgba(45,16,96,.5)",
                          border: `2px solid ${lm ? "#c4b5fd" : "#2d1060"}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Users size={12} color="#4c1d95" />
                      </div>
                    )}
                    <span
                      className="pf"
                      style={{ flex: 1, fontSize: 8, color: "#c084fc" }}
                    >
                      {user.username}
                    </span>
                    <button
                      className="p-btn green sm"
                      onClick={() => sendFriendRequest(user.id)}
                      disabled={sendingInvite === user.id}
                    >
                      {sendingInvite === user.id ? (
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            border: "2px solid #fff",
                            borderTopColor: "transparent",
                            animation: "spin 1s linear infinite",
                          }}
                        />
                      ) : (
                        <>
                          <UserPlus size={9} />
                          ADD
                        </>
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
            <button
              className="p-btn purple"
              style={{ width: "100%" }}
              onClick={() => {
                setShowAddFriend(false);
                setFriendSearch("");
                setFriendResults([]);
              }}
            >
              ✕ CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
