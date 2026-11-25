import { data, CUR, PREV, type ChannelId } from '../../data';
import { headline, oldExcelView, poTrap, numberWord, restatement, type EngineInput } from '../../engine';
import { lakhs, pct, rupees } from '../../engine/format';
import { useDemo } from '../../state/demoStore';
import { Toggle } from '../../components/ui';

function Bar({ label, value, max, po }: { label: string; value: number; max: number; po?: boolean }) {
  return (
    <div className="pbar">
      <span className="pbar-label">{label}</span>
      <span className="pbar-track">
        <span className={`pbar-fill${po ? ' is-po' : ''}`} style={{ width: `${(value / max) * 100}%` }} />
      </span>
      <span className="pbar-amt">{lakhs(value)}</span>
    </div>
  );
}

export function PoTrapCard({ input, onWhy }: { input: EngineInput; onWhy: (id: ChannelId) => void }) {
  const { state, dispatch } = useDemo();
  const showOld = state.showOldExcel;
  const p = poTrap();
  const old = oldExcelView();
  const h = headline(input);
  const r = restatement();
  const blinkitIn = h.included.includes(data.po_trap.channel);
  const max = Math.max(p.sellInCurrent, p.sellInPrevious, p.sellThroughCurrent, p.sellThroughPrevious);

  return (
    <div className="live-wrap">
      <div className="live-shadow" aria-hidden="true" />
      <section className="live trap" aria-labelledby="trap-title">
        <header className="live-head">
          <span className="live-status">
            <span className="live-dot is-red" aria-hidden="true" />
            The reading that matters this week
          </span>
          <span className="tagchip tag-red">PO TRAP</span>
        </header>

        <h2 id="trap-title" className="trap-title">
          {p.channel} purchase orders {pct(p.sellInWowPct)}.{' '}
          {blinkitIn ? `${p.channel} consumer sales ${pct(p.sellThroughWowPct)}.` : `${p.channel} consumer sales aren’t confirmed.`}
        </h2>
        <p className="trap-text">
          {p.channel} placed a large restock order. That’s stock moving into {p.channel}’s warehouses, not consumers buying
          more.{!blinkitIn && ' Its sales report wasn’t complete, so it’s left out of this report.'}
        </p>

        <div className="trap-bars">
          <p className="pbar-head">Consumer sales · in your number</p>
          {blinkitIn ? (
            <>
              <Bar label={PREV} value={p.sellThroughPrevious} max={max} />
              <Bar label={CUR} value={p.sellThroughCurrent} max={max} />
            </>
          ) : (
            <p className="small muted">Not in this report.</p>
          )}
          <p className="pbar-head">Purchase orders (sell-in) · never in your number</p>
          <Bar label={PREV} value={p.sellInPrevious} max={max} po />
          <Bar label={CUR} value={p.sellInCurrent} max={max} po />
        </div>

        <div className="trap-foot">
          <span data-guide="old-excel">
            <Toggle checked={showOld} onChange={(v) => dispatch({ type: 'oldExcel', on: v })}>
              Show what the old Excel would have said
            </Toggle>
          </span>
        </div>

        {showOld && (
          <div className="versus">
            <div className="versus-old">
              <p className="versus-name">Old Excel</p>
              <p className="versus-num">{lakhs(old.current)}</p>
              <p className="versus-wow is-wrong">{pct(old.wowPct)}</p>
              <p className="versus-sub">
                {p.channel} {pct(old.blinkitWowPct)}
              </p>
            </div>
            <div className="versus-new">
              <p className="versus-name">Monday Number Engine</p>
              <p className="versus-num">{lakhs(h.current)}</p>
              <p className="versus-wow is-right">{pct(h.wowPct)}</p>
              <p className="versus-sub">
                {blinkitIn
                  ? `${p.channel} consumer sales ${pct(p.sellThroughWowPct)}`
                  : `${numberWord(h.included.length)} channels, ${p.channel} left out`}
              </p>
            </div>
            <p className="codebox versus-why">
              Old Excel added {p.channel} POs ({rupees(p.sellInCurrent)}) to consumer sales and used {r.week}{' '}
              {r.channelName} as sent ({rupees(r.as_sent)}, now {rupees(r.restated)}).
            </p>
          </div>
        )}

        <button className="linklike trap-why" onClick={() => onWhy(data.po_trap.channel)}>
          Why {p.channel}’s numbers differ →
        </button>
      </section>
    </div>
  );
}
