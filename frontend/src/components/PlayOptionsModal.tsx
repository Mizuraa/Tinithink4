type Game = { title: string };

export function PlayOptionsModal({
  game,
  onSolo,
  onInvite,
  onCancel,
}: {
  game: Game;
  onSolo: () => void;
  onInvite: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-gray-900 p-6 rounded shadow-lg w-[90vw] max-w-xs flex flex-col gap-4 items-center">
        <h2 className="text-xl mb-4">Play Quiz: {game.title}</h2>
        <button
          className="px-3 py-1 bg-blue-600 text-white rounded w-full font-bold"
          onClick={onSolo}
        >
          Solo
        </button>
        <button
          className="px-3 py-1 bg-pink-600 text-white rounded w-full font-bold"
          onClick={() => {
            alert("Invite link copied!");
            onInvite();
          }}
        >
          Invite Friends
        </button>
        <button
          className="px-3 py-1 bg-gray-500 text-white rounded w-full"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
