import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ChatBot from './components/ChatBot';
import tunaService from './services/tunaService';
import authService from './services/authService';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ApplicationForm from './pages/ApplicationForm';
import ApplicationsList from './pages/ApplicationsList';
import Profile from './pages/Profile';

import './App.css';

function App() {
  const [tunaReady, setTunaReady] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [isInMiniApp, setIsInMiniApp] = useState(false);

  useEffect(() => {
    // Initialize Tuna SDK on app start
    const initTuna = async () => {
      const initialized = await tunaService.init();
      setTunaReady(initialized);
      setIsInMiniApp(tunaService.isInMiniApp());

      if (initialized && tunaService.isInMiniApp()) {
        // Get user info from MAX messenger
        const user = await tunaService.getUserInfo();
        setUserInfo(user);
        console.log('[App] Running in MAX mini-app, user:', user);
        
        // Expand to full height
        await tunaService.expand();
        
        // Auto-authenticate with Tuna
        if (user && user.id) {
          const authResult = await authService.authenticateWithTuna(user);
          if (authResult.success) {
            console.log('[Tuna] Auto-authenticated successfully');
          }
        }
      } else {
        console.log('[App] Running in web browser');
      }
    };

    initTuna();
  }, []);

  // Protected Route wrapper
  const ProtectedRoute = ({ children }) => {
    const isAuthenticated = authService.isAuthenticated();
    return isAuthenticated ? children : <Navigate to="/login" replace />;
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/applications/new" 
            element={
              <ProtectedRoute>
                <ApplicationForm />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/applications" 
            element={
              <ProtectedRoute>
                <ApplicationsList />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          
          {/* ChatBot for mini-app or testing */}
          <Route 
            path="/chat" 
            element={
              <ChatBot 
                tunaReady={tunaReady}
                userInfo={userInfo}
                isInMiniApp={isInMiniApp}
              />
            } 
          />
          
          {/* Default route */}
          <Route 
            path="/" 
            element={
              authService.isAuthenticated() 
                ? <Navigate to="/dashboard" replace />
                : <Navigate to="/login" replace />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
