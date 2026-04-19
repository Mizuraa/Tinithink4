// ─────────────────────────────────────────────────────────────────────────────
// Flashcard.tsx — Updated
// Changes:
//  • Study mode is a full-screen overlay (toggle open/close)
//  • Auto-opens study mode when a full path is selected
//  • Pagination: 10 cards per page
//  • Front = TERM (answer field), Back = MEANING (question field)
//  • Flip is top-to-bottom (rotateX)
//  • Calmer visuals (no scan line, softer glows, muted borders)
// ─────────────────────────────────────────────────────────────────────────────

import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";
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
  Play,
  ArrowLeft,
  Keyboard,
  User,
} from "lucide-react";
import { supabase, getCurrentUser } from "../../lib/supabase";

// ─── Theme Context ────────────────────────────────────────────────────────────

const ThemeCtx = createContext<boolean>(false);
export function useLightMode() {
  return useContext(ThemeCtx);
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastState = { msg: string; type: "ok" | "err" } | null;

export type FlashcardData = {
  id: string;
  course: string;
  subject: string | null;
  grade_level: string | null;
  quarter: string | null;
  question: string; // stores the MEANING/DEFINITION
  answer: string; // stores the TERM/WORD
  is_public: boolean;
  is_system?: boolean;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_LIVES = 3;
const PAGE_SIZE = 10;

const CORNER = {
  topLeft: { top: 0, left: 0 },
  topRight: { top: 0, right: 0 },
  bottomRight: { bottom: 0, right: 0 },
} as const;

// ─── Styles ───────────────────────────────────────────────────────────────────

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

  .pf { font-family: 'Press Start 2P', cursive; }
  .fade-up  { animation: fadeUp  .35s ease both; }
  .pop-in   { animation: popIn   .3s cubic-bezier(.34,1.56,.64,1) both; }
  .shk      { animation: shake   .35s ease; }

  @keyframes fadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
  @keyframes popIn  { 0%{opacity:0;transform:scale(.9)} 60%{transform:scale(1.02)} 100%{opacity:1;transform:scale(1)} }
  @keyframes shake  { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-4px)} 60%{transform:translateX(4px)} }
  @keyframes spin   { to{transform:rotate(360deg)} }

  /* ── Form Inputs ── */
  .fc-input {
    background: rgba(8,3,24,.85);
    border: 1px solid #1a0a35;
    color: #e9d5ff;
    border-radius: 0;
    width: 100%;
    padding: 10px 13px;
    font-family: 'Press Start 2P', cursive;
    font-size: 9px;
    outline: none;
    box-sizing: border-box;
    transition: border-color .2s;
  }
  .fc-input:focus       { border-color: #7c3aed; }
  .fc-input::placeholder{ color: #2d1060; font-size: 8px; }
  .fc-select            { appearance: none; cursor: pointer; }
  .fc-select option     { background: #0d0620; color: #e9d5ff; }

  /* ── Buttons ── */
  .fc-btn {
    display: flex; align-items: center; justify-content: center; gap: 7px;
    padding: 10px 14px; border-radius: 0; cursor: pointer;
    font-family: 'Press Start 2P', cursive; font-size: 9px; border: 1px solid;
    transition: filter .15s, transform .08s;
  }
  .fc-btn:hover:not(:disabled) { filter: brightness(1.1); }
  .fc-btn:active:not(:disabled){ transform: translateY(1px); }
  .fc-btn:disabled              { opacity: .4; cursor: not-allowed; }

  .fc-btn.primary { background: rgba(14,116,144,.3); border-color: #0e7490; color: #67e8f9; }
  .fc-btn.success { background: rgba(20,83,45,.4);  border-color: #166534; color: #4ade80; }
  .fc-btn.danger  { background: rgba(127,29,29,.4); border-color: #991b1b; color: #f87171; }
  .fc-btn.purple  { background: rgba(109,40,217,.25);border-color: #6d28d9; color: #a78bfa; }
  .fc-btn.ghost   { background: rgba(45,16,96,.2);  border-color: #1a0a35; color: #6b21a8; }
  .fc-btn.sm      { padding: 6px 10px; font-size: 8px; }
  .fc-btn.w100    { width: 100%; }

  /* ── Flip Card — rotateX (top-to-bottom) ── */
  .flip-inner {
    width: 100%; height: 100%;
    transition: transform .5s cubic-bezier(.4,0,.2,1);
    transform-style: preserve-3d;
    position: relative;
  }
  .flip-inner.flipped { transform: rotateX(180deg); }
  .flip-face {
    position: absolute; inset: 0;
    backface-visibility: hidden; -webkit-backface-visibility: hidden;
    display: grid; grid-template-rows: auto 1fr auto; overflow: hidden;
  }
  .flip-face-center {
    display: flex; align-items: center; justify-content: center;
    padding: 8px 14px; overflow: hidden;
  }
  .flip-back { transform: rotateX(180deg); }
  .card-hover { transition: box-shadow .2s, transform .15s; }
  .card-hover:hover { box-shadow: 0 4px 16px rgba(109,40,217,.2); transform: translateY(-2px); }

  /* ── Toast ── */
  .toast {
    position: fixed; bottom: 24px; right: 24px; z-index: 9999;
    padding: 10px 16px; border: 1px solid; border-radius: 0;
    font-family: 'Press Start 2P', cursive; font-size: 8px;
    animation: popIn .3s ease both;
  }
  .toast.ok  { background: rgba(20,83,45,.95);  border-color: #166534; color: #86efac; }
  .toast.err { background: rgba(127,29,29,.95); border-color: #991b1b; color: #fca5a5; }

  /* ── Misc ── */
  .corner-dot  { position: absolute; width: 5px; height: 5px; }
  .tag {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 4px 8px; border: 1px solid;
    font-family: 'Press Start 2P', cursive; font-size: 7px;
    cursor: pointer; transition: all .15s;
  }
  .search-row {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 12px; border: 1px solid #1a0a35;
    background: rgba(8,3,24,.6); transition: border-color .2s;
  }
  .search-row:focus-within { border-color: #4c1d95; }
  .search-row input { background: none; border: none; color: #e9d5ff; font-family: 'Press Start 2P', cursive; font-size: 9px; outline: none; flex: 1; min-width: 0; }
  .search-row input::placeholder { color: #2d1060; font-size: 8px; }

  /* ── Confirm Dialog ── */
  .confirm-box   { position: fixed; inset: 0; background: rgba(0,0,0,.7); z-index: 60; display: flex; align-items: center; justify-content: center; padding: 16px; }
  .confirm-inner { background: rgba(8,3,24,.98); border: 2px solid #991b1b; padding: 24px; max-width: 300px; width: 100%; text-align: center; position: relative; }

  /* ── Study Overlay ── */
  .study-overlay {
    position: fixed; inset: 0; z-index: 100;
    background: rgba(3,1,12,.96);
    display: flex; flex-direction: column;
    overflow-y: auto;
  }
  .study-inner { max-width: 680px; width: 100%; margin: 0 auto; padding: 24px 20px; flex: 1; display: flex; flex-direction: column; }

  /* Study TopBar */
  .study-topbar { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
  .study-avatar { width: 44px; height: 44px; border-radius: 50%; background: rgba(109,40,217,.2); border: 1px solid #4c1d95; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; }
  .study-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
  .study-user-name { font-family: 'Press Start 2P', cursive; font-size: 9px; color: #a78bfa; margin-bottom: 4px; }
  .study-user-sub  { font-family: 'Press Start 2P', cursive; font-size: 6px; color: #2d1060; }
  .study-lives { display: flex; align-items: center; gap: 4px; }
  .study-heart { font-size: 14px; transition: transform .2s, opacity .2s; color: #dc2626; }
  .study-heart.lost { opacity: .2; transform: scale(0.8); }

  /* Study Progress */
  .study-progress-bar  { height: 3px; background: #0d0620; border: none; width: 100%; overflow: hidden; margin-bottom: 16px; }
  .study-progress-fill { height: 100%; background: linear-gradient(90deg,#6d28d9,#0891b2); transition: width .4s ease; }

  /* Study Card — rotateX (top-to-bottom) */
  .study-scene      { perspective: 1000px; height: 220px; cursor: pointer; margin-bottom: 14px; }
  .study-card-inner { width: 100%; height: 100%; position: relative; transform-style: preserve-3d; transition: transform .5s cubic-bezier(.4,0,.2,1); }
  .study-card-inner.flipped { transform: rotateX(180deg); }
  .study-face       { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; display: flex; flex-direction: column; padding: 20px 24px; border: 1px solid; }
  .study-front      { background: rgba(8,3,24,.98); border-color: #1a0a35; }
  .study-back       { background: rgba(3,16,10,.98); border-color: #14532d; transform: rotateX(180deg); }
  .study-face-label { font-family: 'Press Start 2P', cursive; font-size: 7px; letter-spacing: .05em; margin-bottom: 10px; }
  .study-front .study-face-label { color: #3b1d6a; }
  .study-back  .study-face-label { color: #14532d; }
  .study-face-text  { flex: 1; display: flex; align-items: center; justify-content: center; font-family: 'Press Start 2P', cursive; font-size: 11px; text-align: center; line-height: 1.9; }
  .study-front .study-face-text  { color: #e9d5ff; }
  .study-back  .study-face-text  { color: #86efac; }
  .study-face-hint  { font-family: 'Press Start 2P', cursive; font-size: 6px; color: #1a0a35; text-align: center; margin-top: 8px; }

  /* Study Actions */
  .study-action-row { display: flex; gap: 8px; margin-bottom: 12px; }
  .study-act-btn    { flex: 1; padding: 10px; font-family: 'Press Start 2P', cursive; font-size: 8px; border: 1px solid; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: filter .15s, transform .1s; border-radius: 0; }
  .study-act-btn:active { transform: scale(0.98); }
  .study-act-btn.no   { background: rgba(127,29,29,.3); border-color: #991b1b; color: #f87171; }
  .study-act-btn.no:hover  { filter: brightness(1.15); }
  .study-act-btn.yes  { background: rgba(20,83,45,.3);  border-color: #166534; color: #4ade80; }
  .study-act-btn.yes:hover { filter: brightness(1.15); }
  .study-reveal-btn { flex: 1; padding: 10px; font-family: 'Press Start 2P', cursive; font-size: 8px; background: rgba(109,40,217,.2); border: 1px solid #4c1d95; color: #a78bfa; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: filter .15s; }
  .study-reveal-btn:hover { filter: brightness(1.15); }

  /* Study Nav */
  .study-nav-row  { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
  .study-nav-btn  { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; background: rgba(45,16,96,.4); border: 1px solid #1a0a35; cursor: pointer; transition: filter .15s, border-color .15s; flex-shrink: 0; }
  .study-nav-btn:hover:not(:disabled)  { filter: brightness(1.3); border-color: #4c1d95; }
  .study-nav-btn:disabled              { opacity: .2; cursor: not-allowed; }
  .study-counter  { font-family: 'Press Start 2P', cursive; font-size: 8px; color: #3b1d6a; flex: 1; text-align: center; }

  /* Study Stats */
  .study-stats-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; }
  .study-stat      { text-align: center; border: 1px solid #0d0620; background: rgba(8,3,24,.4); padding: 10px 4px; }
  .study-stat-num  { font-family: 'Press Start 2P', cursive; font-size: 14px; margin-bottom: 4px; }
  .study-stat-lbl  { font-family: 'Press Start 2P', cursive; font-size: 6px; color: #2d1060; }

  /* Study Keyboard Hints */
  .study-shortcut-hint { font-family: 'Press Start 2P', cursive; font-size: 6px; color: #1a0a35; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; justify-content: center; margin-top: 12px; padding-top: 12px; border-top: 1px solid #0d0620; }
  .kbd { display: inline-flex; align-items: center; justify-content: center; padding: 2px 6px; border: 1px solid #1a0a35; background: rgba(45,16,96,.2); font-family: 'Press Start 2P', cursive; font-size: 5px; color: #2d1060; }

  /* Study End Screens */
  .study-endscreen       { text-align: center; padding: 32px 16px; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .study-endscreen-icon  { font-size: 48px; margin-bottom: 14px; }
  .study-endscreen-title { font-family: 'Press Start 2P', cursive; font-size: 12px; color: #facc15; margin-bottom: 8px; }
  .study-endscreen-sub   { font-family: 'Press Start 2P', cursive; font-size: 7px; color: #3b1d6a; margin-bottom: 20px; }
  .study-endscreen-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin-bottom: 20px; width: 100%; }
  .study-endscreen-btns  { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }

  /* ── Pagination ── */
  .pagination { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 16px; }
  .page-btn   { font-family: 'Press Start 2P', cursive; font-size: 7px; padding: 6px 10px; border: 1px solid #1a0a35; background: rgba(8,3,24,.5); color: #3b1d6a; cursor: pointer; transition: border-color .15s, color .15s; }
  .page-btn:hover:not(:disabled) { border-color: #4c1d95; color: #a78bfa; }
  .page-btn.active { border-color: #6d28d9; color: #a78bfa; background: rgba(109,40,217,.15); }
  .page-btn:disabled { opacity: .3; cursor: not-allowed; }

  /* ── Light Mode ── */
  .lm .fc-input              { background: #fff !important; border-color: #e2e8f0 !important; color: #1e0a40 !important; }
  .lm .fc-input::placeholder { color: #9ca3af !important; }
  .lm .search-row            { background: #fff !important; border-color: #e2e8f0 !important; }
  .lm .search-row input      { color: #1e0a40 !important; }
  .lm .confirm-inner         { background: #fff !important; }
  .lm .study-overlay         { background: rgba(240,235,255,.97) !important; }
  .lm .study-face            { background: #fff !important; }
  .lm .study-front .study-face-text { color: #1e0a40 !important; }
  .lm .study-stat            { background: #f8f8f8 !important; border-color: #e2e8f0 !important; }
`;

// ─── Small Shared Components ──────────────────────────────────────────────────

function CornerDot({
  pos,
  color,
}: {
  pos: Record<string, number>;
  color: string;
}) {
  return <div className="corner-dot" style={{ ...pos, background: color }} />;
}

function Spinner() {
  return (
    <div
      style={{
        width: 8,
        height: 8,
        border: "2px solid #fff",
        borderTopColor: "transparent",
        animation: "spin 1s linear infinite",
      }}
    />
  );
}

function Toast({ toast }: { toast: ToastState }) {
  if (!toast) return null;
  return (
    <div className={`toast ${toast.type}`}>
      {toast.type === "ok" ? "✓ " : "⚠ "}
      {toast.msg}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useToast() {
  const [toast, setToast] = useState<ToastState>(null);
  const show = (msg: string, type: "ok" | "err") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };
  return { toast, show };
}

function useDerivedFilters(
  cards: FlashcardData[],
  selectedCourse: string,
  selectedSubject: string,
  selectedGrade: string,
) {
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
  return { courses, subjects, grades, quarters };
}

// ─── Main Flashcard Component ─────────────────────────────────────────────────

export default function Flashcard() {
  const lm = useLightMode();

  const [cards, setCards] = useState<FlashcardData[]>([]);
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("PLAYER");
  const { toast, show: toast$ } = useToast();

  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedQuarter, setSelectedQuarter] = useState("");
  const [filterPublic, setFilterPublic] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingCard, setEditingCard] = useState<FlashcardData | null>(null);
  const [formShake, setFormShake] = useState(false);
  const [fCourse, setFCourse] = useState("");
  const [fSubject, setFSubject] = useState("");
  const [fGrade, setFGrade] = useState("");
  const [fQuarter, setFQuarter] = useState("");
  const [fQuestion, setFQuestion] = useState("");
  const [fAnswer, setFAnswer] = useState("");
  const [fPublic, setFPublic] = useState(false);

  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [studyMode, setStudyMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const { courses, subjects, grades, quarters } = useDerivedFilters(
    cards,
    selectedCourse,
    selectedSubject,
    selectedGrade,
  );

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

  const totalPages = Math.ceil(visibleCards.length / PAGE_SIZE);
  const pagedCards = visibleCards.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const breadcrumb = [
    selectedCourse,
    selectedSubject,
    selectedGrade,
    selectedQuarter,
  ].filter(Boolean);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    selectedCourse,
    selectedSubject,
    selectedGrade,
    selectedQuarter,
    searchQuery,
    filterPublic,
  ]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const user = await getCurrentUser();
    if (!user) return;
    setUserId(user.id);
    const name =
      user.user_metadata?.username ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "PLAYER";
    setUserName(name.toUpperCase());
    const [{ data: userCards }, { data: systemCards }] = await Promise.all([
      supabase
        .from("flashcards")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("flashcards")
        .select("*")
        .eq("is_system", true)
        .order("created_at", { ascending: true }),
    ]);
    setCards([...(userCards || []), ...(systemCards || [])]);
  }

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
        !fCourse.trim() ? "COURSE REQUIRED" : "FILL TERM & MEANING",
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
    setSelected(
      selected.size === visibleCards.length
        ? new Set()
        : new Set(visibleCards.map((c) => c.id)),
    );
  }

  function clearPath() {
    setSelectedCourse("");
    setSelectedSubject("");
    setSelectedGrade("");
    setSelectedQuarter("");
  }

  function setCourse(v: string) {
    setSelectedCourse(v);
    setSelectedSubject("");
    setSelectedGrade("");
    setSelectedQuarter("");
    setSelected(new Set());
  }
  function setSubject(v: string) {
    setSelectedSubject(v);
    setSelectedGrade("");
    setSelectedQuarter("");
  }
  function setGrade(v: string) {
    setSelectedGrade(v);
    setSelectedQuarter("");
  }

  return (
    <div style={{ width: "100%" }} className={lm ? "lm" : ""}>
      <style>{GLOBAL_STYLES}</style>

      <Toast toast={toast} />

      {bulkConfirm && (
        <BulkDeleteConfirm
          count={selected.size}
          loading={loading}
          onConfirm={bulkDelete}
          onCancel={() => setBulkConfirm(false)}
          lm={lm}
        />
      )}

      {/* ── Study Mode Overlay ── */}
      {studyMode && visibleCards.length > 0 && (
        <StudyMode
          cards={visibleCards}
          onClose={() => setStudyMode(false)}
          lm={lm}
          userName={userName}
        />
      )}

      {/* ── Header ── */}
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
          <BookOpen size={16} color="#7c3aed" />
          <span
            className="pf"
            style={{ fontSize: 13, color: lm ? "#6d28d9" : "#a78bfa" }}
          >
            FLASHCARDS
          </span>
          <span
            className="pf"
            style={{
              fontSize: 7,
              color: lm ? "#9ca3af" : "#2d1060",
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
              onClick={() => setStudyMode((s) => !s)}
            >
              {studyMode ? (
                <>
                  <X size={10} /> CLOSE STUDY
                </>
              ) : (
                <>
                  <Play size={10} /> STUDY
                </>
              )}
            </button>
          )}
          {selected.size > 0 && (
            <button
              className="fc-btn danger sm"
              onClick={() => setBulkConfirm(true)}
            >
              <Trash2 size={10} /> {selected.size} DEL
            </button>
          )}
          <button
            className="fc-btn primary sm"
            onClick={() => (showForm ? closeForm() : openCreate())}
          >
            {showForm ? (
              <>
                <X size={10} /> CLOSE
              </>
            ) : (
              <>
                <Plus size={10} /> NEW CARD
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Course Tags ── */}
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
        {courses.length === 0 ? (
          <span
            className="pf"
            style={{ fontSize: 7, color: lm ? "#e2e8f0" : "#1a0a35" }}
          >
            No courses yet — add a card to get started
          </span>
        ) : (
          courses.map((c) => (
            <CoursePill
              key={c}
              name={c}
              count={cards.filter((x) => x.course === c).length}
              active={selectedCourse === c}
              lm={lm}
              onClick={() => setCourse(selectedCourse === c ? "" : c)}
            />
          ))
        )}
      </div>

      {/* ── Create / Edit Form ── */}
      {showForm && (
        <CardForm
          lm={lm}
          shake={formShake}
          editing={!!editingCard}
          loading={loading}
          fields={{
            fCourse,
            fSubject,
            fGrade,
            fQuarter,
            fQuestion,
            fAnswer,
            fPublic,
          }}
          setters={{
            setFCourse,
            setFSubject,
            setFGrade,
            setFQuarter,
            setFQuestion,
            setFAnswer,
            setFPublic,
          }}
          onSave={saveCard}
          onCancel={closeForm}
        />
      )}

      {/* ── Path Navigator ── */}
      <PathNavigator
        lm={lm}
        breadcrumb={breadcrumb}
        selectedCourse={selectedCourse}
        selectedSubject={selectedSubject}
        selectedGrade={selectedGrade}
        selectedQuarter={selectedQuarter}
        courses={courses}
        subjects={subjects}
        grades={grades}
        quarters={quarters}
        pathCount={pathFiltered.length}
        filterPublic={filterPublic}
        setCourse={setCourse}
        setSubject={setSubject}
        setGrade={setGrade}
        setQuarter={setSelectedQuarter}
        clearPath={clearPath}
        setFilterPublic={setFilterPublic}
      />

      {/* ── Search + Bulk Toolbar ── */}
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
            <Search size={12} color={lm ? "#9ca3af" : "#2d1060"} />
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
                  color: lm ? "#9ca3af" : "#3b1d6a",
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

      {/* ── Cards Grid ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
          gap: 14,
        }}
      >
        {!selectedCourse ? (
          <EmptyState
            icon="📚"
            message="SELECT A COURSE ABOVE TO VIEW CARDS"
            lm={lm}
          />
        ) : visibleCards.length === 0 ? (
          <EmptyState message="NO CARDS MATCH YOUR FILTERS" lm={lm} />
        ) : (
          pagedCards.map((card, i) => (
            <FlipCard
              key={card.id}
              card={card}
              delay={i * 30}
              selected={selected.has(card.id)}
              onDelete={deleteCard}
              onEdit={openEdit}
              onSelect={toggleSelect}
            />
          ))
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="pagination fade-up">
          <button
            className="page-btn"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            ‹ PREV
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`page-btn${p === currentPage ? " active" : ""}`}
              onClick={() => setCurrentPage(p)}
            >
              {p}
            </button>
          ))}
          <button
            className="page-btn"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            NEXT ›
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function EmptyState({
  icon,
  message,
  lm,
}: {
  icon?: string;
  message: string;
  lm?: boolean;
}) {
  return (
    <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "48px 0" }}>
      {icon && <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>}
      <div
        className="pf"
        style={{ fontSize: 8, color: lm ? "#e2e8f0" : "#1a0a35" }}
      >
        {message}
      </div>
    </div>
  );
}

function CoursePill({
  name,
  count,
  active,
  lm,
  onClick,
}: {
  name: string;
  count: number;
  active: boolean;
  lm: boolean;
  onClick: () => void;
}) {
  return (
    <span
      className="tag"
      style={{
        borderColor: active ? "#6d28d9" : lm ? "#e2e8f0" : "#1a0a35",
        background: active ? "rgba(109,40,217,.15)" : "transparent",
        color: active ? "#a78bfa" : "#2d1060",
      }}
      onClick={onClick}
    >
      {name}
      <span style={{ color: lm ? "#9ca3af" : "#1a0a35" }}>({count})</span>
    </span>
  );
}

function BulkDeleteConfirm({
  count,
  loading,
  onConfirm,
  onCancel,
  lm,
}: {
  count: number;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  lm: boolean;
}) {
  return (
    <div className="confirm-box">
      <div className="confirm-inner pop-in">
        <CornerDot pos={CORNER.topLeft} color="#991b1b" />
        <CornerDot pos={CORNER.topRight} color="#991b1b" />
        <Trash2 size={28} color="#ef4444" style={{ margin: "0 auto 12px" }} />
        <div
          className="pf"
          style={{ fontSize: 9, color: "#f87171", marginBottom: 6 }}
        >
          DELETE {count} CARDS?
        </div>
        <div
          className="pf"
          style={{
            fontSize: 7,
            color: lm ? "#9ca3af" : "#3b1d6a",
            marginBottom: 20,
          }}
        >
          THIS CANNOT BE UNDONE
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="fc-btn danger"
            style={{ flex: 1 }}
            onClick={onConfirm}
            disabled={loading}
          >
            <Trash2 size={10} /> DELETE
          </button>
          <button
            className="fc-btn ghost"
            style={{ flex: 1 }}
            onClick={onCancel}
          >
            <X size={10} /> CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Card Form ────────────────────────────────────────────────────────────────

type CardFormFields = {
  fCourse: string;
  fSubject: string;
  fGrade: string;
  fQuarter: string;
  fQuestion: string;
  fAnswer: string;
  fPublic: boolean;
};
type CardFormSetters = {
  setFCourse: (v: string) => void;
  setFSubject: (v: string) => void;
  setFGrade: (v: string) => void;
  setFQuarter: (v: string) => void;
  setFQuestion: (v: string) => void;
  setFAnswer: (v: string) => void;
  setFPublic: (v: boolean) => void;
};

function CardForm({
  lm,
  shake,
  editing,
  loading,
  fields,
  setters,
  onSave,
  onCancel,
}: {
  lm: boolean;
  shake: boolean;
  editing: boolean;
  loading: boolean;
  fields: CardFormFields;
  setters: CardFormSetters;
  onSave: () => void;
  onCancel: () => void;
}) {
  const { fCourse, fSubject, fGrade, fQuarter, fQuestion, fAnswer, fPublic } =
    fields;
  const {
    setFCourse,
    setFSubject,
    setFGrade,
    setFQuarter,
    setFQuestion,
    setFAnswer,
    setFPublic,
  } = setters;
  const metaFields = [
    { v: fCourse, s: setFCourse, p: "COURSE *" },
    { v: fSubject, s: setFSubject, p: "SUBJECT" },
    { v: fGrade, s: setFGrade, p: "GRADE LEVEL" },
    { v: fQuarter, s: setFQuarter, p: "QUARTER" },
  ];
  return (
    <div
      className={`pop-in ${shake ? "shk" : ""}`}
      style={{
        marginBottom: 16,
        background: lm ? "#fff" : "rgba(8,3,24,.85)",
        border: "1px solid #4c1d95",
        padding: "18px",
        position: "relative",
      }}
    >
      <CornerDot pos={CORNER.topLeft} color="#7c3aed" />
      <CornerDot pos={CORNER.topRight} color="#0891b2" />
      <div
        className="pf"
        style={{
          fontSize: 8,
          color: lm ? "#9ca3af" : "#3b1d6a",
          marginBottom: 14,
        }}
      >
        {editing ? "✏ EDIT CARD" : "◆ NEW CARD"}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          marginBottom: 8,
        }}
      >
        {metaFields.map(({ v, s, p }) => (
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
        {/* TERM = answer field (shown on front of card) */}
        <input
          className="fc-input"
          value={fAnswer}
          onChange={(e) => setFAnswer(e.target.value)}
          placeholder="TERM * (shown on front)"
        />
        {/* MEANING = question field (shown on back of card) */}
        <input
          className="fc-input"
          value={fQuestion}
          onChange={(e) => setFQuestion(e.target.value)}
          placeholder="MEANING * (shown on back)"
          onKeyDown={(e) => e.key === "Enter" && onSave()}
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
        <ToggleSwitch
          lm={lm}
          value={fPublic}
          onChange={() => setFPublic(!fPublic)}
          onLabel="PUBLIC"
          offLabel="PRIVATE"
        />
        {editing && (
          <button className="fc-btn ghost sm" onClick={onCancel}>
            <X size={10} /> CANCEL
          </button>
        )}
      </div>
      <button
        className="fc-btn success w100"
        onClick={onSave}
        disabled={loading}
      >
        {loading ? (
          <>
            <Spinner /> SAVING...
          </>
        ) : (
          <>
            <Check size={11} /> {editing ? "SAVE CHANGES" : "ADD CARD"}
          </>
        )}
      </button>
    </div>
  );
}

function ToggleSwitch({
  lm,
  value,
  onChange,
  onLabel,
  offLabel,
}: {
  lm: boolean;
  value: boolean;
  onChange: () => void;
  onLabel: string;
  offLabel: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        cursor: "pointer",
      }}
      onClick={onChange}
    >
      <div
        style={{
          width: 34,
          height: 18,
          background: value ? "#0e7490" : lm ? "#e2e8f0" : "#0d0620",
          border: `1px solid ${value ? "#0891b2" : "#1a0a35"}`,
          position: "relative",
          transition: "all .2s",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 2,
            left: value ? 14 : 2,
            width: 10,
            height: 10,
            background: value ? "#22d3ee" : "#2d1060",
            transition: "left .2s",
          }}
        />
      </div>
      {value ? (
        <Eye size={11} color="#22d3ee" />
      ) : (
        <EyeOff size={11} color={lm ? "#9ca3af" : "#2d1060"} />
      )}
      <span
        className="pf"
        style={{ fontSize: 7, color: value ? "#22d3ee" : "#2d1060" }}
      >
        {value ? onLabel : offLabel}
      </span>
    </div>
  );
}

// ─── Path Navigator ───────────────────────────────────────────────────────────

function PathNavigator({
  lm,
  breadcrumb,
  selectedCourse,
  selectedSubject,
  selectedGrade,
  selectedQuarter,
  courses,
  subjects,
  grades,
  quarters,
  pathCount,
  filterPublic,
  setCourse,
  setSubject,
  setGrade,
  setQuarter,
  clearPath,
  setFilterPublic,
}: any) {
  const dropdowns = [
    {
      val: selectedCourse,
      set: setCourse,
      opts: courses,
      ph: "▾ SELECT COURSE",
      show: true,
    },
    {
      val: selectedSubject,
      set: setSubject,
      opts: subjects,
      ph: "▾ ALL SUBJECTS",
      show: !!selectedCourse && subjects.length > 0,
    },
    {
      val: selectedGrade,
      set: setGrade,
      opts: grades,
      ph: "▾ ALL GRADES",
      show: !!selectedSubject && grades.length > 0,
    },
    {
      val: selectedQuarter,
      set: setQuarter,
      opts: quarters,
      ph: "▾ ALL QUARTERS",
      show: !!selectedGrade && quarters.length > 0,
    },
  ].filter((r) => r.show);

  return (
    <div
      className="fade-up"
      style={{
        marginBottom: 14,
        background: lm ? "#fff" : "rgba(8,3,24,.6)",
        border: `1px solid ${lm ? "#e2e8f0" : "#0d0620"}`,
        padding: "14px",
        animationDelay: ".06s",
      }}
    >
      <div
        className="pf"
        style={{
          fontSize: 7,
          color: lm ? "#9ca3af" : "#1a0a35",
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
          {breadcrumb.map((c: string, i: number) => (
            <span
              key={i}
              className="pf"
              style={{
                fontSize: 7,
                color: i === breadcrumb.length - 1 ? "#a78bfa" : "#3b1d6a",
                padding: "2px 7px",
                border: `1px solid ${i === breadcrumb.length - 1 ? "#4c1d95" : lm ? "#e2e8f0" : "#0d0620"}`,
                background:
                  i === breadcrumb.length - 1
                    ? "rgba(109,40,217,.1)"
                    : "transparent",
              }}
            >
              {i > 0 && (
                <span style={{ marginRight: 4, color: "#1a0a35" }}>›</span>
              )}
              {c}
            </span>
          ))}
          <button
            onClick={clearPath}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#2d1060",
              padding: "0 4px",
            }}
          >
            ✕
          </button>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {dropdowns.map(({ val, set, opts, ph }, i) => (
          <div key={i} style={{ position: "relative" }}>
            <select
              className="fc-input fc-select"
              value={val}
              onChange={(e) => set(e.target.value)}
            >
              <option value="">{ph}</option>
              {opts.map((o: string) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <ChevronDown
              size={11}
              color={lm ? "#9ca3af" : "#3b1d6a"}
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
            ▸ {pathCount} CARDS
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
                    ? "#166534"
                    : lm
                      ? "#e2e8f0"
                      : "#0d0620",
                background:
                  filterPublic === filter ? "rgba(20,83,45,.2)" : "transparent",
                color: filterPublic === filter ? "#4ade80" : "#1a0a35",
              }}
              onClick={() =>
                setFilterPublic(filterPublic === filter ? null : filter)
              }
            >
              {icon} {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Flip Card (Grid) ─────────────────────────────────────────────────────────

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
    ? "#4c1d95"
    : card.is_system
      ? "#1e3a5f"
      : "#0d0620";

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
          background: selected ? "#4c1d95" : "rgba(8,3,24,.8)",
          border: `1px solid ${selected ? "#7c3aed" : "#1a0a35"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all .15s",
        }}
      >
        {selected && <Check size={9} color="#fff" />}
      </div>

      <div
        className={`flip-inner${flipped ? " flipped" : ""}`}
        style={{ height: "100%" }}
      >
        {/* Front — TERM */}
        <div
          className="flip-face"
          style={{
            background: card.is_system
              ? "rgba(3,15,30,.97)"
              : "rgba(8,3,24,.97)",
            border: `1px solid ${borderColor}`,
          }}
        >
          <CornerDot
            pos={CORNER.topLeft}
            color={selected ? "#6d28d9" : "#0d0620"}
          />
          <CornerDot
            pos={CORNER.topRight}
            color={card.is_system ? "#1e3a5f" : "#0d0620"}
          />
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
              style={{ fontSize: 6, color: "#1a0a35", letterSpacing: "0.1em" }}
            >
              TERM
            </span>
            <div
              style={{ display: "flex", gap: 4 }}
              onClick={(e) => e.stopPropagation()}
            >
              <CardActionBtn
                onClick={() => onEdit(card)}
                title="Edit"
                danger={false}
              >
                <Edit2 size={9} />
              </CardActionBtn>
              <CardActionBtn
                onClick={() => onDelete(card.id)}
                title="Delete"
                danger
              >
                <Trash2 size={9} />
              </CardActionBtn>
            </div>
          </div>
          <div className="flip-face-center">
            {/* Front shows answer = TERM */}
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
              {card.answer}
            </div>
          </div>
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
                <CardBadge
                  color="#93c5fd"
                  borderColor="#1e3a5f"
                  bg="rgba(30,58,138,.3)"
                  icon={<BookOpen size={7} color="#93c5fd" />}
                  label="SAMPLE"
                />
              )}
              {card.is_public && !card.is_system && (
                <CardBadge
                  color="#4ade80"
                  borderColor="#14532d"
                  bg="rgba(20,83,45,.3)"
                  icon={<Eye size={7} color="#4ade80" />}
                  label="PUB"
                />
              )}
            </div>
            <span
              className="pf"
              style={{
                fontSize: 5,
                color: "#1a0a35",
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              <RotateCcw size={7} color="#1a0a35" /> FLIP
            </span>
          </div>
        </div>

        {/* Back — MEANING */}
        <div
          className="flip-face flip-back"
          style={{
            background: "rgba(3,16,10,.97)",
            border: "1px solid #14532d",
          }}
        >
          <CornerDot pos={CORNER.topLeft} color="#166534" />
          <CornerDot pos={CORNER.topRight} color="#166534" />
          <div style={{ padding: "10px 12px 0" }}>
            <span
              className="pf"
              style={{ fontSize: 6, color: "#14532d", letterSpacing: "0.1em" }}
            >
              MEANING
            </span>
          </div>
          <div className="flip-face-center">
            {/* Back shows question = MEANING */}
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
              {card.question}
            </div>
          </div>
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
                background: "rgba(20,83,45,.4)",
                border: "1px solid #14532d",
                color: "#4ade80",
                padding: "3px 7px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
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

function CardActionBtn({
  children,
  onClick,
  title,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  danger: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: danger ? "rgba(127,29,29,.4)" : "rgba(45,16,96,.4)",
        border: `1px solid ${danger ? "#7f1d1d" : "#1a0a35"}`,
        color: danger ? "#f87171" : "#3b1d6a",
        padding: "3px 5px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
      }}
    >
      {children}
    </button>
  );
}

function CardBadge({
  color,
  borderColor,
  bg,
  icon,
  label,
}: {
  color: string;
  borderColor: string;
  bg: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        gap: 3,
        padding: "2px 5px",
        border: `1px solid ${borderColor}`,
        background: bg,
      }}
    >
      {icon}
      <span className="pf" style={{ fontSize: 5, color }}>
        {label}
      </span>
    </span>
  );
}

// ─── Study Mode (Full-Screen Overlay) ────────────────────────────────────────

function StudyMode({
  cards,
  onClose,
  lm,
  userName,
}: {
  cards: FlashcardData[];
  onClose: () => void;
  lm: boolean;
  userName: string;
}) {
  const [deck, setDeck] = useState<FlashcardData[]>([...cards]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<string>>(new Set());
  const [learning, setLearning] = useState<Set<string>>(new Set());
  const [lives, setLives] = useState(MAX_LIVES);
  const [shuffled, setShuffled] = useState(false);
  const [finished, setFinished] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const current = deck[index];
  // Progress based on mastery (known / total)
  const progress = (known.size / deck.length) * 100;

  const goNext = useCallback(() => {
    if (index < deck.length - 1) {
      setIndex((i) => i + 1);
      setFlipped(false);
    }
  }, [index, deck.length]);
  const goPrev = useCallback(() => {
    if (index > 0) {
      setIndex((i) => i - 1);
      setFlipped(false);
    }
  }, [index]);

  function handleKnewIt() {
    setKnown((prev) => new Set([...prev, current.id]));
    setLearning((prev) => {
      const s = new Set(prev);
      s.delete(current.id);
      return s;
    });
    if (index < deck.length - 1) {
      setIndex((i) => i + 1);
      setFlipped(false);
    } else setFinished(true);
  }

  function handleStillLearning() {
    setLearning((prev) => new Set([...prev, current.id]));
    setKnown((prev) => {
      const s = new Set(prev);
      s.delete(current.id);
      return s;
    });
    const newLives = lives - 1;
    setLives(newLives);
    if (newLives <= 0) {
      setGameOver(true);
      return;
    }
    if (index < deck.length - 1) {
      setIndex((i) => i + 1);
      setFlipped(false);
    } else setFinished(true);
  }

  function handleShuffle() {
    setDeck([...deck].sort(() => Math.random() - 0.5));
    setIndex(0);
    setFlipped(false);
    setShuffled(true);
  }

  function handleRestart() {
    setDeck([...cards]);
    setIndex(0);
    setFlipped(false);
    setKnown(new Set());
    setLearning(new Set());
    setLives(MAX_LIVES);
    setFinished(false);
    setGameOver(false);
    setShuffled(false);
  }

  // Close on ESC
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

  function Hearts() {
    return (
      <div className="study-lives">
        {Array.from({ length: MAX_LIVES }).map((_, i) => (
          <span key={i} className={`study-heart${i >= lives ? " lost" : ""}`}>
            ♥
          </span>
        ))}
      </div>
    );
  }

  function CtrlBtn({
    onClick,
    icon,
    label,
    active = false,
  }: {
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    active?: boolean;
  }) {
    return (
      <button
        onClick={onClick}
        style={{
          background: "none",
          border: `1px solid ${active ? "#4c1d95" : "#0d0620"}`,
          cursor: "pointer",
          color: active ? "#a78bfa" : "#2d1060",
          padding: "4px 8px",
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        {icon}
        <span className="pf" style={{ fontSize: 6 }}>
          {label}
        </span>
      </button>
    );
  }

  const endStats = [
    { num: known.size, color: "#4ade80", lbl: "KNEW IT" },
    { num: learning.size, color: "#f87171", lbl: "LEARNING" },
    {
      num: gameOver ? index + 1 : deck.length - known.size - learning.size,
      color: gameOver ? "#3b1d6a" : "#a78bfa",
      lbl: gameOver ? "CARDS SEEN" : "SKIPPED",
    },
  ];

  // End screens
  if (gameOver || finished) {
    return (
      <div className="study-overlay pop-in">
        <div className="study-inner">
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: 16,
            }}
          >
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "1px solid #0d0620",
                cursor: "pointer",
                color: "#2d1060",
                padding: "6px 10px",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <X size={12} />
              <span className="pf" style={{ fontSize: 6 }}>
                CLOSE
              </span>
            </button>
          </div>
          <div className="study-endscreen">
            <div className="study-endscreen-icon">{gameOver ? "💔" : "🏆"}</div>
            <div className="study-endscreen-title">
              {gameOver ? "OUT OF LIVES!" : "ROUND COMPLETE!"}
            </div>
            <div className="study-endscreen-sub">
              {gameOver
                ? "KEEP PRACTICING AND TRY AGAIN"
                : `${deck.length} CARDS · ${lives} ${lives === 1 ? "LIFE" : "LIVES"} REMAINING`}
            </div>
            <div className="study-endscreen-stats">
              {endStats.map(({ num, color, lbl }) => (
                <div key={lbl} className="study-stat">
                  <div className="study-stat-num" style={{ color }}>
                    {num}
                  </div>
                  <div className="study-stat-lbl">{lbl}</div>
                </div>
              ))}
            </div>
            <div className="study-endscreen-btns">
              <button className="fc-btn success" onClick={handleRestart}>
                <RotateCcw size={11} /> {gameOver ? "TRY AGAIN" : "STUDY AGAIN"}
              </button>
              <button className="fc-btn ghost" onClick={onClose}>
                <ArrowLeft size={11} /> BACK TO CARDS
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="study-overlay pop-in">
      <div className="study-inner">
        {/* Top bar */}
        <div className="study-topbar">
          <div className="study-avatar">
            <User size={24} color="#6d28d9" />
          </div>
          <div>
            <div className="study-user-name">{userName}</div>
            <div className="study-user-sub">FLASHCARD SESSION</div>
          </div>
          <div style={{ flex: 1 }} />
          <Hearts />
          <CtrlBtn
            onClick={handleShuffle}
            icon={<Shuffle size={10} />}
            label="SHUFFLE"
            active={shuffled}
          />
          <CtrlBtn
            onClick={handleRestart}
            icon={<RotateCcw size={10} />}
            label="RESTART"
          />
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              background: "rgba(127,29,29,.2)",
              border: "1px solid #991b1b",
              cursor: "pointer",
              color: "#f87171",
              padding: "4px 8px",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <X size={10} />
            <span className="pf" style={{ fontSize: 6 }}>
              CLOSE
            </span>
          </button>
        </div>

        {/* Progress bar — based on mastery */}
        <div className="study-progress-bar">
          <div
            className="study-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Flip card */}
        <div className="study-scene" onClick={() => setFlipped((f) => !f)}>
          <div className={`study-card-inner${flipped ? " flipped" : ""}`}>
            <div className="study-face study-front">
              <CornerDot pos={CORNER.topLeft} color="#0d0620" />
              <CornerDot pos={CORNER.topRight} color="#0d0620" />
              <div className="study-face-label">
                TERM {index + 1} / {deck.length}
              </div>
              {/* Front = TERM = answer field */}
              <div className="study-face-text">{current?.answer}</div>
              <div className="study-face-hint">CLICK OR SPACE TO FLIP</div>
            </div>
            <div className="study-face study-back">
              <CornerDot pos={CORNER.topLeft} color="#14532d" />
              <CornerDot pos={CORNER.topRight} color="#14532d" />
              <div className="study-face-label">MEANING</div>
              {/* Back = MEANING = question field */}
              <div className="study-face-text">{current?.question}</div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="study-action-row">
          {flipped ? (
            <>
              <button
                className="study-act-btn no"
                onClick={handleStillLearning}
              >
                <X size={12} /> STILL LEARNING
              </button>
              <button className="study-act-btn yes" onClick={handleKnewIt}>
                <Check size={12} /> KNEW IT
              </button>
            </>
          ) : (
            <button
              className="study-reveal-btn"
              onClick={() => setFlipped(true)}
            >
              <RotateCcw size={12} /> REVEAL MEANING
            </button>
          )}
        </div>

        {/* Navigation */}
        <div className="study-nav-row">
          <button
            className="study-nav-btn"
            onClick={goPrev}
            disabled={index === 0}
          >
            <ChevronLeft size={16} color="#2d1060" />
          </button>
          <div className="study-counter">
            {index + 1} OF {deck.length}
          </div>
          <button
            className="study-nav-btn"
            onClick={goNext}
            disabled={index === deck.length - 1}
          >
            <ChevronRight size={16} color="#2d1060" />
          </button>
        </div>

        {/* Live stats */}
        <div className="study-stats-row">
          {[
            { num: known.size, color: "#4ade80", lbl: "KNEW IT" },
            { num: learning.size, color: "#f87171", lbl: "LEARNING" },
            {
              num: deck.length - known.size - learning.size,
              color: "#a78bfa",
              lbl: "NOT SEEN",
            },
          ].map(({ num, color, lbl }) => (
            <div key={lbl} className="study-stat">
              <div className="study-stat-num" style={{ color }}>
                {num}
              </div>
              <div className="study-stat-lbl">{lbl}</div>
            </div>
          ))}
        </div>

        {/* Keyboard hints */}
        <div className="study-shortcut-hint">
          <Keyboard size={10} color="#0d0620" />
          <span>
            <span className="kbd">SPACE</span> flip
          </span>
          <span>
            <span className="kbd">←</span>
            <span className="kbd">→</span> navigate
          </span>
          <span>
            <span className="kbd">ESC</span> close
          </span>
        </div>
      </div>
    </div>
  );
}
