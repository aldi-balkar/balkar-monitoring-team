import type { ReactNode } from "react";
import { ROOMS, STATUS_ORDER, type Status } from "@/lib/data";
import { BED_X, BED_Y, BEANBAGS, DESK, DESK_KEY, KANTIN_KEY, KANTIN_TABLE, SLOTS, SOFAS, WAR_KEY, WAR_TABLE } from "@/lib/layout";
import { P } from "@/lib/iso";
import { Box, Flat, RoundedBox, poly, pt } from "./iso";

export type Item = { id: number; key: number; room: Status | null; node: ReactNode };

const WALL_H = 84;
const WALL_LOW = 18;
const SIZE = 17;
const MAIN_X = 28; // lebar blok utama (sampai War Room 20..28)
const SIZE_X = 37; // lebar total, termasuk Ruang Sakit (29..37) di sisi kanan

/* ---------------------------------------------------------------- furniture */

function buildFurniture(): Item[] {
  const items: Item[] = [];
  let n = 0;
  const add = (room: Status | null, key: number, node: ReactNode) => items.push({ id: n++, key, room, node });
  const g = (room: Status, lx: number, ly: number) => ({ gx: ROOMS[room].origin.x + lx, gy: ROOMS[room].origin.y + ly });

  const box = (room: Status, lx: number, ly: number, w: number, d: number, h: number, color: string, z = 0, bias = 0, key?: number) => {
    const { gx, gy } = g(room, lx, ly);
    add(room, key ?? gx + w / 2 + gy + d / 2 + z * 0.002 + bias, <Box x={gx} y={gy} w={w} d={d} h={h} z={z} color={color} />);
  };

  const chair = (room: Status, lx: number, ly: number, back: "behind" | "none", color = "#475569", key?: number) => {
    const { gx, gy } = g(room, lx, ly);
    add(room, key ?? gx + gy - 0.01, <Box x={gx - 0.34} y={gy - 0.34} w={0.68} d={0.68} h={10} color={color} />);
    if (back === "behind") add(room, key !== undefined ? key - 0.01 : gx + gy - 0.7, <Box x={gx - 0.34} y={gy - 0.55} w={0.68} d={0.16} h={30} color={color} />);
  };

  /** Kursi kantor hitam: dudukan, sandaran jaring, dan kaki bintang beroda. */
  const officeChair = (room: Status, lx: number, ly: number, behind: boolean, key: number, backDy = -0.55) => {
    const { gx, gy } = g(room, lx, ly);
    const [sx, sy] = P(gx, gy);
    const spokes = [0, 72, 144, 216, 288].map((a) => {
      const r = (a * Math.PI) / 180;
      return [Math.round(Math.cos(r) * 1300) / 100, Math.round(Math.sin(r) * 650) / 100] as const;
    });
    add(
      room,
      key,
      <g>
        <g transform={`translate(${sx} ${sy})`} stroke="#15181d" strokeWidth={2} strokeLinecap="round">
          {spokes.map(([x, y], i) => (
            <g key={i}>
              <line x1={0} y1={-3} x2={x} y2={y - 1} />
              <circle cx={x} cy={y} r={1.8} fill="#15181d" />
            </g>
          ))}
        </g>
        <Box x={gx - 0.07} y={gy - 0.07} w={0.14} d={0.14} h={6} color="#15181d" />
        <Box x={gx - 0.34} y={gy - 0.34} w={0.68} d={0.68} h={4} z={6} color="#2a2f38" />
      </g>,
    );
    if (behind) add(room, key + (backDy < 0 ? -0.01 : 0.01), <Box x={gx - 0.32} y={gy + backDy} w={0.64} d={0.12} h={30} z={10} color="#20242b" />);
  };

  const shelf = (room: Status, lx: number, ly: number, w: number) => {
    const { gx, gy } = g(room, lx, ly);
    const d = 0.5;
    const cols = ["#ef4444", "#3b82f6", "#facc15", "#22c55e", "#a855f7", "#f97316", "#06b6d4"];
    const books: ReactNode[] = [];
    [6, 24, 42].forEach((z, r) => {
      for (let i = 0, x = gx + 0.08; x < gx + w - 0.2; i++) {
        const bw = 0.1 + ((i * 7 + r * 3) % 3) * 0.04;
        const bh = 11 + ((i * 5 + r) % 4) * 2;
        books.push(
          <polygon key={`${r}-${i}`} points={poly([x, gy + d, z], [x + bw, gy + d, z], [x + bw, gy + d, z + bh], [x, gy + d, z + bh])} fill={cols[(i + r * 2) % cols.length]} />,
        );
        x += bw + 0.02;
      }
    });
    add(room, gx + w / 2 + gy + d / 2, <g><Box x={gx} y={gy} w={w} d={d} h={62} color="#8b5a2b" />{books}</g>);
  };

  const sofa = (room: Status, lx: number, ly: number, w: number, color: string) => {
    box(room, lx, ly + 0.3, w, 0.9, 10, color, 0, -1.0);
    box(room, lx, ly, w, 0.35, 26, color, 0, -1.6);
    box(room, lx - 0.1, ly + 0.2, 0.28, 1.1, 18, color);
    box(room, lx + w - 0.18, ly + 0.2, 0.28, 1.1, 18, color);
  };

  const beanbag = (room: Status, lx: number, ly: number, color: string) => {
    const { gx, gy } = g(room, lx, ly);
    const [sx, sy] = P(gx, gy);
    add(
      room,
      gx + gy - 0.05,
      <g transform={`translate(${sx} ${sy})`}>
        <ellipse cx={0} cy={-8} rx={19} ry={12} fill={color} />
        <ellipse cx={0} cy={-12} rx={13} ry={7} fill="#fff" opacity={0.25} />
      </g>,
    );
  };

  /* ---------- Ruang Kerja ---------- */
  add("kerja", DESK_KEY, <RoundedBox x={DESK.x} y={DESK.y} w={DESK.w} d={DESK.d} h={DESK.h} r={DESK.r} color="#c3c9d3" />);
  SLOTS.kerja.forEach((sl) => {
    const back = sl.y < DESK.y;
    // baris belakang: tepat di bawah karakter (x+y), tapi tetap sebelum meja
    const k = back ? sl.x + sl.y - 0.01 : DESK_KEY + 0.4 + sl.x * 0.001;
    officeChair("kerja", sl.x, sl.y, back, k);
    const top = DESK.h;
    const dk = DESK_KEY + 0.1 + sl.x * 0.001;
    // laptop terbuka: alas + layar
    if (back) {
      box("kerja", sl.x - 0.5, DESK.y + 0.5, 0.8, 0.55, 1.2, "#aeb4bd", top, 0, dk);
      box("kerja", sl.x - 0.45, DESK.y + 1.0, 0.7, 0.05, 11, "#23272f", top + 1.2, 0, dk + 0.0005);
    } else {
      box("kerja", sl.x - 0.5, DESK.y + DESK.d - 1.05, 0.8, 0.55, 1.2, "#aeb4bd", top, 0, dk);
      box("kerja", sl.x - 0.45, DESK.y + DESK.d - 1.1, 0.7, 0.05, 11, "#23272f", top + 1.2, 0, dk - 0.0005);
    }
  });
  // botol minum dan kubus rubik di meja, seperti di foto
  box("kerja", 2.55, 3.55, 0.2, 0.2, 12, "#a78bfa", DESK.h, 0, DESK_KEY + 0.12);
  box("kerja", 4.1, 4.15, 0.2, 0.2, 12, "#f1f5f9", DESK.h, 0, DESK_KEY + 0.12);
  box("kerja", 5.5, 3.65, 0.17, 0.17, 13, "#8d96a3", DESK.h, 0, DESK_KEY + 0.12);
  box("kerja", 3.6, 3.95, 0.24, 0.24, 6, "#facc15", DESK.h, 0, DESK_KEY + 0.12);
  // meja panjang krem mepet jendela (dinding belakang)
  box("kerja", 0.2, 0.1, 7.6, 0.9, 24, "#efe4d0", 0, 0, 1);
  [1.4, 3.0, 4.6, 6.2].forEach((x) => officeChair("kerja", x, 1.2, true, x + 1.2, 0.43)); // menghadap jendela
  box("kerja", 7.45, 0.15, 0.5, 0.5, 84, "#f2c200"); // kolom kuning

  /* ---------- Ruang Review ---------- */
  {
    const { gx, gy } = g("review", 1.4, 2.2);
    add("review", gx + gy - 5, <Flat x={gx} y={gy} w={5.2} d={3.6} fill="#c2410c" opacity={0.35} />);
  }
  SLOTS.review.forEach((s, i) => chair("review", s.x, s.y, i < 3 ? "behind" : "none", "#64748b"));
  box("review", 2, 3.2, 4, 1.6, 20, "#d7b98a");
  [2.6, 3.9, 5.1].forEach((x, i) => box("review", x, 3.55 + (i % 2) * 0.2, 0.6, 0.8, 1.2, "#ffffff", 20, 0.02));
  box("review", 4.9, 3.8, 0.5, 0.5, 5, "#f87171", 20, 0.03);
  box("review", 6.6, 0.2, 1.2, 0.6, 36, "#94a3b8");

  /* ---------- Ruang SPV ---------- */
  {
    const { gx, gy } = g("spv", 1.0, 2.7);
    add("spv", gx + gy - 5, <Flat x={gx} y={gy} w={6} d={4.4} fill="#9f1239" opacity={0.4} />);
  }
  box("spv", 3.7, 0.1, 1.2, 0.2, 38, "#334155", 0, -0.7); // sandaran kursi
  box("spv", 3.7, 0.3, 1.2, 0.9, 10, "#334155", 0, -0.5);
  box("spv", 2.8, 1.0, 3, 1.0, 24, "#6b4f3a");
  box("spv", 3.3, 1.15, 0.8, 0.12, 18, "#1f2937", 24, 0.01);
  box("spv", 4.6, 1.5, 0.9, 0.3, 1.5, "#e5e7eb", 24, 0.01);
  box("spv", 3.0, 1.75, 0.6, 0.16, 5, "#facc15", 24, 0.02);
  shelf("spv", 0.1, 0.1, 2.0);
  box("spv", 6.3, 0.2, 1.3, 0.7, 40, "#94a3b8");
  /* ---------- Ruang Cuti ---------- */
  {
    const { gx, gy } = g("cuti", 0.4, 0.5);
    add("cuti", gx + gy - 5, <Flat x={gx} y={gy} w={7.2} d={3.4} fill="#059669" opacity={0.3} />);
  }
  SOFAS.forEach((s) => sofa("cuti", s.x, s.y, s.w, s.color));
  BEANBAGS.forEach((b) => beanbag("cuti", b.x, b.y, b.color));
  box("cuti", 2.9, 3.0, 1.8, 0.8, 9, "#d6c3a5");
  box("cuti", 3.5, 3.2, 0.3, 0.3, 4, "#ef4444", 9, 0.01);
  // meja billiard
  box("cuti", 5.1, 3.1, 2.3, 1.3, 14, "#7c4a21");
  {
    const { gx, gy } = g("cuti", 5.1, 3.1);
    add(
      "cuti",
      gx + 1.15 + gy + 0.65 + 0.01,
      <g>
        <Flat x={gx + 0.12} y={gy + 0.12} w={2.06} d={1.06} z={14.2} fill="#15803d" />
        <Flat x={gx + 0.5} y={gy + 0.45} w={0.14} d={0.14} z={14.4} fill="#fff" />
        <Flat x={gx + 1.5} y={gy + 0.4} w={0.14} d={0.14} z={14.4} fill="#ef4444" />
        <Flat x={gx + 1.62} y={gy + 0.62} w={0.14} d={0.14} z={14.4} fill="#facc15" />
        <Flat x={gx + 1.5} y={gy + 0.8} w={0.14} d={0.14} z={14.4} fill="#1e293b" />
      </g>,
    );
  }

  /* ---------- Ruang Sakit ---------- */
  {
    const { gx, gy } = g("sakit", 0.8, 1.2);
    add("sakit", gx + gy - 5, <Flat x={gx} y={gy} w={6.4} d={4.6} fill="#0e7490" opacity={0.12} />);
  }
  BED_X.forEach((cx, i) => {
    const o = ROOMS.sakit.origin;
    const ak = o.x + cx + o.y + BED_Y + 0.02; // kunci urutan gambar karakter di ranjang
    box("sakit", cx - 0.75, 1.8, 1.5, 2.6, 10, "#e2e8f0", 0, 0, ak - 0.5);
    box("sakit", cx - 0.55, 1.9, 1.1, 0.5, 2.5, "#ffffff", 10, 0, ak - 0.4);
    box("sakit", cx - 0.72, 3.1, 1.44, 1.2, 1.8, ["#38bdf8", "#34d399", "#fda4af"][i], 10, 0, ak + 0.3);
  });
  box("sakit", 0.3, 0.2, 1.4, 0.7, 40, "#e2e8f0"); // lemari obat
  box("sakit", 0.85, 0.9, 0.3, 0.02, 4.5, "#ef4444", 24, 0.01);
  box("sakit", 0.76, 0.9, 0.48, 0.02, 1.6, "#ef4444", 25.4, 0.01);
  box("sakit", 6.3, 0.3, 0.5, 0.5, 26, "#cbd5e1"); // dispenser air

  /* ---------- War Room (ruang meeting, Lantai 2) ---------- */
  {
    const { gx, gy } = g("warroom", 0.8, 0.9);
    add("warroom", gx + gy - 5, <Flat x={gx} y={gy} w={6.4} d={4.2} fill="#1e293b" opacity={0.25} />);
  }
  add("warroom", WAR_KEY, <RoundedBox x={WAR_TABLE.x} y={WAR_TABLE.y} w={WAR_TABLE.w} d={WAR_TABLE.d} h={WAR_TABLE.h} r={WAR_TABLE.r} color="#7a5c43" />);
  SLOTS.warroom.forEach((sl) => {
    const { gx, gy } = g("warroom", sl.x, sl.y);
    const back = !sl.away;
    officeChair("warroom", sl.x, sl.y, back, back ? gx + gy - 0.01 : WAR_KEY + 0.4 + gx * 0.001);
  });
  // laptop & dokumen di meja meeting
  [2.3, 4.0, 5.7].forEach((lx, i) => {
    const k = WAR_KEY + 0.1 + i * 0.001;
    box("warroom", lx - 0.35, 2.1, 0.7, 0.45, 1.2, "#aeb4bd", WAR_TABLE.h, 0, k);
    box("warroom", lx - 0.3, 2.05, 0.6, 0.05, 10, "#23272f", WAR_TABLE.h + 1.2, 0, k);
    box("warroom", lx - 0.3, 3.0, 0.6, 0.4, 0.8, "#ffffff", WAR_TABLE.h, 0, k);
  });
  box("warroom", 3.7, 2.75, 0.3, 0.3, 7, "#f43f5e", WAR_TABLE.h, 0, WAR_KEY + 0.12);
  box("warroom", 6.3, 0.2, 1.4, 0.6, 22, "#efe4d0"); // kredensa di bawah monitor

  /* ---------- Ruang Istirahat: kantin warteg ---------- */
  {
    const { gx, gy } = g("kantin", 1.6, 0.6);
    add("kantin", gx + gy - 5, <Flat x={gx} y={gy} w={6.0} d={6.8} fill="#b45309" opacity={0.12} />);
  }
  {
    // etalase kaca warteg di sepanjang dinding kiri
    const { gx, gy } = g("kantin", 0.25, 0.8);
    const dishes = ["#ea580c", "#16a34a", "#dc2626", "#ca8a04", "#92400e", "#84cc16", "#f97316"];
    add(
      "kantin",
      gx + 0.45 + gy + 1.9,
      <g>
        <Box x={gx} y={gy} w={0.9} d={3.8} h={16} color="#8b5a2b" />
        {dishes.map((c, i) => (
          <Box key={i} x={gx + 0.15} y={gy + 0.2 + i * 0.5} w={0.6} d={0.38} h={4} z={16} color={c} />
        ))}
        <polygon points={poly([gx + 0.9, gy, 16], [gx + 0.9, gy + 3.8, 16], [gx + 0.9, gy + 3.8, 40], [gx + 0.9, gy, 40])} fill="#dff1ff" opacity={0.38} stroke="#94a3b8" strokeWidth={1.2} />
        <Box x={gx} y={gy} w={0.9} d={3.8} h={2.5} z={40} color="#cbd5e1" />
      </g>,
    );
  }
  {
    const o = ROOMS.kantin.origin;
    const seatKey = (lxs: number, lys: number) => o.x + lxs + o.y + lys;
    // bangku & meja
    box("kantin", 2.8, 2.15, 4.2, 0.45, 10, "#8b5a2b", 0, 0, seatKey(3.6, 2.4) - 0.5);
    add("kantin", KANTIN_KEY, <Box x={KANTIN_TABLE.x} y={KANTIN_TABLE.y} w={KANTIN_TABLE.w} d={KANTIN_TABLE.d} h={KANTIN_TABLE.h} color="#b08968" />);
    box("kantin", 2.8, 4.6, 4.2, 0.45, 10, "#8b5a2b", 0, 0, KANTIN_KEY + 0.4);
    // piring nasi, gelas es teh
    [3.6, 4.9, 6.2].forEach((x, i) => {
      box("kantin", x - 0.25, 3.15, 0.5, 0.35, 1.2, "#ffffff", KANTIN_TABLE.h, 0, KANTIN_KEY + 0.1 + i * 0.001);
      box("kantin", x - 0.15, 3.2, 0.3, 0.2, 2.2, "#fb923c", KANTIN_TABLE.h + 1.2, 0, KANTIN_KEY + 0.1 + i * 0.001);
      box("kantin", x - 0.25, 3.7, 0.5, 0.35, 1.2, "#ffffff", KANTIN_TABLE.h, 0, KANTIN_KEY + 0.1 + i * 0.001);
      box("kantin", x - 0.15, 3.75, 0.3, 0.2, 2.2, "#16a34a", KANTIN_TABLE.h + 1.2, 0, KANTIN_KEY + 0.1 + i * 0.001);
      box("kantin", x + 0.3, 3.45, 0.14, 0.14, 7, "#fbbf24", KANTIN_TABLE.h, 0, KANTIN_KEY + 0.12);
    });
    // kulkas minuman & galon
    box("kantin", 4.4, 0.2, 1.1, 0.7, 44, "#f1f5f9");
    box("kantin", 4.5, 0.9, 0.9, 0.02, 30, "#38bdf8", 8, 0.01);
    box("kantin", 6.8, 0.3, 0.55, 0.55, 30, "#e2e8f0");
    box("kantin", 6.9, 0.4, 0.35, 0.35, 14, "#60a5fa", 30, 0.01);
  }

  return items;
}

