"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import { INITIAL, ROOMS, STATUS_ORDER, type Status } from "@/lib/data";
import { buildPath, slotPos, SLOTS } from "@/lib/layout";
import { planFor, wibDay, type Issue } from "@/lib/jira-status";
import { MODE_LABEL, modeAt, placeFor, type Mode } from "@/lib/schedule";
import Scene, { type Agent, type Filter } from "./Scene";

const SPEED = 6.5; // tile per detik

type State = { agents: Agent[]; clock: number };
type Action =
  | { type: "move"; id: string; room: Status; now: number; r: number; idle?: boolean; msg?: string }
  | { type: "tick"; dt: number; now: number }
  | { type: "gone"; gone: boolean }
  | { type: "clock"; now: number }
  | { type: "speak"; id: string; now: number; r: number };

const pick = (room: Status, r: number) => ROOMS[room].messages[Math.floor(r * ROOMS[room].messages.length)];

function init(): State {
  const used = Object.fromEntries(STATUS_ORDER.map((r) => [r, 0])) as Record<Status, number>;
  const agents = INITIAL.map(({ emp, room }, i): Agent => {
    const slot = used[room]++;
    const p = slotPos(room, slot);
    return { emp, room, slot, x: p.x, y: p.y, path: [], msg: pick(room, (i * 0.37) % 1), bubbleUntil: 0 };
  });
  return { agents, clock: 0 };
}

function reducer(state: State, a: Action): State {
  switch (a.type) {
    case "move": {
      const cur = state.agents.find((x) => x.emp.id === a.id);
      const idle = !!a.idle;
      if (!cur) return state;
      if (cur.room === a.room && !!cur.idle === idle) {
        if (cur.pinned === a.msg) return state;
        return { ...state, agents: state.agents.map((x) => (x === cur ? { ...x, pinned: a.msg, msg: a.msg ?? pick(a.room, a.r) } : x)) };
      }
      const taken = new Set(state.agents.filter((x) => x.room === a.room && x !== cur).map((x) => x.slot));
      const slot = SLOTS[a.room].findIndex((sl, i) => !!sl.idle === idle && !taken.has(i));
      if (slot < 0) return state;
      const path = buildPath(cur, cur.room, cur.slot, cur.path.length > 0, a.room, slot);
      return {
        clock: a.now,
        agents: state.agents.map((x) => (x === cur ? { ...x, room: a.room, slot, path, idle, pinned: a.msg, msg: a.msg ?? pick(a.room, a.r) } : x)),
      };
    }
    case "tick": {
      let changed = false;
      const agents = state.agents.map((ag) => {
        if (!ag.path.length) return ag;
        changed = true;
        let { x, y } = ag;
        const path = [...ag.path];
        let step = SPEED * a.dt;
        while (step > 0 && path.length) {
          const t = path[0];
          const d = Math.hypot(t.x - x, t.y - y);
          if (d <= step) {
            x = t.x;
            y = t.y;
            path.shift();
            step -= d;
          } else {
            const f = step / d;
            x += (t.x - x) * f;
            y += (t.y - y) * f;
            step = 0;
          }
        }
        return { ...ag, x, y, path, bubbleUntil: path.length ? ag.bubbleUntil : a.now + 5 };
      });
      return changed ? { agents, clock: a.now } : state;
    }
    case "gone":
      // pulang: berhenti di kursi masing-masing lalu menghilang; kembali: muncul lagi di kursi
      return {
        ...state,
        agents: state.agents.map((x) => {
          if (x.gone === a.gone) return x;
          const p = slotPos(x.room, x.slot);
          return { ...x, gone: a.gone, x: p.x, y: p.y, path: [] };
        }),
      };
    case "clock":
      return { ...state, clock: a.now };
    case "speak":
      return {
        clock: a.now,
        agents: state.agents.map((x) => (x.emp.id === a.id && !x.path.length ? { ...x, msg: x.pinned ?? pick(x.room, a.r), bubbleUntil: a.now + 4 } : x)),
      };
  }
}

const nowSec = () => performance.now() / 1000;

