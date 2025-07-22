// src/context/StudyContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const StudyContext = createContext();

// Custom hook to use study context
export const useStudy = () => {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error('useStudy must be used within a StudyProvider');
  }
  return context;
};

// Study session states
export const SESSION_STATES = {
  IDLE: 'idle',
  ACTIVE: 'active',
  PAUSED: 'paused',
  BREAK: 'break',
  COMPLETED: 'completed',
};

// Action types
const ACTIONS = {
  START_SESSION: 'START_SESSION',
  PAUSE_SESSION: 'PAUSE_SESSION',
  RESUME_SESSION: 'RESUME_SESSION',
  END_SESSION: 'END_SESSION',
  START_BREAK: 'START_BREAK',
  END_BREAK: 'END_BREAK',
  UPDATE_TIMER: 'UPDATE_TIMER',
  UPDATE_ENVIRONMENT: 'UPDATE_ENVIRONMENT',
  SET_SUBJECT: 'SET_SUBJECT',
  SET_GOAL: 'SET_GOAL',
  LOAD_PREFERENCES: 'LOAD_PREFERENCES',
  RESET_SESSION: 'RESET_SESSION',
};

// Initial state
const initialState = {
  // Current session
  sessionState: SESSION_STATES.IDLE,
  currentSubject: '',
  sessionDuration: 25 * 60, // 25 minutes in seconds
  breakDuration: 5 * 60, // 5 minutes in seconds
  timeRemaining: 25 * 60,
  sessionStartTime: null,
  pausedTime: 0,
  
  // Environment data
  environment: {
    lightLevel: null,
    motionLevel: null,
    lastChecked: null,
    status: 'unknown', // 'optimal', 'good', 'poor', 'critical'
    recommendations: [],
  },
  
  // Session tracking
  sessionsToday: 0,
  totalTimeToday: 0,
  currentStreak: 0,
  dailyGoal: 4 * 60 * 60, // 4 hours in seconds
  
  // User preferences
  preferences: {
    defaultSessionLength: 25,
    defaultBreakLength: 5,
    enableEnvironmentAlerts: true,
    enableMotionDetection: true,
    autoStartBreaks: false,
    soundEnabled: true,
    vibrationEnabled: true,
  },
};

// Reducer function
const studyReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.START_SESSION:
      return {
        ...state,
        sessionState: SESSION_STATES.ACTIVE,
        sessionStartTime: Date.now(),
        timeRemaining: state.sessionDuration,
        pausedTime: 0,
        currentSubject: action.payload.subject || state.currentSubject,
      };
      
    case ACTIONS.PAUSE_SESSION:
      return {
        ...state,
        sessionState: SESSION_STATES.PAUSED,
        pausedTime: state.pausedTime + (Date.now() - state.sessionStartTime),
      };
      
    case ACTIONS.RESUME_SESSION:
      return {
        ...state,
        sessionState: SESSION_STATES.ACTIVE,
        sessionStartTime: Date.now(),
      };
      
    case ACTIONS.END_SESSION:
      const sessionTime = state.sessionDuration - state.timeRemaining;
      return {
        ...state,
        sessionState: SESSION_STATES.COMPLETED,
        sessionsToday: state.sessionsToday + 1,
        totalTimeToday: state.totalTimeToday + sessionTime,
        currentStreak: state.currentStreak + 1,
      };
      
    case ACTIONS.START_BREAK:
      return {
        ...state,
        sessionState: SESSION_STATES.BREAK,
        timeRemaining: state.breakDuration,
        sessionStartTime: Date.now(),
      };
      
    case ACTIONS.END_BREAK:
      return {
        ...state,
        sessionState: SESSION_STATES.IDLE,
        timeRemaining: state.sessionDuration,
      };
      
    case ACTIONS.UPDATE_TIMER:
      return {
        ...state,
        timeRemaining: Math.max(0, action.payload.timeRemaining),
      };
      
    case ACTIONS.UPDATE_ENVIRONMENT:
      return {
        ...state,
        environment: {
          ...state.environment,
          ...action.payload,
          lastChecked: Date.now(),
        },
      };
      
    case ACTIONS.SET_SUBJECT:
      return {
        ...state,
        currentSubject: action.payload.subject,
      };
      
    case ACTIONS.SET_GOAL:
      return {
        ...state,
        dailyGoal: action.payload.goal,
      };
      
    case ACTIONS.LOAD_PREFERENCES:
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload },
        sessionDuration: (action.payload.defaultSessionLength || 25) * 60,
        breakDuration: (action.payload.defaultBreakLength || 5) * 60,
        timeRemaining: (action.payload.defaultSessionLength || 25) * 60,
      };
      
    case ACTIONS.RESET_SESSION:
      return {
        ...state,
        sessionState: SESSION_STATES.IDLE,
        timeRemaining: state.sessionDuration,
        sessionStartTime: null,
        pausedTime: 0,
        currentStreak: 0,
      };
      
    default:
      return state;
  }
};

