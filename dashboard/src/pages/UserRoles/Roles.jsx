import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import apiClient from "../../helpers/apiClient";
import { Search, Trash2 } from "lucide-react";
import InputField from "../../components/InputField";
import Button from "../../components/Button";
import Loading from "../../components/Loading";

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get("/profile/");
        const user = response.data;
        setIsSuperadmin(user.is_superuser || user.role?.name === "Superadmin");
        const roleId = user.role?.id;
        if (roleId) {
          const res = await apiClient.get(`/roles/${roleId}/`);
          setPermissions(res.data.permissions || []);
        } else {
          setPermissions([]);
        }
      } catch (error) {
        console.error("Unable to fetch user profile:", error);
        setPermissions([]);
        setIsSuperadmin(false);
      } finally {
        setIsLoadingPermissions(false);
      }
    };
    fetchProfile();
    fetchRoles();
  }, []);

  const hasPermission = (page, action) => {
    if (isSuperadmin) return true;
    const perm = permissions.find((p) => p.page === page);
    return perm && perm[`can_${action}`];
  };

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("roles/");
      setRoles(response.data);
    } catch (error) {
      setError("Failed to fetch roles. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!hasPermission("roles", "add")) {
      setError("You do not have permission to create a role.");
      return;
    }
    if (!formData.name) {
      setError("Role name is required");
      return;
    }
    setIsCreating(true);
    try {
      const response = await apiClient.post("roles/", formData);
      setRoles([...roles, response.data]);
      setMessage("Role created successfully");
      setFormData({ name: "", description: "" });
    } catch (error) {
      setError(error.response?.data?.detail || "Failed to create role. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteRole = async (id) => {
    if (!hasPermission("roles", "delete")) {
      setError("You do not have permission to delete a role.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this role?")) {
      try {
        await apiClient.delete(`roles/${id}/`);
        setRoles(roles.filter((role) => role.id !== id));
        setMessage("Role deleted successfully");
      } catch (error) {
        setError("Failed to delete role. Please try again.");
      }
    }
  };

  const filteredRoles = roles.filter((role) =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading || isLoadingPermissions) {
    return <div className="flex justify-center items-center min-h-screen"><Loading /></div>;
  }

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
              disabled={isCreating || !hasPermission("roles", "add")}
              className={`w-full p-3 rounded-lg ${
                isCreating || !hasPermission("roles", "add")
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-indigo-500 text-white hover:bg-indigo-600"
              } transition duration-300`}
            >
              {isCreating ? "Creating..." : "Create Role"}
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
                        disabled={!hasPermission("roles", "delete")}
                        className={`flex items-center justify-center ${
                          hasPermission("roles", "delete")
                            ? "text-red-600 hover:text-red-800"
                            : "text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        <Trash2 className="w-5 h-5 mr-2" /> Delete
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