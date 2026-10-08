import { useEffect, useRef } from 'react';
import { CommandMenu } from './components/CommandMenu';
import { Sidebar } from './components/Sidebar';
import { Toast } from './components/bits';
import { I } from './icons';
import { InitiativePage } from './pages/InitiativePage';
import { InitiativesPage } from './pages/InitiativesPage';
import { ProjectPage } from './pages/ProjectPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { PlaceholderPage, PulsePage } from './pages/PulsePage';
import { actions, getState, useStore } from './store';
import { getUI, go, setUI, useRoute, useUI } from './ui';

const DEFAULT = 'project/meridian-portal/overview';

export function App() {
  const route = useRoute();
  const cmdk = useUI((u) => u.cmdk);
  const toastMsg = useUI((u) => u.toast);
  const theme = useStore((s) => s.theme);
  const gPending = useRef(0);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (route.length === 0) go(DEFAULT);
  }, [route.length]);

  useEffect(() => {
    const titles: Record<string, string> = { pulse: 'Pulse', initiatives: 'Initiatives', projects: 'Projects' };
    let t = titles[route[0]] ?? 'Fieldwork Studio';
    if (route[0] === 'project') t = getState().projects.find((p) => p.id === route[1])?.name ?? t;
    document.title = `${t} · Fieldwork Studio`;
  }, [route]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement;
      const typing = !!target.closest('input, textarea, [contenteditable="true"]');
      if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); setUI({ cmdk: !getUI().cmdk }); return; }
      if (mod && e.key.toLowerCase() === 'i' && !typing) { e.preventDefault(); setUI({ details: !getUI().details }); return; }
      if (mod && e.shiftKey && e.key.toLowerCase() === 'l') { e.preventDefault(); actions.setTheme(getState().theme === 'dark' ? 'light' : 'dark'); return; }
      if (typing || mod || e.altKey || getUI().cmdk) return;
      const k = e.key.toLowerCase();
      if (Date.now() - gPending.current < 1200) {
        gPending.current = 0;
        if (k === 'u') go('pulse');
        if (k === 'i') go('initiatives');
        if (k === 'p') go('projects');
        return;
      }
      if (k === 'g') gPending.current = Date.now();
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);

  let page: JSX.Element;
  switch (route[0]) {
    case 'project': page = <ProjectPage route={route} />; break;
    case 'initiatives': page = <InitiativesPage route={route} />; break;
    case 'initiative': page = <InitiativePage route={route} />; break;
    case 'projects': page = <ProjectsPage />; break;
    case 'pulse': page = <PulsePage route={route} />; break;
    case 'inbox': page = <PlaceholderPage title="Inbox" icon={<I.inbox size={16} />} text="Notifications aren't part of this replica. Project updates you follow appear in Pulse." />; break;
    case 'my-issues': page = <PlaceholderPage title="My issues" icon={<I.myIssues size={16} />} text="Issues aren't part of this replica, which covers projects and project updates." />; break;
    default: page = <PlaceholderPage title="Not part of this replica" icon={<I.views size={16} />} text="This replica covers projects, initiatives and project updates." />;
  }

  return (
    <div className="app">
      <Sidebar route={route} />
      <main className="main">{page}</main>
      {cmdk && <CommandMenu route={route} />}
      {toastMsg && <Toast msg={toastMsg} />}
    </div>
  );
}
