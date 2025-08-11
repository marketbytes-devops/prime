import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import apiClient from '../../helpers/apiClient';

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
        setProfile(response.data);
        setImagePreview(response.data.image || null);
      })
      .catch((error) => {
        setError('Failed to fetch profile data');
        console.error(error);
      });
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
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
    formData.append('email', profile.email);
    formData.append('name', profile.name || '');
    formData.append('username', profile.username || '');
    formData.append('address', profile.address || '');
    formData.append('phone_number', profile.phone_number || '');
    if (profile.image instanceof File) {
      formData.append('image', profile.image);
    } else if (!profile.image) {
      formData.append('image', '');
    }

    apiClient
      .put('profile/', formData)
      .then((response) => {
        setProfile(response.data);
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
    apiClient
      .post('change-password/', { new_password: newPassword, confirm_password: confirmPassword })
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
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 sm:p-6 lg:p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="w-full space-y-8">
        <h1 className="text-2xl font-bold mb-4">Profile Settings</h1>
        {error && (
          <motion.p
            className="text-red-600 bg-red-50 p-4 rounded-xl text-center font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {error}
          </motion.p>
        )}
        {message && (
          <motion.p
            className="text-green-600 bg-green-50 p-4 rounded-xl text-center font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {message}
          </motion.p>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Information Block */}
          <motion.div
            className="bg-white rounded-2xl shadow-xl p-6 sm:p-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">User Information</h3>
            <div className="space-y-6">
              <div className="flex flex-col items-center">
                {imagePreview && (
                  <motion.img
                    src={imagePreview}
                    alt="Profile"
                    className="w-28 h-28 rounded-full object-cover mb-4 border-4 border-blue-100 shadow-sm"
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full p-3 border border-gray-200 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={profile.name || ''}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300 bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  value={profile.username || ''}
                  onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300 bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <textarea
                  value={profile.address || ''}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300 bg-gray-50 resize-none"
                  rows="4"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={profile.phone_number || ''}
                  onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300 bg-gray-50"
                />
              </div>
              <motion.button
                onClick={handleProfileUpdate}
                className="w-full p-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition duration-300 font-medium"
              >
                Update Profile
              </motion.button>
            </div>
          </motion.div>

          {/* Change Password Block */}
          <motion.div
            className="bg-white rounded-2xl shadow-xl p-6 sm:p-8"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">Change Password</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300 bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300 bg-gray-50"
                />
              </div>
              <motion.button
                onClick={handlePasswordChange}
                className="w-full p-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition duration-300 font-medium"
              >
                Change Password
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Profile;