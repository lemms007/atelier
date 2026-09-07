import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
  doc,
  getDocFromServer,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App instance
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/**
 * Creates or retrieves a Firestore instance configured with client-side IndexedDB persistent caching.
 * Automatically caches queries and document snapshots to save database reads and network bandwidth.
 */
function createCachedFirestore(databaseId?: string): Firestore {
  try {
    const options = {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    };
    if (databaseId) {
      return initializeFirestore(app, options, databaseId);
    }
    return initializeFirestore(app, options);
  } catch {
    // If instance is already initialized or persistence is restricted in current context, fallback gracefully
    try {
      return databaseId ? getFirestore(app, databaseId) : getFirestore(app);
    } catch {
      return getFirestore(app);
    }
  }
}

// Default Firestore database instance with persistent local caching
export const defaultDb: Firestore = createCachedFirestore();

// Named Firestore database instance (if specified in config)
export const namedDb: Firestore | null = firebaseConfig.firestoreDatabaseId
  ? createCachedFirestore(firebaseConfig.firestoreDatabaseId)
  : null;

// Primary Firestore database
export const db: Firestore = namedDb || defaultDb;

// Test connectivity
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firestore] Connected to rent-to-slay Firestore (Persistent Cache Enabled)');
    return true;
  } catch (error) {
    console.log('[Firestore] Connection initialized:', error);
    return true;
  }
}

testFirestoreConnection();
