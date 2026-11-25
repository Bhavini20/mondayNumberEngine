import { data } from '../../data';
import { trustHistory } from '../../engine';
import { useDemo } from '../../state/demoStore';
import { Eyebrow } from '../../components/ui';

const [ACT, RECHECK] = data.trust_capture.options;
const short = (v: string) => (v === ACT ? 'Act' : 'Recheck');

export function TrustCapture() {
  const { state, dispatch } = useDemo();
  const history = trustHistory(state.trust);

  return (
    <section className="block trust" aria-labelledby="trust-title">
      <div className="block-head">
        <Eyebrow num="03">Trust</Eyebrow>
        <h2 id="trust-title" className="display">Would you act on this report?</h2>
        <p className="muted">Your answer is recorded for this week.</p>
      </div>
      <div className="trust-actions">
        {[ACT, RECHECK].map((opt) => (
          <button
            key={opt}
            data-guide={opt === ACT ? 'trust-act' : undefined}
            className={`btn btn-lg ${state.trust === opt ? 'btn-teal' : 'btn-outline'}`}
            aria-pressed={state.trust === opt}
            onClick={() => dispatch({ type: 'trust', value: opt })}
          >
            {opt}
          </button>
        ))}
      </div>

      {state.trust && (
        <div className="trust-history" role="status">
          <ol>
            {history.map((h) => (
              <li key={h.week} className={`${h.value === ACT ? 'is-act' : 'is-recheck'}${h.current ? ' is-current' : ''}`}>
                <span>{h.week}</span>
                <strong>{short(h.value)}</strong>
              </li>
            ))}
          </ol>
          <p className="small muted">
            {history.map((h) => short(h.value)).join(', ')}. This is how the product measures decision-grade trust: whether
            the founder would act on the number without asking for a recheck.
          </p>
        </div>
      )}
    </section>
  );
}
