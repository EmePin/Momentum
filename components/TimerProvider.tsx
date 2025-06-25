import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

interface TimerContextType {
  currentTimer: CustomTimer | null;
  setCurrentTimer: (timer: CustomTimer | null) => void;
  timerState: TimerState;
  setTimerState: React.Dispatch<React.SetStateAction<TimerState>>;
  playSound: (soundType: 'pip' | 'pipi' | 'complete') => Promise<void>;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
}

export interface CustomTimer {
  id: string;
  name: string;
  workDuration: number;
  breakDuration: number;
  repetitions: number;
  color: string;
  emoji: string;
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

  const playSound = async (soundType: 'pip' | 'pipi' | 'complete') => {
    if (!settings.soundEnabled) return;
    
    try {
      let soundUri = '';
      
      switch (soundType) {
        case 'pip':
          soundUri = 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg';
          break;
        case 'pipi':
          soundUri = 'https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg';
          break;
        case 'complete':
          soundUri = 'https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg';
          break;
      }

      const { sound } = await Audio.Sound.createAsync({ uri: soundUri });
      await sound.playAsync();
      
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.log('Error playing sound:', error);
    }
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