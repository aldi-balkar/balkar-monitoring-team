import { P, shade, tone } from "@/lib/iso";

export const pt = (x: number, y: number, z = 0) => {
  const [a, b] = P(x, y, z);
  return `${a.toFixed(1)},${b.toFixed(1)}`;
};
export const poly = (...p: [number, number, number][]) => p.map(([x, y, z]) => pt(x, y, z)).join(" ");

type BoxProps = { x: number; y: number; w: number; d: number; h: number; z?: number; color: string };

export function Box({ x, y, w, d, h, z = 0, color }: BoxProps) {
  const c = tone(color);
  return (
    <g strokeWidth={0.6} strokeLinejoin="round">
      {z === 0 && h >= 18 && (
        <polygon points={poly([x, y, 0], [x + w + h * 0.014, y, 0], [x + w + h * 0.014, y + d + h * 0.014, 0], [x, y + d + h * 0.014, 0])} fill="#000" opacity={0.14} stroke="none" />
      )}
      <polygon points={poly([x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h])} fill={c.left} stroke={c.left} />
      <polygon points={poly([x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h])} fill={c.right} stroke={c.right} />
      <polygon points={poly([x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h])} fill={c.top} stroke={c.top} />
    </g>
  );
}

export function Flat({ x, y, w, d, z = 0.2, fill, opacity = 1 }: { x: number; y: number; w: number; d: number; z?: number; fill: string; opacity?: number }) {
  return <polygon points={poly([x, y, z], [x + w, y, z], [x + w, y + d, z], [x, y + d, z])} fill={fill} opacity={opacity} />;
}

/** Balok dengan siku (sudut) melengkung di bidang lantai. */
export function RoundedBox({ x, y, w, d, h, r, z = 0, color }: BoxProps & { r: number }) {
  const pts: [number, number][] = [];
  const N = 7;
  const arc = (cx: number, cy: number, a0: number, a1: number) => {
    for (let i = 0; i <= N; i++) {
      const a = a0 + ((a1 - a0) * i) / N;
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  };
  arc(x + r, y + r, Math.PI, 1.5 * Math.PI);
  arc(x + w - r, y + r, 1.5 * Math.PI, 2 * Math.PI);
  arc(x + w - r, y + d - r, 0, 0.5 * Math.PI);
  arc(x + r, y + d - r, 0.5 * Math.PI, Math.PI);

  const faces = pts.map((p, i) => {
    const q = pts[(i + 1) % pts.length];
    const dx = q[0] - p[0];
    const dy = q[1] - p[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = dy / len;
    const ny = -dx / len;
    if (nx + ny <= 0.001) return null; // sisi belakang, tidak terlihat
    const t = (nx - ny + 1.414) / 2.828;
    const fill = shade(color, -0.1 - 0.22 * t);
    return <polygon key={i} points={poly([p[0], p[1], z], [q[0], q[1], z], [q[0], q[1], z + h], [p[0], p[1], z + h])} fill={fill} stroke={fill} />;
  });
  const topPts = pts.map(([a, b]) => pt(a, b, z + h)).join(" ");
  const sh = h * 0.014;
  const shadow = pts.map(([a, b]) => pt(a + sh, b + sh, 0)).join(" ");
  return (
    <g strokeWidth={0.6} strokeLinejoin="round">
      {z === 0 && <polygon points={shadow} fill="#000" opacity={0.14} />}
      {faces}
      <polygon points={topPts} fill={shade(color, 0.1)} stroke={shade(color, 0.28)} strokeWidth={1.4} />
    </g>
  );
}
