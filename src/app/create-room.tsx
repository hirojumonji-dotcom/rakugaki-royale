import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../constants/theme';
import { GAME_CONFIG } from '../constants/config';
import { signInAsGuest } from '../services/firebase/auth';
import { createRoom } from '../services/firebase/rooms';
import { useRoomStore } from '../stores/roomStore';
import type { RoomSettings, TopicMode } from '../types';

export default function CreateRoomScreen() {
  const router = useRouter();
  const { setRoomId } = useRoomStore();
  const [name, setName] = useState('');
  const [drawTime, setDrawTime] = useState<10 | 20 | 30>(10);
  const [rounds, setRounds] = useState<3 | 5 | 10>(3);
  const [topicMode, setTopicMode] = useState<TopicMode>('random');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const user = await signInAsGuest();
      // 名前を更新
      const { updateProfile } = await import('firebase/auth');
      await updateProfile(user, { displayName: name.trim() });
      const settings: RoomSettings = { drawTime, roundCount: rounds, topicMode };
      const roomId = await createRoom(settings, false, name.trim());
      setRoomId(roomId);
      router.replace('/lobby');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>あなたの名前</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="名前を入力"
        maxLength={8}
        placeholderTextColor={COLORS.textMuted}
      />

      <Text style={styles.label}>制限時間</Text>
      <View style={styles.optionRow}>
        {GAME_CONFIG.DRAW_TIME_OPTIONS.map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.optionBtn, drawTime === t && styles.optionBtnActive]}
            onPress={() => setDrawTime(t)}
          >
            <Text style={[styles.optionText, drawTime === t && styles.optionTextActive]}>
              {t}秒
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>お題モード</Text>
      <View style={styles.optionRow}>
        <TouchableOpacity
          style={[styles.optionBtn, topicMode === 'random' && styles.optionBtnActive]}
          onPress={() => setTopicMode('random')}
        >
          <Text style={[styles.optionText, topicMode === 'random' && styles.optionTextActive]}>
            万人受け
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.optionBtn, topicMode === 'custom' && styles.optionBtnActive]}
          onPress={() => setTopicMode('custom')}
        >
          <Text style={[styles.optionText, topicMode === 'custom' && styles.optionTextActive]}>
            カスタム
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>ラウンド数</Text>
      <View style={styles.optionRow}>
        {GAME_CONFIG.ROUND_OPTIONS.map(r => (
          <TouchableOpacity
            key={r}
            style={[styles.optionBtn, rounds === r && styles.optionBtnActive]}
            onPress={() => setRounds(r)}
          >
            <Text style={[styles.optionText, rounds === r && styles.optionTextActive]}>
              {r}回
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.createBtn, loading && { opacity: 0.5 }]}
        onPress={handleCreate}
        disabled={loading || !name.trim()}
      >
        <Text style={styles.createBtnText}>
          {loading ? '作成中...' : '部屋を作成'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backBtnText}>もどる</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  input: {
    width: '100%',
    maxWidth: 280,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    backgroundColor: COLORS.surface,
    color: COLORS.text,
  },
  optionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  optionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  optionBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  optionTextActive: {
    color: COLORS.primaryText,
  },
  createBtn: {
    marginTop: 32,
    width: '100%',
    maxWidth: 280,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  createBtnText: {
    color: COLORS.primaryText,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  backBtn: {
    marginTop: SPACING.md,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  backBtnText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});
