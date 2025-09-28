// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
import Login from './components/Login';
import Register from './components/Register';
import ScriptList from './components/ScriptList';
import ScriptEditor from './components/ScriptEditor';
import PrivateRoute from './components/PrivateRoute';
import './index.css';

axios.defaults.baseURL = 'http://127.0.0.1:8000';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if a token exists in localStorage on every app load
    const token = localStorage.getItem('access_token');
    if (token) {
      // If it exists, set the login state to true
      setIsLoggedIn(true);
      // And configure Axios to send the token with all future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []); // The empty array ensures this effect runs only once on mount

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsLoggedIn(false);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-100 font-sans">
        <nav className="flex justify-between items-center bg-gray-800 text-white p-4 shadow-lg">
          <h1 className="text-2xl font-bold">CodePT</h1>
          <div className="space-x-4">
            {isLoggedIn ? (
              <>
                <Link to="/" className="hover:text-gray-300 transition duration-300">My Scripts</Link>
                <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 transition duration-300 text-white py-2 px-4 rounded-lg font-semibold">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-gray-300 transition duration-300">Login</Link>
                <Link to="/register" className="hover:text-gray-300 transition duration-300">Register</Link>
              </>
            )}
          </div>
        </nav>
        <main className="container mx-auto p-8">
          <Routes>
            <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <PrivateRoute isLoggedIn={isLoggedIn}>
                  <ScriptList />
                </PrivateRoute>
              }
            />
            <Route
              path="/script/:id?"
              element={
                <PrivateRoute isLoggedIn={isLoggedIn}>
                  <ScriptEditor />
                </PrivateRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;