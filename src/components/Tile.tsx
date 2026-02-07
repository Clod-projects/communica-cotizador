import type { CatalogItem } from "@/data/defaults";

export default function Tile({
  item,
  onAdd
}: {
  item: CatalogItem;
  onAdd: () => void;
}) {
  return (
    <button
      onClick={onAdd}
      className="group w-full text-left bg-white border border-zinc-200 rounded-2xl p-4 hover:border-zinc-400 hover:shadow-sm transition"
    >
      <div className="flex items-start gap-3">
        <div className="text-3xl">{item.emoji}</div>
        <div className="flex-1">
          <div className="font-semibold">{item.label}</div>
          <div className="text-xs text-zinc-600 mt-1">
            {item.category} · {item.unit}
          </div>
        </div>
        <div className="text-xs text-zinc-500 group-hover:text-zinc-900">+ Agregar</div>
      </div>
    </button>
  );
}
