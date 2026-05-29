/**
 * Midtrans Snap helper.
 *
 * Snap script is loaded in src/app/layout.tsx
 * After loading, `window.snap` becomes available.
 */

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        callbacks?: {
          onSuccess?: (result: any) => void;
          onPending?: (result: any) => void;
          onError?: (result: any) => void;
          onClose?: () => void;
        }
      ) => void;
      hide: () => void;
    };
  }
}

export interface SnapPayCallbacks {
  onSuccess?: (result: any) => void;
  onPending?: (result: any) => void;
  onError?: (result: any) => void;
  onClose?: () => void;
}

/**
 * Wait for Midtrans Snap script to load.
 */
const waitForSnap = (timeoutMs = 8000): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Snap is only available in browser'));
      return;
    }

    if (window.snap) {
      resolve();
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      if (window.snap) {
        clearInterval(interval);
        resolve();
        return;
      }
      if (Date.now() - startTime > timeoutMs) {
        clearInterval(interval);
        reject(new Error('Midtrans Snap script failed to load'));
      }
    }, 100);
  });
};

/**
 * Open Midtrans Snap payment popup with the given token.
 *
 * @param token - Snap token from backend (sometimes returned as `tripay_reference`)
 * @param callbacks - Event handlers for payment outcomes
 */
export const openSnapPayment = async (
  token: string,
  callbacks?: SnapPayCallbacks
): Promise<void> => {
  if (!token) {
    throw new Error('Snap token is required');
  }

  await waitForSnap();

  if (!window.snap) {
    throw new Error('Midtrans Snap not loaded');
  }

  window.snap.pay(token, callbacks);
};

/**
 * Check if Snap is available.
 */
export const isSnapAvailable = (): boolean => {
  return typeof window !== 'undefined' && !!window.snap;
};
