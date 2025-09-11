import { Menu, X, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import apiClient from '../../helpers/apiClient';
import placeholderImage from '../../assets/images/placeholder-profile.webp';

const Topbar = ({ toggleSidebar, isSidebarOpen, isAuthenticated, setIsAuthenticated, user }) => {
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    if (isAuthenticated && user?.image) {
      setProfileImage(user.image);
    } else if (isAuthenticated) {
      apiClient
        .get('profile/')
        .then((response) => {
          setProfileImage(response.data.image || null);
        })
        .catch((error) => {
          console.error('Error fetching profile image:', error);
        });
    }
  }, [isAuthenticated, user]);

  return (
    <motion.div
      className="flex items-center justify-between p-4 bg-white text-black shadow-md"
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.1 }}
    >
      <div className="flex items-center space-x-2">
        <button
          className="p-2 rounded transition-opacity duration-200 opacity-75 hover:bg-indigo-400 hover:text-gray-100 hover:opacity-100"
          onClick={toggleSidebar}
        >
          {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>
      <div className="flex items-center space-x-4">
        {isAuthenticated && user?.username ? (
          <span className="hidden sm:block opacity-75">{user.username}</span>
        ) : (
          <span className="hidden sm:block opacity-75 text-indigo-500">Guest</span>
        )}
        {isAuthenticated && profileImage ? (
          <img
            src={profileImage}
            alt="Profile"
            className="w-8 h-8 rounded-full object-cover opacity-80"
            onError={() => setProfileImage(null)}
          />
        ) : (
          <img
            src={placeholderImage}
            alt="Placeholder Profile"
            className="w-8 h-8 rounded-full object-cover opacity-80"
          />
        )}
        {isAuthenticated && (
          <button
            onClick={() => {
              localStorage.removeItem('isAuthenticated');
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              setIsAuthenticated(false);
            }}
            className="flex items-center space-x-2 px-4 py-2 rounded text-sm text-black hover:bg-indigo-500 hover:text-gray-100 transition-colors duration-300 opacity-90"
          >
            <LogOut size={12} />
            <span>Logout</span>
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default Topbar;