import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface VoiceOrbProps {
  agentSpeaking: boolean;
  isMuted: boolean;
  micVolume: number;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({
  agentSpeaking,
  isMuted,
  micVolume,
}) => {
  const [pulseAnim] = useState(() => new Animated.Value(1));
  const [glowAnim] = useState(() => new Animated.Value(0));

  // Breathing loop animation when idle
  useEffect(() => {
    const breathing = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    breathing.start();
    return () => breathing.stop();
  }, [pulseAnim]);

  // Dynamic glow pulse when agent speaks
  useEffect(() => {
    if (agentSpeaking) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      glowAnim.setValue(0);
    }
  }, [agentSpeaking, glowAnim]);

  // Scale based on mic volume when user speaks
  const userVolumeScale = !agentSpeaking && !isMuted ? 1 + Math.min(0.4, micVolume * 0.8) : 1;

  const getOrbColor = () => {
    if (agentSpeaking) return '#10b981'; // Emerald
    if (isMuted) return '#e11d48'; // Rose
    if (micVolume > 0.05) return '#0284c7'; // Sky
    return '#334155'; // Slate
  };

  const orbColor = getOrbColor();

  return (
    <View style={styles.container}>
      {/* Outer ambient glow ring */}
      <Animated.View
        style={[
          styles.ambientRing,
          {
            borderColor: orbColor,
            opacity: agentSpeaking ? glowAnim : micVolume > 0.05 ? 0.4 : 0.15,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />

      {/* Secondary ripple ring */}
      <Animated.View
        style={[
          styles.secondaryRing,
          {
            borderColor: orbColor,
            opacity: agentSpeaking ? 0.3 : 0.1,
            transform: [{ scale: userVolumeScale }],
          },
        ]}
      />

      {/* Main Core Orb */}
      <Animated.View
        style={[
          styles.coreOrb,
          {
            backgroundColor: orbColor,
            shadowColor: orbColor,
            transform: [{ scale: agentSpeaking ? pulseAnim : userVolumeScale }],
          },
        ]}
      >
        <Ionicons
          name={agentSpeaking ? 'volume-medium' : isMuted ? 'mic-off' : 'mic'}
          size={48}
          color={agentSpeaking ? '#020617' : '#f8fafc'}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ambientRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
  },
  secondaryRing: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1.5,
  },
  coreOrb: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
});
