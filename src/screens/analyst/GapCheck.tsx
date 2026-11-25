import { data } from '../../data';
import { readiness } from '../../engine';
import { useDemo } from '../../state/demoStore';
import { GapExplanation } from '../../components/GapExplanation';
import { Dot, Eyebrow } from '../../components/ui';

export function GapCheck() {
  const { state, input, dispatch } = useDemo();
  const rows = readiness(input);

  return (
    <div className="screen">
      <header className="screen-head">
        <div>
          <Eyebrow num="04">Gap check</Eyebrow>
          <h2>Check gaps against each platform</h2>
          <p className="lede">Every difference between our number and the platform’s own figure gets a reason.</p>
        </div>
      </header>

      <div className="tabs" role="tablist" aria-label="Channel">
        {data.channels.map((c) => {
          const r = rows.find((x) => x.id === c.id)!;
          return (
            <button
              key={c.id}
              role="tab"
              data-guide={`tab-${c.id}`}
              aria-selected={state.gapChannel === c.id}
              className={`tab${state.gapChannel === c.id ? ' is-on' : ''}`}
              onClick={() => dispatch({ type: 'openGap', channel: c.id })}
            >
              <Dot tone={r.ready ? 'ok' : r.tone} />
              {c.name}
            </button>
          );
        })}
      </div>

      <div className="panel" role="tabpanel">
        <GapExplanation channel={state.gapChannel} input={input} audience="analyst" />
      </div>
    </div>
  );
}
