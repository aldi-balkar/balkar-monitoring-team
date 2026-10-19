import { ROOMS, type Status } from "./data";

export type Pose = "stand" | "desk" | "sit" | "sleep" | "eat";
export type Slot = { x: number; y: number; pose: Pose; seat?: number; away?: boolean; idle?: boolean };
export type Pt = { x: number; y: number };

/** Lorong menuju War Room: menyambung dari lorong utama (y=8.5), naik di x=19.2 lalu masuk lewat pintu di dinding kiri War Room. */
export const CORR = { x: 19.2, doorY: 5.7 };
export const ROAD_Y = 8.5; // lorong horizontal di antara ruangan atas & bawah
export const AISLE: Record<Status, number> = { kerja: 7.5, review: 7.0, spv: 7.2, cuti: 7.9, sakit: 7.4, warroom: 0.8, kantin: 2.0 };

/** Satu meja panjang di tengah Ruang Kerja (koordinat grid global, ruang kerja berawal di 0,0). */
export const DESK = { x: 1.0, y: 3.1, w: 6, d: 1.8, h: 24, r: 0.55 };
export const DESK_KEY = DESK.x + DESK.w / 2 + DESK.y + DESK.d / 2; // kunci urutan gambar meja
/** Meja meeting War Room (koordinat grid global; ruangan berawal di 20,0). */
export const WAR_TABLE = { x: 21.4, y: 3.0, w: 5.2, d: 1.6, h: 22, r: 0.4 };
export const WAR_KEY = WAR_TABLE.x + WAR_TABLE.w / 2 + WAR_TABLE.y + WAR_TABLE.d / 2;
/** Meja makan panjang Kantin warteg (koordinat grid global; ruangan berawal di 20,9). */
export const KANTIN_TABLE = { x: 22.8, y: 12.0, w: 4.2, d: 1.2, h: 20 };
export const KANTIN_KEY = KANTIN_TABLE.x + KANTIN_TABLE.w / 2 + KANTIN_TABLE.y + KANTIN_TABLE.d / 2;
/** Meja besar yang memengaruhi urutan gambar karakter. */
export const TABLES = [
  { x: DESK.x, y: DESK.y, w: DESK.w, d: DESK.d, key: DESK_KEY },
  { x: WAR_TABLE.x, y: WAR_TABLE.y, w: WAR_TABLE.w, d: WAR_TABLE.d, key: WAR_KEY },
  { x: KANTIN_TABLE.x, y: KANTIN_TABLE.y, w: KANTIN_TABLE.w, d: KANTIN_TABLE.d, key: KANTIN_KEY },
];
const DESK_SEATS_X = [1.75, 3.25, 4.75, 6.25];

export const SOFAS = [
  { x: 0.6, y: 0.9, w: 2.6, color: "#2f7fd0" },
  { x: 4.4, y: 0.9, w: 2.6, color: "#2b9ac4" },
];
export const BEANBAGS = [
  { x: 2.0, y: 5.4, color: "#f2b01e" },
  { x: 4.8, y: 5.4, color: "#e8962a" },
];

/** Tiga tempat tidur Ruang Sakit (lokal; kepala di dinding belakang). */
export const BED_X = [1.9, 3.9, 5.9];
export const BED_Y = 2.5;

