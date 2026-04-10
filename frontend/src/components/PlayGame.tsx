import { useState } from "react";

type Choice = { text: string; correct: boolean };
type Question = { text: string; choices: Choice[] };
type Game = { title: string; questions: Question[] };

export function PlayGame({
  game,
  onClose,
}: {
  game: Game;
  onClose: () => void;
}) {
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  function handleChoice(chooseIdx: number) {
    const question = game.questions[qIndex];
    if (question.choices[chooseIdx].correct) setScore((s) => s + 1);
    if (qIndex === game.questions.length - 1) setDone(true);
    else setQIndex((i) => i + 1);
  }

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-gray-900 p-6 rounded shadow-lg w-[90vw] max-w-xl">
        <h2 className="text-xl mb-4">Play Quiz: {game.title}</h2>
        {!done ? (
          <>
            <div className="mb-4">
              <p className="text-gray-100 mb-2 font-bold">
                Question {qIndex + 1} of {game.questions.length}
              </p>
              <p className="font-semibold mb-3">
                {game.questions[qIndex].text}
              </p>
              <div className="flex flex-col gap-2">
                {game.questions[qIndex].choices.map((c, i) => (
                  <button
                    key={i}
                    className="px-3 py-2 rounded bg-gray-700 hover:bg-blue-600 text-white"
                    onClick={() => handleChoice(i)}
                  >
                    {c.text}
                  </button>
                ))}
              </div>
            </div>
            <button
              className="px-3 py-1 bg-gray-500 text-white rounded mt-4"
              onClick={onClose}
            >
              Cancel
            </button>
          </>
        ) : (
          <div>
            <p className="font-bold text-lg text-green-400">
              Your score: {score} / {game.questions.length}
            </p>
            <button
              className="px-3 py-1 bg-gray-500 text-white rounded mt-4"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
