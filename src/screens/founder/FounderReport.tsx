import { useCallback, useState } from 'react';
import { data, weekLabel, PREV, type ChannelId } from '../../data';
import { readiness } from '../../engine';
import { useDemo } from '../../state/demoStore';
import { Drawer, Dot, Eyebrow } from '../../components/ui';
import { GapExplanation } from '../../components/GapExplanation';
import { ReportHeader } from './ReportHeader';
import { PoTrapCard } from './PoTrapCard';
import { ChannelGrowth } from './ChannelGrowth';
import { Breakdowns } from './Breakdowns';
import { TrustCapture } from './TrustCapture';

export function FounderReport() {
  const { state, input, dispatch } = useDemo();
  const [why, setWhy] = useState<ChannelId | null>(null);
  const close = useCallback(() => setWhy(null), []);

  if (!state.sent) {
    const rows = readiness(input);
    return (
      <div className="report">
        <div className="waiting">
          <Eyebrow>Monday report · waiting for the analyst</Eyebrow>
          <h1 className="display">This week’s report isn’t ready yet</h1>
          <p className="lede">
            {rows.filter((r) => r.ready).length} of {rows.length} channels ready. Last report: {PREV} ({weekLabel(PREV)}).
          </p>
          <ul className="checklist">
            {rows.map((r) => (
              <li key={r.id}>
                <Dot tone={r.ready ? 'ok' : r.tone} />
                <span className="checklist-name">{r.name}</span>
                <span className="muted">{r.ready ? 'Ready' : r.statusLabel}</span>
              </li>
            ))}
          </ul>
          <button className="btn btn-secondary" onClick={() => dispatch({ type: 'step', step: 'board' })}>
            Open the analyst’s view
          </button>
        </div>
      </div>
    );
  }

  const sent = state.sent;

  return (
    <div className="report">
      {state.viaJump && (
        <p className="jump-note">
          Showing the report after the standard analyst path.{' '}
          <button className="linklike" onClick={() => dispatch({ type: 'walkThrough' })}>
            Walk through the analyst path instead
          </button>
        </p>
      )}

      <div className="rtop">
        <ReportHeader input={sent} />
        <PoTrapCard input={sent} onWhy={setWhy} />
      </div>
      <ChannelGrowth input={sent} onWhy={setWhy} />
      <Breakdowns input={sent} />
      <TrustCapture />

      <Drawer open={why != null} onClose={close} title={why ? `Why ${data.channels.find((c) => c.id === why)!.name}’s numbers differ` : ''}>
        {why && <GapExplanation channel={why} input={sent} audience="founder" />}
      </Drawer>
    </div>
  );
}
