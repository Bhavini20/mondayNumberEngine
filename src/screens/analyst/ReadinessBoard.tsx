import { data } from '../../data';
import { readiness } from '../../engine';
import { rupees } from '../../engine/format';
import { useDemo } from '../../state/demoStore';
import { ConfidenceReasons, Eyebrow, Pill } from '../../components/ui';

export function ReadinessBoard() {
  const { state, input, dispatch } = useDemo();
  const rows = readiness(input);
  const ready = rows.filter((r) => r.ready).length;

  return (
    <div className="screen">
      <header className="screen-head">
        <div>
          <Eyebrow num="01">Readiness</Eyebrow>
          <h2>What’s ready for this week</h2>
          <p className="lede">
            {ready} of {rows.length} channels ready. Report due to founder at 10:00.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => dispatch({ type: 'step', step: 'review' })}>
          Review and send
        </button>
      </header>

      <div className="board">
        {rows.map((r) => (
          <article key={r.id} className={`chan chan-${r.tone}${r.ready ? ' is-ready' : ''}`}>
            <header className="chan-head">
              <div>
                <h3>{r.name}</h3>
                <p className="chan-route">{r.route}</p>
              </div>
              <Pill tone={r.tone}>{r.statusLabel}</Pill>
            </header>

            <div className="chan-figure">
              <span className="chan-figure-label">Consumer sales, {data.report.current_week}</span>
              <span className="chan-figure-value">{r.currentSales != null ? rupees(r.currentSales) : '—'}</span>
            </div>

            <ConfidenceReasons reasons={r.confidence} compact />

            <footer className="chan-actions">
              {r.id === 'blinkit' && state.upload !== 'validated' && (
                <button data-guide="upload-report" className="btn btn-teal btn-sm" onClick={() => dispatch({ type: 'step', step: 'upload' })}>
                  {state.upload === 'none' ? 'Upload report' : 'Fix upload'}
                </button>
              )}
              {r.id === 'instamart' &&
                (state.reminderSent ? (
                  <p className="confirm" role="status">
                    Reminder sent to the Instamart channel owner. The report is still missing.
                  </p>
                ) : (
                  <button className="btn btn-secondary btn-sm" onClick={() => dispatch({ type: 'remind' })}>
                    Remind channel owner
                  </button>
                ))}
              <button className="btn btn-outline btn-sm btn-details" onClick={() => dispatch({ type: 'openGap', channel: r.id })}>
                View details <span aria-hidden="true">→</span>
              </button>
            </footer>
          </article>
        ))}
      </div>
    </div>
  );
}
