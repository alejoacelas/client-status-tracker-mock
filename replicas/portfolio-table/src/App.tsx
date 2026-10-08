import { useEffect } from 'react';
import { Shell } from './components/Shell';
import { getPortfolio, getProject, StoreProvider, ToastProvider, useRoute, useStore } from './store';
import { PortfolioPage } from './views/PortfolioPage';
import { PortfoliosIndex } from './views/PortfoliosIndex';
import { ProjectPage } from './views/ProjectPage';
import { StatusComposer } from './views/StatusComposer';
import { StatusDetail } from './views/StatusDetail';
import { NotReplicated } from './views/Placeholder';

function Router() {
  const route = useRoute();
  const { data } = useStore();
  const [head, a, b, c] = route;

  useEffect(() => {
    if (!head) window.location.replace('#/portfolio/all-clients/list');
  }, [head]);

  // Page title follows the current view, like the original.
  useEffect(() => {
    let t = data.workspace;
    if (head === 'portfolio') t = `${getPortfolio(data, a)?.name ?? 'Portfolio'} - ${data.workspace}`;
    if (head === 'project') t = `${getProject(data, a)?.name ?? 'Project'} - ${data.workspace}`;
    if (head === 'portfolios') t = `Portfolios - ${data.workspace}`;
    document.title = t;
  }, [head, a, data]);

  // Full-page views without the shell.
  if (head === 'compose') return <StatusComposer parent={{ type: a as 'project' | 'portfolio', id: b }} preset={c} />;
  if (head === 'edit') return <StatusComposer editId={a} />;
  if (head === 'update') return <StatusDetail id={a} />;

  let active = head ?? '';
  let body: React.ReactNode;
  switch (head) {
    case 'portfolio':
      active = 'portfolio:' + a;
      body = <PortfolioPage id={a} tab={b ?? 'list'} />;
      break;
    case 'project':
      active = 'project:' + a;
      body = <ProjectPage id={a} />;
      break;
    case 'portfolios':
      body = <PortfoliosIndex />;
      break;
    case 'home':
      body = <NotReplicated title="Home" text="The home page is not part of this replica. Portfolios start from All clients." />;
      break;
    case 'my-tasks':
      body = <NotReplicated title="My tasks" text="The seed has no tasks, so My tasks is not replicated." />;
      break;
    case 'inbox':
      body = <NotReplicated title="Inbox" text="Notifications are not part of this replica." />;
      break;
    case 'reporting':
      body = <NotReplicated title="Reporting" text="Workspace reporting dashboards are not part of this replica. Each portfolio has its own Dashboard tab." />;
      break;
    case 'goals':
      body = <NotReplicated title="Goals" text="Goals are not part of this replica." />;
      break;
    default:
      body = null;
  }
  return <Shell active={active}>{body}</Shell>;
}

export function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <Router />
      </ToastProvider>
    </StoreProvider>
  );
}
