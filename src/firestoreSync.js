// Firestore Database Sync Service
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, isConfigured } from './firebase';

const DATA_DOC = 'workspace_data';
const COLLECTION = 'buildpay';

/**
 * Listen to real-time changes in Cloud Firestore.
 * Automatically syncs down to React state whenever data changes in the cloud.
 */
export function subscribeToCloudData(callback) {
  if (!isConfigured || !db) return () => {};

  const docRef = doc(db, COLLECTION, DATA_DOC);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    } else {
      callback(null);
    }
  }, (err) => {
    console.error("Firestore sync subscription error:", err);
  });
}

/**
 * Save state changes up to Cloud Firestore.
 */
export async function saveToCloud(data) {
  if (!isConfigured || !db) return;
  try {
    const docRef = doc(db, COLLECTION, DATA_DOC);
    await setDoc(docRef, data, { merge: true });
  } catch (err) {
    console.error("Failed to sync to Firebase Firestore:", err);
  }
}
