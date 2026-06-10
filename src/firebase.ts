/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';

export interface FirebaseInstance {
  db: Database;
}

// Cast import.meta to any to resolve TS environment typings safely of Vite
const metaEnv = (import.meta as any).env || {};

// Check if critical Firebase env config is present
const hasConfig = 
  metaEnv.VITE_FIREBASE_API_KEY &&
  metaEnv.VITE_FIREBASE_DATABASE_URL &&
  metaEnv.VITE_FIREBASE_PROJECT_ID;

let firebaseApp = null;
let database: Database | null = null;

if (hasConfig) {
  try {
    const firebaseConfig = {
      apiKey: metaEnv.VITE_FIREBASE_API_KEY,
      authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN,
      databaseURL: metaEnv.VITE_FIREBASE_DATABASE_URL,
      projectId: metaEnv.VITE_FIREBASE_PROJECT_ID,
      storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: metaEnv.VITE_FIREBASE_APP_ID,
    };

    firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    database = getDatabase(firebaseApp, metaEnv.VITE_FIREBASE_DATABASE_URL);
    console.log('Firebase Realtime Database initialized successfully.');
  } catch (error) {
    console.error('Error initializing Firebase:', error);
  }
} else {
  console.warn(
    'Firebase environment variables missing. Planning Poker is running in local multi-tab broadcast mode.\n' +
    'To connect with your remote team, configure the VITE_FIREBASE_* variables in your .env file.'
  );
}

export const db: Database | null = database;
export const isFirebaseConfigured: boolean = !!database;
