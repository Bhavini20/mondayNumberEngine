/**
 * The Monday Number Engine — all calculations live here.
 * Screens call these functions and only display what comes back.
 * Every number is read from mock-data.json or computed from it.
 */
import {
  data,
  channelById,
  skuById,
  CHANNEL_IDS,
  CUR,
  PREV,
  NEEDS_NEW_SKU,
  type ChannelId,
  type Sku,
  type WeekId,
  type CityType,
} from '../data';
import { rupees, dayLabel, listJoin } from './format';

// ---------- Inputs (the parts of demo state that change numbers) ----------

export type UploadStatus = 'none' | 'needs_attention' | 'validated' | 'accepted_partial';

export type ItemDecision =
  | { status: 'pending' }
  | { status: 'mapped'; sku: string }
  | { status: 'unmapped' };

export interface EngineInput {
  upload: UploadStatus;
  items: Record<string, ItemDecision>;
  newSkus: Sku[];
}

export const initialItems = (): Record<string, ItemDecision> =>
  Object.fromEntries(
    data.blinkit_upload.unmapped_items.map((i) => [i.platform_item_id, { status: 'pending' } as ItemDecision]),
  );

const WEEKS: WeekId[] = data.weeks.map((w) => w.id);
const TOLERANCE_PCT = 2;
const NUMBER_WORDS = ['no', 'one', 'two', 'three', 'four', 'five'];
export const numberWord = (n: number) => NUMBER_WORDS[n] ?? String(n);

const wow = (cur: number, prev: number) => (cur / prev - 1) * 100;

/** Tax or returns treatment not verified: the platform's own basis is used as reported. */
export function basisUnverified(id: ChannelId): boolean {
  const c = channelById[id].confidence;
  return !c.tax_basis.startsWith('verified') || !c.returns_treatment.startsWith('verified');
}
const st = (id: ChannelId, w: WeekId) => channelById[id].sell_through_by_week[w];

export function allSkus(input: EngineInput): Sku[] {
  return [...data.skus, ...input.newSkus];
}
export function skuName(input: EngineInput, sku: string): string {
  return skuById[sku]?.name ?? input.newSkus.find((s) => s.sku === sku)?.name ?? sku;
}

// ---------- Unmapped revenue ----------

export function unmapped(input: EngineInput) {
  const items = data.blinkit_upload.unmapped_items;
  const open = items.filter((i) => input.items[i.platform_item_id]?.status !== 'mapped');
  const revenue = open.reduce((s, i) => s + i.revenue, 0);
  const pending = items.filter((i) => input.items[i.platform_item_id]?.status === 'pending');
  const total = st('blinkit', CUR)!;
  return {
    revenue,
    itemCount: open.length,
    pendingCount: pending.length,
    mappedPct: ((total - revenue) / total) * 100,
    totalItems: items.length,
    startingRevenue: items.reduce((s, i) => s + i.revenue, 0),
  };
}

// ---------- Readiness ----------

export type Tone = 'ok' | 'warn' | 'bad';

export interface ConfidenceReason {
  label: string;
  value: string;
  tone: Tone;
}

export interface Readiness {
  id: ChannelId;
  name: string;
  route: string;
  ready: boolean;
  statusLabel: string;
  tone: Tone;
  /** Short phrase used in the completeness strip when not ready. */
  gapPhrase?: string;
  currentSales: number | null;
  confidence: ConfidenceReason[];
}

const missingDay = data.blinkit_upload.first_attempt.missing_days[0];
const missingDayShort = dayLabel(missingDay).split(' ')[0]; // "Thu"

function blinkitUploaded(u: UploadStatus) {
  return u === 'validated' || u === 'accepted_partial' || u === 'needs_attention';
}

