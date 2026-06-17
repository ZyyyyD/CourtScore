import { Stack } from 'expo-router';
import { Colors } from '../../src/theme/colors';

export default function MatchLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    />
  );
}
