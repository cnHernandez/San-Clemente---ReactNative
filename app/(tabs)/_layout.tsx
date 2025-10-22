import { Tabs } from 'expo-router';
import React from 'react';
import { TouchableOpacity, Text } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 28, color }}>🏠</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Fotos',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 28, color }}>📷</Text>
          ),
          headerShown: true,
          headerTitle: 'Galería de Fotos',
          headerRight: () => (
            <TouchableOpacity 
              style={{ marginRight: 15, padding: 5 }}
              onPress={() => console.log('Botón cámara presionado')}
            >
              <Text style={{ fontSize: 24, color: Colors[colorScheme ?? 'light'].tint }}>
                📷
              </Text>
            </TouchableOpacity>
          ),
        }}
      />
    </Tabs>
  );
}
