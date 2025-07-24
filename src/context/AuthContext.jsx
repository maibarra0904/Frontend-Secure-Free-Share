import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext.js';
import LoadingSpinner from '../components/LoadingSpinner';

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null); // Aquí almacenarás el email del usuario logueado
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      setIsAuthenticated(true);
      const userEmail = localStorage.getItem('userEmail');
      setUser({ email: userEmail }); // Carga el email del usuario si hay token
    }
    setLoading(false);
  }, []);

  const login = (token, email) => {
    localStorage.setItem('jwtToken', token);
    localStorage.setItem('userEmail', email);
    setIsAuthenticated(true);
    setUser({ email: email });
    navigate('/'); // Redirige a la página principal de SecureFreeShare después del login
  };

  const logout = () => {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('userEmail');
    setIsAuthenticated(false);
    setUser(null);
    navigate('/login'); // Redirige a la página de login de SecureFreeShare después del logout
  };

  if (loading) {
    return <LoadingSpinner size="large" text="Inicializando SecureFreeShare..." fullScreen={true} />;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};