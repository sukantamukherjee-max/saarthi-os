import { useEffect, useMemo, useRef, useState } from 'react';
import { Model } from '../financial/model';
import { DEMO_HOLDINGS } from '../financial/demoPortfolio';
import { buildViewModel, type UIState, type ViewModelActions, type Screen } from '../financial/viewModel';
import type { Assumptions } from '../financial/types';
import { useAuth } from './useAuth';
import { useCloudPlan } from './useCloudPlan';
import { useNightMode } from './useNightMode';

export function usePersonalWealthOS() {
  const modelRef = useRef<Model | null>(null);
  if (!modelRef.current) modelRef.current = new Model();
  const model = modelRef.current;

  const { user } = useAuth();
  const cloud = useCloudPlan(user?.id ?? null, model);
  const nightMode = useNightMode();

  const [ui, setUi] = useState<Omit<UIState, 'night'>>({
    screen: 'overview', navOpen: false, whatIf: false, viewport: 'desktop',
    mode: 'Advisor', openClass: null, uploads: {},
  });
  const [aLocal, setALocal] = useState<Assumptions>(() => model.defaults());
  const [mc10k, setMc10k] = useState<any>(null);
  const [mc10kKey, setMc10kKey] = useState<string | null>(null);

  const ready = cloud.enabled ? !cloud.loading : true;
  const a: Assumptions = cloud.enabled ? (cloud.assumptions ?? model.defaults()) : aLocal;
  // Real holdings (even an intentionally empty list) once cloud data is loaded — App
  // shows a loading screen instead of this vm until `ready`, so no fallback is needed
  // here; falling back to DEMO_HOLDINGS whenever the list was merely empty previously
  // masked the user's own "clear demo data" action.
  model.HOLD = cloud.enabled ? cloud.holdings : DEMO_HOLDINGS;
  const demoBanner = model.HOLD.some(h => h.isDemo);

  // What-if baseline: a local snapshot of `a`, only captured once real data is ready.
  const [base, setBaseState] = useState<Assumptions | null>(null);
  useEffect(() => {
    if (ready && base === null) setBaseState({ ...a });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Debounced full-precision (10k path) Monte Carlo refinement whenever assumptions change.
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      const m = model.mc(a, 10000, false, { eduFloor: 1 });
      setMc10k(m);
      setMc10kKey(JSON.stringify(a) + '|H:' + model.holdKey());
    }, 420);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a, ready, model.HOLD]);

  const actions: ViewModelActions = useMemo(() => {
    const applyA = (next: Assumptions) => {
      if (cloud.enabled) cloud.saveAssumptions(next);
      else setALocal(next);
    };
    return {
      goScreen: (s: Screen) => setUi(prev => ({ ...prev, screen: s, navOpen: false })),
      setUiPatch: (patch) => setUi(prev => ({ ...prev, ...patch })),
      setA: (patch) => applyA({ ...a, ...patch }),
      replaceA: (obj) => applyA(obj),
      setBase: (obj) => setBaseState(obj),
      toggleNight: nightMode.toggle,
      resetAll: () => { const d = model.defaults(); applyA(d); setBaseState(d); },
      resetWhatIf: () => applyA({ ...(base ?? a) }),
      commitWhatIf: () => setBaseState({ ...a }),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a, base, model, cloud.enabled, nightMode.toggle]);

  const uiForVm: UIState = { ...ui, night: nightMode.night };

  const vm = useMemo(
    () => buildViewModel(model, uiForVm, a, base ?? a, mc10k, mc10kKey, actions, demoBanner),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [model, ui, nightMode.night, a, base, mc10k, mc10kKey, actions, demoBanner]
  );

  return { vm, loading: cloud.enabled && cloud.loading };
}
