export default function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: "Datos" },
    { n: 2, label: "Arma tu paquete" },
    { n: 3, label: "Enviar" }
  ] as const;

  return (
    <div className="flex gap-3 items-center">
      {steps.map(s => (
        <div key={s.n} className="flex items-center gap-2">
          <div
            className={`h-8 w-8 rounded-full grid place-items-center text-sm font-bold
            ${step === s.n ? "bg-zinc-900 text-white" : "bg-white border border-zinc-200 text-zinc-700"}`}
          >
            {s.n}
          </div>
          <div className={`text-sm ${step === s.n ? "font-semibold" : "text-zinc-600"}`}>
            {s.label}
          </div>
          {s.n !== 3 && <div className="w-8 h-px bg-zinc-200" />}
        </div>
      ))}
    </div>
  );
}