// Storage keys
const PREFERENCES_KEY = '@study_focus_preferences';
const DAILY_STATS_KEY = '@study_focus_daily_stats';

export const StudyProvider = ({ children }) => {
  const [state, dispatch] = useReducer(studyReducer, initialState);

  // Load preferences and daily stats on app start
  useEffect(() => {
    loadPreferences();
    loadDailyStats();
  }, []);

  // Save daily stats when they change
  useEffect(() => {
    saveDailyStats();
  }, [state.sessionsToday, state.totalTimeToday]);

  const loadPreferences = async () => {
    try {
      const savedPreferences = await AsyncStorage.getItem(PREFERENCES_KEY);
      if (savedPreferences) {
        const preferences = JSON.parse(savedPreferences);
        dispatch({ type: ACTIONS.LOAD_PREFERENCES, payload: preferences });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const savePreferences = async (newPreferences) => {
    try {
      const updatedPreferences = { ...state.preferences, ...newPreferences };
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(updatedPreferences));
      dispatch({ type: ACTIONS.LOAD_PREFERENCES, payload: updatedPreferences });
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const loadDailyStats = async () => {
    try {
      const today = new Date().toDateString();
      const savedStats = await AsyncStorage.getItem(DAILY_STATS_KEY);
      if (savedStats) {
        const { date, sessionsToday, totalTimeToday } = JSON.parse(savedStats);
        if (date === today) {
          // Same day, load existing stats
          dispatch({ 
            type: ACTIONS.LOAD_PREFERENCES, 
            payload: { sessionsToday, totalTimeToday } 
          });
        }
        // Different day, stats reset automatically to 0
      }
    } catch (error) {
      console.error('Error loading daily stats:', error);
    }
  };

  const saveDailyStats = async () => {
    try {
      const today = new Date().toDateString();
      const stats = {
        date: today,
        sessionsToday: state.sessionsToday,
        totalTimeToday: state.totalTimeToday,
      };
      await AsyncStorage.setItem(DAILY_STATS_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error('Error saving daily stats:', error);
    }
  };

  // Action creators
  const startSession = (subject = '') => {
    dispatch({ type: ACTIONS.START_SESSION, payload: { subject } });
  };

  const pauseSession = () => {
    dispatch({ type: ACTIONS.PAUSE_SESSION });
  };

  const resumeSession = () => {
    dispatch({ type: ACTIONS.RESUME_SESSION });
  };

  const endSession = () => {
    dispatch({ type: ACTIONS.END_SESSION });
  };

  const startBreak = () => {
    dispatch({ type: ACTIONS.START_BREAK });
  };

  const endBreak = () => {
    dispatch({ type: ACTIONS.END_BREAK });
  };

  const updateTimer = (timeRemaining) => {
    dispatch({ type: ACTIONS.UPDATE_TIMER, payload: { timeRemaining } });
  };

  const updateEnvironment = (environmentData) => {
    dispatch({ type: ACTIONS.UPDATE_ENVIRONMENT, payload: environmentData });
  };

  const setSubject = (subject) => {
    dispatch({ type: ACTIONS.SET_SUBJECT, payload: { subject } });
  };

  const setDailyGoal = (goal) => {
    dispatch({ type: ACTIONS.SET_GOAL, payload: { goal } });
  };

  const resetSession = () => {
    dispatch({ type: ACTIONS.RESET_SESSION });
  };

  // Computed values
  const isSessionActive = state.sessionState === SESSION_STATES.ACTIVE;
  const isSessionPaused = state.sessionState === SESSION_STATES.PAUSED;
  const isOnBreak = state.sessionState === SESSION_STATES.BREAK;
  const progressPercentage = ((state.sessionDuration - state.timeRemaining) / state.sessionDuration) * 100;
  const dailyProgressPercentage = (state.totalTimeToday / state.dailyGoal) * 100;

  const value = {
    // State
    ...state,
    
    // Computed values
    isSessionActive,
    isSessionPaused,
    isOnBreak,
    progressPercentage,
    dailyProgressPercentage,
    
    // Actions
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    startBreak,
    endBreak,
    updateTimer,
    updateEnvironment,
    setSubject,
    setDailyGoal,
    resetSession,
    savePreferences,
  };

  return (
    <StudyContext.Provider value={value}>
      {children}
    </StudyContext.Provider>
  );
};