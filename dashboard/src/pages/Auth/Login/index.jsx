import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import apiClient from '../../../helpers/apiClient';
import bgAuth from '../../../assets/images/bg-auth.avif';
import InputField from '../../../components/InputField';
import Button from '../../../components/Button';

const Login = ({ setIsAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('isAuthenticated');

    apiClient
      .post('login/', { email, password })
      .then((response) => {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('access_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);
        setIsAuthenticated(true);
        navigate('/');
      })
      .catch((error) => {
        setError(
          error.response?.data?.detail || 'Login failed. Please try again.'
        );
      });
  };

  return (
    <motion.div
      className="min-h-screen bg-gray-100 flex items-center justify-end p-6"
      style={{
        backgroundImage: `url(${bgAuth})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="bg-white bg-opacity-90 p-6 rounded-lg shadow-md w-full max-w-sm">
        <div className="flex flex-col justify-center items-center mb-4">
          <h3 className="text-xl font-semibold text-indigo-500 mb-2 opacity-90">
            Welcome Back!
          </h3>
          <p className="text-gray-600 text-center opacity-75">
            Log in to access your profile and manage your account securely.
          </p>
        </div>
        <h2 className="text-2xl text-indigo-500 font-semibold mb-4 text-center">
          Login
        </h2>
        {error && <p className="text-red-600 mb-4 text-center">{error}</p>}
        <div className="space-y-4">
          <InputField
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <InputField
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            onClick={handleLogin}
            className="bg-indigo-500 text-white hover:bg-indigo-600"
          >
            Login
          </Button>
          <Button
            onClick={() => navigate('/reset-password')}
            className="text-gray-600 hover:text-indigo-600"
          >
            Forgot Password?
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default Login;