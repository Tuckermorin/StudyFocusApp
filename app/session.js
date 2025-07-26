import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/context/ThemeContext';
import { useStudy } from '../src/context/StudyContext';
import TimerDisplay, { SESSION_STATES } from '../src/components/TimerDisplay';
import EnvironmentCard from '../src/components/EnvironmentCard';
import SessionControls from '../src/components/SessionControls';
import MetricCard from '../src/components/MetricCard';
import SubjectPicker from '../src/components/SubjectPicker';

export default function SessionScreen() {
  const { theme, globalStyles } = useTheme();
  const {
    currentSubject,
    preferences,
    environment,
    sessionsToday,
    totalTimeToday,
    incrementSessionsToday,
    addToTotalTimeToday,
  } = useStudy();
  const router = useRouter();

  const [sessionState, setSessionState] = useState(SESSION_STATES.IDLE);
  const [sessionDuration, setSessionDuration] = useState(
    preferences.defaultSessionLength * 60,
  );
  const [breakDuration, setBreakDuration] = useState(
    preferences.defaultBreakLength * 60,
  );
  const [timeRemaining, setTimeRemaining] = useState(sessionDuration);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [totalElapsedTime, setTotalElapsedTime] = useState(0);

  const isSessionActive = sessionState === SESSION_STATES.ACTIVE;
  const isSessionPaused = sessionState === SESSION_STATES.PAUSED;
  const isOnBreak = sessionState === SESSION_STATES.BREAK;

  useEffect(() => {
    setSessionDuration(preferences.defaultSessionLength * 60);
    setBreakDuration(preferences.defaultBreakLength * 60);
  }, [preferences.defaultSessionLength, preferences.defaultBreakLength]);

  useEffect(() => {
    if (sessionState === SESSION_STATES.IDLE) {
      setTimeRemaining(sessionDuration);
    }
  }, [sessionDuration, sessionState]);

  useEffect(() => {
    let interval;
    if ((isSessionActive || isOnBreak) && !isSessionPaused) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSessionActive, isOnBreak, isSessionPaused]);

  useEffect(() => {
    if (isSessionActive && !sessionStartTime) {
      setSessionStartTime(Date.now());
    } else if (!isSessionActive && !isSessionPaused) {
      setSessionStartTime(null);
    }
  }, [isSessionActive, isSessionPaused]);

  useEffect(() => {
    if (sessionStartTime && (isSessionActive || isSessionPaused)) {
      const elapsed = sessionDuration - timeRemaining;
      setTotalElapsedTime(elapsed);
    }
  }, [timeRemaining, sessionDuration, sessionStartTime]);

  useEffect(() => {
    if (timeRemaining <= 0) {
      if (isSessionActive) {
        incrementSessionsToday();
        addToTotalTimeToday(sessionDuration);
        if (breakDuration > 0) {
          setSessionState(SESSION_STATES.BREAK);
          setTimeRemaining(breakDuration);
        } else {
          setSessionState(SESSION_STATES.COMPLETED);
        }
      } else if (isOnBreak) {
        setSessionState(SESSION_STATES.IDLE);
        setTimeRemaining(sessionDuration);
      }
    }
  }, [timeRemaining]);

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
                setSessionState(SESSION_STATES.PAUSED);
                router.back();
              },
            },
            {
              text: 'End Session',
              style: 'destructive',
              onPress: () => {
                handleSessionEnd();
                router.back();
              },
            },
          ],
        );
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [isSessionActive, isSessionPaused, router]);

  const handleSessionEnd = (feedback = null) => {
    if (feedback) {
      console.log('Session feedback:', feedback);
    }
    Alert.alert(
      'Session Complete!',
      `Great work! You studied for ${formatTime(sessionDuration - timeRemaining)}.`,
      [
        { text: 'Start New Session', onPress: () => setShowSubjectPicker(true) },
        { text: 'Go to Dashboard', onPress: () => router.push('/') },
      ],
    );
    setSessionState(SESSION_STATES.IDLE);
    setTimeRemaining(sessionDuration);
  };

  const startSession = () => {
    setSessionState(SESSION_STATES.ACTIVE);
    setTimeRemaining(sessionDuration);
  };
  const pauseSession = () => setSessionState(SESSION_STATES.PAUSED);
  const resumeSession = () => setSessionState(SESSION_STATES.ACTIVE);
  const startBreak = () => {
    setSessionState(SESSION_STATES.BREAK);
    setTimeRemaining(breakDuration);
  };
  const endBreak = () => {
    setSessionState(SESSION_STATES.IDLE);
    setTimeRemaining(sessionDuration);
  };
  const endSession = () => handleSessionEnd();
  const resetSession = () => {
    setSessionState(SESSION_STATES.IDLE);
    setTimeRemaining(sessionDuration);
    setTotalElapsedTime(0);
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getMotivationalMessage = () => {
    const progress = progressPercentage;
    if (isOnBreak) {
      return 'Take a well-deserved break! \u2728';
    } else if (isSessionPaused) {
      return 'Ready to get back to it? \uD83D\uDCAA';
    } else if (progress >= 75) {
      return "Almost there! You're doing great! \uD83D\uDD25";
    } else if (progress >= 50) {
      return 'Halfway done! Keep up the momentum! \u26A1';
    } else if (progress >= 25) {
      return "Good start! You're in the zone! \uD83C\uDFC6";
    } else if (isSessionActive) {
      return "Focus time! You've got this! \uD83D\uDE80";
    } else {
      return "Ready to start your focused study session? \uD83D\uDCDA";
    }
  };

  const getEnvironmentQuality = () => {
    switch (environment.status) {
      case 'optimal':
        return { text: 'Excellent', color: theme.colors.optimal };
      case 'good':
        return { text: 'Good', color: theme.colors.good };
      case 'poor':
        return { text: 'Needs Improvement', color: theme.colors.poor };
      case 'critical':
        return { text: 'Poor', color: theme.colors.critical };
      default:
        return { text: 'Unknown', color: theme.colors.textSecondary };
    }
  };

  const progressPercentage = ((sessionDuration - timeRemaining) / sessionDuration) * 100;
  const environmentQuality = getEnvironmentQuality();

  return (
    <SafeAreaView style={globalStyles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ marginBottom: 24 }}>
          <Text style={[globalStyles.heading4, { textAlign: 'center', marginBottom: 8 }]}> 
            {currentSubject || 'Study Session'}
          </Text>
          <Text style={[globalStyles.textSecondary, { textAlign: 'center' }]}> 
            {getMotivationalMessage()}
          </Text>
        </View>

        <View style={{ marginBottom: 32 }}>
          <TimerDisplay
            size="large"
            timeRemaining={timeRemaining}
            sessionDuration={sessionDuration}
            breakDuration={breakDuration}
            sessionState={sessionState}
            progressPercentage={progressPercentage}
            currentSubject={currentSubject}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          <MetricCard
            title="Progress"
            value={Math.round(progressPercentage)}
            unit="%"
            icon="checkmark-circle"
            color={theme.colors.focus}
            style={{ flex: 1 }}
            showProgress
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

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
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

        <View style={{ marginBottom: 24 }}>
          <EnvironmentCard
            size="medium"
            showRecommendations={environment.status === 'poor' || environment.status === 'critical'}
            onPress={() => router.push('/environment')}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 32 }}>
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

        <SessionControls
          sessionState={sessionState}
          isSessionActive={isSessionActive}
          isSessionPaused={isSessionPaused}
          isOnBreak={isOnBreak}
          currentSubject={currentSubject}
          sessionDuration={sessionDuration}
          breakDuration={breakDuration}
          onStartSession={startSession}
          onPauseSession={pauseSession}
          onResumeSession={resumeSession}
          onEndSession={endSession}
          onStartBreak={startBreak}
          onEndBreak={endBreak}
          onResetSession={resetSession}
          onSessionEnd={handleSessionEnd}
          style={{ marginBottom: 24 }}
          layout="vertical"
        />

        {sessionState === SESSION_STATES.IDLE && (
          <View style={{ marginBottom: 24 }}>
            <Text style={[globalStyles.heading6, { marginBottom: 16 }]}>Quick Actions</Text>
            <View style={{ gap: 12 }}>
              <View style={[globalStyles.card, { padding: 12 }]}> 
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[globalStyles.text, { fontWeight: '600', marginBottom: 4 }]}>Current Subject</Text>
                    <Text style={globalStyles.textSecondary}>{currentSubject || 'No subject selected'}</Text>
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

        {!isSessionActive && !isSessionPaused && !isOnBreak && (
          <View
            style={[
              globalStyles.card,
              {
                backgroundColor: theme.colors.surface,
                borderLeftWidth: 4,
                borderLeftColor: theme.colors.info,
              },
            ]}
          >
            <Text style={[globalStyles.text, { fontWeight: '600', marginBottom: 8 }]}>\u2728 Study Tips</Text>
            <Text style={[globalStyles.textSecondary, { lineHeight: 20 }]}>\n              • Find a quiet, well-lit space for optimal focus{"\n"}
              • Keep your phone in another room to avoid distractions{"\n"}
              • Take notes by hand when possible for better retention{"\n"}
              • Stay hydrated and take breaks every 25-30 minutes
            </Text>
          </View>
        )}
      </ScrollView>

      <SubjectPicker
        visible={showSubjectPicker}
        onClose={() => setShowSubjectPicker(false)}
        onSubjectSelect={() => {
          setShowSubjectPicker(false);
        }}
        selectedSubject={currentSubject}
        mode="select"
      />
    </SafeAreaView>
  );
}
