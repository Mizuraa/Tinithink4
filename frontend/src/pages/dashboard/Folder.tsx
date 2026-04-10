import React, { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import {
  FolderOpen,
  Folder as FolderIcon,
  Upload,
  Plus,
  Trash2,
  FileText,
  File,
  ArrowLeft,
  HardDrive,
  Edit2,
  Check,
  X,
  Search,
  MoveRight,
} from "lucide-react";

const BUCKET = "documents";

const S = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
  .pf{font-family:'Press Start 2P',cursive;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes popIn{0%{opacity:0;transform:scale(0.88)}60%{transform:scale(1.03)}100%{opacity:1;transform:scale(1)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
  @keyframes scanMove{from{top:-10%}to{top:110%}}
  @keyframes spin{to{transform:rotate(360deg)}}
  .fade-up{animation:fadeUp .3s ease both}
  .pop-in{animation:popIn .3s cubic-bezier(.34,1.56,.64,1) both}
  .scan-line{animation:scanMove 8s linear infinite}
  .folder-card{
    background:rgba(8,3,24,.85);border:2px solid #2d1060;padding:16px 12px;
    display:flex;flex-direction:column;align-items:center;cursor:pointer;position:relative;
    transition:border-color .2s,box-shadow .2s,transform .15s;min-height:120px;justify-content:center;
  }
  .folder-card:hover{border-color:#7c3aed;box-shadow:0 0 12px rgba(124,58,237,.2),4px 4px 0 #1e0a40;transform:translateY(-2px)}
  .folder-card.drag-over{border-color:#22c55e !important;background:rgba(20,83,45,.2) !important;box-shadow:0 0 16px rgba(34,197,94,.3) !important}
  .file-card{
    background:rgba(8,3,24,.85);border:2px solid #1e3a5f;padding:14px 10px;
    display:flex;flex-direction:column;align-items:center;position:relative;
    transition:border-color .2s,box-shadow .2s,transform .15s;min-height:120px;justify-content:center;
  }
  .file-card:hover{border-color:#0e7490;box-shadow:0 0 10px rgba(14,116,144,.2),3px 3px 0 #0e4d6a;transform:translateY(-2px)}
  /* Light mode overrides */
  .lm .folder-card{background:#ffffff;border-color:#e2e8f0;}
  .lm .folder-card:hover{border-color:#7c3aed;box-shadow:3px 3px 0 #e2e8f0;}
  .lm .file-card{background:#ffffff;border-color:#e2e8f0;}
  .lm .file-card:hover{border-color:#0e7490;box-shadow:3px 3px 0 #e2e8f0;}
  .lm .folder-input{background:#ffffff;border-color:#e2e8f0;color:#1e0a40;}
  .lm .folder-input::placeholder{color:#9ca3af;}
  .lm .search-row{background:#ffffff;border-color:#e2e8f0;}
  .lm .search-row input{color:#1e0a40;}
  .lm .drop-zone{border-color:#e2e8f0;background:#f8fafc;}
  .lm .modal-box{background:#ffffff;border-color:#7c3aed;}
  .action-overlay{position:absolute;top:4px;right:4px;display:flex;flex-direction:column;gap:4px;opacity:0;transition:opacity .2s}
  .folder-card:hover .action-overlay,.file-card:hover .action-overlay{opacity:1}
  .icon-btn{display:flex;align-items:center;gap:4px;padding:4px 7px;cursor:pointer;font-family:'Press Start 2P',cursive;font-size:7px;border:1px solid;transition:filter .15s}
  .icon-btn:hover{filter:brightness(1.2)}
  .icon-btn.open{background:rgba(14,116,144,.7);border-color:#0e7490;color:#67e8f9}
  .icon-btn.del{background:rgba(127,29,29,.7);border-color:#7f1d1d;color:#f87171}
  .icon-btn.move{background:rgba(45,16,96,.7);border-color:#4c1d95;color:#a855f7}
  .top-btn{display:flex;align-items:center;gap:7px;padding:10px 14px;cursor:pointer;font-family:'Press Start 2P',cursive;font-size:9px;border:2px solid;transition:filter .15s,transform .08s}
  .top-btn:hover:not(:disabled){filter:brightness(1.15)}.top-btn:active{transform:translateY(1px)}
  .top-btn.create{background:rgba(20,83,45,.5);border-color:#22c55e;color:#4ade80}
  .top-btn.upload{background:rgba(14,116,144,.4);border-color:#22d3ee;color:#67e8f9}
  .top-btn.back{background:rgba(45,16,96,.5);border-color:#7c3aed;color:#c084fc}
  .folder-input{background:rgba(8,3,24,.9);border:2px solid #2d1060;color:#e9d5ff;padding:10px 12px;font-family:'Press Start 2P',cursive;font-size:9px;outline:none;flex:1;transition:border-color .2s}
  .folder-input:focus{border-color:#a855f7}
  .folder-input::placeholder{color:#2d1060}
  .fc-toast{position:fixed;bottom:24px;right:24px;z-index:999;padding:10px 16px;border:2px solid;font-family:'Press Start 2P',cursive;font-size:8px;animation:popIn .3s ease both;box-shadow:4px 4px 0 rgba(0,0,0,.4)}
  .fc-toast.ok{background:rgba(20,83,45,.95);border-color:#22c55e;color:#86efac}
  .fc-toast.err{background:rgba(127,29,29,.95);border-color:#ef4444;color:#fca5a5}
  .section-label{display:flex;align-items:center;gap:8px;margin-bottom:12px}
  .corner-dot{position:absolute;width:5px;height:5px}
  .search-row{display:flex;align-items:center;gap:8px;padding:8px 12px;border:2px solid #1a0a35;background:rgba(8,3,24,.7);transition:border-color .2s;margin-bottom:14px}
  .search-row:focus-within{border-color:#4c1d95}
  .search-row input{background:none;border:none;color:#e9d5ff;font-family:'Press Start 2P',cursive;font-size:9px;outline:none;flex:1;min-width:0}
  .search-row input::placeholder{color:#2d1060;font-size:8px}
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(4px);z-index:40;display:flex;align-items:center;justify-content:center;padding:16px}
  .modal-box{background:rgba(8,3,24,.97);border:3px solid #7c3aed;padding:24px;max-width:380px;width:100%;box-shadow:0 0 30px rgba(124,58,237,.3),8px 8px 0 #1e0a40;position:relative;max-height:80vh;overflow-y:auto}
  .drop-zone{border:2px dashed #2d1060;padding:24px;text-align:center;transition:all .2s;cursor:pointer}
  .drop-zone.active{border-color:#a855f7;background:rgba(124,58,237,.08)}
`;

type FileRow = {
  id: string;
  name: string;
  path: string;
  size: number | null;
  folder_id: string | null;
};
type FolderData = { id: string; name: string; files: FileRow[] };

function FileIcon({ name }: { name: string }) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf") return <FileText size={30} color="#f87171" />;
  if (ext === "doc" || ext === "docx")
    return <FileText size={30} color="#60a5fa" />;
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext))
    return <File size={30} color="#4ade80" />;
  if (["mp4", "mov", "avi"].includes(ext))
    return <File size={30} color="#f472b6" />;
  if (["zip", "rar", "7z"].includes(ext))
    return <File size={30} color="#fbbf24" />;
  return <File size={30} color="#c084fc" />;
}

function fmtSize(bytes: number | null) {
  if (!bytes) return "0B";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

export default function FolderSystemSupabase() {
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [folderName, setFolderName] = useState("");
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [rootFiles, setRootFiles] = useState<FileRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [toast, setToast] = useState<{
    msg: string;
    type: "ok" | "err";
  } | null>(null);
  // rename
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");
  // move file modal
  const [movingFile, setMovingFile] = useState<FileRow | null>(null);
  // drag
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  // search
  const [searchQuery, setSearchQuery] = useState("");
  const lm = (() => {
    try {
      return localStorage.getItem("tt_light_mode") === "true";
    } catch {
      return false;
    }
  })();
  const rootFileInputRef = useRef<HTMLInputElement>(null);
  const folderFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);
      await loadFoldersAndFiles(user.id);
      setLoading(false);
    })();
  }, []);

  const toast$ = (msg: string, type: "ok" | "err") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  async function loadFoldersAndFiles(uid: string) {
    const { data: folderRows } = await supabase
      .from("folders")
      .select("id,name")
      .eq("user_id", uid)
      .order("created_at", { ascending: true });
    const { data: fileRows } = await supabase
      .from("stored_files")
      .select("id,name,path,size,folder_id")
      .eq("user_id", uid);
    const map = new Map<string, FolderData>();
    (folderRows ?? []).forEach((f) =>
      map.set(f.id, { id: f.id, name: f.name, files: [] }),
    );
    const root: FileRow[] = [];
    (fileRows ?? []).forEach((f: any) => {
      const row: FileRow = {
        id: f.id,
        name: f.name,
        path: f.path,
        size: f.size,
        folder_id: f.folder_id,
      };
      if (f.folder_id) {
        const folder = map.get(f.folder_id);
        if (folder) folder.files.push(row);
      } else root.push(row);
    });
    setFolders(Array.from(map.values()));
    setRootFiles(root);
  }

  async function handleAddFolder() {
    if (!userId || !folderName.trim()) return;
    const { data, error } = await supabase
      .from("folders")
      .insert({ name: folderName.trim(), user_id: userId })
      .select("id,name")
      .single();
    if (error) {
      toast$("FAILED TO CREATE", "err");
      return;
    }
    setFolders((prev) => [
      ...prev,
      { id: data.id, name: data.name, files: [] },
    ]);
    setFolderName("");
    toast$("FOLDER CREATED!", "ok");
  }

  async function handleRenameFolder(id: string) {
    const name = renameVal.trim();
    if (!name) {
      toast$("ENTER A NAME", "err");
      return;
    }
    const { error } = await supabase
      .from("folders")
      .update({ name })
      .eq("id", id);
    if (error) {
      toast$("RENAME FAILED", "err");
      return;
    }
    setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, name } : f)));
    setRenamingId(null);
    toast$("FOLDER RENAMED!", "ok");
  }

  async function uploadFiles(filesArr: File[], folderId: string | null) {
    if (!userId) return;
    setUploading(true);
    setUploadPct(0);
    let done = 0;
    for (const file of filesArr) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `documents/${userId}/${folderId ?? "root"}/${Date.now()}_${safeName}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: false });
      if (upErr) {
        done++;
        setUploadPct(Math.round((done / filesArr.length) * 100));
        continue;
      }
      const { data, error: dbErr } = await supabase
        .from("stored_files")
        .insert({
          user_id: userId,
          folder_id: folderId,
          name: file.name,
          path,
          size: file.size,
        })
        .select("id,name,path,size,folder_id")
        .single();
      if (!dbErr && data) {
        if (folderId)
          setFolders((prev) =>
            prev.map((f) =>
              f.id === folderId ? { ...f, files: [...f.files, data] } : f,
            ),
          );
        else setRootFiles((prev) => [...prev, data]);
      }
      done++;
      setUploadPct(Math.round((done / filesArr.length) * 100));
    }
    setUploading(false);
    setUploadPct(0);
    toast$(`${filesArr.length} FILE(S) UPLOADED`, "ok");
  }

  async function handleOpenFile(file: FileRow) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .download(file.path);
    if (error || !data) {
      toast$("CANNOT OPEN FILE", "err");
      return;
    }
    const url = URL.createObjectURL(data);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  async function handleDeleteFile(file: FileRow) {
    await supabase.storage.from(BUCKET).remove([file.path]);
    const { error } = await supabase
      .from("stored_files")
      .delete()
      .eq("id", file.id);
    if (error) {
      toast$("DELETE FAILED", "err");
      return;
    }
    if (file.folder_id)
      setFolders((prev) =>
        prev.map((f) =>
          f.id === file.folder_id
            ? { ...f, files: f.files.filter((x) => x.id !== file.id) }
            : f,
        ),
      );
    else setRootFiles((prev) => prev.filter((x) => x.id !== file.id));
    toast$("FILE DELETED", "ok");
  }

  async function handleDeleteFolder(folderId: string) {
    if (!userId) return;
    const { data: files } = await supabase
      .from("stored_files")
      .select("path")
      .eq("user_id", userId)
      .eq("folder_id", folderId);
    if (files?.length)
      await supabase.storage.from(BUCKET).remove(files.map((f) => f.path));
    await supabase.from("stored_files").delete().eq("folder_id", folderId);
    await supabase.from("folders").delete().eq("id", folderId);
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    if (activeFolderId === folderId) setActiveFolderId(null);
    toast$("FOLDER DELETED", "ok");
  }

  async function handleMoveFile(file: FileRow, targetFolderId: string | null) {
    const { error } = await supabase
      .from("stored_files")
      .update({ folder_id: targetFolderId })
      .eq("id", file.id);
    if (error) {
      toast$("MOVE FAILED", "err");
      return;
    }
    // Remove from old location
    if (file.folder_id)
      setFolders((prev) =>
        prev.map((f) =>
          f.id === file.folder_id
            ? { ...f, files: f.files.filter((x) => x.id !== file.id) }
            : f,
        ),
      );
    else setRootFiles((prev) => prev.filter((x) => x.id !== file.id));
    // Add to new location
    const updated = { ...file, folder_id: targetFolderId };
    if (targetFolderId)
      setFolders((prev) =>
        prev.map((f) =>
          f.id === targetFolderId ? { ...f, files: [...f.files, updated] } : f,
        ),
      );
    else setRootFiles((prev) => [...prev, updated]);
    setMovingFile(null);
    toast$("FILE MOVED!", "ok");
  }

  // Drag-drop onto folder
  const handleDrop = useCallback(
    async (e: React.DragEvent, targetFolderId: string) => {
      e.preventDefault();
      setDragOverFolder(null);
      const fileId = e.dataTransfer.getData("fileId");
      if (!fileId) return;
      const allFiles = [...rootFiles, ...folders.flatMap((f) => f.files)];
      const file = allFiles.find((f) => f.id === fileId);
      if (file) await handleMoveFile(file, targetFolderId);
    },
    [rootFiles, folders],
  );

  const activeFolder = activeFolderId
    ? folders.find((f) => f.id === activeFolderId)
    : undefined;
  const totalFiles =
    folders.reduce((s, f) => s + f.files.length, 0) + rootFiles.length;

  const filteredRootFiles = rootFiles.filter(
    (f) =>
      !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const filteredFolders = folders.filter(
    (f) =>
      !searchQuery ||
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.files.some((x) =>
        x.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
  );

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 40,
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
          <div className="pf" style={{ fontSize: 9, color: "#4c1d95" }}>
            LOADING FILES...
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
        <div className={`fc-toast ${toast.type}`}>
          {toast.type === "ok" ? "✓ " : "⚠ "}
          {toast.msg}
        </div>
      )}

      {/* Move file modal */}
      {movingFile && (
        <div className="modal-overlay" onClick={() => setMovingFile(null)}>
          <div
            className="modal-box pop-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="corner-dot"
              style={{ top: 0, left: 0, background: "#a855f7" }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 14,
              }}
            >
              <MoveRight size={13} color="#a855f7" />
              <span className="pf" style={{ fontSize: 9, color: "#c084fc" }}>
                MOVE FILE
              </span>
            </div>
            <div
              className="pf"
              style={{ fontSize: 7, color: "#4c1d95", marginBottom: 14 }}
            >
              {movingFile.name}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {movingFile.folder_id && (
                <button
                  onClick={() => handleMoveFile(movingFile, null)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    background: lm ? "#f8fafc" : "rgba(8,3,24,.6)",
                    border: `1px solid ${lm ? "#e2e8f0" : "#1a0a35"}`,
                    cursor: "pointer",
                    transition: "border-color .15s",
                  }}
                >
                  <HardDrive size={12} color="#38bdf8" />
                  <span
                    className="pf"
                    style={{ fontSize: 8, color: "#38bdf8" }}
                  >
                    ROOT (UNSORTED)
                  </span>
                </button>
              )}
              {folders
                .filter((f) => f.id !== movingFile.folder_id)
                .map((f) => (
                  <button
                    key={f.id}
                    onClick={() => handleMoveFile(movingFile, f.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      background: "rgba(8,3,24,.6)",
                      border: "1px solid #1a0a35",
                      cursor: "pointer",
                      transition: "border-color .15s",
                    }}
                  >
                    <FolderIcon size={12} color="#a855f7" />
                    <span
                      className="pf"
                      style={{ fontSize: 8, color: "#c084fc" }}
                    >
                      {f.name}
                    </span>
                    <span
                      className="pf"
                      style={{
                        fontSize: 6,
                        color: "#2d1060",
                        marginLeft: "auto",
                      }}
                    >
                      {f.files.length} FILES
                    </span>
                  </button>
                ))}
            </div>
            <button
              onClick={() => setMovingFile(null)}
              style={{
                marginTop: 14,
                width: "100%",
                padding: 10,
                background: "rgba(45,16,96,.3)",
                border: "2px solid #2d1060",
                color: "#6b21a8",
                cursor: "pointer",
                fontFamily: "'Press Start 2P',cursive",
                fontSize: 8,
              }}
            >
              ✕ CANCEL
            </button>
          </div>
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
          <HardDrive size={16} color="#a855f7" />
          <span
            className="pf"
            style={{ fontSize: 14, color: lm ? "#7c3aed" : "#c084fc" }}
          >
            {activeFolderId && activeFolder
              ? `📁 ${activeFolder.name}`
              : "FILE SYSTEM"}
          </span>
        </div>
        <span
          className="pf"
          style={{ fontSize: 7, color: lm ? "#9ca3af" : "#2d1060" }}
        >
          {totalFiles} FILES
        </span>
      </div>

      {/* Search */}
      {!activeFolderId && (
        <div className="search-row fade-up">
          <Search size={12} color="#3b1d6a" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="SEARCH FILES & FOLDERS..."
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
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
      )}

      {/* Controls */}
      {!activeFolderId ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 20,
          }}
        >
          <input
            className="folder-input"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="NEW FOLDER NAME..."
            onKeyDown={(e) => e.key === "Enter" && handleAddFolder()}
            style={{ minWidth: 160, flex: 1 }}
          />
          <button className="top-btn create" onClick={handleAddFolder}>
            <Plus size={12} />
            CREATE
          </button>
          <button
            className="top-btn upload"
            onClick={() => rootFileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload size={12} />
            {uploading ? `${uploadPct}%` : "UPLOAD"}
          </button>
          <input
            type="file"
            ref={rootFileInputRef}
            hidden
            multiple
            onChange={(e) => {
              const f = e.target.files ? Array.from(e.target.files) : [];
              uploadFiles(f, null);
              e.target.value = "";
            }}
          />
        </div>
      ) : (
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <button
            className="top-btn back"
            onClick={() => setActiveFolderId(null)}
          >
            <ArrowLeft size={12} />
            BACK
          </button>
          <button
            className="top-btn upload"
            onClick={() => folderFileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload size={12} />
            {uploading ? `${uploadPct}%` : "UPLOAD FILES"}
          </button>
          <input
            type="file"
            ref={folderFileInputRef}
            hidden
            multiple
            onChange={(e) => {
              const f = e.target.files ? Array.from(e.target.files) : [];
              uploadFiles(f, activeFolderId);
              e.target.value = "";
            }}
          />
        </div>
      )}

      {/* Drop zone hint when no folder active */}
      {!activeFolderId && totalFiles === 0 && !searchQuery && (
        <div
          className="drop-zone fade-up"
          style={{ marginBottom: 20 }}
          onClick={() => rootFileInputRef.current?.click()}
        >
          <Upload
            size={28}
            color={lm ? "#9ca3af" : "#2d1060"}
            style={{ margin: "0 auto 10px" }}
          />
          <div
            className="pf"
            style={{ fontSize: 8, color: lm ? "#9ca3af" : "#2d1060" }}
          >
            DROP FILES HERE OR CLICK TO UPLOAD
          </div>
        </div>
      )}

      {/* Unsorted root files */}
      {!activeFolderId && filteredRootFiles.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div className="section-label">
            <div style={{ width: 3, height: 14, background: "#38bdf8" }} />
            <span className="pf" style={{ fontSize: 8, color: "#0891b2" }}>
              UNSORTED FILES
            </span>
            <span
              className="pf"
              style={{ fontSize: 7, color: lm ? "#9ca3af" : "#1e3a5f" }}
            >
              ({filteredRootFiles.length})
            </span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))",
              gap: 10,
            }}
          >
            {filteredRootFiles.map((file, idx) => (
              <div
                key={file.id}
                className="file-card fade-up"
                style={{ animationDelay: `${idx * 30}ms` }}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("fileId", file.id)}
              >
                <FileIcon name={file.name} />
                <div
                  className="pf"
                  style={{
                    fontSize: 7,
                    color: lm ? "#374151" : "#93c5fd",
                    textAlign: "center",
                    marginTop: 8,
                    wordBreak: "break-all",
                  }}
                >
                  {file.name.length > 16
                    ? file.name.substring(0, 13) + "..."
                    : file.name}
                </div>
                <div
                  className="pf"
                  style={{
                    fontSize: 6,
                    color: lm ? "#9ca3af" : "#1e3a5f",
                    marginTop: 4,
                  }}
                >
                  {fmtSize(file.size)}
                </div>
                <div className="action-overlay">
                  <button
                    className="icon-btn open"
                    onClick={() => handleOpenFile(file)}
                  >
                    <FolderOpen size={8} />
                    OPEN
                  </button>
                  <button
                    className="icon-btn move"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMovingFile(file);
                    }}
                  >
                    <MoveRight size={8} />
                    MOVE
                  </button>
                  <button
                    className="icon-btn del"
                    onClick={() => handleDeleteFile(file)}
                  >
                    <Trash2 size={8} />
                    DEL
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Folders grid */}
      {!activeFolderId && (
        <>
          <div className="section-label">
            <div style={{ width: 3, height: 14, background: "#a855f7" }} />
            <span className="pf" style={{ fontSize: 8, color: "#7c3aed" }}>
              FOLDERS
            </span>
            <span
              className="pf"
              style={{ fontSize: 7, color: lm ? "#9ca3af" : "#2d1060" }}
            >
              ({filteredFolders.length})
            </span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))",
              gap: 10,
            }}
          >
            {filteredFolders.length === 0 ? (
              <div
                style={{
                  gridColumn: "1/-1",
                  textAlign: "center",
                  padding: "32px 0",
                }}
              >
                <FolderIcon
                  size={36}
                  color={lm ? "#e2e8f0" : "#1a0a35"}
                  style={{ margin: "0 auto 12px" }}
                />
                <div
                  className="pf"
                  style={{ fontSize: 8, color: lm ? "#9ca3af" : "#1a0a35" }}
                >
                  {searchQuery ? "NO MATCHES" : "NO FOLDERS YET"}
                </div>
              </div>
            ) : (
              filteredFolders.map((folder, i) => (
                <div
                  key={folder.id}
                  className={`folder-card fade-up ${dragOverFolder === folder.id ? "drag-over" : ""}`}
                  style={{ animationDelay: `${i * 40}ms` }}
                  onClick={() => {
                    if (renamingId !== folder.id) setActiveFolderId(folder.id);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverFolder(folder.id);
                  }}
                  onDragLeave={() => setDragOverFolder(null)}
                  onDrop={(e) => handleDrop(e, folder.id)}
                >
                  <FolderOpen
                    size={32}
                    color={dragOverFolder === folder.id ? "#22c55e" : "#a855f7"}
                    style={{ marginBottom: 8 }}
                  />

                  {renamingId === folder.id ? (
                    <div
                      style={{ width: "100%" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        className="folder-input"
                        value={renameVal}
                        onChange={(e) => setRenameVal(e.target.value)}
                        style={{
                          width: "100%",
                          fontSize: 8,
                          padding: "5px 7px",
                          marginBottom: 6,
                        }}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleRenameFolder(folder.id)
                        }
                        autoFocus
                      />
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          onClick={() => handleRenameFolder(folder.id)}
                          style={{
                            flex: 1,
                            background: "rgba(20,83,45,.5)",
                            border: "1px solid #22c55e",
                            color: "#4ade80",
                            padding: "4px",
                            cursor: "pointer",
                            fontFamily: "'Press Start 2P',cursive",
                            fontSize: 7,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Check size={9} />
                        </button>
                        <button
                          onClick={() => setRenamingId(null)}
                          style={{
                            flex: 1,
                            background: "rgba(127,29,29,.3)",
                            border: "1px solid #7f1d1d",
                            color: "#f87171",
                            padding: "4px",
                            cursor: "pointer",
                            fontFamily: "'Press Start 2P',cursive",
                            fontSize: 7,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <X size={9} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        className="pf"
                        style={{
                          fontSize: 8,
                          color: lm ? "#7c3aed" : "#c084fc",
                          textAlign: "center",
                          wordBreak: "break-all",
                        }}
                      >
                        {folder.name.length > 14
                          ? folder.name.substring(0, 12) + "..."
                          : folder.name}
                      </div>
                      <div
                        className="pf"
                        style={{
                          fontSize: 6,
                          color: lm ? "#9ca3af" : "#4c1d95",
                          marginTop: 5,
                        }}
                      >
                        {folder.files.length} FILE
                        {folder.files.length !== 1 ? "S" : ""}
                      </div>
                    </>
                  )}

                  <div
                    className="corner-dot"
                    style={{ top: 0, left: 0, background: "#7c3aed" }}
                  />
                  <div
                    className="corner-dot"
                    style={{ bottom: 0, right: 0, background: "#7c3aed" }}
                  />
                  <div
                    className="action-overlay"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="icon-btn"
                      style={{
                        background: "rgba(45,16,96,.7)",
                        borderColor: "#4c1d95",
                        color: "#a855f7",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenamingId(folder.id);
                        setRenameVal(folder.name);
                      }}
                    >
                      <Edit2 size={8} />
                      RENAME
                    </button>
                    <button
                      className="icon-btn del"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFolder(folder.id);
                      }}
                    >
                      <Trash2 size={8} />
                      DEL
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Folder contents */}
      {activeFolderId && activeFolder && (
        <div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))",
              gap: 10,
            }}
          >
            {activeFolder.files.length === 0 ? (
              <div
                style={{
                  gridColumn: "1/-1",
                  textAlign: "center",
                  padding: "40px 0",
                }}
              >
                <div
                  className="drop-zone"
                  onClick={() => folderFileInputRef.current?.click()}
                >
                  <Upload
                    size={28}
                    color="#2d1060"
                    style={{ margin: "0 auto 10px" }}
                  />
                  <div className="pf" style={{ fontSize: 7, color: "#2d1060" }}>
                    EMPTY — UPLOAD FILES
                  </div>
                </div>
              </div>
            ) : (
              activeFolder.files.map((file, idx) => (
                <div
                  key={file.id}
                  className="file-card fade-up"
                  style={{ animationDelay: `${idx * 30}ms` }}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("fileId", file.id)}
                >
                  <FileIcon name={file.name} />
                  <div
                    className="pf"
                    style={{
                      fontSize: 7,
                      color: "#93c5fd",
                      textAlign: "center",
                      marginTop: 8,
                      wordBreak: "break-all",
                    }}
                  >
                    {file.name.length > 16
                      ? file.name.substring(0, 13) + "..."
                      : file.name}
                  </div>
                  <div
                    className="pf"
                    style={{
                      fontSize: 6,
                      color: lm ? "#9ca3af" : "#1e3a5f",
                      marginTop: 4,
                    }}
                  >
                    {fmtSize(file.size)}
                  </div>
                  <div className="action-overlay">
                    <button
                      className="icon-btn open"
                      onClick={() => handleOpenFile(file)}
                    >
                      <FolderOpen size={8} />
                      OPEN
                    </button>
                    <button
                      className="icon-btn move"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMovingFile(file);
                      }}
                    >
                      <MoveRight size={8} />
                      MOVE
                    </button>
                    <button
                      className="icon-btn del"
                      onClick={() => handleDeleteFile(file)}
                    >
                      <Trash2 size={8} />
                      DEL
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
