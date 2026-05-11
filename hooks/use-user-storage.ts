import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback } from 'react';

export type UserData = {
  name: string;
  phone: string;
  notifications: boolean;
};

const USER_DATA_KEY = 'user_data';
const DEFAULT_USER_DATA: UserData = {
  name: '',
  phone: '',
  notifications: true,
};

export function useUserStorage() {
  const loadUserData = useCallback(async (): Promise<UserData> => {
    try {
      const stored = await AsyncStorage.getItem(USER_DATA_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_USER_DATA;
    } catch (error) {
      console.error('Failed to load user data:', error);
      return DEFAULT_USER_DATA;
    }
  }, []);

  const saveUserData = useCallback(async (data: Partial<UserData>): Promise<void> => {
    try {
      const current = await loadUserData();
      const updated = { ...current, ...data };
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save user data:', error);
    }
  }, [loadUserData]);

  const clearUserData = useCallback(async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(USER_DATA_KEY);
    } catch (error) {
      console.error('Failed to clear user data:', error);
    }
  }, []);

  return { loadUserData, saveUserData, clearUserData };
}
