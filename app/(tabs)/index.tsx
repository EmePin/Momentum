import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Pause, RotateCcw, Settings as SettingsIcon } from 'lucide-react-native';
import { useTimer } from '@/components/TimerProvider';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const { 
    currentTimer, 
    timerState, 
    setTimerState, 
    playSound, 
    settings 
  } = useTimer();

  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const workDuration = currentTimer?.workDuration || settings.workDuration;
  const breakDuration = currentTimer?.breakDuration || settings.breakDuration;
  const longBreakDuration = settings.longBreakDuration;
  const totalCycles = currentTimer?.repetitions || settings.longBreakInterval;

  useEffect(() => {
    if (timerState.isRunning && timerState.timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimerState(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1,
        }));
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState.isRunning, timerState.timeLeft]);

  useEffect(() => {
    if (timerState.timeLeft === 0 && timerState.isRunning) {
      handleTimerComplete();
    }
  }, [timerState.timeLeft, timerState.isRunning]);

  useEffect(() => {
    const progress = timerState.isBreak 
      ? 1 - (timerState.timeLeft / breakDuration)
      : 1 - (timerState.timeLeft / workDuration);
    
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 100,
      useNativeDriver: false,
    }).start();
  }, [timerState.timeLeft, timerState.isBreak]);

  const triggerHaptic = () => {
    if (Platform.OS !== 'web' && settings.vibrationEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleTimerComplete = async () => {
    triggerHaptic();
    
    if (!timerState.isBreak) {
      // Work session completed, start break
      await playSound('pipi');
      const isLongBreak = timerState.currentCycle % settings.longBreakInterval === 0;
      const nextBreakDuration = isLongBreak ? longBreakDuration : breakDuration;
      
      setTimerState(prev => ({
        ...prev,
        isBreak: true,
        timeLeft: nextBreakDuration,
      }));
    } else {
      // Break completed
      if (timerState.currentCycle >= totalCycles) {
        // All cycles completed
        await playSound('complete');
        handleReset();
      } else {
        // Start next work session
        await playSound('pip');
        setTimerState(prev => ({
          ...prev,
          isBreak: false,
          timeLeft: workDuration,
          currentCycle: prev.currentCycle + 1,
        }));
      }
    }
  };

  const handlePlayPause = async () => {
    triggerHaptic();
    
    if (!timerState.isRunning && timerState.timeLeft === (timerState.isBreak ? breakDuration : workDuration)) {
      // Starting fresh timer
      await playSound(timerState.isBreak ? 'pipi' : 'pip');
    }

    setTimerState(prev => ({
      ...prev,
      isRunning: !prev.isRunning,
    }));

    // Button animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleReset = () => {
    triggerHaptic();
    setTimerState({
      isRunning: false,
      timeLeft: workDuration,
      isBreak: false,
      currentCycle: 1,
      totalCycles: totalCycles,
    });
    
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getCurrentPhaseColor = () => {
    return timerState.isBreak ? '#4ECDC4' : '#FF6B35';
  };

  const getCurrentGradient = () => {
    return timerState.isBreak 
      ? ['#4ECDC4', '#A8E6CF'] 
      : ['#FF6B35', '#FFA726'];
  };

  return (
    <LinearGradient
      colors={['#1E293B', '#334155', '#475569']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>
          {currentTimer ? currentTimer.name : 'Timer'}
        </Text>
        <Text style={styles.subtitle}>
          {timerState.isBreak ? `${currentTimer?.emoji || '🌸'} Break Time` : `${currentTimer?.emoji || '🍅'} Focus Time`}
        </Text>
        {currentTimer && (
          <View style={styles.timerInfo}>
            <Text style={styles.timerInfoText}>
              {Math.floor(workDuration / 60)}m work • {Math.floor(breakDuration / 60)}m break
            </Text>
          </View>
        )}
      </View>

      <View style={styles.timerContainer}>
        <View style={[styles.progressRing, { borderColor: getCurrentPhaseColor() + '20' }]}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                backgroundColor: getCurrentPhaseColor(),
                transform: [
                  {
                    rotate: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}
          />
          <View style={styles.timerInner}>
            <Text style={[styles.timerText, { color: getCurrentPhaseColor() }]}>
              {formatTime(timerState.timeLeft)}
            </Text>
            <Text style={styles.phaseText}>
              Cycle {timerState.currentCycle}/{totalCycles}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleReset}>
          <RotateCcw size={24} color="#94A3B8" />
        </TouchableOpacity>

        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity 
            style={[styles.playButton, { shadowColor: getCurrentPhaseColor() }]}
            onPress={handlePlayPause}
          >
            <LinearGradient
              colors={getCurrentGradient()}
              style={styles.playButtonGradient}
            >
              {timerState.isRunning ? (
                <Pause size={32} color="#FFFFFF" />
              ) : (
                <Play size={32} color="#FFFFFF" />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity style={styles.secondaryButton}>
          <SettingsIcon size={24} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{Math.floor(workDuration / 60)}m</Text>
          <Text style={styles.statLabel}>Work</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{Math.floor(breakDuration / 60)}m</Text>
          <Text style={styles.statLabel}>Break</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalCycles}</Text>
          <Text style={styles.statLabel}>Cycles</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#CBD5E1',
  },
  timerInfo: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  timerInfoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#CBD5E1',
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  progressRing: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  progressBar: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: width * 0.4,
    opacity: 0.2,
  },
  timerInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 48,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  phaseText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#94A3B8',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 40,
    marginBottom: 40,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  playButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
  },
});