export function readiness(input: EngineInput): Readiness[] {
  return CHANNEL_IDS.map((id) => {
    const ch = channelById[id];
    const c = ch.confidence;
    let ready = false;
    let statusLabel = '';
    let tone: Tone = 'ok';
    let gapPhrase: string | undefined;
    let days = c.days_covered;
    let mapped = c.mapped_pct == null ? '—' : `${c.mapped_pct}%`;
    let mappedTone: Tone = c.mapped_pct === 100 ? 'ok' : 'warn';
    let age = c.data_age;

    switch (ch.status) {
      case 'synced':
        ready = true;
        statusLabel = 'Synced';
        break;
      case 'validated':
        ready = true;
        statusLabel = 'Validated';
        break;
      case 'missing':
        statusLabel = 'Report missing';
        tone = 'bad';
        gapPhrase = `${ch.name} missing`;
        mappedTone = 'bad';
        break;
      case 'upload_needed': {
        const u = unmapped(input);
        if (input.upload === 'validated') {
          ready = true;
          statusLabel = 'Validated';
          days = '7/7';
        } else if (input.upload === 'accepted_partial') {
          statusLabel = `Incomplete (${missingDayShort} missing)`;
          tone = 'warn';
          gapPhrase = `${ch.name} incomplete (${missingDayShort} missing)`;
          days = `6/7 (${dayLabel(missingDay)} missing)`;
        } else if (input.upload === 'needs_attention') {
          statusLabel = 'Needs attention';
          tone = 'warn';
          gapPhrase = `${ch.name} not validated`;
          days = `6/7 (${dayLabel(missingDay)} missing)`;
        } else {
          statusLabel = 'Upload needed';
          tone = 'warn';
          gapPhrase = `${ch.name} not uploaded`;
          days = '0/7 (not uploaded yet)';
          age = 'Not uploaded this week';
        }
        if (blinkitUploaded(input.upload)) {
          mapped = `${u.mappedPct.toFixed(1)}%${u.revenue > 0 ? ` (${rupees(u.revenue)} unmapped)` : ''}`;
          mappedTone = u.revenue === 0 ? 'ok' : 'warn';
        } else {
          mapped = '—';
          mappedTone = 'warn';
        }
        break;
      }
    }

    const daysTone: Tone = days.startsWith('7/7') ? 'ok' : days.startsWith('0/7') ? 'bad' : 'warn';
    const verified = (s: string): Tone => (s.startsWith('verified') ? 'ok' : 'warn');

    return {
      id,
      name: ch.name,
      route: ch.route,
      ready,
      statusLabel,
      tone,
      gapPhrase,
      currentSales: ready ? st(id, CUR) : null,
      confidence: [
        { label: 'Days covered', value: days, tone: daysTone },
        { label: 'Mapped to SKUs', value: mapped, tone: mappedTone },
        { label: 'Tax basis', value: c.tax_basis, tone: verified(c.tax_basis) },
        { label: 'Returns', value: c.returns_treatment, tone: verified(c.returns_treatment) },
        { label: 'Data age', value: age, tone: ch.status === 'missing' ? 'bad' : 'ok' },
      ],
    };
  });
}

export function readyIds(input: EngineInput): ChannelId[] {
  return readiness(input)
    .filter((r) => r.ready)
    .map((r) => r.id);
}

// ---------- Headline ----------

