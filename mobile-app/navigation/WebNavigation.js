import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import HomeScreen from '../screens/HomeScreen';
import PollutantDetailsScreen from '../screens/PollutantDetailsScreen';
import HederaScreen from '../screens/HederaScreen';

const tabItems = [
  { path: '/', label: 'Air Quality', icon: '🌿' },
  { path: '/pollutants', label: 'Pollutants', icon: '🔬' },
  { path: '/blockchain', label: 'Blockchain', icon: '⛓️' },
];

// Pure HTML tab bar for web
const WebTabBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e0e0e0',
        boxShadow: '0 -2px 6px rgba(0,0,0,0.1)',
        zIndex: 100,
      }}
    >
      {tabItems.map((tab) => {
        const isActive = currentPath === tab.path;
        return (
          <div
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: 10,
              paddingBottom: 10,
              cursor: 'pointer',
              borderTop: isActive ? '2px solid #4CAF50' : '2px solid transparent',
            }}
          >
            <span style={{ fontSize: 24, marginBottom: 4 }}>{tab.icon}</span>
            <span
              style={{
                fontSize: 12,
                color: isActive ? '#4CAF50' : '#666',
                fontWeight: isActive ? '600' : '500',
              }}
            >
              {tab.label}
            </span>
          </div>
        );
      })}
    </div>
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
          <Route path="/pollutants" element={<PollutantDetailsScreen />} />
          <Route path="/blockchain" element={<HederaScreen onLogout={onLogout} />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    paddingBottom: 70,
  },
});

export default WebNavigation;
