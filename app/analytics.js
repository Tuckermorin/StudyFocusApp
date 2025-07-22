// app/analytics.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { useStudy } from '../src/context/StudyContext';
import MetricCard from '../src/components/MetricCard';
import ProgressChart from '../src/components/ProgressChart';
import StudyStorage from '../src/storage/studyStorage';

export default function AnalyticsScreen() {
  const { theme, globalStyles } = useTheme();
  const { 
    totalTimeToday, 
    sessionsToday, 
    dailyGoal, 
    dailyProgressPercentage,
    currentStreak 
  } = useStudy();

  const [timeRange, setTimeRange] = useState('week'); // 'day', 'week', 'month'
  const [dailyStats, setDailyStats] = useState(null);
  const [weeklyStats, setWeeklyStats] = useState(null);
  const [allSessions, setAllSessions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);
      
      // Load daily and weekly stats
      const daily = await StudyStorage.getDailyStats();
      const weekly = await StudyStorage.getWeeklyStats();
      
      // Load all sessions for detailed analysis
      const sessions = await StudyStorage.getAllSessions();
      const allSubjects = await StudyStorage.getAllSubjects();
      
      setDailyStats(daily);
      setWeeklyStats(weekly);
      setAllSessions(sessions || []);
      setSubjects(allSubjects || []);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      Alert.alert('Error', 'Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Prepare chart data based on selected time range
  const getChartData = () => {
    if (timeRange === 'week' && weeklyStats?.dailyBreakdown) {
      return Object.entries(weeklyStats.dailyBreakdown).map(([date, data]) => ({
        name: formatDate(date),
        value: Math.round((data?.time || 0) / 60), // Convert to minutes
        sessions: data?.sessions || 0,
      }));
    } else if (timeRange === 'day') {
      // Show hourly breakdown for today
      const todaySessions = allSessions.filter(session => {
        const sessionDate = new Date(session.startTime);
        const today = new Date();
        return sessionDate.toDateString() === today.toDateString();
      });

      const hourlyData = {};
      todaySessions.forEach(session => {
        const hour = new Date(session.startTime).getHours();
        if (!hourlyData[hour]) {
          hourlyData[hour] = { time: 0, sessions: 0 };
        }
        hourlyData[hour].time += session.duration || 0;
        hourlyData[hour].sessions += 1;
      });

      return Object.entries(hourlyData).map(([hour, data]) => ({
        name: `${hour}:00`,
        value: Math.round((data?.time || 0) / 60),
        sessions: data?.sessions || 0,
      }));
    }
    return [];
  };

  // Get subject breakdown data for pie chart
  const getSubjectChartData = () => {
    const stats = timeRange === 'week' ? weeklyStats : dailyStats;
    if (!stats?.subjectBreakdown) return [];

    return Object.entries(stats.subjectBreakdown).map(([subject, data]) => ({
      name: subject,
      value: Math.round((data?.time || 0) / 60), // Convert to minutes
      sessions: data?.sessions || 0,
    }));
  };

  // Calculate productivity metrics
  const getProductivityMetrics = () => {
    const completedSessions = allSessions.filter(s => s?.completed);
    
    if (completedSessions.length === 0) {
      return {
        averageSessionLength: 0,
        totalStudyTime: 0,
        focusScore: null,
        environmentScore: null,
        mostProductiveHour: null,
      };
    }

    const totalTime = completedSessions.reduce((sum, s) => sum + (s?.duration || 0), 0);
    const averageLength = totalTime / completedSessions.length;
    
    // Calculate average focus score
    const focusScores = completedSessions
      .filter(s => s?.productivity?.focusScore)
      .map(s => s.productivity.focusScore);
    const avgFocusScore = focusScores.length > 0 
      ? focusScores.reduce((sum, score) => sum + score, 0) / focusScores.length 
      : null;

    // Calculate average environment score
    const envScores = completedSessions
      .filter(s => s?.environment?.environmentScore)
      .map(s => s.environment.environmentScore);
    const avgEnvScore = envScores.length > 0
      ? envScores.reduce((sum, score) => sum + score, 0) / envScores.length
      : null;

    // Find most productive hour
    const hourlyProductivity = {};
    completedSessions.forEach(session => {
      const hour = new Date(session.startTime).getHours();
      if (!hourlyProductivity[hour]) {
        hourlyProductivity[hour] = { time: 0, sessions: 0 };
      }
      hourlyProductivity[hour].time += session.duration || 0;
      hourlyProductivity[hour].sessions += 1;
    });

    const mostProductiveHour = Object.entries(hourlyProductivity)
      .sort(([,a], [,b]) => (b?.time || 0) - (a?.time || 0))[0]?.[0];

    return {
      averageSessionLength: averageLength,
      totalStudyTime: totalTime,
      focusScore: avgFocusScore,
      environmentScore: avgEnvScore,
      mostProductiveHour: mostProductiveHour ? `${mostProductiveHour}:00` : null,
    };
  };

  const chartData = getChartData();
  const subjectData = getSubjectChartData();
  const productivityMetrics = getProductivityMetrics();

  if (isLoading) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={[globalStyles.centeredContent, { padding: 16 }]}>
          <Text style={globalStyles.textSecondary}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.container}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <Text style={[globalStyles.heading3, { marginBottom: 8 }]}>
            Study Analytics
          </Text>
          <Text style={globalStyles.textSecondary}>
            Track your progress and identify patterns in your study habits
          </Text>
        </View>

        {/* Time Range Selector */}
        <View style={{ 
          flexDirection: 'row', 
          backgroundColor: theme.colors.surface,
          borderRadius: 8,
          padding: 4,
          marginBottom: 24,
        }}>
          {['day', 'week', 'month'].map((range) => (
            <Pressable
              key={range}
              onPress={() => setTimeRange(range)}
              style={({ pressed }) => [
                {
                  flex: 1,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 6,
                  alignItems: 'center',
                  backgroundColor: timeRange === range ? theme.colors.primary : 'transparent',
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={{
                color: timeRange === range ? '#FFFFFF' : theme.colors.textSecondary,
                fontWeight: timeRange === range ? '600' : '400',
                textTransform: 'capitalize',
              }}>
                {range}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Key Metrics Overview */}
        <View style={{ marginBottom: 24 }}>
          <Text style={[globalStyles.heading5, { marginBottom: 16 }]}>
            Overview
          </Text>
          
          <View style={{ 
            flexDirection: 'row', 
            gap: 12,
            marginBottom: 12,
          }}>
            <MetricCard
              title="Today's Study Time"
              value={formatTime(totalTimeToday)}
              icon="time"
              color={theme.colors.focus}
              style={{ flex: 1 }}
              subtitle={`${Math.round(dailyProgressPercentage)}% of goal`}
              showProgress={true}
              progressValue={dailyProgressPercentage}
              progressMax={100}
            />
            
            <MetricCard
              title="Sessions Today"
              value={sessionsToday}
              icon="checkmark-circle"
              color={theme.colors.success}
              style={{ flex: 1 }}
              trend={sessionsToday > 0 ? 'up' : 'stable'}
            />
          </View>

          <View style={{ 
            flexDirection: 'row', 
            gap: 12,
          }}>
            <MetricCard
              title="Current Streak"
              value={currentStreak}
              unit="days"
              icon="flame"
              color={theme.colors.warning}
              style={{ flex: 1 }}
              subtitle="consecutive study days"
            />
            
            <MetricCard
              title="Weekly Goal"
              value={weeklyStats ? `${Math.round(((weeklyStats.totalStudyTime || 0) / (weeklyStats.goals?.weeklyTimeGoal || 1)) * 100)}%` : '0%'}
              icon="trophy"
              color={theme.colors.info}
              style={{ flex: 1 }}
              subtitle={weeklyStats ? formatTime(weeklyStats.totalStudyTime || 0) : '0m'}
            />
          </View>
        </View>

        {/* Study Time Chart */}
        {chartData.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <ProgressChart
              data={chartData}
              type="bar"
              title={`Study Time (${timeRange.charAt(0).toUpperCase() + timeRange.slice(1)})`}
              subtitle="Minutes studied"
              height={200}
              showGrid={true}
              showLabels={true}
            />
          </View>
        )}

        {/* Subject Breakdown */}
        {subjectData.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <ProgressChart
              data={subjectData}
              type="pie"
              title="Study Time by Subject"
              subtitle={`This ${timeRange}`}
              height={200}
              showLegend={true}
              colors={subjects?.map(s => s?.color).filter(Boolean) || []}
            />
          </View>
        )}

        {/* Productivity Insights */}
        <View style={{ marginBottom: 24 }}>
          <Text style={[globalStyles.heading5, { marginBottom: 16 }]}>
            Productivity Insights
          </Text>
          
          <View style={{ 
            flexDirection: 'row', 
            gap: 12,
            marginBottom: 12,
          }}>
            <MetricCard
              title="Avg Session Length"
              value={formatTime(productivityMetrics.averageSessionLength)}
              icon="timer"
              color={theme.colors.primary}
              style={{ flex: 1 }}
              size="small"
            />
            
            <MetricCard
              title="Focus Score"
              value={productivityMetrics.focusScore ? `${productivityMetrics.focusScore.toFixed(1)}/10` : '--'}
              icon="radio-button-on"
              color={theme.colors.focus}
              style={{ flex: 1 }}
              size="small"
            />
          </View>

          <View style={{ 
            flexDirection: 'row', 
            gap: 12,
          }}>
            <MetricCard
              title="Environment Score"
              value={productivityMetrics.environmentScore ? `${Math.round(productivityMetrics.environmentScore)}/100` : '--'}
              icon="bulb"
              color={theme.colors.good}
              style={{ flex: 1 }}
              size="small"
            />
            
            <MetricCard
              title="Best Study Hour"
              value={productivityMetrics.mostProductiveHour || '--'}
              icon="sunny"
              color={theme.colors.warning}
              style={{ flex: 1 }}
              size="small"
            />
          </View>
        </View>

        {/* Subject Performance */}
        {subjects.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text style={[globalStyles.heading5, { marginBottom: 16 }]}>
              Subject Performance
            </Text>
            
            {subjects.map((subject) => (
              <View key={subject?.id || Math.random()} style={[globalStyles.card, { marginBottom: 12 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <View
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: subject?.color || theme.colors.primary,
                      marginRight: 12,
                    }}
                  />
                  <Text style={[globalStyles.text, { fontWeight: '600', flex: 1 }]}>
                    {subject?.name || 'Unknown Subject'}
                  </Text>
                  {subject?.averageFocusScore && (
                    <Text style={[globalStyles.textSecondary]}>
                      ⭐ {subject.averageFocusScore}/10
                    </Text>
                  )}
                </View>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={globalStyles.textSecondary}>
                    {formatTime(subject?.totalStudyTime || 0)} total
                  </Text>
                  <Text style={globalStyles.textSecondary}>
                    {subject?.sessionsCount || 0} sessions
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Study Patterns & Recommendations */}
        <View style={[globalStyles.card, { 
          backgroundColor: theme.colors.surface,
          borderLeftWidth: 4,
          borderLeftColor: theme.colors.info,
          marginBottom: 24,
        }]}>
          <Text style={[globalStyles.text, { fontWeight: '600', marginBottom: 12 }]}>
            📊 Study Patterns & Recommendations
          </Text>
          
          <View style={{ gap: 8 }}>
            {productivityMetrics.mostProductiveHour && (
              <Text style={[globalStyles.textSecondary, { lineHeight: 18 }]}>
                • Your most productive time is around <Text style={{ fontWeight: '600' }}>{productivityMetrics.mostProductiveHour}</Text>
              </Text>
            )}
            
            {productivityMetrics.averageSessionLength > 0 && (
              <Text style={[globalStyles.textSecondary, { lineHeight: 18 }]}>
                • Your average session length is <Text style={{ fontWeight: '600' }}>{formatTime(productivityMetrics.averageSessionLength)}</Text>
              </Text>
            )}
            
            {dailyProgressPercentage < 50 && (
              <Text style={[globalStyles.textSecondary, { lineHeight: 18 }]}>
                • Consider breaking your daily goal into smaller, manageable sessions
              </Text>
            )}
            
            {currentStreak === 0 && (
              <Text style={[globalStyles.textSecondary, { lineHeight: 18 }]}>
                • Start building a study streak by studying a little bit each day
              </Text>
            )}
            
            {productivityMetrics.focusScore && productivityMetrics.focusScore < 6 && (
              <Text style={[globalStyles.textSecondary, { lineHeight: 18 }]}>
                • Try improving your study environment to boost focus scores
              </Text>
            )}
          </View>
        </View>

        {/* Export Data Option */}
        <Pressable
          onPress={async () => {
            try {
              const exportData = await StudyStorage.exportAllData();
              if (exportData) {
                Alert.alert(
                  'Data Export',
                  'Your study data has been prepared for export. In a full app, this would save to your device or cloud storage.',
                  [{ text: 'OK' }]
                );
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to export data');
            }
          }}
          style={({ pressed }) => [
            globalStyles.buttonSecondary,
            { marginBottom: 24 },
            pressed && { opacity: 0.8 },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons 
              name="download" 
              size={20} 
              color={theme.colors.primary}
              style={{ marginRight: 8 }}
            />
            <Text style={globalStyles.buttonTextSecondary}>Export Study Data</Text>
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}