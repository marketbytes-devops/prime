import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import apiClient from '../../../helpers/apiClient';
import bgAuth from '../../../assets/images/bg-auth.avif';
import InputField from '../../../components/InputField';
import Button from '../../../components/Button';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState('request_otp');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleRequestOTP = (e) => {
    e.preventDefault();
    if (!email) {
      setError('Email is required');
      return;
    }
    apiClient
      .post('request-otp/', { email })
      .then((response) => {
        setMessage(response.data.message);
        setError('');
        setStep('reset_password');
      })
      .catch((error) => {
        setError(
          error.response?.data?.error || 'Failed to send OTP. Please try again.'
        );
      });
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      setError('OTP must be exactly 6 digits');
      return;
    }
    if (!email || !newPassword) {
      setError('Email and new password are required');
      return;
    }
    apiClient
      .post('reset-password/', { email, otp, new_password: newPassword })
      .then((response) => {
        setMessage(response.data.message);
        setError('');
        setTimeout(() => navigate('/login'), 2000);
      })
      .catch((error) => {
        setError(
          error.response?.data?.error ||
            'Failed to reset password. Please try again.'
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
          <h3 className="text-xl font-semibold text-gray-800 mb-2 opacity-90">
            Reset Your Password
          </h3>
          <p className="text-gray-600 text-center opacity-75">
            Enter your email to receive an OTP, then set your new password securely.
          </p>
        </div>
        <h2 className="text-2xl font-semibold mb-4 text-center opacity-90">
          {step === 'request_otp' ? 'Request OTP' : 'Reset Password'}
        </h2>
        {error && <p className="text-red-600 mb-4 text-center">{error}</p>}
        {message && <p className="text-green-600 mb-4 text-center">{message}</p>}
        {step === 'request_otp' ? (
          <div className="space-y-4">
            <InputField
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button
              onClick={handleRequestOTP}
              className="bg-gray-900 text-white hover:bg-gray-800"
            >
              Send OTP
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <InputField
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength="6"
              pattern="\d*"
              title="OTP must be 6 digits"
            />
            <InputField
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Button
              onClick={handleResetPassword}
              className="bg-gray-900 text-white hover:bg-gray-800"
            >
              Reset Password
            </Button>
          </div>
        )}
        <Button
          onClick={() => navigate('/login')}
          className="text-gray-600 hover:text-gray-800 mt-4"
        >
          Back to Login
        </Button>
      </div>
    </motion.div>
  );
};

export default ResetPassword;