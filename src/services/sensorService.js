// src/services/sensorService.js
import { LightSensor, Accelerometer } from 'expo-sensors';

class SensorService {
  constructor() {
    this.lightSubscription = null;
    this.accelerometerSubscription = null;
    this.isLightSensorAvailable = false;
    this.isAccelerometerAvailable = false;
    this.listeners = new Set();
    
    // Current sensor data
    this.currentData = {
      lightLevel: null,
      motionLevel: 'low',
      lastUpdated: null,
    };
    
    // Motion detection variables
    this.accelerometerData = { x: 0, y: 0, z: 0 };
    this.motionThreshold = 0.1;
    this.motionHistory = [];
    this.motionHistorySize = 10;
  }

  // Initialize sensors
  async initialize() {
    try {
      await this.initializeLightSensor();
      await this.initializeAccelerometer();
      return true;
    } catch (error) {
      console.error('Error initializing sensors:', error);
      return false;
    }
  }

  // Initialize light sensor
  async initializeLightSensor() {
    try {
      // Check if light sensor is available
      const isAvailable = await LightSensor.isAvailableAsync();
      this.isLightSensorAvailable = isAvailable;
      
      if (!isAvailable) {
        console.warn('Light sensor not available on this device');
        // Simulate light sensor for testing/demo purposes
        this.simulateLightSensor();
        return;
      }

      // Set update interval (in milliseconds)
      LightSensor.setUpdateInterval(1000); // Update every second
      
      console.log('Light sensor initialized successfully');
    } catch (error) {
      console.error('Error initializing light sensor:', error);
      this.simulateLightSensor();
    }
  }

  // Initialize accelerometer for motion detection
  async initializeAccelerometer() {
    try {
      // Check if accelerometer is available
      const isAvailable = await Accelerometer.isAvailableAsync();
      this.isAccelerometerAvailable = isAvailable;
      
      if (!isAvailable) {
        console.warn('Accelerometer not available on this device');
        return;
      }

      // Set update interval
      Accelerometer.setUpdateInterval(200); // Update every 200ms
      
      console.log('Accelerometer initialized successfully');
    } catch (error) {
      console.error('Error initializing accelerometer:', error);
    }
  }

  // Start monitoring sensors
  startMonitoring() {
    this.startLightMonitoring();
    this.startMotionMonitoring();
  }

  // Start light sensor monitoring
  startLightMonitoring() {
    if (this.lightSubscription) {
      return; // Already monitoring
    }

    if (this.isLightSensorAvailable) {
      this.lightSubscription = LightSensor.addListener((data) => {
        this.handleLightData(data.illuminance);
      });
    } else {
      // Continue with simulated data
      this.simulateLightSensor();
    }
  }

  // Start motion monitoring
  startMotionMonitoring() {
    if (this.accelerometerSubscription) {
      return; // Already monitoring
    }

    if (this.isAccelerometerAvailable) {
      this.accelerometerSubscription = Accelerometer.addListener((data) => {
        this.handleAccelerometerData(data);
      });
    }
  }

  // Handle light sensor data
  handleLightData(illuminance) {
    // Convert lux to percentage (0-100%)
    // Typical indoor lighting: 100-1000 lux
    // Good reading light: 500-1000 lux
    const lightPercentage = Math.min(Math.max((illuminance / 1000) * 100, 0), 100);
    
    this.currentData.lightLevel = Math.round(lightPercentage);
    this.currentData.lastUpdated = Date.now();
    
    this.notifyListeners();
  }

  // Handle accelerometer data for motion detection
  handleAccelerometerData({ x, y, z }) {
    // Calculate motion magnitude
    const previousMagnitude = Math.sqrt(
      this.accelerometerData.x ** 2 + 
      this.accelerometerData.y ** 2 + 
      this.accelerometerData.z ** 2
    );
    
    const currentMagnitude = Math.sqrt(x ** 2 + y ** 2 + z ** 2);
    const motionDelta = Math.abs(currentMagnitude - previousMagnitude);
    
    // Update accelerometer data
    this.accelerometerData = { x, y, z };
    
    // Add to motion history
    this.motionHistory.push(motionDelta);
    if (this.motionHistory.length > this.motionHistorySize) {
      this.motionHistory.shift();
    }
    
    // Calculate average motion over history
    const averageMotion = this.motionHistory.reduce((sum, val) => sum + val, 0) / this.motionHistory.length;
    
    // Determine motion level
    let motionLevel;
    if (averageMotion < this.motionThreshold * 0.5) {
      motionLevel = 'low';
    } else if (averageMotion < this.motionThreshold) {
      motionLevel = 'medium';
    } else {
      motionLevel = 'high';
    }
    
    this.currentData.motionLevel = motionLevel;
    this.currentData.lastUpdated = Date.now();
    
    this.notifyListeners();
  }

  // Simulate light sensor for devices without it
  simulateLightSensor() {
    // Simulate varying light conditions
    const simulateLight = () => {
      // Random light level between 30-90% (simulating indoor conditions)
      const baseLight = 60;
      const variation = (Math.random() - 0.5) * 30;
      const lightLevel = Math.max(20, Math.min(95, baseLight + variation));
      
      this.currentData.lightLevel = Math.round(lightLevel);
      this.currentData.lastUpdated = Date.now();
      
      this.notifyListeners();
    };
    
    // Update every 3 seconds
    this.lightSimulationInterval = setInterval(simulateLight, 3000);
    simulateLight(); // Initial reading
  }

  // Stop monitoring sensors
  stopMonitoring() {
    if (this.lightSubscription) {
      this.lightSubscription.remove();
      this.lightSubscription = null;
    }
    
    if (this.accelerometerSubscription) {
      this.accelerometerSubscription.remove();
      this.accelerometerSubscription = null;
    }
    
    if (this.lightSimulationInterval) {
      clearInterval(this.lightSimulationInterval);
      this.lightSimulationInterval = null;
    }
  }

  // Add listener for sensor data updates
  addListener(callback) {
    this.listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Notify all listeners of data updates
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.getCurrentData());
      } catch (error) {
        console.error('Error notifying sensor listener:', error);
      }
    });
  }

  // Get current sensor data
  getCurrentData() {
    return { ...this.currentData };
  }

  // Get sensor availability status
  getSensorStatus() {
    return {
      lightSensor: this.isLightSensorAvailable,
      accelerometer: this.isAccelerometerAvailable,
      isMonitoring: this.lightSubscription !== null || this.accelerometerSubscription !== null,
    };
  }

  // Calibrate motion threshold based on current conditions
  calibrateMotion() {
    // Reset motion history to recalibrate
    this.motionHistory = [];
    
    // Could add more sophisticated calibration logic here
    console.log('Motion detection calibrated');
  }

  // Cleanup resources
  cleanup() {
    this.stopMonitoring();
    this.listeners.clear();
  }
}

// Export singleton instance
export default new SensorService();