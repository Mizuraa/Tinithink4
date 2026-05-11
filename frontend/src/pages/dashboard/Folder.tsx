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
  .search-row{display:flex;align-items:center;gap:8px;padding:8px 12px;border:2px solid #1a0a35;background:rgba(8,3,24,.7);transition:border-color .2s;margin-bottom:14px}
  .search-row:focus-within{border-color:#4c1d95}
  .search-row input{background:none;border:none;color:#e9d5ff;font-family:'Press Start 2P',cursive;font-size:9px;outline:none;flex:1;min-width:0}
  .search-row input::placeholder{color:#2d1060;font-size:8px}
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(4px);z-index:40;display:flex;align-items:center;justify-content:center;padding:16px}
  .modal-box{background:rgba(8,3,24,.97);border:3px solid #7c3aed;padding:24px;max-width:380px;width:100%;box-shadow:0 0 30px rgba(124,58,237,.3),8px 8px 0 #1e0a40;position:relative;max-height:80vh;overflow-y:auto}
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

  // Logic Fixes
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");
  const [movingFile, setMovingFile] = useState<FileRow | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
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
      if (f.folder_id && map.has(f.folder_id))
        map.get(f.folder_id)!.files.push(row);
      else root.push(row);
    });
    setFolders(Array.from(map.values()));
    setRootFiles(root);
  }

  const handleAddFolder = async () => {
    if (!userId || !folderName.trim()) return;
    const { data, error } = await supabase
      .from("folders")
      .insert({ name: folderName.trim(), user_id: userId })
      .select("id,name")
      .single();
    if (error) return toast$("FAILED TO CREATE", "err");
    setFolders((prev) => [
      ...prev,
      { id: data.id, name: data.name, files: [] },
    ]);
    setFolderName("");
    toast$("FOLDER CREATED!", "ok");
  };

  const handleRenameFolder = async (id: string) => {
    const name = renameVal.trim();
    if (!name) return toast$("ENTER A NAME", "err");
    const { error } = await supabase
      .from("folders")
      .update({ name })
      .eq("id", id);
    if (error) return toast$("RENAME FAILED", "err");
    setFolders((p) => p.map((f) => (f.id === id ? { ...f, name } : f)));
    setRenamingId(null);
    toast$("FOLDER RENAMED!", "ok");
  };

  const uploadFiles = async (filesArr: File[], folderId: string | null) => {
    if (!userId) return;
    setUploading(true);
    let done = 0;
    for (const file of filesArr) {
      const path = `${userId}/${folderId ?? "root"}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file);
      if (!upErr) {
        const { data } = await supabase
          .from("stored_files")
          .insert({
            user_id: userId,
            folder_id: folderId,
            name: file.name,
            path,
            size: file.size,
          })
          .select("*")
          .single();
        if (data) {
          if (folderId)
            setFolders((p) =>
              p.map((f) =>
                f.id === folderId ? { ...f, files: [...f.files, data] } : f,
              ),
            );
          else setRootFiles((p) => [...p, data]);
        }
      }
      done++;
      setUploadPct(Math.round((done / filesArr.length) * 100));
    }
    setUploading(false);
    toast$("UPLOAD COMPLETE", "ok");
  };

  const handleDeleteFile = async (file: FileRow) => {
    await supabase.storage.from(BUCKET).remove([file.path]);
    await supabase.from("stored_files").delete().eq("id", file.id);
    if (file.folder_id)
      setFolders((p) =>
        p.map((f) =>
          f.id === file.folder_id
            ? { ...f, files: f.files.filter((x) => x.id !== file.id) }
            : f,
        ),
      );
    else setRootFiles((p) => p.filter((x) => x.id !== file.id));
    toast$("FILE DELETED", "ok");
  };

  const handleMoveFile = async (file: FileRow, targetId: string | null) => {
    const { error } = await supabase
      .from("stored_files")
      .update({ folder_id: targetId })
      .eq("id", file.id);
    if (error) return toast$("MOVE FAILED", "err");
    await loadFoldersAndFiles(userId!);
    setMovingFile(null);
    toast$("FILE MOVED!", "ok");
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent, targetFolderId: string) => {
      e.preventDefault();
      setDragOverFolder(null);
      const fileId = e.dataTransfer.getData("fileId");
      const file = [...rootFiles, ...folders.flatMap((f) => f.files)].find(
        (f) => f.id === fileId,
      );
      if (file) await handleMoveFile(file, targetFolderId);
    },
    [rootFiles, folders],
  );

  const activeFolder = activeFolderId
    ? folders.find((f) => f.id === activeFolderId)
    : undefined;
  const filteredRootFiles = rootFiles.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const filteredFolders = folders.filter(
    (f) =>
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
        <div className="pf" style={{ fontSize: 9 }}>
          LOADING...
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
      {toast && <div className={`fc-toast ${toast.type}`}>{toast.msg}</div>}

      {movingFile && (
        <div className="modal-overlay" onClick={() => setMovingFile(null)}>
          <div
            className="modal-box pop-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pf" style={{ fontSize: 9, marginBottom: 14 }}>
              MOVE TO:
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <button
                onClick={() => handleMoveFile(movingFile, null)}
                className="top-btn"
                style={{ width: "100%" }}
              >
                ROOT
              </button>
              {folders
                .filter((f) => f.id !== movingFile.folder_id)
                .map((f) => (
                  <button
                    key={f.id}
                    onClick={() => handleMoveFile(movingFile, f.id)}
                    className="top-btn"
                    style={{ width: "100%" }}
                  >
                    {f.name}
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      <div
        className="fade-up"
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <HardDrive size={16} color="#a855f7" />
          <span className="pf" style={{ fontSize: 14 }}>
            {activeFolderId ? `📁 ${activeFolder?.name}` : "FILE SYSTEM"}
          </span>
        </div>
      </div>

      <div className="search-row fade-up">
        <Search size={12} color="#3b1d6a" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="SEARCH..."
        />
      </div>

      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}
      >
        {!activeFolderId ? (
          <>
            <input
              className="folder-input pf"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="NEW FOLDER..."
            />
            <button className="top-btn create" onClick={handleAddFolder}>
              <Plus size={12} /> CREATE
            </button>
          </>
        ) : (
          <button
            className="top-btn back"
            onClick={() => setActiveFolderId(null)}
          >
            <ArrowLeft size={12} /> BACK
          </button>
        )}
        <button
          className="top-btn upload"
          onClick={() =>
            (activeFolderId
              ? folderFileInputRef
              : rootFileInputRef
            ).current?.click()
          }
          disabled={uploading}
        >
          <Upload size={12} /> {uploading ? `${uploadPct}%` : "UPLOAD"}
        </button>
        <input
          type="file"
          ref={rootFileInputRef}
          hidden
          multiple
          onChange={(e) => uploadFiles(Array.from(e.target.files || []), null)}
        />
        <input
          type="file"
          ref={folderFileInputRef}
          hidden
          multiple
          onChange={(e) =>
            uploadFiles(Array.from(e.target.files || []), activeFolderId)
          }
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))",
          gap: 10,
        }}
      >
        {!activeFolderId &&
          filteredFolders.map((folder, i) => (
            <div
              key={folder.id}
              className={`folder-card fade-up ${dragOverFolder === folder.id ? "drag-over" : ""}`}
              style={{ animationDelay: `${i * 40}ms` }}
              onClick={() =>
                renamingId !== folder.id && setActiveFolderId(folder.id)
              }
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverFolder(folder.id);
              }}
              onDragLeave={() => setDragOverFolder(null)}
              onDrop={(e) => handleDrop(e, folder.id)}
            >
              <FolderOpen
                size={32}
                color="#a855f7"
                style={{ marginBottom: 8 }}
              />
              {renamingId === folder.id ? (
                <div onClick={(e) => e.stopPropagation()}>
                  <input
                    className="folder-input"
                    value={renameVal}
                    onChange={(e) => setRenameVal(e.target.value)}
                    style={{ width: "90%", fontSize: 8 }}
                    autoFocus
                  />
                  <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                    <button
                      onClick={() => handleRenameFolder(folder.id)}
                      className="icon-btn open"
                    >
                      <Check size={8} />
                    </button>
                    <button
                      onClick={() => setRenamingId(null)}
                      className="icon-btn del"
                    >
                      <X size={8} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className="pf"
                    style={{ fontSize: 8, textAlign: "center" }}
                  >
                    {folder.name}
                  </div>
                  <div className="action-overlay">
                    <button
                      className="icon-btn open"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenamingId(folder.id);
                        setRenameVal(folder.name);
                      }}
                    >
                      <Edit2 size={8} /> REN
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

        {(activeFolder ? activeFolder.files : filteredRootFiles).map(
          (file, idx) => (
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
                style={{ fontSize: 7, marginTop: 8, textAlign: "center" }}
              >
                {file.name}
              </div>
              <div className="action-overlay">
                <button
                  className="icon-btn open"
                  onClick={() => window.open(file.path, "_blank")}
                >
                  <FolderOpen size={8} /> OPEN
                </button>
                <button
                  className="icon-btn move"
                  onClick={() => setMovingFile(file)}
                >
                  <MoveRight size={8} /> MOVE
                </button>
                <button
                  className="icon-btn del"
                  onClick={() => handleDeleteFile(file)}
                >
                  <Trash2 size={8} /> DEL
                </button>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
