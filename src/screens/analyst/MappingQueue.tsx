import { useState } from 'react';
import { data, NEEDS_NEW_SKU, type UnmappedItem } from '../../data';
import { allSkus, skuName, unmapped } from '../../engine';
import { rupees } from '../../engine/format';
import { useDemo } from '../../state/demoStore';
import { Eyebrow, Pill } from '../../components/ui';

const items = data.blinkit_upload.unmapped_items;

function PackNote({ sku }: { sku: string }) {
  const s = data.skus.find((x) => x.sku === sku);
  if (!s || s.base_units_per_pack === 1) return null;
  return <p className="pack-note">1 pack = {s.base_units_per_pack} base units. Units are converted in the product view.</p>;
}

function QueueRow({ item }: { item: UnmappedItem }) {
  const { input, dispatch } = useDemo();
  const [changing, setChanging] = useState(false);
  const [creating, setCreating] = useState(false);
  const needsNew = item.suggested_sku === NEEDS_NEW_SKU;
  const [choice, setChoice] = useState(needsNew ? data.skus[0].sku : item.suggested_sku);
  const [newName, setNewName] = useState(item.platform_name.replace(/^Namak Street\s*/, ''));
  const id = item.platform_item_id;

  return (
    <li className={`qrow${needsNew ? ' qrow-new' : ''}`}>
      <div className="qrow-from">
        <span className="qrow-id">Blinkit item {id}</span>
        <strong>{item.platform_name}</strong>
      </div>
      <div className="qrow-amt">{rupees(item.revenue)}</div>
      <div className="qrow-to">
        {needsNew && !changing && !creating ? (
          <>
            <Pill tone="warn">No matching product</Pill>
            <p className="small muted">Nothing in the catalogue looks like this item.</p>
          </>
        ) : changing ? (
          <label className="select-label">
            <span className="sr-only">Map to product</span>
            <select value={choice} onChange={(e) => setChoice(e.target.value)}>
              {allSkus(input).map((s) => (
                <option key={s.sku} value={s.sku}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        ) : creating ? (
          <label className="select-label">
            <span className="small muted">New product name</span>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} />
          </label>
        ) : (
          <>
            <span className="qrow-suggest">Suggested</span>
            <strong>{skuName(input, item.suggested_sku)}</strong>
            <PackNote sku={item.suggested_sku} />
          </>
        )}
      </div>
      <div className="qrow-actions">
        {changing ? (
          <>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => dispatch({ type: 'map', itemId: id, sku: choice })}
            >
              Confirm
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setChanging(false)}>
              Cancel
            </button>
          </>
        ) : creating ? (
          <>
            <button
              className="btn btn-primary btn-sm"
              disabled={!newName.trim()}
              onClick={() => dispatch({ type: 'createSku', itemId: id, name: newName.trim() })}
            >
              Create and map
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setCreating(false)}>
              Cancel
            </button>
          </>
        ) : needsNew ? (
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => setCreating(true)}>
              Create new SKU
            </button>
            <button data-guide="leave-unmapped" className="btn btn-secondary btn-sm" onClick={() => dispatch({ type: 'leaveUnmapped', itemId: id })}>
              Leave unmapped
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setChanging(true)}>
              Pick existing
            </button>
          </>
        ) : (
          <>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => dispatch({ type: 'map', itemId: id, sku: item.suggested_sku })}
            >
              Confirm
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setChanging(true)}>
              Change
            </button>
          </>
        )}
      </div>
    </li>
  );
}

export function MappingQueue() {
  const { state, input, dispatch } = useDemo();
  const u = unmapped(input);

  if (state.upload === 'none' || state.upload === 'needs_attention') {
    return (
      <div className="screen">
        <header className="screen-head">
          <div>
            <Eyebrow num="03">Mapping</Eyebrow>
            <h2>Map Blinkit items</h2>
          </div>
        </header>
        <div className="empty">
          <p className="empty-title">Upload Blinkit’s report first</p>
          <p className="muted">Items to map come from a checked upload.</p>
          <button className="btn btn-primary" onClick={() => dispatch({ type: 'step', step: 'upload' })}>
            {state.upload === 'none' ? 'Upload report' : 'Finish the upload'}
          </button>
        </div>
      </div>
    );
  }

  const pending = items.filter((i) => input.items[i.platform_item_id].status === 'pending');
  const resolved = items.filter((i) => input.items[i.platform_item_id].status !== 'pending');
  const suggestionCount = pending.filter((i) => i.suggested_sku !== NEEDS_NEW_SKU).length;
  const hasSuggestions = suggestionCount > 0;
  const mappedShare = ((u.startingRevenue - u.revenue) / u.startingRevenue) * 100;

  return (
    <div className="screen">
      <header className="screen-head">
        <div>
          <Eyebrow num="03">Mapping</Eyebrow>
            <h2>Map Blinkit items</h2>
          <p className="lede">Revenue we can’t place stays visible. It’s never quietly dropped.</p>
        </div>
      </header>

      <div className="tally" role="status" aria-live="polite">
        <div className="tally-figs">
          <div>
            <span className="muted">Unmapped revenue</span>
            <strong className="tally-big">{rupees(u.revenue)}</strong>
          </div>
          <div>
            <span className="muted">Blinkit mapped</span>
            <strong className="tally-big">{u.mappedPct.toFixed(1)}%</strong>
          </div>
        </div>
        <div className="tally-bar" aria-hidden="true">
          <span style={{ width: `${mappedShare}%` }} />
        </div>
        <p className="small muted">
          {u.pendingCount
            ? `${u.pendingCount} item${u.pendingCount === 1 ? '' : 's'} to review`
            : 'Nothing left to review'}{' '}
          · started at {rupees(u.startingRevenue)}
        </p>
      </div>

      {pending.length > 0 && (
        <section>
          <div className="section-bar">
            <h3>To review ({pending.length})</h3>
            {hasSuggestions && (
              <button data-guide="accept-all" className="btn btn-teal btn-sm" onClick={() => dispatch({ type: 'acceptAll' })}>
                Accept {suggestionCount} suggestion{suggestionCount === 1 ? '' : 's'}
              </button>
            )}
          </div>
          <ul className="queue">
            {pending.map((i) => (
              <QueueRow key={i.platform_item_id} item={i} />
            ))}
          </ul>
        </section>
      )}

      {pending.length === 0 && (
        <div className="callout callout-ok">
          <div>
            <p className="callout-title">Queue cleared</p>
            <p>
              {u.revenue > 0
                ? `${rupees(u.revenue)} is left unmapped on purpose. It stays in the total and appears in the founder’s report as “Unmapped (Blinkit)”.`
                : 'Every Blinkit item is mapped to a product.'}
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => dispatch({ type: 'step', step: 'review' })}>
            Review and send
          </button>
        </div>
      )}

      {resolved.length > 0 && (
        <section>
          <div className="section-bar">
            <h3>Done ({resolved.length})</h3>
          </div>
          <ul className="done-list">
            {resolved.map((i) => {
              const d = input.items[i.platform_item_id];
              return (
                <li key={i.platform_item_id}>
                  <span>{i.platform_name}</span>
                  <span className="muted">{d.status === 'mapped' ? skuName(input, d.sku) : 'Left unmapped'}</span>
                  <span className="num">{rupees(i.revenue)}</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: 'undo', itemId: i.platform_item_id })}>
                    Undo
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
