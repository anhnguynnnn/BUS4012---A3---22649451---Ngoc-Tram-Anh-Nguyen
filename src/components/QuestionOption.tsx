type QuestionOptionProps = {
  label: string;
  selected: boolean;
  onClick: () => void;
};

export default function QuestionOption({ label, selected, onClick }: QuestionOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-5 py-3 text-sm font-medium transition ${
        selected ? "border-black bg-black text-white" : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
      }`}
    >
      {label}
    </button>
  );
}