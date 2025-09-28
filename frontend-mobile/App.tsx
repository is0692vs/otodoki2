import React from 'react';
import {StatusBar} from 'react-native';
import {AuthProvider} from './src/contexts';
import {AppNavigator} from './src/navigation';

export default function App() {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </>
  );
}