export function headline(input: EngineInput) {
  const rows = readiness(input);
  const included = rows.filter((r) => r.ready);
  const notReady = rows.filter((r) => !r.ready);
  const current = included.reduce((s, r) => s + st(r.id, CUR)!, 0);
  const previous = included.reduce((s, r) => s + st(r.id, PREV)!, 0);
  const blinkitIn = included.some((r) => r.id === 'blinkit');
  const unmappedRevenue = blinkitIn ? unmapped(input).revenue : 0;

  const strip = [
    `${included.length} of ${rows.length} channels`,
    ...notReady.map((r) => r.gapPhrase!),
    ...(unmappedRevenue > 0 ? [`${rupees(unmappedRevenue)} unmapped`] : []),
  ];

  const excludedPrev = notReady
    .map((r) => ({ name: r.name, prev: st(r.id, PREV) }))
    .filter((x): x is { name: string; prev: number } => x.prev != null);

  const word = numberWord(included.length);
  const comparisonNote = `Week-on-week compares the same ${word} channels in both weeks.`;
  const exclusionNote = excludedPrev.length
    ? excludedPrev.map((x) => `${x.name}'s previous week (${rupees(x.prev)})`).join(' and ') +
      ` ${excludedPrev.length > 1 ? 'are' : 'is'} excluded from both sides.`
    : '';

  const unverified = included.filter((r) => basisUnverified(r.id)).map((r) => r.name);
  const basisNote = unverified.length
    ? `${listJoin(unverified)}: tax and returns basis unverified (platform-reported).`
    : '';

  return {
    current,
    previous,
    wowPct: wow(current, previous),
    basisNote,
    included: included.map((r) => r.id),
    notReady: notReady.map((r) => ({ id: r.id, name: r.name, phrase: r.gapPhrase! })),
    incomplete: notReady.length > 0,
    unmappedRevenue,
    strip,
    comparisonNote,
    exclusionNote,
  };
}

// ---------- Channel growth ----------

export function channelGrowth(input: EngineInput) {
  return readiness(input).map((r) => {
    const ch = channelById[r.id];
    const cur = st(r.id, CUR);
    const prev = st(r.id, PREV);
    const trend = WEEKS.map((w) => ({ week: w, value: ch.sell_through_by_week[w] }));
    // Only weeks with data; the current week only once the channel is ready.
    const shownTrend = trend.filter((t) => t.value != null && (t.week !== CUR || r.ready));
    const sellIn = ch.sell_in_po_by_week
      ? {
          current: ch.sell_in_po_by_week[CUR],
          previous: ch.sell_in_po_by_week[PREV],
          wowPct: wow(ch.sell_in_po_by_week[CUR], ch.sell_in_po_by_week[PREV]),
          trend: WEEKS.map((w) => ({ week: w, value: ch.sell_in_po_by_week![w] as number | null })),
        }
      : null;
    return {
      ...r,
      current: r.ready ? cur : null,
      previous: prev,
      wowPct: r.ready && cur != null && prev != null ? wow(cur, prev) : null,
      trend: shownTrend,
      cityType: ch.city_type,
      cityTypeLabel: data.city_type_labels[ch.city_type],
      basisUnverified: ch.status !== 'missing' && basisUnverified(r.id),
      sellIn,
    };
  });
}

// ---------- PO trap & old Excel ----------

export function poTrap() {
  const id = data.po_trap.channel;
  const ch = channelById[id];
  const si = ch.sell_in_po_by_week!;
  return {
    channel: ch.name,
    sellInCurrent: si[CUR],
    sellInPrevious: si[PREV],
    sellInWowPct: wow(si[CUR], si[PREV]),
    sellThroughCurrent: st(id, CUR)!,
    sellThroughPrevious: st(id, PREV)!,
    sellThroughWowPct: wow(st(id, CUR)!, st(id, PREV)!),
    explanation: data.po_trap.explanation,
  };
}

/**
 * The old Excel method: Blinkit purchase-order invoices instead of Blinkit
 * consumer sales, and last Monday's un-restated Shopify figure. The ONLY place
 * sell-in is ever added to sell-through.
 */
export function oldExcelView() {
  const channels: ChannelId[] = ['shopify', 'amazon', 'blinkit', 'zepto'];
  const r = data.restatement;
  const valueFor = (id: ChannelId, w: WeekId) => {
    const ch = channelById[id];
    if (ch.sell_in_po_by_week) return ch.sell_in_po_by_week[w];
    if (id === r.channel && w === r.week) return r.as_sent;
    return st(id, w)!;
  };
  const current = channels.reduce((s, id) => s + valueFor(id, CUR), 0);
  const previous = channels.reduce((s, id) => s + valueFor(id, PREV), 0);
  const b = channelById.blinkit.sell_in_po_by_week!;
  return {
    current,
    previous,
    wowPct: wow(current, previous),
    blinkitWowPct: wow(b[CUR], b[PREV]),
    method: data.po_trap.old_excel_view.method,
  };
}

