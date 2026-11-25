import { useEffect, useRef } from 'react';
import { data } from '../data';
import { headline, poTrap, restatement, unmapped, type EngineInput } from '../engine';
import { lakhs, pct, rupees } from '../engine/format';
import { useDemo, type Action, type DemoState } from '../state/demoStore';

interface Step {
  where: string;
  title: string;
  todo: string;
  say?: string;
  points?: string[];
  /** data-guide targets, in priority order: the first one on screen is highlighted. */
  targets: string[];
  done?: (s: DemoState, input: EngineInput) => boolean;
  /** Where Next/Back takes the presenter for this step. */
  nav?: Action;
}

function buildSteps(): Step[] {
  const r = restatement();
  const p = poTrap();
  const sample: EngineInput = {
    upload: 'validated',
    items: {},
    newSkus: [],
  };
  const h = headline(sample);
  return [
    {
      where: 'Analyst · 9:00',
      title: 'What’s ready?',
      todo: 'Point out the five channel cards.',
      points: [
        'Shopify and Amazon arrived on their own through Hevo connectors.',
        'Zepto’s upload is validated.',
        'Blinkit needs an upload. Instamart’s report is missing.',
        'Confidence is shown as reasons, not a score.',
      ],
      targets: [],
      nav: { type: 'step', step: 'board' },
    },
    {
      where: 'Analyst · 9:00',
      title: 'Upload Blinkit',
      todo: 'Upload report, then Use sample file. It flags a missing Thursday. Then Upload corrected file.',
      say: 'The upload isn’t just accepted; it’s checked.',
      targets: ['upload-corrected', 'use-sample', 'upload-report', 'nav-upload'],
      nav: { type: 'step', step: 'upload' },
      done: (s) => s.upload === 'validated',
    },
    {
      where: 'Analyst · 9:00',
      title: 'Map items',
      todo: `${rupees(data.blinkit_upload.unmapped_revenue_total)} of Blinkit sales don’t map to a product yet. Accept all suggestions, then Leave unmapped on the Festive Pack.`,
      say: 'What we can’t standardise, we show. That leftover will appear in the founder’s report, not disappear.',
      targets: ['accept-all', 'leave-unmapped', 'map-items', 'nav-mapping'],
      nav: { type: 'step', step: 'mapping' },
      done: (s, i) => s.upload !== 'none' && unmapped(i).pendingCount === 0,
    },
    {
      where: 'Analyst · 9:00',
      title: 'One gap check',
      todo: `Shopify’s gap check. Shopify says ${rupees(data.channels[0].platform_figure!)}; we say ${rupees(data.channels[0].sell_through_by_week.W4!)}.`,
      say: `Last week was sent as ${rupees(r.as_sent)}; it’s now ${rupees(r.restated)}, and the report says so.`,
      targets: ['tab-shopify', 'nav-gap'],
      nav: { type: 'openGap', channel: 'shopify' },
      done: (s) => s.step === 'gap' && s.gapChannel === 'shopify' && s.screen === 'analyst',
    },
    {
      where: 'Analyst · 9:00',
      title: 'Send',
      todo: 'The send button names what’s missing. Click it.',
      say: 'The system won’t let a report with a hole in it look complete.',
      targets: ['send', 'nav-review'],
      nav: { type: 'step', step: 'review' },
      done: (s) => s.sent != null,
    },
    {
      where: 'Founder · 10:00',
      title: 'The headline',
      todo: 'It’s 10:00 and this is the founder’s view. Point at the headline and the line directly under it.',
      say: `Consumer sales ${lakhs(h.current)}, ${pct(h.wowPct)} week-on-week. Directly under it: what’s missing, and that week-on-week compares like with like.`,
      targets: [],
      done: (s) => s.screen === 'founder' && s.sent != null,
      nav: { type: 'go', screen: 'founder' },
    },
    {
      where: 'Founder · 10:00',
      title: 'The PO trap',
      todo: 'Turn on “Show what the old Excel would have said”.',
      say: `Blinkit purchase orders are up ${pct(p.sellInWowPct)}, but consumers bought only ${pct(p.sellThroughWowPct)} more. This is the mistake the product exists to prevent.`,
      targets: ['old-excel'],
      nav: { type: 'go', screen: 'founder' },
      done: (s) => s.showOldExcel,
    },
    {
      where: 'Founder · 10:00',
      title: 'Trust',
      todo: 'Click “I’d act on this”.',
      say: 'That click is our decision-grade trust metric, measured inside the product.',
      targets: ['trust-act'],
      nav: { type: 'go', screen: 'founder' },
      done: (s) => s.trust != null,
    },
    {
      where: 'If asked',
      title: 'Optional extras',
      todo: 'Explore freely.',
      points: [
        'By city: why Blinkit shows ₹0 in Gurugram (store city vs customer city).',
        'Amazon gap: GST and cancellations explain the whole difference.',
        'Reset demo, skip the Blinkit upload and send. The headline drops to three channels and says so.',
      ],
      targets: [],
    },
  ];
}

