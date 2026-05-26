import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import EpisodesScreen from './src/screens/EpisodesScreen';
import PlayerScreen from './src/screens/PlayerScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerTitleAlign: 'center',
          contentStyle: { backgroundColor: '#f5f7fb' },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: '\u77ed\u5267\u5217\u8868' }}
        />
        <Stack.Screen
          name="Episodes"
          component={EpisodesScreen}
          options={({ route }) => ({
            title: route.params?.drama?.title || '\u5206\u96c6',
          })}
        />
        <Stack.Screen
          name="Player"
          component={PlayerScreen}
          options={({ route }) => ({
            title: route.params?.episode?.title || '\u64ad\u653e\u9875',
            headerBackTitleVisible: false,
            headerBackTitle: '\u8fd4\u56de',
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
