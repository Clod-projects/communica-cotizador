"use client";

import { useEffect, useMemo, useState } from "react";
import Stepper from "@/components/Stepper";
import Tile from "@/components/Tile";
import Cart, { CartLine } from "@/components/Cart";
import { supabase } from "@/lib/supabaseClient";
import { calcVariance, money } from "@/lib/pricing";
import { fallbackCatalog, type CatalogItem } from "@/data/defaults";

type Step = 1 | 2 | 3;

export default function Page() {
  const [step, setStep] = useState<Step>(1);

  // Paso 1: datos
  const [city, setCity] = useState("CDMX");
  const [venueDefined, setVenueDefined] = useState(true);
  const [isOutdoor, setIsOutdoor] = useState(false);
  const [montage, setMontage] = useState<"Rigging" | "Estructura propia" | "Por definir">("Rigging");
  const [durationHours, setDurationHours] = useState(8);

  // Catálogo desde Supabase (con fallback)
  const [catalog, setCatalog] = useState<CatalogItem[]>(fallbackCatalog);

  // Carrito
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ledM2, setLedM2] = useState(10);

  // Paso 3: contacto
  const [customerName, setCustomerName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cargar catálogo desde Supabase
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("items")
        .select("item_key, category, label, emoji, unit, base_price")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (!error && data && data.length > 0) {
        setCatalog(data as any);
      }
    })();
  }, []);

  // Asegurar que LED_M2 exista en carrito como m²
  useEffect(() => {
    const led = catalog.find(i => i.item_key === "LED_M2");
    if (!led) return;

    setLines(prev => {
      const has = prev.find(l => l.item_key === "LED_M2");
      if (!has) {
        return [
          ...prev,
          {
            item_key: led.item_key,
            category: led.category,
            label: led.label,
            emoji: led.emoji,
            unit: led.unit,
            qty: ledM2,
            unit_price: Number(led.base_price || 0)
          }
        ];
      }
      return prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog]);

  // Mantener qty de LED igual al input ledM2
  useEffect(() => {
    setLines(prev =>
      prev.map(l => (l.item_key === "LED_M2" ? { ...l, qty: ledM2 } : l))
    );
  }, [ledM2]);

  function addItem(item: CatalogItem) {
    setLines(prev => {
      const existing = prev.find(l => l.item_key === item.item_key);
      if (existing) {
        return prev.map(l =>
          l.item_key === item.item_key ? { ...l, qty: l.qty + 1 } : l
        );
      }
      return [
        ...prev,
        {
          item_key: item.item_key,
          category: item.category,
          label: item.label,
          emoji: item.emoji,
          unit: item.unit,
          qty: item.item_key === "LED_M2" ? ledM2 : 1,
          unit_price: Number(item.base_price || 0)
        }
      ];
    });
  }

  function inc(k: string) {
    if (k === "LED_M2") return;
    setLines(prev => prev.map(l => (l.item_key === k ? { ...l, qty: l.qty + 1 } : l)));
  }

  function dec(k: string) {
    if (k === "LED_M2") return;
    setLines(prev =>
      prev
        .map(l => (l.item_key === k ? { ...l, qty: Math.max(0, l.qty - 1) } : l))
        .filter(l => l.item_key === "LED_M2" || l.qty > 0)
    );
  }

  const subtotal = useMemo(() => {
    return lines.reduce((acc, l) => acc + l.qty * l.unit_price, 0);
  }, [lines]);

  const totalsByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const l of lines) {
      const t = l.qty * l.unit_price;
      map[l.category] = (map[l.category] || 0) + t;
    }
    return map;
  }, [lines]);

  const variance = useMemo(() => {
    return calcVariance({
      venueDefined,
      isOutdoor,
      montage,
      ledM2
    });
  }, [venueDefined, isOutdoor, montage, ledM2]);

  const totalMin = subtotal * (1 - variance);
  const totalMax = subtotal * (1 + variance);

  async function submit() {
    setErrorMsg(null);
    setSaving(true);
    setSavedId(null);

    try {
      const { data: q, error: e1 } = await supabase
        .from("quotes")
        .insert({
          event_type: "Corporativo",
          pax_range: "151-400",
          city,
          venue_defined: venueDefined,
          is_outdoor: isOutdoor,
          led_m2: ledM2,
          montage,
          duration_hours: durationHours,
          customer_name: customerName,
          company,
          email,
          whatsapp,
          subtotal,
          variance,
          total_min: totalMin,
          total_max: totalMax
        })
        .select("id")
        .single();

      if (e1) throw e1;

      const quoteId = q.id as string;

      const payload = lines.map(l => ({
        quote_id: quoteId,
        category: l.category,
        item_key: l.item_key,
        label: l.label,
        emoji: l.emoji,
        unit: l.unit,
        qty: l.qty,
        unit_price: l.unit_price,
        line_total: l.qty * l.unit_price
      }));

      const { error: e2 } = await supabase.from("quote_items").insert(payload);
      if (e2) throw e2;

      setSavedId(quoteId);
    } catch (err: any) {
      setErrorMsg(err?.message || "Ocurrió un error al guardar la cotización.");
    } finally {
      setSaving(false);
    }
  }

  const canGoStep3 = lines.length > 0;

  return (
    <main className="max-w-6xl mx-auto p-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm text-zinc-600">COMMUNICA · CDMX (con viáticos fuera)</div>
          <h1 className="text-2xl font-bold">Cotizador visual</h1>
        </div>
        <Stepper step={step} />
      </header>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {step === 1 && (
            <div className="bg-white border border-zinc-200 rounded-2xl p-5">
              <h2 className="font-semibold text-lg">1) Datos del evento</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <label className="text-sm">
                  <div className="text-zinc-700 mb-1">Ciudad</div>
                  <input
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 p-3"
                    placeholder="CDMX / Guadalajara / Monterrey..."
                  />
                </label>

                <label className="text-sm">
                  <div className="text-zinc-700 mb-1">Duración (horas)</div>
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={durationHours}
                    onChange={e => setDurationHours(Number(e.target.value))}
                    className="w-full rounded-xl border border-zinc-200 p-3"
                  />
                </label>

                <label className="text-sm">
                  <div className="text-zinc-700 mb-1">Venue definido</div>
                  <select
                    value={venueDefined ? "SI" : "NO"}
                    onChange={e => setVenueDefined(e.target.value === "SI")}
                    className="w-full rounded-xl border border-zinc-200 p-3"
                  >
                    <option value="SI">Sí</option>
                    <option value="NO">No (por definir)</option>
                  </select>
                </label>

                <label className="text-sm">
                  <div className="text-zinc-700 mb-1">Exterior</div>
                  <select
                    value={isOutdoor ? "SI" : "NO"}
                    onChange={e => setIsOutdoor(e.target.value === "SI")}
                    className="w-full rounded-xl border border-zinc-200 p-3"
                  >
                    <option value="NO">No</option>
                    <option value="SI">Sí</option>
                  </select>
                </label>

                <label className="text-sm md:col-span-2">
                  <div className="text-zinc-700 mb-1">Montaje LED</div>
                  <select
                    value={montage}
                    onChange={e => setMontage(e.target.value as any)}
                    className="w-full rounded-xl border border-zinc-200 p-3"
                  >
                    <option value="Rigging">Rigging</option>
                    <option value="Estructura propia">Estructura propia</option>
                    <option value="Por definir">Por definir</option>
                  </select>
                </label>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <div className="text-sm text-zinc-600">
                  Rango estimado actual: <span className="font-semibold">{Math.round(variance * 100)}%</span>
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="rounded-xl bg-zinc-900 text-white px-4 py-3"
                >
                  Siguiente: Armar paquete
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="bg-white border border-zinc-200 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">2) Arma tu paquete</h2>
                <button onClick={() => setStep(1)} className="text-sm text-zinc-600 underline">
                  ← Volver
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2 bg-zinc-50 border border-zinc-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">📺 Pantalla LED</div>
                      <div className="text-xs text-zinc-600">Ajusta los m² (se actualiza en tu carrito)</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-zinc-700">m²</span>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={ledM2}
                        onChange={e => setLedM2(Math.max(0, Number(e.target.value)))}
                        className="w-24 rounded-xl border border-zinc-200 p-2 text-right"
                      />
                    </div>
                  </div>
                </div>

                {catalog
                  .filter(i => i.item_key !== "LED_M2")
                  .map(item => (
                    <Tile key={item.item_key} item={item} onAdd={() => addItem(item)} />
                  ))}
              </div>

              <div className="mt-5 flex items-center justify-between">
                <div className="text-sm text-zinc-600">
                  Total estimado: <span className="font-semibold">{money(totalMin)} – {money(totalMax)}</span>
                </div>
                <button
                  disabled={!canGoStep3}
                  onClick={() => setStep(3)}
                  className="rounded-xl bg-zinc-900 text-white px-4 py-3 disabled:opacity-50"
                >
                  Siguiente: Enviar
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bg-white border border-zinc-200 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">3) Enviar solicitud</h2>
                <button onClick={() => setStep(2)} className="text-sm text-zinc-600 underline">
                  ← Volver
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="text-sm">
                  <div className="text-zinc-700 mb-1">Nombre</div>
                  <input value={customerName} onChange={e => setCustomerName(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 p-3" />
                </label>

                <label className="text-sm">
                  <div className="text-zinc-700 mb-1">Empresa</div>
                  <input value={company} onChange={e => setCompany(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 p-3" />
                </label>

                <label className="text-sm">
                  <div className="text-zinc-700 mb-1">Email</div>
                  <input value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 p-3" />
                </label>

                <label className="text-sm">
                  <div className="text-zinc-700 mb-1">WhatsApp</div>
                  <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 p-3" placeholder="+52..." />
                </label>
              </div>

              <div className="mt-5 bg-zinc-50 border border-zinc-200 rounded-2xl p-4">
                <div className="text-sm text-zinc-700">
                  Total estimado ({Math.round(variance * 100)}%):{" "}
                  <span className="font-semibold">{money(totalMin)} – {money(totalMax)}</span>
                </div>
                <div className="text-xs text-zinc-600 mt-1">
                  Esto es un estimado. COMMUNICA confirmará detalles (venue, logística y montaje) para cerrar la cotización.
                </div>
              </div>

              {errorMsg && <div className="mt-4 text-sm text-red-600">{errorMsg}</div>}

              {savedId && (
                <div className="mt-4 text-sm text-emerald-700">
                  ✅ Solicitud guardada. Folio: <span className="font-mono">{savedId}</span>
                </div>
              )}

              <div className="mt-5 flex items-center justify-end">
                <button
                  onClick={submit}
                  disabled={saving}
                  className="rounded-xl bg-zinc-900 text-white px-5 py-3 disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Enviar solicitud"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="md:col-span-1">
          <Cart
            lines={lines}
            onInc={k => inc(k)}
            onDec={k => dec(k)}
            totalsByCategory={totalsByCategory}
            subtotal={subtotal}
          />
          <div className="mt-3 text-xs text-zinc-600">
            Rango actual: <span className="font-semibold">{Math.round(variance * 100)}%</span> ·
            Si el venue es “por definir”, exterior, montaje por definir o LED ≥ 16 m², el rango se amplía.
          </div>
        </div>
      </div>

      <footer className="mt-10 text-xs text-zinc-500">
        COMMUNICA · Cotizador MVP (Vercel + Supabase)
      </footer>
    </main>
  );
}
