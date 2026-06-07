import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../constants/theme';
import { signInAsGuest } from '../services/firebase/auth';
import { joinRoomByCode } from '../services/firebase/rooms';
import { useRoomStore } from '../stores/roomStore';

export default function JoinRoomScreen() {
  const router = useRouter();
  const { setRoomId } = useRoomStore();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!name.trim() || code.length !== 4) return;
    setLoading(true);
    try {
      const user = await signInAsGuest();
      const { updateProfile } = await import('firebase/auth');
      await updateProfile(user, { displayName: name.trim() });
      const roomId = await joinRoomByCode(code, name.trim());
      setRoomId(roomId);
      router.replace('/lobby');
    } catch (e: any) {
      Alert.alert('エラー', 'ルームが見つかりません');
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

      <Text style={styles.label}>ルームコード</Text>
      <TextInput
        style={[styles.input, styles.codeInput]}
        value={code}
        onChangeText={setCode}
        placeholder="4桁"
        maxLength={4}
        keyboardType="number-pad"
        placeholderTextColor={COLORS.textMuted}
      />

      <TouchableOpacity
        style={[styles.joinBtn, loading && { opacity: 0.5 }]}
        onPress={handleJoin}
        disabled={loading || !name.trim() || code.length !== 4}
      >
        <Text style={styles.joinBtnText}>
          {loading ? '参加中...' : '参加する'}
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
  codeInput: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 8,
  },
  joinBtn: {
    marginTop: 32,
    width: '100%',
    maxWidth: 280,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  joinBtnText: {
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
