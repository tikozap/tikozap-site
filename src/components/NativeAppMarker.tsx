'use client';

import { useEffect } from 'react';

const STORAGE_KEY = 'tikozap-native-platform';

export default function NativeAppMarker() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const native = url.searchParams.get('native');

if (native === 'ios') {
  localStorage.setItem(STORAGE_KEY, 'ios');
  document.cookie =
  'tikozap-native-platform=ios; Path=/; Max-Age=31536000; SameSite=Lax; Secure';

  window.dispatchEvent(
    new Event('tikozap-native-platform-changed')
  );

  url.searchParams.delete('native');
  window.history.replaceState({}, '', url.toString());
}
  }, []);

  return null;
}
