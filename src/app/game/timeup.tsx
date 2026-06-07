import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../../constants/theme';

export default function TimeupScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/game/vote');
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>✏️</Text>
      <Text style={styles.text}>ペンを置け！</Text>
      <Text style={styles.sub}>Time's up!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 48,
    marginBottom: 12,
  },
  text: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
  },
  sub: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 8,
  },
});
