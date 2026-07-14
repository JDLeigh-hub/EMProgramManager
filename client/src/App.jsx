import { EngagementProvider, useEngagement } from './store/EngagementContext.jsx';
import Home from './components/Home.jsx';
import MyWeek from './components/MyWeek.jsx';
import ProjectWorkspace from './components/ProjectWorkspace.jsx';
import NewProjectModal from './components/modals/NewProjectModal.jsx';
import HelpPanel from './components/modals/HelpPanel.jsx';
import IntegrationsModal from './components/modals/IntegrationsModal.jsx';

function Shell() {
  const app = useEngagement();
  const { view, homeView } = app.ui;
  const isHome = view === 'home';
  const isProject = view === 'project' && !!app.cur();

  return (
    <div style={{ minHeight: '100vh', background: '#fff', color: '#000', fontFamily: 'var(--font-sans)' }}>
      {isHome && homeView === 'projects' && <Home />}
      {isHome && homeView === 'week' && <MyWeek />}
      {isProject && <ProjectWorkspace />}
      <NewProjectModal />
      <HelpPanel />
      <IntegrationsModal />
    </div>
  );
}

export default function App() {
  return (
    <EngagementProvider>
      <Shell />
    </EngagementProvider>
  );
}
