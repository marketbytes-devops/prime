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
      className="p-6 mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl font-semibold mb-6 text-center">Profile</h2>
      {error && <p className="text-red-600 mb-4 text-center">{error}</p>}
      {message && <p className="text-green-600 mb-4 text-center">{message}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 shadow-xl">
          <h3 className="text-lg font-semibold mb-4">User Information</h3>
          <div className="space-y-4">
            <div>
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover mb-2 mx-auto"
                  onError={() => setImagePreview(null)}
                />
              )}
              <label className="block text-sm font-medium text-gray-700">Profile Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full p-2 border focus:border-none rounded focus:outline-none focus:ring focus:ring-gray-600 opacity-75"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full p-2 border rounded bg-gray-100 opacity-75"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={profile.name || ''}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full p-2 border focus:border-none rounded focus:outline-none focus:ring focus:ring-gray-600 opacity-75"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <input
                type="text"
                value={profile.username || ''}
                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                className="w-full p-2 border focus:border-none rounded focus:outline-none focus:ring focus:ring-gray-600 opacity-75"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <textarea
                value={profile.address || ''}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="w-full p-2 border focus:border-none rounded focus:outline-none focus:ring focus:ring-gray-600 opacity-75"
                rows="4"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input
                type="tel"
                value={profile.phone_number || ''}
                onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
                className="w-full p-2 border focus:border-none rounded focus:outline-none focus:ring focus:ring-gray-600 opacity-75"
              />
            </div>
            <button
              onClick={handleProfileUpdate}
              className="w-full p-2 bg-gray-900 text-white rounded hover:bg-gray-800 transition-opacity duration-200 opacity-90"
            >
              Update Profile
            </button>
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Change Password</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-2 border focus:border-none rounded focus:outline-none focus:ring focus:ring-gray-600 opacity-75"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChae={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-2 border focus:border-none rounded focus:outline-none focus:ring-2 focus:ring-gray-500 opacity-75"
              />
            </div>
            <button
              onClick={handlePasswordChange}
              className="w-full p-2 bg-gray-900 text-white rounded hover:bg-gray-800 transition-opacity duration-200 opacity-90"
            >
              Change Password
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Profile;