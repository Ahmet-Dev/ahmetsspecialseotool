import React from 'react';
import { useApp } from '../hooks/useApp';

export const SessionDebug: React.FC = () => {
  const { state, createNewSession, sessionManager } = useApp();

  const handleCreateSession = () => {
    try {
      const newSession = createNewSession();
      console.log('Manuel session oluşturuldu:', newSession);
    } catch (error) {
      console.error('Manuel session hatası:', error);
    }
  };

  const handleClearSessions = () => {
    sessionManager.clearAll();
    console.log('Tüm sessionlar temizlendi');
  };

  const sessionStats = sessionManager.getSessionStats();

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200 max-w-sm z-50">
      <h3 className="font-semibold text-gray-800 mb-2">🔍 Session Debug</h3>
      
      <div className="space-y-2 text-sm">
        <div>
          <strong>Current Session:</strong> 
          <span className={state.session ? 'text-green-600' : 'text-red-600'}>
            {state.session ? ` ✅ ${state.session.id.slice(-8)}` : ' ❌ None'}
          </span>
        </div>
        
        <div>
          <strong>Total Sessions:</strong> {sessionStats.totalSessions}
        </div>
        
        <div>
          <strong>Active Sessions:</strong> {sessionStats.activeSessions}
        </div>
        
        <div>
          <strong>Total Analyses:</strong> {sessionStats.totalAnalyses}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <button
          onClick={handleCreateSession}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xs py-1 px-2 rounded"
        >
          Create Session
        </button>
        
        <button
          onClick={handleClearSessions}
          className="w-full bg-red-500 hover:bg-red-600 text-white text-xs py-1 px-2 rounded"
        >
          Clear All
        </button>
      </div>
    </div>
  );
};

export default SessionDebug;
