import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { createContext, useContext } from "react";
const _ThemeCtx = createContext<boolean>(false);
function useLightMode() {
  return useContext(_ThemeCtx);
}
import {
  BookMarked,
  Plus,
  Trash2,
  Underline,
  Palette,
  Search,
  X,
  Edit2,
  Check,
  SortAsc,
  SortDesc,
} from "lucide-react";

type ReviewItem = {
  id: string;
  term: string;
  definition: string;
  highlightColor?: string;
  underline?: boolean;
};

const COLORS = [
  { hex: "#00ffff", name: "CYAN" },
  { hex: "#fbbf24", name: "YELLOW" },
  { hex: "#f87171", name: "RED" },
  { hex: "#4ade80", name: "GREEN" },
  { hex: "#f472b6", name: "PINK" },
  { hex: "#60a5fa", name: "BLUE" },
];

const S = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
  .pf{font-family:'Press Start 2P',cursive;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes popIn{0%{opacity:0;transform:scale(0.88)}60%{transform:scale(1.03)}100%{opacity:1;transform:scale(1)}}
  @keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-4px)}60%{transform:translateX(4px)}}
  @keyframes scanMove{from{top:-10%}to{top:110%}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
  .fade-up{animation:fadeUp .3s ease both}
  .pop-in{animation:popIn .3s cubic-bezier(.34,1.56,.64,1) both}
  .shk{animation:shake .35s ease}
  .scan-line{animation:scanMove 8s linear infinite}
  .r-input{
    background:rgba(8,3,24,.9);border:2px solid #2d1060;color:#e9d5ff;border-radius:0;
    width:100%;padding:12px 14px;font-family:'Press Start 2P',cursive;font-size:9px;
    outline:none;box-sizing:border-box;transition:border-color .2s,box-shadow .2s;
  }
  .r-input:focus{border-color:#a855f7;box-shadow:0 0 8px rgba(168,85,247,.25)}
  .r-input::placeholder{color:#2d1060;font-size:8px}
  .r-btn{
    display:flex;align-items:center;justify-content:center;gap:7px;padding:10px 14px;
    border-radius:0;cursor:pointer;font-family:'Press Start 2P',cursive;font-size:9px;
    border:2px solid;transition:filter .15s,transform .08s;
  }
  .r-btn:hover:not(:disabled){filter:brightness(1.15)}
  .r-btn:active:not(:disabled){transform:translateY(1px)}
  .r-btn:disabled{opacity:.4;cursor:not-allowed}
  .r-btn.primary{background:rgba(14,116,144,.4);border-color:#22d3ee;color:#67e8f9}
  .r-btn.success{background:rgba(20,83,45,.5);border-color:#22c55e;color:#4ade80}
  .r-btn.danger{background:rgba(127,29,29,.5);border-color:#ef4444;color:#f87171}
  .r-btn.purple{background:rgba(124,58,237,.3);border-color:#7c3aed;color:#c084fc}
  .r-btn.ghost{background:rgba(45,16,96,.3);border-color:#2d1060;color:#6b21a8}
  .r-btn.sm{padding:6px 10px;font-size:8px}
  .r-btn.w100{width:100%}
  .color-swatch{width:26px;height:26px;border:2px solid transparent;cursor:pointer;transition:transform .15s,border-color .15s;position:relative}
  .color-swatch:hover{transform:scale(1.15)}
  .color-swatch.active{border-color:#fff !important;transform:scale(1.1)}
  .color-swatch.active::after{content:'';position:absolute;inset:3px;background:rgba(255,255,255,.25)}
  .underline-btn{display:flex;align-items:center;gap:7px;padding:8px 12px;border:2px solid #2d1060;background:rgba(8,3,24,.6);cursor:pointer;font-family:'Press Start 2P',cursive;font-size:8px;transition:border-color .2s,background .2s;border-radius:0}
  .underline-btn.on{border-color:#a855f7;background:rgba(124,58,237,.2);color:#c084fc}
  .underline-btn.off{color:#3b1d6a}
  .term-card{background:rgba(8,3,24,.8);border:2px solid #1a0a35;padding:14px 14px 14px 16px;position:relative;transition:border-color .2s,transform .15s;box-shadow:3px 3px 0 #0a0018}
  .term-card:hover{border-color:#2d1060;transform:translateY(-1px)}
  .term-card.editing{border-color:#7c3aed;background:rgba(8,3,24,.95)}
  .del-btn{position:absolute;top:8px;right:8px;background:rgba(127,29,29,.5);border:1px solid #7f1d1d;color:#f87171;width:26px;height:26px;display:flex;align-items:center;justify-content:center;cursor:pointer;border-radius:0;transition:background .15s}
  .del-btn:hover{background:rgba(185,28,28,.6)}
  .edit-btn{position:absolute;top:8px;right:38px;background:rgba(45,16,96,.5);border:1px solid #3b1d6a;color:#6b21a8;width:26px;height:26px;display:flex;align-items:center;justify-content:center;cursor:pointer;border-radius:0;transition:background .15s}
  .edit-btn:hover{background:rgba(88,28,135,.5);color:#a855f7}
  .color-bar{height:3px;width:100%;margin-bottom:10px}
  .search-row{display:flex;align-items:center;gap:8px;padding:8px 12px;border:2px solid #1a0a35;background:rgba(8,3,24,.7);transition:border-color .2s}
  .search-row:focus-within{border-color:#4c1d95}
  .search-row input{background:none;border:none;color:#e9d5ff;font-family:'Press Start 2P',cursive;font-size:9px;outline:none;flex:1;min-width:0}
  .search-row input::placeholder{color:#2d1060;font-size:8px}
  .toast{position:fixed;bottom:24px;right:24px;z-index:999;padding:10px 16px;border:2px solid;border-radius:0;font-family:'Press Start 2P',cursive;font-size:8px;animation:popIn .3s ease both;box-shadow:4px 4px 0 rgba(0,0,0,.4)}
  .toast.ok{background:rgba(20,83,45,.95);border-color:#22c55e;color:#86efac}
  .toast.err{background:rgba(127,29,29,.95);border-color:#ef4444;color:#fca5a5}
  .corner-dot{position:absolute;width:5px;height:5px}
  .lm .term-card{background:#fff!important;border-color:#e2e8f0!important;box-shadow:3px 3px 0 #e2e8f0!important}
  .lm .r-input{background:#fff!important;border-color:#e2e8f0!important;color:#1e0a40!important}
  .lm .search-row{background:#fff!important;border-color:#e2e8f0!important}
  .lm .search-row input{color:#1e0a40!important}
  .lm .underline-btn{border-color:#e2e8f0!important;color:#374151!important}
  .tag{display:inline-flex;align-items:center;gap:4px;padding:3px 7px;border:1px solid;font-family:'Press Start 2P',cursive;font-size:7px;cursor:pointer;transition:all .15s}
`;

export function Reviewer() {
  const lm = useLightMode();
  const [reviewList, setReviewList] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "ok" | "err";
  } | null>(null);

  // Add form
  const [term, setTerm] = useState("");
  const [definition, setDefinition] = useState("");
  const [nextColor, setNextColor] = useState<string | undefined>(undefined);
  const [nextUnderline, setNextUnderline] = useState(false);
  const [formShake, setFormShake] = useState(false);

  // Inline edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTerm, setEditTerm] = useState("");
  const [editDef, setEditDef] = useState("");
  const [editColor, setEditColor] = useState<string | undefined>(undefined);
  const [editUnderline, setEditUnderline] = useState(false);

  // Filter/search/sort
  const [searchQuery, setSearchQuery] = useState("");
  const [filterColor, setFilterColor] = useState<string | null>(null);
  const [sortAZ, setSortAZ] = useState<boolean | null>(null); // null=default, true=A-Z, false=Z-A

  useEffect(() => {
    loadTerms();
  }, []);
  const toast$ = (msg: string, type: "ok" | "err") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  async function loadTerms() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("reviewer_terms")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data)
      setReviewList(
        data.map((t) => ({
          id: t.id,
          term: t.term,
          definition: t.definition,
          highlightColor: t.highlight_color,
          underline: t.underline,
        })),
      );
  }

  async function addItem() {
    if (!term.trim() || !definition.trim()) {
      setFormShake(true);
      setTimeout(() => setFormShake(false), 400);
      toast$("FILL BOTH FIELDS", "err");
      return;
    }
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast$("LOGIN REQUIRED", "err");
        return;
      }
      const { data, error } = await supabase
        .from("reviewer_terms")
        .insert({
          user_id: user.id,
          term: term.trim(),
          definition: definition.trim(),
          highlight_color: nextColor || null,
          underline: nextUnderline,
        })
        .select()
        .single();
      if (error) throw error;
      setReviewList([
        {
          id: data.id,
          term: data.term,
          definition: data.definition,
          highlightColor: data.highlight_color,
          underline: data.underline,
        },
        ...reviewList,
      ]);
      setTerm("");
      setDefinition("");
      setNextColor(undefined);
      setNextUnderline(false);
      toast$("TERM ADDED!", "ok");
    } catch {
      toast$("SAVE FAILED", "err");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(item: ReviewItem) {
    setEditingId(item.id);
    setEditTerm(item.term);
    setEditDef(item.definition);
    setEditColor(item.highlightColor);
    setEditUnderline(item.underline ?? false);
  }

  async function saveEdit(id: string) {
    if (!editTerm.trim() || !editDef.trim()) {
      toast$("FILL BOTH FIELDS", "err");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from("reviewer_terms")
        .update({
          term: editTerm.trim(),
          definition: editDef.trim(),
          highlight_color: editColor || null,
          underline: editUnderline,
        })
        .eq("id", id);
      if (error) throw error;
      setReviewList((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                term: editTerm.trim(),
                definition: editDef.trim(),
                highlightColor: editColor,
                underline: editUnderline,
              }
            : item,
        ),
      );
      setEditingId(null);
      toast$("TERM UPDATED!", "ok");
    } catch {
      toast$("UPDATE FAILED", "err");
    } finally {
      setLoading(false);
    }
  }

  async function removeItem(id: string) {
    const { error } = await supabase
      .from("reviewer_terms")
      .delete()
      .eq("id", id);
    if (error) {
      toast$("DELETE FAILED", "err");
      return;
    }
    setReviewList((prev) => prev.filter((item) => item.id !== id));
    if (editingId === id) setEditingId(null);
    toast$("TERM REMOVED", "ok");
  }

  const displayed = reviewList
    .filter((item) => {
      if (filterColor && item.highlightColor !== filterColor) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.term.toLowerCase().includes(q) ||
          item.definition.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortAZ === null) return 0;
      return sortAZ
        ? a.term.localeCompare(b.term)
        : b.term.localeCompare(a.term);
    });

  return (
    <div style={{ width: "100%" }}>
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
          <BookMarked size={16} color="#a855f7" />
          <span className="pf" style={{ fontSize: 14, color: "#c084fc" }}>
            REVIEWER
          </span>
          <span
            className="pf"
            style={{
              fontSize: 7,
              color: lm ? "#9ca3af" : "#3b1d6a",
              padding: "3px 7px",
              border: `1px solid ${lm ? "#e2e8f0" : lm ? "#e2e8f0" : "#1a0a35"}`,
            }}
          >
            {reviewList.length} TERMS
          </span>
        </div>
        <div style={{ display: "flex", gap: 7 }}>
          <button
            className="r-btn ghost sm"
            onClick={() =>
              setSortAZ((s) => (s === true ? false : s === false ? null : true))
            }
          >
            {sortAZ === null ? (
              <SortAsc size={10} />
            ) : sortAZ ? (
              <SortAsc size={10} />
            ) : (
              <SortDesc size={10} />
            )}
            {sortAZ === null ? "DEFAULT" : sortAZ ? "A→Z" : "Z→A"}
          </button>
        </div>
      </div>

      {/* Add form */}
      <div
        className={`fade-up ${formShake ? "shk" : ""}`}
        style={{
          background: lm ? "#ffffff" : "rgba(8,3,24,.85)",
          border: `2px solid ${lm ? "#e2e8f0" : "#2d1060"}`,
          padding: "18px",
          marginBottom: 16,
          boxShadow: "4px 4px 0 #0a0018",
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
          className="pf"
          style={{
            fontSize: 7,
            color: lm ? "#9ca3af" : "#2d1060",
            marginBottom: 14,
          }}
        >
          ◆ ADD TERM
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <input
            className="r-input"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="TERM"
          />
          <input
            className="r-input"
            value={definition}
            onChange={(e) => setDefinition(e.target.value)}
            placeholder="DEFINITION"
            onKeyDown={(e) => e.key === "Enter" && addItem()}
          />
        </div>
        {/* Styling controls */}
        <div
          style={{
            background: "rgba(45,16,96,.2)",
            border: `1px solid ${lm ? "#e2e8f0" : lm ? "#e2e8f0" : "#1a0a35"}`,
            padding: "12px",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              marginBottom: 10,
            }}
          >
            <Palette size={11} color={lm ? "#9ca3af" : "#4c1d95"} />
            <span
              className="pf"
              style={{ fontSize: 7, color: lm ? "#9ca3af" : "#3b1d6a" }}
            >
              HIGHLIGHT COLOR:
            </span>
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {COLORS.map((c) => (
              <div
                key={c.hex}
                className={`color-swatch ${nextColor === c.hex ? "active" : ""}`}
                style={{
                  background: c.hex,
                  borderColor: nextColor === c.hex ? "#fff" : "transparent",
                }}
                onClick={() =>
                  setNextColor(nextColor === c.hex ? undefined : c.hex)
                }
                title={c.name}
              />
            ))}
            {nextColor && (
              <button
                onClick={() => setNextColor(undefined)}
                style={{
                  background: "rgba(255,255,255,.1)",
                  border: "2px solid #374151",
                  color: "#9ca3af",
                  width: 26,
                  height: 26,
                  cursor: "pointer",
                  fontFamily: "monospace",
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ×
              </button>
            )}
          </div>
          {nextColor && (
            <div
              style={{
                marginTop: 8,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <div style={{ width: 16, height: 3, background: nextColor }} />
              <span
                className="pf"
                style={{
                  fontSize: 8,
                  color: nextColor,
                  background: nextColor + "33",
                  padding: "2px 6px",
                }}
              >
                PREVIEW
              </span>
            </div>
          )}
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <button
            className={`underline-btn ${nextUnderline ? "on" : "off"}`}
            onClick={() => setNextUnderline((u) => !u)}
          >
            <Underline size={11} />
            <span>UNDERLINE: {nextUnderline ? "ON" : "OFF"}</span>
          </button>
          {nextUnderline && (
            <span
              className="pf"
              style={{
                fontSize: 8,
                color: "#a855f7",
                textDecoration: "underline",
              }}
            >
              SAMPLE
            </span>
          )}
        </div>
        <button
          className="r-btn success w100"
          onClick={addItem}
          disabled={loading}
        >
          {loading ? (
            <>
              <div
                style={{
                  width: 9,
                  height: 9,
                  border: "2px solid #fff",
                  borderTopColor: "transparent",
                  animation: "spin 1s linear infinite",
                }}
              />
              SAVING...
            </>
          ) : (
            <>
              <Plus size={12} />
              ADD TERM
            </>
          )}
        </button>
      </div>

      {/* Search + filter bar */}
      <div
        style={{
          marginBottom: 14,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div className="search-row fade-up">
          <Search size={12} color={lm ? "#9ca3af" : "#3b1d6a"} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="SEARCH TERMS..."
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: lm ? "#9ca3af" : "#4c1d95",
                padding: 0,
              }}
            >
              <X size={11} />
            </button>
          )}
          <span
            className="pf"
            style={{
              fontSize: 7,
              color: lm ? "#9ca3af" : "#2d1060",
              whiteSpace: "nowrap",
            }}
          >
            {displayed.length}/{reviewList.length}
          </span>
        </div>
        {/* Color filter chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {COLORS.filter((c) =>
            reviewList.some((item) => item.highlightColor === c.hex),
          ).map((c) => (
            <span
              key={c.hex}
              className="tag"
              style={{
                borderColor:
                  filterColor === c.hex ? c.hex : lm ? "#e2e8f0" : "#1a0a35",
                background:
                  filterColor === c.hex ? c.hex + "33" : "transparent",
                color: filterColor === c.hex ? c.hex : "#2d1060",
              }}
              onClick={() =>
                setFilterColor(filterColor === c.hex ? null : c.hex)
              }
            >
              <div style={{ width: 8, height: 8, background: c.hex }} />
              {c.name}
            </span>
          ))}
          {filterColor && (
            <span
              className="tag"
              style={{ borderColor: "#3b1d6a", color: "#6b21a8" }}
              onClick={() => setFilterColor(null)}
            >
              <X size={8} />
              CLEAR
            </span>
          )}
        </div>
      </div>

      {/* Terms list */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <div style={{ width: 3, height: 14, background: "#a855f7" }} />
          <span className="pf" style={{ fontSize: 8, color: "#6b21a8" }}>
            REVIEW TERMS ({displayed.length}
            {displayed.length !== reviewList.length
              ? ` / ${reviewList.length}`
              : ""}
            )
          </span>
        </div>

        {displayed.length === 0 ? (
          <div style={{ textAlign: "center", padding: "36px 0" }}>
            <BookMarked
              size={36}
              color={lm ? "#9ca3af" : "#1a0a35"}
              style={{ margin: "0 auto 12px" }}
            />
            <div
              className="pf"
              style={{ fontSize: 8, color: lm ? "#e2e8f0" : "#1a0a35" }}
            >
              {reviewList.length === 0 ? "NO TERMS YET" : "NO MATCHES FOUND"}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {displayed.map((item, idx) => (
              <div
                key={item.id}
                className={`term-card fade-up ${editingId === item.id ? "editing" : ""}`}
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                {item.highlightColor && (
                  <div
                    className="color-bar"
                    style={{
                      background: `linear-gradient(90deg,${item.highlightColor}66,transparent)`,
                    }}
                  />
                )}

                {editingId === item.id ? (
                  /* Inline edit mode */
                  <div style={{ paddingRight: 8 }}>
                    <div
                      className="pf"
                      style={{
                        fontSize: 7,
                        color: "#7c3aed",
                        marginBottom: 10,
                      }}
                    >
                      ✏ EDITING
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        marginBottom: 12,
                      }}
                    >
                      <input
                        className="r-input"
                        style={{ fontSize: 9 }}
                        value={editTerm}
                        onChange={(e) => setEditTerm(e.target.value)}
                        placeholder="TERM"
                      />
                      <input
                        className="r-input"
                        style={{ fontSize: 9 }}
                        value={editDef}
                        onChange={(e) => setEditDef(e.target.value)}
                        placeholder="DEFINITION"
                      />
                    </div>
                    {/* Color picker */}
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        alignItems: "center",
                        marginBottom: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      {COLORS.map((c) => (
                        <div
                          key={c.hex}
                          className={`color-swatch ${editColor === c.hex ? "active" : ""}`}
                          style={{
                            background: c.hex,
                            borderColor:
                              editColor === c.hex ? "#fff" : "transparent",
                          }}
                          onClick={() =>
                            setEditColor(
                              editColor === c.hex ? undefined : c.hex,
                            )
                          }
                          title={c.name}
                        />
                      ))}
                      {editColor && (
                        <button
                          onClick={() => setEditColor(undefined)}
                          style={{
                            background: "rgba(255,255,255,.1)",
                            border: "1px solid #374151",
                            color: "#9ca3af",
                            width: 24,
                            height: 24,
                            cursor: "pointer",
                            fontSize: 14,
                          }}
                        >
                          ×
                        </button>
                      )}
                      <button
                        className={`underline-btn ${editUnderline ? "on" : "off"}`}
                        style={{ padding: "5px 9px" }}
                        onClick={() => setEditUnderline((u) => !u)}
                      >
                        <Underline size={10} />
                        UL:{editUnderline ? "ON" : "OFF"}
                      </button>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="r-btn success"
                        style={{ flex: 1 }}
                        onClick={() => saveEdit(item.id)}
                        disabled={loading}
                      >
                        <Check size={10} />
                        SAVE
                      </button>
                      <button
                        className="r-btn ghost"
                        style={{ flex: 1 }}
                        onClick={() => setEditingId(null)}
                      >
                        <X size={10} />
                        CANCEL
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View mode */
                  <>
                    <button
                      className="edit-btn"
                      onClick={() => startEdit(item)}
                      title="Edit"
                    >
                      <Edit2 size={11} />
                    </button>
                    <button
                      className="del-btn"
                      onClick={() => removeItem(item.id)}
                      title="Remove"
                    >
                      <Trash2 size={11} />
                    </button>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "baseline",
                        gap: "6px 10px",
                        paddingRight: 64,
                      }}
                    >
                      <span
                        className="pf"
                        style={{
                          fontSize: 11,
                          color: item.highlightColor || "#c084fc",
                          background: item.highlightColor
                            ? item.highlightColor + "22"
                            : "transparent",
                          padding: item.highlightColor ? "2px 8px" : "0",
                          borderLeft: item.highlightColor
                            ? `3px solid ${item.highlightColor}`
                            : "none",
                          paddingLeft: item.highlightColor ? "8px" : "0",
                        }}
                      >
                        {item.term}
                      </span>
                      <span
                        className="pf"
                        style={{
                          fontSize: 8,
                          color: lm ? "#9ca3af" : "#2d1060",
                        }}
                      >
                        —
                      </span>
                      <span
                        className="pf"
                        style={{
                          fontSize: 9,
                          color: "#a1a1aa",
                          lineHeight: 1.7,
                          textDecoration: item.underline ? "underline" : "none",
                          textDecorationColor: "#7c3aed",
                        }}
                      >
                        {item.definition}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        marginTop: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      {item.highlightColor && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "2px 6px",
                            background: "rgba(45,16,96,.3)",
                            border: `1px solid ${lm ? "#e2e8f0" : lm ? "#e2e8f0" : "#1a0a35"}`,
                          }}
                        >
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              background: item.highlightColor,
                            }}
                          />
                          <span
                            className="pf"
                            style={{
                              fontSize: 6,
                              color: lm ? "#9ca3af" : "#3b1d6a",
                            }}
                          >
                            HIGHLIGHT
                          </span>
                        </div>
                      )}
                      {item.underline && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "2px 6px",
                            background: "rgba(45,16,96,.3)",
                            border: `1px solid ${lm ? "#e2e8f0" : lm ? "#e2e8f0" : "#1a0a35"}`,
                          }}
                        >
                          <Underline
                            size={8}
                            color={lm ? "#9ca3af" : "#3b1d6a"}
                          />
                          <span
                            className="pf"
                            style={{
                              fontSize: 6,
                              color: lm ? "#9ca3af" : "#3b1d6a",
                            }}
                          >
                            UNDERLINE
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Reviewer;
