// app/_layout.js
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { StudyProvider } from '../src/context/StudyContext';

// Replace the entire RootLayoutNav function in app/_layout.js

function RootLayoutNav() {
  const { theme } = useTheme();
  const router = useRouter();

  // Simplified button component with better spacing
  const HeaderButton = ({ iconName, onPress, testID }) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: pressed ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.15)',
          alignItems: 'center',
          justifyContent: 'center',
          marginHorizontal: 6,
        },
      ]}
      testID={testID}
    >
      <Ionicons name={iconName} size={20} color="#FFFFFF" />
    </Pressable>
  );

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
          height: 100, // Slightly taller header for better spacing
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 20,
        },
        headerTitleAlign: 'center', // Ensure title stays centered
        headerShadowVisible: true,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'StudyFocus',
          headerLeft: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <HeaderButton 
                iconName="eye" 
                onPress={() => router.push('/environment')}
                testID="environment-button"
              />
            </View>
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <HeaderButton 
                iconName="analytics" 
                onPress={() => router.push('/analytics')}
                testID="analytics-button"
              />
              <HeaderButton 
                iconName="settings" 
                onPress={() => router.push('/settings')}
                testID="settings-button"
              />
            </View>
          ),
        }}
      />
      
      <Stack.Screen
        name="session"
        options={{
          title: 'Study Session',
          headerLeft: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <HeaderButton 
                iconName="eye" 
                onPress={() => router.push('/environment')}
                testID="environment-button"
              />
            </View>
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <HeaderButton 
                iconName="settings" 
                onPress={() => router.push('/settings')}
                testID="settings-button"
              />
            </View>
          ),
        }}
      />
      
      <Stack.Screen
        name="environment"
        options={{
          title: 'Environment Check',
          headerLeft: () => null, // Clean left side
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <HeaderButton 
                iconName="camera" 
                onPress={() => router.push('/scanner')}
                testID="scanner-button"
              />
              <HeaderButton 
                iconName="settings" 
                onPress={() => router.push('/settings')}
                testID="settings-button"
              />
            </View>
          ),
        }}
      />
      
      <Stack.Screen
        name="analytics"
        options={{
          title: 'Study Analytics',
          headerLeft: () => null, // Clean left side
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <HeaderButton 
                iconName="eye" 
                onPress={() => router.push('/environment')}
                testID="environment-button"
              />
              <HeaderButton 
                iconName="settings" 
                onPress={() => router.push('/settings')}
                testID="settings-button"
              />
            </View>
          ),
        }}
      />
      
      <Stack.Screen
        name="scanner"
        options={{
          title: 'Document Scanner',
          headerLeft: () => null, // Clean left side
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <HeaderButton 
                iconName="analytics" 
                onPress={() => router.push('/analytics')}
                testID="analytics-button"
              />
              <HeaderButton 
                iconName="settings" 
                onPress={() => router.push('/settings')}
                testID="settings-button"
              />
            </View>
          ),
        }}
      />
      
      <Stack.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerLeft: () => null,
          headerRight: () => null, // No buttons on settings screen for clean look
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