// ---------- Restatement ----------

export function restatement() {
  return { ...data.restatement, channelName: channelById[data.restatement.channel].name };
}

// ---------- Gap check ----------

export function gapCheck(id: ChannelId, input: EngineInput) {
  const ch = channelById[id];
  const r = readiness(input).find((x) => x.id === id)!;
  const base = {
    id,
    name: ch.name,
    route: ch.route,
    dateBasis: ch.date_basis,
    cityType: ch.city_type,
    cityTypeLabel: data.city_type_labels[ch.city_type],
    platformLabel: ch.platform_label,
    confidence: r.confidence,
    restatement: data.restatement.channel === id ? restatement() : null,
    basisUnverified: basisUnverified(id),
  };

  if (ch.status === 'missing') {
    return { ...base, available: false as const, unavailableReason: 'No data this week. The report has not been uploaded.' };
  }
  if (id === 'blinkit' && input.upload !== 'validated') {
    const why =
      input.upload === 'none'
        ? 'Upload the Blinkit report to compare it with Seller Hub.'
        : `${dayLabel(missingDay)} is missing, so this week can't be compared with Seller Hub's full-week figure.`;
    return { ...base, available: false as const, unavailableReason: why };
  }

  const ours = st(id, CUR)!;
  const platform = ch.platform_figure!;
  const reasons = ch.gap_reasons;
  const unexplained = reasons.filter((g) => g.unexplained).reduce((s, g) => s + g.amount, 0);
  const unexplainedPct = (Math.abs(unexplained) / platform) * 100;
  return {
    ...base,
    available: true as const,
    ours,
    platform,
    difference: ours - platform,
    reasons,
    matches: ours === platform,
    unexplained,
    unexplainedPct,
    withinTolerance: unexplainedPct <= TOLERANCE_PCT,
    tolerancePct: TOLERANCE_PCT,
  };
}

// ---------- Breakdowns ----------

export const CITY_TYPE_SHORT: Record<CityType, string> = {
  customer: 'Customer city',
  store: 'Store city',
  platform_reported: 'Platform-reported city',
};

export function cityBreakdown(input: EngineInput) {
  const ready = readyIds(input);
  const columns = data.channels.map((ch) => ({
    id: ch.id,
    name: ch.name,
    cityType: ch.city_type,
    cityTypeShort: CITY_TYPE_SHORT[ch.city_type],
    included: ready.includes(ch.id),
    phrase: readiness(input).find((r) => r.id === ch.id)!.statusLabel,
  }));
  const rows = data.cities.map((city) => {
    const values = columns.map((col) =>
      col.included ? (channelById[col.id].current_week_by_city?.[city] ?? null) : null,
    );
    return { city, values, total: values.reduce<number>((s, v) => s + (v ?? 0), 0) };
  });
  const totals = columns.map((col, i) => (col.included ? rows.reduce((s, r) => s + (r.values[i] ?? 0), 0) : null));
  return { columns, rows, totals, grandTotal: rows.reduce((s, r) => s + r.total, 0) };
}

interface Cell {
  revenue: number;
  units: number | null;
  baseUnits: number | null;
}

