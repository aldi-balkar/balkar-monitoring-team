"use client";

import { useEffect, useRef, useState } from "react";
import { ROOMS, STATUS_ORDER, type Employee, type Status } from "@/lib/data";
import { P } from "@/lib/iso";
import { SLOTS, TABLES } from "@/lib/layout";
import Sprite from "./Sprite";
import { FURNITURE, Island, RoomFloor, Tag, Wall, WallDecor, WarWalls, KantinWalls, type Item } from "./World";

export type Pt = { x: number; y: number };
export type Agent = {
  emp: Employee;
  room: Status;
  slot: number;
  x: number;
  y: number;
  path: Pt[];
  msg: string;
  bubbleUntil: number;
  idle?: boolean; // berdiri di pinggir ruang kerja (belum ada subtask aktif)
  pinned?: string; // pesan tetap dari Jira / jadwal
  gone?: boolean; // sudah pulang (tidak tampak)
};

export type Filter = "all" | Status | string;

const LABEL_POS: Record<Status, [number, number, number]> = {
  kerja: [0, 0, 112],
  review: [9, 0, 112],
  spv: [0, 9, 112],
  cuti: [17, 17, -34],
  sakit: [29, 0, 112],
  warroom: [20, 0, 112],
  kantin: [20, 9, 112],
};

/** Urutan gambar karakter relatif terhadap meja besar (objek besar tidak cocok diurut dengan titik tengah). */
function agentKey(x: number, y: number) {
  const k = x + y + 0.02;
  for (const t of TABLES) {
    if (x > t.x - 0.4 && x < t.x + t.w + 0.4) {
      if (y < t.y && y > t.y - 2.5) return Math.min(k, t.key - 0.5 + x * 0.001);
      if (y > t.y + t.d && y < t.y + t.d + 2.5) return Math.max(k, t.key + 0.5 + x * 0.001);
    }
  }
  return k;
}

