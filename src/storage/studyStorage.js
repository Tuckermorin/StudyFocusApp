// src/storage/studyStorage.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';

// Storage keys
const STORAGE_KEYS = {
  SESSIONS: '@study_focus_sessions',
  SUBJECTS: '@study_focus_subjects',
  DAILY_STATS: '@study_focus_daily_stats',
  WEEKLY_STATS: '@study_focus_weekly_stats',
  ENVIRONMENT_DATA: '@study_focus_environment',
  USER_PREFERENCES: '@study_focus_preferences',
};

// Study session structure
export const createStudySession = (overrides = {}) => ({
  id: randomUUID(),
  subject: '',
  startTime: new Date().toISOString(),
  endTime: null,
  duration: 0, // in seconds
  breaks: [], // array of break periods
  environment: {
    averageLightLevel: null,
    averageMotionLevel: null,
    environmentScore: null,
    issues: [],
    recommendations: [],
  },
  productivity: {
    focusScore: null, // 1-10 scale
    interruptions: 0,
    notes: '',
  },
  completed: false,
  createdAt: new Date().toISOString(),
  ...overrides,
});

// Break period structure
export const createBreakPeriod = (overrides = {}) => ({
  id: randomUUID(),
  startTime: new Date().toISOString(),
  endTime: null,
  duration: 0,
  type: 'planned', // 'planned' | 'unplanned' | 'forced'
  ...overrides,
});

// Subject structure
export const createSubject = (overrides = {}) => ({
  id: randomUUID(),
  name: '',
  color: '#4285f4',
  totalStudyTime: 0,
  sessionsCount: 0,
  averageFocusScore: null,
  goals: {
    dailyMinutes: 60,
    weeklyMinutes: 420, // 7 hours
  },
  createdAt: new Date().toISOString(),
  ...overrides,
});

class StudyStorage {
  // === STUDY SESSIONS ===

