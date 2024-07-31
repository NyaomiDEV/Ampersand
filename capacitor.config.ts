import type { CapacitorConfig } from '@capacitor/cli';
import "@capacitor/splash-screen";

const config: CapacitorConfig = {
  appId: 'com.ampersand.test',
  appName: 'Ampersand',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: "#171717"
    }
  }
};

export default config;
