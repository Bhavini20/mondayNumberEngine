import { useState } from 'react';
import { data, channelById, CUR, PREV, type ChannelId } from '../data';
import { bridgeStages, likeForLike, oldVsEngine, poTrap, restatement } from '../engine';
import { lakhs, pct, rupees } from '../engine/format';
import { useDemo } from '../state/demoStore';
import { LiveBridgeCard } from '../components/LiveBridgeCard';
import { AnimatedNumber, Eyebrow } from '../components/ui';

function Ctas() {
  const { dispatch } = useDemo();
  return (
    <div className="ctas">
      <button className="btn btn-teal btn-lg" onClick={() => dispatch({ type: 'startGuided' })}>
        <svg width="12" height="14" viewBox="0 0 12 14" aria-hidden="true">
          <path d="M1 1.5v11l10-5.5z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
        Start the demo
      </button>
      <button className="btn btn-outline btn-lg" onClick={() => dispatch({ type: 'jump' })}>
        Jump to the founder’s report
        <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}

/* ---------- 01 The problem ---------- */

function ProblemCards() {
  const p = poTrap();
  const amazon = channelById.amazon;
  const [gst, cancels] = amazon.gap_reasons;
  const r = restatement();
  const lfl = likeForLike(['shopify', 'amazon', 'blinkit', 'zepto']);
  const insta = channelById.instamart;

  const cards = [
    {
      tone: 'red',
      source: `${p.channel} Seller Hub`,
      title: `${p.channel} is up ${pct(p.sellInWowPct)}.`,
      seesLabel: 'What the report shows',
      sees: `Purchase orders ${rupees(p.sellInCurrent)}, against ${rupees(p.sellInPrevious)} last week`,
      figure: rupees(p.sellInCurrent),
      chip: 'SELL-IN',
      truth: `That’s stock ${p.channel} bought from you. Consumers bought ${rupees(p.sellThroughCurrent)}, up ${pct(p.sellThroughWowPct)}.`,
    },
    {
      tone: 'amber',
      source: 'Amazon Seller Central',
      title: `Amazon says ${rupees(amazon.platform_figure!)}.`,
      seesLabel: 'What the report shows',
      sees: 'Ordered product sales, GST included, before cancellations',
      figure: rupees(amazon.platform_figure!),
      chip: 'GROSS',
      truth: `Take out ${rupees(Math.abs(gst.amount))} of GST and ${rupees(Math.abs(cancels.amount))} of cancelled orders. Net sales are ${rupees(amazon.sell_through_by_week[CUR]!)}.`,
    },
    {
      tone: 'blue',
      source: 'Shopify admin',
      title: 'Last week just changed.',
      seesLabel: 'What was sent last Monday',
      sees: `${r.week} consumer sales ${rupees(r.as_sent)}`,
      figure: rupees(r.restated),
      chip: 'RESTATED',
      truth: `${rupees(-r.change)} of refunds arrived this week for last week’s orders. ${r.week} is now ${rupees(r.restated)}.`,
    },
    {
      tone: 'red',
      source: 'Swiggy Instamart portal',
      title: 'Instamart sent nothing.',
      seesLabel: 'What arrived',
      sees: `No report this week. ${insta.confidence.data_age}.`,
      figure: '—',
      chip: 'MISSING',
      truth: `Drop it quietly and the week reads ${pct(lfl.naiveWowPct)}. Compare like with like and it’s ${pct(lfl.wowPct)}.`,
    },
  ];

  return (
    <div className="pcards">
      {cards.map((c) => (
        <article key={c.title} className={`pcard pcard-${c.tone}`}>
          <p className="pcard-source">{c.source}</p>
          <h3 className="pcard-title">{c.title}</h3>
          <p className="pcard-label">{c.seesLabel}</p>
          <p className="pcard-sees">{c.sees}</p>
          <div className="pcard-foot">
            <div className="pcard-row">
              <span className={`tagchip tag-${c.tone}`}>{c.chip}</span>
              <span className="pcard-fig">{c.figure}</span>
            </div>
            <p className="pcard-truth">{c.truth}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

/* ---------- 02 The idea ---------- */

function IdeaTable() {
  const rows = oldVsEngine();
  const stages = bridgeStages();
  const old = stages[0];
  const eng = stages[stages.length - 1];
  const max = Math.max(...rows.map((r) => Math.max(r.old ?? 0, r.engine ?? 0)));
  return (
    <div className="idea">
      <div className="idea-row idea-head">
        <span>Channel</span>
        <span>Old Excel adds</span>
        <span>Monday Number Engine</span>
      </div>
      {rows.map((r) => (
        <div key={r.id} className="idea-row">
          <span className="idea-name">{r.name}</span>
          <span className="idea-cell">
            {r.old != null ? (
              <>
                <span className="mono">{rupees(r.old)}</span>
                {r.oldIsPo && <span className="tagchip tag-red">POs</span>}
              </>
            ) : (
              <span className="muted">Left out</span>
            )}
          </span>
          <span className="idea-cell idea-bar-cell">
            {r.engine != null ? (
              <>
                <span className="idea-bar">
                  <span className="idea-bar-fill" style={{ width: `${(r.engine / max) * 100}%` }} />
                  {r.oldIsPo && r.old != null && (
                    <span className="idea-bar-ghost" style={{ left: `${(r.engine / max) * 100}%`, width: `${((r.old - r.engine) / max) * 100}%` }} />
                  )}
                </span>
                <span className="mono">{rupees(r.engine)}</span>
              </>
            ) : (
              <span className="tagchip tag-red">MISSING · OUT OF BOTH WEEKS</span>
            )}
          </span>
        </div>
      ))}
      <div className="idea-row idea-total">
        <span>Week-on-week</span>
        <span className="mono">
          {lakhs(old.current)} <b className="is-wrong">{pct(old.wowPct)}</b>
        </span>
        <span className="mono">
          {lakhs(eng.current)} <b className="is-right">{pct(eng.wowPct)}</b>
        </span>
      </div>
    </div>
  );
}

/* ---------- 03 The mechanism ---------- */

const CONSOLE_CHANNELS: ChannelId[] = ['shopify', 'amazon', 'blinkit', 'zepto', 'instamart'];

function LikeForLikeConsole() {
  const [ids, setIds] = useState<ChannelId[]>(['shopify', 'amazon', 'blinkit', 'zepto']);
  const r = likeForLike(ids);
  const toggle = (id: ChannelId) => setIds((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]));

  return (
    <div className="console">
      <div className="console-top">
        <span className="console-label">Week-on-week, like for like</span>
        <span className="console-big">
          <AnimatedNumber value={r.wowPct} format={(n) => pct(n)} />
        </span>
      </div>
      <div className="chips" role="group" aria-label="Channels in the report">
        {CONSOLE_CHANNELS.map((id) => {
          const ch = channelById[id];
          const noData = ch.sell_through_by_week[CUR] == null;
          return (
            <button
              key={id}
              className={`chip${ids.includes(id) && !noData ? ' is-on' : ''}`}
              aria-pressed={ids.includes(id) && !noData}
              disabled={noData}
              onClick={() => toggle(id)}
              title={noData ? 'No data this week' : undefined}
            >
              {ch.name}
              {noData && ' · no data'}
            </button>
          );
        })}
      </div>

      <div className="console-lines">
        <div className="console-line">
          <div>
            <p className="console-name">Monday Number Engine</p>
            <p className="formula">
              {CUR} {rupees(r.current)} ÷ {PREV} {rupees(r.previous)} (same channels, restated) − 1
            </p>
          </div>
          <span className="console-val is-right">{pct(r.wowPct)}</span>
        </div>
        <div className="console-line">
          <div>
            <p className="console-name">Silently drop what’s missing</p>
            <p className="formula">
              {CUR} {rupees(r.current)} ÷ {PREV} {rupees(r.naivePrevious)} (all channels) − 1
            </p>
          </div>
          <span className="console-val is-wrong">{pct(r.naiveWowPct)}</span>
        </div>
      </div>
      <p className="console-note">
        {r.dropped.length
          ? `${r.dropped.map((d) => `${d.name} (${rupees(d.prev)} last week)`).join(', ')} ${r.dropped.length > 1 ? 'are' : 'is'} left out of both weeks, and the report says so. Toggle channels to see the comparison move.`
          : 'Every channel is in both weeks.'}
      </p>
    </div>
  );
}

export function Start() {
  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-copy">
          <Eyebrow>The Monday Number Engine · a Hevo product concept</Eyebrow>
          <h1 className="hero-title">
            <span className="hero-title-muted">Hevo moves the data.</span> The Monday Number Engine makes it mean something.
          </h1>
          <p className="hero-lede">
            Every Monday the founder of {data.brand.name} asks:{' '}
            <em>“How much did we sell last week, by city and product, and which channel is growing?”</em> Five channels
            answer with five different meanings of “sales”.
          </p>
          <Ctas />
          <p className="hero-cap">About 3 minutes, guided. Analyst at 9:00, founder at 10:00. Explore freely any time.</p>
        </div>
        <LiveBridgeCard />
      </section>

      <section className="band">
        <div className="band-head">
          <Eyebrow num="01">The problem</Eyebrow>
          <h2 className="display">Five channels. Five different meanings of “sales”.</h2>
        </div>
        <ProblemCards />
      </section>

      <section className="band band-split">
        <div className="band-head">
          <Eyebrow num="02">The idea</Eyebrow>
          <h2 className="display">
            Today the analyst adds up five reports. The engine asks: <em>same event, same clock, same name?</em>
          </h2>
        </div>
        <IdeaTable />
      </section>

      <section className="band band-split">
        <div className="band-head">
          <Eyebrow num="03">The mechanism</Eyebrow>
          <h2 className="display">Compare like with like.</h2>
          <p className="band-text">
            One definition of a sale: what consumers bought, net of discounts and returns, excluding GST, Monday to Sunday
            IST. Purchase orders are kept separate. When a channel is missing, it’s left out of both weeks and the report
            says so.
          </p>
          <Ctas />
        </div>
        <LikeForLikeConsole />
      </section>
    </div>
  );
}
