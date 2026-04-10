import React, { useState, useEffect } from "react";
import {
  supabase,
  getCurrentUser,
  transferGroupAdmin,
  kickGroupMember,
  sendGroupInvite,
  searchUsers,
} from "../../lib/supabase";
import { createContext, useContext } from "react";
const _ThemeCtx = createContext<boolean>(false);
function useLightMode() {
  return useContext(_ThemeCtx);
}
import {
  Users,
  Crown,
  Shield,
  UserX,
  UserPlus,
  Search,
  Plus,
  X,
  ChevronRight,
  Trophy,
  Edit2,
  Trash2,
  Settings,
  Check,
} from "lucide-react";

export type GroupType = {
  id: string;
  name: string;
  current_admin: string;
  members: { name: string; points: number; user_id: string; role: string }[];
};

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
  .pf { font-family: 'Press Start 2P', cursive; }
  .pb { border-radius: 0; }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes popIn   { 0%{opacity:0;transform:scale(0.88)} 60%{transform:scale(1.03)} 100%{opacity:1;transform:scale(1)} }
  @keyframes slideIn { from{opacity:0;transform:translateX(16px)} to{opacity:1;transform:translateX(0)} }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.3} }
  @keyframes scanMove{ from{top:-10%} to{top:110%} }
  @keyframes rankPop { 0%{transform:scale(0.5);opacity:0} 70%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
  .fade-up  { animation: fadeUp 0.3s ease both; }
  .pop-in   { animation: popIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both; }
  .slide-in { animation: slideIn 0.3s ease both; }
  .scan-line{ animation: scanMove 8s linear infinite; }
  .g-input {
    background: rgba(8,3,24,0.9); border: 2px solid #2d1060;
    color: #e9d5ff; border-radius: 0; padding: 11px 13px;
    font-family: 'Press Start 2P', cursive; font-size: 9px;
    outline: none; width: 100%; box-sizing: border-box;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .g-input:focus { border-color: #a855f7; box-shadow: 0 0 8px rgba(168,85,247,0.2); }
  .g-input::placeholder { color: #2d1060; }
  .lm .g-row{background:#ffffff!important;border-color:#e2e8f0!important;}
  .lm .g-card{background:#ffffff!important;border-color:#e2e8f0!important;}
  .lm .g-input{background:#ffffff!important;border-color:#e2e8f0!important;color:#1e0a40!important;}
  .lm .g-input::placeholder{color:#9ca3af!important;}
  .lm .search-row{background:#ffffff!important;border-color:#e2e8f0!important;}
  .lm .search-row input{color:#1e0a40!important;}
  .lm .modal-box{background:#ffffff!important;border-color:#7c3aed!important;}
  .g-select { appearance: none; cursor: pointer; }
  .g-select option { background: #0d0620; color: #e9d5ff; }
  .g-btn {
    display: flex; align-items: center; justify-content: center; gap: 7px;
    padding: 11px 14px; border-radius: 0; cursor: pointer;
    font-family: 'Press Start 2P', cursive; font-size: 9px;
    border: 2px solid; transition: filter 0.15s, transform 0.08s;
  }
  .g-btn:hover:not(:disabled) { filter: brightness(1.15); }
  .g-btn:active { transform: translateY(1px); }
  .g-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .g-btn.primary  { background: rgba(14,116,144,0.4); border-color: #22d3ee; color: #67e8f9; }
  .g-btn.success  { background: rgba(20,83,45,0.5); border-color: #22c55e; color: #4ade80; }
  .g-btn.danger   { background: rgba(127,29,29,0.5); border-color: #ef4444; color: #f87171; }
  .g-btn.purple   { background: rgba(124,58,237,0.3); border-color: #7c3aed; color: #c084fc; }
  .g-btn.sm { padding: 7px 10px; font-size: 8px; }
  .group-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 14px; border: 2px solid #1a0a35; cursor: pointer;
    transition: border-color 0.2s, background 0.2s; position: relative;
    background: rgba(8,3,24,0.7);
  }
  .group-row:hover { border-color: #4c1d95; background: rgba(45,16,96,0.2); }
  .group-row.active { border-color: #7c3aed; background: rgba(124,58,237,0.1); box-shadow: 0 0 10px rgba(124,58,237,0.15); }
  .member-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 12px; border: 1px solid #1a0a35;
    background: rgba(8,3,24,0.5); position: relative;
    transition: border-color 0.15s;
  }
  .member-row:hover { border-color: #2d1060; }
  .rank-badge {
    width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
    border: 2px solid; font-family: 'Press Start 2P', cursive; font-size: 8px;
    animation: rankPop 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
  }
  .rank-1 { background: rgba(161,127,0,0.3); border-color: #fbbf24; color: #fde68a; }
  .rank-2 { background: rgba(107,114,128,0.3); border-color: #9ca3af; color: #e5e7eb; }
  .rank-3 { background: rgba(124,63,18,0.3); border-color: #c2813a; color: #fcd9ab; }
  .rank-n { background: rgba(45,16,96,0.3); border-color: #4c1d95; color: #7c3aed; }
  .modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.7);
    backdrop-filter: blur(4px); z-index: 40;
    display: flex; align-items: center; justify-content: center; padding: 16px;
  }
  .modal-box {
    background: rgba(8,3,24,0.97); border: 3px solid #7c3aed;
    padding: 24px; max-width: 400px; width: 100%;
    box-shadow: 0 0 30px rgba(124,58,237,0.3), 8px 8px 0 #1e0a40;
    position: relative; max-height: 80vh; overflow-y: auto;
  }
  .corner-dot { position: absolute; width: 6px; height: 6px; }
  .pts-flash {
    position: absolute; right: 8px; top: 0;
    font-family: 'Press Start 2P', cursive; font-size: 9px; color: #4ade80;
    animation: fadeUp 0.5s ease both, pulse 0.5s ease 0.3s;
    pointer-events: none;
  }
  .toast {
    position: fixed; bottom: 24px; right: 24px; z-index: 999;
    padding: 10px 16px; border: 2px solid; border-radius: 0;
    font-family: 'Press Start 2P', cursive; font-size: 8px;
    animation: popIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
    box-shadow: 4px 4px 0 rgba(0,0,0,0.4);
  }
  .toast.ok  { background: rgba(20,83,45,0.95); border-color: #22c55e; color: #86efac; }
  .toast.err { background: rgba(127,29,29,0.95); border-color: #ef4444; color: #fca5a5; }
  .confirm-box {
    position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 60;
    display: flex; align-items: center; justify-content: center; padding: 16px;
  }
  .confirm-inner {
    background: rgba(8,3,24,0.98); border: 3px solid #ef4444;
    padding: 24px; max-width: 320px; width: 100%;
    box-shadow: 0 0 30px rgba(239,68,68,0.25), 6px 6px 0 #1e0a40;
    text-align: center; position: relative;
  }
  .g-btn.warning { background: rgba(146,64,14,0.5); border-color: #f59e0b; color: #fde68a; }
  .tab-btn {
    flex: 1; padding: 9px 8px; font-family: 'Press Start 2P', cursive; font-size: 8px;
    border: none; cursor: pointer; transition: background 0.15s, color 0.15s; border-radius: 0;
  }
`;

const Groups: React.FC = () => {
  const lm = useLightMode();
  const [groups, setGroups] = useState<GroupType[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "ok" | "err";
  } | null>(null);
  const [pointsFlash, setPointsFlash] = useState<string | null>(null);

  useEffect(() => {
    loadUserAndGroups();
  }, []);

  function showToast(msg: string, type: "ok" | "err") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  }

  async function loadUserAndGroups() {
    try {
      const user = await getCurrentUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("users")
        .select("username")
        .eq("id", user.id)
        .single();
      if (profile) setUserId(user.id);
      loadGroups(user.id);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadGroups(uid: string) {
    try {
      const { data: gm } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", uid);
      if (!gm || gm.length === 0) {
        setGroups([]);
        return;
      }
      const groupIds = gm.map((g) => g.group_id);
      const { data: groupsData } = await supabase
        .from("groups")
        .select("id, name, current_admin")
        .in("id", groupIds);
      const { data: membersData } = await supabase
        .from("group_members")
        .select(
          `group_id, user_id, points, role, users!group_members_user_id_fkey (username)`,
        )
        .in("group_id", groupIds);
      const groupsMap = new Map<string, GroupType>();
      groupsData?.forEach((g) =>
        groupsMap.set(g.id, {
          id: g.id,
          name: g.name,
          current_admin: g.current_admin,
          members: [],
        }),
      );
      membersData?.forEach((m) => {
        const g = groupsMap.get(m.group_id);
        if (g) {
          const u = m.users as any;
          g.members.push({
            name: Array.isArray(u)
              ? u[0]?.username || "Unknown"
              : u?.username || "Unknown",
            points: m.points,
            user_id: m.user_id,
            role: m.role,
          });
        }
      });
      setGroups(Array.from(groupsMap.values()));
    } catch (e) {
      console.error(e);
    }
  }

  async function handleCreateGroup() {
    if (!groupName.trim()) {
      showToast("ENTER GROUP NAME", "err");
      return;
    }
    try {
      const { data: group, error: gErr } = await supabase
        .from("groups")
        .insert({
          name: groupName.trim(),
          created_by: userId,
          current_admin: userId,
        })
        .select()
        .single();
      if (gErr) throw gErr;
      const { error: mErr } = await supabase.from("group_members").insert({
        group_id: group.id,
        user_id: userId,
        role: "admin",
        points: 0,
      });
      if (mErr) throw mErr;
      loadGroups(userId);
      setGroupName("");
      setShowCreate(false);
      showToast("GROUP CREATED!", "ok");
    } catch (e: any) {
      showToast("CREATE FAILED", "err");
    }
  }

  async function handleTransferAdmin(groupId: string, newAdminId: string) {
    setLoading(true);
    try {
      await transferGroupAdmin(groupId, newAdminId);
      showToast("ADMIN TRANSFERRED!", "ok");
      loadGroups(userId);
    } catch (e: any) {
      showToast("TRANSFER FAILED", "err");
    } finally {
      setLoading(false);
    }
  }

  async function handleKickMember(
    groupId: string,
    memberId: string,
    memberName: string,
  ) {
    setLoading(true);
    try {
      await kickGroupMember(groupId, memberId);
      showToast(`${memberName} REMOVED`, "ok");
      loadGroups(userId);
    } catch (e: any) {
      showToast("KICK FAILED", "err");
    } finally {
      setLoading(false);
    }
  }

  async function handleSearchUsers(q: string) {
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const r = await searchUsers(q);
      setSearchResults(r || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleInviteUser(inviteeId: string) {
    if (!selectedGroupId) return;
    setLoading(true);
    try {
      await sendGroupInvite(selectedGroupId, userId, inviteeId);
      showToast("INVITE SENT!", "ok");
      setShowInvite(false);
      setSearchQuery("");
      setSearchResults([]);
    } catch (e: any) {
      showToast("INVITE FAILED", "err");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddPoints(groupId: string) {
    try {
      const { data: cur } = await supabase
        .from("group_members")
        .select("points")
        .eq("group_id", groupId)
        .eq("user_id", userId)
        .single();
      if (!cur) return;
      const { error } = await supabase
        .from("group_members")
        .update({ points: cur.points + 100 })
        .eq("group_id", groupId)
        .eq("user_id", userId);
      if (!error) {
        loadGroups(userId);
        setPointsFlash(groupId);
        setTimeout(() => setPointsFlash(null), 800);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDeleteGroup(groupId: string) {
    setLoading(true);
    try {
      // Delete all members first, then the group
      await supabase.from("group_members").delete().eq("group_id", groupId);
      await supabase.from("group_invites").delete().eq("group_id", groupId);
      const { error } = await supabase
        .from("groups")
        .delete()
        .eq("id", groupId);
      if (error) throw error;
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      if (selectedGroupId === groupId) setSelectedGroupId(null);
      setDeleteConfirm(null);
      showToast("GROUP DELETED", "ok");
    } catch (e: any) {
      showToast("DELETE FAILED", "err");
    } finally {
      setLoading(false);
    }
  }

  async function handleRenameGroup(groupId: string) {
    const name = renameValue.trim();
    if (!name) {
      showToast("ENTER A NAME", "err");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from("groups")
        .update({ name })
        .eq("id", groupId);
      if (error) throw error;
      setGroups((prev) =>
        prev.map((g) => (g.id === groupId ? { ...g, name } : g)),
      );
      setShowRename(false);
      setRenameValue("");
      showToast("GROUP RENAMED!", "ok");
    } catch (e: any) {
      showToast("RENAME FAILED", "err");
    } finally {
      setLoading(false);
    }
  }

  async function handleChangeRole(
    groupId: string,
    memberId: string,
    newRole: string,
  ) {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("group_members")
        .update({ role: newRole })
        .eq("group_id", groupId)
        .eq("user_id", memberId);
      if (error) throw error;
      loadGroups(userId);
      showToast(`ROLE UPDATED TO ${newRole.toUpperCase()}`, "ok");
    } catch (e: any) {
      showToast("ROLE CHANGE FAILED", "err");
    } finally {
      setLoading(false);
    }
  }

  const selectedGroup = groups.find((g) => g.id === selectedGroupId) || null;
  const isAdmin = selectedGroup
    ? selectedGroup.current_admin === userId
    : false;

  return (
    <div style={{ width: "100%" }} className={lm ? "lm" : ""}>
      <style>{STYLES}</style>
      <div
        className="scan-line"
        style={{
          position: "fixed",
          left: 0,
          width: "100%",
          height: 12,
          background:
            "linear-gradient(transparent,rgba(168,85,247,0.03),transparent)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === "ok" ? "✓ " : "⚠ "}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div
        className="fade-up"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Users size={16} color="#a855f7" />
          <span
            className="pf"
            style={{ fontSize: 14, color: lm ? "#7c3aed" : "#c084fc" }}
          >
            GROUPS
          </span>
        </div>
        <button
          className="g-btn primary sm"
          onClick={() => setShowCreate((s) => !s)}
        >
          <Plus size={11} />
          {showCreate ? "CANCEL" : "NEW GROUP"}
        </button>
      </div>

      {/* Create panel */}
      {showCreate && (
        <div
          className="pop-in"
          style={{
            marginBottom: 16,
            padding: "16px",
            background: "rgba(8,3,24,0.9)",
            border: "2px solid #7c3aed",
            position: "relative",
            boxShadow: "4px 4px 0 #1e0a40",
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
            className="pf"
            style={{
              fontSize: 8,
              color: lm ? "#9ca3af" : "#4c1d95",
              marginBottom: 12,
            }}
          >
            NEW GROUP
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="g-input"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="GROUP NAME..."
              onKeyDown={(e) => e.key === "Enter" && handleCreateGroup()}
            />
            <button
              className="g-btn success"
              style={{ whiteSpace: "nowrap" }}
              onClick={handleCreateGroup}
            >
              ▶ CREATE
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
        {/* Left — group list */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 10,
            }}
          >
            <div style={{ width: 3, height: 14, background: "#a855f7" }} />
            <span className="pf" style={{ fontSize: 8, color: "#6b21a8" }}>
              YOUR GROUPS ({groups.length})
            </span>
          </div>

          {groups.length === 0 ? (
            <div style={{ padding: "32px 0", textAlign: "center" }}>
              <Users
                size={32}
                color={lm ? "#9ca3af" : "#1a0a35"}
                style={{ margin: "0 auto 10px" }}
              />
              <div
                className="pf"
                style={{ fontSize: 8, color: lm ? "#9ca3af" : "#1a0a35" }}
              >
                NO GROUPS YET
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {groups.map((g, i) => (
                <div
                  key={g.id}
                  style={{ display: "flex", alignItems: "stretch", gap: 0 }}
                >
                  <div
                    className={`group-row fade-up ${g.id === selectedGroupId ? "active" : ""}`}
                    style={{ animationDelay: `${i * 50}ms`, flex: 1 }}
                    onClick={() =>
                      setSelectedGroupId(g.id === selectedGroupId ? null : g.id)
                    }
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          background:
                            g.id === selectedGroupId ? "#a855f7" : "#2d1060",
                          boxShadow:
                            g.id === selectedGroupId
                              ? "0 0 6px #a855f7"
                              : "none",
                          transition: "all 0.2s",
                        }}
                      />
                      <span
                        className="pf"
                        style={{
                          fontSize: 9,
                          color:
                            g.id === selectedGroupId ? "#e9d5ff" : "#6b21a8",
                        }}
                      >
                        {g.name}
                      </span>
                      {g.current_admin === userId && (
                        <Crown size={10} color="#fbbf24" />
                      )}
                    </div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span
                        className="pf"
                        style={{
                          fontSize: 7,
                          color: lm ? "#9ca3af" : "#2d1060",
                        }}
                      >
                        {g.members.length}
                      </span>
                      <ChevronRight
                        size={12}
                        color={g.id === selectedGroupId ? "#a855f7" : "#2d1060"}
                        style={{
                          transform:
                            g.id === selectedGroupId ? "rotate(90deg)" : "none",
                          transition: "transform 0.2s",
                        }}
                      />
                    </div>
                  </div>
                  {g.current_admin === userId && (
                    <div style={{ display: "flex" }}>
                      <button
                        title="Rename group"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedGroupId(g.id);
                          setRenameValue(g.name);
                          setShowRename(true);
                        }}
                        style={{
                          background: "rgba(45,16,96,0.4)",
                          border: `1px solid ${lm ? "#e2e8f0" : "#1a0a35"}`,
                          borderLeft: "none",
                          color: "#6b21a8",
                          padding: "0 10px",
                          cursor: "pointer",
                          transition: "color 0.15s, background 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          (e.target as HTMLElement).style.color = "#a855f7";
                          (e.target as HTMLElement).style.background =
                            "rgba(124,58,237,0.2)";
                        }}
                        onMouseLeave={(e) => {
                          (e.target as HTMLElement).style.color = "#6b21a8";
                          (e.target as HTMLElement).style.background =
                            "rgba(45,16,96,0.4)";
                        }}
                      >
                        <Edit2 size={11} />
                      </button>
                      <button
                        title="Delete group"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm(g.id);
                        }}
                        style={{
                          background: "rgba(127,29,29,0.3)",
                          border: `1px solid ${lm ? "#e2e8f0" : "#1a0a35"}`,
                          borderLeft: "none",
                          color: "#7f1d1d",
                          padding: "0 10px",
                          cursor: "pointer",
                          transition: "color 0.15s, background 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          (e.target as HTMLElement).style.color = "#f87171";
                          (e.target as HTMLElement).style.background =
                            "rgba(185,28,28,0.3)";
                        }}
                        onMouseLeave={(e) => {
                          (e.target as HTMLElement).style.color = "#7f1d1d";
                          (e.target as HTMLElement).style.background =
                            "rgba(127,29,29,0.3)";
                        }}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Group Detail */}
        {selectedGroup && (
          <div
            className="slide-in"
            style={{
              background: "rgba(8,3,24,0.8)",
              border: `2px solid ${lm ? "#e2e8f0" : "#2d1060"}`,
              padding: "18px",
              position: "relative",
              boxShadow: "4px 4px 0 #0a0018",
            }}
          >
            <div
              className="corner-dot"
              style={{ top: 0, left: 0, background: "#7c3aed" }}
            />
            <div
              className="corner-dot"
              style={{ top: 0, right: 0, background: "#38bdf8" }}
            />

            {/* Leaderboard header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <Trophy size={13} color="#fbbf24" />
              <span className="pf" style={{ fontSize: 9, color: "#fbbf24" }}>
                LEADERBOARD
              </span>
              <span
                className="pf"
                style={{ fontSize: 7, color: lm ? "#9ca3af" : "#2d1060" }}
              >
                — {selectedGroup.name}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                marginBottom: 16,
              }}
            >
              {selectedGroup.members
                .slice()
                .sort((a, b) => b.points - a.points)
                .map((member, idx) => (
                  <div
                    key={member.user_id}
                    className="member-row"
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    {pointsFlash === selectedGroup.id &&
                      member.user_id === userId && (
                        <div className="pts-flash">+100</div>
                      )}
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <div
                        className={`rank-badge ${idx === 0 ? "rank-1" : idx === 1 ? "rank-2" : idx === 2 ? "rank-3" : "rank-n"}`}
                        style={{ animationDelay: `${idx * 60}ms` }}
                      >
                        {idx === 0 ? "★" : `${idx + 1}`}
                      </div>
                      <div>
                        <div
                          className="pf"
                          style={{
                            fontSize: 8,
                            color:
                              member.user_id === userId ? "#c084fc" : "#a1a1aa",
                          }}
                        >
                          {member.name}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            marginTop: 3,
                          }}
                        >
                          {member.role === "admin" && (
                            <>
                              <Crown size={9} color="#fbbf24" />
                              <span
                                className="pf"
                                style={{ fontSize: 6, color: "#fbbf24" }}
                              >
                                ADMIN
                              </span>
                            </>
                          )}
                          {member.role === "moderator" && (
                            <>
                              <Shield size={9} color="#60a5fa" />
                              <span
                                className="pf"
                                style={{ fontSize: 6, color: "#60a5fa" }}
                              >
                                MOD
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <div style={{ textAlign: "right" }}>
                        <div
                          className="pf"
                          style={{
                            fontSize: 10,
                            color: idx === 0 ? "#fde68a" : "#7c3aed",
                          }}
                        >
                          {member.points}
                        </div>
                        <div
                          className="pf"
                          style={{
                            fontSize: 6,
                            color: lm ? "#9ca3af" : "#2d1060",
                          }}
                        >
                          PTS
                        </div>
                      </div>
                      {member.user_id === userId && (
                        <button
                          className="g-btn primary sm"
                          onClick={() => handleAddPoints(selectedGroup.id)}
                        >
                          +100
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            {/* Admin Controls */}
            {isAdmin && (
              <div
                style={{
                  borderTop: "1px solid #1a0a35",
                  paddingTop: 14,
                  display: "flex",
                  gap: 8,
                }}
              >
                <button
                  className="g-btn warning"
                  style={{ flex: 1 }}
                  onClick={() => setShowManage(true)}
                >
                  <Settings size={11} /> MANAGE MEMBERS
                </button>
                <button
                  className="g-btn success"
                  style={{ flex: 1 }}
                  onClick={() => setShowInvite(true)}
                >
                  <UserPlus size={11} /> INVITE
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Manage Members Modal */}
      {showManage && selectedGroup && (
        <div className="modal-overlay" onClick={() => setShowManage(false)}>
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
              style={{ top: 0, right: 0, background: "#a855f7" }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Settings size={13} color="#fbbf24" />
                <span className="pf" style={{ fontSize: 9, color: "#fbbf24" }}>
                  MANAGE MEMBERS
                </span>
              </div>
              <button
                onClick={() => setShowManage(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: lm ? "#9ca3af" : "#4c1d95",
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Transfer Admin */}
            <div
              style={{
                marginBottom: 16,
                padding: "12px",
                background: "rgba(45,16,96,0.2)",
                border: "1px solid #2d1060",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 10,
                }}
              >
                <Crown size={11} color="#fbbf24" />
                <span className="pf" style={{ fontSize: 7, color: "#fbbf24" }}>
                  TRANSFER ADMIN
                </span>
              </div>
              <select
                className="g-input g-select"
                onChange={(e) =>
                  e.target.value &&
                  handleTransferAdmin(selectedGroup.id, e.target.value)
                }
                disabled={loading}
              >
                <option value="">▾ SELECT NEW ADMIN...</option>
                {selectedGroup.members
                  .filter((m) => m.user_id !== userId)
                  .map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.name} ({m.role})
                    </option>
                  ))}
              </select>
            </div>

            {/* Members list */}
            <div
              className="pf"
              style={{
                fontSize: 7,
                color: lm ? "#9ca3af" : "#4c1d95",
                marginBottom: 8,
              }}
            >
              ALL MEMBERS ({selectedGroup.members.length})
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                maxHeight: 280,
                overflowY: "auto",
                marginBottom: 14,
              }}
            >
              {selectedGroup.members.map((m) => (
                <div
                  key={m.user_id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 10px",
                    background: "rgba(8,3,24,0.6)",
                    border: `1px solid ${lm ? "#e2e8f0" : "#1a0a35"}`,
                  }}
                >
                  {/* Role icon */}
                  <div style={{ flexShrink: 0 }}>
                    {m.role === "admin" ? (
                      <Crown size={12} color="#fbbf24" />
                    ) : m.role === "moderator" ? (
                      <Shield size={12} color="#60a5fa" />
                    ) : (
                      <Users size={12} color={lm ? "#9ca3af" : "#4c1d95"} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      className="pf"
                      style={{
                        fontSize: 8,
                        color: m.user_id === userId ? "#c084fc" : "#a1a1aa",
                      }}
                    >
                      {m.name}
                      {m.user_id === userId && " (YOU)"}
                    </div>
                    <div
                      className="pf"
                      style={{
                        fontSize: 6,
                        color: lm ? "#9ca3af" : "#3b1d6a",
                        marginTop: 2,
                      }}
                    >
                      {m.role.toUpperCase()}
                    </div>
                  </div>
                  {m.user_id !== userId && (
                    <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                      {/* Role toggle */}
                      <select
                        value={m.role}
                        onChange={(e) =>
                          handleChangeRole(
                            selectedGroup.id,
                            m.user_id,
                            e.target.value,
                          )
                        }
                        disabled={loading}
                        style={{
                          background: "rgba(45,16,96,0.5)",
                          border: "1px solid #2d1060",
                          color: "#7c3aed",
                          fontFamily: "'Press Start 2P',cursive",
                          fontSize: 7,
                          padding: "4px 6px",
                          cursor: "pointer",
                          borderRadius: 0,
                          outline: "none",
                        }}
                      >
                        <option value="member">MEMBER</option>
                        <option value="moderator">MOD</option>
                      </select>
                      {/* Kick */}
                      <button
                        className="g-btn danger sm"
                        onClick={() =>
                          handleKickMember(selectedGroup.id, m.user_id, m.name)
                        }
                        disabled={loading}
                        title="Kick member"
                      >
                        <UserX size={10} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              className="g-btn purple"
              style={{ width: "100%" }}
              onClick={() => setShowManage(false)}
            >
              ✕ CLOSE
            </button>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {showRename && selectedGroup && (
        <div className="modal-overlay" onClick={() => setShowRename(false)}>
          <div
            className="modal-box pop-in"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 320 }}
          >
            <div
              className="corner-dot"
              style={{ top: 0, left: 0, background: "#38bdf8" }}
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
                marginBottom: 16,
              }}
            >
              <Edit2 size={13} color="#38bdf8" />
              <span className="pf" style={{ fontSize: 9, color: "#38bdf8" }}>
                RENAME GROUP
              </span>
            </div>
            <div
              className="pf"
              style={{
                fontSize: 7,
                color: lm ? "#9ca3af" : "#4c1d95",
                marginBottom: 8,
              }}
            >
              CURRENT: {selectedGroup.name}
            </div>
            <input
              className="g-input"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="NEW NAME..."
              style={{ marginBottom: 12 }}
              onKeyDown={(e) =>
                e.key === "Enter" && handleRenameGroup(selectedGroup.id)
              }
              autoFocus
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="g-btn success"
                style={{ flex: 1 }}
                onClick={() => handleRenameGroup(selectedGroup.id)}
                disabled={loading}
              >
                <Check size={11} /> SAVE
              </button>
              <button
                className="g-btn danger"
                style={{ flex: 1 }}
                onClick={() => setShowRename(false)}
              >
                <X size={11} /> CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="confirm-box">
          <div className="confirm-inner pop-in">
            <div
              className="corner-dot"
              style={{ top: 0, left: 0, background: "#ef4444" }}
            />
            <div
              className="corner-dot"
              style={{ top: 0, right: 0, background: "#ef4444" }}
            />
            <Trash2
              size={32}
              color="#ef4444"
              style={{ margin: "0 auto 14px" }}
            />
            <div
              className="pf"
              style={{ fontSize: 10, color: "#f87171", marginBottom: 8 }}
            >
              DELETE GROUP?
            </div>
            <div
              className="pf"
              style={{ fontSize: 7, color: "#7f1d1d", marginBottom: 6 }}
            >
              {groups.find((g) => g.id === deleteConfirm)?.name}
            </div>
            <div
              className="pf"
              style={{
                fontSize: 7,
                color: lm ? "#9ca3af" : "#4c1d95",
                marginBottom: 20,
              }}
            >
              THIS CANNOT BE UNDONE
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="g-btn danger"
                style={{ flex: 1 }}
                onClick={() => handleDeleteGroup(deleteConfirm)}
                disabled={loading}
              >
                {loading ? (
                  "DELETING..."
                ) : (
                  <>
                    <Trash2 size={10} /> DELETE
                  </>
                )}
              </button>
              <button
                className="g-btn purple"
                style={{ flex: 1 }}
                onClick={() => setDeleteConfirm(null)}
              >
                <X size={10} /> CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInvite && (
        <div className="modal-overlay" onClick={() => setShowInvite(false)}>
          <div
            className="modal-box pop-in"
            onClick={(e) => e.stopPropagation()}
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

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <UserPlus size={13} color="#a855f7" />
                <span
                  className="pf"
                  style={{ fontSize: 10, color: lm ? "#7c3aed" : "#c084fc" }}
                >
                  INVITE TO GROUP
                </span>
              </div>
              <button
                onClick={() => setShowInvite(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: lm ? "#9ca3af" : "#4c1d95",
                  padding: 4,
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ position: "relative", marginBottom: 14 }}>
              <Search
                size={12}
                color={lm ? "#9ca3af" : "#4c1d95"}
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />
              <input
                className="g-input"
                value={searchQuery}
                onChange={(e) => handleSearchUsers(e.target.value)}
                placeholder="SEARCH USERS..."
                style={{ paddingLeft: 30 }}
              />
            </div>

            <div
              style={{
                maxHeight: 220,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 6,
                marginBottom: 14,
              }}
            >
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    background: "rgba(45,16,96,0.2)",
                    border: "1px solid #2d1060",
                  }}
                >
                  <div>
                    <div
                      className="pf"
                      style={{ fontSize: 9, color: lm ? "#7c3aed" : "#c084fc" }}
                    >
                      {user.username}
                    </div>
                    {user.display_name && (
                      <div
                        className="pf"
                        style={{
                          fontSize: 7,
                          color: lm ? "#9ca3af" : "#4c1d95",
                          marginTop: 3,
                        }}
                      >
                        {user.display_name}
                      </div>
                    )}
                  </div>
                  <button
                    className="g-btn primary sm"
                    onClick={() => handleInviteUser(user.id)}
                    disabled={loading}
                  >
                    INVITE
                  </button>
                </div>
              ))}
              {searchQuery.length >= 2 && searchResults.length === 0 && (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div
                    className="pf"
                    style={{ fontSize: 8, color: lm ? "#9ca3af" : "#2d1060" }}
                  >
                    NO USERS FOUND
                  </div>
                </div>
              )}
              {searchQuery.length < 2 && (
                <div style={{ textAlign: "center", padding: "16px 0" }}>
                  <div
                    className="pf"
                    style={{ fontSize: 7, color: lm ? "#9ca3af" : "#1a0a35" }}
                  >
                    TYPE 2+ CHARS TO SEARCH
                  </div>
                </div>
              )}
            </div>

            <button
              className="g-btn danger"
              style={{ width: "100%" }}
              onClick={() => setShowInvite(false)}
            >
              ✕ CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
