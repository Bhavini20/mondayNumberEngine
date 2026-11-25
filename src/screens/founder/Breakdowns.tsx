import { useState } from 'react';
import { data, skuById, channelById } from '../../data';
import { cityBreakdown, productBreakdown, type EngineInput } from '../../engine';
import { num, rupees } from '../../engine/format';
import { Eyebrow } from '../../components/ui';

function Missing({ label }: { label: string }) {
  return <span className="cell-missing">{label}</span>;
}

function ByCity({ input }: { input: EngineInput }) {
  const t = cityBreakdown(input);
  const storeChannels = t.columns.filter((c) => c.cityType === 'store').map((c) => c.name);
  return (
    <>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">City</th>
              {t.columns.map((c) => (
                <th key={c.id} scope="col" className="num">
                  {c.name}
                  <small className={`th-type th-${c.cityType}`}>{c.cityTypeShort}</small>
                </th>
              ))}
              <th scope="col" className="num">
                Total
                <small className="th-type">Mixed city basis</small>
              </th>
            </tr>
          </thead>
          <tbody>
            {t.rows.map((r) => (
              <tr key={r.city}>
                <th scope="row">{r.city}</th>
                {r.values.map((v, i) => (
                  <td key={i} className="num">
                    {t.columns[i].included ? (
                      <span className={v === 0 ? 'cell-zero' : ''}>{rupees(v ?? 0)}</span>
                    ) : (
                      <Missing label={t.columns[i].id === 'instamart' ? 'Missing' : 'Not in report'} />
                    )}
                  </td>
                ))}
                <td className="num strong">{rupees(r.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">All cities</th>
              {t.totals.map((v, i) => (
                <td key={i} className="num">
                  {v != null ? rupees(v) : '—'}
                </td>
              ))}
              <td className="num strong">{rupees(t.grandTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="table-note">
        <strong>Store city</strong> means the city of the dark store that served the order. Gurugram customers served by a
        Delhi dark store appear under Delhi on {storeChannels.join(' and ')}, which is why Blinkit shows {rupees(0)} for
        Gurugram. Zepto reports a city without saying which kind. Shopify and Amazon use the customer’s delivery city.
      </p>
    </>
  );
}

function ByProduct({ input }: { input: EngineInput }) {
  const t = productBreakdown(input);
  const rows = t.rows.filter((r) => skuById[r.key] || r.revenue > 0);
  const all = t.unmappedRow ? [...rows, t.unmappedRow] : rows;
  return (
    <>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Product</th>
              {t.columns.map((c) => (
                <th key={c.id} scope="col" className="num">
                  {c.name}
                </th>
              ))}
              <th scope="col" className="num">
                Total
              </th>
              <th scope="col" className="num">
                Units
              </th>
              <th scope="col" className="num">
                Base units
              </th>
            </tr>
          </thead>
          <tbody>
            {all.map((r) => {
              const isUnmapped = r.key === '__unmapped';
              return (
                <tr key={r.key} className={isUnmapped ? 'row-unmapped' : ''}>
                  <th scope="row">
                    {r.name}
                    {r.pack > 1 && <small className="row-sub">1 pack = {r.pack} base units</small>}
                    {isUnmapped && <small className="row-sub">Blinkit items not yet matched to a product</small>}
                  </th>
                  {r.cells.map((c, i) => (
                    <td key={i} className="num">
                      {t.columns[i].included ? (
                        c && (c.revenue !== 0 || !isUnmapped) ? (
                          <>
                            {rupees(c.revenue)}
                            <small className="cell-sub">{c.units != null ? `${num(c.units)} units` : 'units unknown'}</small>
                          </>
                        ) : (
                          <span className="muted">—</span>
                        )
                      ) : (
                        <Missing label={t.columns[i].id === 'instamart' ? 'Missing' : 'Not in report'} />
                      )}
                    </td>
                  ))}
                  <td className="num strong">{rupees(r.revenue)}</td>
                  <td className="num">{r.units != null ? num(r.units) : '—'}</td>
                  <td className="num">{r.baseUnits != null ? num(r.baseUnits) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">All products</th>
              {t.totals.map((v, i) => (
                <td key={i} className="num">
                  {v != null ? rupees(v) : '—'}
                </td>
              ))}
              <td className="num strong">{rupees(t.grandTotal)}</td>
              <td />
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="table-note">
        Units are packs sold. Base units count each {skuById['NS-CHAAT-50']?.name ?? 'single'} packet inside a{' '}
        {skuById['NS-BOX-3']?.name ?? 'multi-pack'} separately.
        {t.unmappedRow &&
          ` ${rupees(t.unmappedRow.revenue)} of ${channelById.blinkit.name} sales isn’t matched to a product yet. It’s in the total, so the columns still add up to the headline.`}
      </p>
    </>
  );
}

export function Breakdowns({ input }: { input: EngineInput }) {
  const [tab, setTab] = useState<'city' | 'product'>('city');
  return (
    <section className="block" aria-labelledby="bd-title">
      <div className="block-head">
        <Eyebrow num="02">Breakdown</Eyebrow>
        <h2 id="bd-title" className="display">By city and by product</h2>
        <p className="muted">Consumer sales for {data.weeks.find((w) => w.id === data.report.current_week)!.label}.</p>
      </div>
      <div className="tabs" role="tablist" aria-label="Breakdown">
        <button role="tab" aria-selected={tab === 'city'} className={`tab${tab === 'city' ? ' is-on' : ''}`} onClick={() => setTab('city')}>
          By city
        </button>
        <button
          role="tab"
          aria-selected={tab === 'product'}
          className={`tab${tab === 'product' ? ' is-on' : ''}`}
          onClick={() => setTab('product')}
        >
          By product
        </button>
      </div>
      <div role="tabpanel">{tab === 'city' ? <ByCity input={input} /> : <ByProduct input={input} />}</div>
    </section>
  );
}
