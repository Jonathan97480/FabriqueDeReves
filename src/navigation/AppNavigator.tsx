/**
 * AppNavigator.tsx
 * Configuration de la navigation de l'application
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import CharacterSelectionScreen from '../screens/CharacterSelectionScreen';
import StoryScreen from '../screens/StoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { colors } from '../theme/colors';

export type RootStackParamList = {
  CharacterSelection: undefined;
  Story: { characterId: string };
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="CharacterSelection"
        screenOptions={{
          headerShown: false,
          cardStyle: {
            backgroundColor: colors.background.primary,
          },
          cardStyleInterpolator: ({ current, layouts }) => {
            return {
              cardStyle: {
                transform: [
                  {
                    translateX: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.width, 0],
                    }),
                  },
                ],
              },
            };
          },
        }}
      >
        <Stack.Screen
          name="CharacterSelection"
          component={CharacterSelectionScreen}
          options={{
            title: 'La Fabrique à Rêves',
          }}
        />
        <Stack.Screen
          name="Story"
          component={StoryScreen}
          options={{
            title: 'Plume & Rêve',
          }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title: 'Réglages IA',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;