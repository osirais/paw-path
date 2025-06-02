export default function PauseMenu({ onResume }: { onResume: () => void }) {
  return (
    <div className="bg-opacity-70 fixed inset-0 z-10 flex items-center justify-center bg-black/50 text-white">
      <button
        onClick={onResume}
        className="cursor-pointer rounded border-2 border-white bg-gray-800 px-8 py-4 text-2xl"
      >
        Resume
      </button>
    </div>
  );
}