export const FURNITURE = buildFurniture();

export function Tag({ name, dot }: { name: string; dot?: string }) {
  const w = name.length * 6 + 14 + (dot ? 8 : 0);
  return (
    <g>
      <rect x={-w / 2} y={7} width={w} height={14} rx={7} fill="#0b1437" opacity={0.85} />
      {dot && <circle cx={-w / 2 + 8} cy={14} r={3} fill={dot} />}
      <text x={dot ? 4 : 0} y={17} textAnchor="middle" fontSize={9.5} fontWeight={700} fill="#fff">
        {name}
      </text>
    </g>
  );
}

/* ---------------------------------------------------------------- floor */

export function Island() {
  const T = 16;
  const SIDE = 9; // Ruang Sakit hanya setinggi baris atas (y 0..9)
  return (
    <g>
      <ellipse cx={0} cy={330} rx={860} ry={380} fill="url(#glow)" />
      {/* sisi depan blok utama & sayap kanan */}
      <polygon points={`${pt(0, SIZE)} ${pt(MAIN_X, SIZE)} ${pt(MAIN_X, SIZE, -T)} ${pt(0, SIZE, -T)}`} fill="#24407f" />
      <polygon points={`${pt(MAIN_X, SIDE)} ${pt(SIZE_X, SIDE)} ${pt(SIZE_X, SIDE, -T)} ${pt(MAIN_X, SIDE, -T)}`} fill="#24407f" />
      <polygon points={`${pt(MAIN_X, SIDE)} ${pt(MAIN_X, SIZE)} ${pt(MAIN_X, SIZE, -T)} ${pt(MAIN_X, SIDE, -T)}`} fill="#162a5e" />
      <polygon points={`${pt(SIZE_X, 0)} ${pt(SIZE_X, SIDE)} ${pt(SIZE_X, SIDE, -T)} ${pt(SIZE_X, 0, -T)}`} fill="#162a5e" />
      <polygon points={`${pt(0, 0)} ${pt(MAIN_X, 0)} ${pt(MAIN_X, SIZE)} ${pt(0, SIZE)}`} fill="#e3e9f4" />
      <polygon points={`${pt(MAIN_X, 0)} ${pt(SIZE_X, 0)} ${pt(SIZE_X, SIDE)} ${pt(MAIN_X, SIDE)}`} fill="#e3e9f4" />
      {/* garis lorong */}
      <path d={`M${pt(8, 0)} L${pt(8, SIZE)} M${pt(9, 0)} L${pt(9, SIZE)} M${pt(0, 8)} L${pt(SIZE_X, 8)} M${pt(0, 9)} L${pt(SIZE_X, 9)}`} stroke="#c3cde0" strokeWidth={1} />
      {/* lorong menuju War Room & Kantin */}
      <Flat x={17} y={8} w={3} d={1} z={0.08} fill="#b9c6dc" />
      <Flat x={18.4} y={4.9} w={1.6} d={11.1} z={0.08} fill="#b9c6dc" />
      <path d={`M${pt(18.4, 4.9)} L${pt(18.4, 16)} M${pt(20, 4.9)} L${pt(20, 8)} M${pt(20, 9)} L${pt(20, 16)}`} stroke="#8fa1c0" strokeWidth={1.5} />
    </g>
  );
}

