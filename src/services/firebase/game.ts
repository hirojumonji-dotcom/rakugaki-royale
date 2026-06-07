import {
  doc,
  setDoc,
  collection,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { db, auth } from './config';
import type { Drawing, Vote } from '../../types';

export async function submitDrawing(roomId: string, round: number, base64Image: string): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');

  // base64を直接Firestoreに保存（Storageは後で対応）
  await setDoc(doc(db, 'rooms', roomId, 'rounds', String(round), 'drawings', uid), {
    imageUrl: base64Image,
    submittedAt: serverTimestamp(),
  });
}

export async function submitVote(roomId: string, round: number, targetUid: string): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  if (uid === targetUid) throw new Error('Cannot vote for yourself');

  await setDoc(doc(db, 'rooms', roomId, 'rounds', String(round), 'votes', uid), {
    targetUid,
    votedAt: serverTimestamp(),
  });
}

export function subscribeToDrawings(
  roomId: string,
  round: number,
  callback: (drawings: Drawing[]) => void
) {
  return onSnapshot(
    collection(db, 'rooms', roomId, 'rounds', String(round), 'drawings'),
    (snap) => {
      const drawings = snap.docs.map(d => ({
        uid: d.id,
        imageUrl: d.data().imageUrl,
        submittedAt: d.data().submittedAt,
      } as Drawing));
      callback(drawings);
    }
  );
}

export function subscribeToVotes(
  roomId: string,
  round: number,
  callback: (votes: Vote[]) => void
) {
  return onSnapshot(
    collection(db, 'rooms', roomId, 'rounds', String(round), 'votes'),
    (snap) => {
      const votes = snap.docs.map(d => ({
        voterUid: d.id,
        targetUid: d.data().targetUid,
        votedAt: d.data().votedAt,
      } as Vote));
      callback(votes);
    }
  );
}

export async function addScore(roomId: string, uid: string, points: number): Promise<void> {
  await updateDoc(doc(db, 'rooms', roomId, 'players', uid), {
    score: increment(points),
  });
}