  // Save a study session
  async saveSession(session) {
    try {
      const sessions = await this.getAllSessions();
      const existingIndex = sessions.findIndex(s => s.id === session.id);
      
      if (existingIndex >= 0) {
        sessions[existingIndex] = session;
      } else {
        sessions.push(session);
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
      
      // Update subject statistics if session is completed
      if (session.completed && session.subject) {
        await this.updateSubjectStats(session.subject, session);
      }
      
      return true;
    } catch (error) {
      console.error('Error saving session:', error);
      return false;
    }
  }

  // Get all study sessions
  async getAllSessions() {
    try {
      const sessionsJson = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (sessionsJson) {
        const sessions = JSON.parse(sessionsJson);
        return sessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
      return [];
    } catch (error) {
      console.error('Error getting sessions:', error);
      return [];
    }
  }

  // Get session by ID
  async getSessionById(sessionId) {
    try {
      const sessions = await this.getAllSessions();
      return sessions.find(session => session.id === sessionId) || null;
    } catch (error) {
      console.error('Error getting session by ID:', error);
      return null;
    }
  }

  // Get sessions by date range
  async getSessionsByDateRange(startDate, endDate) {
    try {
      const sessions = await this.getAllSessions();
      return sessions.filter(session => {
        const sessionDate = new Date(session.startTime);
        return sessionDate >= startDate && sessionDate <= endDate;
      });
    } catch (error) {
      console.error('Error getting sessions by date range:', error);
      return [];
    }
  }

  // Get sessions for today
  async getTodaySessions() {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    return this.getSessionsByDateRange(startOfDay, endOfDay);
  }

  // Get sessions for this week
  async getWeekSessions() {
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
    return this.getSessionsByDateRange(startOfWeek, endOfWeek);
  }

  // Delete a session
  async deleteSession(sessionId) {
    try {
      const sessions = await this.getAllSessions();
      const filteredSessions = sessions.filter(session => session.id !== sessionId);
      await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(filteredSessions));
      return true;
    } catch (error) {
      console.error('Error deleting session:', error);
      return false;
    }
  }

  // === SUBJECTS ===

  // Save a subject
  async saveSubject(subject) {
    try {
      const subjects = await this.getAllSubjects();
      const existingIndex = subjects.findIndex(s => s.id === subject.id);
      
      if (existingIndex >= 0) {
        subjects[existingIndex] = subject;
      } else {
        subjects.push(subject);
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
      return true;
    } catch (error) {
      console.error('Error saving subject:', error);
      return false;
    }
  }

  // Get all subjects
  async getAllSubjects() {
    try {
      const subjectsJson = await AsyncStorage.getItem(STORAGE_KEYS.SUBJECTS);
      if (subjectsJson) {
        return JSON.parse(subjectsJson);
      }
      return [];
    } catch (error) {
      console.error('Error getting subjects:', error);
      return [];
    }
  }

  // Get subject by name
  async getSubjectByName(name) {
    try {
      const subjects = await this.getAllSubjects();
      return subjects.find(subject => subject.name.toLowerCase() === name.toLowerCase()) || null;
    } catch (error) {
      console.error('Error getting subject by name:', error);
      return null;
    }
  }

  // Update subject statistics after a completed session
  async updateSubjectStats(subjectName, session) {
    try {
      const subject = await this.getSubjectByName(subjectName);
      if (!subject) return false;

      // Update statistics
      subject.totalStudyTime += session.duration;
      subject.sessionsCount += 1;
      
      // Update average focus score
      if (session.productivity.focusScore) {
        const currentAverage = subject.averageFocusScore || 0;
        const newAverage = (currentAverage * (subject.sessionsCount - 1) + session.productivity.focusScore) / subject.sessionsCount;
        subject.averageFocusScore = Math.round(newAverage * 10) / 10; // Round to 1 decimal
      }

      await this.saveSubject(subject);
      return true;
    } catch (error) {
      console.error('Error updating subject stats:', error);
      return false;
    }
  }

  // Delete a subject
  async deleteSubject(subjectId) {
    try {
      const subjects = await this.getAllSubjects();
      const filteredSubjects = subjects.filter(subject => subject.id !== subjectId);
      await AsyncStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(filteredSubjects));
      return true;
    } catch (error) {
      console.error('Error deleting subject:', error);
      return false;
    }
  }

  // === STATISTICS ===

  // Get daily statistics
  async getDailyStats(date = new Date()) {
    try {
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      const sessions = await this.getSessionsByDateRange(startOfDay, endOfDay);
      
      const stats = {
        date: startOfDay.toDateString(),
        totalStudyTime: 0,
        totalSessions: sessions.length,
        completedSessions: 0,
        subjectBreakdown: {},
        averageFocusScore: null,
        environmentScore: null,
        goals: {
          dailyTimeGoal: 4 * 60 * 60, // 4 hours default
          achieved: false,
        },
      };

      let totalFocusScore = 0;
      let focusScoreCount = 0;
      let totalEnvironmentScore = 0;
      let environmentScoreCount = 0;

      sessions.forEach(session => {
        if (session.completed) {
          stats.totalStudyTime += session.duration;
          stats.completedSessions += 1;
          
          // Subject breakdown
          if (session.subject) {
            if (!stats.subjectBreakdown[session.subject]) {
              stats.subjectBreakdown[session.subject] = {
                time: 0,
                sessions: 0,
              };
            }
            stats.subjectBreakdown[session.subject].time += session.duration;
            stats.subjectBreakdown[session.subject].sessions += 1;
          }
          
          // Focus score
          if (session.productivity.focusScore) {
            totalFocusScore += session.productivity.focusScore;
            focusScoreCount += 1;
          }
          
          // Environment score
          if (session.environment.environmentScore) {
            totalEnvironmentScore += session.environment.environmentScore;
            environmentScoreCount += 1;
          }
        }
      });

      // Calculate averages
      if (focusScoreCount > 0) {
        stats.averageFocusScore = Math.round((totalFocusScore / focusScoreCount) * 10) / 10;
      }
      
      if (environmentScoreCount > 0) {
        stats.environmentScore = Math.round(totalEnvironmentScore / environmentScoreCount);
      }
      
      // Check if daily goal achieved
      stats.goals.achieved = stats.totalStudyTime >= stats.goals.dailyTimeGoal;

      return stats;
    } catch (error) {
      console.error('Error getting daily stats:', error);
      return null;
    }
  }

  // Get weekly statistics
  async getWeeklyStats(date = new Date()) {
    try {
      const startOfWeek = new Date(date.setDate(date.getDate() - date.getDay()));
      const sessions = await this.getWeekSessions();
      
      const stats = {
        weekStart: startOfWeek.toDateString(),
        totalStudyTime: 0,
        totalSessions: sessions.length,
        dailyBreakdown: {},
        subjectBreakdown: {},
        averageFocusScore: null,
        goals: {
          weeklyTimeGoal: 20 * 60 * 60, // 20 hours default
          achieved: false,
        },
      };

      let totalFocusScore = 0;
      let focusScoreCount = 0;

      // Initialize daily breakdown
      for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        const dayKey = day.toDateString();
        stats.dailyBreakdown[dayKey] = {
          time: 0,
          sessions: 0,
        };
      }

      sessions.forEach(session => {
        if (session.completed) {
          stats.totalStudyTime += session.duration;
          
          // Daily breakdown
          const sessionDay = new Date(session.startTime).toDateString();
          if (stats.dailyBreakdown[sessionDay]) {
            stats.dailyBreakdown[sessionDay].time += session.duration;
            stats.dailyBreakdown[sessionDay].sessions += 1;
          }
          
          // Subject breakdown
          if (session.subject) {
            if (!stats.subjectBreakdown[session.subject]) {
              stats.subjectBreakdown[session.subject] = {
                time: 0,
                sessions: 0,
              };
            }
            stats.subjectBreakdown[session.subject].time += session.duration;
            stats.subjectBreakdown[session.subject].sessions += 1;
          }
          
          // Focus score
          if (session.productivity.focusScore) {
            totalFocusScore += session.productivity.focusScore;
            focusScoreCount += 1;
          }
        }
      });

      // Calculate averages
      if (focusScoreCount > 0) {
        stats.averageFocusScore = Math.round((totalFocusScore / focusScoreCount) * 10) / 10;
      }
      
      // Check if weekly goal achieved
      stats.goals.achieved = stats.totalStudyTime >= stats.goals.weeklyTimeGoal;

      return stats;
    } catch (error) {
      console.error('Error getting weekly stats:', error);
      return null;
    }
  }

