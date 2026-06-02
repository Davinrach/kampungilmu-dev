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
const waitForSnap = (timeoutMs = 10000): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Snap is only available in browser'));
      return;
    }

    // Check if already loaded
    if (window.snap) {
      console.log('[Midtrans] Snap already available');
      resolve();
      return;
    }

    console.log('[Midtrans] Waiting for Snap script to load...');
    const startTime = Date.now();
    const interval = setInterval(() => {
      if (window.snap) {
        console.log('[Midtrans] Snap loaded after', Date.now() - startTime, 'ms');
        clearInterval(interval);
        resolve();
        return;
      }
      if (Date.now() - startTime > timeoutMs) {
        clearInterval(interval);
        console.error('[Midtrans] Snap script failed to load within', timeoutMs, 'ms');
        reject(new Error('Midtrans Snap script failed to load. Please refresh the page and try again.'));
      }
    }, 100);
  });
};

/**
 * Open Midtrans Snap payment popup with the given token.
 *
 * @param token - Snap token from backend
 * @param callbacks - Event handlers for payment outcomes
 */
export const openSnapPayment = async (
  token: string,
  callbacks?: SnapPayCallbacks
): Promise<void> => {
  console.log('[Midtrans] openSnapPayment called with token:', token ? token.substring(0, 20) + '...' : 'EMPTY');
  
  if (!token) {
    throw new Error('Snap token is required');
  }

  try {
    await waitForSnap();
  } catch (err) {
    console.error('[Midtrans] waitForSnap failed:', err);
    throw err;
  }

  if (!window.snap) {
    throw new Error('Midtrans Snap not loaded');
  }

  console.log('[Midtrans] Opening Snap popup...');
  
  window.snap.pay(token, {
    onSuccess: (result) => {
      console.log('[Midtrans] Payment success:', result);
      callbacks?.onSuccess?.(result);
    },
    onPending: (result) => {
      console.log('[Midtrans] Payment pending:', result);
      callbacks?.onPending?.(result);
    },
    onError: (result) => {
      console.error('[Midtrans] Payment error:', result);
      callbacks?.onError?.(result);
    },
    onClose: () => {
      console.log('[Midtrans] Popup closed by user');
      callbacks?.onClose?.();
    },
  });
};

/**
 * Check if Snap is available.
 */
export const isSnapAvailable = (): boolean => {
  const available = typeof window !== 'undefined' && !!window.snap;
  console.log('[Midtrans] isSnapAvailable:', available);
  return available;
};
