// app/environment.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, Camera } from 'expo-camera';
import { useTheme } from '../src/context/ThemeContext';
import { useStudy } from '../src/context/StudyContext';
import EnvironmentCard from '../src/components/EnvironmentCard';
import MetricCard from '../src/components/MetricCard';
import ProgressChart from '../src/components/ProgressChart';
import EnvironmentService from '../src/services/environmentService';
import SensorService from '../src/services/sensorService';

export default function EnvironmentScreen() {
  const { theme, globalStyles } = useTheme();
  const { environment, updateEnvironment } = useStudy();
  const [cameraPermission, setCameraPermission] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [environmentHistory, setEnvironmentHistory] = useState([]);
  const [optimalTimes, setOptimalTimes] = useState([]);
  const [trends, setTrends] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    loadEnvironmentData();
    checkCameraPermissions();
  }, []);

  const loadEnvironmentData = () => {
    // Load historical environment data
    const history = EnvironmentService.getHistory();
    setEnvironmentHistory(history.slice(0, 24)); // Last 24 readings
    
    // Get optimal study times
    const times = EnvironmentService.getOptimalStudyTimes();
    setOptimalTimes(times.recommended);
    
    // Get trends
    const trendData = EnvironmentService.getTrends();
    setTrends(trendData);
  };

  const checkCameraPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setCameraPermission(status === 'granted');
  };

  const handleTakePhoto = async () => {
    if (!cameraPermission) {
      Alert.alert(
        'Camera Permission Required',
        'Please allow camera access to analyze your study environment.',
        [
          { text: 'Cancel' },
          { text: 'Allow', onPress: checkCameraPermissions },
        ]
      );
      return;
    }

    setShowCamera(true);
  };

  const captureEnvironmentPhoto = async () => {
    if (!cameraRef.current) return;

    try {
      setIsAnalyzing(true);
      const photo = await EnvironmentService.takeEnvironmentPhoto(cameraRef.current);
      setCapturedImage(photo);
      setShowCamera(false);
      
      Alert.alert(
        'Photo Captured!',
        'Your environment has been analyzed. Check the recommendations below.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture environment photo.');
    } finally {
      setIsAnalyzing(false);
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

  const getEnvironmentScoreColor = (score) => {
    if (score >= 90) return theme.colors.optimal;
    if (score >= 70) return theme.colors.good;
    if (score >= 50) return theme.colors.poor;
    return theme.colors.critical;
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving': return 'trending-up';
      case 'declining': return 'trending-down';
      case 'stable': return 'remove';
      default: return 'help-circle';
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'improving': return theme.colors.success;
      case 'declining': return theme.colors.error;
      case 'stable': return theme.colors.textSecondary;
      default: return theme.colors.textSecondary;
    }
  };

  // Prepare chart data from environment history
  const chartData = environmentHistory.slice(0, 12).reverse().map((entry, index) => ({
    name: `${index + 1}`,
    value: entry.score || 0,
    lightLevel: entry.lightLevel || 0,
    motionLevel: entry.motionLevel === 'low' ? 1 : entry.motionLevel === 'medium' ? 2 : 3,
  }));

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
            Environment Analysis
          </Text>
          <Text style={globalStyles.textSecondary}>
            Monitor and optimize your study environment for better focus
          </Text>
        </View>

        {/* Current Environment Status */}
        <View style={{ marginBottom: 24 }}>
          <EnvironmentCard
            size="large"
            showRecommendations={true}
          />
        </View>

        {/* Quick Actions */}
        <View style={{ 
          flexDirection: 'row', 
          gap: 12,
          marginBottom: 24,
        }}>
          <Pressable
            onPress={handleTakePhoto}
            style={({ pressed }) => [
              globalStyles.button,
              { flex: 1 },
              pressed && { opacity: 0.8 },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons 
                name="camera" 
                size={20} 
                color="#FFFFFF"
                style={{ marginRight: 8 }}
              />
              <Text style={globalStyles.buttonText}>Analyze with Camera</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={loadEnvironmentData}
            style={({ pressed }) => [
              globalStyles.buttonSecondary,
              { flex: 1 },
              pressed && { opacity: 0.8 },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons 
                name="refresh" 
                size={20} 
                color={theme.colors.primary}
                style={{ marginRight: 8 }}
              />
              <Text style={globalStyles.buttonTextSecondary}>Refresh</Text>
            </View>
          </Pressable>
        </View>

        {/* Environment Metrics */}
        <View style={{ marginBottom: 24 }}>
          <Text style={[globalStyles.heading5, { marginBottom: 16 }]}>
            Current Conditions
          </Text>
          
          <View style={{ 
            flexDirection: 'row', 
            gap: 12,
            marginBottom: 12,
          }}>
            <MetricCard
              title="Environment Score"
              value={environment.score || '--'}
              unit="/100"
              icon="speedometer"
              color={getEnvironmentScoreColor(environment.score)}
              style={{ flex: 1 }}
              size="medium"
            />
            
            <MetricCard
              title="Light Level"
              value={environment.lightLevel !== null ? environment.lightLevel : '--'}
              unit="%"
              icon="sunny"
              color={theme.colors.warning}
              style={{ flex: 1 }}
              size="medium"
            />
          </View>

          <MetricCard
            title="Motion Level"
            value={environment.motionLevel ? 
              environment.motionLevel.charAt(0).toUpperCase() + environment.motionLevel.slice(1) : 
              'Unknown'
            }
            icon="body"
            color={theme.colors.info}
            subtitle={environment.motionLevel === 'low' ? 'Minimal distractions' : 
                     environment.motionLevel === 'medium' ? 'Some movement detected' :
                     'High activity detected'}
          />
        </View>

        {/* Environment Trends */}
        {trends && (
          <View style={{ marginBottom: 24 }}>
            <Text style={[globalStyles.heading5, { marginBottom: 16 }]}>
              Environment Trends
            </Text>
            
            <View style={{ 
              flexDirection: 'row', 
              gap: 12,
            }}>
              <MetricCard
                title="Lighting Trend"
                value={trends.lighting.charAt(0).toUpperCase() + trends.lighting.slice(1)}
                icon={getTrendIcon(trends.lighting)}
                color={getTrendColor(trends.lighting)}
                style={{ flex: 1 }}
                size="small"
              />
              
              <MetricCard
                title="Motion Trend"
                value={trends.motion.charAt(0).toUpperCase() + trends.motion.slice(1)}
                icon={getTrendIcon(trends.motion)}
                color={getTrendColor(trends.motion)}
                style={{ flex: 1 }}
                size="small"
              />
              
              <MetricCard
                title="Overall Trend"
                value={trends.overall.charAt(0).toUpperCase() + trends.overall.slice(1)}
                icon={getTrendIcon(trends.overall)}
                color={getTrendColor(trends.overall)}
                style={{ flex: 1 }}
                size="small"
              />
            </View>
          </View>
        )}

        {/* Environment History Chart */}
        {chartData.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <ProgressChart
              data={chartData}
              type="line"
              title="Environment Score History"
              subtitle="Last 12 readings"
              height={200}
              showGrid={true}
              showLabels={true}
            />
          </View>
        )}

        {/* Optimal Study Times */}
        {optimalTimes.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text style={[globalStyles.heading5, { marginBottom: 16 }]}>
              Your Optimal Study Times
            </Text>
            
            <View style={[globalStyles.card, { 
              backgroundColor: theme.colors.surface,
              borderLeftWidth: 4,
              borderLeftColor: theme.colors.success,
            }]}>
              <Text style={[globalStyles.text, { fontWeight: '600', marginBottom: 12 }]}>
                🌟 Based on your environment data:
              </Text>
              
              {optimalTimes.map((time, index) => (
                <View key={index} style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}>
                  <Text style={globalStyles.text}>
                    {time.timeRange}
                  </Text>
                  <View style={{
                    backgroundColor: getEnvironmentScoreColor(time.score),
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                  }}>
                    <Text style={[globalStyles.text, { color: '#FFFFFF', fontSize: 12 }]}>
                      {time.score}/100
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recent Environment Photo */}
        {capturedImage && (
          <View style={{ marginBottom: 24 }}>
            <Text style={[globalStyles.heading5, { marginBottom: 16 }]}>
              Recent Environment Analysis
            </Text>
            
            <View style={globalStyles.card}>
              <Image 
                source={{ uri: capturedImage.uri }}
                style={{
                  width: '100%',
                  height: 200,
                  borderRadius: 8,
                  marginBottom: 12,
                }}
                resizeMode="cover"
              />
              
              <Text style={[globalStyles.text, { fontWeight: '600', marginBottom: 8 }]}>
                Analysis Results:
              </Text>
              
              <View style={{ gap: 4 }}>
                <Text style={globalStyles.textSecondary}>
                  Brightness: {capturedImage.analysis.brightness || 'Unknown'}%
                </Text>
                <Text style={globalStyles.textSecondary}>
                  Quality: {capturedImage.analysis.quality || 'Unknown'}
                </Text>
              </View>

              {capturedImage.analysis.recommendations && capturedImage.analysis.recommendations.length > 0 && (
                <View style={{ marginTop: 12 }}>
                  <Text style={[globalStyles.textSecondary, { marginBottom: 8 }]}>
                    💡 Recommendations:
                  </Text>
                  {capturedImage.analysis.recommendations.map((rec, index) => (
                    <Text key={index} style={[globalStyles.textSecondary, { marginBottom: 4 }]}>
                      • {rec}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Tips for Environment Optimization */}
        <View style={[globalStyles.card, { 
          backgroundColor: theme.colors.surface,
          borderLeftWidth: 4,
          borderLeftColor: theme.colors.info,
        }]}>
          <Text style={[globalStyles.text, { fontWeight: '600', marginBottom: 12 }]}>
            💡 Environment Optimization Tips
          </Text>
          
          <Text style={[globalStyles.textSecondary, { lineHeight: 20 }]}>
            • <Text style={{ fontWeight: '600' }}>Lighting:</Text> Aim for 50-80% brightness level. Natural light is best, but avoid glare{'\n'}
            • <Text style={{ fontWeight: '600' }}>Movement:</Text> Keep motion to a minimum during study sessions{'\n'}
            • <Text style={{ fontWeight: '600' }}>Sound:</Text> Find a quiet space or use noise-cancelling headphones{'\n'}
            • <Text style={{ fontWeight: '600' }}>Temperature:</Text> Keep the room slightly cool (68-72°F) for optimal focus{'\n'}
            • <Text style={{ fontWeight: '600' }}>Clutter:</Text> Maintain a clean, organized study space
          </Text>
        </View>
      </ScrollView>

      {/* Camera Modal */}
      <Modal
        visible={showCamera}
        animationType="slide"
        onRequestClose={() => setShowCamera(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          {cameraPermission && (
            <Camera
              ref={cameraRef}
              style={{ flex: 1 }}
              facing="back"
            />
          )}
          
          {/* Camera Controls */}
          <View style={{
            position: 'absolute',
            bottom: 50,
            left: 0,
            right: 0,
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center',
            paddingHorizontal: 20,
          }}>
            <Pressable
              onPress={() => setShowCamera(false)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                borderRadius: 35,
                padding: 15,
              }}
            >
              <Ionicons name="close" size={30} color="#FFFFFF" />
            </Pressable>

            <Pressable
              onPress={captureEnvironmentPhoto}
              disabled={isAnalyzing}
              style={{
                backgroundColor: isAnalyzing ? 'rgba(255, 255, 255, 0.3)' : '#FFFFFF',
                borderRadius: 40,
                padding: 20,
              }}
            >
              <Ionicons 
                name={isAnalyzing ? "hourglass" : "camera"} 
                size={40} 
                color={isAnalyzing ? "#FFFFFF" : "#000000"} 
              />
            </Pressable>

            <View style={{ width: 70 }} />
          </View>

          {/* Instructions */}
          <View style={{
            position: 'absolute',
            top: 100,
            left: 20,
            right: 20,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderRadius: 8,
            padding: 16,
          }}>
            <Text style={{
              color: '#FFFFFF',
              textAlign: 'center',
              fontSize: 16,
              marginBottom: 8,
            }}>
              Environment Analysis
            </Text>
            <Text style={{
              color: '#FFFFFF',
              textAlign: 'center',
              fontSize: 14,
            }}>
              Point the camera at your study area and tap the capture button
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}