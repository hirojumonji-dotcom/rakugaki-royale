import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { onSnapshot, doc } from 'firebase/firestore';
import { COLORS, FONT_SIZES, SPACING } from '../../constants/theme';
import { useRoomStore } from '../../stores/roomStore';
import { useGameStore } from '../../stores/gameStore';
import { TOPICS } from '../../constants/topics';
import { updateRoomPhase } from '../../services/firebase/rooms';
import { auth, db } from '../../services/firebase/config';

export default function TopicScreen() {
  const router = useRouter();
  const roomId = useRoomStore(s => s.roomId);
  const room = useRoomStore(s => s.room);
  const players = useRoomStore(s => s.players);
  const [countdown, setCountdown] = useState(3);
  const [topic, setLocalTopic] = useState('');
  const [topicReady, setTopicReady] = useState(false);

  useEffect(() => {
    const myUid = auth.currentUser?.uid;
    const isHost = players.find(p => p.uid === myUid)?.isHost;
    const currentRound = room?.currentRound || 1;
    useGameStore.getState().setRound(currentRound);

    if (isHost) {
      const selected = TOPICS[Math.floor(Math.random() * TOPICS.length)];
      setLocalTopic(selected);
      setTopicReady(true);
      useGameStore.getState().setTopic(selected);
      if (roomId) {
        updateRoomPhase(roomId, 'draw', { currentTopic: selected, topicRound: currentRound });
      }
    } else {
      // ゲスト: Firestoreのroom.currentTopicをリアルタイム監視
      // currentRoundと一致するお題のみ受け取る（前ラウンドの残りを無視）
      if (!roomId) return;
      const unsub = onSnapshot(doc(db, 'rooms', roomId), (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        if (data.currentTopic && data.currentTopic !== '' && data.topicRound === currentRound) {
          setLocalTopic(data.currentTopic);
          setTopicReady(true);
          useGameStore.getState().setTopic(data.currentTopic);
          unsub();
        }
      });
      return unsub;
    }
  }, []);

  // お題が確定してからカウントダウン開始
  useEffect(() => {
    if (!topicReady) return;
    if (countdown <= 0) {
      router.replace('/game/draw');
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, topicReady]);

  return (
    <View style={styles.container}>
      <Text style={styles.round}>ラウンド {room?.currentRound || 1}</Text>
      <Text style={styles.label}>🎨 お題</Text>
      <Text style={styles.topic}>{topic || '...'}</Text>
      {topicReady && <Text style={styles.countdown}>{countdown}</Text>}
      {!topicReady && <Text style={styles.waiting}>お題を決めています...</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: COLORS.background,
    justifyContent: 'center', alignItems: 'center', padding: SPACING.xl,
  },
  round: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted, marginBottom: SPACING.sm },
  label: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted, letterSpacing: 2 },
  topic: { fontSize: 48, fontWeight: '800', color: COLORS.text, marginTop: SPACING.md },
  countdown: { fontSize: 72, fontWeight: '800', color: COLORS.text, marginTop: 40 },
  waiting: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted, marginTop: 40 },
});
