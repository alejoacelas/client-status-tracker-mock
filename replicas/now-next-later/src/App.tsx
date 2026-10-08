import { useEffect, useMemo, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { useRoute, setQuery } from './router';
import { useStore } from './store';
import type { Stage } from './types';
import { byOrder, DATA } from './util';
import { SideNav, MobileBar, PortfolioHeader, ProductHeader, PortfolioOverview } from './components/Shell';
import { RoadmapPage, type Scope } from './components/RoadmapPage';
import { InitiativeCanvas } from './components/Dialogs';
import { PublishedList, PublishedPage } from './components/Published';
import { Toaster, notInReplica } from './components/bits';

export default function App() {
  const route = useRoute();
  const { state } = useStore();
  const [navOpen, setNavOpen] = useState(false);
  const [section, a, b] = route.path;

  useEffect(() => setNavOpen(false), [route.path.join('/')]);
  useEffect(() => {
    if (section !== 'p') document.title = `Roadmap · ${DATA.agency}`;
    window.scrollTo(0, 0);
  }, [section, a, b]);

  const stageParam = route.query.get('stage');
  const stage: Stage = stageParam === 'completed' || stageParam === 'candidates' ? stageParam : 'roadmap';
  const openId = route.query.get('i');

  let scope: Scope | null = null;
  if (section === 'product' && DATA.products.some((p) => p.id === a)) scope = { kind: 'product', productId: a };
  else if (section !== 'p') scope = { kind: 'portfolio' };

  const siblings = useMemo(() => {
    if (!openId) return [];
    const item = state.initiatives.find((i) => i.id === openId);
    if (!item) return [];
    return state.initiatives
      .filter((i) => i.column === item.column && (!scope || scope.kind === 'portfolio' || i.product === scope.productId))
      .sort(byOrder)
      .map((i) => i.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId, state.initiatives, section, a]);

  if (section === 'p') {
    return (
      <>
        <PublishedPage token={a || ''} />
        <Toaster />
      </>
    );
  }

  let header: React.ReactNode;
  let body: React.ReactNode;
  if (scope?.kind === 'product') {
    header = <ProductHeader productId={scope.productId} />;
    body = <RoadmapPage key={scope.productId} scope={scope} stage={stage} />;
  } else if (a === 'published') {
    header = <PortfolioHeader active="Published roadmaps" />;
    body = <PublishedList />;
  } else if (a === 'overview') {
    header = <PortfolioHeader active="Product Portfolio" />;
    body = <PortfolioOverview />;
  } else {
    header = <PortfolioHeader active="Roadmap" />;
    body = <RoadmapPage key="portfolio" scope={{ kind: 'portfolio' }} stage={stage} />;
  }

  return (
    <>
      <SideNav open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="main">
        <MobileBar onMenu={() => setNavOpen(true)} />
        {header}
        <main className="content">{body}</main>
      </div>
      {openId && <InitiativeCanvas id={openId} siblings={siblings} onClose={() => setQuery('i', undefined)} />}
      <button className="help-fab" aria-label="Help" onClick={() => notInReplica('The help chat')}>
        <MessageCircle size={24} />
      </button>
      <Toaster />
    </>
  );
}
