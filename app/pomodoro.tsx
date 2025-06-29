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
import { Play, Pause, RotateCcw, ArrowLeft,Settings as SettingsIcon, Edit2 } from 'lucide-react-native';
import { useTimer } from '@/components/TimerProvider';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');
const isLargeScreen = width > 900;

export default function PomodoroScreen() {
  const router = useRouter();
  const { 
    currentTimer, 
    timerState, 
    setTimerState, 
    playSound, 
    stopAllSounds, // NUEVO
    settings
  } = useTimer();

  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const workDuration = currentTimer?.workDuration || settings.workDuration;
  const breakDuration = currentTimer?.breakDuration || settings.breakDuration;
  const longBreakDuration = currentTimer?.longBreakDuration||settings.longBreakDuration;
  const totalCycles = currentTimer?.repetitions || settings.longBreakInterval;
  const longBreakInterval = currentTimer?.longBreakInterval ||settings.longBreakInterval;

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
      stopAllSounds(); // NUEVO: corta el audio al llegar a 0
      handleTimerComplete();
    }
  }, [timerState.timeLeft, timerState.isRunning]);

  useEffect(() => {
    const currentDuration = timerState.isBreak ? 
      (isCurrentLongBreak() ? longBreakDuration : breakDuration) : workDuration;
    const progress = 1 - (timerState.timeLeft / currentDuration);
    
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

  const isCurrentLongBreak = () => {
    return timerState.isBreak && (timerState.currentCycle % longBreakInterval  === 0);
  };

  const handleTimerComplete = async () => {
    triggerHaptic();
    
    if (!timerState.isBreak) {
      // Trabajo completado, iniciar descanso
      await playSound('pipi');
      const isLongBreak = timerState.currentCycle % longBreakInterval  === 0;
      const nextBreakDuration = isLongBreak ? longBreakDuration : breakDuration;
      
      setTimerState(prev => ({
        ...prev,
        isBreak: true,
        timeLeft: nextBreakDuration,
        isRunning: true,
      }));
    } else {
      // Descanso completado
      if (timerState.currentCycle >= totalCycles) {
        // Todos los ciclos completados
        await playSound('complete');
        handleReset();
      } else {
        // Iniciar siguiente sesión de trabajo
        await playSound('pip');
        setTimerState(prev => ({
          ...prev,
          isBreak: false,
          timeLeft: workDuration,
          currentCycle: prev.currentCycle + 1,
          isRunning: true,
        }));
      }
    }
  };

  const handlePlayPause = async () => {
    triggerHaptic();
    
    const currentDuration = timerState.isBreak ? 
      (isCurrentLongBreak() ? longBreakDuration : breakDuration) : workDuration;
    
    if (!timerState.isRunning && timerState.timeLeft === currentDuration) {
      await playSound(timerState.isBreak ? 'pipi' : 'pip');
    }

    setTimerState(prev => ({
      ...prev,
      isRunning: !prev.isRunning,
    }));

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
    if (timerState.isBreak) {
      return isCurrentLongBreak() ? '#9333EA' : '#4ECDC4';
    }
    return currentTimer?.color || '#FF6B35';
  };

  const getCurrentGradient = () => {
    const color = getCurrentPhaseColor();
    return [color, color + 'CC'];
  };

  const getCurrentPhaseLabel = () => {
    if (timerState.isBreak) {
      return isCurrentLongBreak() ? 'Long Break' : 'Break';
    }
    return 'Focus Time';
  };

  const isWeb = Platform.OS === 'web';

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: isLargeScreen ? 'flex-start' : 'space-between',
      paddingHorizontal: 20,
      paddingTop: isLargeScreen ? height * 0.07 : 60,
      paddingBottom: isLargeScreen ? height * 0.04 : 120,
      backgroundColor: 'transparent',
    },
    backButton: {
      position: 'absolute',
      top: isLargeScreen ? height * 0.07 : 60,
      left: 20,
      zIndex: 10,
      width: isLargeScreen ? 44 : 40,
      height: isLargeScreen ? 44 : 40,
      borderRadius: isLargeScreen ? 22 : 20,
      backgroundColor: isLargeScreen ? 'rgba(255, 255, 255, 0.13)' : 'rgba(255, 255, 255, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      elevation: isLargeScreen ? 2 : 0,
      shadowColor: isLargeScreen ? '#000' : undefined,
      shadowOpacity: isLargeScreen ? 0.1 : undefined,
      shadowRadius: isLargeScreen ? 4 : undefined,
      shadowOffset: isLargeScreen ? { width: 0, height: 2 } : undefined,
    },
    header: {
      alignItems: 'center',
      marginBottom: isLargeScreen ? 24 : 20,
      marginTop: isLargeScreen ? height * 0.08 : 40,
      width: '100%',
      ...(isLargeScreen && { gap: 8 }),
    },
    title: {
      fontSize: 32,
      fontFamily: 'Inter-Bold',
      color: '#FFFFFF',
      marginBottom: isLargeScreen ? 4 : 8,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 18,
      fontFamily: 'Inter-Regular',
      color: '#CBD5E1',
      textAlign: 'center',
    },
    timerInfo: {
      marginTop: isLargeScreen ? 10 : 8,
      paddingHorizontal: isLargeScreen ? 18 : 16,
      paddingVertical: isLargeScreen ? 8 : 6,
      backgroundColor: isLargeScreen ? 'rgba(255, 255, 255, 0.13)' : 'rgba(255, 255, 255, 0.1)',
      borderRadius: isLargeScreen ? 14 : 12,
      alignSelf: 'center',
    },
    timerInfoText: {
      fontSize: isLargeScreen ? 15 : 14,
      fontFamily: 'Inter-Regular',
      color: '#CBD5E1',
      textAlign: 'center',
    },
    timerContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      width: '100%',
      marginVertical: isLargeScreen ? 10 : 0,
    },
    progressRing: {
      width: isLargeScreen ? width * 0.75 : width * 0.8,
      height: isLargeScreen ? width * 0.75 : width * 0.8,
      borderRadius: isLargeScreen ? (width * 0.75) / 2 : width * 0.4,
      backgroundColor: isLargeScreen ? 'rgba(255, 255, 255, 0.09)' : 'rgba(255, 255, 255, 0.1)',
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      marginBottom: isLargeScreen ? 10 : 0,
    },
    progressBar: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      borderRadius: isLargeScreen ? (width * 0.75) / 2 : width * 0.4,
      opacity: 0.2,
    },
    timerInner: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: isLargeScreen ? 10 : 0,
      width: '100%',
    },
    timerText: {
      fontSize: 48,
      fontFamily: 'Inter-Bold',
      marginBottom: isLargeScreen ? 6 : 8,
      textAlign: 'center',
    },
    phaseText: {
      fontSize: isLargeScreen ? 17 : 16,
      fontFamily: 'Inter-SemiBold',
      color: '#94A3B8',
      textAlign: 'center',
    },
    controls: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: isLargeScreen ? '90%' : '100%',
      alignSelf: 'center',
      paddingHorizontal: isLargeScreen ? 20 : 40,
      marginBottom: isLargeScreen ? 30 : 40,
      marginTop: isLargeScreen ? 10 : 0,
      ...(isLargeScreen && { gap: 24 }),
    },
    playButton: {
      marginTop: 0,
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
      alignItems: 'center',
      justifyContent: 'center',
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
      backgroundColor: isLargeScreen ? 'rgba(255, 255, 255, 0.13)' : 'rgba(255, 255, 255, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      elevation: isLargeScreen ? 2 : 0,
    },
    stats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
      backgroundColor: isLargeScreen ? 'rgba(255, 255, 255, 0.09)' : 'rgba(255, 255, 255, 0.1)',
      borderRadius: isLargeScreen ? 18 : 16,
      paddingVertical: isLargeScreen ? 18 : 20,
      paddingHorizontal: isLargeScreen ? 10 : 20,
      marginTop: isLargeScreen ? 10 : 0,
      marginBottom: 0,
      ...(isLargeScreen && { gap: 10 }),
    },
    statItem: {
      alignItems: 'center',
      minWidth: isLargeScreen ? 70 : undefined,
      ...(isLargeScreen && { gap: 2 }),
    },
    statValue: {
      fontSize: 24,
      fontFamily: 'Inter-Bold',
      color: '#FFFFFF',
      marginBottom: isLargeScreen ? 2 : 4,
      textAlign: 'center',
    },
    statLabel: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: '#94A3B8',
      textAlign: 'center',
    },
  });

  if (!currentTimer) {
    return (
      <LinearGradient
        colors={['#1E293B', '#334155', '#475569']}
        style={styles.container}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>No Timer Selected</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#1E293B', '#334155', '#475569']}
      style={styles.container}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <ArrowLeft size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Pomodoro Timer</Text>
        <Text style={styles.subtitle}>
          {currentTimer.emoji} {getCurrentPhaseLabel()}
        </Text>
        <View style={styles.timerInfo}>
          <Text style={styles.timerInfoText}>{currentTimer.name}</Text>
        </View>
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

        <TouchableOpacity style={styles.secondaryButton}onPress={() => router.push('/(tabs)/timers')}>
          <Edit2 size={24} color="#94A3B8" />
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
          <Text style={styles.statValue}>{Math.floor(longBreakDuration / 60)}m</Text>
          <Text style={styles.statLabel}>Long Break</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: height * 0.07,
    paddingBottom: height * 0.04,
    backgroundColor: 'transparent',
  },
  backButton: {
    position: 'absolute',
    top: height * 0.07,
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.13)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: height * 0.08,
    width: '100%',
    gap: 8,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#CBD5E1',
    textAlign: 'center',
  },
  timerInfo: {
    marginTop: 10,
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.13)',
    borderRadius: 14,
    alignSelf: 'center',
  },
  timerInfoText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#CBD5E1',
    textAlign: 'center',
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    width: '100%',
    marginVertical: 10,
  },
  progressRing: {
    width: width * 0.75,
    height: width * 0.75,
    borderRadius: (width * 0.75) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 10,
  },
  progressBar: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: (width * 0.75) / 2,
    opacity: 0.2,
  },
  timerInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    width: '100%',
  },
  timerText: {
    fontSize: 48,
    fontFamily: 'Inter-Bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  phaseText: {
    fontSize: 17,
    fontFamily: 'Inter-SemiBold',
    color: '#94A3B8',
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '90%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
    marginTop: 10,
    gap: 24,
  },
  playButton: {
    marginTop: 0,
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
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: 'rgba(255, 255, 255, 0.13)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 10,
    marginTop: 10,
    marginBottom: 0,
    gap: 10,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 70,
    gap: 2,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 2,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
    textAlign: 'center',
  },
});
