import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { useRoomStore } from '../../stores/roomStore';
import { subscribeToRoom, subscribeToPlayers } from '../../services/firebase/rooms';

export default function GameLayout() {
  const roomId = useRoomStore(s => s.roomId);
  const setRoom = useRoomStore(s => s.setRoom);
  const setPlayers = useRoomStore(s => s.setPlayers);

  useEffect(() => {
    if (!roomId) return;
    const unsub1 = subscribeToRoom(roomId, setRoom);
    const unsub2 = subscribeToPlayers(roomId, setPlayers);
    return () => { unsub1(); unsub2(); };
  }, [roomId]);

  // ブラウザバック防止
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handlePopState = (e: PopStateEvent) => {
      window.history.pushState(null, '', window.location.href);
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />;
}
