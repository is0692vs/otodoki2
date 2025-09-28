import React from 'react';
import {View, Text} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useAuth} from '../contexts';
import {RootStackParamList, AuthStackParamList, MainTabParamList} from '../types';

// Screen imports (will create these next)
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import SwipeScreen from '../screens/SwipeScreen';
import LibraryScreen from '../screens/LibraryScreen';

const RootStack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const MainTabs = createBottomTabNavigator<MainTabParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator 
      initialRouteName="Login"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1f2937',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <AuthStack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{title: 'ログイン'}}
      />
      <AuthStack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{title: '新規登録'}}
      />
    </AuthStack.Navigator>
  );
}

function MainTabNavigator() {
  return (
    <MainTabs.Navigator
      initialRouteName="Home"
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#1f2937',
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#9ca3af',
        headerStyle: {
          backgroundColor: '#1f2937',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <MainTabs.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: 'ホーム',
          tabBarLabel: 'ホーム',
        }}
      />
      <MainTabs.Screen 
        name="Swipe" 
        component={SwipeScreen}
        options={{
          title: 'スワイプ',
          tabBarLabel: 'スワイプ',
        }}
      />
      <MainTabs.Screen 
        name="Library" 
        component={LibraryScreen}
        options={{
          title: 'ライブラリ',
          tabBarLabel: 'ライブラリ',
        }}
      />
    </MainTabs.Navigator>
  );
}

export function AppNavigator() {
  const {isAuthenticated, status} = useAuth();

  // Show loading while checking authentication status
  if (status === 'checking') {
    return (
      <NavigationContainer>
        <RootStack.Navigator screenOptions={{headerShown: false}}>
          <RootStack.Screen 
            name="Login" 
            component={() => (
              <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827'}}>
                <Text style={{color: '#FFFFFF', fontSize: 16}}>読み込み中...</Text>
              </View>
            )} 
          />
        </RootStack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator 
        screenOptions={{headerShown: false}}
      >
        {isAuthenticated ? (
          <RootStack.Screen name="MainTabs" component={MainTabNavigator} />
        ) : (
          <RootStack.Screen name="Login" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}