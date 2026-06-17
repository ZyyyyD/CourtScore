import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';

export default function Index() {
  const { session, isGuest } = useAuthStore();

  if (session || isGuest) {
    return <Redirect href="/(app)/home" />;
  }

  return <Redirect href="/(auth)/splash" />;
}
