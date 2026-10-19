export const TW = 64;
export const TH = 32;

/** Proyeksi isometrik: grid (x,y,z) -> koordinat layar. */
export const P = (x: number, y: number, z = 0): [number, number] => [((x - y) * TW) / 2, ((x + y) * TH) / 2 - z];

export function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16;
  let g = (n >> 8) & 255;
  let b = n & 255;
  const t = f < 0 ? 0 : 255;
  const k = Math.abs(f);
  r = Math.round(r + (t - r) * k);
  g = Math.round(g + (t - g) * k);
  b = Math.round(b + (t - b) * k);
  return `rgb(${r},${g},${b})`;
}

export const tone = (c: string) => ({ top: shade(c, 0.1), left: shade(c, -0.12), right: shade(c, -0.28) });
