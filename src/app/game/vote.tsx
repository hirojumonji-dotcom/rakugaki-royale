import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../../constants/theme';
import { useRoomStore } from '../../stores/roomStore';
import { useGameStore } from '../../stores/gameStore';
import { subscribeToDrawings, submitVote } from '../../services/firebase/game';
import { auth } from '../../services/firebase/config';
import type { Drawing } from '../../types';

export default function VoteScreen() {
  const router = useRouter();
  const roomId = useRoomStore(s => s.roomId);
  const currentRound = useGameStore(s => s.currentRound);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const myUid = auth.currentUser?.uid;

  const players = useRoomStore(s => s.players);
  const drawerCount = players.filter(p => p.role === 'drawer').length || players.length;

  useEffect(() => {
    if (!roomId) return;
    const unsub = subscribeToDrawings(roomId, currentRound || 1, (d) => {
      setDrawings(d);
    });
    return unsub;
  }, [roomId, currentRound]);

  // 全員の絵が揃ったら表示（揃うまでは待機）
  const allSubmitted = drawings.length >= drawerCount;

  // 1人プレイテスト用: 自分以外に投票先がない場合のみスキップ
  useEffect(() => {
    if (!allSubmitted) return;
    const uid = auth.currentUser?.uid;
    const votable = drawings.filter(d => d.uid !== uid);
    if (votable.length === 0) {
      setTimeout(() => router.replace('/game/results'), 1500);
    }
  }, [allSubmitted, drawings]);

  const [voted, setVoted] = useState(false);
  const [votes, setVotes] = useState<any[]>([]);

  // 投票をリアルタイム監視
  useEffect(() => {
    if (!roomId) return;
    const { subscribeToVotes } = require('../../services/firebase/game');
    const unsub = subscribeToVotes(roomId, currentRound || 1, (v: any[]) => {
      setVotes(v);
    });
    return unsub;
  }, [roomId, currentRound]);

  // 全員投票完了したら結果画面へ
  useEffect(() => {
    if (!voted) return;
    if (votes.length >= drawerCount) {
      router.replace('/game/results');
    }
  }, [votes, voted, drawerCount]);

  const handleVote = async () => {
    if (!selected || !roomId) return;
    setLoading(true);
    try {
      await submitVote(roomId, currentRound || 1, selected);
      setVoted(true);
    } catch (e) {
      console.error('Vote error:', e);
    } finally {
      setLoading(false);
    }
  };

  // 投票済み → 待機画面
  if (voted) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.title}>投票完了！</Text>
        <Text style={styles.subtitle}>みんなの投票を待っています... ({votes.length}/{drawerCount})</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>投票タイム</Text>
      <Text style={styles.subtitle}>一番好きな絵を選んでください（自分以外）</Text>

      <View style={styles.grid}>
        {!allSubmitted && (
          <Text style={styles.loadingText}>みんなの絵を待っています... ({drawings.length}/{drawerCount})</Text>
        )}
        {allSubmitted && drawings.map((d, i) => {
          const isMine = d.uid === myUid;
          const isSelected = selected === d.uid;
          return (
            <TouchableOpacity
              key={d.uid}
              style={[styles.card, isSelected && styles.cardSelected, isMine && styles.cardMine]}
              onPress={() => { if (!isMine) setSelected(d.uid); }}
              disabled={isMine}
            >
              {d.imageUrl ? (
                Platform.OS === 'web' && d.imageUrl.startsWith('data:') ? (
                  <View style={styles.cardImageWrap}>
                    <img src={d.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' } as any} />
                  </View>
                ) : (
                  <Image source={{ uri: d.imageUrl }} style={styles.cardImageWrap} resizeMode="contain" />
                )
              ) : (
                <View style={styles.cardImagePlaceholder}>
                  <Text style={styles.placeholderText}>作品{i + 1}</Text>
                </View>
              )}
              <Text style={styles.cardLabel}>{isMine ? '（あなた）' : `作品 ${i + 1}`}</Text>
              {isSelected && (
                <View style={styles.checkBadge}><Text style={styles.check}>✓</Text></View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>


      <TouchableOpacity
        style={[styles.voteBtn, (!selected || loading) && styles.voteBtnDisabled]}
        onPress={handleVote}
        disabled={!selected || loading}
      >
        <Text style={styles.voteBtnText}>{loading ? '送信中...' : '投票する'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.xl, alignItems: 'center' },
  title: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.text, marginTop: 40 },
  subtitle: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted, marginTop: SPACING.xs, marginBottom: SPACING.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: SPACING.md, width: '100%' },
  card: {
    width: '45%', aspectRatio: 1, backgroundColor: COLORS.surface,
    borderWidth: 3, borderColor: COLORS.border, borderRadius: RADIUS.lg,
    overflow: 'hidden', position: 'relative',
  },
  cardSelected: {
    borderColor: COLORS.accent,
    shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25, shadowRadius: 8, transform: [{ scale: 1.04 }],
  },
  cardMine: { opacity: 0.5 },
  cardImageWrap: { flex: 1, width: '100%', backgroundColor: '#fff' },
  cardImagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: COLORS.textMuted, fontSize: FONT_SIZES.sm },
  cardLabel: { padding: 6, textAlign: 'center', fontSize: 11, color: COLORS.textMuted },
  checkBadge: {
    position: 'absolute', top: 8, right: 8,
    width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.accent,
    justifyContent: 'center', alignItems: 'center',
  },
  check: { color: '#fff', fontSize: 12, fontWeight: '700' },
  loadingText: { color: COLORS.textMuted, marginTop: 20 },
  voteBtn: {
    marginTop: 24, backgroundColor: COLORS.primary,
    paddingVertical: 16, paddingHorizontal: 40, borderRadius: RADIUS.md,
  },
  voteBtnDisabled: { opacity: 0.4 },
  voteBtnText: { color: COLORS.primaryText, fontSize: FONT_SIZES.lg, fontWeight: '700' },
});
