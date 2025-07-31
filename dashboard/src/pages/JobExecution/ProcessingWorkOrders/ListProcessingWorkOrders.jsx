import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import apiClient from "../../../helpers/apiClient";
import InputField from "../../../components/InputField";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";

const ListProcessingWorkOrders = () => {
  const navigate = useNavigate();
  const [state, setState] = useState({
    workOrders: [],
    itemsList: [],
    units: [],
    searchTerm: "",
    sortBy: "created_at",
    currentPage: 1,
    itemsPerPage: 20,
    isModalOpen: false,
    selectedWO: null,
    items: [],
  });

  const fetchWorkOrders = async () => {
    try {
      const [woRes, itemsRes, unitsRes] = await Promise.all([
        apiClient.get("work-orders/", { params: { status: "Submitted" } }),
        apiClient.get("items/"),
        apiClient.get("units/"),
      ]);
      setState((prev) => ({
        ...prev,
        workOrders: woRes.data || [],
        itemsList: itemsRes.data || [],
        units: unitsRes.data || [],
      }));
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load work orders.");
    }
  };

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const handleUpdateWO = (wo) => {
    setState((prev) => ({
      ...prev,
      isModalOpen: true,
      selectedWO: wo,
      items: wo.items || [],
    }));
  };

  const handleItemChange = (index, field, value) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleMoveToApproval = async () => {
    try {
      await apiClient.post(`work-orders/${state.selectedWO.id}/move_to_approval/`);
      toast.success("Work Order moved to Manager Approval.");
      setState((prev) => ({
        ...prev,
        isModalOpen: false,
        selectedWO: null,
        items: [],
      }));
      fetchWorkOrders();
    } catch (error) {
      console.error("Error moving to approval:", error);
      toast.error("Failed to move Work Order to approval.");
    }
  };

  const filteredWOs = state.workOrders
    .filter((wo) =>
      (wo.wo_number || "").toLowerCase().includes(state.searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (state.sortBy === "created_at") {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      return 0;
    });

  const totalPages = Math.ceil(filteredWOs.length / state.itemsPerPage);
  const startIndex = (state.currentPage - 1) * state.itemsPerPage;
  const currentWOs = filteredWOs.slice(startIndex, startIndex + state.itemsPerPage);

  return (
    <div className="mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Processing Work Orders</h1>
      <div className="bg-white p-4 space-y-4 rounded-md shadow w-full">
        <div className="mb-6 flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Work Orders</label>
            <InputField
              type="text"
              placeholder="Search by WO Number..."
              value={state.searchTerm}
              onChange={(e) => setState((prev) => ({ ...prev, searchTerm: e.target.value }))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={state.sortBy}
              onChange={(e) => setState((prev) => ({ ...prev, sortBy: e.target.value }))}
              className="p-2 border rounded focus:outline-indigo-500"
            >
              <option value="created_at">Creation Date</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left text-sm font-medium text-gray-700">Sl No</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700">Created At</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700">WO Number</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700">Assigned To</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700">Equipment Collection Status</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentWOs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="border p-2 text-center text-gray-500">
                    No processing work orders found.
                  </td>
                </tr>
              ) : (
                currentWOs.map((wo, index) => (
                  <tr key={wo.id} className="border hover:bg-gray-50">
                    <td className="border p-2">{startIndex + index + 1}</td>
                    <td className="border p-2">{new Date(wo.created_at).toLocaleDateString()}</td>
                    <td className="border p-2">{wo.wo_number || "N/A"}</td>
                    <td className="border p-2">{wo.assigned_to_name || "N/A"}</td>
                    <td className="border p-2">{wo.equipment_collection_status || "Pending"}</td>
                    <td className="border p-2">
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleUpdateWO(wo)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                        >
                          Update WO
                        </Button>
                        <Button
                          onClick={() => navigate(`/view-work-order/${wo.id}`)}
                          className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                        >
                          View WO
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Modal
        isOpen={state.isModalOpen}
        onClose={() => setState((prev) => ({ ...prev, isModalOpen: false, selectedWO: null, items: [] }))}
        title="Update Work Order"
      >
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-black">Device Under Test Details</h3>
          {state.items.map((item, index) => (
            <div key={index} className="border p-4 rounded-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
                <select
                  value={item.item}
                  onChange={(e) => handleItemChange(index, "item", e.target.value)}
                  className="p-2 border rounded w-full"
                >
                  <option value="">Select Item</option>
                  {state.itemsList.map((i) => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <InputField
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <select
                  value={item.unit}
                  onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                  className="p-2 border rounded w-full"
                >
                  <option value="">Select Unit</option>
                  {state.units.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Number</label>
                <InputField
                  type="text"
                  value={item.certificate_number}
                  onChange={(e) => handleItemChange(index, "certificate_number", e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Calibration Date</label>
                <InputField
                  type="date"
                  value={item.calibration_date}
                  onChange={(e) => handleItemChange(index, "calibration_date", e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Calibration Due Date</label>
                <InputField
                  type="date"
                  value={item.calibration_due_date}
                  onChange={(e) => handleItemChange(index, "calibration_due_date", e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">UUC Serial Number</label>
                <InputField
                  type="text"
                  value={item.uuc_serial_number}
                  onChange={(e) => handleItemChange(index, "uuc_serial_number", e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Certificate</label>
                <input
                  type="file"
                  onChange={(e) => handleItemChange(index, "certificate_file", e.target.files[0])}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          ))}
          <div className="flex justify-end gap-2">
            <Button
              onClick={handleMoveToApproval}
              disabled={!state.items.every((item) => item.certificate_number && item.calibration_due_date)}
              className={`px-4 py-2 rounded-md ${state.items.every((item) => item.certificate_number && item.calibration_due_date) ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-gray-300 text-gray-500"}`}
            >
              Move to Approval
            </Button>
            <Button
              onClick={() => setState((prev) => ({ ...prev, isModalOpen: false, selectedWO: null, items: [] }))}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ListProcessingWorkOrders;