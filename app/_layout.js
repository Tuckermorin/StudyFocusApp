// app/_layout.js
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { StudyProvider } from '../src/context/StudyContext';

function RootLayoutNav() {
  const { theme } = useTheme();
  const router = useRouter();

  const SettingsButton = () => (
    <Pressable
      onPress={() => router.push('/settings')}
      style={({ pressed }) => [
        {
          padding: 8,
          backgroundColor: pressed ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
          borderRadius: 20,
          marginHorizontal: 4,
          minWidth: 40,
          minHeight: 40,
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}
      testID="settings-button"
    >
      <Ionicons name="settings" size={20} color="#FFFFFF" />
    </Pressable>
  );

  const EnvironmentButton = () => (
    <Pressable
      onPress={() => router.push('/environment')}
      style={({ pressed }) => [
        {
          padding: 8,
          backgroundColor: pressed ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
          borderRadius: 20,
          marginHorizontal: 4,
          minWidth: 40,
          minHeight: 40,
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}
      testID="environment-button"
    >
      <Ionicons name="eye" size={20} color="#FFFFFF" />
    </Pressable>
  );

  const AnalyticsButton = () => (
    <Pressable
      onPress={() => router.push('/analytics')}
      style={({ pressed }) => [
        {
          padding: 8,
          backgroundColor: pressed ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
          borderRadius: 20,
          marginHorizontal: 4,
          minWidth: 40,
          minHeight: 40,
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}
      testID="analytics-button"
    >
      <Ionicons name="analytics" size={20} color="#FFFFFF" />
    </Pressable>
  );

  const ScannerButton = () => (
    <Pressable
      onPress={() => router.push('/scanner')}
      style={({ pressed }) => [
        {
          padding: 8,
          backgroundColor: pressed ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
          borderRadius: 20,
          marginHorizontal: 4,
          minWidth: 40,
          minHeight: 40,
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}
      testID="scanner-button"
    >
      <Ionicons name="camera" size={20} color="#FFFFFF" />
    </Pressable>
  );

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        headerShadowVisible: true,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'StudyFocus',
          headerRight: () => (
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center',
              marginRight: 10,
            }}>
              <EnvironmentButton />
              <AnalyticsButton />
              <SettingsButton />
            </View>
          ),
        }}
      />
      
      <Stack.Screen
        name="session"
        options={{
          title: 'Study Session',
          headerRight: () => (
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center',
              marginRight: 10,
            }}>
              <EnvironmentButton />
              <SettingsButton />
            </View>
          ),
        }}
      />
      
      <Stack.Screen
        name="environment"
        options={{
          title: 'Environment Check',
          headerRight: () => (
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center',
              marginRight: 10,
            }}>
              <ScannerButton />
              <SettingsButton />
            </View>
          ),
        }}
      />
      
      <Stack.Screen
        name="analytics"
        options={{
          title: 'Study Analytics',
          headerRight: () => (
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center',
              marginRight: 10,
            }}>
              <EnvironmentButton />
              <SettingsButton />
            </View>
          ),
        }}
      />
      
      <Stack.Screen
        name="scanner"
        options={{
          title: 'Document Scanner',
          headerRight: () => (
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center',
              marginRight: 10,
            }}>
              <AnalyticsButton />
              <SettingsButton />
            </View>
          ),
        }}
      />
      
      <Stack.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerRight: () => null, // No buttons on settings screen
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StudyProvider>
          <RootLayoutNav />
        </StudyProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}