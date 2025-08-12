import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import apiClient from "../../helpers/apiClient";
import { Search, Trash2 } from "lucide-react";
import InputField from "../../components/InputField";
import Button from "../../components/Button";

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await apiClient.get("roles/");
      setRoles(response.data);
    } catch (error) {
      setError("Failed to fetch roles");
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!formData.name) {
      setError("Role name is required");
      return;
    }
    try {
      const response = await apiClient.post("roles/", formData);
      setRoles([...roles, response.data]);
      setMessage("Role created successfully");
      setFormData({ name: "", description: "" });
    } catch (error) {
      setError(error.response?.data?.detail || "Failed to create role");
    }
  };

  const handleDeleteRole = async (id) => {
    if (window.confirm("Are you sure you want to delete this role?")) {
      try {
        await apiClient.delete(`roles/${id}/`);
        setRoles(roles.filter((role) => role.id !== id));
        setMessage("Role deleted successfully");
      } catch (error) {
        setError("Failed to delete role");
      }
    }
  };

  const filteredRoles = roles.filter((role) =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      className="min-h-screen p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-2xl font-bold mb-6">Roles Management</h1>
      <p className="text-gray-600 mb-8">Create and manage roles for users.</p>
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
          <h3 className="text-xl font-semibold mb-4">Create Role</h3>
          <form onSubmit={handleCreateRole} className="space-y-4">
            <InputField
              type="text"
              label="Role Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                rows="4"
              />
            </div>
            <Button
              type="submit"
              className="w-full p-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition duration-300"
            >
              Create Role
            </Button>
          </form>
        </motion.div>
        <motion.div
          className="bg-white rounded-2xl shadow-xl p-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-xl font-semibold mb-4">Existing Roles</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 items-center mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by role name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-3 pl-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <Button
              onClick={() => setSearchQuery("")}
              className="ml-4 p-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Clear Search
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left text-sm font-semibold">Role Name</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Description</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoles.map((role) => (
                  <tr key={role.id} className="border-b">
                    <td className="px-4 py-2">{role.name}</td>
                    <td className="px-4 py-2">{role.description || "-"}</td>
                    <td className="px-4 py-2">
                      <Button
                        onClick={() => handleDeleteRole(role.id)}
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
    </motion.div>
  );
};

export default Roles;
