# Otodoki2 Mobile

React Native mobile app for the otodoki2 music discovery platform.

## Features

- **User Authentication**: Login and registration with JWT token management
- **Music Discovery**: Swipe interface to discover and rate new music tracks
- **Personal Library**: View and manage liked and skipped tracks
- **Cross-Platform**: Runs on both iOS and Android devices

## Tech Stack

- React Native 0.73+
- TypeScript
- React Navigation 6
- AsyncStorage for persistent data
- react-native-deck-swiper for swipe functionality
- Native API integration with otodoki2 backend

## Prerequisites

- Node.js 18+
- React Native development environment
- iOS: Xcode and iOS Simulator
- Android: Android Studio and Android SDK

## Installation

1. Install dependencies:
```bash
npm install
```

2. For iOS development:
```bash
cd ios && pod install && cd ..
```

3. Start Metro bundler:
```bash
npm start
```

4. Run on iOS:
```bash
npm run ios
```

5. Run on Android:
```bash
npm run android
```

## Configuration

The app connects to the otodoki2 backend API. Configure the API base URL in `src/services/api-client.ts`.

For development, the default API URL is `http://localhost:8000`.

## Screens

- **Login/Register**: User authentication
- **Home**: Welcome screen with featured tracks and navigation
- **Swipe**: Main discovery interface with card-based track browsing
- **Library**: Personal collection of liked and skipped tracks

## API Integration

The mobile app shares the same backend API as the web version:

- Authentication endpoints (`/api/v1/auth/*`)
- Track suggestions (`/api/v1/tracks/suggestions`)
- User evaluations (`/api/v1/evaluations`)
- Playback history (`/api/v1/history/played`)

## Development

- `npm run lint`: Run ESLint
- `npm run test`: Run Jest tests
- `npm start`: Start Metro bundler