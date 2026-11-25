import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { ConfidenceReason, Tone } from '../engine';
import { lakhs } from '../engine/format';

export function Pill({ tone, children }: { tone: Tone | 'neutral'; children: ReactNode }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

export function Dot({ tone }: { tone: Tone }) {
  return <span className={`dot dot-${tone}`} aria-hidden="true" />;
}

export function ConfidenceReasons({ reasons, compact }: { reasons: ConfidenceReason[]; compact?: boolean }) {
  return (
    <dl className={`reasons${compact ? ' reasons-compact' : ''}`}>
      {reasons.map((r) => (
        <div key={r.label} className="reason">
          <dt>
            <Dot tone={r.tone} />
            {r.label}
          </dt>
          <dd>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

interface SparkPoint {
  week: string;
  value: number | null;
}

/** 4-week trend. `hatched` marks sell-in so it never reads like consumer sales. */
export function Sparkline({
  points,
  weeks,
  domain,
  hatched,
  label,
}: {
  points: SparkPoint[];
  weeks: string[];
  domain?: [number, number];
  hatched?: boolean;
  label: string;
}) {
  const w = 132;
  const h = 40;
  const pad = 5;
  const vals = points.map((p) => p.value).filter((v): v is number => v != null);
  if (!vals.length) return <span className="muted">No trend</span>;
  const [lo, hi] = domain ?? [Math.min(...vals), Math.max(...vals)];
  const span = hi - lo || 1;
  const x = (i: number) => pad + (i * (w - pad * 2)) / (weeks.length - 1);
  const y = (v: number) => h - pad - ((v - lo) / span) * (h - pad * 2);
  const coords = points
    .filter((p) => p.value != null)
    .map((p) => [x(weeks.indexOf(p.week)), y(p.value!)] as const);
  const d = coords.map(([cx, cy], i) => `${i ? 'L' : 'M'}${cx.toFixed(1)},${cy.toFixed(1)}`).join(' ');
  const last = coords[coords.length - 1];
  const desc = points.map((p) => `${p.week} ${p.value == null ? 'no data' : lakhs(p.value)}`).join(', ');
  return (
    <svg className={`spark${hatched ? ' spark-hatched' : ''}`} viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img" aria-label={`${label}: ${desc}`}>
      {weeks.map((wk, i) => (
        <line key={wk} x1={x(i)} x2={x(i)} y1={pad} y2={h - pad} className="spark-grid" />
      ))}
      <path d={d} className="spark-line" />
      {coords.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={i === coords.length - 1 ? 3.2 : 1.8} className="spark-dot" />
      ))}
      {last && coords.length < weeks.length && (
        <circle cx={x(weeks.length - 1)} cy={h / 2} r={3} className="spark-missing" />
      )}
    </svg>
  );
}

export function Toggle({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className="toggle">
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track" aria-hidden="true">
        <span className="toggle-thumb" />
      </span>
      <span>{children}</span>
    </label>
  );
}

export function Drawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="drawer-scrim" onClick={onClose}>
      <div
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={ref}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawer-head">
          <h2>{title}</h2>
          <button className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="drawer-body">{children}</div>
      </div>
    </div>
  );
}

/** Tweens between values so changes are visible, not just swapped. */
export function AnimatedNumber({ value, format, duration = 650 }: { value: number; format: (n: number) => string; duration?: number }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || from.current === value) {
      from.current = value;
      setShown(value);
      return;
    }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / duration);
      const e = 1 - Math.pow(1 - k, 3);
      setShown(a + (value - a) * e);
      if (k < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      from.current = value;
    };
  }, [value, duration]);
  return <>{format(shown)}</>;
}

/** "01 ──── THE PROBLEM" */
export function Eyebrow({ num, children }: { num?: string; children: ReactNode }) {
  return (
    <p className="eyebrow">
      {num && <span className="eyebrow-num">{num}</span>}
      {num && <span className="eyebrow-rule" aria-hidden="true" />}
      <span>{children}</span>
    </p>
  );
}
