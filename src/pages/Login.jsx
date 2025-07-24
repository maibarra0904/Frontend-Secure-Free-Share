import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthService from '../utils/auth';
import { useAuth } from '../hooks/useAuth.js';
import Swal from 'sweetalert2';


const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth(); // Asegúrate de importar AuthContext

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await AuthService.login(email, password);
      login(response.data.jwtToken, response.data.email);
      
      // SweetAlert2 para éxito en login
      Swal.fire({
        icon: 'success',
        title: '¡Bienvenido!',
        text: `Has iniciado sesión correctamente como ${response.data.email}`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      
      // SweetAlert2 para errores de login
      const errorMessage = err.response && err.response.data && err.response.data.message 
        ? err.response.data.message 
        : 'Error al iniciar sesión. Verifica tus credenciales.';
      
      Swal.fire({
        icon: 'error',
        title: 'Error al iniciar sesión',
        text: errorMessage
      });
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md text-center">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Login - SecureFreeShare</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          <div>
            <label htmlFor="email" className="block text-left text-gray-700 font-semibold mb-2">Email:</label>
            <input
              type="email"
              id="email"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-left text-gray-700 font-semibold mb-2">Password:</label>
            <input
              type="password"
              id="password"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-500 mt-3 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white py-3 rounded-md font-bold text-lg hover:bg-blue-700 transition duration-300 ease-in-out mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-h-[48px]"
          >
            {loading ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Iniciando sesión...
              </span>
            ) : (
              'Login'
            )}
          </button>
        </form>
        <p className="mt-6 text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:underline font-semibold">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;