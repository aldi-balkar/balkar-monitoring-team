export type Status = "kerja" | "review" | "spv" | "cuti" | "sakit" | "warroom" | "kantin";

export type Employee = {
  id: string;
  name: string;
  role: string;
  shirt: string;
  hair: string;
  skin: string;
  longHair?: boolean;
  glasses?: boolean;
  headphones?: boolean;
  tie?: string;
  badge?: string;
  jiraId?: string; // accountId Jira
};

export type RoomMeta = {
  label: string;
  short: string;
  desc: string;
  origin: { x: number; y: number }; // posisi sudut belakang ruangan di grid isometrik
  size?: { w: number; d: number }; // default 8 x 8
  floor: string;
  accent: string;
  messages: string[];
};

export const ROOMS: Record<Status, RoomMeta> = {
  kerja: {
    label: "Ruang Kerja",
    short: "Kerja",
    desc: "Sedang mengerjakan task",
    origin: { x: 0, y: 0 },
    floor: "#5a6270",
    accent: "#38bdf8",
    messages: ["Ngerjain task #128 💻", "Lagi debug nih 🐛", "Fokus dulu ya 🎧", "Commit dulu ✅", "Dikit lagi kelar 🔥"],
  },
  review: {
    label: "Ruang Review",
    short: "Review",
    desc: "Menunggu / sedang direview",
    origin: { x: 9, y: 0 },
    floor: "#d5dcea",
    accent: "#fbbf24",
    messages: ["Minta review dong 🙏", "Nunggu approval ⏳", "Dicek dulu ya 🔍", "Ada revisi dikit ✏️"],
  },
  spv: {
    label: "Ruang SPV",
    short: "SPV",
    desc: "Dipanggil / eskalasi supervisor",
    origin: { x: 0, y: 9 },
    floor: "#cdbfe3",
    accent: "#a78bfa",
    messages: ["Lapor ke SPV 📣", "Butuh persetujuan ✍️", "Ada eskalasi ⚠️", "Lagi 1on1 bareng SPV 😅"],
  },
  cuti: {
    label: "Ruang Cuti",
    short: "Cuti",
    desc: "Cuti / tidak aktif",
    origin: { x: 9, y: 9 },
    floor: "#cf9144",
    accent: "#34d399",
    messages: ["Cuti dulu ya 🏖️", "Zzz... 😴", "Lagi healing 🌴", "Jangan ganggu ya 🙈"],
  },
  sakit: {
    label: "Ruang Sakit",
    short: "Sakit",
    desc: "Sedang sakit / istirahat",
    origin: { x: 29, y: 0 },
    floor: "#cfe6e8",
    accent: "#22d3ee",
    messages: ["Lagi nggak enak badan 🤒", "Minum obat dulu 💊", "Istirahat biar cepat pulih 🛌", "Semoga cepat sembuh 🙏"],
  },
  warroom: {
    label: "War Room",
    short: "War Room",
    desc: "Sedang meeting",
    origin: { x: 20, y: 0 },
    floor: "#8fa6c8",
    accent: "#f43f5e",
    messages: ["Lagi meeting 📅", "Bahas incident 🚨", "Sync bareng tim 🤝", "War room dulu ya 🔥"],
  },
  kantin: {
    label: "Ruang Istirahat",
    short: "Istirahat",
    desc: "Istirahat / makan di kantin warteg",
    origin: { x: 20, y: 9 },
    floor: "#e6d3ae",
    accent: "#fb923c",
    messages: ["Makan siang dulu 🍛", "Es teh manis 🧋", "Nasi rames, Bu! 🍚", "Istirahat bentar ☕"],
  },
};

export const STATUS_ORDER: Status[] = ["kerja", "review", "spv", "cuti", "sakit", "warroom", "kantin"];

export const INITIAL: { emp: Employee; room: Status }[] = [
  { emp: { id: "1", name: "Aldi Balkar", jiraId: "61dbe29ea54af90069ba6e64", role: "SPV", badge: "SPV", shirt: "#475569", hair: "#111827", skin: "#e8b98a", tie: "#ef4444" }, room: "spv" },
  { emp: { id: "2", name: "Hery", jiraId: "712020:a21f6b56-cef4-49eb-bd9e-05c9ba22ffd5", role: "Team", badge: "Team", shirt: "#0ea5e9", hair: "#1f2937", skin: "#d9a577", glasses: true }, room: "kerja" },
  { emp: { id: "3", name: "Arya", jiraId: "712020:c5158b93-2c0c-473b-95c4-62d28acd97b5", role: "Team", badge: "Team", shirt: "#10b981", hair: "#3f2a1d", skin: "#f5c9a0", headphones: true }, room: "kerja" },
];
