import type { Employee, Status } from "./data";
import { planFor, type Issue } from "./jira-status";

/** work = jam kerja biasa, lunch = sholat & makan, meeting = cek poin sore, home = kantor tutup, weekend = libur. */
export type Mode = "work" | "lunch" | "meeting" | "home" | "weekend";

const TZ = "Asia/Jakarta";
const WORK_START = 8 * 60; // asumsi: kantor buka 08:00 WIB (sebelum itu dianggap belum masuk)
const MEETING = 16 * 60;
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Hari (0=Minggu) dan menit sejak 00:00 menurut WIB, apa pun zona waktu perangkat. */
export function wib(d: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(d)
      .map((p) => [p.type, p.value]),
  );
  return { dow: DAYS.indexOf(parts.weekday), min: Number(parts.hour) * 60 + Number(parts.minute) };
}

export function modeAt(d: Date): Mode {
  const { dow, min } = wib(d);
  if (dow === 0 || dow === 6) return "weekend";
  const fri = dow === 5;
  const end = fri ? 16 * 60 + 45 : 16 * 60 + 30;
  if (min < WORK_START || min >= end) return "home";
  if (min >= MEETING) return "meeting";
  if (min >= 12 * 60 && min < (fri ? 13 * 60 + 30 : 13 * 60)) return "lunch";
  return "work";
}

export const MODE_LABEL: Record<Mode, string> = {
  work: "Jam kerja",
  lunch: "Sholat & makan siang",
  meeting: "Meeting cek poin sore",
  home: "Kantor tutup",
  weekend: "Libur akhir pekan",
};

export type Placement = { room: Status; idle: boolean; msg?: string; gone: boolean };

/** Prioritas: pulang > libur > pilihan manual (dropdown) > meeting sore > makan siang > subtask Jira. null = belum ada data Jira. */
export function placeFor(emp: Employee, mode: Mode, issues: Issue[] | null, manual?: Status): Placement | null {
  if (mode === "home") return { room: "kerja", idle: false, gone: true };
  if (mode === "weekend") return { room: "cuti", idle: false, msg: "Libur akhir pekan 🏖️", gone: false };
  if (manual) return { room: manual, idle: false, msg: manual === "sakit" ? "Lagi sakit, istirahat dulu 🤒" : undefined, gone: false };
  if (mode === "meeting") return { room: "warroom", idle: false, msg: "Meeting cek poin sore 📋", gone: false };
  if (mode === "lunch") return { room: "kantin", idle: false, msg: "Sholat & makan siang 🕌🍛", gone: false };
  if (!issues) return null;
  const p = planFor(emp, issues);
  return { room: p.room, idle: p.idle, msg: p.msg, gone: false };
}