/** Tembok kiri Kantin (pintu ke lorong) + papan nama WARTEG. */
export function KantinWalls({ dim }: { dim?: boolean }) {
  const { x, y } = ROOMS.kantin.origin;
  const H = 64;
  const left = (v: number, z: number): [number, number, number] => [x, y + v, z];
  const lq = (v0: number, v1: number, z0: number, z1: number) => poly(left(v0, z0), left(v1, z0), left(v1, z1), left(v0, z1));
  const door: [number, number] = [5.2, 6.8];
  const segs: [number, number][] = [[0, door[0]], [door[1], 8]];
  const [tx, ty] = P(x, y + 2.6, 52);
  return (
    <g opacity={dim ? 0.35 : 1} style={{ transition: "opacity .3s" }}>
      {segs.map(([a, b]) => (
        <g key={a}>
          <polygon points={lq(a, b, 0, H)} fill="#f3e3c3" />
          <polygon points={lq(a, b, 0, 10)} fill="#d4a373" />
          <polygon points={lq(a, b, H - 3, H)} fill="#a16207" />
        </g>
      ))}
      <polygon points={lq(door[0], door[1], H - 12, H)} fill="#f3e3c3" />
      {/* papan nama warteg */}
      <polygon points={lq(0.5, 4.7, 42, 60)} fill="#dc2626" stroke="#fde047" strokeWidth={2.2} />
      <g transform={`translate(${tx} ${ty}) skewY(-26.57)`}>
        <text textAnchor="middle" y={5} fontSize={15} fontWeight={900} fill="#fde047" letterSpacing={2}>
          WARTEG
        </text>
      </g>
      <polygon points={lq(0.5, 4.7, 30, 38)} fill="#fff7ed" stroke="#a16207" strokeWidth={1.2} />
      <path d={`M${pt(x, y + 0.9, 35)} L${pt(x, y + 2.2, 35)} M${pt(x, y + 2.6, 35)} L${pt(x, y + 4.0, 35)}`} stroke="#92400e" strokeWidth={2} />
    </g>
  );
}

