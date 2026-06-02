import React from 'react';
import { Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../utils/constants';

import LoginScreen from '../screens/LoginScreen';
import OrdersScreen from '../screens/OrdersScreen';
import DeliveryScreen from '../screens/DeliveryScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  const { isLoggedIn } = useAuth();

  return (
    <NavigationContainer>
      {isLoggedIn ? (
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ focused }) => {
              let iconName;
              if (route.name === 'Orders') iconName = '📦';
              else if (route.name === 'Delivery') iconName = '🛵';
              else if (route.name === 'History') iconName = '🕒';
              else if (route.name === 'Profile') iconName = '👤';

              return (
                <Text style={{ fontSize: 24 }}>
                  {iconName}
                </Text>
              );
            },
            tabBarActiveTintColor: COLORS.primary,
            tabBarInactiveTintColor: COLORS.textLight,
            tabBarStyle: {
              backgroundColor: COLORS.cardBackground,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingBottom: 10,
              paddingTop: 10,
              height: 70,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -5 },
              shadowOpacity: 0.05,
              shadowRadius: 10,
              elevation: 10,
              position: 'absolute'
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '600'
            }
          })}
        >
          <Tab.Screen name="Orders" component={OrdersScreen} options={{ tabBarLabel: 'Đơn hàng' }} />
          <Tab.Screen name="Delivery" component={DeliveryScreen} options={{ tabBarLabel: 'Giao hàng' }} />
          <Tab.Screen name="History" component={HistoryScreen} options={{ tabBarLabel: 'Lịch sử' }} />
          <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Tài khoản' }} />
        </Tab.Navigator>
      ) : (
        <LoginScreen />
      )}
    </NavigationContainer>
  );
}