export default function Monitor() {
  const [{ agents, clock }, dispatch] = useReducer(reducer, undefined, init);
  const [filter, setFilter] = useState<Filter>("all");
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [auto, setAuto] = useState(false);
  const [issues, setIssues] = useState<Issue[] | null>(null);
  const [jiraErr, setJiraErr] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("work");
  const [manual, setManual] = useState<Record<string, Status>>({}); // pilihan dropdown, berlaku seharian
  const plans = useMemo(() => Object.fromEntries(INITIAL.map(({ emp }) => [emp.id, issues ? planFor(emp, issues) : null])), [issues]);
  const [time, setTime] = useState("");

  const moving = agents.some((a) => a.path.length > 0);

  // animasi jalan
  useEffect(() => {
    if (!moving) return;
    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      dispatch({ type: "tick", dt, now: t / 1000 });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [moving]);

  // jam, kedaluwarsa gelembung, dan obrolan acak
  useEffect(() => {
    let n = 0;
    const tick = () => {
      n++;
      setTime(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }).replace(".", ":"));
      dispatch({ type: "clock", now: nowSec() });
      if (n % 2 === 0) {
        const id = INITIAL[Math.floor(Math.random() * INITIAL.length)].emp.id;
        dispatch({ type: "speak", id, now: nowSec(), r: Math.random() });
      }
    };
    const first = setTimeout(tick, 300);
    const t = setInterval(tick, 1500);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, []);

  // jadwal WIB: cek tiap 20 detik
  useEffect(() => {
    const tick = () => setMode(modeAt(new Date()));
    const first = setTimeout(tick, 0);
    const t = setInterval(tick, 20_000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, []);

  // pilihan manual (sakit, cuti, dll) disimpan di browser untuk hari ini (WIB), otomatis hangus saat ganti hari
  const loadManual = (): Record<string, Status> => {
    try {
      const saved = JSON.parse(localStorage.getItem("manual") ?? "null") as { day: string; map: Record<string, Status> } | null;
      return saved && saved.day === wibDay(new Date()) ? saved.map : {};
    } catch {
      return {};
    }
  };
  useEffect(() => {
    const sync = () => setManual((cur) => {
      const next = loadManual();
      return JSON.stringify(cur) === JSON.stringify(next) ? cur : next;
    });
    const first = setTimeout(sync, 0);
    const t = setInterval(sync, 60_000); // ganti hari / tab lain mengubah pilihan
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, []);
  const updateManual = (id: string, room: Status | null) => {
    const next = { ...loadManual() };
    if (room) next[id] = room;
    else delete next[id];
    try {
      localStorage.setItem("manual", JSON.stringify({ day: wibDay(new Date()), map: next }));
    } catch {}
    setManual(next);
  };

  // tarik subtask Jira: saat jadwal berganti, lalu tiap 30 menit
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/jira/issues", { cache: "no-store" });
        const data = (await res.json()) as { issues?: Issue[]; error?: string };
        if (!alive) return;
        if (!data.issues) throw new Error(data.error ?? "Gagal memuat Jira");
        setIssues(data.issues);
        setJiraErr(null);
      } catch (e) {
        if (alive) setJiraErr(e instanceof Error ? e.message : "Gagal memuat Jira");
      }
    };
    load();
    const t = setInterval(load, 30 * 60_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [mode]);

  // petakan ke ruangan: tiap data Jira, jadwal, atau status sakit berubah
  useEffect(() => {
    dispatch({ type: "gone", gone: mode === "home" });
    for (const { emp } of INITIAL) {
      const p = placeFor(emp, mode, issues, manual[emp.id]);
      if (p && !p.gone) dispatch({ type: "move", id: emp.id, room: p.room, idle: p.idle, msg: p.msg, now: nowSec(), r: Math.random() });
    }
  }, [mode, issues, manual]);

  // simulasi perpindahan acak
  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => {
      const id = INITIAL[Math.floor(Math.random() * INITIAL.length)].emp.id;
      const room = STATUS_ORDER[Math.floor(Math.random() * STATUS_ORDER.length)];
      dispatch({ type: "move", id, room, now: nowSec(), r: Math.random() });
    }, 4000);
    return () => clearInterval(t);
  }, [auto]);

  const counts = Object.fromEntries(STATUS_ORDER.map((r) => [r, agents.filter((a) => a.room === r && !a.gone).length])) as Record<Status, number>;
  const total = agents.length;
  const toggle = (f: Filter) => setFilter((cur) => (cur === f ? "all" : f));

  const tab = (active: boolean) =>
    `relative shrink-0 px-1 py-1 text-xs font-medium tracking-wide transition after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:transition ${
      active ? "text-white after:bg-white" : "text-white/45 after:bg-transparent hover:text-white/80"
    }`;

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[radial-gradient(ellipse_at_50%_55%,#2457c5_0%,#14367f_45%,#0a1a45_100%)] text-white">
      {/* filter minimalis di bawah */}
      <nav className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-center gap-5 overflow-x-auto bg-gradient-to-t from-[#0a1a45]/85 to-transparent px-4 pb-3 pt-6 [scrollbar-width:none]">
        <button className={tab(filter === "all")} onClick={() => setFilter("all")}>
          Semua
        </button>
        {STATUS_ORDER.map((r) => (
          <button key={r} className={`${tab(filter === r)} flex items-center gap-1.5`} onClick={() => toggle(r)}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: ROOMS[r].accent }} />
            {ROOMS[r].short}
          </button>
        ))}
        <span className="h-3 w-px shrink-0 bg-white/20" />
        {agents.map((a) => (
          <button key={a.emp.id} className={tab(filter === a.emp.id)} onClick={() => toggle(a.emp.id)}>
            {a.emp.name}
          </button>
        ))}
      </nav>

      {/* statistik */}
      <section className="absolute left-5 top-4 z-10 w-52 space-y-1.5 text-sm [text-shadow:0_1px_3px_rgba(0,0,0,.5)]">
        <div className="text-xs font-semibold uppercase tracking-wider text-white/60">Hari ini · {time} WIB</div>
        <div className="text-[11px] font-medium text-white/80">{MODE_LABEL[mode]}</div>
        <div className="font-bold">Karyawan {total}</div>
        {jiraErr && <div className="rounded-md bg-rose-500/30 px-2 py-1 text-[11px]">Jira: {jiraErr}</div>}
        {mode === "work" && INITIAL.filter(({ emp }) => plans[emp.id] && !plans[emp.id]!.active && !plans[emp.id]!.done && !manual[emp.id]).map(({ emp }) => (
          <div key={emp.id} className="rounded-md bg-amber-400/25 px-2 py-1 text-[11px] font-medium">
            ⚠️ {emp.name}: belum memiliki subtask hari ini
          </div>
        ))}
        {STATUS_ORDER.map((r) => (
          <div key={r}>
            <div className="flex justify-between text-xs">
              <span>{ROOMS[r].short}</span>
              <span className="font-semibold">
                {counts[r]} · {Math.round((counts[r] / total) * 100)}%
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(counts[r] / total) * 100}%`, background: ROOMS[r].accent }} />
            </div>
          </div>
        ))}
      </section>

      {/* daftar & kontrol */}
      <aside className="absolute right-5 top-14 z-10 hidden max-h-[calc(100vh-8rem)] w-56 flex-col gap-2 overflow-y-auto rounded-2xl border border-white/15 bg-[#0b1437]/70 p-3 backdrop-blur lg:flex">
        <div className="text-xs font-semibold uppercase tracking-wider text-white/60">Pindahkan karyawan</div>
        {agents.map((a) => (
          <div key={a.emp.id} className="flex items-center gap-2">
            <span className="h-6 w-6 shrink-0 rounded-full border-2 border-white/60" style={{ background: a.emp.shirt }} />
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-sm font-semibold">{a.emp.name}</div>
              <div className="truncate text-[11px] text-white/55">
                {a.emp.role}
                {plans[a.emp.id] && ` · ${plans[a.emp.id]!.active} aktif · ${plans[a.emp.id]!.done} selesai`}
              </div>
            </div>
            <select
              value={manual[a.emp.id] ?? "auto"}
              onChange={(e) => updateManual(a.emp.id, e.target.value === "auto" ? null : (e.target.value as Status))}
              className="rounded-md border border-white/20 bg-white/10 px-1.5 py-1 text-xs text-white outline-none"
            >
              <option value="auto" className="text-slate-900">
                Otomatis
              </option>
              {STATUS_ORDER.map((r) => (
                <option key={r} value={r} className="text-slate-900">
                  {ROOMS[r].short}
                </option>
              ))}
            </select>
          </div>
        ))}
      </aside>

      <button
        onClick={() => setAuto((v) => !v)}
        className={`absolute right-5 top-4 z-20 rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur transition ${
          auto ? "border-emerald-300/60 bg-emerald-500/30" : "border-white/20 bg-white/10"
        }`}
      >
        {auto ? "● Simulasi aktif" : "▶ Mulai simulasi"}
      </button>

      {mode === "home" && (
        <div className="pointer-events-none absolute inset-x-0 top-1/3 z-30 text-center [text-shadow:0_2px_8px_rgba(0,0,0,.7)]">
          <div className="text-2xl font-bold">🌙 Kantor tutup</div>
          <div className="text-sm text-white/70">Sampai jumpa besok</div>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-10 top-0 lg:right-60">
        <Scene agents={agents} counts={counts} clock={clock} filter={filter} hoverId={hoverId} dark={mode === "home"} onHover={setHoverId} onSelect={(id) => toggle(id)} />
      </div>
    </main>
  );
}
