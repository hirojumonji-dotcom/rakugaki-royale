import { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONT_SIZES, SPACING } from '../../constants/theme';
import { useRoomStore } from '../../stores/roomStore';
import { useGameStore } from '../../stores/gameStore';
import { submitDrawing } from '../../services/firebase/game';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANVAS_SIZE = Math.min(SCREEN_WIDTH - 32, 380);

const PALETTE = ['#222222', '#e53935', '#1e88e5', '#43a047', '#fb8c00', '#8e24aa'];
const SIZES = [3, 8, 16];

export default function DrawScreen() {
  const router = useRouter();
  const room = useRoomStore(s => s.room);
  const roomId = useRoomStore(s => s.roomId);
  const currentTopic = useGameStore(s => s.currentTopic);
  const currentRound = useGameStore(s => s.currentRound);

  const drawTime = room?.settings?.drawTime ?? 10;
  const [timeLeft, setTimeLeft] = useState(drawTime);
  const [penColor, setPenColor] = useState('#222222');
  const [penSize, setPenSize] = useState(3);
  const [phase, setPhase] = useState<'drawing' | 'timeup' | 'saving'>('drawing');
  const isUrgent = timeLeft <= 5;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const canvasReady = useRef(false);
  const penColorRef = useRef(penColor);
  const penSizeRef = useRef(penSize);
  penColorRef.current = penColor;
  penSizeRef.current = penSize;

  // タイマー
  useEffect(() => {
    if (phase !== 'drawing') return;
    const interval = setInterval(() => {
      setTimeLeft(t => {
        const next = t - 0.1;
        if (next <= 0) {
          clearInterval(interval);
          setPhase('timeup');
          return 0;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [phase]);

  // タイムアップ → 保存 → 遷移
  useEffect(() => {
    if (phase !== 'timeup') return;

    const doSubmit = async () => {
      setPhase('saving');
      const rid = useRoomStore.getState().roomId;
      const round = useGameStore.getState().currentRound || 1;

      try {
        const canvas = canvasRef.current;
        if (canvas && rid) {
          // JPEG 0.5品質で圧縮（50-150KB程度に収まる）
          const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
          await submitDrawing(rid, round, dataUrl);
        }
      } catch (e) {
        console.error('Submit error:', e);
      }

      // 1.5秒演出してから投票画面へ
      setTimeout(() => {
        router.replace('/game/vote');
      }, 1500);
    };

    doSubmit();
  }, [phase]);

  // Web用Canvas
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (canvasReady.current) return;

    const trySetup = () => {
      const container = document.querySelector('[data-testid="draw-canvas-box"]') as HTMLElement;
      if (!container) {
        setTimeout(trySetup, 150);
        return;
      }

      const canvas = document.createElement('canvas');
      const dpr = window.devicePixelRatio || 1;
      canvas.width = CANVAS_SIZE * dpr;
      canvas.height = CANVAS_SIZE * dpr;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.cursor = 'crosshair';
      canvas.style.display = 'block';

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      canvasRef.current = canvas;
      canvasReady.current = true;
      container.appendChild(canvas);

      canvas.addEventListener('mousedown', (e) => {
        isDrawingRef.current = true;
        const rect = canvas.getBoundingClientRect();
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.strokeStyle = penColorRef.current;
        ctx.lineWidth = penSizeRef.current;
      });
      canvas.addEventListener('mousemove', (e) => {
        if (!isDrawingRef.current) return;
        const rect = canvas.getBoundingClientRect();
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
      });
      canvas.addEventListener('mouseup', () => { isDrawingRef.current = false; });
      canvas.addEventListener('mouseleave', () => { isDrawingRef.current = false; });

      canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        isDrawingRef.current = true;
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        ctx.beginPath();
        ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
        ctx.strokeStyle = penColorRef.current;
        ctx.lineWidth = penSizeRef.current;
      }, { passive: false });
      canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (!isDrawingRef.current) return;
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
        ctx.stroke();
      }, { passive: false });
      canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        isDrawingRef.current = false;
      });
    };

    trySetup();
  }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  };

  // タイムアップオーバーレイ
  if (phase === 'timeup' || phase === 'saving') {
    return (
      <View style={styles.timeupOverlay}>
        <Text style={styles.timeupIcon}>✏️</Text>
        <Text style={styles.timeupText}>ペンを置け！</Text>
        <Text style={styles.timeupSub}>
          {phase === 'saving' ? '保存中...' : "Time's up!"}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.timerBar}>
        <View style={[styles.timerFill, { width: `${(timeLeft / drawTime) * 100}%` }, isUrgent && styles.timerUrgent]} />
      </View>

      <View style={styles.header}>
        <Text style={[styles.timerText, isUrgent && styles.timerTextUrgent]}>{Math.ceil(timeLeft)}</Text>
        <Text style={styles.topicBadge}>お題: {currentTopic || '---'}</Text>
      </View>

      <View style={styles.canvasArea}>
        {Platform.OS === 'web' ? (
          <View
            testID="draw-canvas-box"
            style={[styles.canvasBox, { width: CANVAS_SIZE, height: CANVAS_SIZE }]}
          />
        ) : (
          <View style={[styles.canvasBox, { width: CANVAS_SIZE, height: CANVAS_SIZE }]}>
            {/* ネイティブ: SkiaCanvas（Expo Go実機テスト時に有効化） */}
          </View>
        )}
      </View>

      <View style={styles.toolbar}>
        {PALETTE.map(c => (
          <TouchableOpacity
            key={c}
            style={[styles.colorDot, { backgroundColor: c }, penColor === c && styles.colorActive]}
            onPress={() => setPenColor(c)}
          />
        ))}
        <View style={styles.divider} />
        {SIZES.map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.sizeBtn, penSize === s && styles.sizeActive]}
            onPress={() => setPenSize(s)}
          >
            <View style={[styles.sizeDot, { width: Math.min(s + 2, 14), height: Math.min(s + 2, 14) }]} />
          </TouchableOpacity>
        ))}
        <View style={styles.divider} />
        <TouchableOpacity style={styles.clearBtn} onPress={clearCanvas}>
          <Text style={styles.clearText}>全消</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  timerBar: { height: 5, backgroundColor: '#eee' },
  timerFill: { height: '100%', backgroundColor: COLORS.primary },
  timerUrgent: { backgroundColor: COLORS.accent },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
  },
  timerText: { fontSize: 28, fontWeight: '700', color: COLORS.text },
  timerTextUrgent: { color: COLORS.accent },
  topicBadge: {
    fontSize: FONT_SIZES.sm, color: COLORS.textSecondary,
    backgroundColor: '#f0f0f0', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 12,
  },
  canvasArea: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#f0f0f0', padding: SPACING.sm,
  },
  canvasBox: {
    backgroundColor: '#fff', borderRadius: 4, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  toolbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, gap: 6, backgroundColor: COLORS.surface,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  colorDot: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: 'transparent' },
  colorActive: { borderColor: '#000', transform: [{ scale: 1.15 }] },
  divider: { width: 1, height: 20, backgroundColor: '#eee', marginHorizontal: 4 },
  sizeBtn: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 1.5,
    borderColor: '#ddd', justifyContent: 'center', alignItems: 'center',
  },
  sizeActive: { borderColor: '#000' },
  sizeDot: { borderRadius: 10, backgroundColor: '#333' },
  clearBtn: { paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 5 },
  clearText: { fontSize: 11, color: '#555' },
  // タイムアップオーバーレイ
  timeupOverlay: {
    flex: 1, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center',
  },
  timeupIcon: { fontSize: 48, marginBottom: 12 },
  timeupText: { fontSize: 32, fontWeight: '800', color: '#fff' },
  timeupSub: { fontSize: 14, color: '#aaa', marginTop: 8 },
});
