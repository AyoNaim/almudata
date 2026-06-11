import { Capacitor } from '@capacitor/core';
import { NativeBiometric, BiometryType } from 'capacitor-native-biometric';

const STORAGE_KEY = 'co.aigsolution.app.biometric_key';

export const BiometricService = {
  /**
   * Check if biometrics are available and set up on this device
   */
  async isAvailable(): Promise<boolean> {
    if (Capacitor.getPlatform() === 'web') {
      console.warn("🖥️ Web environment: Biometrics safely disabled for browser testing.");
      return false; 
    }

    try {
      const result = await NativeBiometric.isAvailable();
      return !!result.isAvailable;
    } catch (error) {
      console.error('Biometrics not available:', error);
      return false;
    }
  },

  /**
   * ENROLL: Save the user's secret token securely in the device OS vault
   */
  async enroll(secretToken: string): Promise<boolean> {
    try {
      await NativeBiometric.setCredentials({
        username: 'user_session',
        password: secretToken,
        server: STORAGE_KEY,
      });
      return true;
    } catch (error) {
      console.error('Failed to save secure credentials:', error);
      return false;
    }
  },

  /**
   * LOGIN: Trigger native UI prompt to release the stored token
   */
  async authenticateAndGetToken(
    reason: string = 'Sign in to your account'
  ): Promise<string | null> {
    try {
      // 1. Verify identity via OS native prompt
      await NativeBiometric.verifyIdentity({
        reason,
        title: 'Biometric Login',
        subtitle: 'Quick Access',
        description: 'Scan your fingerprint or face to unlock your account',
      });

      // 2. If verification passes, retrieve the securely stored credentials
      const credentials = await NativeBiometric.getCredentials({
        server: STORAGE_KEY,
      });

      return credentials.password; // This returns your saved secret token
    } catch (error) {
      console.error('Biometric verification failed/canceled:', error);
      return null;
    }
  },

  /**
   * DISABLE: Delete credentials if the user logs out or disables the feature
   */
  async clearCredentials(): Promise<void> {
    try {
      await NativeBiometric.deleteCredentials({
        server: STORAGE_KEY,
      });
    } catch (error) {
      console.error('Failed to clear credentials:', error);
    }
  }
};