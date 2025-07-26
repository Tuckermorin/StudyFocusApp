import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const StudyContext = createContext();

export const useStudy = () => {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error('useStudy must be used within a StudyProvider');
  }
  return context;
};

const PREFERENCES_KEY = '@study_focus_preferences';
const DAILY_STATS_KEY = '@study_focus_daily_stats';

const defaultPreferences = {
  defaultSessionLength: 25,
  defaultBreakLength: 5,
  enableEnvironmentAlerts: true,
  enableMotionDetection: true,
  autoStartBreaks: false,
  soundEnabled: true,
  vibrationEnabled: true,
};

const defaultEnvironment = {
  lightLevel: null,
  motionLevel: null,
  lastChecked: null,
  status: 'unknown',
  recommendations: [],
};

export const StudyProvider = ({ children }) => {
  const [currentSubject, setCurrentSubject] = useState('');
  const [dailyGoal, setDailyGoal] = useState(4 * 60 * 60); // 4 hours
  const [sessionsToday, setSessionsToday] = useState(0);
  const [totalTimeToday, setTotalTimeToday] = useState(0);
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [environment, setEnvironment] = useState(defaultEnvironment);

  useEffect(() => {
    loadPreferences();
    loadDailyStats();
  }, []);

  useEffect(() => {
    saveDailyStats();
  }, [sessionsToday, totalTimeToday]);

  const loadPreferences = async () => {
    try {
      const saved = await AsyncStorage.getItem(PREFERENCES_KEY);
      if (saved) {
        const prefs = JSON.parse(saved);
        setPreferences((p) => ({ ...p, ...prefs }));
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const savePreferences = async (newPrefs) => {
    try {
      const updated = { ...preferences, ...newPrefs };
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
      setPreferences(updated);
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const loadDailyStats = async () => {
    try {
      const today = new Date().toDateString();
      const saved = await AsyncStorage.getItem(DAILY_STATS_KEY);
      if (saved) {
        const { date, sessionsToday: s, totalTimeToday: t } = JSON.parse(saved);
        if (date === today) {
          setSessionsToday(s || 0);
          setTotalTimeToday(t || 0);
        }
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
        sessionsToday,
        totalTimeToday,
      };
      await AsyncStorage.setItem(DAILY_STATS_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error('Error saving daily stats:', error);
    }
  };

  const updateEnvironment = (data) => {
    setEnvironment((env) => ({ ...env, ...data, lastChecked: Date.now() }));
  };

  const incrementSessionsToday = () => setSessionsToday((s) => s + 1);
  const addToTotalTimeToday = (seconds) =>
    setTotalTimeToday((t) => t + seconds);

  const dailyProgressPercentage = (totalTimeToday / dailyGoal) * 100;

  const value = {
    currentSubject,
    dailyGoal,
    sessionsToday,
    totalTimeToday,
    preferences,
    environment,
    dailyProgressPercentage,
    setSubject: setCurrentSubject,
    setDailyGoal,
    savePreferences,
    updateEnvironment,
    incrementSessionsToday,
    addToTotalTimeToday,
  };

  return (
    <StudyContext.Provider value={value}>{children}</StudyContext.Provider>
  );
};
