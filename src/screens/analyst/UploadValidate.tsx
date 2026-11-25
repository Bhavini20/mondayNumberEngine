import { data, skuById, CUR, NEEDS_NEW_SKU } from '../../data';
import { unmapped } from '../../engine';
import { dayLabel, num, rupees } from '../../engine/format';
import { useDemo } from '../../state/demoStore';
import { Eyebrow, Pill } from '../../components/ui';

const up = data.blinkit_upload;

function weekDays(): string[] {
  const w = data.weeks.find((x) => x.id === CUR)!;
  const out: string[] = [];
  const d = new Date(`${w.start}T00:00:00Z`);
  const end = new Date(`${w.end}T00:00:00Z`);
  while (d <= end) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

function DayStrip({ missing }: { missing: string[] }) {
  return (
    <ol className="daystrip" aria-label="Days covered by the file">
      {weekDays().map((d) => {
        const miss = missing.includes(d);
        const [wd, day] = dayLabel(d).split(' ');
        return (
          <li key={d} className={miss ? 'is-missing' : 'is-in'}>
            <span>{wd}</span>
            <strong>{day}</strong>
            <small>{miss ? 'Missing' : 'In file'}</small>
          </li>
        );
      })}
    </ol>
  );
}

export function UploadValidate() {
  const { state, input, dispatch } = useDemo();
  const u = unmapped(input);
  const s = state.upload;

  if (s === 'none') {
    return (
      <div className="screen">
        <header className="screen-head">
          <div>
            <Eyebrow num="02">Upload</Eyebrow>
            <h2>Upload Blinkit’s report</h2>
            <p className="lede">
              Blinkit has no API, so its sales come from the official Seller Hub export. Every file is checked before it
              counts.
            </p>
          </div>
        </header>
        <div className="dropzone">
          <p className="dropzone-title">Drop the Seller Hub sales export here</p>
          <p className="muted">
            Expected: one row per item, city and day for {data.weeks.find((w) => w.id === CUR)!.label}, with{' '}
            {up.required_columns.length} columns: {up.required_columns.join(', ')}.
          </p>
          <button data-guide="use-sample" className="btn btn-teal" onClick={() => dispatch({ type: 'useSample' })}>
            Use sample file
          </button>
          <p className="small muted">In this prototype the file is simulated. Nothing is uploaded.</p>
        </div>
      </div>
    );
  }

  const first = s === 'needs_attention' || s === 'accepted_partial';
  const file = first ? up.first_attempt : up.corrected_file;
  const fileName = first ? up.file_name : up.corrected_file.file_name;
  const previewItems = up.unmapped_items.slice(0, 4);

  return (
    <div className="screen">
      <header className="screen-head">
        <div>
          <Eyebrow num="02">Upload</Eyebrow>
            <h2>Upload Blinkit’s report</h2>
          <p className="lede">The upload isn’t just accepted. It’s checked.</p>
        </div>
      </header>

      <article className={`validation ${s === 'validated' ? 'is-ok' : 'is-warn'}`}>
        <header className="validation-head">
          <div>
            <p className="file-name">{fileName}</p>
            <p className="muted">{num(file.rows)} rows detected</p>
          </div>
          <Pill tone={s === 'validated' ? 'ok' : 'warn'}>
            {s === 'validated' ? 'Validated' : s === 'accepted_partial' ? 'Accepted with Thursday missing' : 'Needs attention'}
          </Pill>
        </header>

        <DayStrip missing={file.missing_days} />

        <ul className="checks">
          <li className="check-ok">
            <strong>Required columns found: {file.required_columns_found}</strong>
            <span>{up.required_columns.join(', ')}</span>
          </li>
          {file.missing_days.length ? (
            <li className="check-bad">
              <strong>Missing day: {file.missing_days.map(dayLabel).join(', ')}</strong>
              <span>No rows for this day. Blinkit’s week would be short by a day and look like a drop.</span>
            </li>
          ) : (
            <li className="check-ok">
              <strong>All 7 days present</strong>
              <span>Monday to Sunday, IST.</span>
            </li>
          )}
          {first &&
            up.first_attempt.unexpected_columns.map((c) => (
              <li key={c} className="check-warn">
                <strong>Unexpected column: “{c}”</strong>
                <span>Not part of the sales definition. It will be ignored. This doesn’t block the upload.</span>
              </li>
            ))}
          <li className="check-ok">
            <strong>Duplicate rows: {file.duplicate_rows}</strong>
          </li>
        </ul>

        <div className="preview">
          <p className="small muted">Preview: first items in the file, totals for the week</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Item ID</th>
                  <th>Item Name</th>
                  <th className="num">Units Sold</th>
                  <th className="num">Sales Value</th>
                </tr>
              </thead>
              <tbody>
                {previewItems.map((i) => {
                  const sku = i.suggested_sku === NEEDS_NEW_SKU ? null : skuById[i.suggested_sku];
                  return (
                    <tr key={i.platform_item_id}>
                      <td>{i.platform_item_id}</td>
                      <td>{i.platform_name}</td>
                      <td className="num">{sku ? num(i.revenue / sku.avg_net_price) : '—'}</td>
                      <td className="num">{rupees(i.revenue)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {s !== 'validated' && (
          <footer className="validation-actions">
            <button data-guide="upload-corrected" className="btn btn-teal" onClick={() => dispatch({ type: 'uploadCorrected' })}>
              Upload corrected file
            </button>
            {s === 'needs_attention' && (
              <button className="btn btn-secondary" onClick={() => dispatch({ type: 'acceptPartial' })}>
                Accept with Thursday missing
              </button>
            )}
            <p className="small muted">
              {s === 'accepted_partial'
                ? 'Blinkit now counts as not ready (6/7 days). It stays out of the headline until a full week is uploaded.'
                : 'Accepting is allowed, but Blinkit then counts as 6/7 days and stays out of the headline.'}
            </p>
          </footer>
        )}
      </article>

      {(s === 'validated' || s === 'accepted_partial') && (
        <div className="callout callout-warn">
          <div>
            <p className="callout-title">
              {u.revenue === u.startingRevenue
                ? `${u.totalItems} items aren’t mapped to ${data.brand.name} SKUs (${rupees(u.revenue)})`
                : `${u.itemCount} item${u.itemCount === 1 ? '' : 's'} still unmapped (${rupees(u.revenue)})`}
            </p>
            <p>Blinkit uses its own item IDs. Until they’re matched to our products, that revenue can’t be shown by product.</p>
          </div>
          <button data-guide="map-items" className="btn btn-teal" onClick={() => dispatch({ type: 'step', step: 'mapping' })}>
            Map items
          </button>
        </div>
      )}
    </div>
  );
}
