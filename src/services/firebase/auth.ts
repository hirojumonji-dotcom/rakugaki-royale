import {
  signInAnonymously,
  GoogleAuthProvider,
  signInWithCredential,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

export async function signInAsGuest(): Promise<FirebaseUser> {
  const result = await signInAnonymously(auth);
  await ensureUserDoc(result.user);
  return result.user;
}

export async function signInWithGoogle(idToken: string): Promise<FirebaseUser> {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  await ensureUserDoc(result.user);
  return result.user;
}

export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

async function ensureUserDoc(user: FirebaseUser) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      displayName: user.displayName || `Player${user.uid.slice(0, 4)}`,
      photoURL: user.photoURL || null,
      premiumUntil: null,
      subscriptionType: 'none',
      totalGames: 0,
      totalWins: 0,
      createdAt: serverTimestamp(),
      lastPlayedAt: serverTimestamp(),
    });
  }
}
