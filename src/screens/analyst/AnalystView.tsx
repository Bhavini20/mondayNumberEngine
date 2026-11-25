import { data } from '../../data';
import { readiness, unmapped } from '../../engine';
import { useDemo, type AnalystStep } from '../../state/demoStore';
import { ReadinessBoard } from './ReadinessBoard';
import { UploadValidate } from './UploadValidate';
import { MappingQueue } from './MappingQueue';
import { GapCheck } from './GapCheck';
import { ReviewSend } from './ReviewSend';

const STEPS: { id: AnalystStep; label: string }[] = [
  { id: 'board', label: 'See what’s ready' },
  { id: 'upload', label: 'Upload Blinkit' },
  { id: 'mapping', label: 'Map items' },
  { id: 'gap', label: 'Check gaps' },
  { id: 'review', label: 'Review and send' },
];

export function AnalystView() {
  const { state, input, dispatch } = useDemo();
  const ready = readiness(input).filter((r) => r.ready).length;
  const u = unmapped(input);
  const uploaded = state.upload !== 'none';

  const done: Record<AnalystStep, boolean> = {
    board: true,
    upload: state.upload === 'validated',
    mapping: uploaded && u.pendingCount === 0,
    gap: false,
    review: state.sent != null,
  };
  const note: Partial<Record<AnalystStep, string>> = {
    upload:
      state.upload === 'none'
        ? 'Needed'
        : state.upload === 'needs_attention'
          ? 'Needs attention'
          : state.upload === 'accepted_partial'
            ? 'Thu missing'
            : 'Validated',
    mapping: uploaded ? (u.pendingCount ? `${u.pendingCount} to review` : 'Done') : undefined,
    review: state.sent ? 'Sent' : undefined,
  };

  return (
    <div className="analyst">
      <aside className="rail" aria-label="Monday prep steps">
        <div className="rail-head">
          <h1>Monday prep</h1>
          <p>
            {data.report.report_day}, 9:00 IST
            <br />
            Report due to founder at 10:00
          </p>
        </div>
        <ol className="steps">
          {STEPS.map((s, i) => (
            <li key={s.id}>
              <button
                data-guide={`nav-${s.id}`}
                className={`step${state.step === s.id ? ' is-current' : ''}${done[s.id] && s.id !== 'board' ? ' is-done' : ''}`}
                aria-current={state.step === s.id ? 'step' : undefined}
                onClick={() => dispatch({ type: 'step', step: s.id })}
              >
                <span className="step-num">{done[s.id] && s.id !== 'board' ? '✓' : String(i + 1).padStart(2, '0')}</span>
                <span className="step-label">
                  {s.label}
                  {note[s.id] && <small>{note[s.id]}</small>}
                </span>
              </button>
            </li>
          ))}
        </ol>
        <div className="rail-meter">
          <div className="meter" aria-hidden="true">
            {readiness(input).map((r) => (
              <span key={r.id} className={`meter-seg ${r.ready ? 'on' : r.tone}`} />
            ))}
          </div>
          <p>
            <strong>
              {ready} of {data.channels.length}
            </strong>{' '}
            channels ready
          </p>
        </div>
      </aside>

      <section className="stage">
        {state.step === 'board' && <ReadinessBoard />}
        {state.step === 'upload' && <UploadValidate />}
        {state.step === 'mapping' && <MappingQueue />}
        {state.step === 'gap' && <GapCheck />}
        {state.step === 'review' && <ReviewSend />}
      </section>
    </div>
  );
}
