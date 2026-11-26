import { data, PREV } from '../../data';
import { headline, type EngineInput } from '../../engine';
import { lakhs, longDate, pct, rupees } from '../../engine/format';
import { AnimatedNumber, Eyebrow } from '../../components/ui';

export function ReportHeader({ input }: { input: EngineInput }) {
  const h = headline(input);
  return (
    <section className="rhead" aria-labelledby="headline-title">
      <div className="rhead-meta">
        <Eyebrow>Monday report · {longDate(data.report.report_date)}</Eyebrow>
        {h.incomplete && <span className="tagchip tag-amber">INCOMPLETE</span>}
      </div>

      <h1 id="headline-title" className="rhead-label">
        Consumer sales last week
      </h1>
      <div className="rhead-figs">
        <span className="rhead-num">
          <AnimatedNumber value={h.current} format={lakhs} />
        </span>
        <span className={`rhead-wow ${h.wowPct >= 0 ? 'is-right' : 'is-wrong'}`}>
          <AnimatedNumber value={h.wowPct} format={(n) => pct(n)} />
          <small>week-on-week</small>
        </span>
      </div>
      <p className="rhead-exact">
        {rupees(h.current)} against {rupees(h.previous)} in {PREV}, restated
      </p>

      <div className={`strip${h.incomplete ? ' is-incomplete' : ''}`}>
        <p className="strip-text">{h.strip.join(' · ')}</p>
        <p className="strip-note">
          {h.comparisonNote} {h.exclusionNote} {h.basisNote}
        </p>
      </div>

      <p className="definition">
        Consumer sales: what consumers bought, net of discounts and returns, excluding GST, Monday to Sunday IST. Purchase
        orders from platforms are never included.
      </p>
    </section>
  );
}
