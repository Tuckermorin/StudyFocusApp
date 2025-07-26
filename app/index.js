// app/index.js
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/context/ThemeContext';
import { useStudy } from '../src/context/StudyContext';

export default function DashboardScreen() {
  const { theme, globalStyles } = useTheme();
  const { 
    environment,
    sessionsToday,
    totalTimeToday,
    dailyGoal,
    dailyProgressPercentage,
    currentSubject,
    isSessionActive,
    startSession,
  } = useStudy();
  const router = useRouter();

  // Helper function to format time
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Helper function to get environment status color
  const getEnvironmentStatusColor = (status) => {
    switch (status) {
      case 'optimal': return theme.colors.optimal;
      case 'good': return theme.colors.good;
      case 'poor': return theme.colors.poor;
      case 'critical': return theme.colors.critical;
      default: return theme.colors.textSecondary;
    }
  };

  // Helper function to get environment status text
  const getEnvironmentStatusText = (status) => {
    switch (status) {
      case 'optimal': return '✓ Optimal for Studying';
      case 'good': return '✓ Good Conditions';
      case 'poor': return '⚠ Could Be Better';
      case 'critical': return '⚠ Poor Conditions';
      default: return 'Unknown Status';
    }
  };

  const handleStartSession = () => {
    if (isSessionActive) {
      Alert.alert(
        'Session Active',
        'You already have an active study session. Would you like to go to it?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Session', onPress: () => router.push('/session') },
        ]
      );
      return;
    }

    if (!currentSubject) {
      Alert.alert(
        'Select Subject',
        'Please select a subject before starting your study session.',
        [
          { text: 'OK', onPress: () => router.push('/settings') },
        ]
      );
      return;
    }

    startSession(currentSubject);
    router.push('/session');
  };

  const handleQuickEnvironmentCheck = () => {
    router.push('/environment');
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <View style={{ marginBottom: 24 }}>
          <Text style={[globalStyles.heading2, { marginBottom: 8 }]}>
            Welcome Back!
          </Text>
          <Text style={globalStyles.textSecondary}>
            Ready to focus and achieve your study goals?
          </Text>
        </View>

        {/* Quick Action FAB */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <Pressable
            onPress={handleStartSession}
            style={({ pressed }) => [
              {
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme.colors.focus,
                borderRadius: 28,
                paddingHorizontal: 20,
                paddingVertical: 14,
                shadowColor: '#000',
                shadowOffset: {
                  width: 0,
                  height: 2,
                },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
                opacity: pressed ? 0.8 : 1,
                transform: pressed ? [{ scale: 0.95 }] : [{ scale: 1 }],
              },
            ]}
          >
            <Ionicons
              name="play"
              size={24}
              color="#FFFFFF"
              style={{ marginRight: 10 }}
            />
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '600',
              }}
            >
              {isSessionActive ? "Go to Active Session" : "Start Study Session"}
            </Text>
          </Pressable>
        </View>

        {/* Current Environment Status */}
        <View style={[globalStyles.card, { marginBottom: 16 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Ionicons 
              name="bulb" 
              size={24} 
              color={theme.colors.primary} 
              style={{ marginRight: 12 }} 
            />
            <Text style={globalStyles.heading5}>Current Environment</Text>
          </View>

          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-around',
            marginBottom: 16,
          }}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={[globalStyles.heading4, { color: theme.colors.primary }]}>
                {environment.lightLevel !== null ? `${environment.lightLevel}%` : '--'}
              </Text>
              <Text style={globalStyles.textSecondary}>Light Level</Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={[globalStyles.heading4, { color: theme.colors.primary }]}>
                {environment.motionLevel !== null ? environment.motionLevel : '--'}
              </Text>
              <Text style={globalStyles.textSecondary}>Motion</Text>
            </View>
          </View>

          <View style={{
            backgroundColor: theme.colors.surface,
            padding: 12,
            borderRadius: 8,
            alignItems: 'center',
          }}>
            <Text style={{
              color: getEnvironmentStatusColor(environment.status),
              fontWeight: 'bold',
              fontSize: 16,
            }}>
              {getEnvironmentStatusText(environment.status)}
            </Text>
          </View>

          {environment.recommendations.length > 0 && (
            <View style={{ marginTop: 12 }}>
              <Text style={[globalStyles.textSecondary, { marginBottom: 8 }]}>
                💡 Recommendations:
              </Text>
              {environment.recommendations.map((rec, index) => (
                <Text key={index} style={[globalStyles.textSecondary, { marginBottom: 4 }]}>
                  • {rec}
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* Today's Progress */}
        <View style={[globalStyles.card, { marginBottom: 16 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Ionicons 
              name="trophy" 
              size={24} 
              color={theme.colors.primary} 
              style={{ marginRight: 12 }} 
            />
            <Text style={globalStyles.heading5}>Today's Progress</Text>
          </View>

          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-around',
            marginBottom: 16,
          }}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={[globalStyles.heading4, { color: theme.colors.primary }]}>
                {formatTime(totalTimeToday)}
              </Text>
              <Text style={globalStyles.textSecondary}>Study Time</Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={[globalStyles.heading4, { color: theme.colors.primary }]}>
                {sessionsToday}
              </Text>
              <Text style={globalStyles.textSecondary}>Sessions</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={{
            backgroundColor: theme.colors.surface,
            height: 8,
            borderRadius: 4,
            marginBottom: 8,
          }}>
            <View style={{
              backgroundColor: theme.colors.primary,
              height: '100%',
              borderRadius: 4,
              width: `${Math.min(dailyProgressPercentage, 100)}%`,
            }} />
          </View>
          
          <Text style={[globalStyles.textSecondary, { textAlign: 'center' }]}>
            {Math.round(dailyProgressPercentage)}% of daily goal ({formatTime(dailyGoal)})
          </Text>
        </View>

        {/* Current Subject */}
        {currentSubject && (
          <View style={[globalStyles.card, { marginBottom: 24 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons 
                name="book" 
                size={20} 
                color={theme.colors.primary} 
                style={{ marginRight: 8 }} 
              />
              <Text style={globalStyles.heading6}>Current Subject</Text>
            </View>
            <Text style={[globalStyles.text, { 
              backgroundColor: theme.colors.surface,
              padding: 12,
              borderRadius: 8,
              textAlign: 'center',
              fontWeight: '500',
            }]}>
              {currentSubject}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={{ gap: 12 }}>
          <Pressable
            onPress={handleQuickEnvironmentCheck}
            style={({ pressed }) => [
              globalStyles.buttonSecondary,
              pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons 
                name="eye" 
                size={20} 
                color={theme.colors.primary} 
                style={{ marginRight: 8 }} 
              />
              <Text style={[globalStyles.buttonTextSecondary]}>
                Quick Environment Check
              </Text>
            </View>
          </Pressable>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              onPress={() => router.push('/analytics')}
              style={({ pressed }) => [
                globalStyles.buttonSecondary,
                { flex: 1 },
                pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons 
                  name="analytics" 
                  size={18} 
                  color={theme.colors.primary} 
                  style={{ marginRight: 6 }} 
                />
                <Text style={globalStyles.buttonTextSecondary}>Analytics</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => router.push('/scanner')}
              style={({ pressed }) => [
                globalStyles.buttonSecondary,
                { flex: 1 },
                pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons 
                  name="camera" 
                  size={18} 
                  color={theme.colors.primary} 
                  style={{ marginRight: 6 }} 
                />
                <Text style={globalStyles.buttonTextSecondary}>Scanner</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}