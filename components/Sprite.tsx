import type { Employee } from "@/lib/data";
import type { Pose } from "@/lib/layout";

export type SpritePose = Pose | "walk";

/** Karakter kartun chibi. Titik (0,0) = telapak kaki. */
export default function Sprite({
  emp,
  pose,
  seat = 10,
  highlight,
  away = false,
}: {
  emp: Employee;
  pose: SpritePose;
  seat?: number;
  highlight?: boolean;
  /** Membelakangi kamera (duduk di sisi depan meja, menghadap meja). */
  away?: boolean;
}) {
  const sitting = pose === "desk" || pose === "sit" || pose === "sleep" || pose === "eat";
  const asleep = pose === "sleep";
  const shift = sitting ? 15 - seat : 0;
  const typing = pose === "desk" || pose === "sit" || pose === "eat"; // tangan di atas meja

  return (
    <g className={`spr ${pose}`} transform="scale(1.22)">
      <ellipse cx={0} cy={0} rx={13} ry={5} fill="#0b1437" opacity={0.28} />
      {highlight && <ellipse cx={0} cy={0} rx={17} ry={7} fill="none" stroke="#fff" strokeWidth={2} />}
      <g transform={`translate(0 ${shift})`}>
        <g className="bob">
          {!sitting && (
            <>
              <g className="leg-a">
                <rect x={-6.5} y={-17} width={5.5} height={14} rx={2.5} fill="#334155" />
                <rect x={-7.5} y={-4.5} width={8} height={4.5} rx={2.2} fill="#111827" />
              </g>
              <g className="leg-b">
                <rect x={1} y={-17} width={5.5} height={14} rx={2.5} fill="#334155" />
                <rect x={-0.5} y={-4.5} width={8} height={4.5} rx={2.2} fill="#111827" />
              </g>
            </>
          )}

          {emp.longHair && <rect x={-13.5} y={-54} width={27} height={26} rx={10} fill={emp.hair} />}

          {/* badan */}
          <rect x={-9.5} y={-37} width={19} height={22} rx={7} fill={emp.shirt} />
          <rect x={-3} y={-37} width={6} height={4} rx={2} fill="#fff" opacity={0.85} />
          {emp.tie && !away && <path d="M0 -34L3 -30L1.6 -20L0 -17L-1.6 -20L-3 -30Z" fill={emp.tie} />}

          {/* lengan */}
          {typing ? (
            <>
              {/* lengan menekuk ke depan, tangan di atas meja */}
              {[-1, 1].map((d) => (
                <g key={d} className={d < 0 ? "arm-a" : "arm-b"}>
                  <path d={`M${d * 11.5} -32L${d * (away ? 12.5 : 7.5)} ${away ? -25 : -23}`} stroke={emp.shirt} strokeWidth={5.5} strokeLinecap="round" />
                  <circle className={d < 0 ? "hand-a" : "hand-b"} cx={d * (away ? 12.5 : 7.5)} cy={away ? -24 : -22} r={3} fill={emp.skin} />
                </g>
              ))}
            </>
          ) : (
            <>
              <g className="arm-a">
                <rect x={-14} y={-35} width={5.5} height={15} rx={2.7} fill={emp.shirt} />
                <circle className="hand-a" cx={-11.2} cy={-19.5} r={3} fill={emp.skin} />
              </g>
              <g className="arm-b">
                <rect x={8.5} y={-35} width={5.5} height={15} rx={2.7} fill={emp.shirt} />
                <circle className="hand-b" cx={11.2} cy={-19.5} r={3} fill={emp.skin} />
              </g>
            </>
          )}

          {pose === "sit" && (
            <g className="paper">
              <rect x={3} y={-35} width={14} height={18} rx={1.5} fill="#fff" stroke="#cbd5e1" />
              <path d="M6 -30h8M6 -26h8M6 -22h5" stroke="#94a3b8" strokeWidth={1.3} />
              <path d="M12 -21l1.8 1.8 3.2-3.6" stroke="#22c55e" strokeWidth={1.4} fill="none" strokeLinecap="round" />
            </g>
          )}

          {/* kepala */}
          <g className="head">
            <circle cx={0} cy={-46} r={12.5} fill={away ? emp.hair : emp.skin} />
            <path d="M-13 -46C-14 -64 14 -64 13 -46C10 -54 -10 -54 -13 -46Z" fill={emp.hair} />
            {away ? null : asleep ? (
              <>
                <path d="M-7.5 -45q3 2.6 6 0M1.5 -45q3 2.6 6 0" stroke="#334155" strokeWidth={1.7} fill="none" strokeLinecap="round" />
                <ellipse cx={0} cy={-39} rx={1.8} ry={2.2} fill="#c27a6a" />
              </>
            ) : (
              <>
                <g className="eyes">
                  <ellipse cx={-4.8} cy={-45} rx={1.9} ry={2.5} fill="#1e293b" />
                  <ellipse cx={4.8} cy={-45} rx={1.9} ry={2.5} fill="#1e293b" />
                  <circle cx={-4.2} cy={-46} r={0.7} fill="#fff" />
                  <circle cx={5.4} cy={-46} r={0.7} fill="#fff" />
                </g>
                <path d="M-3.5 -39.5q3.5 3.2 7 0" stroke="#b4584a" strokeWidth={1.6} fill="none" strokeLinecap="round" />
              </>
            )}
            {emp.glasses && !away && (
              <g stroke="#1e293b" strokeWidth={1.2} fill="#bae6fd" fillOpacity={0.35}>
                <circle cx={-4.8} cy={-45} r={3.6} />
                <circle cx={4.8} cy={-45} r={3.6} />
                <path d="M-1.2 -45h2.4" fill="none" />
              </g>
            )}
            {emp.headphones && (
              <g>
                <path d="M-12.5 -47C-13 -64 13 -64 12.5 -47" stroke="#111827" strokeWidth={2.4} fill="none" />
                <rect x={-15} y={-50} width={5} height={10} rx={2.5} fill="#ef4444" />
                <rect x={10} y={-50} width={5} height={10} rx={2.5} fill="#ef4444" />
              </g>
            )}
            {!away && (
              <>
                <circle cx={-8} cy={-41} r={2.2} fill="#fb7185" opacity={0.35} />
                <circle cx={8} cy={-41} r={2.2} fill="#fb7185" opacity={0.35} />
              </>
            )}
            {pose === "stand" && <path className="sweat" d="M11 -56q3 4 0 6q-3 -2 0 -6Z" fill="#7dd3fc" />}
          </g>
        </g>
      </g>
    </g>
  );
}