const STEPS = buildSteps();

export function Guide() {
  const { state, input, dispatch } = useDemo();
  const { on, index } = state.guide;
  const step = STEPS[index];
  const done = step.done?.(state, input) ?? false;

  // Follow the presenter: when a later step gets completed, jump to it.
  let maxDone = -1;
  STEPS.forEach((st, k) => {
    if (st.done?.(state, input)) maxDone = k;
  });
  const prevMax = useRef(maxDone);
  useEffect(() => {
    if (on && maxDone > prevMax.current && maxDone > index) dispatch({ type: 'guideTo', index: maxDone });
    prevMax.current = maxDone;
  }, [maxDone, on, index, dispatch]);

  const goTo = (k: number) => {
    dispatch({ type: 'guideTo', index: k });
    const nav = STEPS[k].nav;
    if (nav) dispatch(nav);
    scrolledFor.current = -1;
  };

  // Highlight the first target present on screen, and bring it into view once per step.
  const scrolledFor = useRef(-1);
  useEffect(() => {
    document.querySelectorAll('.guide-target').forEach((el) => el.classList.remove('guide-target'));
    if (!on || done) return;
    for (const t of step.targets) {
      const el = document.querySelector(`[data-guide="${t}"]`);
      if (el) {
        el.classList.add('guide-target');
        if (scrolledFor.current !== index) {
          scrolledFor.current = index;
          const r = el.getBoundingClientRect();
          if (r.top < 80 || r.bottom > window.innerHeight - 20) {
            el.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
        }
        break;
      }
    }
  });

  if (state.screen === 'start') return null;

  if (!on) {
    return (
      <button className="guide-fab" onClick={() => dispatch({ type: 'guideOn', on: true })}>
        <span className="live-dot" aria-hidden="true" /> Demo guide
      </button>
    );
  }

  return (
    <aside className="guide" aria-label="Demo guide">
      <header className="guide-head">
        <span className="guide-count">
          {String(index + 1).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')} · {step.where}
        </span>
        <button className="guide-x" onClick={() => dispatch({ type: 'guideOn', on: false })} aria-label="Hide guide">
          Hide
        </button>
      </header>
      <h2 className="guide-title">
        {step.title}
        {done && <span className="tagchip tag-ok">Done</span>}
      </h2>
      <p className="guide-todo">{step.todo}</p>
      {step.points && (
        <ul className="guide-points">
          {step.points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}
      {step.say && <p className="guide-say">“{step.say}”</p>}
      <footer className="guide-foot">
        <div className="guide-dots" aria-hidden="true">
          {STEPS.map((_, k) => (
            <span key={k} className={k < index ? 'past' : k === index ? 'now' : ''} />
          ))}
        </div>
        <div className="guide-btns">
          <button
            className="btn btn-ghost btn-sm"
            disabled={index === 0}
            onClick={() => goTo(index - 1)}
          >
            Back
          </button>
          {index < STEPS.length - 1 ? (
            <button
              className={`btn btn-sm ${done || !step.done ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => goTo(index + 1)}
            >
              Next
            </button>
          ) : (
            <button className="btn btn-sm btn-secondary" onClick={() => dispatch({ type: 'guideOn', on: false })}>
              Close guide
            </button>
          )}
        </div>
      </footer>
    </aside>
  );
}
