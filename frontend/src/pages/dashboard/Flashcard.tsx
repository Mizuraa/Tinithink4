import { useState, useEffect, useCallback } from "react";
import { supabase, getCurrentUser } from "../../lib/supabase";
import { createContext, useContext } from "react";
const _ThemeCtx = createContext<boolean>(false);
function useLightMode() {
  return useContext(_ThemeCtx);
}

import {
  ChevronDown,
  Plus,
  Trash2,
  BookOpen,
  Eye,
  EyeOff,
  Edit2,
  Search,
  X,
  Check,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Star,
  Play,
  ArrowLeft,
  Keyboard,
} from "lucide-react";

type FlashcardData = {
  id: string;
  course: string;
  subject: string | null;
  grade_level: string | null;
  quarter: string | null;
  question: string;
  answer: string;
  is_public: boolean;
  is_system?: boolean;
};

const S = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
  .pf{font-family:'Press Start 2P',cursive;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes popIn{0%{opacity:0;transform:scale(0.88)}60%{transform:scale(1.03)}100%{opacity:1;transform:scale(1)}}
  @keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-4px)}60%{transform:translateX(4px)}}
  @keyframes scanMove{from{top:-10%}to{top:110%}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
  @keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes cardFlipIn{from{opacity:0;transform:scale(0.95) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
  @keyframes knewIt{0%{background:rgba(20,83,45,.6)}100%{background:rgba(20,83,45,0)}}
  .fade-up{animation:fadeUp .35s ease both}
  .pop-in{animation:popIn .3s cubic-bezier(.34,1.56,.64,1) both}
  .shk{animation:shake .35s ease}
  .scan-line{animation:scanMove 8s linear infinite}
  .card-anim{animation:cardFlipIn .3s ease both}
  .fc-input{
    background:rgba(8,3,24,.9);border:2px solid #2d1060;color:#e9d5ff;border-radius:0;
    width:100%;padding:10px 13px;font-family:'Press Start 2P',cursive;font-size:9px;
    outline:none;box-sizing:border-box;transition:border-color .2s,box-shadow .2s;
  }
  .fc-input:focus{border-color:#a855f7;box-shadow:0 0 8px rgba(168,85,247,.25)}
  .fc-input::placeholder{color:#2d1060;font-size:8px}
  .fc-select{appearance:none;cursor:pointer}.fc-select option{background:#0d0620;color:#e9d5ff}
  .fc-btn{
    display:flex;align-items:center;justify-content:center;gap:7px;padding:10px 14px;
    border-radius:0;cursor:pointer;font-family:'Press Start 2P',cursive;font-size:9px;
    border:2px solid;transition:filter .15s,transform .08s;
  }
  .fc-btn:hover:not(:disabled){filter:brightness(1.15)}
  .fc-btn:active:not(:disabled){transform:translateY(1px)}
  .fc-btn:disabled{opacity:.4;cursor:not-allowed}
  .fc-btn.primary{background:rgba(14,116,144,.4);border-color:#22d3ee;color:#67e8f9}
  .fc-btn.success{background:rgba(20,83,45,.5);border-color:#22c55e;color:#4ade80}
  .fc-btn.danger{background:rgba(127,29,29,.5);border-color:#ef4444;color:#f87171}
  .fc-btn.purple{background:rgba(124,58,237,.3);border-color:#7c3aed;color:#c084fc}
  .fc-btn.ghost{background:rgba(45,16,96,.3);border-color:#2d1060;color:#6b21a8}
  .fc-btn.sm{padding:6px 10px;font-size:8px}
  .fc-btn.w100{width:100%}
  /* ── Flip card (grid view) ── */
  .flip-inner{
    width:100%;height:100%;
    transition:transform .55s cubic-bezier(.4,0,.2,1);
    transform-style:preserve-3d;
    position:relative;
  }
  .flip-inner.flipped{transform:rotateY(180deg)}
  .flip-face{
    position:absolute;inset:0;
    backface-visibility:hidden;-webkit-backface-visibility:hidden;
    display:grid;
    grid-template-rows:auto 1fr auto;
    overflow:hidden;
  }
  .flip-face-center{
    display:flex;align-items:center;justify-content:center;
    padding:8px 14px;overflow:hidden;
  }
  .flip-back{transform:rotateY(180deg)}
  .card-hover{transition:box-shadow .2s,transform .15s}
  .card-hover:hover{box-shadow:0 6px 24px rgba(124,58,237,.4);transform:translateY(-2px)}
  .toast{position:fixed;bottom:24px;right:24px;z-index:999;padding:10px 16px;border:2px solid;border-radius:0;font-family:'Press Start 2P',cursive;font-size:8px;animation:popIn .3s ease both;box-shadow:4px 4px 0 rgba(0,0,0,.4)}
  .toast.ok{background:rgba(20,83,45,.95);border-color:#22c55e;color:#86efac}
  .toast.err{background:rgba(127,29,29,.95);border-color:#ef4444;color:#fca5a5}
  .corner-dot{position:absolute;width:6px;height:6px}
  .tag{display:inline-flex;align-items:center;gap:4px;padding:4px 8px;border:1px solid;font-family:'Press Start 2P',cursive;font-size:7px;cursor:pointer;transition:all .15s}
  .search-row{display:flex;align-items:center;gap:8px;padding:8px 12px;border:2px solid #1a0a35;background:rgba(8,3,24,.7);transition:border-color .2s}
  .search-row:focus-within{border-color:#4c1d95}
  .search-row input{background:none;border:none;color:#e9d5ff;font-family:'Press Start 2P',cursive;font-size:9px;outline:none;flex:1;min-width:0}
  .search-row input::placeholder{color:#2d1060;font-size:8px}
  .confirm-box{position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:60;display:flex;align-items:center;justify-content:center;padding:16px}
  .confirm-inner{background:rgba(8,3,24,.98);border:3px solid #ef4444;padding:24px;max-width:300px;width:100%;box-shadow:0 0 30px rgba(239,68,68,.25),6px 6px 0 #1e0a40;text-align:center;position:relative}
  .lm .fc-input{background:#ffffff!important;border-color:#e2e8f0!important;color:#1e0a40!important;}
  .lm .fc-input::placeholder{color:#9ca3af!important;}
  .lm .search-row{background:#ffffff!important;border-color:#e2e8f0!important;}
  .lm .search-row input{color:#1e0a40!important;}
  .lm .confirm-inner{background:#ffffff!important;border-color:#ef4444!important;}
  /* ── Study Mode ── */
  .study-overlay{position:fixed;inset:0;z-index:100;background:#050310;display:flex;flex-direction:column;overflow:hidden;}
  .study-card-wrap{flex:1;display:flex;align-items:center;justify-content:center;padding:20px;perspective:1400px;}
  .study-card{
    width:100%;max-width:640px;height:320px;
    position:relative;cursor:pointer;
    transform-style:preserve-3d;
    transition:transform .6s cubic-bezier(.4,0,.2,1);
  }
  .study-card.flipped{transform:rotateY(180deg)}
  .study-face{
    position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;
    display:flex;flex-direction:column;padding:32px 36px;
    border:2px solid;
  }
  .study-front{background:rgba(8,3,24,.97);border-color:#2d1060;}
  .study-back{background:rgba(5,28,18,.97);border-color:#166534;transform:rotateY(180deg);}
  .study-nav-btn{
    width:44px;height:44px;display:flex;align-items:center;justify-content:center;
    background:rgba(45,16,96,.5);border:2px solid #2d1060;cursor:pointer;
    transition:filter .15s,transform .08s,border-color .15s;flex-shrink:0;
  }
  .study-nav-btn:hover:not(:disabled){filter:brightness(1.3);border-color:#7c3aed;}
  .study-nav-btn:active:not(:disabled){transform:scale(0.95);}
  .study-nav-btn:disabled{opacity:.25;cursor:not-allowed;}
  .study-action-btn{
    flex:1;padding:14px 10px;font-family:'Press Start 2P',cursive;font-size:9px;
    border:2px solid;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;
    transition:filter .15s,transform .08s;
  }
  .study-action-btn:hover{filter:brightness(1.2);}
  .study-action-btn:active{transform:translateY(1px);}
  .study-action-btn.still-learning{background:rgba(127,29,29,.35);border-color:#ef4444;color:#f87171;}
  .study-action-btn.knew-it{background:rgba(20,83,45,.35);border-color:#22c55e;color:#4ade80;}
  .study-progress-bar{height:6px;background:#1a0a35;border:1px solid #2d1060;width:100%;overflow:hidden;}
  .study-progress-fill{height:100%;background:linear-gradient(90deg,#7c3aed,#22d3ee);transition:width .4s ease;}
  .study-shortcut-hint{
    font-family:'Press Start 2P',cursive;font-size:6px;color:#2d1060;
    display:flex;align-items:center;gap:12px;flex-wrap:wrap;justify-content:center;
  }
  .kbd{
    display:inline-flex;align-items:center;justify-content:center;
    padding:2px 6px;border:1px solid #2d1060;background:rgba(45,16,96,.3);
    font-family:'Press Start 2P',cursive;font-size:5px;color:#3b1d6a;
  }
`;

export default function Flashcard() {
  const lm = useLightMode();
  const [cards, setCards] = useState<FlashcardData[]>([]);
  const [userId, setUserId] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedQuarter, setSelectedQuarter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingCard, setEditingCard] = useState<FlashcardData | null>(null);
  const [fCourse, setFCourse] = useState("");
  const [fSubject, setFSubject] = useState("");
  const [fGrade, setFGrade] = useState("");
  const [fQuarter, setFQuarter] = useState("");
  const [fQuestion, setFQuestion] = useState("");
  const [fAnswer, setFAnswer] = useState("");
  const [fPublic, setFPublic] = useState(false);
  const [formShake, setFormShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPublic, setFilterPublic] = useState<boolean | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "ok" | "err";
  } | null>(null);
  // Study mode
  const [studyMode, setStudyMode] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const toast$ = (msg: string, type: "ok" | "err") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  async function load() {
    const user = await getCurrentUser();
    if (!user) return;
    setUserId(user.id);
    const { data: userCards } = await supabase
      .from("flashcards")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    const { data: systemCards } = await supabase
      .from("flashcards")
      .select("*")
      .eq("is_system", true)
      .order("created_at", { ascending: true });
    setCards([...(userCards || []), ...(systemCards || [])]);
  }

  const courses = [...new Set(cards.map((c) => c.course))];
  const subjects = [
    ...new Set(
      cards
        .filter((c) => c.course === selectedCourse && c.subject)
        .map((c) => c.subject!),
    ),
  ];
  const grades = [
    ...new Set(
      cards
        .filter(
          (c) =>
            c.course === selectedCourse &&
            c.subject === selectedSubject &&
            c.grade_level,
        )
        .map((c) => c.grade_level!),
    ),
  ];
  const quarters = [
    ...new Set(
      cards
        .filter(
          (c) =>
            c.course === selectedCourse &&
            c.subject === selectedSubject &&
            c.grade_level === selectedGrade &&
            c.quarter,
        )
        .map((c) => c.quarter!),
    ),
  ];

  const pathFiltered = cards.filter((card) => {
    if (!selectedCourse || card.course !== selectedCourse) return false;
    if (selectedSubject && card.subject !== selectedSubject) return false;
    if (selectedGrade && card.grade_level !== selectedGrade) return false;
    if (selectedQuarter && card.quarter !== selectedQuarter) return false;
    return true;
  });

  const visibleCards = pathFiltered.filter((card) => {
    if (filterPublic !== null && card.is_public !== filterPublic) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        card.question.toLowerCase().includes(q) ||
        card.answer.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const breadcrumb = [
    selectedCourse,
    selectedSubject,
    selectedGrade,
    selectedQuarter,
  ].filter(Boolean);

  function openCreate() {
    setEditingCard(null);
    setFCourse(selectedCourse);
    setFSubject(selectedSubject);
    setFGrade(selectedGrade);
    setFQuarter(selectedQuarter);
    setFQuestion("");
    setFAnswer("");
    setFPublic(false);
    setShowForm(true);
  }

  function openEdit(card: FlashcardData) {
    setEditingCard(card);
    setFCourse(card.course);
    setFSubject(card.subject || "");
    setFGrade(card.grade_level || "");
    setFQuarter(card.quarter || "");
    setFQuestion(card.question);
    setFAnswer(card.answer);
    setFPublic(card.is_public);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingCard(null);
  }

  async function saveCard() {
    if (!fCourse.trim() || !fQuestion.trim() || !fAnswer.trim()) {
      setFormShake(true);
      setTimeout(() => setFormShake(false), 400);
      toast$(
        !fCourse.trim() ? "COURSE REQUIRED" : "FILL QUESTION & ANSWER",
        "err",
      );
      return;
    }
    setLoading(true);
    try {
      const payload = {
        course: fCourse.trim(),
        subject: fSubject.trim() || null,
        grade_level: fGrade.trim() || null,
        quarter: fQuarter.trim() || null,
        question: fQuestion.trim(),
        answer: fAnswer.trim(),
        is_public: fPublic,
      };
      if (editingCard) {
        const { data, error } = await supabase
          .from("flashcards")
          .update(payload)
          .eq("id", editingCard.id)
          .select()
          .single();
        if (error) throw error;
        setCards((prev) =>
          prev.map((c) => (c.id === editingCard.id ? data : c)),
        );
        toast$("CARD UPDATED!", "ok");
      } else {
        const { data, error } = await supabase
          .from("flashcards")
          .insert({ user_id: userId, ...payload })
          .select()
          .single();
        if (error) throw error;
        setCards((prev) => [data, ...prev]);
        toast$("CARD ADDED!", "ok");
      }
      closeForm();
    } catch {
      toast$("SAVE FAILED", "err");
    } finally {
      setLoading(false);
    }
  }

  async function deleteCard(id: string) {
    const { error } = await supabase.from("flashcards").delete().eq("id", id);
    if (error) {
      toast$("DELETE FAILED", "err");
      return;
    }
    setCards((prev) => prev.filter((c) => c.id !== id));
    setSelected((prev) => {
      const s = new Set(prev);
      s.delete(id);
      return s;
    });
    toast$("CARD DELETED", "ok");
  }

  async function bulkDelete() {
    setLoading(true);
    try {
      const ids = [...selected];
      const { error } = await supabase
        .from("flashcards")
        .delete()
        .in("id", ids);
      if (error) throw error;
      setCards((prev) => prev.filter((c) => !selected.has(c.id)));
      toast$(`${ids.length} CARD(S) DELETED`, "ok");
      setSelected(new Set());
    } catch {
      toast$("BULK DELETE FAILED", "err");
    } finally {
      setLoading(false);
      setBulkConfirm(false);
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }

  function selectAll() {
    if (selected.size === visibleCards.length) setSelected(new Set());
    else setSelected(new Set(visibleCards.map((c) => c.id)));
  }

  return (
    <div style={{ width: "100%" }} className={lm ? "lm" : ""}>
      <style>{S}</style>

      {/* Study mode overlay */}
      {studyMode && visibleCards.length > 0 && (
        <StudyMode cards={visibleCards} onClose={() => setStudyMode(false)} />
      )}

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

      {/* Bulk delete confirm */}
      {bulkConfirm && (
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
              size={28}
              color="#ef4444"
              style={{ margin: "0 auto 12px" }}
            />
            <div
              className="pf"
              style={{ fontSize: 9, color: "#f87171", marginBottom: 6 }}
            >
              DELETE {selected.size} CARDS?
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
                className="fc-btn danger"
                style={{ flex: 1 }}
                onClick={bulkDelete}
                disabled={loading}
              >
                <Trash2 size={10} />
                DELETE
              </button>
              <button
                className="fc-btn ghost"
                style={{ flex: 1 }}
                onClick={() => setBulkConfirm(false)}
              >
                <X size={10} />
                CANCEL
              </button>
            </div>
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
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BookOpen size={16} color="#a855f7" />
          <span
            className="pf"
            style={{ fontSize: 13, color: lm ? "#7c3aed" : "#c084fc" }}
          >
            FLASHCARDS
          </span>
          <span
            className="pf"
            style={{
              fontSize: 7,
              color: lm ? "#9ca3af" : "#3b1d6a",
              padding: "3px 7px",
              border: `1px solid ${lm ? "#e2e8f0" : "#1a0a35"}`,
            }}
          >
            {cards.length} TOTAL
          </span>
        </div>
        <div style={{ display: "flex", gap: 7 }}>
          {visibleCards.length > 0 && selectedCourse && (
            <button
              className="fc-btn purple sm"
              onClick={() => setStudyMode(true)}
            >
              <Play size={10} /> STUDY
            </button>
          )}
          {selected.size > 0 && (
            <button
              className="fc-btn danger sm"
              onClick={() => setBulkConfirm(true)}
            >
              <Trash2 size={10} />
              {selected.size} DEL
            </button>
          )}
          <button
            className="fc-btn primary sm"
            onClick={() => (showForm ? closeForm() : openCreate())}
          >
            {showForm ? (
              <>
                <X size={10} />
                CLOSE
              </>
            ) : (
              <>
                <Plus size={10} />
                NEW CARD
              </>
            )}
          </button>
        </div>
      </div>

      {/* Course tags */}
      <div
        className="fade-up"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 7,
          marginBottom: 14,
          animationDelay: ".04s",
        }}
      >
        {courses.map((c) => (
          <span
            key={c}
            className="tag"
            style={{
              borderColor:
                selectedCourse === c ? "#7c3aed" : lm ? "#e2e8f0" : "#1a0a35",
              background:
                selectedCourse === c
                  ? "rgba(124,58,237,.2)"
                  : "rgba(8,3,24,.5)",
              color: selectedCourse === c ? "#c084fc" : "#3b1d6a",
            }}
            onClick={() => {
              setSelectedCourse(selectedCourse === c ? "" : c);
              setSelectedSubject("");
              setSelectedGrade("");
              setSelectedQuarter("");
              setSelected(new Set());
            }}
          >
            {c}
            <span style={{ color: lm ? "#9ca3af" : "#2d1060" }}>
              ({cards.filter((x) => x.course === c).length})
            </span>
          </span>
        ))}
        {courses.length === 0 && (
          <span
            className="pf"
            style={{ fontSize: 7, color: lm ? "#e2e8f0" : "#1a0a35" }}
          >
            No courses yet — add a card to get started
          </span>
        )}
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div
          className={`pop-in ${formShake ? "shk" : ""}`}
          style={{
            marginBottom: 16,
            background: lm ? "#ffffff" : "rgba(8,3,24,.9)",
            border: "2px solid #7c3aed",
            padding: "18px",
            position: "relative",
            boxShadow: "5px 5px 0 #1e0a40",
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
              marginBottom: 14,
            }}
          >
            {editingCard ? "✏ EDIT CARD" : "◆ NEW CARD"}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              marginBottom: 8,
            }}
          >
            {[
              { v: fCourse, s: setFCourse, p: "COURSE *" },
              { v: fSubject, s: setFSubject, p: "SUBJECT" },
              { v: fGrade, s: setFGrade, p: "GRADE LEVEL" },
              { v: fQuarter, s: setFQuarter, p: "QUARTER" },
            ].map(({ v, s, p }) => (
              <input
                key={p}
                className="fc-input"
                value={v}
                onChange={(e) => s(e.target.value)}
                placeholder={p}
              />
            ))}
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
              className="fc-input"
              value={fQuestion}
              onChange={(e) => setFQuestion(e.target.value)}
              placeholder="QUESTION *"
            />
            <input
              className="fc-input"
              value={fAnswer}
              onChange={(e) => setFAnswer(e.target.value)}
              placeholder="ANSWER *"
              onKeyDown={(e) => e.key === "Enter" && saveCard()}
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
              }}
              onClick={() => setFPublic((p) => !p)}
            >
              <div
                style={{
                  width: 34,
                  height: 18,
                  background: fPublic ? "#0e7490" : lm ? "#e2e8f0" : "#1a0a35",
                  border: `2px solid ${fPublic ? "#22d3ee" : "#2d1060"}`,
                  position: "relative",
                  transition: "all .2s",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 2,
                    left: fPublic ? 14 : 2,
                    width: 10,
                    height: 10,
                    background: fPublic ? "#22d3ee" : "#3b1d6a",
                    transition: "left .2s",
                  }}
                />
              </div>
              {fPublic ? (
                <Eye size={11} color="#22d3ee" />
              ) : (
                <EyeOff size={11} color={lm ? "#9ca3af" : "#3b1d6a"} />
              )}
              <span
                className="pf"
                style={{ fontSize: 7, color: fPublic ? "#22d3ee" : "#3b1d6a" }}
              >
                {fPublic ? "PUBLIC" : "PRIVATE"}
              </span>
            </div>
            {editingCard && (
              <button className="fc-btn ghost sm" onClick={closeForm}>
                <X size={10} />
                CANCEL
              </button>
            )}
          </div>
          <button
            className="fc-btn success w100"
            onClick={saveCard}
            disabled={loading}
          >
            {loading ? (
              <>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    border: "2px solid #fff",
                    borderTopColor: "transparent",
                    animation: "spin 1s linear infinite",
                  }}
                />
                SAVING...
              </>
            ) : (
              <>
                <Check size={11} />
                {editingCard ? "SAVE CHANGES" : "ADD CARD"}
              </>
            )}
          </button>
        </div>
      )}

      {/* Path Navigator */}
      <div
        className="fade-up"
        style={{
          marginBottom: 14,
          background: lm ? "#ffffff" : "rgba(8,3,24,.7)",
          border: `2px solid ${lm ? "#e2e8f0" : "#1a0a35"}`,
          padding: "14px",
          animationDelay: ".06s",
        }}
      >
        <div
          className="pf"
          style={{
            fontSize: 7,
            color: lm ? "#9ca3af" : "#2d1060",
            marginBottom: 10,
          }}
        >
          ◆ NAVIGATE PATH
        </div>
        {breadcrumb.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 5,
              marginBottom: 10,
            }}
          >
            {breadcrumb.map((c, i) => (
              <span
                key={i}
                className="pf"
                style={{
                  fontSize: 7,
                  color: i === breadcrumb.length - 1 ? "#c084fc" : "#4c1d95",
                  padding: "2px 7px",
                  border: `1px solid ${i === breadcrumb.length - 1 ? "#7c3aed" : lm ? "#e2e8f0" : "#1a0a35"}`,
                  background:
                    i === breadcrumb.length - 1
                      ? "rgba(124,58,237,.15)"
                      : "transparent",
                }}
              >
                {i > 0 && (
                  <span
                    style={{
                      marginRight: 4,
                      color: lm ? "#9ca3af" : "#2d1060",
                    }}
                  >
                    ›
                  </span>
                )}
                {c}
              </span>
            ))}
            <button
              onClick={() => {
                setSelectedCourse("");
                setSelectedSubject("");
                setSelectedGrade("");
                setSelectedQuarter("");
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: lm ? "#9ca3af" : "#3b1d6a",
                padding: "0 4px",
              }}
            >
              ✕
            </button>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {[
            {
              val: selectedCourse,
              set: (v: string) => {
                setSelectedCourse(v);
                setSelectedSubject("");
                setSelectedGrade("");
                setSelectedQuarter("");
              },
              opts: courses,
              ph: "▾ SELECT COURSE",
              show: true,
            },
            {
              val: selectedSubject,
              set: (v: string) => {
                setSelectedSubject(v);
                setSelectedGrade("");
                setSelectedQuarter("");
              },
              opts: subjects,
              ph: "▾ ALL SUBJECTS",
              show: !!selectedCourse && subjects.length > 0,
            },
            {
              val: selectedGrade,
              set: (v: string) => {
                setSelectedGrade(v);
                setSelectedQuarter("");
              },
              opts: grades,
              ph: "▾ ALL GRADES",
              show: !!selectedSubject && grades.length > 0,
            },
            {
              val: selectedQuarter,
              set: setSelectedQuarter,
              opts: quarters,
              ph: "▾ ALL QUARTERS",
              show: !!selectedGrade && quarters.length > 0,
            },
          ]
            .filter((r) => r.show)
            .map(({ val, set, opts, ph }, i) => (
              <div key={i} style={{ position: "relative" }}>
                <select
                  className="fc-input fc-select"
                  value={val}
                  onChange={(e) => set(e.target.value)}
                >
                  <option value="">{ph}</option>
                  {opts.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={11}
                  color={lm ? "#9ca3af" : "#4c1d95"}
                  style={{
                    position: "absolute",
                    right: 11,
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                  }}
                />
              </div>
            ))}
        </div>
        {selectedCourse && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 8,
              marginTop: 10,
            }}
          >
            <span className="pf" style={{ fontSize: 7, color: "#0891b2" }}>
              ▸ {pathFiltered.length} CARDS
            </span>
            {[
              { filter: true, icon: <Eye size={8} />, label: "PUBLIC" },
              { filter: false, icon: <EyeOff size={8} />, label: "PRIVATE" },
            ].map(({ filter, icon, label }) => (
              <span
                key={label}
                className="tag"
                style={{
                  borderColor:
                    filterPublic === filter
                      ? "#22c55e"
                      : lm
                        ? "#e2e8f0"
                        : "#1a0a35",
                  background:
                    filterPublic === filter
                      ? "rgba(20,83,45,.3)"
                      : "transparent",
                  color: filterPublic === filter ? "#4ade80" : "#2d1060",
                }}
                onClick={() =>
                  setFilterPublic(filterPublic === filter ? null : filter)
                }
              >
                {icon}
                {label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Search + bulk toolbar */}
      {selectedCourse && (
        <div
          style={{
            marginBottom: 12,
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
              placeholder="SEARCH CARDS..."
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
              {visibleCards.length}/{pathFiltered.length}
            </span>
          </div>
          {visibleCards.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button className="fc-btn ghost sm" onClick={selectAll}>
                <Check size={10} />
                {selected.size === visibleCards.length
                  ? "DESELECT ALL"
                  : "SELECT ALL"}
              </button>
              {selected.size > 0 && (
                <span className="pf" style={{ fontSize: 7, color: "#f87171" }}>
                  {selected.size} SELECTED
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Cards grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
          gap: 14,
        }}
      >
        {!selectedCourse ? (
          <div
            style={{
              gridColumn: "1/-1",
              textAlign: "center",
              padding: "48px 0",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
            <div
              className="pf"
              style={{ fontSize: 8, color: lm ? "#e2e8f0" : "#1a0a35" }}
            >
              SELECT A COURSE ABOVE TO VIEW CARDS
            </div>
          </div>
        ) : visibleCards.length === 0 ? (
          <div
            style={{
              gridColumn: "1/-1",
              textAlign: "center",
              padding: "48px 0",
            }}
          >
            <div
              className="pf"
              style={{ fontSize: 8, color: lm ? "#e2e8f0" : "#1a0a35" }}
            >
              NO CARDS MATCH YOUR FILTERS
            </div>
          </div>
        ) : (
          visibleCards.map((card, i) => (
            <FlipCard
              key={card.id}
              card={card}
              delay={i * 40}
              selected={selected.has(card.id)}
              onDelete={deleteCard}
              onEdit={openEdit}
              onSelect={toggleSelect}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── STUDY MODE (Quizlet-inspired) ────────────────────────────────────────────
function StudyMode({
  cards,
  onClose,
}: {
  cards: FlashcardData[];
  onClose: () => void;
}) {
  const [deck, setDeck] = useState<FlashcardData[]>([...cards]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<string>>(new Set());
  const [learning, setLearning] = useState<Set<string>>(new Set());
  const [shuffled, setShuffled] = useState(false);
  const [finished, setFinished] = useState(false);

  const current = deck[index];
  const progress = (index / deck.length) * 100;

  const goNext = useCallback(() => {
    if (index < deck.length - 1) {
      setIndex((i) => i + 1);
      setFlipped(false);
    } else setFinished(true);
  }, [index, deck.length]);

  const goPrev = useCallback(() => {
    if (index > 0) {
      setIndex((i) => i - 1);
      setFlipped(false);
    }
  }, [index]);

  const handleKnewIt = () => {
    setKnown((prev) => new Set([...prev, current.id]));
    goNext();
  };

  const handleStillLearning = () => {
    setLearning((prev) => new Set([...prev, current.id]));
    goNext();
  };

  const handleShuffle = () => {
    const shuffledDeck = [...deck].sort(() => Math.random() - 0.5);
    setDeck(shuffledDeck);
    setIndex(0);
    setFlipped(false);
    setShuffled(true);
  };

  const handleRestart = () => {
    setDeck([...cards]);
    setIndex(0);
    setFlipped(false);
    setKnown(new Set());
    setLearning(new Set());
    setFinished(false);
    setShuffled(false);
  };

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === " " || e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        setFlipped((f) => !f);
      }
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev, onClose]);

  return (
    <div className="study-overlay">
      <style>{`
        .study-overlay * { box-sizing: border-box; }
      `}</style>

      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "14px 20px",
          gap: 12,
          borderBottom: "1px solid #1a0a35",
          background: "rgba(5,3,18,.9)",
          flexShrink: 0,
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#4c1d95",
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: 0,
            transition: "color .15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#c084fc")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#4c1d95")}
        >
          <ArrowLeft size={14} />
          <span className="pf" style={{ fontSize: 7 }}>
            BACK
          </span>
        </button>

        <div style={{ flex: 1 }}>
          <div className="study-progress-bar">
            <div
              className="study-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div
          className="pf"
          style={{ fontSize: 8, color: "#a855f7", whiteSpace: "nowrap" }}
        >
          {index + 1} / {deck.length}
        </div>

        <button
          onClick={handleShuffle}
          style={{
            background: "none",
            border: "1px solid #2d1060",
            cursor: "pointer",
            color: shuffled ? "#a855f7" : "#3b1d6a",
            padding: "4px 8px",
            display: "flex",
            alignItems: "center",
            gap: 5,
            transition: "all .15s",
          }}
        >
          <Shuffle size={11} />
          <span className="pf" style={{ fontSize: 6 }}>
            SHUFFLE
          </span>
        </button>

        <button
          onClick={handleRestart}
          style={{
            background: "none",
            border: "1px solid #2d1060",
            cursor: "pointer",
            color: "#3b1d6a",
            padding: "4px 8px",
            display: "flex",
            alignItems: "center",
            gap: 5,
            transition: "color .15s",
          }}
        >
          <RotateCcw size={11} />
          <span className="pf" style={{ fontSize: 6 }}>
            RESTART
          </span>
        </button>
      </div>

      {finished ? (
        /* ── Finished screen ── */
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
            padding: 32,
          }}
        >
          <div style={{ fontSize: 56 }}>🏆</div>
          <div
            className="pf"
            style={{
              fontSize: 14,
              color: "#facc15",
              textShadow: "0 0 20px rgba(250,204,21,.4)",
            }}
          >
            ROUND COMPLETE!
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            <div style={{ textAlign: "center" }}>
              <div className="pf" style={{ fontSize: 20, color: "#4ade80" }}>
                {known.size}
              </div>
              <div
                className="pf"
                style={{ fontSize: 7, color: "#166534", marginTop: 4 }}
              >
                KNEW IT
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div className="pf" style={{ fontSize: 20, color: "#f87171" }}>
                {learning.size}
              </div>
              <div
                className="pf"
                style={{ fontSize: 7, color: "#7f1d1d", marginTop: 4 }}
              >
                STILL LEARNING
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div className="pf" style={{ fontSize: 20, color: "#a855f7" }}>
                {deck.length - known.size - learning.size}
              </div>
              <div
                className="pf"
                style={{ fontSize: 7, color: "#3b1d6a", marginTop: 4 }}
              >
                SKIPPED
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button className="fc-btn success" onClick={handleRestart}>
              <RotateCcw size={12} />
              STUDY AGAIN
            </button>
            <button className="fc-btn ghost" onClick={onClose}>
              <ArrowLeft size={12} />
              BACK TO CARDS
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* ── Card area ── */}
          <div className="study-card-wrap">
            <div
              className="study-card"
              style={{ transform: flipped ? "rotateY(180deg)" : "none" }}
              onClick={() => setFlipped((f) => !f)}
            >
              {/* Front */}
              <div className="study-face study-front">
                <div
                  className="corner-dot"
                  style={{ top: 0, left: 0, background: "#3b1d6a" }}
                />
                <div
                  className="corner-dot"
                  style={{ top: 0, right: 0, background: "#22d3ee" }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 20,
                  }}
                >
                  <span
                    className="pf"
                    style={{
                      fontSize: 7,
                      color: "#4c1d95",
                      letterSpacing: "0.1em",
                    }}
                  >
                    QUESTION
                  </span>
                  <span style={{ fontSize: 14 }}>
                    {current?.is_system ? "📘" : "📝"}
                  </span>
                </div>
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    className="pf"
                    style={{
                      fontSize: 11,
                      color: "#e9d5ff",
                      textAlign: "center",
                      lineHeight: 2,
                    }}
                  >
                    {current?.question}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    marginTop: 16,
                  }}
                >
                  <div style={{ width: 4, height: 4, background: "#2d1060" }} />
                  <span
                    className="pf"
                    style={{ fontSize: 6, color: "#2d1060" }}
                  >
                    CLICK OR SPACE TO FLIP
                  </span>
                  <div style={{ width: 4, height: 4, background: "#2d1060" }} />
                </div>
              </div>

              {/* Back */}
              <div
                className="study-face study-back"
                style={{ transform: "rotateY(180deg)" }}
              >
                <div
                  className="corner-dot"
                  style={{ top: 0, left: 0, background: "#22c55e" }}
                />
                <div
                  className="corner-dot"
                  style={{ bottom: 0, right: 0, background: "#22c55e" }}
                />
                <div style={{ marginBottom: 20 }}>
                  <span
                    className="pf"
                    style={{
                      fontSize: 7,
                      color: "#166534",
                      letterSpacing: "0.1em",
                    }}
                  >
                    ANSWER
                  </span>
                </div>
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    className="pf"
                    style={{
                      fontSize: 11,
                      color: "#86efac",
                      textAlign: "center",
                      lineHeight: 2,
                    }}
                  >
                    {current?.answer}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Navigation row ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              padding: "0 20px 12px",
              flexShrink: 0,
            }}
          >
            <button
              className="study-nav-btn"
              onClick={goPrev}
              disabled={index === 0}
            >
              <ChevronLeft size={20} color="#6b21a8" />
            </button>

            {/* Know it / Still learning — only show after flip */}
            {flipped ? (
              <div style={{ display: "flex", gap: 10, flex: 1, maxWidth: 400 }}>
                <button
                  className="study-action-btn still-learning"
                  onClick={handleStillLearning}
                >
                  <X size={13} /> STILL LEARNING
                </button>
                <button
                  className="study-action-btn knew-it"
                  onClick={handleKnewIt}
                >
                  <Check size={13} /> KNEW IT
                </button>
              </div>
            ) : (
              <button
                onClick={() => setFlipped(true)}
                style={{
                  flex: 1,
                  maxWidth: 400,
                  padding: "14px 10px",
                  fontFamily: "'Press Start 2P',cursive",
                  fontSize: 9,
                  background: "rgba(124,58,237,.25)",
                  border: "2px solid #7c3aed",
                  color: "#c084fc",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "filter .15s",
                }}
              >
                <RotateCcw size={12} /> REVEAL ANSWER
              </button>
            )}

            <button
              className="study-nav-btn"
              onClick={goNext}
              disabled={index === deck.length - 1}
            >
              <ChevronRight size={20} color="#6b21a8" />
            </button>
          </div>

          {/* Keyboard hints */}
          <div
            className="study-shortcut-hint"
            style={{
              padding: "10px 20px 18px",
              flexShrink: 0,
              borderTop: "1px solid #0d0620",
            }}
          >
            <Keyboard size={10} color="#1a0a35" />
            <span>
              <span className="kbd">SPACE</span> flip
            </span>
            <span>
              <span className="kbd">←</span>
              <span className="kbd">→</span> navigate
            </span>
            <span>
              <span className="kbd">ESC</span> exit
            </span>
          </div>
        </>
      )}
    </div>
  );
}

// ─── FLIP CARD (grid view, Quizlet-inspired) ──────────────────────────────────
function FlipCard({
  card,
  delay,
  selected,
  onDelete,
  onEdit,
  onSelect,
}: {
  card: FlashcardData;
  delay: number;
  selected: boolean;
  onDelete: (id: string) => void;
  onEdit: (c: FlashcardData) => void;
  onSelect: (id: string) => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const lm = useLightMode();

  const borderColor = selected
    ? "#7c3aed"
    : card.is_system
      ? "#1e3a5f"
      : "#2d1060";

  return (
    <div
      className="fade-up card-hover"
      style={{
        height: 220,
        perspective: "1000px",
        animationDelay: `${delay}ms`,
        position: "relative",
        cursor: "pointer",
      }}
      onClick={() => setFlipped((f) => !f)}
    >
      {/* Checkbox — sits outside the flip so it doesn't rotate */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          onSelect(card.id);
        }}
        style={{
          position: "absolute",
          top: 8,
          left: 8,
          zIndex: 20,
          width: 16,
          height: 16,
          background: selected ? "#7c3aed" : "rgba(8,3,24,.85)",
          border: `2px solid ${selected ? "#a855f7" : "#2d1060"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all .15s",
        }}
      >
        {selected && <Check size={9} color="#fff" />}
      </div>

      {/* The 3-D flip wrapper */}
      <div
        className={`flip-inner${flipped ? " flipped" : ""}`}
        style={{ height: "100%" }}
      >
        {/* ── FRONT ── */}
        <div
          className="flip-face"
          style={{
            background: card.is_system
              ? "rgba(3,15,30,.97)"
              : "rgba(8,3,24,.97)",
            border: `2px solid ${borderColor}`,
            boxShadow: `4px 4px 0 #0a0018`,
          }}
        >
          {/* Corner accents */}
          <div
            className="corner-dot"
            style={{
              top: 0,
              left: 0,
              background: selected
                ? "#a855f7"
                : card.is_system
                  ? "#1e40af"
                  : "#3b1d6a",
            }}
          />
          <div
            className="corner-dot"
            style={{
              top: 0,
              right: 0,
              background: card.is_system ? "#2563eb" : "#38bdf8",
            }}
          />

          {/* TOP: label + action buttons */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 12px 0",
            }}
          >
            <span
              className="pf"
              style={{ fontSize: 6, color: "#3b1d6a", letterSpacing: "0.1em" }}
            >
              QUESTION
            </span>
            <div
              style={{ display: "flex", gap: 4 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => onEdit(card)}
                style={{
                  background: "rgba(45,16,96,.6)",
                  border: "1px solid #3b1d6a",
                  color: "#6b21a8",
                  padding: "3px 5px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
                title="Edit"
              >
                <Edit2 size={9} />
              </button>
              <button
                onClick={() => onDelete(card.id)}
                style={{
                  background: "rgba(127,29,29,.5)",
                  border: "1px solid #7f1d1d",
                  color: "#f87171",
                  padding: "3px 5px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
                title="Delete"
              >
                <Trash2 size={9} />
              </button>
            </div>
          </div>

          {/* MIDDLE: question text — truly centered */}
          <div className="flip-face-center">
            <div
              className="pf"
              style={{
                fontSize: 10,
                color: lm ? "#1e0a40" : "#e9d5ff",
                textAlign: "center",
                lineHeight: 1.9,
                wordBreak: "break-word",
              }}
            >
              {card.question}
            </div>
          </div>

          {/* BOTTOM: badges + flip hint */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 12px 10px",
            }}
          >
            <div style={{ display: "flex", gap: 4 }}>
              {card.is_system && (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    padding: "2px 5px",
                    border: "1px solid #1d4ed8",
                    background: "rgba(30,58,138,.5)",
                  }}
                >
                  <BookOpen size={7} color="#93c5fd" />
                  <span
                    className="pf"
                    style={{ fontSize: 5, color: "#93c5fd" }}
                  >
                    SAMPLE
                  </span>
                </span>
              )}
              {card.is_public && !card.is_system && (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    padding: "2px 5px",
                    border: "1px solid #166534",
                    background: "rgba(20,83,45,.5)",
                  }}
                >
                  <Eye size={7} color="#4ade80" />
                  <span
                    className="pf"
                    style={{ fontSize: 5, color: "#4ade80" }}
                  >
                    PUB
                  </span>
                </span>
              )}
            </div>
            <span
              className="pf"
              style={{
                fontSize: 5,
                color: "#2d1060",
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              <RotateCcw size={7} color="#2d1060" /> FLIP
            </span>
          </div>
        </div>

        {/* ── BACK ── */}
        <div
          className="flip-face flip-back"
          style={{
            background: "rgba(5,28,18,.97)",
            border: "2px solid #166534",
            boxShadow: "4px 4px 0 #052e16",
          }}
        >
          <div
            className="corner-dot"
            style={{ top: 0, left: 0, background: "#22c55e" }}
          />
          <div
            className="corner-dot"
            style={{ top: 0, right: 0, background: "#22c55e" }}
          />

          {/* TOP: answer label */}
          <div style={{ padding: "10px 12px 0" }}>
            <span
              className="pf"
              style={{ fontSize: 6, color: "#166534", letterSpacing: "0.1em" }}
            >
              ANSWER
            </span>
          </div>

          {/* MIDDLE: answer text — truly centered */}
          <div className="flip-face-center">
            <div
              className="pf"
              style={{
                fontSize: 10,
                color: "#86efac",
                textAlign: "center",
                lineHeight: 1.9,
                wordBreak: "break-word",
              }}
            >
              {card.answer}
            </div>
          </div>

          {/* BOTTOM: flip back button */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              padding: "0 12px 10px",
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFlipped(false);
              }}
              style={{
                background: "rgba(20,83,45,.5)",
                border: "1px solid #166534",
                color: "#4ade80",
                padding: "3px 7px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
              title="Flip back"
            >
              <RotateCcw size={8} />
              <span className="pf" style={{ fontSize: 5 }}>
                BACK
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
