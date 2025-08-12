import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "../../helpers/apiClient";
import { Search, Trash2, Edit } from "lucide-react";
import InputField from "../../components/InputField";
import Button from "../../components/Button";
import Modal from "../../components/Modal";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    role_id: "",
  });
  const [editUser, setEditUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get("users/");
      setUsers(response.data);
    } catch (error) {
      setError("Failed to fetch users. Please try again.");
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await apiClient.get("roles/");
      setRoles(response.data);
    } catch (error) {
      setError("Failed to fetch roles. Please try again.");
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const response = await apiClient.post("users/", {
        ...formData,
        role_id: parseInt(formData.role_id),
      });
      setUsers([...users, response.data]);
      setMessage("User created successfully");
      setFormData({
        email: "",
        name: "",
        role_id: "",
      });
    } catch (error) {
      setError(error.response?.data?.detail || "Failed to create user. Please try again.");
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const response = await apiClient.put(`users/${editUser.id}/`, {
        ...editUser,
        role_id: parseInt(editUser.role_id),
      });
      setUsers(users.map((user) => (user.id === editUser.id ? response.data : user)));
      setMessage("User updated successfully");
      setEditUser(null);
    } catch (error) {
      setError(error.response?.data?.detail || "Failed to update user. Please try again.");
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await apiClient.delete(`users/${id}/`);
        setUsers(users.filter((user) => user.id !== id));
        setMessage("User deleted successfully");
      } catch (error) {
        setError("Failed to delete user. Please try again.");
      }
    }
  };

  const openEditModal = (user) => {
    setEditUser({
      id: user.id,
      email: user.email,
      name: user.name,
      role_id: user.role?.id || "",
    });
  };

  const filteredUsers = users.filter(
    (user) => user.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      className="min-h-screen p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      <p className="text-gray-600 mb-8">Create and manage users and their roles.</p>
      {error && (
        <motion.p
          className="text-red-600 bg-red-50 p-4 rounded-xl text-center font-medium mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {error}
        </motion.p>
      )}
      {message && (
        <motion.p
          className="text-green-600 bg-green-50 p-4 rounded-xl text-center font-medium mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {message}
        </motion.p>
      )}
      <div className="grid grid-cols-1 gap-8">
        <motion.div
          className="bg-white rounded-2xl shadow-xl p-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-xl font-semibold mb-4">Create User</h3>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <InputField
              type="email"
              label="Email address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <InputField
              type="text"
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">User Role</label>
              <select
                value={formData.role_id}
                onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Select Role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="submit"
              className="w-full p-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition duration-300"
            >
              Create User
            </Button>
          </form>
        </motion.div>
        <motion.div
          className="bg-white rounded-2xl shadow-xl p-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-xl font-semibold mb-4">Existing Users</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 items-center mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-3 pl-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <Button
              onClick={() => setSearchQuery("")}
              className="ml-4 p-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Clear Filters
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left text-sm font-semibold">Email</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Name</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Role</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b">
                    <td className="px-4 py-2">{user.email}</td>
                    <td className="px-4 py-2">{user.name || "-"}</td>
                    <td className="px-4 py-2">{user.role?.name || "-"}</td>
                    <td className="px-4 py-2 flex space-x-2">
                      <Button
                        onClick={() => openEditModal(user)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="w-5 h-5" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
      <AnimatePresence>
        {editUser && (
          <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title="Edit User">
            <form onSubmit={handleEditUser} className="space-y-4">
              <InputField
                type="email"
                label="Email address"
                value={editUser.email}
                onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                required
              />
              <InputField
                type="text"
                label="Name"
                value={editUser.name}
                onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">User Role</label>
                <select
                  value={editUser.role_id}
                  onChange={(e) => setEditUser({ ...editUser, role_id: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select Role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="p-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="p-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
                >
                  Save
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Users;