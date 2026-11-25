import type { ReactNode } from 'react';
import { data, weekLabel, CUR } from '../data';
import { useDemo } from '../state/demoStore';
import { Guide } from './Guide';

export const DISCLAIMER =
  'Prototype for a product management case. Namak Street is a fictional brand and all figures are illustrative. Platform behaviours shown (data access routes, date and tax treatment) are based on public documentation where available and are simplified for the demo.';

function Mark() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
      <rect width="26" height="26" rx="7" fill="#0B0B0C" />
      <path d="M6.5 18V8.5l6.5 6 6.5-6V18" fill="none" stroke="#8AA2FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const { state, dispatch } = useDemo();
  const year = data.weeks.find((w) => w.id === CUR)!.end.slice(0, 4);
  const view = state.screen;

  return (
    <div className={`app${state.guide.on && view !== 'start' ? ' with-guide' : ''}`}>
      <div className="atmos" aria-hidden="true" />
      <header className="topbar">
        <button className="brand" onClick={() => dispatch({ type: 'go', screen: 'start' })} aria-label="Back to the start">
          <Mark />
          <span className="brand-name">Monday Number Engine</span>
          <span className="brand-sep" aria-hidden="true" />
          <span className="brand-week">
            {data.brand.name} · Week of {weekLabel(CUR)} {year}
          </span>
        </button>

        <nav className="timeswitch" aria-label="Switch view">
          <button
            className={view === 'analyst' ? 'is-on' : ''}
            aria-pressed={view === 'analyst'}
            onClick={() => dispatch({ type: 'go', screen: 'analyst' })}
          >
            <span className="ts-who">Analyst</span>
            <span className="ts-time">9:00</span>
          </button>
          <button
            data-guide="view-founder"
            className={view === 'founder' ? 'is-on' : ''}
            aria-pressed={view === 'founder'}
            onClick={() => dispatch({ type: 'go', screen: 'founder' })}
          >
            <span className="ts-who">Founder</span>
            <span className="ts-time">10:00</span>
          </button>
        </nav>

        <div className="topbar-end">
          <span className="proto-note">
            <span className="amber-dot" aria-hidden="true" />
            Prototype with illustrative data
          </span>
          <button className="btn btn-outline btn-sm" onClick={() => dispatch({ type: 'reset' })}>
            Reset demo
          </button>
        </div>
      </header>

      <main className="main">{children}</main>

      <footer className="footer">
        <p>Monday Number Engine concept prototype · PM case study for Hevo Data</p>
        <p>{DISCLAIMER}</p>
      </footer>

      <Guide />
    </div>
  );
}
