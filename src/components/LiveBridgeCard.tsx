import { useEffect, useState } from 'react';
import { CUR, weekLabel } from '../data';
import { bridgeStages } from '../engine';
import { lakhs, pct } from '../engine/format';
import { AnimatedNumber } from './ui';

const stages = bridgeStages();
const MAX = Math.max(...stages.map((s) => s.current));

/** Hero card: walks from the old Excel number to the engine's number, one correction at a time. */
export function LiveBridgeCard() {
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const t = window.setInterval(() => setI((x) => (x + 1) % stages.length), 3200);
    return () => window.clearInterval(t);
  }, [auto]);

  const s = stages[i];
  const isEngine = s.key === 'engine';
  const old = stages[0];
  const eng = stages[stages.length - 1];

  return (
    <div className="live-wrap">
      <div className="live-shadow" aria-hidden="true" />
      <article className="live" aria-label="From the old Excel number to the Monday Number Engine">
        <header className="live-head">
          <span className="live-status">
            <span className="live-dot" aria-hidden="true" />
            Live reading
          </span>
          <span className="tagchip">W4 · {weekLabel(CUR)}</span>
        </header>

        <p className="live-kicker">Namak Street · consumer sales, week-on-week</p>
        <div className="live-figs" aria-live="polite">
          <span className={`live-num${isEngine ? ' is-engine' : ''}`}>
            <AnimatedNumber value={s.current} format={lakhs} />
          </span>
          <span className={`live-wow ${s.key === 'old' ? 'is-wrong' : 'is-right'}`}>
            <AnimatedNumber value={s.wowPct} format={(n) => pct(n)} />
          </span>
        </div>

        <div className="stack" aria-hidden="true">
          {s.parts.map((p) => (
            <span
              key={p.id}
              className={`stack-seg seg-${p.id}${p.kind === 'po' ? ' is-po' : ''}`}
              style={{ width: `${(p.value / MAX) * 100}%` }}
            />
          ))}
        </div>
        <div className="stack-legend">
          {s.parts.map((p) => (
            <span key={p.id} className={p.kind === 'po' ? 'is-po' : ''}>
              <i className={`sw seg-${p.id}${p.kind === 'po' ? ' is-po' : ''}`} />
              {p.name}
              {p.kind === 'po' ? ' POs' : ''}
            </span>
          ))}
        </div>

        <div className="chips" role="tablist" aria-label="Corrections">
          {stages.map((st, k) => (
            <button
              key={st.key}
              role="tab"
              aria-selected={k === i}
              className={`chip${k === i ? ' is-on' : ''}`}
              onClick={() => {
                setAuto(false);
                setI(k);
              }}
            >
              {st.chip}
            </button>
          ))}
        </div>
        <p className="live-note">{s.note}</p>

        <p className="codebox">
          Old Excel: {lakhs(old.current)} {pct(old.wowPct)} → Engine: {lakhs(eng.current)} {pct(eng.wowPct)}
        </p>
      </article>
    </div>
  );
}
