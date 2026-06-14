import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.fix.almudatasub",
  appName: "Almudatasub",
  webDir: "out",
  server: {
      androidScheme: 'https'
    },
  plugins: {
    CapacitorPasskey: {
      origin: 'https://almudatasub.com.ng',
      autoShim: true,
      domains: ['almudatasub.com.ng']
    },
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#ffffff",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
