import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  supabase,
  getCurrentUser,
  createGameSession,
} from "../../lib/supabase";
import {
  Share2,
  Play,
  Users,
  Pencil,
  X,
  Check,
  Plus,
  Gamepad2,
  Trophy,
  Clock,
  Globe,
  Lock,
  XCircle,
  CheckCircle,
  TrendingUp,
} from "lucide-react";

type DbGame = {
  id: string;
  title: string;
  creator_id: string | null;
  is_multiplayer: boolean;
  max_players: number;
  is_public: boolean;
  difficulty: string;
  created_at: string;
};

type ChoiceInput = { text: string; isCorrect: boolean };
type QuestionInput = { text: string; choices: ChoiceInput[] };

type WrongAnswer = {
  id: string;
  game_title: string;
  question_text: string;
  wrong_choice: string;
  correct_choice: string;
  difficulty: string;
  created_at: string;
};

type PlayerStats = {
  total_games: number;
  total_correct: number;
  total_answered: number;
  current_streak: number;
  highest_score: number;
  accuracy: number;
};

export default function MyGames() {
  const navigate = useNavigate();
  const [games, setGames] = useState<DbGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [isPublic, setIsPublic] = useState(true);
  const [difficulty, setDifficulty] = useState<"easy" | "normal" | "hard">(
    "easy",
  );
  const [questions, setQuestions] = useState<QuestionInput[]>([]);
  const [qText, setQText] = useState("");
  const [choiceInputs, setChoiceInputs] = useState<ChoiceInput[]>([
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editIsMultiplayer, setEditIsMultiplayer] = useState(false);
  const [editMaxPlayers, setEditMaxPlayers] = useState(4);
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [editDifficulty, setEditDifficulty] = useState<
    "easy" | "normal" | "hard"
  >("easy");

  // ── Game-level question editing ───────────────────────────────────────────
  const [editGameQuestions, setEditGameQuestions] = useState<QuestionInput[]>(
    [],
  );
  const [editGameQText, setEditGameQText] = useState("");
  const [editGameChoiceInputs, setEditGameChoiceInputs] = useState<
    ChoiceInput[]
  >([]);
  const [editingGameQIdx, setEditingGameQIdx] = useState<number | null>(null);
  const [editingGameQText, setEditingGameQText] = useState("");
  const [editingGameQChoices, setEditingGameQChoices] = useState<ChoiceInput[]>(
    [],
  );
  const [editQuestionsLoading, setEditQuestionsLoading] = useState(false);

  // Share/Join Modal State
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareCode, setShareCode] = useState("");
  const [shareGameId, setShareGameId] = useState<string | null>(null);

  // Separate Join Modal State
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinInput, setJoinInput] = useState("");

  // Question Editing State (create panel)
  const [editingQuestionIdx, setEditingQuestionIdx] = useState<number | null>(
    null,
  );
  const [editQText, setEditQText] = useState("");
  const [editQChoices, setEditQChoices] = useState<ChoiceInput[]>([]);

  // Stats Modal State
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [stats, setStats] = useState<PlayerStats>({
    total_games: 0,
    total_correct: 0,
    total_answered: 0,
    current_streak: 0,
    highest_score: 0,
    accuracy: 0,
  });
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);
  const [filterDifficulty, setFilterDifficulty] = useState<
    "all" | "easy" | "normal" | "hard"
  >("all");
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    loadGames();
  }, []);

  async function loadGames() {
    setLoading(true);
    try {
      const user = await getCurrentUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setGames(data ?? []);
    } catch (e: any) {
      console.error("Error loading games:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(gameId: string) {
    if (!window.confirm("DELETE THIS GAME?")) return;
    try {
      const { error } = await supabase.from("games").delete().eq("id", gameId);
      if (error) throw error;
      setGames((g) => g.filter((x) => x.id !== gameId));
    } catch (e: any) {
      alert("⚠️ DELETE FAILED: " + e.message);
    }
  }

  async function handleShare(gameId: string, _gameTitle: string) {
    try {
      const user = await getCurrentUser();
      if (!user) return;
      const game = games.find((g) => g.id === gameId);
      if (!game) return;
      const session = await createGameSession(
        gameId,
        user.id,
        game.is_multiplayer,
        game.max_players,
      );
      const code = session.session_code;
      setShareCode(code || "");
      setShareGameId(gameId);
      setShowShareModal(true);
      try {
        await navigator.clipboard.writeText(code || "");
      } catch {}
    } catch (e: any) {
      alert("⚠️ FAILED: " + e.message);
    }
  }

  function copyCodeToClipboard() {
    try {
      navigator.clipboard.writeText(shareCode);
      alert("✅ Code copied to clipboard!");
    } catch {
      alert("⚠️ Failed to copy code");
    }
  }

  async function joinGameWithCode() {
    if (!joinInput.trim()) {
      alert("⚠️ ENTER A CODE");
      return;
    }
    try {
      const user = await getCurrentUser();
      if (!user) return;
      navigate(`/game?code=${joinInput.trim()}`);
      setShowJoinModal(false);
      setJoinInput("");
    } catch (e: any) {
      alert("⚠️ JOIN FAILED: " + e.message);
    }
  }

  async function handlePlayMultiplayer(gameId: string) {
    try {
      const user = await getCurrentUser();
      if (!user) return;
      const game = games.find((g) => g.id === gameId);
      if (!game) return;
      const session = await createGameSession(
        gameId,
        user.id,
        game.is_multiplayer,
        game.max_players,
      );
      navigate(`/game/${gameId}?session=${session.id}`);
    } catch (e: any) {
      alert("⚠️ FAILED: " + e.message);
    }
  }

  // ── startEdit: now async — loads questions + choices from DB ─────────────
  async function startEdit(game: DbGame) {
    setEditingId(game.id);
    setEditTitle(game.title);
    setEditIsMultiplayer(game.is_multiplayer);
    setEditMaxPlayers(game.max_players);
    setEditIsPublic(game.is_public);
    const diff = (game.difficulty as "easy" | "normal" | "hard") || "easy";
    setEditDifficulty(diff);
    setEditGameQText("");
    setEditingGameQIdx(null);
    setEditGameChoiceInputs(
      Array.from({ length: getChoicesCountForDifficulty(diff) }, () => ({
        text: "",
        isCorrect: false,
      })),
    );

    setEditQuestionsLoading(true);
    try {
      const { data: qs, error: qErr } = await supabase
        .from("questions")
        .select("id, text, ordering, choices(id, text, is_correct)")
        .eq("game_id", game.id)
        .order("ordering");
      if (qErr) throw qErr;
      setEditGameQuestions(
        (qs ?? []).map((q: any) => ({
          text: q.text,
          choices: (q.choices ?? []).map((c: any) => ({
            text: c.text,
            isCorrect: c.is_correct,
          })),
        })),
      );
    } catch (e: any) {
      console.error("Error loading questions:", e);
      setEditGameQuestions([]);
    } finally {
      setEditQuestionsLoading(false);
    }
  }

  // ── saveEdit: persists metadata + replaces all questions/choices ──────────
  async function saveEdit(gameId: string) {
    if (!editTitle.trim()) return alert("⚠️ TITLE REQUIRED");
    if (editGameQuestions.length === 0)
      return alert("⚠️ ADD AT LEAST ONE QUESTION");
    try {
      const { error } = await supabase
        .from("games")
        .update({
          title: editTitle.trim(),
          is_multiplayer: editIsMultiplayer,
          max_players: editMaxPlayers,
          is_public: editIsPublic,
          difficulty: editDifficulty,
        })
        .eq("id", gameId);
      if (error) throw error;

      // Delete existing questions (choices cascade-delete via FK)
      const { error: delErr } = await supabase
        .from("questions")
        .delete()
        .eq("game_id", gameId);
      if (delErr) throw delErr;

      // Re-insert updated questions
      const { data: insertedQs, error: qErr } = await supabase
        .from("questions")
        .insert(
          editGameQuestions.map((q, idx) => ({
            game_id: gameId,
            text: q.text,
            time_limit:
              editDifficulty === "easy"
                ? 30
                : editDifficulty === "normal"
                  ? 20
                  : 15,
            points: 100,
            ordering: idx,
          })),
        )
        .select();
      if (qErr) throw qErr;
      if (!insertedQs) throw new Error("Question insert failed");

      // Insert choices
      const { error: cErr } = await supabase.from("choices").insert(
        insertedQs.flatMap((iq, idx) =>
          editGameQuestions[idx].choices.map((c) => ({
            question_id: iq.id,
            text: c.text,
            is_correct: c.isCorrect,
          })),
        ),
      );
      if (cErr) throw cErr;

      setGames((prev) =>
        prev.map((g) =>
          g.id === gameId
            ? {
                ...g,
                title: editTitle.trim(),
                is_multiplayer: editIsMultiplayer,
                max_players: editMaxPlayers,
                is_public: editIsPublic,
                difficulty: editDifficulty,
              }
            : g,
        ),
      );
      setEditingId(null);
    } catch (e: any) {
      alert("⚠️ UPDATE FAILED: " + e.message);
    }
  }

  // ── Helpers for the CREATE panel ──────────────────────────────────────────
  function updateChoiceInput(idx: number, v: string) {
    setChoiceInputs(
      choiceInputs.map((c, i) => (i === idx ? { ...c, text: v } : c)),
    );
  }

  function markCorrect(idx: number) {
    setChoiceInputs(
      choiceInputs.map((c, i) => ({ ...c, isCorrect: i === idx })),
    );
  }

  function addQuestion() {
    if (!qText.trim()) return alert("⚠️ ENTER QUESTION");
    if (!choiceInputs.some((c) => c.isCorrect))
      return alert("⚠️ SELECT CORRECT ANSWER");
    const requiredChoices = getChoicesCountForDifficulty(difficulty);
    const filledChoices = choiceInputs.filter((c) => c.text.trim()).length;
    if (filledChoices < requiredChoices)
      return alert(
        `⚠️ FILL ALL ${requiredChoices} CHOICES FOR ${difficulty.toUpperCase()}`,
      );
    setQuestions([
      ...questions,
      {
        text: qText.trim(),
        choices: choiceInputs
          .filter((c) => c.text.trim())
          .map((c) => ({ ...c })),
      },
    ]);
    setQText("");
    setChoiceInputs(initializeChoicesForDifficulty());
  }

  async function saveGame() {
    if (!title.trim()) return alert("⚠️ ENTER TITLE");
    if (questions.length === 0) return alert("⚠️ ADD AT LEAST ONE QUESTION");
    if (saving) return;
    const user = await getCurrentUser();
    if (!user) return alert("⚠️ LOGIN REQUIRED");
    setSaving(true);
    try {
      const { data: gameRows, error: gErr } = await supabase
        .from("games")
        .insert({
          title: title.trim(),
          creator_id: user.id,
          is_multiplayer: isMultiplayer,
          max_players: maxPlayers,
          is_public: isPublic,
          difficulty,
        })
        .select()
        .single();
      if (gErr) throw gErr;
      if (!gameRows) throw new Error("Game not created");

      const { data: insertedQuestions, error: qErr } = await supabase
        .from("questions")
        .insert(
          questions.map((q, idx) => ({
            game_id: gameRows.id,
            text: q.text,
            time_limit: 30,
            points: 100,
            ordering: idx,
          })),
        )
        .select();
      if (qErr) throw qErr;
      if (!insertedQuestions || insertedQuestions.length !== questions.length)
        throw new Error("Question mismatch");

      const { error: cErr } = await supabase.from("choices").insert(
        insertedQuestions.flatMap((iq, idx) =>
          questions[idx].choices.map((c) => ({
            question_id: iq.id,
            text: c.text,
            is_correct: c.isCorrect,
          })),
        ),
      );
      if (cErr) throw cErr;

      setTitle("");
      setQuestions([]);
      setIsMultiplayer(false);
      setMaxPlayers(4);
      setIsPublic(true);
      setDifficulty("easy");
      setChoiceInputs([
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ]);
      setShowCreate(false);
      await loadGames();
      alert("✅ Game created successfully!");
    } catch (e: any) {
      alert("⚠️ SAVE FAILED: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const getChoicesCountForDifficulty = (diff: "easy" | "normal" | "hard") => {
    const counts = { easy: 3, normal: 4, hard: 5 };
    return counts[diff];
  };

  const initializeChoicesForDifficulty = () => {
    const count = getChoicesCountForDifficulty(difficulty);
    return Array.from({ length: count }, () => ({
      text: "",
      isCorrect: false,
    }));
  };

  // ── CREATE panel: inline question editor ──────────────────────────────────
  function startEditQuestion(idx: number) {
    setEditingQuestionIdx(idx);
    setEditQText(questions[idx].text);
    const requiredCount = getChoicesCountForDifficulty(difficulty);
    const existing = questions[idx].choices;
    const adjusted: ChoiceInput[] = Array.from(
      { length: requiredCount },
      (_, i) => ({
        text: existing[i]?.text ?? "",
        isCorrect: existing[i]?.isCorrect ?? false,
      }),
    );
    if (!adjusted.some((c) => c.isCorrect))
      adjusted.forEach((c) => (c.isCorrect = false));
    setEditQChoices(adjusted);
  }

  function updateEditQChoice(idx: number, v: string) {
    setEditQChoices(
      editQChoices.map((c, i) => (i === idx ? { ...c, text: v } : c)),
    );
  }

  function markEditQCorrect(idx: number) {
    setEditQChoices(
      editQChoices.map((c, i) => ({ ...c, isCorrect: i === idx })),
    );
  }

  function saveEditQuestion() {
    if (!editQText.trim()) return alert("⚠️ ENTER QUESTION");
    if (!editQChoices.some((c) => c.isCorrect))
      return alert("⚠️ SELECT CORRECT ANSWER");
    const requiredCount = getChoicesCountForDifficulty(difficulty);
    const filledChoices = editQChoices.filter((c) => c.text.trim()).length;
    if (filledChoices < requiredCount)
      return alert(
        `⚠️ FILL ALL ${requiredCount} CHOICES FOR ${difficulty.toUpperCase()}`,
      );
    setQuestions(
      questions.map((q, i) =>
        i === editingQuestionIdx
          ? {
              ...q,
              text: editQText.trim(),
              choices: editQChoices.filter((c) => c.text.trim()),
            }
          : q,
      ),
    );
    setEditingQuestionIdx(null);
    setEditQText("");
    setEditQChoices([]);
  }

  function cancelEditQuestion() {
    setEditingQuestionIdx(null);
    setEditQText("");
    setEditQChoices([]);
  }

  // ── EDIT panel: question helpers ──────────────────────────────────────────
  function updateEditGameChoiceInput(idx: number, v: string) {
    setEditGameChoiceInputs((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, text: v } : c)),
    );
  }

  function markEditGameCorrect(idx: number) {
    setEditGameChoiceInputs((prev) =>
      prev.map((c, i) => ({ ...c, isCorrect: i === idx })),
    );
  }

  function addEditGameQuestion() {
    if (!editGameQText.trim()) return alert("⚠️ ENTER QUESTION");
    if (!editGameChoiceInputs.some((c) => c.isCorrect))
      return alert("⚠️ SELECT CORRECT ANSWER");
    const required = getChoicesCountForDifficulty(editDifficulty);
    const filled = editGameChoiceInputs.filter((c) => c.text.trim()).length;
    if (filled < required)
      return alert(
        `⚠️ FILL ALL ${required} CHOICES FOR ${editDifficulty.toUpperCase()}`,
      );
    setEditGameQuestions((prev) => [
      ...prev,
      {
        text: editGameQText.trim(),
        choices: editGameChoiceInputs
          .filter((c) => c.text.trim())
          .map((c) => ({ ...c })),
      },
    ]);
    setEditGameQText("");
    setEditGameChoiceInputs(
      Array.from(
        { length: getChoicesCountForDifficulty(editDifficulty) },
        () => ({
          text: "",
          isCorrect: false,
        }),
      ),
    );
  }

  function startEditGameQuestion(idx: number) {
    setEditingGameQIdx(idx);
    setEditingGameQText(editGameQuestions[idx].text);
    const required = getChoicesCountForDifficulty(editDifficulty);
    const existing = editGameQuestions[idx].choices;
    const adjusted: ChoiceInput[] = Array.from(
      { length: required },
      (_, i) => ({
        text: existing[i]?.text ?? "",
        isCorrect: existing[i]?.isCorrect ?? false,
      }),
    );
    if (!adjusted.some((c) => c.isCorrect))
      adjusted.forEach((c) => (c.isCorrect = false));
    setEditingGameQChoices(adjusted);
  }

  function updateEditingGameQChoice(idx: number, v: string) {
    setEditingGameQChoices((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, text: v } : c)),
    );
  }

  function markEditingGameQCorrect(idx: number) {
    setEditingGameQChoices((prev) =>
      prev.map((c, i) => ({ ...c, isCorrect: i === idx })),
    );
  }

  function saveEditGameQuestion() {
    if (!editingGameQText.trim()) return alert("⚠️ ENTER QUESTION");
    if (!editingGameQChoices.some((c) => c.isCorrect))
      return alert("⚠️ SELECT CORRECT ANSWER");
    const required = getChoicesCountForDifficulty(editDifficulty);
    const filled = editingGameQChoices.filter((c) => c.text.trim()).length;
    if (filled < required)
      return alert(
        `⚠️ FILL ALL ${required} CHOICES FOR ${editDifficulty.toUpperCase()}`,
      );
    setEditGameQuestions((prev) =>
      prev.map((q, i) =>
        i === editingGameQIdx
          ? {
              ...q,
              text: editingGameQText.trim(),
              choices: editingGameQChoices.filter((c) => c.text.trim()),
            }
          : q,
      ),
    );
    setEditingGameQIdx(null);
    setEditingGameQText("");
    setEditingGameQChoices([]);
  }

  function cancelEditGameQuestion() {
    setEditingGameQIdx(null);
    setEditingGameQText("");
    setEditingGameQChoices([]);
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  async function loadStats() {
    setStatsLoading(true);
    try {
      const user = await getCurrentUser();
      if (!user) return;
      const { data: playerScores, error: scoreError } = await supabase
        .from("player_scores")
        .select("score, total_correct, total_answered, streak")
        .eq("user_id", user.id);
      if (scoreError) throw scoreError;
      if (playerScores && playerScores.length > 0) {
        const totalCorrect = playerScores.reduce(
          (sum, p) => sum + (p.total_correct || 0),
          0,
        );
        const totalAnswered = playerScores.reduce(
          (sum, p) => sum + (p.total_answered || 0),
          0,
        );
        const maxScore = Math.max(...playerScores.map((p) => p.score || 0));
        const maxStreak = Math.max(...playerScores.map((p) => p.streak || 0));
        setStats({
          total_games: playerScores.length,
          total_correct: totalCorrect,
          total_answered: totalAnswered,
          current_streak: maxStreak,
          highest_score: maxScore,
          accuracy:
            totalAnswered > 0
              ? Math.round((totalCorrect / totalAnswered) * 100)
              : 0,
        });
      }
      setWrongAnswers([
        {
          id: "1",
          game_title: "Sample Game",
          question_text: "What is the capital of France?",
          wrong_choice: "London",
          correct_choice: "Paris",
          difficulty: "easy",
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (e: any) {
      console.error("Error loading stats:", e);
    } finally {
      setStatsLoading(false);
    }
  }

  const filteredWrongAnswers = wrongAnswers.filter(
    (ans) => filterDifficulty === "all" || ans.difficulty === filterDifficulty,
  );

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4">
          <Gamepad2 className="text-purple-400 animate-pulse" size={40} />
          <div className="pixel-font text-purple-400 text-xs">
            LOADING GAMES...
          </div>
        </div>
      </div>
    );
  }

  // ── Reusable choice grid ──────────────────────────────────────────────────
  function ChoiceGrid({
    choices,
    onUpdate,
    onMarkCorrect,
  }: {
    choices: ChoiceInput[];
    onUpdate: (idx: number, v: string) => void;
    onMarkCorrect: (idx: number) => void;
  }) {
    return (
      <div
        className={`grid gap-2 ${
          choices.length === 5 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2"
        }`}
      >
        {choices.map((c, i) => (
          <div
            key={i}
            onClick={() => onMarkCorrect(i)}
            className="cursor-pointer"
          >
            <div
              className={`pixel-box border-2 p-2 transition-colors ${
                c.isCorrect
                  ? "border-green-400 bg-green-900/30"
                  : "border-purple-700 bg-purple-900/30 hover:border-purple-500"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className={`w-5 h-5 pixel-box border-2 flex items-center justify-center text-[9px] pixel-font font-bold shrink-0 ${
                    c.isCorrect
                      ? "bg-green-500 border-green-300 text-white"
                      : "bg-purple-800 border-purple-500 text-purple-400"
                  }`}
                >
                  {c.isCorrect ? "✓" : String.fromCharCode(65 + i)}
                </div>
                <span className="pixel-font text-[8px] text-purple-400">
                  {c.isCorrect ? "CORRECT" : "OPTION"}
                </span>
              </div>
              <input
                value={c.text}
                onChange={(e) => {
                  e.stopPropagation();
                  onUpdate(i, e.target.value);
                }}
                onClick={(e) => e.stopPropagation()}
                placeholder={`CHOICE ${String.fromCharCode(65 + i)}`}
                className="w-full bg-transparent text-white pixel-font text-[9px] border-0 focus:outline-none"
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .pixel-font { font-family: 'Press Start 2P', monospace; }
        .pixel-box { border-radius: 0; }
        .game-card { transition: transform 0.1s, box-shadow 0.1s; }
        .game-card:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0 rgba(139,92,246,0.5); }
        .btn-press:active { transform: translate(2px, 2px); box-shadow: none !important; }
        input::placeholder, textarea::placeholder { font-family: 'Press Start 2P', monospace; font-size: 0.5rem; opacity: 0.5; }
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        .diff-btn { transition: background .15s, border-color .15s, transform .08s; }
        .diff-btn:active { transform: translate(1px,1px); }
        @keyframes diffGlow { 0%,100%{opacity:.8}50%{opacity:1} }
        .diff-active { animation: diffGlow 2s ease-in-out infinite; }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="pixel-font text-purple-300 text-base sm:text-xl">
            MY GAMES
          </h2>
          <p className="pixel-font text-purple-500 text-[8px] mt-1">
            {games.length} GAME{games.length !== 1 ? "S" : ""} CREATED
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowStatsModal(true);
              loadStats();
            }}
            className="btn-press pixel-box pixel-font text-[10px] sm:text-xs px-4 py-3 border-2 flex items-center gap-2 transition-colors bg-yellow-700/80 border-yellow-600 text-yellow-200 hover:bg-yellow-700"
          >
            <Trophy size={12} /> STATS
          </button>
          <button
            onClick={() => setShowJoinModal(true)}
            className="btn-press pixel-box pixel-font text-[10px] sm:text-xs px-4 py-3 border-2 flex items-center gap-2 transition-colors bg-purple-700 border-purple-500 text-purple-200 hover:bg-purple-600"
          >
            <Users size={12} /> JOIN
          </button>
          <button
            onClick={() => {
              setShowCreate(!showCreate);
              setEditingId(null);
            }}
            className={`btn-press pixel-box pixel-font text-[10px] sm:text-xs px-4 py-3 border-2 flex items-center gap-2 transition-colors ${
              showCreate
                ? "bg-red-900/80 border-red-500 text-red-300 hover:bg-red-900"
                : "bg-cyan-600 border-cyan-400 text-white hover:bg-cyan-500"
            }`}
          >
            {showCreate ? (
              <>
                <X size={12} /> CANCEL
              </>
            ) : (
              <>
                <Plus size={12} /> NEW
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── CREATE FORM ────────────────────────────────────────────────────── */}
      {showCreate && (
        <div
          className="mb-6 pixel-box border-4 border-cyan-500 bg-purple-950/90 overflow-hidden"
          style={{ boxShadow: "6px 6px 0 rgba(6,182,212,0.3)" }}
        >
          <div className="bg-cyan-600 px-4 py-3 flex items-center gap-2">
            <Plus size={14} className="text-white" />
            <span className="pixel-font text-white text-xs">CREATE GAME</span>
          </div>

          <div className="p-4 sm:p-6 space-y-5">
            {/* Title */}
            <div>
              <label className="pixel-font text-[9px] text-cyan-400 block mb-2">
                TITLE
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="GAME TITLE..."
                className="w-full px-4 py-3 bg-purple-900/50 border-2 border-purple-600 focus:border-cyan-400 text-white pixel-font text-xs pixel-box focus:outline-none transition-colors"
              />
            </div>

            {/* Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => setIsMultiplayer(!isMultiplayer)}
                className={`btn-press pixel-box border-2 p-3 flex items-center gap-3 transition-colors ${isMultiplayer ? "bg-purple-600/50 border-purple-400" : "bg-purple-900/30 border-purple-700 hover:border-purple-500"}`}
              >
                <Users
                  size={16}
                  className={
                    isMultiplayer ? "text-cyan-400" : "text-purple-500"
                  }
                />
                <div className="text-left">
                  <div className="pixel-font text-[9px] text-purple-200">
                    MULTIPLAYER
                  </div>
                  <div className="pixel-font text-[8px] text-purple-500 mt-1">
                    {isMultiplayer ? "ON" : "OFF"}
                  </div>
                </div>
                <div
                  className={`ml-auto w-4 h-4 pixel-box border-2 flex items-center justify-center ${isMultiplayer ? "bg-cyan-500 border-cyan-300" : "bg-purple-800 border-purple-600"}`}
                >
                  {isMultiplayer && <Check size={10} className="text-white" />}
                </div>
              </button>

              <button
                onClick={() => setIsPublic(!isPublic)}
                className={`btn-press pixel-box border-2 p-3 flex items-center gap-3 transition-colors ${isPublic ? "bg-green-900/30 border-green-600" : "bg-purple-900/30 border-purple-700 hover:border-purple-500"}`}
              >
                {isPublic ? (
                  <Globe size={16} className="text-green-400" />
                ) : (
                  <Lock size={16} className="text-purple-500" />
                )}
                <div className="text-left">
                  <div className="pixel-font text-[9px] text-purple-200">
                    {isPublic ? "PUBLIC" : "PRIVATE"}
                  </div>
                  <div className="pixel-font text-[8px] text-purple-500 mt-1">
                    {isPublic ? "ANYONE" : "INVITE"}
                  </div>
                </div>
                <div
                  className={`ml-auto w-4 h-4 pixel-box border-2 flex items-center justify-center ${isPublic ? "bg-green-500 border-green-300" : "bg-purple-800 border-purple-600"}`}
                >
                  {isPublic && <Check size={10} className="text-white" />}
                </div>
              </button>
            </div>

            {/* Difficulty */}
            <div>
              <label className="pixel-font text-[9px] text-cyan-400 block mb-2">
                DIFFICULTY
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["easy", "normal", "hard"] as const).map((d) => {
                  const meta = {
                    easy: {
                      label: "EASY",
                      color: "#22c55e",
                      bg: "#052e16",
                      desc: "30s · 3 choices",
                    },
                    normal: {
                      label: "NORMAL",
                      color: "#eab308",
                      bg: "#1c1400",
                      desc: "20s · 4 choices",
                    },
                    hard: {
                      label: "HARD",
                      color: "#ef4444",
                      bg: "#200000",
                      desc: "15s · 5 choices",
                    },
                  }[d];
                  const active = difficulty === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        setDifficulty(d);
                        setChoiceInputs(
                          Array.from(
                            { length: getChoicesCountForDifficulty(d) },
                            () => ({ text: "", isCorrect: false }),
                          ),
                        );
                        if (editingQuestionIdx !== null) {
                          const req = getChoicesCountForDifficulty(d);
                          setEditQChoices((prev) =>
                            Array.from({ length: req }, (_, i) => ({
                              text: prev[i]?.text ?? "",
                              isCorrect: prev[i]?.isCorrect ?? false,
                            })),
                          );
                        }
                      }}
                      className={`diff-btn pixel-box border-2 p-3 flex flex-col gap-1 text-left ${active ? "diff-active" : ""}`}
                      style={{
                        background: active ? meta.bg : "rgba(88,28,135,0.1)",
                        borderColor: active ? meta.color : "#4c1d95",
                      }}
                    >
                      <span
                        className="pixel-font text-[9px]"
                        style={{ color: active ? meta.color : "#6b21a8" }}
                      >
                        {meta.label}
                      </span>
                      <span
                        className="pixel-font text-[7px]"
                        style={{ color: active ? "#a78bfa" : "#3b1d6a" }}
                      >
                        {meta.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {isMultiplayer && (
              <div>
                <label className="pixel-font text-[9px] text-purple-400 block mb-2">
                  MAX PLAYERS: {maxPlayers}
                </label>
                <input
                  type="range"
                  min="2"
                  max="10"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(+e.target.value)}
                  className="w-full accent-purple-500"
                />
              </div>
            )}

            {/* Questions */}
            <div className="border-t-2 border-purple-800 pt-4">
              <div className="pixel-font text-[9px] text-cyan-400 mb-3 flex items-center gap-2">
                <Trophy size={12} /> ADD QUESTIONS
              </div>

              <textarea
                value={qText}
                onChange={(e) => setQText(e.target.value)}
                placeholder="TYPE QUESTION..."
                rows={2}
                className="w-full px-4 py-3 bg-purple-900/50 border-2 border-purple-600 focus:border-cyan-400 text-white pixel-font text-xs pixel-box focus:outline-none transition-colors mb-3 resize-none"
              />

              <div className="mb-3">
                <div className="pixel-font text-[8px] text-cyan-400 mb-2 flex items-center gap-1">
                  <Lock size={10} /> {getChoicesCountForDifficulty(difficulty)}{" "}
                  CHOICES LOCKED
                </div>
                <ChoiceGrid
                  choices={choiceInputs}
                  onUpdate={updateChoiceInput}
                  onMarkCorrect={markCorrect}
                />
              </div>
              <p className="pixel-font text-[8px] text-purple-600 mb-3">
                ↑ CLICK TO MARK CORRECT
              </p>

              <button
                onClick={addQuestion}
                className="btn-press w-full py-2 bg-purple-700 border-2 border-purple-500 text-purple-200 pixel-font text-[10px] pixel-box hover:bg-purple-600 transition-colors"
              >
                + ADD QUESTION
              </button>
            </div>

            {/* Questions List */}
            {questions.length > 0 && (
              <div className="border-2 border-purple-700 pixel-box">
                <div className="bg-purple-800/50 px-3 py-2 pixel-font text-[9px] text-purple-300 flex items-center gap-2">
                  <Trophy size={10} /> {questions.length} QUESTION
                  {questions.length !== 1 ? "S" : ""}
                </div>
                <div className="max-h-48 overflow-y-auto hide-scroll divide-y-2 divide-purple-800">
                  {questions.map((q, idx) => (
                    <div key={idx}>
                      {editingQuestionIdx === idx ? (
                        <div className="px-3 py-3 bg-purple-900/40 space-y-2">
                          <div className="pixel-font text-[8px] text-cyan-400 mb-2 flex items-center justify-between">
                            <span>✏️ EDITING Q#{idx + 1}</span>
                            <span className="text-purple-500">
                              {getChoicesCountForDifficulty(difficulty)} CHOICES
                              · {difficulty.toUpperCase()}
                            </span>
                          </div>
                          <textarea
                            value={editQText}
                            onChange={(e) => setEditQText(e.target.value)}
                            placeholder="EDIT QUESTION..."
                            rows={2}
                            className="w-full px-2 py-2 bg-purple-900/50 border-2 border-purple-600 focus:border-cyan-400 text-white pixel-font text-[8px] pixel-box focus:outline-none transition-colors resize-none"
                          />
                          <ChoiceGrid
                            choices={editQChoices}
                            onUpdate={updateEditQChoice}
                            onMarkCorrect={markEditQCorrect}
                          />
                          <p className="pixel-font text-[7px] text-purple-600">
                            ↑ CLICK CHOICE TO MARK CORRECT
                          </p>
                          <div className="flex gap-1">
                            <button
                              onClick={saveEditQuestion}
                              className="btn-press flex-1 py-1 bg-green-700 border-2 border-green-500 text-white pixel-font text-[8px] pixel-box hover:bg-green-600 flex items-center justify-center gap-1"
                            >
                              <Check size={8} /> SAVE
                            </button>
                            <button
                              onClick={cancelEditQuestion}
                              className="btn-press flex-1 py-1 bg-red-800 border-2 border-red-600 text-red-300 pixel-font text-[8px] pixel-box hover:bg-red-700 flex items-center justify-center gap-1"
                            >
                              <X size={8} /> CANCEL
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="px-3 py-2 flex items-start gap-2 bg-purple-950/50 group hover:bg-purple-950/70 transition-colors cursor-pointer"
                          onClick={() => startEditQuestion(idx)}
                        >
                          <span className="pixel-font text-[8px] text-purple-500 shrink-0 mt-1">
                            #{idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="pixel-font text-[9px] text-cyan-300 truncate hover:text-cyan-200">
                              {q.text}
                            </div>
                            <div className="flex gap-2 mt-1">
                              {q.choices.map((c, i) => (
                                <span
                                  key={i}
                                  className={`pixel-font text-[8px] ${c.isCorrect ? "text-green-400" : "text-purple-500"}`}
                                >
                                  {String.fromCharCode(65 + i)}
                                  {c.isCorrect ? "✓" : ""}
                                </span>
                              ))}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuestions(
                                questions.filter((_, i) => i !== idx),
                              );
                            }}
                            className="shrink-0 w-5 h-5 bg-red-900/50 border border-red-700 pixel-box text-red-400 pixel-font text-[10px] flex items-center justify-center hover:bg-red-800 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={saveGame}
              disabled={saving}
              className="btn-press w-full py-4 bg-cyan-600 border-2 border-cyan-400 text-white pixel-font text-xs pixel-box hover:bg-cyan-500 transition-colors disabled:opacity-50"
              style={{ boxShadow: "4px 4px 0 rgba(6,182,212,0.4)" }}
            >
              {saving ? "SAVING..." : "▶ SAVE GAME"}
            </button>
          </div>
        </div>
      )}

      {/* ── GAMES LIST ─────────────────────────────────────────────────────── */}
      {games.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 pixel-box border-2 border-purple-800/50 bg-purple-950/30">
          <Gamepad2 size={48} className="text-purple-700 mb-4" />
          <p className="pixel-font text-purple-600 text-xs mb-1">NO GAMES</p>
          <p className="pixel-font text-purple-700 text-[8px]">
            CLICK NEW TO CREATE
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {games.map((game) => (
            <div
              key={game.id}
              className="game-card pixel-box border-2 border-purple-600 bg-purple-950/70 overflow-hidden"
              style={{ boxShadow: "4px 4px 0 rgba(88,28,135,0.4)" }}
            >
              {editingId === game.id ? (
                /* ──────────────────── EDIT PANEL ──────────────────── */
                <div className="p-4 space-y-4">
                  <div className="pixel-font text-[9px] text-cyan-400 mb-2 flex items-center gap-2">
                    <Pencil size={10} /> EDIT GAME
                  </div>

                  {/* Title */}
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-purple-900/50 border-2 border-cyan-400 text-white pixel-font text-xs pixel-box focus:outline-none"
                  />

                  {/* Multi / Public */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditIsMultiplayer(!editIsMultiplayer)}
                      className={`flex-1 px-3 py-2 pixel-box border-2 pixel-font text-[9px] flex items-center justify-center gap-1 transition-colors ${editIsMultiplayer ? "bg-purple-600 border-purple-400 text-white" : "bg-purple-900/30 border-purple-700 text-purple-400"}`}
                    >
                      <Users size={10} /> MULTI
                    </button>
                    <button
                      onClick={() => setEditIsPublic(!editIsPublic)}
                      className={`flex-1 px-3 py-2 pixel-box border-2 pixel-font text-[9px] flex items-center justify-center gap-1 transition-colors ${editIsPublic ? "bg-green-800 border-green-600 text-green-300" : "bg-purple-900/30 border-purple-700 text-purple-400"}`}
                    >
                      {editIsPublic ? <Globe size={10} /> : <Lock size={10} />}{" "}
                      {editIsPublic ? "PUBLIC" : "PRIV"}
                    </button>
                    {editIsMultiplayer && (
                      <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-purple-900/30 border-2 border-purple-700 pixel-box">
                        <span className="pixel-font text-[8px] text-purple-400">
                          MAX
                        </span>
                        <input
                          type="number"
                          min="2"
                          max="10"
                          value={editMaxPlayers}
                          onChange={(e) => setEditMaxPlayers(+e.target.value)}
                          className="w-10 bg-transparent text-white pixel-font text-[9px] border-0 focus:outline-none text-center"
                        />
                      </div>
                    )}
                  </div>

                  {/* Difficulty */}
                  <div>
                    <label className="pixel-font text-[9px] text-cyan-400 block mb-2">
                      DIFFICULTY
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      {(["easy", "normal", "hard"] as const).map((d) => {
                        const meta = {
                          easy: {
                            label: "EASY",
                            color: "#22c55e",
                            bg: "#052e16",
                            desc: "30s · 3 choices",
                          },
                          normal: {
                            label: "NORMAL",
                            color: "#eab308",
                            bg: "#1c1400",
                            desc: "20s · 4 choices",
                          },
                          hard: {
                            label: "HARD",
                            color: "#ef4444",
                            bg: "#200000",
                            desc: "15s · 5 choices",
                          },
                        }[d];
                        const active = editDifficulty === d;
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => {
                              setEditDifficulty(d);
                              // Re-pad/trim the new-question inputs
                              setEditGameChoiceInputs(
                                Array.from(
                                  { length: getChoicesCountForDifficulty(d) },
                                  () => ({ text: "", isCorrect: false }),
                                ),
                              );
                              // Re-pad/trim inline editor if open
                              if (editingGameQIdx !== null) {
                                const req = getChoicesCountForDifficulty(d);
                                setEditingGameQChoices((prev) =>
                                  Array.from({ length: req }, (_, i) => ({
                                    text: prev[i]?.text ?? "",
                                    isCorrect: prev[i]?.isCorrect ?? false,
                                  })),
                                );
                              }
                            }}
                            className={`diff-btn pixel-box border-2 py-2 px-1 flex flex-col items-start gap-0.5 ${active ? "diff-active" : ""}`}
                            style={{
                              background: active
                                ? meta.bg
                                : "rgba(88,28,135,0.1)",
                              borderColor: active ? meta.color : "#4c1d95",
                            }}
                          >
                            <span
                              className="pixel-font text-[8px]"
                              style={{ color: active ? meta.color : "#6b21a8" }}
                            >
                              {meta.label}
                            </span>
                            <span
                              className="pixel-font text-[6px]"
                              style={{ color: active ? "#a78bfa" : "#3b1d6a" }}
                            >
                              {meta.desc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── QUESTIONS SECTION ── */}
                  <div className="border-t-2 border-purple-700 pt-3">
                    <div className="pixel-font text-[9px] text-cyan-400 mb-3 flex items-center gap-2">
                      <Trophy size={10} /> QUESTIONS
                    </div>

                    {editQuestionsLoading ? (
                      <div className="text-center py-4">
                        <Gamepad2
                          className="text-purple-400 animate-pulse mx-auto mb-2"
                          size={20}
                        />
                        <p className="pixel-font text-[8px] text-purple-400">
                          LOADING...
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Existing questions */}
                        {editGameQuestions.length > 0 && (
                          <div className="border-2 border-purple-700 pixel-box mb-3 max-h-64 overflow-y-auto hide-scroll divide-y-2 divide-purple-800">
                            {editGameQuestions.map((q, idx) => (
                              <div key={idx}>
                                {editingGameQIdx === idx ? (
                                  /* Inline editor for existing question */
                                  <div className="px-3 py-3 bg-purple-900/40 space-y-2">
                                    <div className="pixel-font text-[8px] text-cyan-400 mb-1 flex items-center justify-between">
                                      <span>✏️ Q#{idx + 1}</span>
                                      <span className="text-purple-500">
                                        {getChoicesCountForDifficulty(
                                          editDifficulty,
                                        )}{" "}
                                        CHOICES
                                      </span>
                                    </div>
                                    <textarea
                                      value={editingGameQText}
                                      onChange={(e) =>
                                        setEditingGameQText(e.target.value)
                                      }
                                      rows={2}
                                      placeholder="EDIT QUESTION..."
                                      className="w-full px-2 py-2 bg-purple-900/50 border-2 border-purple-600 focus:border-cyan-400 text-white pixel-font text-[8px] pixel-box focus:outline-none resize-none"
                                    />
                                    <ChoiceGrid
                                      choices={editingGameQChoices}
                                      onUpdate={updateEditingGameQChoice}
                                      onMarkCorrect={markEditingGameQCorrect}
                                    />
                                    <p className="pixel-font text-[7px] text-purple-600">
                                      ↑ CLICK CHOICE TO MARK CORRECT
                                    </p>
                                    <div className="flex gap-1">
                                      <button
                                        onClick={saveEditGameQuestion}
                                        className="btn-press flex-1 py-1 bg-green-700 border-2 border-green-500 text-white pixel-font text-[8px] pixel-box hover:bg-green-600 flex items-center justify-center gap-1"
                                      >
                                        <Check size={8} /> SAVE
                                      </button>
                                      <button
                                        onClick={cancelEditGameQuestion}
                                        className="btn-press flex-1 py-1 bg-red-800 border-2 border-red-600 text-red-300 pixel-font text-[8px] pixel-box hover:bg-red-700 flex items-center justify-center gap-1"
                                      >
                                        <X size={8} /> CANCEL
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div
                                    className="px-3 py-2 flex items-start gap-2 bg-purple-950/50 group hover:bg-purple-950/70 transition-colors cursor-pointer"
                                    onClick={() => startEditGameQuestion(idx)}
                                  >
                                    <span className="pixel-font text-[8px] text-purple-500 shrink-0 mt-1">
                                      #{idx + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <div className="pixel-font text-[9px] text-cyan-300 truncate">
                                        {q.text}
                                      </div>
                                      <div className="flex gap-2 mt-1 flex-wrap">
                                        {q.choices.map((c, i) => (
                                          <span
                                            key={i}
                                            className={`pixel-font text-[7px] ${c.isCorrect ? "text-green-400" : "text-purple-500"}`}
                                          >
                                            {String.fromCharCode(65 + i)}
                                            {c.isCorrect ? "✓" : ""}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          startEditGameQuestion(idx);
                                        }}
                                        className="w-5 h-5 bg-yellow-900/50 border border-yellow-700 pixel-box text-yellow-400 flex items-center justify-center hover:bg-yellow-800"
                                      >
                                        <Pencil size={8} />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditGameQuestions((prev) =>
                                            prev.filter((_, i) => i !== idx),
                                          );
                                        }}
                                        className="w-5 h-5 bg-red-900/50 border border-red-700 pixel-box text-red-400 pixel-font text-[10px] flex items-center justify-center hover:bg-red-800"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add new question */}
                        <div className="space-y-2 border-2 border-dashed border-purple-700 pixel-box p-3">
                          <div className="pixel-font text-[8px] text-purple-400 mb-2">
                            + NEW QUESTION
                          </div>
                          <textarea
                            value={editGameQText}
                            onChange={(e) => setEditGameQText(e.target.value)}
                            placeholder="TYPE QUESTION..."
                            rows={2}
                            className="w-full px-3 py-2 bg-purple-900/50 border-2 border-purple-600 focus:border-cyan-400 text-white pixel-font text-[9px] pixel-box focus:outline-none resize-none"
                          />
                          <div className="pixel-font text-[7px] text-cyan-400 mb-1 flex items-center gap-1">
                            <Lock size={8} />{" "}
                            {getChoicesCountForDifficulty(editDifficulty)}{" "}
                            CHOICES · {editDifficulty.toUpperCase()}
                          </div>
                          <ChoiceGrid
                            choices={editGameChoiceInputs}
                            onUpdate={updateEditGameChoiceInput}
                            onMarkCorrect={markEditGameCorrect}
                          />
                          <p className="pixel-font text-[7px] text-purple-600">
                            ↑ CLICK TO MARK CORRECT
                          </p>
                          <button
                            onClick={addEditGameQuestion}
                            className="btn-press w-full py-2 bg-purple-700 border-2 border-purple-500 text-purple-200 pixel-font text-[8px] pixel-box hover:bg-purple-600 transition-colors"
                          >
                            + ADD QUESTION
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Save / Cancel */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(game.id)}
                      className="btn-press flex-1 py-2 bg-green-700 border-2 border-green-500 text-white pixel-font text-[9px] pixel-box hover:bg-green-600 flex items-center justify-center gap-1"
                    >
                      <Check size={10} /> SAVE
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="btn-press flex-1 py-2 bg-purple-800 border-2 border-purple-600 text-purple-300 pixel-font text-[9px] pixel-box hover:bg-purple-700 flex items-center justify-center gap-1"
                    >
                      <X size={10} /> CANCEL
                    </button>
                  </div>
                </div>
              ) : (
                /* ──────────────────── GAME CARD ──────────────────── */
                <>
                  <div
                    className="flex items-center gap-2 px-4 py-1 border-b-2 border-purple-800/60"
                    style={{ background: "rgba(88,28,135,0.3)" }}
                  >
                    {game.is_multiplayer ? (
                      <Users size={10} className="text-cyan-400" />
                    ) : (
                      <Gamepad2 size={10} className="text-purple-400" />
                    )}
                    <span className="pixel-font text-[8px] text-purple-500">
                      {game.is_multiplayer ? "MULTIPLAYER" : "SOLO"}
                    </span>
                    <span className="ml-auto flex items-center gap-1">
                      {game.is_public ? (
                        <>
                          <Globe size={8} className="text-green-500" />
                          <span className="pixel-font text-[8px] text-green-500">
                            PUBLIC
                          </span>
                        </>
                      ) : (
                        <>
                          <Lock size={8} className="text-purple-500" />
                          <span className="pixel-font text-[8px] text-purple-500">
                            PRIVATE
                          </span>
                        </>
                      )}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="pixel-font text-sm sm:text-base text-purple-200 leading-tight">
                          {game.title.toUpperCase()}
                        </h3>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="flex items-center gap-1 pixel-font text-[8px] text-purple-500">
                            <Clock size={8} /> {formatDate(game.created_at)}
                          </span>
                          {
                            (
                              {
                                easy: (
                                  <span
                                    className="flex items-center gap-1 pixel-font text-[8px]"
                                    style={{ color: "#22c55e" }}
                                  >
                                    🟢 EASY
                                  </span>
                                ),
                                normal: (
                                  <span
                                    className="flex items-center gap-1 pixel-font text-[8px]"
                                    style={{ color: "#eab308" }}
                                  >
                                    🟡 NORMAL
                                  </span>
                                ),
                                hard: (
                                  <span
                                    className="flex items-center gap-1 pixel-font text-[8px]"
                                    style={{ color: "#ef4444" }}
                                  >
                                    🔴 HARD
                                  </span>
                                ),
                              } as any
                            )[(game.difficulty as string) || "easy"]
                          }
                          {game.is_multiplayer && (
                            <span className="flex items-center gap-1 pixel-font text-[8px] text-purple-500">
                              <Users size={8} /> {game.max_players}P
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {game.is_multiplayer ? (
                        <button
                          onClick={() => handlePlayMultiplayer(game.id)}
                          className="btn-press col-span-2 sm:col-span-1 px-3 py-3 bg-cyan-600 border-2 border-cyan-400 text-white pixel-font text-[9px] pixel-box hover:bg-cyan-500 transition-colors flex items-center justify-center gap-2"
                          style={{ boxShadow: "3px 3px 0 rgba(6,182,212,0.4)" }}
                        >
                          <Play size={12} /> START
                        </button>
                      ) : (
                        <Link
                          to={`/game/${game.id}`}
                          className="btn-press col-span-2 sm:col-span-1 px-3 py-3 bg-green-700 border-2 border-green-500 text-white pixel-font text-[9px] pixel-box hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                          style={{ boxShadow: "3px 3px 0 rgba(22,163,74,0.4)" }}
                        >
                          <Play size={12} /> PLAY
                        </Link>
                      )}
                      <button
                        onClick={() => startEdit(game)}
                        className="btn-press px-3 py-3 bg-yellow-700/80 border-2 border-yellow-600 text-yellow-200 pixel-font text-[9px] pixel-box hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Pencil size={12} /> EDIT
                      </button>
                      <button
                        onClick={() => handleShare(game.id, game.title)}
                        className="btn-press px-3 py-3 bg-blue-700/80 border-2 border-blue-600 text-blue-200 pixel-font text-[9px] pixel-box hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Share2 size={12} /> SHARE
                      </button>
                      <button
                        onClick={() => handleDelete(game.id)}
                        className="btn-press px-3 py-3 bg-red-900/60 border-2 border-red-800 text-red-400 pixel-font text-[9px] pixel-box hover:bg-red-900 transition-colors flex items-center justify-center gap-2"
                      >
                        <X size={12} /> DELETE
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── STATS MODAL ────────────────────────────────────────────────────── */}
      {showStatsModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div
            className="pixel-box border-4 border-yellow-500 bg-purple-950 w-full max-w-2xl overflow-hidden my-4"
            style={{ boxShadow: "8px 8px 0 rgba(234,179,8,0.5)" }}
          >
            <div className="bg-yellow-700 px-4 py-3 flex items-center gap-2">
              <Trophy size={14} className="text-white" />
              <span className="pixel-font text-white text-xs">
                PLAYER STATS
              </span>
              <button
                onClick={() => setShowStatsModal(false)}
                className="ml-auto text-white hover:text-gray-200"
              >
                <X size={16} />
              </button>
            </div>
            {statsLoading ? (
              <div className="p-6 text-center">
                <Trophy
                  className="text-yellow-400 animate-pulse mx-auto mb-4"
                  size={32}
                />
                <p className="pixel-font text-yellow-400 text-[8px]">
                  LOADING...
                </p>
              </div>
            ) : (
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { label: "GAMES", val: stats.total_games, color: "cyan" },
                    {
                      label: "ACCURACY",
                      val: `${stats.accuracy}%`,
                      color: "green",
                    },
                    {
                      label: "CORRECT",
                      val: `${stats.total_correct}/${stats.total_answered}`,
                      color: "yellow",
                    },
                    {
                      label: "HIGH SCORE",
                      val: stats.highest_score,
                      color: "purple",
                    },
                    {
                      label: "STREAK",
                      val: stats.current_streak,
                      color: "red",
                    },
                    {
                      label: "ANSWERED",
                      val: stats.total_answered,
                      color: "blue",
                    },
                  ].map(({ label, val, color }) => (
                    <div
                      key={label}
                      className={`pixel-box border-2 border-${color}-500 bg-purple-900/50 p-3 text-center`}
                    >
                      <div
                        className={`pixel-font text-[7px] text-${color}-400 mb-1`}
                      >
                        {label}
                      </div>
                      <div
                        className={`pixel-font text-2xl text-${color}-300 font-bold`}
                      >
                        {val}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pixel-box border-2 border-red-600 bg-red-950/30 p-3">
                  <div className="pixel-font text-[8px] text-red-400 mb-3 flex items-center gap-1">
                    <XCircle size={10} /> WRONG ANSWERS
                  </div>
                  <div className="flex gap-1 mb-3 flex-wrap">
                    {(["all", "easy", "normal", "hard"] as const).map(
                      (diff) => (
                        <button
                          key={diff}
                          onClick={() => setFilterDifficulty(diff)}
                          className={`btn-press pixel-box border-2 px-2 py-1 pixel-font text-[8px] transition-colors ${
                            filterDifficulty === diff
                              ? diff === "easy"
                                ? "bg-green-700 border-green-500 text-green-200"
                                : diff === "normal"
                                  ? "bg-yellow-700 border-yellow-500 text-yellow-200"
                                  : diff === "hard"
                                    ? "bg-red-700 border-red-500 text-red-200"
                                    : "bg-purple-700 border-purple-500 text-purple-200"
                              : "bg-purple-900/30 border-purple-700 text-purple-400 hover:border-purple-500"
                          }`}
                        >
                          {diff.toUpperCase()}
                        </button>
                      ),
                    )}
                  </div>
                  {filteredWrongAnswers.length === 0 ? (
                    <div className="text-center py-4">
                      <CheckCircle
                        size={20}
                        className="text-green-500 mx-auto mb-2"
                      />
                      <p className="pixel-font text-[8px] text-green-400">
                        NO WRONG ANSWERS! 🎉
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredWrongAnswers.map((ans, idx) => (
                        <div
                          key={ans.id}
                          className="pixel-box border-2 border-red-800 bg-red-950/30 p-2"
                        >
                          <div className="pixel-font text-[7px] text-red-400 mb-1">
                            #{idx + 1} - {ans.game_title}
                          </div>
                          <div className="pixel-font text-[8px] text-cyan-300 mb-2">
                            {ans.question_text}
                          </div>
                          <div className="space-y-1">
                            <div className="flex gap-2 text-[7px]">
                              <span className="text-red-400">❌ You:</span>
                              <span className="text-white bg-red-900/50 px-1 py-0.5 pixel-box border border-red-700">
                                {ans.wrong_choice}
                              </span>
                            </div>
                            <div className="flex gap-2 text-[7px]">
                              <span className="text-green-400">✅ Right:</span>
                              <span className="text-white bg-green-900/50 px-1 py-0.5 pixel-box border border-green-700">
                                {ans.correct_choice}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowStatsModal(false)}
                  className="btn-press w-full py-2 bg-purple-800 border-2 border-purple-600 text-purple-300 pixel-font text-[9px] pixel-box hover:bg-purple-700"
                >
                  <X size={12} className="inline mr-2" /> CLOSE
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SHARE MODAL ────────────────────────────────────────────────────── */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div
            className="pixel-box border-4 border-cyan-500 bg-purple-950 max-w-md w-full overflow-hidden"
            style={{ boxShadow: "8px 8px 0 rgba(6,182,212,0.5)" }}
          >
            <div className="bg-cyan-600 px-4 py-3 flex items-center gap-2">
              <Share2 size={14} className="text-white" />
              <span className="pixel-font text-white text-xs">SHARE CODE</span>
              <button
                onClick={() => setShowShareModal(false)}
                className="ml-auto text-white hover:text-gray-200"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="pixel-font text-[8px] text-cyan-400 text-center">
                SHARE WITH FRIENDS
              </p>
              <div>
                <label className="pixel-font text-[9px] text-cyan-400 block mb-3">
                  🎮 CODE:
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 px-4 py-3 bg-purple-900/50 border-2 border-purple-600 text-white pixel-font text-lg pixel-box font-bold tracking-widest">
                    {shareCode}
                  </div>
                  <button
                    onClick={copyCodeToClipboard}
                    className="btn-press px-4 py-3 bg-cyan-600 border-2 border-cyan-400 text-white pixel-font text-[9px] pixel-box hover:bg-cyan-500 transition-colors flex items-center justify-center"
                  >
                    <Check size={14} />
                  </button>
                </div>
              </div>
              <p className="pixel-font text-[8px] text-cyan-400 text-center">
                ✅ COPIED!
              </p>
              <button
                onClick={() => setShowShareModal(false)}
                className="btn-press w-full py-3 bg-purple-800 border-2 border-purple-600 text-purple-300 pixel-font text-[9px] pixel-box hover:bg-purple-700 flex items-center justify-center gap-2"
              >
                <X size={12} /> CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── JOIN MODAL ─────────────────────────────────────────────────────── */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div
            className="pixel-box border-4 border-purple-500 bg-purple-950 max-w-md w-full overflow-hidden"
            style={{ boxShadow: "8px 8px 0 rgba(139,92,246,0.5)" }}
          >
            <div className="bg-purple-700 px-4 py-3 flex items-center gap-2">
              <Users size={14} className="text-white" />
              <span className="pixel-font text-white text-xs">JOIN GAME</span>
              <button
                onClick={() => setShowJoinModal(false)}
                className="ml-auto text-white hover:text-gray-200"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="pixel-font text-[8px] text-purple-400 text-center">
                ENTER GAME CODE
              </p>
              <div>
                <label className="pixel-font text-[9px] text-purple-400 block mb-3">
                  📥 CODE:
                </label>
                <input
                  type="text"
                  value={joinInput}
                  onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") joinGameWithCode();
                  }}
                  placeholder="PASTE CODE..."
                  maxLength={10}
                  className="w-full px-4 py-3 bg-purple-900/50 border-2 border-purple-600 focus:border-green-400 text-white pixel-font text-sm pixel-box focus:outline-none transition-colors text-center font-bold tracking-widest"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={joinGameWithCode}
                  disabled={!joinInput.trim()}
                  className="btn-press flex-1 py-3 bg-green-700 border-2 border-green-500 text-white pixel-font text-[9px] pixel-box hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Play size={12} /> JOIN
                </button>
                <button
                  onClick={() => {
                    setShowJoinModal(false);
                    setJoinInput("");
                  }}
                  className="btn-press flex-1 py-3 bg-red-800 border-2 border-red-600 text-red-300 pixel-font text-[9px] pixel-box hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <X size={12} /> CANCEL
                </button>
              </div>
              <p className="pixel-font text-[7px] text-purple-600 text-center border-t-2 border-purple-700 pt-3">
                💡 GET CODE FROM YOUR FRIEND
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
