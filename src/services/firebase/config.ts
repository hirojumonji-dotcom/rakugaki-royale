import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDn6kZ_nC4b3YQDrUJwvsqQrTppBiJKEeA',
  authDomain: 'byou-gahaku.firebaseapp.com',
  projectId: 'byou-gahaku',
  storageBucket: 'byou-gahaku.firebasestorage.app',
  messagingSenderId: '324721579317',
  appId: '1:324721579317:web:defab92f5ebd33c4b5287c',
  measurementId: 'G-TD412HJDVQ',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
