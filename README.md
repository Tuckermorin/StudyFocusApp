# StudyFocus

A comprehensive study companion app built with React Native and Expo that helps students optimize their study environment, track their progress, and maintain focus through intelligent monitoring and analytics.

## App Description

StudyFocus is designed to be the ultimate study companion for students who want to maximize their learning efficiency. The app combines environmental monitoring, session tracking, and document management into a cohesive platform that adapts to each user's study habits and preferences.

The core functionality revolves around intelligent study session management with real-time environment analysis. Using device sensors, the app monitors lighting conditions and motion levels to provide recommendations for optimal study environments. Students can track their study sessions across different subjects, set daily goals, and view detailed analytics to understand their productivity patterns.

Key features include:

- **Smart Environment Monitoring**: Real-time analysis of lighting and motion conditions with personalized recommendations
- **Study Session Tracking**: Pomodoro-style timer with customizable session and break lengths
- **Subject Management**: Organize study sessions by subject with color-coded tracking
- **Document Scanner**: Built-in camera functionality to scan and organize study materials
- **Analytics Dashboard**: Comprehensive insights into study habits, productivity trends, and goal progress
- **Multi-theme Support**: Light, dark, and focus themes optimized for different study environments

The app is built using modern React Native practices with Expo, ensuring smooth performance across iOS and Android devices while maintaining a native feel and appearance.

## Wireframes

<!-- Add your screenshots here -->
![Home Screen](./wireframes/home-screen.png)
*Main dashboard showing today's progress and environment status*

![Study Session](./wireframes/study-session.png)
*Active study session with timer and environment monitoring*

![Analytics](./wireframes/analytics.png)
*Detailed analytics and progress tracking*

![Environment Analysis](./wireframes/environment.png)
*Environment monitoring with recommendations*

![Settings](./wireframes/settings.png)
*Customizable preferences and theme selection*

![Document Scanner](./wireframes/scanner.png)
*Built-in document scanning functionality*

## Material Design Implementation

StudyFocus extensively implements Google's Material Design principles with specific, measurable implementations:

### Core Design System
- **Color System**: Primary color `#4285f4` (Material Blue) with semantic colors for status (success: `#10b981`, warning: `#f59e0b`, error: `#ef4444`)
- **Typography Scale**: 6-level hierarchy from 40px hero text down to 12px captions with proper line heights (1.4x ratio)
- **8dp Grid System**: Consistent spacing using 4dp, 8dp, 16dp, 24dp, 32dp increments throughout the app
- **Elevation System**: 4dp elevation for cards, 6dp for FABs, 16dp for modals with proper shadow implementation

### Component Specifications
- **Floating Action Buttons**: 56×56dp standard FABs (Analytics, Scanner, Environment) and 96×56dp extended FAB (Dashboard) with 6dp elevation
- **Touch Targets**: All interactive elements meet 48dp minimum requirement (header buttons are 44×44dp, cards and buttons 48dp+)
- **Cards**: 12dp border radius, 4dp elevation, 16dp internal padding using MetricCard and EnvironmentCard components
- **Navigation**: 100dp header height with proper button spacing and primary color background

### Specific Implementation Examples
- **Dashboard FAB**: Extended "Start Study Session" button (96×56dp) with play icon and proper Material elevation
- **MetricCard Component**: 4dp elevation, 16dp padding, semantic color coding, and 48dp touch targets when interactive
- **Theme System**: Complete light/dark/focus themes with proper contrast ratios and Material color roles
- **Motion Design**: 250ms transitions with 0.95-0.98 scale transforms on press and cubic-bezier easing

This implementation ensures a cohesive, professional user experience that follows Material Design specifications while maintaining the app's study-focused functionality.

## Installation & Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npx expo start`
4. Scan the QR code with Expo Go app or run on simulator

## Technologies Used

- **React Native** - Cross-platform mobile development
- **Expo** - Development platform and build tools
- **Expo Router** - File-based navigation system
- **AsyncStorage** - Local data persistence
- **Expo Sensors** - Device sensor integration
- **Expo Camera** - Camera functionality for document scanning
- **React Native Chart Kit** - Data visualization
- **Expo Vector Icons** - Icon library (Ionicons)

## Project Structure

```
StudyFocus/
├── app/                    # Main app screens (Expo Router)
├── src/
│   ├── components/         # Reusable UI components
│   ├── context/           # React Context providers
│   ├── services/          # Business logic and API services
│   ├── storage/           # Data persistence utilities
│   ├── styles/            # Theme system and global styles
│   └── utils/             # Helper functions
└── assets/                # Images and static resources
```

## Features

### Core Functionality
- **Study Session Management**: Start, pause, resume, and track study sessions
- **Environment Monitoring**: Real-time analysis of study conditions
- **Subject Organization**: Color-coded subject tracking and management
- **Goal Setting**: Daily and weekly study goal configuration
- **Break Management**: Automated break suggestions and tracking

### Analytics & Insights
- **Progress Tracking**: Daily, weekly, and monthly study statistics
- **Productivity Metrics**: Focus scores and environment quality trends
- **Subject Performance**: Detailed breakdown by study subject
- **Optimal Study Times**: AI-recommended study periods based on historical data

### Additional Features
- **Document Scanner**: Scan and organize study materials
- **Theme Support**: Multiple theme options for different preferences
- **Data Export**: Export study data for external analysis
- **Offline Support**: Full functionality without internet connection

## License

This project is developed for educational purposes as part of a mobile application development course.