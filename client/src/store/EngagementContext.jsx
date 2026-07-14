import { createContext, useContext } from 'react';
import { useEngagementApp } from './useEngagementApp.js';

const EngagementContext = createContext(null);

export function EngagementProvider({ children }) {
  const app = useEngagementApp();
  return <EngagementContext.Provider value={app}>{children}</EngagementContext.Provider>;
}

export function useEngagement() {
  const ctx = useContext(EngagementContext);
  if (!ctx) throw new Error('useEngagement must be used within EngagementProvider');
  return ctx;
}
