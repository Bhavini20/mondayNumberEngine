import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react';
import type { ChannelId, Sku } from '../data';
import { data, NEEDS_NEW_SKU } from '../data';
import { initialItems, type EngineInput, type ItemDecision } from '../engine';

export type Screen = 'start' | 'analyst' | 'founder';
export type AnalystStep = 'board' | 'upload' | 'mapping' | 'gap' | 'review';

export interface DemoState extends EngineInput {
  screen: Screen;
  step: AnalystStep;
  gapChannel: ChannelId;
  reminderSent: boolean;
  /** The engine inputs as they were when the report was sent. */
  sent: EngineInput | null;
  viaJump: boolean;
  trust: string | null;
  showOldExcel: boolean;
  guide: { on: boolean; index: number };
}

export type Action =
  | { type: 'go'; screen: Screen }
  | { type: 'step'; step: AnalystStep }
  | { type: 'openGap'; channel: ChannelId }
  | { type: 'useSample' }
  | { type: 'uploadCorrected' }
  | { type: 'acceptPartial' }
  | { type: 'map'; itemId: string; sku: string }
  | { type: 'leaveUnmapped'; itemId: string }
  | { type: 'undo'; itemId: string }
  | { type: 'acceptAll' }
  | { type: 'createSku'; itemId: string; name: string }
  | { type: 'remind' }
  | { type: 'send' }
  | { type: 'jump' }
  | { type: 'walkThrough' }
  | { type: 'trust'; value: string }
  | { type: 'oldExcel'; on: boolean }
  | { type: 'startGuided' }
  | { type: 'guideTo'; index: number }
  | { type: 'guideOn'; on: boolean }
  | { type: 'reset' };

const TRUST_KEY = 'mne.trust.W4';

function initial(): DemoState {
  return {
    screen: 'start',
    step: 'board',
    gapChannel: 'shopify',
    upload: 'none',
    items: initialItems(),
    newSkus: [],
    reminderSent: false,
    sent: null,
    viaJump: false,
    trust: null,
    showOldExcel: false,
    guide: { on: false, index: 0 },
  };
}

const engineInput = (s: DemoState): EngineInput => ({ upload: s.upload, items: s.items, newSkus: s.newSkus });

function setItem(s: DemoState, id: string, d: ItemDecision): DemoState {
  return { ...s, items: { ...s.items, [id]: d } };
}

function acceptAll(s: DemoState): DemoState {
  const items = { ...s.items };
  for (const i of data.blinkit_upload.unmapped_items) {
    if (items[i.platform_item_id].status === 'pending' && i.suggested_sku !== NEEDS_NEW_SKU) {
      items[i.platform_item_id] = { status: 'mapped', sku: i.suggested_sku };
    }
  }
  return { ...s, items };
}

function reducer(s: DemoState, a: Action): DemoState {
  switch (a.type) {
    case 'go':
      return { ...s, screen: a.screen };
    case 'step':
      return { ...s, screen: 'analyst', step: a.step };
    case 'openGap':
      return { ...s, screen: 'analyst', step: 'gap', gapChannel: a.channel };
    case 'useSample':
      return { ...s, upload: 'needs_attention' };
    case 'uploadCorrected':
      return { ...s, upload: 'validated' };
    case 'acceptPartial':
      return { ...s, upload: 'accepted_partial' };
    case 'map':
      return setItem(s, a.itemId, { status: 'mapped', sku: a.sku });
    case 'leaveUnmapped':
      return setItem(s, a.itemId, { status: 'unmapped' });
    case 'undo':
      return setItem(s, a.itemId, { status: 'pending' });
    case 'acceptAll':
      return acceptAll(s);
    case 'createSku': {
      const sku: Sku = {
        sku: `NS-NEW-${s.newSkus.length + 1}`,
        name: a.name,
        base_units_per_pack: 1,
        avg_net_price: 0,
      };
      return setItem({ ...s, newSkus: [...s.newSkus, sku] }, a.itemId, { status: 'mapped', sku: sku.sku });
    }
    case 'remind':
      return { ...s, reminderSent: true };
    case 'send':
      return { ...s, sent: engineInput(s) };
    case 'jump': {
      // The standard analyst path: corrected upload, accept all suggestions,
      // leave the Festive Pack unmapped, send as incomplete.
      let n: DemoState = { ...initial(), trust: s.trust, upload: 'validated' };
      n = acceptAll(n);
      for (const i of data.blinkit_upload.unmapped_items) {
        if (i.suggested_sku === NEEDS_NEW_SKU) n = setItem(n, i.platform_item_id, { status: 'unmapped' });
      }
      return { ...n, sent: engineInput(n), viaJump: true, screen: 'founder' };
    }
    case 'walkThrough':
      return { ...initial(), screen: 'analyst', step: 'board', guide: { on: true, index: 0 } };
    case 'trust':
      return { ...s, trust: a.value };
    case 'oldExcel':
      return { ...s, showOldExcel: a.on };
    case 'startGuided':
      return { ...initial(), screen: 'analyst', step: 'board', guide: { on: true, index: 0 } };
    case 'guideTo':
      return { ...s, guide: { ...s.guide, index: a.index } };
    case 'guideOn':
      return { ...s, guide: { ...s.guide, on: a.on } };
    case 'reset':
      return initial();
  }
}

interface Ctx {
  state: DemoState;
  input: EngineInput;
  dispatch: (a: Action) => void;
}

const DemoContext = createContext<Ctx | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    const s = initial();
    try {
      s.trust = sessionStorage.getItem(TRUST_KEY);
    } catch {
      /* storage unavailable */
    }
    return s;
  });

  useEffect(() => {
    try {
      if (state.trust) sessionStorage.setItem(TRUST_KEY, state.trust);
      else sessionStorage.removeItem(TRUST_KEY);
    } catch {
      /* storage unavailable */
    }
  }, [state.trust]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [state.screen, state.step]);

  return (
    <DemoContext.Provider value={{ state, input: engineInput(state), dispatch }}>{children}</DemoContext.Provider>
  );
}

export function useDemo() {
  const c = useContext(DemoContext);
  if (!c) throw new Error('useDemo outside DemoProvider');
  return c;
}

export function sameInput(a: EngineInput, b: EngineInput) {
  return JSON.stringify(a) === JSON.stringify(b);
}
