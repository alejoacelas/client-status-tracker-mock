import { useEffect } from 'react';
import { PROJECTS } from './data';
import { useRoute } from './components/Common';
import { HomePage } from './pages/HomePage';
import { ProjectPage } from './pages/ProjectPage';
import { TodosPage } from './pages/TodosPage';
import { HistoryPage } from './pages/HistoryPage';
import { CardsPage, ChatPage, DocsPage, MessagesPage, SchedulePage } from './pages/ToolPages';

export function App() {
  const route = useRoute();
  const [path, anchor] = route.split('#');
  const parts = path.split('/').filter(Boolean);
  useEffect(() => {
    if (!anchor) window.scrollTo(0, 0);
  }, [path, anchor]);

  if (parts[0] === 'p' && PROJECTS.some((p) => p.key === parts[1])) {
    const key = parts[1];
    switch (parts[2]) {
      case undefined:
        return <ProjectPage projectKey={key} />;
      case 'todos':
        return <TodosPage key={key} projectKey={key} />;
      case 'hill':
        return <HistoryPage projectKey={key} anchor={anchor} />;
      case 'messages':
        return <MessagesPage projectKey={key} />;
      case 'schedule':
        return <SchedulePage projectKey={key} />;
      case 'docs':
        return <DocsPage projectKey={key} />;
      case 'chat':
        return <ChatPage projectKey={key} />;
      case 'cards':
        return <CardsPage projectKey={key} />;
    }
  }
  return <HomePage />;
}
