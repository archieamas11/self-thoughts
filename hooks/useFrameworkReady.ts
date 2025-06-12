import { useEffect } from 'react';
import { Platform } from 'react-native';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export function useFrameworkReady() {
  useEffect(() => {
    try {
      // Only call frameworkReady on web platform where window exists
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.frameworkReady) {
        // Use setTimeout to ensure the call happens after the component has mounted
        setTimeout(() => {
          window.frameworkReady?.();
        }, 0);
      }
      // For native platforms (iOS/Android), no action needed
      // The app should initialize normally through React Native
    } catch (error) {
      console.warn('useFrameworkReady error:', error);
      // Don't throw the error to prevent app crashes
    }
  }, []); // Empty dependency array ensures this runs only once on mount
}