export default function Scene({
  agents,
  counts,
  clock,
  filter,
  hoverId,
  dark,
  onHover,
  onSelect,
}: {
  agents: Agent[];
  counts: Record<Status, number>;
  clock: number;
  filter: Filter;
  hoverId: string | null;
  dark?: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState({ k: 1, x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);

  const zoomAt = (px: number, py: number, f: number) =>
    setView((v) => {
      const k = Math.min(5, Math.max(0.7, v.k * f));
      const r = k / v.k;
      return { k, x: px - (px - v.x) * r, y: py - (py - v.y) * r };
    });

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
      zoomAt(p.x, p.y, Math.exp(-e.deltaY * 0.0015));
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, []);

  const filterAgent = agents.find((a) => a.emp.id === filter);
  const roomDim = (r: Status) =>
    filter !== "all" && !(filter === r || (filterAgent && filterAgent.room === r));
  const agentDim = (a: Agent) => filter !== "all" && !(filter === a.room || filter === a.emp.id);

  const dims = Object.fromEntries(STATUS_ORDER.map((r) => [r, roomDim(r)])) as Record<Status, boolean>;

  const charItems: Item[] = agents.map((a, i) => {
    const walking = a.path.length > 0;
    const slot = SLOTS[a.room][a.slot];
    const [sx, sy] = P(a.x, a.y);
    const hl = hoverId === a.emp.id || filter === a.emp.id;
    return {
      id: 1000 + i,
      key: agentKey(a.x, a.y),
      room: null,
      node: (
        <g
          transform={`translate(${sx.toFixed(1)} ${sy.toFixed(1)})`}
          opacity={a.gone ? 0 : agentDim(a) ? 0.3 : 1}
          style={{ cursor: "pointer", transition: "opacity .6s", pointerEvents: a.gone ? "none" : undefined }}
          onMouseEnter={() => onHover(a.emp.id)}
          onMouseLeave={() => onHover(null)}
          onClick={() => onSelect(a.emp.id)}
        >
          <Sprite emp={a.emp} pose={walking ? "walk" : slot.pose} seat={slot.seat} away={!walking && !!slot.away} highlight={hl} />
          
          {!walking && slot.pose === "sleep" && (
            <g className="zzz-wrap" transform="translate(14 -76)">
              {["z", "Z", "z"].map((c, k) => (
                <text key={k} className="zzz" x={k * 6} y={-k * 7} fontSize={9 + k * 2} fontWeight={800} fill="#a7f3d0" style={{ animationDelay: `${k * 0.6}s` }}>
                  {c}
                </text>
              ))}
            </g>
          )}
        </g>
      ),
    };
  });

  const all = [...FURNITURE.map((f) => ({
      ...f,
      node: (
        <g opacity={f.room && dims[f.room] ? 0.3 : 1} style={{ transition: "opacity .3s" }}>
          {f.node}
        </g>
      ),
    })), ...charItems].sort(
    (a, b) => a.key - b.key,
  );

  return (
    <div className="relative h-full w-full">
    <svg
      ref={svgRef}
      viewBox="-600 -150 1520 910"
      className="h-full w-full cursor-grab touch-none select-none active:cursor-grabbing"
      style={{ filter: dark ? "brightness(0.28) saturate(0.55)" : "none", transition: "filter 1.2s" }}
      preserveAspectRatio="xMidYMid meet"
      onDoubleClick={() => setView({ k: 1, x: 0, y: 0 })}
      onPointerDown={(e) => {
        drag.current = { x: e.clientX, y: e.clientY, moved: false };
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d) return;
        const dx = e.clientX - d.x;
        const dy = e.clientY - d.y;
        if (!d.moved) {
          if (Math.hypot(dx, dy) < 5) return;
          d.moved = true;
          e.currentTarget.setPointerCapture(e.pointerId);
        }
        const scale = e.currentTarget.getScreenCTM()?.a ?? 1;
        d.x = e.clientX;
        d.y = e.clientY;
        setView((v) => ({ ...v, x: v.x + dx / scale, y: v.y + dy / scale }));
      }}
      onPointerUp={() => {
        drag.current = null;
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
    >
      <defs>
        <radialGradient id="glow">
          <stop offset="0" stopColor="#3b82f6" stopOpacity={0.55} />
          <stop offset="1" stopColor="#3b82f6" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="lamp">
          <stop offset="0" stopColor="#fde68a" stopOpacity={0.7} />
          <stop offset="1" stopColor="#fde68a" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e4d9c8" />
          <stop offset="1" stopColor="#c8bdb0" />
        </linearGradient>
        <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bfe3ff" stopOpacity={0.55} />
          <stop offset="1" stopColor="#6fa8ff" stopOpacity={0.25} />
        </linearGradient>
      </defs>

      <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
      <Island />
      {STATUS_ORDER.map((r) => (
        <RoomFloor key={r} room={r} dim={dims[r]} />
      ))}
      <Wall axis="x" dim={dims} />
      <Wall axis="y" dim={dims} />
      <WallDecor />
      <WarWalls dim={dims.warroom} />
      <KantinWalls dim={dims.kantin} />

      {all.map((it) => (
        <g key={it.id}>{it.node}</g>
      ))}

      {/* nametag selalu di atas furniture */}
      {agents.filter((a) => !a.gone).map((a) => {
        const [sx, sy] = P(a.x, a.y);
        return (
          <g key={a.emp.id} transform={`translate(${sx.toFixed(1)} ${(sy + 4).toFixed(1)})`} opacity={agentDim(a) ? 0.3 : 1} style={{ pointerEvents: "none", transition: "opacity .3s" }}>
            <Tag name={a.emp.badge ? `${a.emp.name} · ${a.emp.badge}` : a.emp.name} dot={ROOMS[a.room].accent} />
          </g>
        );
      })}

      {/* gelembung chat */}
      {agents.map((a) => {
        const show = a.bubbleUntil > clock || a.idle || hoverId === a.emp.id || filter === a.emp.id;
        if (!show || a.gone || agentDim(a)) return null;
        const [sx, sy] = P(a.x, a.y);
        const w = Math.max(70, a.msg.length * 6.4 + 16);
        return (
          <g key={a.emp.id} transform={`translate(${sx.toFixed(1)} ${(sy - 90).toFixed(1)})`} className="bubble-in" style={{ pointerEvents: "none" }}>
            <rect x={-w / 2} y={-24} width={w} height={24} rx={12} fill="#fff" stroke="#cbd5e1" />
            <polygon points="-5,0 5,0 0,7" fill="#fff" />
            <text y={-8} textAnchor="middle" fontSize={11} fontWeight={600} fill="#1e293b">
              {a.msg}
            </text>
          </g>
        );
      })}

      {/* label ruangan */}
      {STATUS_ORDER.map((r) => {
        const [lx, ly] = P(...LABEL_POS[r]);
        const meta = ROOMS[r];
        return (
          <g key={r} transform={`translate(${lx} ${ly})`} opacity={dims[r] ? 0.4 : 1} style={{ transition: "opacity .3s", pointerEvents: "none" }}>
            <rect x={-70} y={-13} width={140} height={26} rx={13} fill="#0b1437" fillOpacity={0.82} stroke={meta.accent} strokeWidth={1.5} />
            <circle cx={-55} cy={0} r={4.5} fill={meta.accent} />
            <text x={-45} y={4} fontSize={12} fontWeight={700} fill="#fff">
              {meta.label}
            </text>
            <rect x={46} y={-9} width={19} height={18} rx={9} fill={meta.accent} />
            <text x={55.5} y={4} textAnchor="middle" fontSize={11} fontWeight={800} fill="#0b1437">
              {counts[r]}
            </text>
          </g>
        );
      })}
      </g>
    </svg>
    <div className="absolute bottom-4 right-5 z-20 flex flex-col overflow-hidden rounded-xl border border-white/20 bg-[#0b1437]/70 backdrop-blur">
      {[
        { l: "+", t: "Perbesar", f: () => zoomAt(0, 230, 1.3) },
        { l: "−", t: "Perkecil", f: () => zoomAt(0, 230, 1 / 1.3) },
        { l: "⟲", t: "Reset tampilan", f: () => setView({ k: 1, x: 0, y: 0 }) },
      ].map((b) => (
        <button key={b.l} title={b.t} onClick={b.f} className="h-9 w-9 text-lg font-bold text-white transition hover:bg-white/15">
          {b.l}
        </button>
      ))}
    </div>
    <div className="pointer-events-none absolute bottom-4 left-5 hidden rounded-full bg-[#0b1437]/60 px-3 py-1 text-xs text-white/60 lg:block">
      Scroll untuk zoom · seret untuk geser · klik 2× untuk reset
    </div>
    </div>
  );
}
