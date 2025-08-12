import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import apiClient from '../../helpers/apiClient';
import { Camera, User, MapPin } from 'lucide-react';
import InputField from '../../components/InputField';
import Button from '../../components/Button';

const Profile = () => {
  const [profile, setProfile] = useState({
    email: '',
    name: '',
    username: '',
    address: '',
    phone_number: '',
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    apiClient
      .get('profile/')
      .then((response) => {
        const data = response.data || {};
        setProfile({
          email: data.email || '',
          name: data.name || '',
          username: data.username || '',
          address: data.address || '',
          phone_number: data.phone_number || '',
          image: data.image || null,
        });
        setImagePreview(data.image || null);
      })
      .catch((error) => {
        setError('Failed to fetch profile data');
        console.error(error);
      });
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfile({ ...profile, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const formData = new FormData();
    Object.keys(profile).forEach((key) => {
      if (profile[key] !== null) {
        formData.append(key, profile[key] instanceof File ? profile[key] : String(profile[key] || ''));
      }
    });

    apiClient
      .put('profile/', formData)
      .then((response) => {
        setProfile(response.data || {});
        setImagePreview(response.data.image || null);
        setMessage('Profile updated successfully');
      })
      .catch((error) => {
        setError(error.response?.data?.detail || 'Failed to update profile');
      });
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setMessage('');

    const formData = new FormData();
    formData.append('new_password', newPassword);
    formData.append('confirm_password', confirmPassword);

    apiClient
      .put('profile/', formData)
      .then(() => {
        setMessage('Password changed successfully');
        setNewPassword('');
        setConfirmPassword('');
      })
      .catch((error) => {
        setError(error.response?.data?.detail || 'Failed to change password');
      });
  };

  return (
    <motion.div
      className="min-h-screen p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-semibold text-gray-900 mb-8">Profile Settings</h1>
        </motion.div>

        {/* Messages */}
        {error && (
          <motion.div
            className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </motion.div>
        )}
        {message && (
          <motion.div
            className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-green-600 text-sm font-medium">{message}</p>
          </motion.div>
        )}

        {/* Profile Header Card */}
        <motion.div
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6"
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-start space-x-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-4 border-indigo-100">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 bg-indigo-500 hover:bg-indigo-600 rounded-full p-1.5 cursor-pointer transition-colors">
                <Camera className="w-3 h-3 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">
                {profile.name}
              </h2>
              <p className="text-gray-600 text-sm flex items-center mt-1">
                <MapPin className="w-4 h-4 mr-1" />
                {profile.address}
              </p>
            </div>
          </div>
        </motion.div>

        {/* User Information Block */}
        <motion.div
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6"
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">User Information</h3>
          <div className="space-y-6">
            <div className="flex flex-col items-center">
              {imagePreview && (
                <motion.img
                  src={imagePreview}
                  alt="Profile"
                  className="w-28 h-28 rounded-full object-cover mb-4 border-4 border-indigo-100 shadow-sm"
                  onError={() => setImagePreview(null)}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.4 }}
                />
              )}
              <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300 bg-gray-50"
              />
            </div>
            <InputField
              label="Email Address"
              type="email"
              value={profile.email}
              readOnly
              className="w-full p-3 bg-gray-100 text-gray-600 cursor-not-allowed"
            />
            <InputField
              label="Name"
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300 bg-gray-50"
            />
            <InputField
              label="Username"
              type="text"
              value={profile.username}
              onChange={(e) => setProfile({ ...profile, username: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300 bg-gray-50"
            />
            <InputField
              label="Address"
              type="text"
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300 bg-gray-50"
            />
            <InputField
              label="Phone Number"
              type="tel"
              value={profile.phone_number}
              onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300 bg-gray-50"
            />
            <Button
              onClick={handleProfileUpdate}
              className="w-full p-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition duration-300 font-medium"
            >
              Update Profile
            </Button>
          </div>
        </motion.div>

        {/* Change Password Block */}
        <motion.div
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6"
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Change Password</h3>
          <div className="space-y-6">
            <InputField
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300 bg-gray-50"
            />
            <InputField
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300 bg-gray-50"
            />
            <Button
              onClick={handlePasswordChange}
              className="w-full p-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition duration-300 font-medium"
            >
              Change Password
            </Button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Profile;