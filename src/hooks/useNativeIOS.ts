// src/hooks/useNativeIOS.ts

'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'tikozap-native-platform';
const COOKIE_NAME = 'tikozap-native-platform';

export function useNativeIOS() {
  const [isNativeIOS, setIsNativeIOS] = useState(true);

  useEffect(() => {
    const check = () => {
      const storedNative =
        localStorage.getItem(STORAGE_KEY) === 'ios';

      const cookieNative = document.cookie
        .split('; ')
        .some((cookie) => cookie === `${COOKIE_NAME}=ios`);

      setIsNativeIOS(storedNative || cookieNative);
    };

    window.addEventListener(
      'tikozap-native-platform-changed',
      check
    );

    check();

    return () => {
      window.removeEventListener(
        'tikozap-native-platform-changed',
        check
      );
    };
  }, []);

  return isNativeIOS;
}