export const SLOTS: Record<Status, Slot[]> = {
  sakit: BED_X.map((x) => ({ x, y: BED_Y, pose: "sleep" as Pose, seat: 10 })),
  warroom: [],
  kantin: [],
  kerja: [
    ...DESK_SEATS_X.map((x) => ({ x, y: DESK.y - 0.45, pose: "desk" as Pose, seat: 10 })),
    ...DESK_SEATS_X.map((x) => ({ x, y: DESK.y + DESK.d + 0.55, pose: "desk" as Pose, seat: 10, away: true })),
    // pinggir ruangan: tempat berdiri untuk yang belum punya subtask aktif
    ...[3.4, 4.6, 5.8].map((y) => ({ x: 0.4, y, pose: "stand" as Pose, idle: true })),
  ],
  review: [
    ...[2.8, 4.0, 5.2].map((x) => ({ x, y: 2.75, pose: "sit" as Pose, seat: 10 })),
    ...[2.8, 4.0, 5.2].map((x) => ({ x, y: 5.3, pose: "sit" as Pose, seat: 10, away: true })),
  ],
  spv: [3.5, 5.2].flatMap((y) => [1.7, 3.1, 4.5, 5.9].map((x) => ({ x, y, pose: "stand" as Pose }))),
  cuti: [
    ...SOFAS.flatMap((s) => [s.x + s.w * 0.27, s.x + s.w * 0.73].map((x) => ({ x, y: s.y + 0.8, pose: "sleep" as Pose, seat: 10 }))),
    ...BEANBAGS.map((b) => ({ x: b.x, y: b.y, pose: "sleep" as Pose, seat: 11 })),
  ],
};

const WAR_SEATS_X = [2.3, 4.0, 5.7]; // lokal di War Room (meja di x 1.4..6.6)
SLOTS.warroom = [
  ...WAR_SEATS_X.map((x) => ({ x, y: 1.45, pose: "sit" as Pose, seat: 10 })),
  ...WAR_SEATS_X.map((x) => ({ x, y: 4.15, pose: "sit" as Pose, seat: 10, away: true })),
];

const KANTIN_SEATS_X = [3.6, 4.9, 6.2]; // lokal; bangku di x 2.8..7.0
SLOTS.kantin = [
  ...KANTIN_SEATS_X.map((x) => ({ x, y: 2.4, pose: "eat" as Pose, seat: 10 })),
  ...KANTIN_SEATS_X.map((x) => ({ x, y: 4.8, pose: "eat" as Pose, seat: 10, away: true })),
];

export function slotPos(room: Status, i: number): Pt {
  const o = ROOMS[room].origin;
  const s = SLOTS[room][i];
  return { x: o.x + s.x, y: o.y + s.y };
}

/** Jalur lurus di belakang/depan meja panjang supaya tidak menembus kursi (Ruang Kerja, War Room, Kantin). */
function lane(room: Status, idx: number): number | undefined {
  if (room === "warroom") return SLOTS.warroom[idx].away ? 5.7 : 0.5;
  if (room === "kantin") return SLOTS.kantin[idx].away ? 6.0 : 1.0;
  if (room === "sakit") return 5.4; // jalan di depan tempat tidur
  if (room !== "kerja") return undefined;
  return SLOTS.kerja[idx].y < DESK.y ? 1.95 : 6.4;
}

/** Titik-titik dari kursi menuju lorong (urutan keluar). */
function exitPts(room: Status, idx: number): Pt[] {
  const o = ROOMS[room].origin;
  const s = slotPos(room, idx);
  const ax = o.x + AISLE[room];
  const l = lane(room, idx);
  if (room === "warroom" || room === "kantin") {
    // keluar lewat pintu kiri, lalu lorong ke jalan utama
    const doorY = room === "warroom" ? CORR.doorY : o.y + 6.0;
    return [
      { x: s.x, y: o.y + l! },
      { x: ax, y: o.y + l! },
      { x: ax, y: doorY },
      { x: CORR.x, y: doorY },
      { x: CORR.x, y: ROAD_Y },
    ];
  }
  return l === undefined
    ? [{ x: ax, y: s.y }, { x: ax, y: ROAD_Y }]
    : [{ x: s.x, y: o.y + l }, { x: ax, y: o.y + l }, { x: ax, y: ROAD_Y }];
}

/** Jalur jalan: kursi asal -> lorong -> lorong ruangan tujuan -> kursi tujuan. */
export function buildPath(from: Pt, fromRoom: Status, fromSlot: number, moving: boolean, toRoom: Status, toIdx: number): Pt[] {
  const out: Pt[] = moving ? [{ x: from.x, y: ROAD_Y }] : exitPts(fromRoom, fromSlot);
  out.push(...exitPts(toRoom, toIdx).reverse(), slotPos(toRoom, toIdx));
  return out;
}