/** Tembok War Room (belakang & kiri, pintu di kiri-depan) + monitor besar. */
export function WarWalls({ dim }: { dim?: boolean }) {
  const { x, y } = ROOMS.warroom.origin;
  const H = 64;
  const back = (u: number, z: number): [number, number, number] => [x + u, y, z];
  const bq = (u0: number, u1: number, z0: number, z1: number) => poly(back(u0, z0), back(u1, z0), back(u1, z1), back(u0, z1));
  const left = (v: number, z: number): [number, number, number] => [x, y + v, z];
  const lq = (v0: number, v1: number, z0: number, z1: number) => poly(left(v0, z0), left(v1, z0), left(v1, z1), left(v0, z1));
  const door: [number, number] = [4.9, 6.5];
  const tiles: ReactNode[] = [];
  const cols = ["#38bdf8", "#34d399", "#fbbf24"];
  for (let i = 0; i < 3; i++) tiles.push(<polygon key={i} points={bq(1.7 + i * 1.55, 3.0 + i * 1.55, 26, 38)} fill={cols[i]} opacity={0.9} />);
  const chart = [[1.7, 30], [2.6, 36], [3.4, 31], [4.3, 40], [5.2, 34], [6.2, 44]];
  const segs: [number, number][] = [[0, door[0]], [door[1], 8]];
  return (
    <g opacity={dim ? 0.35 : 1} style={{ transition: "opacity .3s" }}>
      <polygon points={bq(0, 8, 0, H)} fill="#eef2f8" />
      <polygon points={bq(0, 8, 0, 10)} fill="#cbd5e1" />
      <polygon points={bq(0, 8, H - 3, H)} fill="#94a3b8" />
      {segs.map(([a, b]) => (
        <g key={a}>
          <polygon points={lq(a, b, 0, H)} fill="#dbe3ef" />
          <polygon points={lq(a, b, 0, 10)} fill="#b7c3d4" />
          <polygon points={lq(a, b, H - 3, H)} fill="#94a3b8" />
        </g>
      ))}
      <polygon points={lq(door[0], door[1], H - 12, H)} fill="#dbe3ef" />
      {/* monitor besar */}
      <polygon points={bq(1.1, 6.9, 14, 58)} fill="#0b1220" stroke="#475569" strokeWidth={2} />
      <polygon points={bq(1.3, 6.7, 16, 56)} fill="#0f2742" />
      <polygon points={bq(1.7, 6.3, 47, 53)} fill="#1e3a5f" />
      {tiles}
      <path d={chart.map(([u, z], i) => `${i ? "L" : "M"}${pt(x + u, y, z + 5 - (i % 2))}`).join(" ")} stroke="#a7f3d0" strokeWidth={2} fill="none" />
      <polygon points={bq(1.7, 6.3, 18, 24)} fill="#1e3a5f" />
    </g>
  );
}

