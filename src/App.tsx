import { sx } from './components/sx';
import { usePersonalWealthOS } from './hooks/usePersonalWealthOS';
import Header from './layouts/Header';
import NavRail from './layouts/NavRail';
import WhatIfDrawer from './layouts/WhatIfDrawer';
import DemoBanner from './layouts/DemoBanner';
import OverviewPage from './pages/OverviewPage';
import PortfolioPage from './pages/PortfolioPage';
import RetirementPage from './pages/RetirementPage';
import EducationPage from './pages/EducationPage';
import MarriagePage from './pages/MarriagePage';
import RiskPage from './pages/RiskPage';
import RecommendationsPage from './pages/RecommendationsPage';
import AssumptionsPage from './pages/AssumptionsPage';
import UploadPage from './pages/UploadPage';

export default function App() {
  const { vm, loading } = usePersonalWealthOS();

  if (loading) {
    return (
      <div style={sx('min-height:100vh;display:grid;place-items:center;background:var(--color-bg);color:var(--color-text);font-family:var(--font-body);font-size:13px;opacity:.6')}>
        Loading your plan…
      </div>
    );
  }

  return (
    <div style={sx('min-height:100vh;font-family:var(--font-body);color:var(--color-text);background:var(--color-bg);padding-bottom:120px')}>
      <Header vm={vm} />

      <div style={vm.stageStyle}>
        <div style={sx('max-width:1280px;margin:0 auto;padding:26px 26px 40px')}>
          {vm.demoBanner && <DemoBanner />}

          {vm.is.overview && <OverviewPage vm={vm} />}
          {vm.is.portfolio && <PortfolioPage vm={vm} />}
          {vm.is.retirement && <RetirementPage vm={vm} />}
          {vm.is.education && <EducationPage vm={vm} />}
          {vm.is.marriage && <MarriagePage vm={vm} />}
          {vm.is.risk && <RiskPage vm={vm} />}
          {vm.is.recommendations && <RecommendationsPage vm={vm} />}
          {vm.is.assumptions && <AssumptionsPage vm={vm} />}
          {vm.is.upload && <UploadPage vm={vm} />}
        </div>
      </div>

      <NavRail vm={vm} />
      <WhatIfDrawer vm={vm} />
    </div>
  );
}
