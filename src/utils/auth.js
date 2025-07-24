import api from "./api";


// Función para registrar un nuevo usuario en SecureFreeShare
const register = (email, password) => {
  return api.post('/auth/register', { email, password });
};

// Función para iniciar sesión en SecureFreeShare
const login = (email, password) => {
  return api.post('/auth/login', { email, password });
};

const AuthService = {
  register,
  login,
};

export default AuthService;