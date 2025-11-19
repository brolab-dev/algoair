import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import HomeScreen from '../screens/HomeScreen';
import HederaScreen from '../screens/HederaScreen';

// Tab Bar Component for Web
const WebTabBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, currentPath === '/' && styles.activeTab]}
        onPress={() => navigate('/')}
      >
        <Text style={styles.tabIcon}>🌿</Text>
        <Text style={[styles.tabLabel, currentPath === '/' && styles.activeTabLabel]}>
          Air Quality
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, currentPath === '/blockchain' && styles.activeTab]}
        onPress={() => navigate('/blockchain')}
      >
        <Text style={styles.tabIcon}>⛓️</Text>
        <Text style={[styles.tabLabel, currentPath === '/blockchain' && styles.activeTabLabel]}>
          Blockchain
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// Main Layout Component
const Layout = ({ children }) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {children}
      </View>
      <WebTabBar />
    </View>
  );
};

// Web Navigation Component
const WebNavigation = ({ onLogout }) => {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/blockchain" element={<HederaScreen onLogout={onLogout} />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom: 10,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    borderTopWidth: 2,
    borderTopColor: '#4CAF50',
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeTabLabel: {
    color: '#4CAF50',
    fontWeight: '600',
  },
});

export default WebNavigation;

