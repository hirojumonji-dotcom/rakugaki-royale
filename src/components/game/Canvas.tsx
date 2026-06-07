import { useRef, useState, useCallback } from 'react';
import { View, StyleSheet, PanResponder, GestureResponderEvent, Dimensions } from 'react-native';
import { COLORS } from '../../constants/theme';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

interface CanvasProps {
  size: number;
  color?: string;
  strokeWidth?: number;
  onDrawingChange?: (strokes: Stroke[]) => void;
}

export default function Canvas({ size, color = '#222', strokeWidth = 3, onDrawingChange }: CanvasProps) {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const canvasRef = useRef<View>(null);
  const layoutRef = useRef({ x: 0, y: 0 });

  const getPoint = (e: GestureResponderEvent): Point => {
    const { locationX, locationY } = e.nativeEvent;
    return { x: locationX, y: locationY };
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => {
      const point = getPoint(e);
      const stroke: Stroke = { points: [point], color, width: strokeWidth };
      setCurrentStroke(stroke);
    },
    onPanResponderMove: (e) => {
      if (!currentStroke) return;
      const point = getPoint(e);
      setCurrentStroke(prev => {
        if (!prev) return null;
        return { ...prev, points: [...prev.points, point] };
      });
    },
    onPanResponderRelease: () => {
      if (currentStroke) {
        const newStrokes = [...strokes, currentStroke];
        setStrokes(newStrokes);
        setCurrentStroke(null);
        onDrawingChange?.(newStrokes);
      }
    },
  });

  const renderStroke = (stroke: Stroke, key: string) => {
    if (stroke.points.length < 2) return null;
    const pathData = stroke.points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');

    return (
      <View key={key} style={StyleSheet.absoluteFill} pointerEvents="none">
        <svg width={size} height={size} style={{ position: 'absolute' }}>
          <path
            d={pathData}
            stroke={stroke.color}
            strokeWidth={stroke.width}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </View>
    );
  };

  return (
    <View
      ref={canvasRef}
      style={[styles.canvas, { width: size, height: size }]}
      {...panResponder.panHandlers}
    >
      {/* SVGで描画 (Web対応) */}
      <svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0 }}>
        {strokes.map((stroke, i) => {
          if (stroke.points.length < 2) return null;
          const d = stroke.points
            .map((p, j) => `${j === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
            .join(' ');
          return (
            <path
              key={`s-${i}`}
              d={d}
              stroke={stroke.color}
              strokeWidth={stroke.width}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}
        {currentStroke && currentStroke.points.length >= 2 && (
          <path
            d={currentStroke.points.map((p, j) => `${j === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
            stroke={currentStroke.color}
            strokeWidth={currentStroke.width}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </View>
  );
}

export function clearCanvas() {
  // will be handled via ref in actual implementation
}

const styles = StyleSheet.create({
  canvas: {
    backgroundColor: '#ffffff',
    borderRadius: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
});
