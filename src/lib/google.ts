/**
 * Google Identity Services (GIS) helper for Google Sign-In.
 *
 * Script is loaded in src/app/layout.tsx
 * Get Client ID from: https://console.cloud.google.com/apis/credentials
 * Add to .env.local: NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
 */

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (
            callback?: (notification: {
              isNotDisplayed: () => boolean;
              isSkippedMoment: () => boolean;
              getNotDisplayedReason: () => string;
              getSkippedReason: () => string;
            }) => void
          ) => void;
          renderButton: (
            element: HTMLElement,
            config: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: number | string;
            }
          ) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export const isGoogleConfigured = (): boolean => {
  return !!CLIENT_ID;
};

/**
 * Wait for Google Identity Services to load.
 */
const waitForGoogle = (timeoutMs = 8000): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Google sign-in only available in browser'));
      return;
    }
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    const startTime = Date.now();
    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(interval);
        resolve();
        return;
      }
      if (Date.now() - startTime > timeoutMs) {
        clearInterval(interval);
        reject(new Error('Google Identity Services failed to load'));
      }
    }, 100);
  });
};

/**
 * Trigger Google One-Tap sign in / sign in popup.
 * @param onCredential - Called with id_token when user signs in
 */
export const triggerGoogleSignIn = async (
  onCredential: (idToken: string) => void
): Promise<void> => {
  if (!CLIENT_ID) {
    throw new Error(
      'Google Client ID belum dikonfigurasi. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID di .env.local'
    );
  }

  await waitForGoogle();

  if (!window.google?.accounts?.id) {
    throw new Error('Google Identity Services not loaded');
  }

  // Initialize
  window.google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: (response) => {
      if (response.credential) {
        onCredential(response.credential);
      }
    },
    auto_select: false,
    cancel_on_tap_outside: true,
  });

  // Show one-tap prompt
  window.google.accounts.id.prompt((notification) => {
    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
      console.log(
        'Google Sign-In not displayed:',
        notification.getNotDisplayedReason() || notification.getSkippedReason()
      );
    }
  });
};

/**
 * Render Google's official Sign-In button into a DOM element.
 * @param container - HTML element to render the button inside
 * @param onCredential - Called with id_token when user signs in
 */
export const renderGoogleButton = async (
  container: HTMLElement,
  onCredential: (idToken: string) => void,
  options?: {
    text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
    width?: number;
    theme?: 'outline' | 'filled_blue';
  }
): Promise<void> => {
  if (!CLIENT_ID) {
    throw new Error('Google Client ID not configured');
  }

  await waitForGoogle();

  if (!window.google?.accounts?.id) {
    throw new Error('Google Identity Services not loaded');
  }

  window.google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: (response) => {
      if (response.credential) {
        onCredential(response.credential);
      }
    },
    auto_select: false,
  });

  window.google.accounts.id.renderButton(container, {
    type: 'standard',
    theme: options?.theme || 'outline',
    size: 'large',
    text: options?.text || 'continue_with',
    shape: 'rectangular',
    logo_alignment: 'left',
    width: options?.width,
  });
};
