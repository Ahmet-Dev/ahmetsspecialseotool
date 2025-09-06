import React, { createContext, useReducer, useEffect, useRef, useCallback } from 'react';
import type { Session, SEOAnalysisResult, Language } from '../types';
import { SessionManager } from '../services/SessionManager';
import { SecurityFirewall } from '../services/SecurityFirewall';

// State tipleri
interface AppState {
  session: Session | null;
  currentLanguage: Language;
  analysisResults: SEOAnalysisResult[];
  isLoading: boolean;
  error: string | null;
  securityEvents: SecurityEvent[];
}

interface SecurityEvent {
  id: string;
  type: string;
  timestamp: Date;
  details: Record<string, unknown>;
}

// Action tipleri
type AppAction =
  | { type: 'SET_SESSION'; payload: Session }
  | { type: 'SET_LANGUAGE'; payload: Language }
  | { type: 'ADD_ANALYSIS_RESULT'; payload: SEOAnalysisResult }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_SECURITY_EVENT'; payload: SecurityEvent }
  | { type: 'CLEAR_ANALYSIS_RESULTS' };

// Context tipleri
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  sessionManager: SessionManager;
  securityFirewall: SecurityFirewall;
  createNewSession: () => Session;
  changeLanguage: (language: Language) => void;
  addAnalysisResult: (result: SEOAnalysisResult) => void;
  clearAnalysisResults: () => void;
}

// Başlangıç state'i
const initialState: AppState = {
  session: null,
  currentLanguage: { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  analysisResults: [],
  isLoading: false,
  error: null,
  securityEvents: []
};

// Reducer
const appReducer = (state: AppState, action: AppAction): AppState => {
  console.log('AppReducer action:', action.type);
  switch (action.type) {
    case 'SET_SESSION':
      console.log('Setting session:', action.payload.id);
      return { ...state, session: action.payload };
    case 'SET_LANGUAGE':
      return { ...state, currentLanguage: action.payload };
    case 'ADD_ANALYSIS_RESULT':
      return { ...state, analysisResults: [...state.analysisResults, action.payload] };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'ADD_SECURITY_EVENT':
      return { ...state, securityEvents: [...state.securityEvents, action.payload] };
    case 'CLEAR_ANALYSIS_RESULTS':
      return { ...state, analysisResults: [] };
    default:
      return state;
  }
};

// Context oluştur
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider bileşeni
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  // Servisleri sadece bir kez oluştur (critical fix!)
  const sessionManagerRef = useRef<SessionManager | null>(null);
  const securityFirewallRef = useRef<SecurityFirewall | null>(null);
  const initializedRef = useRef<boolean>(false);
  
  if (!sessionManagerRef.current) {
    sessionManagerRef.current = new SessionManager();
  }
  
  if (!securityFirewallRef.current) {
    securityFirewallRef.current = new SecurityFirewall();
  }
  
  const sessionManager = sessionManagerRef.current;
  const securityFirewall = securityFirewallRef.current;

  // Yeni session oluştur
  const createNewSession = useCallback((): Session => {
    try {
      const session = sessionManager.createSession();
      dispatch({ type: 'SET_SESSION', payload: session });
      console.log('Session başarıyla oluşturuldu:', session.id);
      return session;
    } catch (error) {
      console.error('Session oluşturma hatası:', error);
      throw new Error('Session oluşturulamadı');
    }
  }, [sessionManager]);

  // Dil değiştir
  const changeLanguage = (language: Language) => {
    console.log('AppContext dil değiştiriliyor:', language);
    dispatch({ type: 'SET_LANGUAGE', payload: language });
    localStorage.setItem('selectedLanguage', language.code);
  };

  // Analiz sonucu ekle
  const addAnalysisResult = (result: SEOAnalysisResult) => {
    if (state.session) {
      sessionManager.saveAnalysisResult(state.session.id, result);
      dispatch({ type: 'ADD_ANALYSIS_RESULT', payload: result });
    }
  };

  // Analiz sonuçlarını temizle
  const clearAnalysisResults = () => {
    dispatch({ type: 'CLEAR_ANALYSIS_RESULTS' });
    if (state.session) {
      state.session.analyses.forEach(analysisId => {
        sessionManager.deleteAnalysisResult(analysisId);
      });
    }
  };

  // Uygulama başlatıldığında session oluştur
  useEffect(() => {
    console.log('AppContext useEffect çalışıyor, initialized:', initializedRef.current);
    if (!initializedRef.current && !state.session) {
      initializedRef.current = true;
      try {
        console.log('Session bulunamadı, yeni session oluşturuluyor...');
        const newSession = createNewSession();
        console.log('Yeni session başarıyla oluşturuldu:', newSession.id);
      } catch (error) {
        console.error('Session oluşturma hatası:', error);
        // Backup session oluşturma girişimi
        setTimeout(() => {
          try {
            const backupSession = createNewSession();
            console.log('Backup session oluşturuldu:', backupSession.id);
          } catch (backupError) {
            console.error('Backup session oluşturulamadı:', backupError);
          }
        }, 1000);
      }
    }
  }, [state.session, createNewSession]); // state.session değişikliklerini takip et

  // Dil tercihini yükle
  useEffect(() => {
    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (savedLanguage === 'en') {
      changeLanguage({ code: 'en', name: 'English', flag: '🇺🇸' });
    }
  }, []);

  const contextValue: AppContextType = {
    state,
    dispatch,
    sessionManager,
    securityFirewall,
    createNewSession,
    changeLanguage,
    addAnalysisResult,
    clearAnalysisResults
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export { AppContext };
export type { AppContextType };
