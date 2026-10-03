import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function IndexScreen() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [user, isLoading, router]);

  // Fallback safety timeout so app is never trapped on the loading spinner
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading && !user) {
        router.replace('/(auth)/login');
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [isLoading, user, router]);

  return (
    <View style={styles.container}>
      <View style={styles.logoBadge}>
        <Ionicons name="headset" size={44} color="#020617" />
      </View>
      <Text style={styles.title}>Language Buddy</Text>
      <Text style={styles.subtitle}>Audio-First AI Spoken Learning</Text>
      <ActivityIndicator size="large" color="#10b981" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 6,
  },
  spinner: {
    marginTop: 32,
  },
});