const BEAMS: Partial<Record<Status, { u: number; axis: "x" | "y" }[]>> = {
  kerja: [{ u: 1, axis: "x" }, { u: 5.5, axis: "x" }, { u: 1.5, axis: "y" }, { u: 5, axis: "y" }],
  review: [{ u: 10, axis: "x" }, { u: 14.5, axis: "x" }],
  spv: [{ u: 10.5, axis: "y" }, { u: 14, axis: "y" }],
};

export function RoomFloor({ room, dim }: { room: Status; dim: boolean }) {
  const { origin, floor, accent, size } = ROOMS[room];
  const { x, y } = origin;
  const W = size?.w ?? 8;
  const D = size?.d ?? 8;
  const tiles: ReactNode[] = [];
  const joints: string[] = [];
  for (let j = 0; j < D; j++) {
    for (let i = 0; i < W; i++) {
      const alt = (i + j) % 2 === 0;
      if (room === "kerja") {
        if (j % 2 === 0) tiles.push(<Flat key={`${i}-${j}`} x={x + i} y={y + j} w={1} d={1} z={0.05} fill="#fff" opacity={0.09} />);
      } else if (room === "cuti") {
        // parket herringbone: papan bergantian arah per petak
        tiles.push(<Flat key={`${i}-${j}`} x={x + i} y={y + j} w={1} d={1} z={0.05} fill={alt ? "#7a3f0a" : "#fff3d6"} opacity={alt ? 0.1 : 0.12} />);
        for (let k = 1; k < 4; k++) {
          const t = k / 4;
          joints.push(alt ? `M${pt(x + i, y + j + t)} L${pt(x + i + 1, y + j + t)}` : `M${pt(x + i + t, y + j)} L${pt(x + i + t, y + j + 1)}`);
        }
      } else if (alt) {
        tiles.push(<Flat key={`${i}-${j}`} x={x + i} y={y + j} w={1} d={1} z={0.05} fill={room === "review" ? "#fff" : room === "spv" ? "#fff" : "#fff"} opacity={room === "review" ? 0.35 : 0.18} />);
      }
    }
    if (room === "kerja") {
      const off = j % 2 ? 1.2 : 0;
      for (let k = off; k < W; k += 2.4) joints.push(`M${pt(x + k, y + j)} L${pt(x + k, y + j + 1)}`);
    }
  }
  const edge: string[] = [];
  for (let i = 0; i <= W; i++) edge.push(`M${pt(x + i, y)} L${pt(x + i, y + D)}`);
  for (let i = 0; i <= D; i++) edge.push(`M${pt(x, y + i)} L${pt(x + W, y + i)}`);
  return (
    <g opacity={dim ? 0.35 : 1} style={{ transition: "opacity .3s" }}>
      <polygon points={poly([x, y, 0], [x + W, y, 0], [x + W, y + D, 0], [x, y + D, 0])} fill={floor} />
      {tiles}
      <path d={edge.join(" ")} stroke="#000" strokeOpacity={room === "kerja" ? 0.1 : 0.06} strokeWidth={1} fill="none" />
      <path d={joints.join(" ")} stroke="#000" strokeOpacity={0.12} strokeWidth={1} fill="none" />
      <clipPath id={`clip-${room}`}>
        <polygon points={poly([x, y, 0], [x + W, y, 0], [x + W, y + D, 0], [x, y + D, 0])} />
      </clipPath>
      <g clipPath={`url(#clip-${room})`}>
      {(BEAMS[room] ?? []).map((b, i) => {
        const gx0 = b.axis === "x" ? b.u : x;
        const gy0 = b.axis === "x" ? y : b.u;
        const pts =
          b.axis === "x"
            ? poly([gx0, y, 0.1], [gx0 + 1.1, y, 0.1], [gx0 + 4.6, y + 4.2, 0.1], [gx0 + 3.5, y + 4.2, 0.1])
            : poly([x, gy0, 0.1], [x, gy0 + 1.1, 0.1], [x + 4.2, gy0 + 4.6, 0.1], [x + 4.2, gy0 + 3.5, 0.1]);
        return <polygon key={i} points={pts} fill="#fff" opacity={0.16} />;
      })}
      </g>
      <polygon points={poly([x, y, 0], [x + W, y, 0], [x + W, y + D, 0], [x, y + D, 0])} fill="none" stroke={accent} strokeWidth={2.5} strokeOpacity={0.8} />
    </g>
  );
}

