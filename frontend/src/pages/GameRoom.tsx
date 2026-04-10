import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase, getCurrentUser, createGameSession } from "../lib/supabase";
import { Users, Trophy, ArrowLeft, Heart } from "lucide-react";

// ============================================================
// TYPES & STATE MANAGEMENT
// ============================================================

type DbChoice = {
  id: string;
  question_id: string;
  text: string;
  is_correct: boolean;
};

type QuestionWithChoices = { id: string; text: string; choices: DbChoice[] };

type PlayerScore = {
  id: string;
  user_id: string;
  username: string;
  score: number;
  lives: number;
  streak: number;
  total_correct: number;
  is_finished: boolean;
};

type Difficulty = "easy" | "normal" | "hard";
type GamePhase = "avatar" | "shop" | "playing" | "finished";

// ============================================================
// CONSTANTS
// ============================================================

const DIFFICULTY_SETTINGS: Record<
  Difficulty,
  { timeSeconds: number; pointsPerQ: number; numChoices: number }
> = {
  easy: { timeSeconds: 15, pointsPerQ: 10, numChoices: 3 },
  normal: { timeSeconds: 12, pointsPerQ: 20, numChoices: 4 },
  hard: { timeSeconds: 8, pointsPerQ: 50, numChoices: 5 },
};

// ============================================================
// GAMEROOM COMPONENT
// ============================================================

