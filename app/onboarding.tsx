import { router } from 'expo-router';
import { Button, Text, View } from 'react-native';

export default function Onboarding() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Onboarding</Text>

      <Button
        title="Começar"
        onPress={() => router.push('/setup')}
      />
    </View>
  );
}