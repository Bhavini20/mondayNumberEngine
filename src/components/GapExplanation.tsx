import type { ChannelId } from '../data';
import { gapCheck, type EngineInput } from '../engine';
import { rupees, signedRupees, plainPct, pct } from '../engine/format';
import { ConfidenceReasons, Pill } from './ui';

/** Shared by the analyst's gap check (A4) and the founder's "why numbers differ" panel (F4). */
export function GapExplanation({
  channel,
  input,
  audience,
}: {
  channel: ChannelId;
  input: EngineInput;
  audience: 'analyst' | 'founder';
}) {
  const g = gapCheck(channel, input);

  return (
    <div className="gap">
      {!g.available ? (
        <div className="gap-empty">
          <p className="gap-empty-title">{g.name}: no comparison this week</p>
          <p>{g.unavailableReason}</p>
        </div>
      ) : (
        <>
          <div className="bridge">
            <div className="bridge-row bridge-start">
              <span className="bridge-label">
                {g.name}'s own figure
                <small>{g.platformLabel}</small>
              </span>
              <span className="bridge-amt">{rupees(g.platform)}</span>
            </div>
            {g.reasons.map((r, i) => (
              <div key={i} className={`bridge-row bridge-step${r.unexplained ? ' bridge-unexplained' : ''}`}>
                <span className="bridge-label">{r.text}</span>
                <span className={`bridge-amt ${r.amount < 0 ? 'neg' : 'pos'}`}>{signedRupees(r.amount)}</span>
              </div>
            ))}
            {g.matches && (
              <div className="bridge-row bridge-step">
                <span className="bridge-label">No adjustments needed. Our figure matches the platform's.</span>
                <span className="bridge-amt">{rupees(0)}</span>
              </div>
            )}
            <div className="bridge-row bridge-end">
              <span className="bridge-label">
                {audience === 'founder' ? 'Consumer sales in your report' : 'Our number: consumer sales'}
                <small>Net of discounts and returns, excluding GST, Mon–Sun IST</small>
              </span>
              <span className="bridge-amt">{rupees(g.ours)}</span>
            </div>
          </div>

          <p className="gap-verdict">
            {g.matches && g.basisUnverified ? (
              <>Matches the platform’s figure (basis unverified).</>
            ) : g.unexplained === 0 ? (
              <>
                <Pill tone="ok">Fully explained</Pill>
                {g.matches
                  ? ' Nothing to reconcile.'
                  : ` Every rupee of the ${rupees(Math.abs(g.difference))} difference has a reason.`}
              </>
            ) : g.withinTolerance ? (
              <>
                <Pill tone="warn">Within tolerance</Pill> {rupees(Math.abs(g.unexplained))} unexplained (
                {plainPct(g.unexplainedPct)} of {g.name}'s figure), inside the ±{g.tolerancePct}% limit for a material gap.
              </>
            ) : (
              <>
                <Pill tone="bad">Material gap</Pill> {rupees(Math.abs(g.unexplained))} unexplained (
                {plainPct(g.unexplainedPct)}), beyond the ±{g.tolerancePct}% limit.
              </>
            )}
          </p>
        </>
      )}

      {g.restatement && (
        <div className="restatement">
          <h3>Last week's number changed</h3>
          <div className="restatement-figures">
            <div>
              <span className="muted">{g.restatement.week} as sent</span>
              <s>{rupees(g.restatement.as_sent)}</s>
            </div>
            <div>
              <span className="muted">{g.restatement.week} now</span>
              <strong>{rupees(g.restatement.restated)}</strong>
            </div>
            <div>
              <span className="muted">Change</span>
              <strong className="neg">
                {signedRupees(g.restatement.change)} ({pct((g.restatement.change / g.restatement.as_sent) * 100)})
              </strong>
            </div>
          </div>
          <p>
            {audience === 'founder'
              ? `Last week's Shopify figure was sent to you as ${rupees(g.restatement.as_sent)}. It's now ${rupees(g.restatement.restated)}, because ${rupees(-g.restatement.change)} of refunds came in this week on orders placed last week. We credit refunds to the week of the original order, so this week's growth is measured against the corrected figure.`
              : `${g.restatement.reason} Week-on-week uses the restated figure.`}
          </p>
        </div>
      )}

      <dl className="facts">
        <div>
          <dt>Data arrives by</dt>
          <dd>{g.route}</dd>
        </div>
        <div>
          <dt>Date basis</dt>
          <dd>{g.dateBasis}</dd>
        </div>
        <div>
          <dt>City means</dt>
          <dd>{g.cityTypeLabel}</dd>
        </div>
      </dl>

      <h3 className="gap-sub">How sure we are</h3>
      <ConfidenceReasons reasons={g.confidence} />
    </div>
  );
}
