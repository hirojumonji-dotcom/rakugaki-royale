import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from './config';
import { GAME_CONFIG } from '../../constants/config';
import type { RoomSettings, Room, Player } from '../../types';

function generateRoomCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export async function createRoom(settings: RoomSettings, isPremium: boolean, playerName?: string): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');

  const code = generateRoomCode();
  const roomRef = await addDoc(collection(db, 'rooms'), {
    code,
    hostUid: uid,
    isPremium,
    status: 'lobby',
    settings,
    currentRound: 0,
    currentPhase: 'topic',
    currentTopic: '',
    topicWriterUid: null,
    phaseEndsAt: null,
    createdAt: serverTimestamp(),
    expiresAt: Timestamp.fromDate(
      new Date(Date.now() + GAME_CONFIG.ROOM_EXPIRE_HOURS * 60 * 60 * 1000)
    ),
  });

  await setDoc(doc(db, 'rooms', roomRef.id, 'players', uid), {
    displayName: playerName || auth.currentUser?.displayName || `Player${uid.slice(0, 4)}`,
    photoURL: auth.currentUser?.photoURL || null,
    score: 0,
    role: 'drawer',
    joinedAt: serverTimestamp(),
    isHost: true,
    isConnected: true,
  });

  return roomRef.id;
}

export async function joinRoomByCode(code: string, playerName?: string): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');

  const q = query(collection(db, 'rooms'), where('code', '==', code), where('status', '==', 'lobby'));
  const snap = await getDocs(q);

  if (snap.empty) throw new Error('Room not found');
  const roomDoc = snap.docs[0];
  const roomId = roomDoc.id;

  await setDoc(doc(db, 'rooms', roomId, 'players', uid), {
    displayName: playerName || auth.currentUser?.displayName || `Player${uid.slice(0, 4)}`,
    photoURL: auth.currentUser?.photoURL || null,
    score: 0,
    role: 'drawer',
    joinedAt: serverTimestamp(),
    isHost: false,
    isConnected: true,
  });

  return roomId;
}

export function subscribeToRoom(roomId: string, callback: (room: Room | null) => void) {
  return onSnapshot(doc(db, 'rooms', roomId), (snap) => {
    if (!snap.exists()) { callback(null); return; }
    callback({ id: snap.id, ...snap.data() } as Room);
  });
}

export function subscribeToPlayers(roomId: string, callback: (players: Player[]) => void) {
  return onSnapshot(collection(db, 'rooms', roomId, 'players'), (snap) => {
    const players = snap.docs.map(d => ({ uid: d.id, ...d.data() } as Player));
    callback(players);
  });
}

export async function updateRoomPhase(
  roomId: string,
  phase: string,
  updates: Record<string, any> = {}
) {
  await updateDoc(doc(db, 'rooms', roomId), {
    currentPhase: phase,
    ...updates,
  });
}

export async function leaveRoom(roomId: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  // ホスト移譲: 自分がホストなら次の人に渡す
  const playersSnap = await getDocs(collection(db, 'rooms', roomId, 'players'));
  const players = playersSnap.docs.map(d => ({ uid: d.id, ...d.data() }));
  const me = players.find(p => p.uid === uid) as any;

  await deleteDoc(doc(db, 'rooms', roomId, 'players', uid));

  if (me?.isHost) {
    const remaining = players.filter(p => p.uid !== uid);
    if (remaining.length > 0) {
      // 最も早く参加した人を新ホストに
      const newHost = remaining[0];
      await updateDoc(doc(db, 'rooms', roomId, 'players', newHost.uid), { isHost: true });
      await updateDoc(doc(db, 'rooms', roomId), { hostUid: newHost.uid });
    }
  }
}

// ゲーム開始（二重開始防止つき）
export async function startGame(roomId: string): Promise<boolean> {
  const roomSnap = await getDoc(doc(db, 'rooms', roomId));
  if (!roomSnap.exists()) return false;

  const room = roomSnap.data();
  // 既にplaying状態なら何もしない（二重開始防止）
  if (room.status === 'playing') return false;

  await updateDoc(doc(db, 'rooms', roomId), {
    status: 'playing',
    currentRound: 1,
    currentPhase: 'topic',
  });
  return true;
}
