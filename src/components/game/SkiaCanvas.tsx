import { useRef, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas, Path, Skia, useTouchHandler } from '@shopify/react-native-skia';

interface Point { x: number; y: number; }
interface Stroke { path: any; color: string; width: number; }

interface SkiaCanvasProps {
  size: number;
  color: string;
  strokeWidth: number;
  onCanvasReady?: (ref: any) => void;
}

export default function SkiaCanvas({ size, color, strokeWidth, onCanvasReady }: SkiaCanvasProps) {
  const pathsRef = useRef<Stroke[]>([]);
  const currentPathRef = useRef<any>(null);
  const colorRef = useRef(color);
  const widthRef = useRef(strokeWidth);
  colorRef.current = color;
  widthRef.current = strokeWidth;

  const touchHandler = useTouchHandler({
    onStart: ({ x, y }) => {
      const path = Skia.Path.Make();
      path.moveTo(x, y);
      currentPathRef.current = path;
    },
    onActive: ({ x, y }) => {
      if (currentPathRef.current) {
        currentPathRef.current.lineTo(x, y);
      }
    },
    onEnd: () => {
      if (currentPathRef.current) {
        pathsRef.current = [
          ...pathsRef.current,
          { path: currentPathRef.current, color: colorRef.current, width: widthRef.current },
        ];
        currentPathRef.current = null;
      }
    },
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Canvas style={{ width: size, height: size }} onTouch={touchHandler}>
        {pathsRef.current.map((stroke, i) => (
          <Path
            key={i}
            path={stroke.path}
            color={stroke.color}
            style="stroke"
            strokeWidth={stroke.width}
            strokeCap="round"
            strokeJoin="round"
          />
        ))}
        {currentPathRef.current && (
          <Path
            path={currentPathRef.current}
            color={colorRef.current}
            style="stroke"
            strokeWidth={widthRef.current}
            strokeCap="round"
            strokeJoin="round"
          />
        )}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 4,
    overflow: 'hidden',
  },
});
