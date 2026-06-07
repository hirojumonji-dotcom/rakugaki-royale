import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../constants/theme';
import { subscribeToRoom, subscribeToPlayers } from '../services/firebase/rooms';
import { useRoomStore } from '../stores/roomStore';
import { auth } from '../services/firebase/config';
import type { Player } from '../types';

export default function LobbyScreen() {
  const router = useRouter();
  const { roomId, room, players, setRoom, setPlayers } = useRoomStore();

  useEffect(() => {
    if (!roomId) return;
    const unsubRoom = subscribeToRoom(roomId, setRoom);
    const unsubPlayers = subscribeToPlayers(roomId, setPlayers);
    return () => { unsubRoom(); unsubPlayers(); };
  }, [roomId]);

  useEffect(() => {
    if (room?.status === 'playing') {
      router.replace('/game/topic');
    }
  }, [room?.status]);

  const [ready, setReady] = useState(false);
  const myUid = auth.currentUser?.uid;
  const allReady = players.length >= 1 && players.every(p => (p as any).isReady);

  const handleReady = async () => {
    if (!roomId || !myUid) return;
    const { doc, updateDoc } = await import('firebase/firestore');
    const { db } = await import('../services/firebase/config');
    await updateDoc(doc(db, 'rooms', roomId, 'players', myUid), { isReady: true });
    setReady(true);
  };

  // 全員readyになったらゲーム開始（二重開始防止つき）
  useEffect(() => {
    if (allReady && players.length >= 2) {
      const doStart = async () => {
        const { startGame } = await import('../services/firebase/rooms');
        if (!roomId) return;
        await startGame(roomId);
      };
      // ホストだけが実行
      const me = players.find(p => p.uid === myUid);
      if (me?.isHost) {
        doStart();
      }
    }
  }, [allReady, players]);

  const renderPlayer = ({ item }: { item: Player }) => (
    <View style={styles.playerItem}>
      <View style={[styles.dot, { backgroundColor: (item as any).isReady ? COLORS.success : '#ddd' }]} />
      <Text style={styles.playerName}>{item.displayName}</Text>
      {(item as any).isReady && <Text style={styles.readyBadge}>READY</Text>}
      {item.isHost && <Text style={styles.hostBadge}>ホスト</Text>}
    </View>
  );

  if (!room) return <View style={styles.container}><Text>読み込み中...</Text></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>ルームコード</Text>
      <Text style={styles.code}>{room.code}</Text>

      <Text style={styles.settings}>
        ⏱ {room.settings.drawTime}秒 / 📝 {room.settings.topicMode === 'custom' ? 'カスタム' : '万人受け'} / 🔄 {room.settings.roundCount}回
      </Text>

      <Text style={styles.playerCount}>{players.length}人参加中</Text>

      <FlatList
        data={players}
        keyExtractor={item => item.uid}
        renderItem={renderPlayer}
        style={styles.list}
      />

      <TouchableOpacity
        style={[styles.startBtn, ready && styles.startBtnReady]}
        onPress={handleReady}
        disabled={ready}
      >
        <Text style={styles.startBtnText}>
          {ready ? '✓ READY（待機中...）' : 'READY'}
        </Text>
      </TouchableOpacity>

      {allReady && <Text style={styles.startingText}>全員READY！開始します...</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    paddingTop: 80,
    padding: SPACING.xl,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  code: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 8,
    color: COLORS.text,
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: RADIUS.md,
    marginVertical: SPACING.md,
  },
  settings: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginBottom: SPACING.lg,
  },
  playerCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  list: {
    width: '100%',
    maxWidth: 300,
    maxHeight: 250,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  playerName: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    flex: 1,
  },
  hostBadge: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    backgroundColor: '#f0f0f0',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  readyBadge: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.success,
    fontWeight: '700',
  },
  startBtn: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: RADIUS.md,
  },
  startBtnReady: {
    backgroundColor: COLORS.success,
  },
  startBtnText: {
    color: COLORS.primaryText,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  startingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
    fontWeight: '600',
  },
});