export function productBreakdown(input: EngineInput) {
  const ready = readyIds(input);
  const skus = allSkus(input);
  const columns = data.channels.map((ch) => ({ id: ch.id, name: ch.name, included: ready.includes(ch.id) }));

  const unitsFor = (sku: string, revenue: number) => {
    const s = skuById[sku];
    return s ? Math.round(revenue / s.avg_net_price) : null;
  };
  const packFor = (sku: string) => skus.find((s) => s.sku === sku)?.base_units_per_pack ?? 1;

  // Per channel, per SKU cells. Blinkit is adjusted by the mapping queue.
  const table: Record<string, Record<string, Cell>> = {};
  for (const col of columns) {
    const ch = channelById[col.id];
    const cells: Record<string, Cell> = {};
    for (const s of skus) {
      const line = ch.current_week_by_sku?.[s.sku];
      cells[s.sku] = line
        ? { revenue: line.revenue, units: line.units, baseUnits: line.base_units }
        : { revenue: 0, units: 0, baseUnits: 0 };
    }
    cells.__unmapped = { revenue: 0, units: null, baseUnits: null };
    table[col.id] = cells;
  }

  // current_week_by_sku is the final mapped state (every suggestion confirmed,
  // the Festive Pack unmapped). Undo what the analyst hasn't confirmed.
  const b = table.blinkit;
  const move = (from: string | null, to: string | null, revenue: number) => {
    if (from) {
      const u = unitsFor(from, revenue);
      const c = b[from];
      c.revenue -= revenue;
      if (c.units != null && u != null) {
        c.units -= u;
        c.baseUnits = c.units * packFor(from);
      }
    }
    const target = to ?? '__unmapped';
    const c = b[target];
    c.revenue += revenue;
    if (to) {
      const u = unitsFor(to, revenue);
      if (u == null) c.units = null;
      else if (c.units != null) {
        c.units += u;
        c.baseUnits = c.units * packFor(to);
      }
    }
  };
  for (const item of data.blinkit_upload.unmapped_items) {
    const d = input.items[item.platform_item_id] ?? { status: 'pending' };
    const finalSku = item.suggested_sku === NEEDS_NEW_SKU ? null : item.suggested_sku;
    const actualSku = d.status === 'mapped' ? d.sku : null;
    // Items with no SKU in the final state (the Festive Pack) aren't in
    // current_week_by_sku at all, so they always need placing somewhere.
    if (finalSku !== actualSku || finalSku === null) move(finalSku, actualSku, item.revenue);
  }

  const rowFor = (key: string, name: string, pack: number) => {
    const cells = columns.map((col) => (col.included ? table[col.id][key] : null));
    const inc = cells.filter((c): c is Cell => c != null);
    const revenue = inc.reduce((s, c) => s + c.revenue, 0);
    const unitsKnown = inc.every((c) => c.units != null);
    const units = unitsKnown ? inc.reduce((s, c) => s + (c.units ?? 0), 0) : null;
    return { key, name, pack, cells, revenue, units, baseUnits: units != null ? units * pack : null };
  };

  const rows = skus.map((s) => rowFor(s.sku, s.name, s.base_units_per_pack));
  const unmappedRow = ready.includes('blinkit') ? rowFor('__unmapped', 'Unmapped (Blinkit)', 1) : null;
  const all = unmappedRow && unmappedRow.revenue > 0 ? [...rows, unmappedRow] : rows;
  const totals = columns.map((col) =>
    col.included ? all.reduce((s, r) => s + (r.cells[columns.indexOf(col)]?.revenue ?? 0), 0) : null,
  );
  return {
    columns,
    rows,
    unmappedRow: unmappedRow && unmappedRow.revenue > 0 ? unmappedRow : null,
    totals,
    grandTotal: all.reduce((s, r) => s + r.revenue, 0),
  };
}

// ---------- Review & send ----------

export function openIssues(input: EngineInput) {
  const rows = readiness(input);
  const issues: { tone: Tone; text: string }[] = [];
  for (const r of rows.filter((x) => !x.ready)) {
    const text =
      r.id === 'instamart'
        ? `${r.name} report missing. It will be left out of both weeks.`
        : `${r.gapPhrase}. It will be left out of both weeks.`;
    issues.push({ tone: r.id === 'instamart' ? 'bad' : 'warn', text });
  }
  if (blinkitUploaded(input.upload)) {
    const u = unmapped(input);
    if (u.revenue > 0) {
      issues.push({
        tone: 'warn',
        text: `${rupees(u.revenue)} of Blinkit sales not mapped to a product (${u.itemCount} item${u.itemCount === 1 ? '' : 's'}). It stays in the total and shows as its own row.`,
      });
    }
  }
  const unverified = rows.filter((r) => r.ready && !channelById[r.id].confidence.tax_basis.startsWith('verified'));
  if (unverified.length) {
    issues.push({
      tone: 'warn',
      text: `Tax basis not yet verified for ${unverified.map((r) => r.name).join(' and ')}.`,
    });
  }
  return issues;
}

