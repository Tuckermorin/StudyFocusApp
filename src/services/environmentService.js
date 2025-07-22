// src/services/environmentService.js
import { Camera } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import SensorService from './sensorService';

class EnvironmentService {
  constructor() {
    this.analysisHistory = [];
    this.maxHistoryLength = 50;
    this.cameraRef = null;
  }

  // Analyze current environment conditions
  analyzeEnvironment(sensorData) {
    const analysis = {
      timestamp: Date.now(),
      lightLevel: sensorData.lightLevel,
      motionLevel: sensorData.motionLevel,
      status: 'unknown',
      score: 0,
      recommendations: [],
      issues: [],
    };

    // Analyze lighting conditions
    const lightAnalysis = this.analyzeLighting(sensorData.lightLevel);
    analysis.lightScore = lightAnalysis.score;
    analysis.recommendations.push(...lightAnalysis.recommendations);
    analysis.issues.push(...lightAnalysis.issues);

    // Analyze motion/distraction level
    const motionAnalysis = this.analyzeMotion(sensorData.motionLevel);
    analysis.motionScore = motionAnalysis.score;
    analysis.recommendations.push(...motionAnalysis.recommendations);
    analysis.issues.push(...motionAnalysis.issues);

    // Calculate overall score (weighted average)
    analysis.score = Math.round((lightAnalysis.score * 0.7) + (motionAnalysis.score * 0.3));

    // Determine overall status
    analysis.status = this.getOverallStatus(analysis.score);

    // Add to history
    this.addToHistory(analysis);

    return analysis;
  }

  // Analyze lighting conditions
  analyzeLighting(lightLevel) {
    const analysis = {
      score: 0,
      recommendations: [],
      issues: [],
    };

    if (lightLevel === null || lightLevel === undefined) {
      analysis.score = 50;
      analysis.issues.push('Unable to measure light levels');
      analysis.recommendations.push('Manually check your lighting setup');
      return analysis;
    }

    // Optimal reading light: 50-80%
    // Good light: 40-90%
    // Poor light: <40% or >90%
    if (lightLevel >= 50 && lightLevel <= 80) {
      // Optimal range
      analysis.score = 100;
    } else if (lightLevel >= 40 && lightLevel <= 90) {
      // Good range
      analysis.score = 80;
      if (lightLevel < 50) {
        analysis.recommendations.push('Consider increasing brightness slightly for optimal reading');
      } else {
        analysis.recommendations.push('Light level is a bit high - you may want to reduce glare');
      }
    } else if (lightLevel >= 25 && lightLevel < 40) {
      // Poor - too dim
      analysis.score = 40;
      analysis.issues.push('Lighting is too dim for comfortable reading');
      analysis.recommendations.push('Increase room lighting or add a desk lamp');
      analysis.recommendations.push('Position yourself closer to a window if possible');
    } else if (lightLevel > 90) {
      // Poor - too bright
      analysis.score = 40;
      analysis.issues.push('Lighting is too bright and may cause glare');
      analysis.recommendations.push('Reduce overhead lighting or move away from direct light');
      analysis.recommendations.push('Consider using blinds to control natural light');
    } else {
      // Very poor
      analysis.score = 20;
      analysis.issues.push('Lighting conditions are not suitable for studying');
      analysis.recommendations.push('Significant lighting adjustment needed');
    }

    return analysis;
  }

  // Analyze motion/distraction level
  analyzeMotion(motionLevel) {
    const analysis = {
      score: 0,
      recommendations: [],
      issues: [],
    };

    switch (motionLevel) {
      case 'low':
        analysis.score = 100;
        break;
        
      case 'medium':
        analysis.score = 70;
        analysis.recommendations.push('Try to minimize movement for better focus');
        break;
        
      case 'high':
        analysis.score = 30;
        analysis.issues.push('High movement detected - may indicate distraction');
        analysis.recommendations.push('Take a short break if feeling restless');
        analysis.recommendations.push('Consider changing your study position');
        analysis.recommendations.push('Ensure your study area is comfortable');
        break;
        
      default:
        analysis.score = 50;
        analysis.issues.push('Unable to measure movement levels');
    }

    return analysis;
  }

  // Get overall environment status
  getOverallStatus(score) {
    if (score >= 90) return 'optimal';
    if (score >= 70) return 'good';
    if (score >= 50) return 'poor';
    return 'critical';
  }

  // Add analysis to history
  addToHistory(analysis) {
    this.analysisHistory.unshift(analysis);
    if (this.analysisHistory.length > this.maxHistoryLength) {
      this.analysisHistory.pop();
    }
  }

  // Get analysis history
  getHistory() {
    return [...this.analysisHistory];
  }

