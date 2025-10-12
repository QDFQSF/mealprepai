export default function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="text-center opacity-70 border rounded-xl p-10">
      <div className="text-lg">{title}</div>
      {hint && <div className="text-sm mt-2">{hint}</div>}
    </div>
  );
}
