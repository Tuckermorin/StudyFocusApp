// app/session.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/context/ThemeContext';
import { useStudy, SESSION_STATES } from '../src/context/StudyContext';
import TimerDisplay from '../src/components/TimerDisplay';
import EnvironmentCard from '../src/components/EnvironmentCard';
import SessionControls from '../src/components/SessionControls';
import MetricCard from '../src/components/MetricCard';
import SubjectPicker from '../src/components/SubjectPicker';

export default function SessionScreen() {
  const { theme, globalStyles } = useTheme();
  const {
    sessionState,
    currentSubject,
    isSessionActive,
    isSessionPaused,
    isOnBreak,
    timeRemaining,
    sessionDuration,
    breakDuration,
    progressPercentage,
    environment,
    sessionsToday,
    totalTimeToday,
    endSession,
  } = useStudy();
  const router = useRouter();

  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [totalElapsedTime, setTotalElapsedTime] = useState(0);

  // Track session start time
  useEffect(() => {
    if (isSessionActive && !sessionStartTime) {
      setSessionStartTime(Date.now());
    } else if (!isSessionActive && !isSessionPaused) {
      setSessionStartTime(null);
    }
  }, [isSessionActive, isSessionPaused]);

  // Calculate elapsed time
  useEffect(() => {
    if (sessionStartTime && (isSessionActive || isSessionPaused)) {
      const elapsed = sessionDuration - timeRemaining;
      setTotalElapsedTime(elapsed);
    }
  }, [timeRemaining, sessionDuration, sessionStartTime]);

  // Handle back button on Android - prevent accidental session end
  useEffect(() => {
    const backAction = () => {
      if (isSessionActive || isSessionPaused) {
        Alert.alert(
          'Session Active',
          'You have an active study session. What would you like to do?',
          [
            { text: 'Stay in Session', style: 'cancel' },
            { 
              text: 'Pause & Go Back', 
              onPress: () => {
                if (isSessionActive) {
                  // Pause the session before going back
                  require('../src/context/StudyContext').pauseSession();
                }
                router.back();
              }
            },
            {
              text: 'End Session',
              style: 'destructive',
              onPress: () => {
                endSession();
                router.back();
              },
            },
          ]
        );
        return true; // Prevent default back action
      }
      return false; // Allow default back action
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [isSessionActive, isSessionPaused, router, endSession]);

  // Handle session completion
  const handleSessionEnd = (feedback = null) => {
    // Here you could save the feedback data
    if (feedback) {
      console.log('Session feedback:', feedback);
      // Save to storage or send to analytics
    }
    
    // Show completion message
    Alert.alert(
      'Session Complete!',
      `Great work! You studied for ${formatTime(sessionDuration - timeRemaining)}.`,
      [
        { text: 'Start New Session', onPress: () => setShowSubjectPicker(true) },
        { text: 'Go to Dashboard', onPress: () => router.push('/') },
      ]
    );
  };

  // Format time helper
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Get motivational message based on session progress
  const getMotivationalMessage = () => {
    const progress = progressPercentage;
    
    if (isOnBreak) {
      return "Take a well-deserved break! 🌟";
    } else if (isSessionPaused) {
      return "Ready to get back to it? 💪";
    } else if (progress >= 75) {
      return "Almost there! You're doing great! 🔥";
    } else if (progress >= 50) {
      return "Halfway done! Keep up the momentum! ⚡";
    } else if (progress >= 25) {
      return "Good start! You're in the zone! 🎯";
    } else if (isSessionActive) {
      return "Focus time! You've got this! 🚀";
    } else {
      return "Ready to start your focused study session? 📚";
    }
  };

  // Get environment quality for display
  const getEnvironmentQuality = () => {
    switch (environment.status) {
      case 'optimal': return { text: 'Excellent', color: theme.colors.optimal };
      case 'good': return { text: 'Good', color: theme.colors.good };
      case 'poor': return { text: 'Needs Improvement', color: theme.colors.poor };
      case 'critical': return { text: 'Poor', color: theme.colors.critical };
      default: return { text: 'Unknown', color: theme.colors.textSecondary };
    }
  };

  const environmentQuality = getEnvironmentQuality();

  return (
    <SafeAreaView style={globalStyles.container}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Session Header */}
        <View style={{ marginBottom: 24 }}>
          <Text style={[globalStyles.heading4, { textAlign: 'center', marginBottom: 8 }]}>
            {currentSubject || 'Study Session'}
          </Text>
          <Text style={[globalStyles.textSecondary, { textAlign: 'center' }]}>
            {getMotivationalMessage()}
          </Text>
        </View>

        {/* Main Timer Display */}
        <View style={{ marginBottom: 32 }}>
          <TimerDisplay 
            size="large"
            showControls={false}
            onTimeUpdate={(timeLeft) => {
              // Handle timer updates if needed
            }}
          />
        </View>

        {/* Session Progress Cards */}
        <View style={{ 
          flexDirection: 'row', 
          gap: 12,
          marginBottom: 24,
        }}>
          <MetricCard
            title="Progress"
            value={Math.round(progressPercentage)}
            unit="%"
            icon="checkmark-circle"
            color={theme.colors.focus}
            style={{ flex: 1 }}
            showProgress={true}
            progressValue={progressPercentage}
            progressMax={100}
          />
          
          <MetricCard
            title="Time Elapsed"
            value={formatTime(totalElapsedTime)}
            icon="time"
            color={theme.colors.primary}
            style={{ flex: 1 }}
            subtitle={`of ${formatTime(sessionDuration)}`}
          />
        </View>

        {/* Today's Stats */}
        <View style={{ 
          flexDirection: 'row', 
          gap: 12,
          marginBottom: 24,
        }}>
          <MetricCard
            title="Today's Sessions"
            value={sessionsToday}
            icon="calendar"
            color={theme.colors.success}
            style={{ flex: 1 }}
            trend={sessionsToday > 0 ? 'up' : 'stable'}
          />
          
          <MetricCard
            title="Today's Time"
            value={formatTime(totalTimeToday)}
            icon="stopwatch"
            color={theme.colors.info}
            style={{ flex: 1 }}
            subtitle="total study time"
          />
        </View>

        {/* Environment Status */}
        <View style={{ marginBottom: 24 }}>
          <EnvironmentCard
            size="medium"
            showRecommendations={environment.status === 'poor' || environment.status === 'critical'}
            onPress={() => router.push('/environment')}
          />
        </View>

        {/* Quick Environment Summary */}
        <View style={{ 
          flexDirection: 'row', 
          gap: 12,
          marginBottom: 32,
        }}>
          <MetricCard
            title="Environment"
            value={environmentQuality.text}
            icon="bulb"
            color={environmentQuality.color}
            style={{ flex: 1 }}
            subtitle={`Score: ${environment.score || '--'}/100`}
            size="small"
          />
          
          <MetricCard
            title="Light Level"
            value={environment.lightLevel !== null ? `${environment.lightLevel}%` : '--'}
            icon="sunny"
            color={theme.colors.warning}
            style={{ flex: 1 }}
            size="small"
          />
        </View>

        {/* Session Controls */}
        <SessionControls
          layout="vertical"
          onSessionEnd={handleSessionEnd}
          style={{ marginBottom: 24 }}
        />

        {/* Quick Actions */}
        {sessionState === SESSION_STATES.IDLE && (
          <View style={{ marginBottom: 24 }}>
            <Text style={[globalStyles.heading6, { marginBottom: 16 }]}>
              Quick Actions
            </Text>
            
            <View style={{ gap: 12 }}>
              <View style={[globalStyles.card, { padding: 12 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[globalStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
                      Current Subject
                    </Text>
                    <Text style={globalStyles.textSecondary}>
                      {currentSubject || 'No subject selected'}
                    </Text>
                  </View>
                  <Text 
                    style={[globalStyles.text, { color: theme.colors.primary }]}
                    onPress={() => setShowSubjectPicker(true)}
                  >
                    Change
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Session Tips */}
        {!isSessionActive && !isSessionPaused && !isOnBreak && (
          <View style={[globalStyles.card, { 
            backgroundColor: theme.colors.surface,
            borderLeftWidth: 4,
            borderLeftColor: theme.colors.info,
          }]}>
            <Text style={[globalStyles.text, { fontWeight: '600', marginBottom: 8 }]}>
              💡 Study Tips
            </Text>
            <Text style={[globalStyles.textSecondary, { lineHeight: 20 }]}>
              • Find a quiet, well-lit space for optimal focus{'\n'}
              • Keep your phone in another room to avoid distractions{'\n'}
              • Take notes by hand when possible for better retention{'\n'}
              • Stay hydrated and take breaks every 25-30 minutes
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Subject Picker Modal */}
      <SubjectPicker
        visible={showSubjectPicker}
        onClose={() => setShowSubjectPicker(false)}
        onSubjectSelect={(subject) => {
          setShowSubjectPicker(false);
          // Subject is automatically set via context
        }}
        selectedSubject={currentSubject}
        mode="select"
      />
    </SafeAreaView>
  );
}