  // Get average environment score over time period
  getAverageScore(timeRangeMs = 24 * 60 * 60 * 1000) { // Default: 24 hours
    const cutoff = Date.now() - timeRangeMs;
    const recentAnalyses = this.analysisHistory.filter(
      analysis => analysis.timestamp > cutoff
    );

    if (recentAnalyses.length === 0) return null;

    const totalScore = recentAnalyses.reduce((sum, analysis) => sum + analysis.score, 0);
    return Math.round(totalScore / recentAnalyses.length);
  }

  // Get environment trends
  getTrends() {
    if (this.analysisHistory.length < 5) {
      return {
        lighting: 'insufficient_data',
        motion: 'insufficient_data',
        overall: 'insufficient_data',
      };
    }

    const recent = this.analysisHistory.slice(0, 5);
    const older = this.analysisHistory.slice(5, 10);

    const getAverage = (analyses, property) => {
      return analyses.reduce((sum, a) => sum + (a[property] || 0), 0) / analyses.length;
    };

    const recentLightScore = getAverage(recent, 'lightScore');
    const olderLightScore = getAverage(older, 'lightScore');
    const lightTrend = recentLightScore > olderLightScore + 5 ? 'improving' : 
                      recentLightScore < olderLightScore - 5 ? 'declining' : 'stable';

    const recentMotionScore = getAverage(recent, 'motionScore');
    const olderMotionScore = getAverage(older, 'motionScore');
    const motionTrend = recentMotionScore > olderMotionScore + 5 ? 'improving' : 
                       recentMotionScore < olderMotionScore - 5 ? 'declining' : 'stable';

    const recentOverallScore = getAverage(recent, 'score');
    const olderOverallScore = getAverage(older, 'score');
    const overallTrend = recentOverallScore > olderOverallScore + 5 ? 'improving' : 
                        recentOverallScore < olderOverallScore - 5 ? 'declining' : 'stable';

    return {
      lighting: lightTrend,
      motion: motionTrend,
      overall: overallTrend,
    };
  }

  // Request camera permissions
  async requestCameraPermissions() {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      return false;
    }
  }

  // Take environment photo for analysis
  async takeEnvironmentPhoto(cameraRef) {
    try {
      if (!cameraRef) {
        throw new Error('Camera reference not provided');
      }

      const photo = await cameraRef.takePictureAsync({
        quality: 0.7,
        base64: false,
        skipProcessing: true,
      });

      // Analyze photo for lighting conditions
      const photoAnalysis = await this.analyzePhoto(photo.uri);
      
      return {
        uri: photo.uri,
        analysis: photoAnalysis,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Error taking environment photo:', error);
      throw error;
    }
  }

  // Analyze photo for environment conditions
  async analyzePhoto(photoUri) {
    try {
      // This is a simplified analysis - in a real app, you might use
      // image processing libraries or ML models
      
      const fileInfo = await FileSystem.getInfoAsync(photoUri);
      
      // Basic analysis based on file size and current sensor data
      const sensorData = SensorService.getCurrentData();
      const currentAnalysis = this.analyzeEnvironment(sensorData);
      
      return {
        brightness: sensorData.lightLevel,
        quality: currentAnalysis.status,
        recommendations: currentAnalysis.recommendations,
        fileSize: fileInfo.size,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Error analyzing photo:', error);
      return {
        brightness: null,
        quality: 'unknown',
        recommendations: ['Unable to analyze photo'],
        error: error.message,
      };
    }
  }

  // Get optimal study times based on historical data
  getOptimalStudyTimes() {
    if (this.analysisHistory.length < 10) {
      return {
        recommended: [],
        message: 'Not enough data to determine optimal study times',
      };
    }

    // Group analyses by hour of day
    const hourlyScores = {};
    
    this.analysisHistory.forEach(analysis => {
      const hour = new Date(analysis.timestamp).getHours();
      if (!hourlyScores[hour]) {
        hourlyScores[hour] = [];
      }
      hourlyScores[hour].push(analysis.score);
    });

    // Calculate average score for each hour
    const hourlyAverages = {};
    Object.keys(hourlyScores).forEach(hour => {
      const scores = hourlyScores[hour];
      hourlyAverages[hour] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    });

    // Find the best hours (score > 70)
    const goodHours = Object.entries(hourlyAverages)
      .filter(([hour, score]) => score > 70)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour, score]) => ({
        hour: parseInt(hour),
        score: Math.round(score),
        timeRange: `${hour}:00 - ${parseInt(hour) + 1}:00`,
      }));

    return {
      recommended: goodHours,
      message: goodHours.length > 0 
        ? `Based on your environment data, these are your optimal study times`
        : 'Your environment seems to vary throughout the day. Try different times to find what works best.',
    };
  }

  // Clear history (for privacy/storage management)
  clearHistory() {
    this.analysisHistory = [];
  }

  // Export environment data
  exportData() {
    return {
      history: this.analysisHistory,
      trends: this.getTrends(),
      averageScore: this.getAverageScore(),
      optimalTimes: this.getOptimalStudyTimes(),
      exportedAt: Date.now(),
    };
  }
}

// Export singleton instance
export default new EnvironmentService();