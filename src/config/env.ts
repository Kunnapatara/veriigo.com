/**
 * VERIIGO - Application Configuration & Environment Variable Handler
 * Safely parses process.env and import.meta.env with fallback defaults
 */

import firebaseConfig from '../../firebase-applet-config.json';

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
    firestoreDatabaseId: string;
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
    projectId: firebaseConfig.projectId,
    apiKey: firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain,
    databaseURL: `https://${firebaseConfig.firestoreDatabaseId}.firebaseio.com`,
    storageBucket: firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: firebaseConfig.appId,
    firestoreDatabaseId: firebaseConfig.firestoreDatabaseId,
  },
  apiPrefix: '/api',
  maxUploadSizeBytes: 10 * 1024 * 1024, // 10MB
};