/* ---------------------------------------------------------------- walls */

/** Dinding kaca belakang. axis "x": bidang gy=0 (gx 0..17). axis "y": bidang gx=0 (gy 0..17). */
export function Wall({ axis, dim }: { axis: "x" | "y"; dim: Partial<Record<Status, boolean>> }) {
  const at = (u: number, z: number): [number, number, number] => (axis === "x" ? [u, 0, z] : [0, u, z]);
  const P4 = (u0: number, u1: number, z0: number, z1: number) => poly(at(u0, z0), at(u1, z0), at(u1, z1), at(u0, z1));
  // ruangan yang menempel di dinding ini
  const segs: [Status, number, number][] =
    axis === "x"
      ? [["kerja", 0, 8.5], ["review", 8.5, 17.5], ["warroom", 17.5, 28.5], ["sakit", 28.5, SIZE_X]]
      : [["kerja", 0, 8.5], ["spv", 8.5, SIZE]];
  const len = axis === "x" ? SIZE_X : SIZE;
  const count = axis === "x" ? 8 : 4; // panel kaca lebar
  const PANE = len / count;
  const panes = Array.from({ length: count }, (_, i) => i * PANE);
  const drop = panes.map((_, i) => WALL_LOW + (i === 2 ? 12 : 2)); // roller blind (sheer) per panel
  return (
    <g>
      {/* langit berkabut khas Jakarta */}
      <polygon points={P4(0, len, WALL_LOW, WALL_H)} fill="url(#haze)" />
      {/* roller blind sheer warna krem */}
      {panes.map((u, i) => (
        <g key={u}>
          <polygon points={P4(u + 0.08, u + PANE - 0.08, drop[i], WALL_H - 5)} fill="#efe4d0" opacity={0.62} />
          <polygon points={P4(u + 0.08, u + PANE - 0.08, drop[i], drop[i] + 2.5)} fill="#d6c9b2" />
        </g>
      ))}
      {/* kusen putih tipis antar panel */}
      {[...panes, len].map((u) => (
        <line key={u} x1={P(...at(u, WALL_LOW))[0]} y1={P(...at(u, WALL_LOW))[1]} x2={P(...at(u, WALL_H))[0]} y2={P(...at(u, WALL_H))[1]} stroke="#f7f4ee" strokeWidth={3} />
      ))}
      {segs.map(([room, a, b]) => (
        <polygon key={room} points={P4(a, b, 0, WALL_LOW)} fill={ROOMS[room].accent} opacity={dim[room] ? 0.3 : 0.9} style={{ transition: "opacity .3s" }} />
      ))}
      <polygon points={P4(0, len, 0, WALL_LOW)} fill="#0b1437" opacity={0.28} />
      {/* plafon / soffit krem di atas jendela */}
      <polygon points={P4(0, len, WALL_H - 5, WALL_H)} fill="#f3ead8" />
    </g>
  );
}

/** Dekorasi dinding: papan tulis, TV, clock, bingkai. */
export function WallDecor() {
  const planeY = (u: number, z: number): [number, number, number] => [0, u, z];
  const quad = (f: typeof planeY, u0: number, u1: number, z0: number, z1: number) => poly(f(u0, z0), f(u1, z0), f(u1, z1), f(u0, z1));
  return (
    <g>
      {/* logo Pegadaian di dinding kiri Ruang Kerja (bidang gx=0) */}
      <polygon points={quad(planeY, 1.9, 5.7, 22, 82)} fill="#f8fafc" stroke="#cbd5e1" strokeWidth={2} />
      <polygon points={quad(planeY, 1.9, 5.7, 78, 82)} fill="#16a34a" />
      <image
        href="/pegadaian.svg"
        width={300}
        height={155}
        transform={`matrix(0.3 -0.15 0 0.3 ${-32 * 5.4} ${16 * 5.4 - 72})`}
        style={{ transformBox: "view-box", transformOrigin: "0 0" }}
      />
    </g>
  );
}

export { STATUS_ORDER };
