import { useEffect, useMemo, useRef, useState } from 'react';
import { Model } from '../financial/model';
import { DEMO_HOLDINGS } from '../financial/demoPortfolio';
import { buildViewModel, type UIState, type ViewModelActions, type Screen } from '../financial/viewModel';
import type { Assumptions } from '../financial/types';
import { useAuth } from './useAuth';
import { useCloudPlan } from './useCloudPlan';

export function usePersonalWealthOS() {
  const modelRef = useRef<Model | null>(null);
  if (!modelRef.current) modelRef.current = new Model();
  const model = modelRef.current;

  const { user } = useAuth();
  const cloud = useCloudPlan(user?.id ?? null, model);

  const [ui, setUi] = useState<UIState>({
    screen: 'overview', navOpen: false, whatIf: false, viewport: 'desktop',
    mode: 'Advisor', openClass: null, uploads: {}, night: false,
  });
  const [aLocal, setALocal] = useState<Assumptions>(() => model.defaults());
  const [mc10k, setMc10k] = useState<any>(null);
  const [mc10kKey, setMc10kKey] = useState<string | null>(null);

  const ready = cloud.enabled ? !cloud.loading : true;
  const a: Assumptions = cloud.enabled ? (cloud.assumptions ?? model.defaults()) : aLocal;
  model.HOLD = cloud.enabled ? (cloud.holdings.length ? cloud.holdings : DEMO_HOLDINGS) : DEMO_HOLDINGS;
  const demoBanner = model.HOLD.some(h => h.isDemo);

  // What-if baseline: a local snapshot of `a`, only captured once real data is ready.
  const [base, setBaseState] = useState<Assumptions | null>(null);
  useEffect(() => {
    if (ready && base === null) setBaseState({ ...a });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Night mode: restore from localStorage on mount.
  useEffect(() => {
    let n = false;
    try { n = localStorage.getItem('pwos-night') === '1'; } catch { /* noop */ }
    document.documentElement.classList.toggle('pw-night', n);
    if (n) setUi(s => ({ ...s, night: true }));
  }, []);

  // Debounced full-precision (10k path) Monte Carlo refinement whenever assumptions change.
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      const m = model.mc(a, 10000, false, { eduFloor: 1 });
      setMc10k(m);
      setMc10kKey(JSON.stringify(a));
    }, 420);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a, ready]);

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
      toggleNight: () => setUi(prev => {
        const n = !prev.night;
        try {
          document.documentElement.classList.toggle('pw-night', n);
          localStorage.setItem('pwos-night', n ? '1' : '0');
        } catch { /* noop */ }
        return { ...prev, night: n };
      }),
      resetAll: () => { const d = model.defaults(); applyA(d); setBaseState(d); },
      resetWhatIf: () => applyA({ ...(base ?? a) }),
      commitWhatIf: () => setBaseState({ ...a }),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a, base, model, cloud.enabled]);

  const vm = useMemo(
    () => buildViewModel(model, ui, a, base ?? a, mc10k, mc10kKey, actions, demoBanner),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [model, ui, a, base, mc10k, mc10kKey, actions, demoBanner]
  );

  return { vm, loading: cloud.enabled && cloud.loading };
}