  // === ENVIRONMENT DATA ===

  // Save environment analysis
  async saveEnvironmentData(environmentData) {
    try {
      const allData = await this.getAllEnvironmentData();
      allData.push({
        ...environmentData,
        id: randomUUID(),
        timestamp: new Date().toISOString(),
      });
      
      // Keep only last 100 entries
      if (allData.length > 100) {
        allData.splice(0, allData.length - 100);
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.ENVIRONMENT_DATA, JSON.stringify(allData));
      return true;
    } catch (error) {
      console.error('Error saving environment data:', error);
      return false;
    }
  }

  // Get all environment data
  async getAllEnvironmentData() {
    try {
      const dataJson = await AsyncStorage.getItem(STORAGE_KEYS.ENVIRONMENT_DATA);
      if (dataJson) {
        return JSON.parse(dataJson);
      }
      return [];
    } catch (error) {
      console.error('Error getting environment data:', error);
      return [];
    }
  }

  // === UTILITY METHODS ===

  // Clear all data (for reset/testing)
  async clearAllData() {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.SESSIONS,
        STORAGE_KEYS.SUBJECTS,
        STORAGE_KEYS.DAILY_STATS,
        STORAGE_KEYS.WEEKLY_STATS,
        STORAGE_KEYS.ENVIRONMENT_DATA,
      ]);
      return true;
    } catch (error) {
      console.error('Error clearing all data:', error);
      return false;
    }
  }

  // Export all data
  async exportAllData() {
    try {
      const sessions = await this.getAllSessions();
      const subjects = await this.getAllSubjects();
      const environmentData = await this.getAllEnvironmentData();
      
      return {
        sessions,
        subjects,
        environmentData,
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      return null;
    }
  }

  // Get storage size info
  async getStorageInfo() {
    try {
      const sessions = await this.getAllSessions();
      const subjects = await this.getAllSubjects();
      const environmentData = await this.getAllEnvironmentData();
      
      return {
        sessions: sessions.length,
        subjects: subjects.length,
        environmentEntries: environmentData.length,
        totalSessions: sessions.length,
        completedSessions: sessions.filter(s => s.completed).length,
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return null;
    }
  }
}

// Export singleton instance
export default new StudyStorage();