import { data, type ChannelId } from '../../data';
import { channelGrowth, CITY_TYPE_SHORT, type EngineInput } from '../../engine';
import { pct, rupees } from '../../engine/format';
import { Eyebrow, Pill, Sparkline } from '../../components/ui';

const WEEKS = data.weeks.map((w) => w.id);

export function ChannelGrowth({ input, onWhy }: { input: EngineInput; onWhy: (id: ChannelId) => void }) {
  const rows = channelGrowth(input);

  return (
    <section className="block" aria-labelledby="growth-title">
      <div className="block-head">
        <Eyebrow num="01">Channels</Eyebrow>
        <h2 id="growth-title" className="display">Which channel is really growing</h2>
        <p className="muted">Consumer sales by channel, this week and the last four weeks.</p>
      </div>

      <div className="growth">
        {rows.map((r) => (
          <div key={r.id} className={`grow-row${r.ready ? '' : ' is-out'}`}>
            <div className="grow-main">
              <div className="grow-name">
                <strong>{r.name}</strong>
                <span className="city-tag" title={r.cityTypeLabel}>
                  {CITY_TYPE_SHORT[r.cityType]}
                </span>
              </div>
              <div className="grow-num">
                {r.ready ? rupees(r.current!) : <Pill tone={r.tone}>{r.statusLabel}</Pill>}
              </div>
              <div className={`grow-wow ${r.wowPct != null ? (r.wowPct >= 0 ? 'up' : 'down') : ''}`}>
                {r.wowPct != null ? pct(r.wowPct) : '—'}
              </div>
              <div className="grow-spark">
                <Sparkline points={r.trend} weeks={WEEKS} label={`${r.name} consumer sales trend`} />
              </div>
              <button className="linklike grow-why" onClick={() => onWhy(r.id)}>
                Why it differs
              </button>
            </div>

            {r.sellIn && (
              <div className="grow-sellin">
                <div className="grow-name">
                  <span>Purchase orders (sell-in)</span>
                  <span className="small muted">Not part of consumer sales</span>
                </div>
                <div className="grow-num">{rupees(r.sellIn.current)}</div>
                <div className="grow-wow">{pct(r.sellIn.wowPct)}</div>
                <div className="grow-spark">
                  <Sparkline points={r.sellIn.trend} weeks={WEEKS} hatched label="Blinkit purchase orders trend" />
                </div>
                <span />
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="small muted">Trend covers {data.weeks[0].label} to {data.weeks[data.weeks.length - 1].label}. A hollow dot means no data that week.</p>
    </section>
  );
}
