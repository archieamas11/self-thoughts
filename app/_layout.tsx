import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { JournalProvider } from '../contexts/JournalContext';

export default function RootLayout() {
  return (
    <JournalProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </JournalProvider>
  );
}