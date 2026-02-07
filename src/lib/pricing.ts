export function calcVariance(opts: {
  venueDefined: boolean;
  isOutdoor: boolean;
  montage: string;
  ledM2: number;
}) {
  const base = 0.15;
  const wide = 0.20;

  const widen =
    !opts.venueDefined ||
    opts.isOutdoor ||
    opts.montage === "Por definir" ||
    opts.ledM2 >= 16;

  return widen ? wide : base;
}

export function money(n: number) {
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}