export default function GameRoom() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionIdFromUrl = searchParams.get("session");

  // ─── CORE STATE ─────────────────────────────────────────
  const [gamePhase, setGamePhase] = useState<GamePhase>("avatar");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionCode, setSessionCode] = useState<string>("");

  // ─── GAME DATA ───────────────────────────────────────────
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [questions, setQuestions] = useState<QuestionWithChoices[]>([]);
  const [currentQuestion, setCurrentQuestion] =
    useState<QuestionWithChoices | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // ─── PLAYER STATE ───────────────────────────────────────
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [streak, setStreak] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);

  // ─── MULTIPLAYER STATE ──────────────────────────────────
  const [players, setPlayers] = useState<PlayerScore[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // ─── UI STATE ───────────────────────────────────────────
  const [answered, setAnswered] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [showCorrect, setShowCorrect] = useState(false);
  const [showWrong, setShowWrong] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // ─── REFS FOR TIMERS ────────────────────────────────────
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionStartTimeRef = useRef<number>(0);

  // ============================================================
  // INITIALIZATION
  // ============================================================

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);

        // 1. Get current user
        const user = await getCurrentUser();
        if (!user) {
          navigate("/login");
          return;
        }
        setCurrentUser(user);

        // 2. Load game data
        if (!gameId) {
          throw new Error("Game ID required");
        }

        const { data: gameData, error: gameError } = await supabase
          .from("games")
          .select("*")
          .eq("id", gameId)
          .single();

        if (gameError || !gameData) throw gameError;

        const { data: questionsData, error: questionsError } = await supabase
          .from("questions")
          .select("id, text, ordering")
          .eq("game_id", gameId)
          .order("ordering", { ascending: true });

        if (questionsError) throw questionsError;

        // 4. Load choices for each question
        const questionsWithChoices = await Promise.all(
          questionsData.map(async (q) => {
            const { data: choicesData, error: choicesError } = await supabase
              .from("choices")
              .select("id, question_id, text, is_correct")
              .eq("question_id", q.id);

            if (choicesError) throw choicesError;
            return { id: q.id, text: q.text, choices: choicesData || [] };
          }),
        );

        setQuestions(questionsWithChoices);
        setDifficulty((gameData.difficulty as Difficulty) || "easy");
        setIsMultiplayer(gameData.is_multiplayer);

        // 5. Setup multiplayer session
        if (sessionIdFromUrl) {
          // Player joining existing session
          await joinExistingSession(sessionIdFromUrl, user.id);
        } else {
          // Create new session
          const session = await createGameSession(
            gameId,
            user.id,
            gameData.is_multiplayer,
            gameData.max_players || 1,
          );
          setSessionId(session.id);
          setSessionCode(session.session_code || "");
          setupRealtimeSubscription(session.id);
        }

        setLoading(false);
      } catch (error) {
        console.error("❌ GameRoom init error:", error);
        alert("Failed to load game");
        navigate("/");
      }
    };

    init();

    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [gameId, sessionIdFromUrl, navigate]);

  // ============================================================
  // SESSION & REAL-TIME SYNC (SUPABASE V2)
  // ============================================================

  const joinExistingSession = async (sessionId: string, userId: string) => {
    try {
      // Verify session exists
      const { data: sessionData, error: sessionError } = await supabase
        .from("game_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (sessionError || !sessionData) {
        throw new Error("Session not found");
      }

      // Create player score entry for this session
      const { error: scoreError } = await supabase
        .from("player_scores")
        .insert({
          session_id: sessionId,
          user_id: userId,
          score: 0,
          lives: 3,
          streak: 0,
          total_correct: 0,
          total_answered: 0,
        });

      if (scoreError && !scoreError.message.includes("duplicate")) {
        throw scoreError;
      }

      // Update session player count
      const { data: allPlayers } = await supabase
        .from("player_scores")
        .select("user_id")
        .eq("session_id", sessionId);

      await supabase
        .from("game_sessions")
        .update({ current_players: allPlayers?.length || 1 })
        .eq("id", sessionId);

      setSessionId(sessionId);
      setSessionCode(sessionData.session_code || "");
      setupRealtimeSubscription(sessionId);
    } catch (error) {
      console.error("❌ Error joining session:", error);
      alert("Failed to join session");
      navigate("/");
    }
  };

  const setupRealtimeSubscription = (sessionId: string) => {
    if (!currentUser) return;

    // Subscribe to session updates (question index, status)
    const sessionChannel = supabase
      .channel(`game_session:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload: any) => {
          setCurrentQuestionIndex(payload.new?.current_question_index || 0);
          if (payload.new?.status === "finished") {
            setGamePhase("finished");
          }
        },
      )
      .subscribe();

    // Subscribe to player scores (all players' scores)
    const scoresChannel = supabase
      .channel(`player_scores:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "player_scores",
          filter: `session_id=eq.${sessionId}`,
        },
        async (payload: any) => {
          // Update my own score
          if (payload.new?.user_id === currentUser.id) {
            setScore(payload.new?.score || 0);
            setLives(payload.new?.lives || 0);
            setStreak(payload.new?.streak || 0);
            setTotalCorrect(payload.new?.total_correct || 0);
          }

          // Fetch all players for leaderboard
          const { data: allScores } = await supabase
            .from("player_scores")
            .select("id, user_id, score, lives, streak, total_correct")
            .eq("session_id", sessionId);

          if (allScores && allScores.length > 0) {
            // Get usernames
            const userIds = [...new Set(allScores.map((s) => s.user_id))];
            const { data: users } = await supabase
              .from("users")
              .select("id, username")
              .in("id", userIds);

            const userMap = Object.fromEntries(
              users?.map((u) => [u.id, u.username]) || [],
            );

            setPlayers(
              allScores.map((s) => ({
                id: s.id,
                user_id: s.user_id,
                username: userMap[s.user_id] || "Unknown",
                score: s.score,
                lives: s.lives,
                streak: s.streak,
                total_correct: s.total_correct,
                is_finished: false,
              })),
            );
          }
        },
      )
      .subscribe();

    unsubscribeRef.current = () => {
      sessionChannel.unsubscribe();
      scoresChannel.unsubscribe();
    };
  };

  // ============================================================
  // QUESTION FLOW
  // ============================================================

  useEffect(() => {
    if (questions.length === 0) return;

    if (currentQuestionIndex < questions.length) {
      setCurrentQuestion(questions[currentQuestionIndex]);
      setAnswered(false);
      setSelectedChoice(null);
      setShowCorrect(false);
      setShowWrong(false);
      questionStartTimeRef.current = Date.now();

      // Start countdown timer
      const difficultySettings = DIFFICULTY_SETTINGS[difficulty];
      setTimeRemaining(difficultySettings.timeSeconds);

      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleAutoAdvance();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Game finished
      finishGame();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQuestionIndex, questions, difficulty]);

  // ============================================================
  // ANSWER HANDLING
  // ============================================================

  const handleAnswer = async (choiceId: string) => {
    if (answered || !currentQuestion || !sessionId || !currentUser) return;

    const timeTaken = Math.round(
      (Date.now() - questionStartTimeRef.current) / 1000,
    );
    const selectedChoiceObj = currentQuestion.choices.find(
      (c) => c.id === choiceId,
    );

    if (!selectedChoiceObj) return;

    setSelectedChoice(choiceId);
    setAnswered(true);

    // Record answer in database
    try {
      await supabase.from("player_answers").insert({
        session_id: sessionId,
        user_id: currentUser.id,
        question_id: currentQuestion.id,
        choice_id: choiceId,
        time_taken_seconds: timeTaken,
      });
    } catch (error) {
      console.error("Error recording answer:", error);
    }

    if (selectedChoiceObj.is_correct) {
      // Correct answer
      setShowCorrect(true);

      const difficultySettings = DIFFICULTY_SETTINGS[difficulty];
      const basePoints = difficultySettings.pointsPerQ;
      const timeBonus = Math.max(
        0,
        (timeRemaining / difficultySettings.timeSeconds) * 10,
      );
      const pointsEarned = Math.round(basePoints + timeBonus);

      const newScore = score + pointsEarned;
      const newStreak = streak + 1;
      const newTotal = totalCorrect + 1;

      setScore(newScore);
      setStreak(newStreak);
      setTotalCorrect(newTotal);

      // Update database
      await supabase
        .from("player_scores")
        .update({
          score: newScore,
          streak: newStreak,
          total_correct: newTotal,
        })
        .eq("session_id", sessionId)
        .eq("user_id", currentUser.id);
    } else {
      // Wrong answer
      setShowWrong(true);

      const newLives = Math.max(0, lives - 1);
      setLives(newLives);
      setStreak(0);

      // Update database
      await supabase
        .from("player_scores")
        .update({
          lives: newLives,
          streak: 0,
        })
        .eq("session_id", sessionId)
        .eq("user_id", currentUser.id);

      if (newLives === 0) {
        setTimeout(() => {
          finishGame();
        }, 1500);
        return;
      }
    }

    // Auto-advance after 2 seconds
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeout(() => {
      advanceQuestion();
    }, 2000);
  };

  const handleAutoAdvance = () => {
    if (!answered && currentQuestion) {
      setShowWrong(true);
      setAnswered(true);

      const newLives = Math.max(0, lives - 1);
      setLives(newLives);
      setStreak(0);

      setTimeout(() => {
        advanceQuestion();
      }, 1500);
    }
  };

  const advanceQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);

      // Update in database for multiplayer sync
      if (sessionId && isMultiplayer) {
        supabase
          .from("game_sessions")
          .update({ current_question_index: currentQuestionIndex + 1 })
          .eq("id", sessionId)
          .match((err: Error) =>
            console.error("Error updating question index:", err),
          );
      }
    } else {
      finishGame();
    }
  };

  const finishGame = async () => {
    if (!sessionId || !currentUser) return;

    setGamePhase("finished");

    // Update player score as finished
    await supabase
      .from("player_scores")
      .update({ finished_at: new Date().toISOString() })
      .eq("session_id", sessionId)
      .eq("user_id", currentUser.id);

    // Check if all players finished (for multiplayer)
    if (isMultiplayer) {
      const { data: allScores } = await supabase
        .from("player_scores")
        .select("finished_at")
        .eq("session_id", sessionId);

      const allFinished = allScores?.every((s) => s.finished_at !== null);

      if (allFinished) {
        await supabase
          .from("game_sessions")
          .update({ status: "finished", ended_at: new Date().toISOString() })
          .eq("id", sessionId);
      }
    }
  };

  // ============================================================
  // RENDERING
  // ============================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400 mb-4">
            Loading...
          </div>
          <div className="text-gray-400">Preparing your game...</div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400">Game not found</div>
          <button
            onClick={() => navigate("/")}
            className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4 overflow-auto">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        {isMultiplayer && sessionCode && (
          <div className="text-center">
            <div className="text-sm text-gray-400">Join Code</div>
            <div className="text-lg font-bold text-cyan-400">{sessionCode}</div>
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-gray-400">Score</div>
            <div className="text-2xl font-bold text-yellow-400">{score}</div>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart
                key={i}
                size={24}
                className={
                  i < lives ? "fill-red-500 text-red-500" : "text-gray-600"
                }
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="max-w-4xl mx-auto">
        {gamePhase === "playing" && (
          <>
            {/* Question */}
            <div className="bg-gray-900 border-2 border-purple-600 rounded-lg p-8 mb-6">
              <div className="mb-4 text-sm text-gray-400">
                Question {currentQuestionIndex + 1} of {questions.length}
              </div>
              <h2 className="text-2xl font-bold text-white mb-6">
                {currentQuestion.text}
              </h2>

              {/* Choices */}
              <div className="grid gap-3">
                {currentQuestion.choices.map((choice, idx) => (
                  <button
                    key={choice.id}
                    onClick={() => handleAnswer(choice.id)}
                    disabled={answered}
                    className={`p-4 text-left rounded transition-all ${
                      selectedChoice === choice.id
                        ? choice.is_correct
                          ? "bg-green-600 border-2 border-green-400"
                          : "bg-red-600 border-2 border-red-400"
                        : showCorrect && choice.is_correct
                          ? "bg-green-600 border-2 border-green-400"
                          : showWrong &&
                              !choice.is_correct &&
                              selectedChoice === choice.id
                            ? "bg-red-600 border-2 border-red-400"
                            : "bg-gray-800 border-2 border-gray-600 hover:border-purple-500 disabled:opacity-50"
                    }`}
                  >
                    <span className="font-bold mr-3">
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    {choice.text}
                  </button>
                ))}
              </div>

              {/* Timer */}
              <div className="mt-6 text-center">
                <div
                  className={`text-4xl font-bold ${timeRemaining < 3 ? "text-red-500" : "text-cyan-400"}`}
                >
                  {timeRemaining}s
                </div>
              </div>
            </div>
          </>
        )}

        {gamePhase === "finished" && (
          <div className="bg-gray-900 border-2 border-purple-600 rounded-lg p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Game Over!</h2>
            <div className="text-5xl font-bold text-yellow-400 mb-6">
              {score}
            </div>
            <div className="text-gray-300 mb-6">
              <p>
                Correct: {totalCorrect} / {questions.length}
              </p>
              <p>Max Streak: {streak}</p>
            </div>
            {isMultiplayer && (
              <>
                <button
                  onClick={() => setShowLeaderboard(true)}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold text-white mb-4 flex items-center justify-center gap-2 mx-auto"
                >
                  <Trophy size={20} />
                  View Final Leaderboard
                </button>
              </>
            )}
            <button
              onClick={() => navigate("/")}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold text-white"
            >
              Back to Home
            </button>
          </div>
        )}

        {/* Multiplayer Leaderboard Modal */}
        {isMultiplayer && showLeaderboard && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-900 border-2 border-purple-600 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Users size={20} /> Live Scores
              </h3>
              <div className="max-h-96 overflow-y-auto mb-4">
                {players
                  .sort((a, b) => b.score - a.score)
                  .map((player, idx) => (
                    <div
                      key={player.user_id}
                      className="flex items-center justify-between p-3 border-b border-gray-700"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-yellow-400 font-bold">
                          {idx + 1}
                        </span>
                        <span className="text-white">{player.username}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-cyan-400 font-bold text-lg">
                          {player.score}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
              <button
                onClick={() => setShowLeaderboard(false)}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white font-bold"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function loadSavedAvatar() {
  try {
    const saved = localStorage.getItem("tini_avatar");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}
