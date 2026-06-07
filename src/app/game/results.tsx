import { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../../constants/theme';
import { useRoomStore } from '../../stores/roomStore';
import { useGameStore } from '../../stores/gameStore';
import { subscribeToDrawings, subscribeToVotes } from '../../services/firebase/game';
import { updateRoomPhase } from '../../services/firebase/rooms';
import { auth } from '../../services/firebase/config';
import type { Drawing, Vote } from '../../types';

interface ResultItem {
  uid: string;
  name: string;
  imageUrl: string;
  votes: number;
}

export default function ResultsScreen() {
  const router = useRouter();
  const roomId = useRoomStore(s => s.roomId);
  const room = useRoomStore(s => s.room);
  const players = useRoomStore(s => s.players);
  const currentRound = useGameStore(s => s.currentRound);

  const [results, setResults] = useState<ResultItem[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [showButton, setShowButton] = useState(false);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [calculated, setCalculated] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    const round = currentRound || 1;
    const unsub1 = subscribeToDrawings(roomId, round, setDrawings);
    const unsub2 = subscribeToVotes(roomId, round, setVotes);
    return () => { unsub1(); unsub2(); };
  }, [roomId, currentRound]);

  useEffect(() => {
    if (drawings.length === 0 || calculated) return;
    const timer = setTimeout(() => {
      calculateResults();
      setCalculated(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, [drawings, votes, calculated]);

  const calculateResults = () => {
    const voteCounts: Record<string, number> = {};
    drawings.forEach(d => { voteCounts[d.uid] = 0; });
    votes.forEach(v => { voteCounts[v.targetUid] = (voteCounts[v.targetUid] || 0) + 1; });

    const items: ResultItem[] = drawings.map(d => {
      const player = players.find(p => p.uid === d.uid);
      return {
        uid: d.uid,
        name: player?.displayName || 'プレイヤー',
        imageUrl: d.imageUrl,
        votes: voteCounts[d.uid] || 0,
      };
    }).sort((a, b) => a.votes - b.votes);

    setResults(items);

    // 1枚ずつめくりアニメーション
    for (let i = 0; i < items.length; i++) {
      setTimeout(() => setRevealedCount(i + 1), 600 + i * 1000);
    }
    setTimeout(() => setShowButton(true), 600 + items.length * 1000 + 500);
  };

  const handleNext = async () => {
    const totalRounds = room?.settings?.roundCount || 3;
    const nextRound = (currentRound || 1) + 1;

    if (nextRound > totalRounds) {
      router.replace('/');
    } else {
      useGameStore.getState().setRound(nextRound);
      useGameStore.getState().resetRound();
      if (roomId) {
        await updateRoomPhase(roomId, 'topic', { currentRound: nextRound });
      }
      router.replace('/game/topic');
    }
  };

  const renderImage = (imageUrl: string) => {
    if (!imageUrl) return <View style={[styles.cardImage, styles.placeholder]}><Text style={styles.placeholderText}>絵</Text></View>;

    if (Platform.OS === 'web' && imageUrl.startsWith('data:')) {
      return (
        <View style={styles.cardImage}>
          <img src={imageUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' } as any} />
        </View>
      );
    }

    return <Image source={{ uri: imageUrl }} style={styles.cardImage} resizeMode="contain" />;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>🏆 結果発表</Text>
      <Text style={styles.roundLabel}>ラウンド {currentRound || 1}</Text>

      {results.map((r, i) => {
        const isRevealed = i < revealedCount;
        const isWinner = i === results.length - 1 && r.votes > 0;

        if (!isRevealed) return <View key={r.uid} style={styles.hiddenCard} />;

        return (
          <View key={r.uid} style={[styles.card, isWinner && styles.cardWinner]}>
            {renderImage(r.imageUrl)}
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{isWinner ? '👑 ' : ''}{r.name}</Text>
              <Text style={styles.cardVotes}>❤️ {r.votes}票</Text>
            </View>
          </View>
        );
      })}

      {results.length === 0 && (
        <Text style={styles.loadingText}>結果を集計中...</Text>
      )}

      {showButton && (
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>
            {(currentRound || 1) >= (room?.settings?.roundCount || 3) ? 'ホームに戻る' : '次のラウンドへ'}
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.xl, alignItems: 'center', paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.text },
  roundLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted, marginTop: 4, marginBottom: SPACING.xl },
  card: {
    width: '100%', maxWidth: 340, backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border,
    marginBottom: SPACING.lg, overflow: 'hidden',
  },
  cardWinner: {
    borderWidth: 2.5, borderColor: COLORS.gold,
    shadowColor: COLORS.gold, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 12,
  },
  hiddenCard: { width: '100%', maxWidth: 340, height: 200, marginBottom: SPACING.lg },
  cardImage: { width: '100%', aspectRatio: 1.2, backgroundColor: '#fafafa' },
  placeholder: { justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: COLORS.textMuted },
  cardInfo: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: SPACING.md,
  },
  cardName: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.text },
  cardVotes: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.accent },
  loadingText: { color: COLORS.textMuted, marginTop: 20 },
  nextBtn: {
    marginTop: SPACING.xl, backgroundColor: COLORS.primary,
    paddingVertical: 16, paddingHorizontal: 36, borderRadius: RADIUS.md,
  },
  nextBtnText: { color: COLORS.primaryText, fontSize: FONT_SIZES.lg, fontWeight: '700' },
});
