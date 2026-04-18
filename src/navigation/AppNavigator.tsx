/**
 * AppNavigator.tsx
 * Configuration de la navigation de l'application
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import GuidedHeroSelectionScreen from '../screens/GuidedHeroSelectionScreen';
import GuidedSceneBuilderScreen from '../screens/GuidedSceneBuilderScreen';
import ModeSelectionScreen from '../screens/ModeSelectionScreen';
import CharacterSelectionScreen from '../screens/CharacterSelectionScreen';
import StoryScreen from '../screens/StoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { GuidedSceneTemplate, StoryMode } from '../types';
import { colors } from '../theme/colors';

export type RootStackParamList = {
  ModeSelection: undefined;
  CharacterSelection: { mode?: StoryMode } | undefined;
  GuidedHeroSelection: undefined;
  GuidedSceneBuilder: {
    characterId: string;
    totalScenes: number;
    sceneIndex: number;
    guidedScenes: GuidedSceneTemplate[];
  };
  Story: { characterId: string; mode?: StoryMode; guidedScenes?: GuidedSceneTemplate[] };
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="ModeSelection"
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
          name="ModeSelection"
          component={ModeSelectionScreen}
          options={{
            title: 'La Fabrique à Rêves',
          }}
        />
        <Stack.Screen
          name="CharacterSelection"
          component={CharacterSelectionScreen}
          options={{
            title: 'La Fabrique à Rêves',
          }}
        />
        <Stack.Screen
          name="GuidedHeroSelection"
          component={GuidedHeroSelectionScreen}
          options={{
            title: 'Choisir un héros',
          }}
        />
        <Stack.Screen
          name="GuidedSceneBuilder"
          component={GuidedSceneBuilderScreen}
          options={{
            title: 'Composer les scènes',
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