// ---------- Trust ----------

export function trustHistory(thisWeek: string | null) {
  const h = data.trust_capture.history.map((x) => ({ ...x, current: false }));
  return thisWeek ? [...h, { week: CUR, value: thisWeek, current: true }] : h;
}

// ---------- Landing-page explainers ----------

const FOUR: ChannelId[] = ['shopify', 'amazon', 'blinkit', 'zepto'];

function fourChannel(w: WeekId, blinkit: 'sell_in' | 'sell_through', shopify: 'as_sent' | 'restated') {
  const r = data.restatement;
  const parts = FOUR.map((id) => {
    const ch = channelById[id];
    let value = st(id, w)!;
    let kind: 'sales' | 'po' = 'sales';
    if (id === 'blinkit' && blinkit === 'sell_in') {
      value = ch.sell_in_po_by_week![w];
      kind = 'po';
    }
    if (id === r.channel && w === r.week && shopify === 'as_sent') value = r.as_sent;
    return { id, name: ch.name, value, kind };
  });
  return { total: parts.reduce((s, p) => s + p.value, 0), parts };
}

/** Old Excel → take out purchase orders → restate Shopify = the engine's number. */
export function bridgeStages() {
  const r = data.restatement;
  const defs = [
    {
      key: 'old',
      chip: 'Old Excel',
      blinkit: 'sell_in' as const,
      shopify: 'as_sent' as const,
      note: `Adds Blinkit's purchase orders to consumer sales, against last Monday's Shopify figure.`,
    },
    {
      key: 'nopo',
      chip: '− Purchase orders',
      blinkit: 'sell_through' as const,
      shopify: 'as_sent' as const,
      note: 'Blinkit purchase orders out of both weeks. Consumer sales only.',
    },
    {
      key: 'engine',
      chip: 'Restated',
      blinkit: 'sell_through' as const,
      shopify: 'restated' as const,
      note: `Last week's ${channelById[r.channel].name} restated for refunds: ${rupees(r.as_sent)} → ${rupees(r.restated)}.`,
    },
  ];
  return defs.map((d) => {
    const cur = fourChannel(CUR, d.blinkit, d.shopify);
    const prev = fourChannel(PREV, d.blinkit, d.shopify);
    return { ...d, current: cur.total, previous: prev.total, wowPct: wow(cur.total, prev.total), parts: cur.parts };
  });
}

/** Per channel: what the old Excel adds up vs what the engine reports (standard path). */
export function oldVsEngine() {
  return data.channels.map((ch) => ({
    id: ch.id,
    name: ch.name,
    old: ch.sell_in_po_by_week ? ch.sell_in_po_by_week[CUR] : st(ch.id, CUR),
    oldIsPo: !!ch.sell_in_po_by_week,
    engine: st(ch.id, CUR),
  }));
}

/** Like-for-like week-on-week for any set of channels, plus what a silent drop would show. */
export function likeForLike(ids: ChannelId[]) {
  const withCur = ids.filter((id) => st(id, CUR) != null);
  const current = withCur.reduce((s, id) => s + st(id, CUR)!, 0);
  const previous = withCur.reduce((s, id) => s + st(id, PREV)!, 0);
  const allPrevIds = CHANNEL_IDS.filter((id) => st(id, PREV) != null);
  const naivePrevious = allPrevIds.reduce((s, id) => s + st(id, PREV)!, 0);
  const dropped = allPrevIds.filter((id) => !withCur.includes(id));
  return {
    ids: withCur,
    current,
    previous,
    wowPct: previous ? wow(current, previous) : 0,
    naivePrevious,
    naiveWowPct: naivePrevious ? wow(current, naivePrevious) : 0,
    dropped: dropped.map((id) => ({ id, name: channelById[id].name, prev: st(id, PREV)! })),
  };
}
