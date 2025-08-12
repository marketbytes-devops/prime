import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings } from "lucide-react";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import apiClient from "../../helpers/apiClient";

const Permissions = () => {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [permissions, setPermissions] = useState({});
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

  const openPermissionsModal = async (role) => {
    setSelectedRole(role);
    try {
      const response = await apiClient.get(`roles/${role.id}/`);
      const rolePermissions = response.data.permissions || [];
      const permissionsMap = {};
      rolePermissions.forEach((perm) => {
        permissionsMap[perm.page] = {
          view: perm.can_view,
          add: perm.can_add,
          edit: perm.can_edit,
          delete: perm.can_delete,
        };
      });
      setPermissions(permissionsMap);
    } catch (error) {
      setError("Failed to fetch permissions");
    }
  };

  const handlePermissionChange = (page, action) => {
    setPermissions((prev) => ({
      ...prev,
      [page]: {
        ...prev[page],
        [action]: !prev[page]?.[action],
      },
    }));
  };

  const handleSavePermissions = async () => {
    try {
      const permissionsToSave = Object.keys(permissions).map((page) => ({
        page,
        can_view: permissions[page].view,
        can_add: permissions[page].add,
        can_edit: permissions[page].edit,
        can_delete: permissions[page].delete,
      }));

      await apiClient.put(`roles/${selectedRole.id}/`, {
        ...selectedRole,
        permissions: permissionsToSave,
      });

      setMessage(`Permissions updated for ${selectedRole.name}`);
      setSelectedRole(null);
    } catch (error) {
      setError("Failed to update permissions");
    }
  };

  return (
    <motion.div
      className="min-h-screen p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-2xl font-bold mb-6">Permissions Management</h1>
      <p className="text-gray-600 mb-8">View and manage permissions for roles.</p>
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
      <motion.div
        className="bg-white rounded-2xl shadow-xl p-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h3 className="text-xl font-semibold mb-4">Existing Roles</h3>
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Role</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id} className="border-b">
                  <td className="px-4 py-2">{role.name}</td>
                  <td className="px-4 py-2">
                    <Button
                      onClick={() => openPermissionsModal(role)}
                      className="flex items-center justify-start w-fit text-indigo-600 hover:text-indigo-800"
                    >
                      <Settings className="w-5 h-5 mr-1" /> Permissions
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
      <AnimatePresence>
        {selectedRole && (
          <Modal
            isOpen={!!selectedRole}
            onClose={() => setSelectedRole(null)}
            title={`Permissions for ${selectedRole.name}`}
          >
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left">Page</th>
                    <th className="px-4 py-2 text-center">View</th>
                    <th className="px-4 py-2 text-center">Add</th>
                    <th className="px-4 py-2 text-center">Edit</th>
                    <th className="px-4 py-2 text-center">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(permissions).map((page) => (
                    <tr key={page} className="border-b">
                      <td className="px-4 py-2">{page}</td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={permissions[page]?.view || false}
                          onChange={() => handlePermissionChange(page, "view")}
                          className="h-5 w-5"
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={permissions[page]?.add || false}
                          onChange={() => handlePermissionChange(page, "add")}
                          className="h-5 w-5"
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={permissions[page]?.edit || false}
                          onChange={() => handlePermissionChange(page, "edit")}
                          className="h-5 w-5"
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={permissions[page]?.delete || false}
                          onChange={() => handlePermissionChange(page, "delete")}
                          className="h-5 w-5"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <Button
                onClick={() => setSelectedRole(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSavePermissions}
                className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
              >
                Save
              </Button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Permissions;
