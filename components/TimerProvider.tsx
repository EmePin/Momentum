import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioPlayer } from 'expo-audio';

interface TimerContextType {
  currentTimer: CustomTimer | null;
  setCurrentTimer: (timer: CustomTimer | null) => void;
  timerState: TimerState;
  setTimerState: React.Dispatch<React.SetStateAction<TimerState>>;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  playSound: (soundType: 'pip' | 'pipi' | 'complete') => void;
  nextCycle: () => void;
}

export interface TimerSequence {
  duration: number;
  isBreak: boolean;
  label?: string;
}

export interface CustomTimer {
  id: string;
  name: string;
  workDuration: number;
  breakDuration: number;
  repetitions: number;
  color: string;
  emoji: string;
  longBreakDuration?: number;
  longBreakInterval?: number;
  sequence?: TimerSequence[];
  type?: 'normal' | 'sequence';
}

export interface TimerState {
  isRunning: boolean;
  timeLeft: number;
  isBreak: boolean;
  currentCycle: number;
  totalCycles: number;
}

export interface AppSettings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  dailyReminders: boolean;
  reminderTime: string;
  theme: 'light' | 'dark' | 'auto';
}

const defaultSettings: AppSettings = {
  soundEnabled: true,
  vibrationEnabled: true,
  workDuration: 25 * 60,
  breakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  longBreakInterval: 4,
  dailyReminders: false,
  reminderTime: '09:00',
  theme: 'auto',
};

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [currentTimer, setCurrentTimer] = useState<CustomTimer | null>(null);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    timeLeft: 25 * 60,
    isBreak: false,
    currentCycle: 1,
    totalCycles: 4,
  });

  // Player refs para cada sonido
  const pipPlayer = useAudioPlayer({ uri: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg' });
  const pipiPlayer = useAudioPlayer({ uri: 'https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg' });
  const completePlayer = useAudioPlayer({ uri: 'https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg' });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('appSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsedSettings });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      await AsyncStorage.setItem('appSettings', JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const playSound = (soundType: 'pip' | 'pipi' | 'complete') => {
    if (!settings.soundEnabled) return;

    switch (soundType) {
      case 'pip':
        pipPlayer.seekTo(0);
        pipPlayer.play();
        break;
      case 'pipi':
        pipiPlayer.seekTo(0);
        pipiPlayer.play();
        break;
      case 'complete':
        completePlayer.seekTo(0);
        completePlayer.play();
        break;
    }
  };

  const nextCycle = () => {
    setTimerState((prev) => {
      const isBreak = prev.currentCycle % (settings.longBreakInterval + 1) === 0;
      const newCycle = isBreak ? prev.currentCycle + 1 : prev.currentCycle;
      const newTotalCycles = isBreak ? prev.totalCycles + 1 : prev.totalCycles;
      const newTimeLeft = isBreak ? settings.longBreakDuration : settings.workDuration;

      return {
        ...prev,
        isBreak,
        currentCycle: newCycle,
        totalCycles: newTotalCycles,
        timeLeft: newTimeLeft,
      };
    });
  };

  return (
    <TimerContext.Provider
      value={{
        currentTimer,
        setCurrentTimer,
        timerState,
        setTimerState,
        playSound,
        settings,
        updateSettings,
        nextCycle,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};
