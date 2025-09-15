import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings } from "lucide-react";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import apiClient from "../../helpers/apiClient";
import Loading from "../../components/Loading";

const Permissions = () => {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [permissionsData, setPermissionsData] = useState([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);

  const pageNameMap = {
    Dashboard: { apiName: "Dashboard", displayName: "Dashboard" },
    Profile: { apiName: "Profile", displayName: "Profile" },
    rfq: { apiName: "rfq", displayName: "RFQ" },
    quotation: { apiName: "quotation", displayName: "Quotation" },
    purchase_orders: { apiName: "purchase_orders", displayName: "Purchase Orders" },
    work_orders: { apiName: "work_orders", displayName: "Work Orders" },
    processing_work_orders: { apiName: "processing_work_orders", displayName: "Processing Work Orders" },
    manager_approval: { apiName: "manager_approval", displayName: "Manager Approval" },
    delivery: { apiName: "delivery", displayName: "Delivery" },
    close_work_orders: { apiName: "close_work_orders", displayName: "Close Work Orders" },
    pending_invoices: { apiName: "pending_invoices", displayName: "Pending Invoices" },
    raised_invoices: { apiName: "raised_invoices", displayName: "Raised Invoices" },
    processed_invoices: { apiName: "processed_invoices", displayName: "Processed Invoices" },
    // completed_work_orders: { apiName: "completed_work_orders", displayName: "Completed Work Orders" },
    series: { apiName: "series", displayName: "Series" },
    rfq_channel: { apiName: "rfq_channel", displayName: "RFQ Channel" },
    item: { apiName: "item", displayName: "Item" },
    unit: { apiName: "unit", displayName: "Unit" },
    team: { apiName: "team", displayName: "Team" },
    users: { apiName: "users", displayName: "Users" },
    roles: { apiName: "roles", displayName: "Roles" },
    permissions: { apiName: "permissions", displayName: "Permissions" },
    job_execution: { apiName: "job_execution", displayName: "Job Execution" },
    post_job_phase: { apiName: "post_job_phase", displayName: "Post Job Phase" },
    additional_settings: { apiName: "additional_settings", displayName: "Additional Settings" },
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get("/profile/");
        const user = response.data;
        setIsSuperadmin(user.is_superuser || user.role?.name === "Superadmin");
        const roleId = user.role?.id;
        if (roleId) {
          const res = await apiClient.get(`/roles/${roleId}/`);
          setPermissionsData(res.data.permissions || []);
        } else {
          setPermissionsData([]);
        }
      } catch (error) {
        console.error("Unable to fetch user profile:", error);
        setPermissionsData([]);
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
    const perm = permissionsData.find((p) => p.page === page);
    return perm && perm[`can_${action}`];
  };

  const fetchRoles = async () => {
    try {
      const response = await apiClient.get("roles/");
      setRoles(response.data);
    } catch (error) {
      setError("Failed to fetch roles. Please try again.");
    }
  };

  const openPermissionsModal = async (role) => {
    if (!hasPermission("permissions", "edit")) {
      setError("You do not have permission to edit permissions.");
      return;
    }
    setSelectedRole(role);
    try {
      const response = await apiClient.get(`roles/${role.id}/`);
      const rolePermissions = response.data.permissions || [];
      const permissionsMap = Object.keys(pageNameMap).reduce((acc, key) => {
        acc[key] = { id: null, view: false, add: false, edit: false, delete: false };
        return acc;
      }, {});
      rolePermissions.forEach((perm) => {
        const pageKey = Object.keys(pageNameMap).find(
          (key) => pageNameMap[key].apiName === perm.page
        );
        if (pageKey) {
          permissionsMap[pageKey] = {
            id: perm.id,
            view: perm.can_view,
            add: perm.can_add,
            edit: perm.can_edit,
            delete: perm.can_delete,
          };
        }
      });
      setPermissions(permissionsMap);
    } catch (error) {
      setError("Failed to fetch permissions. Please try again.");
    }
  };

  const handlePermissionChange = (page, action) => {
    setPermissions((prev) => ({
      ...prev,
      [page]: {
        ...prev[page],
        [action]: !prev[page][action],
      },
    }));
  };

  const handleSavePermissions = async () => {
    if (!hasPermission("permissions", "edit")) {
      setError("You do not have permission to edit permissions.");
      return;
    }
    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      const updatePromises = Object.keys(permissions).map(async (page) => {
        const perm = permissions[page];
        const apiPageName = pageNameMap[page].apiName;
        if (perm.id) {
          return apiClient.put(`permissions/${perm.id}/`, {
            role: selectedRole.id,
            page: apiPageName,
            can_view: perm.view,
            can_add: perm.add,
            can_edit: perm.edit,
            can_delete: perm.delete,
          });
        } else {
          return apiClient.post(`permissions/`, {
            role: selectedRole.id,
            page: apiPageName,
            can_view: perm.view,
            can_add: perm.add,
            can_edit: perm.edit,
            can_delete: perm.delete,
          });
        }
      });
      await Promise.all(updatePromises);
      setMessage(`Permissions updated for ${selectedRole.name}`);
      setSelectedRole(null);
    } catch (error) {
      console.error("Save Permissions Error:", error);
      setError("Failed to update permissions. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingPermissions) {
    return <div className="flex justify-center items-center min-h-screen"><Loading /></div>;
  }

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
                      disabled={!hasPermission("permissions", "edit")}
                      className={`flex items-center justify-start ${
                        hasPermission("permissions", "edit")
                          ? "text-indigo-600 hover:text-indigo-800"
                          : "text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <Settings className="w-5 h-5 mr-2" /> Permissions
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
                      <td className="px-4 py-2">{pageNameMap[page].displayName}</td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={permissions[page]?.view || false}
                          onChange={() => handlePermissionChange(page, "view")}
                          className="h-5 w-5"
                          disabled={!hasPermission("permissions", "edit")}
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={permissions[page]?.add || false}
                          onChange={() => handlePermissionChange(page, "add")}
                          className="h-5 w-5"
                          disabled={!hasPermission("permissions", "edit")}
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={permissions[page]?.edit || false}
                          onChange={() => handlePermissionChange(page, "edit")}
                          className="h-5 w-5"
                          disabled={!hasPermission("permissions", "edit")}
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={permissions[page]?.delete || false}
                          onChange={() => handlePermissionChange(page, "delete")}
                          className="h-5 w-5"
                          disabled={!hasPermission("permissions", "edit")}
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
                disabled={isSaving || !hasPermission("permissions", "edit")}
                className={`px-4 py-2 rounded-lg ${
                  isSaving || !hasPermission("permissions", "edit")
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-indigo-500 text-white hover:bg-indigo-600"
                }`}
              >
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Permissions;