'use client';

import { useEffect } from 'react';
import { registerPlugin } from '@capacitor/core';

type SafeAreaInsets = {
  top: number;
  bottom: number;
};

interface TikoZapNavigationPlugin {
  getSafeAreaInsets(): Promise<SafeAreaInsets>;
}

const TikoZapNavigation =
  registerPlugin<TikoZapNavigationPlugin>('TikoZapNavigation');

export function useNativeSafeArea() {
  useEffect(() => {
    const applySafeArea = async () => {
      try {
        const { top, bottom } =
          await TikoZapNavigation.getSafeAreaInsets();

        document.documentElement.style.setProperty(
          '--tz-native-safe-top',
          `${top}px`
        );

        document.documentElement.style.setProperty(
          '--tz-native-safe-bottom',
          `${bottom}px`
        );
      } catch (error) {
        console.error('[TikoZap native safe area]', error);
      }
    };

    void applySafeArea();
  }, []);
}
