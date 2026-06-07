import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONT_SIZES, SPACING } from '../../constants/theme';
import { useRoomStore } from '../../stores/roomStore';
import { useGameStore } from '../../stores/gameStore';
import { TOPICS } from '../../constants/topics';
import { updateRoomPhase } from '../../services/firebase/rooms';
import { auth } from '../../services/firebase/config';

export default function TopicScreen() {
  const router = useRouter();
  const roomId = useRoomStore.getState().roomId;
  const room = useRoomStore.getState().room;
  const [countdown, setCountdown] = useState(3);
  const [topic, setLocalTopic] = useState('');

  useEffect(() => {
    const players = useRoomStore.getState().players;
    const myUid = auth.currentUser?.uid;
    const isHost = players.find(p => p.uid === myUid)?.isHost;

    useGameStore.getState().setRound(room?.currentRound || 1);

    if (isHost) {
      // ホストだけがお題を決めてFirestoreに書き込む
      const selected = TOPICS[Math.floor(Math.random() * TOPICS.length)];
      setLocalTopic(selected);
      useGameStore.getState().setTopic(selected);
      if (roomId) {
        updateRoomPhase(roomId, 'draw', { currentTopic: selected });
      }
    } else {
      // ゲストはFirestoreからお題を読む
      const checkTopic = () => {
        const currentRoom = useRoomStore.getState().room;
        if (currentRoom?.currentTopic) {
          setLocalTopic(currentRoom.currentTopic);
          useGameStore.getState().setTopic(currentRoom.currentTopic);
        } else {
          setTimeout(checkTopic, 300);
        }
      };
      checkTopic();
    }
  }, []);

  useEffect(() => {
    if (countdown <= 0) {
      router.replace('/game/draw');
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  return (
    <View style={styles.container}>
      <Text style={styles.round}>ラウンド {room?.currentRound || 1}</Text>
      <Text style={styles.label}>🎨 お題</Text>
      <Text style={styles.topic}>{topic}</Text>
      <Text style={styles.countdown}>{countdown}</Text>
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
});
