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
    isViewModalOpen: false,
    selectedWO: null,
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

  const handleViewWO = (wo) => {
    setState((prev) => ({
      ...prev,
      isViewModalOpen: true,
      selectedWO: wo,
    }));
  };

  const handleEditWO = (wo) => {
    navigate(`/job-execution/processing-work-orders/edit-work-order/${wo.id}`);
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
                          onClick={() => handleEditWO(wo)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                        >
                          Edit WO
                        </Button>
                        <Button
                          onClick={() => handleViewWO(wo)}
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
        isOpen={state.isViewModalOpen}
        onClose={() => setState((prev) => ({ ...prev, isViewModalOpen: false, selectedWO: null }))}
        title={`Work Order Details - ${state.selectedWO?.wo_number || "N/A"}`}
      >
        {state.selectedWO && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-black">Work Order Details</h3>
              <p><strong>WO Number:</strong> {state.selectedWO.wo_number || "N/A"}</p>
              <p><strong>Status:</strong> {state.selectedWO.status || "N/A"}</p>
              <p><strong>Created At:</strong> {new Date(state.selectedWO.created_at).toLocaleDateString()}</p>
              <p><strong>Assigned To:</strong> {state.selectedWO.assigned_to_name || "N/A"}</p>
              <p><strong>Date Received:</strong> {state.selectedWO.date_received || "N/A"}</p>
              <p><strong>Expected Completion:</strong> {state.selectedWO.expected_completion_date || "N/A"}</p>
              <p><strong>Onsite/Lab:</strong> {state.selectedWO.onsite_or_lab || "N/A"}</p>
              <p><strong>Range:</strong> {state.selectedWO.range || "N/A"}</p>
              <p><strong>Serial Number:</strong> {state.selectedWO.serial_number || "N/A"}</p>
              <p><strong>Site Location:</strong> {state.selectedWO.site_location || "N/A"}</p>
              <p><strong>Remarks:</strong> {state.selectedWO.remarks || "N/A"}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-black">Items</h3>
              {state.selectedWO.items && state.selectedWO.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="border p-2 text-left text-sm font-medium text-gray-700">Item</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700">Quantity</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700">Unit</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700">Unit Price</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700">Certificate Number</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700">Calibration Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.selectedWO.items.map((item) => (
                        <tr key={item.id} className="border">
                          <td className="border p-2">{state.itemsList.find((i) => i.id === item.item)?.name || "N/A"}</td>
                          <td className="border p-2">{item.quantity || "N/A"}</td>
                          <td className="border p-2">{state.units.find((u) => u.id === item.unit)?.name || "N/A"}</td>
                          <td className="border p-2">{item.unit_price ? Number(item.unit_price).toFixed(2) : "N/A"}</td>
                          <td className="border p-2">{item.certificate_number || "N/A"}</td>
                          <td className="border p-2">{item.calibration_due_date || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No items available.</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ListProcessingWorkOrders;