import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  updateDoc,
  serverTimestamp,
  deleteDoc,
  collection,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// Prevent duplicate initialization
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validates connection to Firestore on app startup
 */
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firestore] Connection validated successfully.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('[Firestore] Client is offline. Please check your Firebase configuration.');
      return false;
    }
    // 404/not-found is expected and indicates valid reachability
    return true;
  }
}

export interface VisitorData {
  visitorId: string;
  visitorName: string;
  snapchatAnswer?: string;
  snapchatId?: string | null;
  memoryAnswer?: string;
  memoryFollowUp?: string;
  personalMessage?: string;
  finalAnswer?: 'YES' | 'NO' | null;
  completionStatus: 'in_progress' | 'completed' | 'declined';
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Creates initial visitor record in Firestore and server store
 */
export async function createVisitorRecord(visitorId: string, visitorName: string): Promise<boolean> {
  const docPath = `visitors/${visitorId}`;
  try {
    const payload = {
      visitorId,
      visitorName,
      completionStatus: 'in_progress' as const,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(doc(db, 'visitors', visitorId), payload);

    // Sync to backend store for admin dashboard
    fetch('/api/visitors/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId,
        visitorName,
        completionStatus: 'in_progress',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    }).catch(e => console.warn('[Sync Warning]', e));

    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, docPath);
    return false;
  }
}

/**
 * Progressively updates visitor answers in Firestore and server store
 */
export async function updateVisitorStep(
  visitorId: string,
  updates: Partial<Omit<VisitorData, 'visitorId' | 'createdAt'>> & { visitorName: string }
): Promise<boolean> {
  const docPath = `visitors/${visitorId}`;
  try {
    const payload: any = {
      ...updates,
      updatedAt: serverTimestamp()
    };

    await updateDoc(doc(db, 'visitors', visitorId), payload);

    // Sync to backend store
    fetch('/api/visitors/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId,
        ...updates,
        updatedAt: new Date().toISOString()
      })
    }).catch(e => console.warn('[Sync Warning]', e));

    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
    return false;
  }
}
