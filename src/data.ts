import raw from '../protoypeInfo/mock-data.json';

export type ChannelId = 'shopify' | 'amazon' | 'blinkit' | 'zepto' | 'instamart';
export type WeekId = 'W1' | 'W2' | 'W3' | 'W4';
export type CityType = 'customer' | 'store' | 'platform_reported';

export interface SkuLine {
  revenue: number;
  units: number;
  base_units: number;
}

export interface GapReason {
  amount: number;
  text: string;
  unexplained?: boolean;
}

export interface Channel {
  id: ChannelId;
  name: string;
  route: string;
  status: 'synced' | 'upload_needed' | 'validated' | 'missing';
  city_type: CityType;
  date_basis: string;
  platform_figure: number | null;
  platform_label: string;
  gap_reasons: GapReason[];
  confidence: {
    days_covered: string;
    mapped_pct: number | null;
    tax_basis: string;
    returns_treatment: string;
    data_age: string;
  };
  sell_through_by_week: Record<WeekId, number | null>;
  sell_in_po_by_week?: Record<WeekId, number>;
  current_week_by_city?: Record<string, number>;
  current_week_by_sku?: Record<string, SkuLine>;
}

export interface Sku {
  sku: string;
  name: string;
  base_units_per_pack: number;
  avg_net_price: number;
}

export interface UnmappedItem {
  platform_item_id: string;
  platform_name: string;
  suggested_sku: string;
  revenue: number;
}

export const NEEDS_NEW_SKU = 'NEEDS_NEW_SKU';

export interface MockData {
  brand: { name: string; category: string };
  report: {
    report_date: string;
    report_day: string;
    deadline: string;
    current_week: WeekId;
    previous_week: WeekId;
    week_definition: string;
  };
  weeks: { id: WeekId; label: string; start: string; end: string }[];
  skus: Sku[];
  cities: string[];
  city_type_labels: Record<CityType, string>;
  channels: Channel[];
  po_trap: {
    channel: ChannelId;
    explanation: string;
    old_excel_view: { method: string };
  };
  restatement: {
    channel: ChannelId;
    week: WeekId;
    as_sent: number;
    restated: number;
    change: number;
    reason: string;
  };
  blinkit_upload: {
    file_name: string;
    first_attempt: {
      rows: number;
      required_columns_found: string;
      missing_days: string[];
      duplicate_rows: number;
      unexpected_columns: string[];
      status: string;
    };
    corrected_file: {
      file_name: string;
      rows: number;
      required_columns_found: string;
      missing_days: string[];
      duplicate_rows: number;
      status: string;
    };
    unmapped_items: UnmappedItem[];
    unmapped_revenue_total: number;
    required_columns: string[];
  };
  trust_capture: {
    options: [string, string];
    history: { week: WeekId; value: string }[];
  };
}

export const data = raw as unknown as MockData;

export const CHANNEL_IDS = data.channels.map((c) => c.id);
export const channelById = Object.fromEntries(data.channels.map((c) => [c.id, c])) as Record<
  ChannelId,
  Channel
>;
export const skuById = Object.fromEntries(data.skus.map((s) => [s.sku, s])) as Record<string, Sku>;
export const CUR = data.report.current_week;
export const PREV = data.report.previous_week;
export const weekLabel = (id: WeekId) => data.weeks.find((w) => w.id === id)!.label;
