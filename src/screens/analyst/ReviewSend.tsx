import { headline, openIssues, readiness } from '../../engine';
import { lakhs, listJoin, pct, rupees } from '../../engine/format';
import { sameInput, useDemo } from '../../state/demoStore';
import { Dot, Eyebrow, Pill } from '../../components/ui';

export function ReviewSend() {
  const { state, input, dispatch } = useDemo();
  const rows = readiness(input);
  const h = headline(input);
  const issues = openIssues(input);
  const missingNames = h.notReady.map((n) => n.name);
  const changedSinceSent = state.sent != null && !sameInput(state.sent, input);

  const verb = changedSinceSent ? 'Send updated report' : 'Send';
  const sendLabel = h.incomplete
    ? `${verb} as incomplete (${listJoin(missingNames)} missing)`
    : changedSinceSent
      ? verb
      : 'Send report';

  return (
    <div className="screen">
      <header className="screen-head">
        <div>
          <Eyebrow num="05">Send</Eyebrow>
          <h2>Review and send</h2>
          <p className="lede">A report with a hole in it can be sent, but it can’t look complete.</p>
        </div>
      </header>

      <div className="review">
        <section className="review-col">
          <h3>Channels</h3>
          <ul className="checklist">
            {rows.map((r) => (
              <li key={r.id}>
                <Dot tone={r.ready ? 'ok' : r.tone} />
                <span className="checklist-name">{r.name}</span>
                <span className="muted">{r.ready ? 'Included' : `${r.statusLabel}, left out`}</span>
              </li>
            ))}
          </ul>

          <h3>Open issues</h3>
          {issues.length ? (
            <ul className="issues">
              {issues.map((i, k) => (
                <li key={k} className={`issue issue-${i.tone}`}>
                  {i.text}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">None.</p>
          )}
        </section>

        <section className="review-col review-preview">
          <h3>What the founder will see</h3>
          <div className="mini-head">
            <div className="mini-head-row">
              <span className="mini-num">{lakhs(h.current)}</span>
              <span className="mini-wow">{pct(h.wowPct)} week-on-week</span>
              {h.incomplete && <Pill tone="warn">Incomplete</Pill>}
            </div>
            <p className="strip-text">{h.strip.join(' · ')}</p>
            <p className="small muted">
              {h.comparisonNote} {h.exclusionNote}
            </p>
            <p className="small muted">
              {rupees(h.current)} this week against {rupees(h.previous)} last week (restated).
            </p>
          </div>

          {state.sent && !changedSinceSent ? (
            <div className="sent" role="status">
              <p className="sent-title">Report sent to the founder</p>
              <p>{h.incomplete ? `Marked incomplete: ${listJoin(missingNames)} missing.` : 'All channels included.'}</p>
              <button className="btn btn-teal" onClick={() => dispatch({ type: 'go', screen: 'founder' })}>
                Open the founder’s view
              </button>
            </div>
          ) : (
            <div className="send">
              {changedSinceSent && <p className="small muted">You’ve made changes since sending. The founder still sees the earlier version.</p>}
              <button data-guide="send" className={`btn btn-lg ${h.incomplete ? 'btn-warn' : 'btn-teal'}`} onClick={() => dispatch({ type: 'send' })}>
                {sendLabel}
              </button>
              {h.incomplete && (
                <p className="small muted">The report will be labelled incomplete wherever its numbers appear.</p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
