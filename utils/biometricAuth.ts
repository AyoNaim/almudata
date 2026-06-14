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
  // 1. Guard clause: Skip execution if we are running in a standard web browser dev environment
  if (typeof window !== 'undefined' && !/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
    console.warn("NativeBiometric skipped: Storing/deleting device credentials is not supported on standard web browsers.");
    return;
  }

  // NOTE: If you are using standard Capacitor, you can replace the check above with this cleaner line:
  // if (!Capacitor.isNativePlatform()) return;

  try {
    await NativeBiometric.deleteCredentials({
      server: "almudatasub.com.ng", // Ensure this matches your setup identifier
    });
  } catch (error: any) {
    // 2. Double-safety catch: Absorb the error if the plugin still complains about missing web implementation
    if (error?.message?.includes("not implemented") || error?.toString().includes("not implemented")) {
      console.warn("Biometric deletion skipped: Method not implemented on this platform wrapper.");
    } else {
      // Re-throw or handle real native errors (e.g., hardware errors)
      console.error("Actual biometric clear error:", error);
    }
  }
}
};