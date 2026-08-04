/**
 * VERIIGO - Application Configuration & Environment Variable Handler
 * Safely parses process.env and import.meta.env with fallback defaults
 */

export interface AppConfig {
  env: 'development' | 'production' | 'test';
  port: number;
  isDev: boolean;
  isProd: boolean;
  geminiApiKey: string;
  firebase: {
    projectId: string;
    apiKey: string;
    authDomain: string;
    databaseURL: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  apiPrefix: string;
  maxUploadSizeBytes: number;
}

const getEnvVar = (key: string, defaultValue: string = ''): string => {
  // Check process.env (Node.js/Server-side)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  // Check import.meta.env (Vite/Client-side)
  const metaEnv = (import.meta as Record<string, any>).env;
  if (typeof metaEnv !== 'undefined' && metaEnv) {
    const viteKey = key.startsWith('VITE_') ? key : `VITE_${key}`;
    if (metaEnv[viteKey]) {
      return metaEnv[viteKey] as string;
    }
    if (metaEnv[key]) {
      return metaEnv[key] as string;
    }
  }
  return defaultValue;
};

export const config: AppConfig = {
  env: (getEnvVar('NODE_ENV', 'development') as 'development' | 'production' | 'test'),
  port: parseInt(getEnvVar('PORT', '3000'), 10),
  isDev: getEnvVar('NODE_ENV', 'development') !== 'production',
  isProd: getEnvVar('NODE_ENV', 'development') === 'production',
  geminiApiKey: getEnvVar('GEMINI_API_KEY', ''),
  firebase: {
    projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID', 'ai-studio-veriigogovernmen-a182c5f8-d603-44c1-999c-8c12c86084b7'),
    apiKey: getEnvVar('VITE_FIREBASE_API_KEY', ''),
    authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN', ''),
    databaseURL: getEnvVar('VITE_FIREBASE_DATABASE_URL', ''),
    storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET', ''),
    messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID', ''),
    appId: getEnvVar('VITE_FIREBASE_APP_ID', ''),
  },
  apiPrefix: '/api',
  maxUploadSizeBytes: 10 * 1024 * 1024, // 10MB
};
