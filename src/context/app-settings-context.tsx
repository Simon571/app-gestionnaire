
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AppSettings, defaultAppSettings } from '@/lib/app-settings';

interface AppSettingsContextType {
  settings: AppSettings;
  updateSetting: (key: keyof AppSettings, value: AppSettings[typeof key]) => void;
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export const AppSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultAppSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on initial mount
  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem('appSettings');
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        // Merge with default settings to ensure all keys are present
        setSettings({ ...defaultAppSettings, ...parsedSettings });
      }
    } catch (error) {
      console.error("Failed to load app settings from localStorage", error);
    }
    setIsLoaded(true);
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('appSettings', JSON.stringify(settings));
      } catch (error) {
        console.error("Failed to save app settings to localStorage", error);
      }
    }
  }, [settings, isLoaded]);

  const updateSetting = (key: keyof AppSettings, value: AppSettings[typeof key]) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [key]: value,
    }));
  };

  return (
    <AppSettingsContext.Provider value={{ settings, updateSetting }}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = (): AppSettingsContextType => {
  const context = useContext(AppSettingsContext);
  if (context === undefined) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
};
