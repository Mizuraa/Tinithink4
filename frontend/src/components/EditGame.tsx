import { useState } from "react";

// Types
type Choice = { text: string; correct: boolean };
type Question = { text: string; choices: Choice[] };
type Game = {
  id: string;
  title: string;
  creatorId: string;
  questions: Question[];
};

export function EditGame({
  game,
  onClose,
  onSaved,
}: {
  game: Game;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(game.title);
  const [questions, setQuestions] = useState<Question[]>(
    game.questions.map((q) => ({
      ...q,
      choices: q.choices.map((c) => ({ ...c, correct: !!c.correct })),
    }))
  );

  // isa lang dapat ichek
  function markCorrect(qIdx: number, cIdx: number) {
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qIdx
          ? {
              ...q,
              choices: q.choices.map((c, j) => ({
                ...c,
                correct: j === cIdx,
              })),
            }
          : q
      )
    );
  }

  // Updit question text
  function updateQuestionText(qIdx: number, value: string) {
    setQuestions((qs) =>
      qs.map((q, i) => (i === qIdx ? { ...q, text: value } : q))
    );
  }

  // Updit choice text
  function updateChoiceText(qIdx: number, cIdx: number, value: string) {
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qIdx
          ? {
              ...q,
              choices: q.choices.map((c, j) =>
                j === cIdx ? { ...c, text: value } : c
              ),
            }
          : q
      )
    );
  }

  // Siv etits to backend
  async function saveEdits() {
    const payload = {
      id: game.id,
      title,
      creatorId: game.creatorId,
      questions: questions.map((q) => ({
        text: q.text,
        timeLimit: 20,
        choices: q.choices.map((c) => ({
          text: c.text,
          correct: !!c.correct,
        })),
      })),
    };
    try {
      const res = await fetch("http://localhost:8080/game/create", {
        method: "POST", // Should be PUT in a real update API!
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.text();
        alert("Failed to save edits:\n" + err);
        return;
      }
      alert("Quiz updated!");
      onSaved();
    } catch (e) {
      alert("Error saving quiz changes: " + String(e));
    }
  }

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-40 z-50 flex justify-center items-center">
      <div className="bg-gray-900 p-6 rounded shadow-lg w-[90vw] max-w-xl">
        <h2 className="text-xl mb-4">Edit Quiz: {title}</h2>
        <input
          className="w-full mb-3 px-3 py-2 rounded bg-gray-800 text-white"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="mb-2">
          {questions.map((q, qIdx) => (
            <div key={qIdx} className="mb-3">
              <input
                className="w-full mb-1 px-3 py-2 rounded bg-gray-800 text-white"
                value={q.text}
                onChange={(e) => updateQuestionText(qIdx, e.target.value)}
              />
              {q.choices.map((c, cIdx) => (
                <div key={cIdx} className="flex items-center mb-1 gap-2">
                  <input
                    className="flex-1 px-3 py-2 rounded bg-gray-800 text-white"
                    value={c.text}
                    onChange={(e) =>
                      updateChoiceText(qIdx, cIdx, e.target.value)
                    }
                  />
                  <input
                    type="radio"
                    name={`correct-edit-q${qIdx}`}
                    checked={c.correct}
                    onChange={() => markCorrect(qIdx, cIdx)}
                  />
                  <span className="text-gray-300 text-xs">Correct</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <button
          className="px-3 py-1 bg-green-600 text-white rounded mr-2"
          onClick={saveEdits}
        >
          Save Changes
        </button>
        <button
          className="px-3 py-1 bg-gray-500 text-white rounded"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
