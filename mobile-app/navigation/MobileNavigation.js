import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import HederaScreen from '../screens/HederaScreen';

const Tab = createBottomTabNavigator();

const MobileNavigation = ({ onLogout }) => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#4CAF50',
          tabBarInactiveTintColor: '#666',
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopWidth: 1,
            borderTopColor: '#e0e0e0',
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarLabel: 'Air Quality',
            tabBarIcon: ({ focused }) => (
              <Text style={{ fontSize: 24 }}>🌿</Text>
            ),
          }}
        />
        <Tab.Screen
          name="Hedera"
          options={{
            tabBarLabel: 'Blockchain',
            tabBarIcon: ({ focused }) => (
              <Text style={{ fontSize: 24 }}>⛓️</Text>
            ),
          }}
        >
          {() => <HederaScreen onLogout={onLogout} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default MobileNavigation;

