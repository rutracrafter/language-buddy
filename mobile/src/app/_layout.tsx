import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/AuthContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#0f172a' },
            headerTintColor: '#ffffff',
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: '#020617' },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="session/live"
            options={{
              headerShown: false,
              presentation: 'fullScreenModal',
              gestureEnabled: false,
            }}
          />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
