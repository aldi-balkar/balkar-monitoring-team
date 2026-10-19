import type { Employee, Status } from "./data";

export type Issue = {
  key: string;
  summary: string;
  status: string;
  statusCategory: string;
  assigneeId: string | null;
  created: string;
};

export type Plan = { room: Status; idle: boolean; msg: string; active: number; done: number };

/** Tanggal (yyyy-mm-dd) menurut WIB. */
export const wibDay = (d: Date | string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date(d));

const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

/** Status Jira (nama) -> ruangan. Selain review, issue aktif dianggap sedang dikerjakan. */
const roomFor = (status: string): Status => (/review|verifikasi|konfirmasi/i.test(status) ? "review" : "kerja");

/** Posisi & pesan karyawan berdasarkan subtask hari ini. */
export function planFor(emp: Employee, issues: Issue[]): Plan {
  // subtask hari ini = yang masih aktif, atau yang dibuat hari ini (DONE kemarin tidak dihitung)
  const today = wibDay(new Date());
  const mine = issues.filter((i) => emp.jiraId && i.assigneeId === emp.jiraId && (i.statusCategory !== "done" || wibDay(i.created) === today));
  const active = mine.filter((i) => i.statusCategory !== "done");
  const done = mine.length - active.length;
  if (active.length) {
    const first = active.find((i) => roomFor(i.status) === "kerja") ?? active[0];
    const more = active.length > 1 ? ` (+${active.length - 1})` : "";
    return { room: roomFor(first.status), idle: false, msg: `${first.key} · ${clip(first.summary, 36)}${more}`, active: active.length, done };
  }
  if (done) return { room: "kerja", idle: true, msg: `Semua subtask hari ini selesai ✅ (${done})`, active: 0, done };
  return { room: "kerja", idle: true, msg: "Belum memiliki subtask hari ini ⚠️", active: 0, done: 0 };
}
