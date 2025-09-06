import { useContext } from 'react';
import { AppContext } from '../contexts/AppContext';
import type { AppContextType } from '../contexts/AppContext';

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp hook AppProvider içinde kullanılmalıdır');
  }
  return context;
};
