import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.almudatasub.app",
  appName: "Almudatasub",
  webDir: "out",
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#ffffff",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true, // This forces it to cover status bars
      splashImmersive: true,
    },
  },
};

export default config;
