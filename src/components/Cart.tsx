import { money } from "@/lib/pricing";

export type CartLine = {
  item_key: string;
  category: string;
  label: string;
  emoji: string;
  unit: string;
  qty: number;
  unit_price: number;
};

export default function Cart({
  lines,
  onInc,
  onDec,
  totalsByCategory,
  subtotal
}: {
  lines: CartLine[];
  onInc: (k: string) => void;
  onDec: (k: string) => void;
  totalsByCategory: Record<string, number>;
  subtotal: number;
}) {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Tu paquete</div>
        <div className="text-sm text-zinc-600">{money(subtotal)}</div>
      </div>

      <div className="mt-3 space-y-3">
        {lines.length === 0 && (
          <div className="text-sm text-zinc-600">
            Agrega ítems con los botones de la izquierda.
          </div>
        )}

        {lines.map(l => (
          <div
            key={l.item_key}
            className="flex items-center gap-3 border border-zinc-100 rounded-xl p-3"
          >
            <div className="text-2xl">{l.emoji}</div>
            <div className="flex-1">
              <div className="text-sm font-medium">{l.label}</div>
              <div className="text-xs text-zinc-600">{l.category}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onDec(l.item_key)}
                className="h-8 w-8 rounded-lg border border-zinc-200"
                title="Quitar"
              >
                −
              </button>
              <div className="w-8 text-center text-sm">{l.qty}</div>
              <button
                onClick={() => onInc(l.item_key)}
                className="h-8 w-8 rounded-lg border border-zinc-200"
                title="Agregar"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-zinc-200 pt-3">
        <div className="text-xs font-semibold text-zinc-700 mb-2">
          Subtotales por categoría
        </div>
        <div className="space-y-1">
          {Object.entries(totalsByCategory).map(([cat, val]) => (
            <div key={cat} className="flex justify-between text-sm">
              <span className="text-zinc-700">{cat}</span>
              <span className="text-zinc-900">{money(val)}</span>
            </div>
          ))}
          {Object.keys(totalsByCategory).length === 0 && (
            <div className="text-sm text-zinc-600">Aún no hay subtotales.</div>
          )}
        </div>
      </div>
    </div>
  );
}
