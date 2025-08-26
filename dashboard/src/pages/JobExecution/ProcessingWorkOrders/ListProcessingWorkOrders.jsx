import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import apiClient from "../../../helpers/apiClient";
import InputField from "../../../components/InputField";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";
import ReactDOMServer from 'react-dom/server';
import Template2 from "../../../components/Templates/RFQ/Template2";

const ListProcessingWorkOrders = () => {
  const navigate = useNavigate();
  const [state, setState] = useState({
    workOrders: [],
    itemsList: [],
    units: [],
    technicians: [],
    searchTerm: "",
    sortBy: "created_at",
    currentPage: 1,
    itemsPerPage: 20,
    isViewModalOpen: false,
    selectedWO: null,
  });
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);

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
  }, []);

  const hasPermission = (page, action) => {
    if (isSuperadmin) return true;
    const perm = permissions.find((p) => p.page === page);
    return perm && perm[`can_${action}`];
  };

  const fetchWorkOrders = async () => {
    try {
      const [woRes, itemsRes, unitsRes, techRes] = await Promise.all([
        apiClient.get("work-orders/", { params: { status: "Submitted" } }),
        apiClient.get("items/"),
        apiClient.get("units/"),
        apiClient.get("technicians/"),
      ]);
      setState((prev) => ({
        ...prev,
        workOrders: woRes.data || [],
        itemsList: itemsRes.data || [],
        units: unitsRes.data || [],
        technicians: techRes.data || [],
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

  const handleDeleteWO = async (woId) => {
    if (window.confirm("Are you sure you want to delete this work order?")) {
      try {
        await apiClient.delete(`work-orders/${woId}/`);
        toast.success("Work order deleted successfully.");
        await fetchWorkOrders();
        navigate("/job-execution/initiate-work-order/list-all-purchase-orders");
      } catch (error) {
        console.error("Error deleting work order:", error);
        toast.error("Failed to delete work order.");
      }
    }
  };

  const handleMoveToApproval = async (woId) => {
    try {
      await apiClient.post(`work-orders/${woId}/move-to-approval/`);
      toast.success("Work Order moved to Manager Approval.");
      await fetchWorkOrders();
      navigate("/job-execution/processing-work-orders/manager-approval");
    } catch (error) {
      console.error("Error moving work order to approval:", error);
      toast.error(
        error.response?.data?.error || "Failed to move Work Order to Manager Approval."
      );
    }
  };

  const isEligibleForApproval = (wo) => {
    return (
      wo.date_received &&
      wo.expected_completion_date &&
      wo.onsite_or_lab &&
      wo.range &&
      wo.items &&
      wo.items.length > 0 &&
      wo.items.every(
        (item) =>
          item.assigned_to &&
          item.certificate_uut_label &&
          item.certificate_number &&
          item.calibration_date &&
          item.calibration_due_date &&
          item.uuc_serial_number &&
          item.certificate_file
      )
    );
  };

  const getAssignedTechnicians = (items) => {
    const technicianIds = [...new Set(items.map((item) => item.assigned_to).filter((id) => id))];
    if (technicianIds.length === 0) return "None";
    if (technicianIds.length > 1) return "Multiple";
    const technician = state.technicians.find((t) => t.id === technicianIds[0]);
    return technician ? `${technician.name} (${technician.designation || "N/A"})` : "N/A";
  };

  const handlePrint = (wo) => {
    const techniciansAssigned = getAssignedTechnicians(wo.items);
    const itemsData = (wo.items || []).map(item => ({
      id: item.id,
      name: state.itemsList.find(i => i.id === item.item)?.name || 'N/A',
      quantity: item.quantity || 'N/A',
      unit: state.units.find(u => u.id === item.unit)?.name || 'N/A',
      unit_price: item.unit_price ? Number(item.unit_price).toFixed(2) : 'N/A',
      assigned_to: state.technicians.find(t => t.id === item.assigned_to)?.name || 'N/A',
      certificate_uut_label: item.certificate_uut_label || 'N/A',
      certificate_number: item.certificate_number || 'N/A',
      calibration_date: item.calibration_date ? new Date(item.calibration_date).toLocaleDateString() : 'N/A',
      calibration_due_date: item.calibration_due_date ? new Date(item.calibration_due_date).toLocaleDateString() : 'N/A',
      uuc_serial_number: item.uuc_serial_number || 'N/A',
    }));

    const data = {
      ...wo,
      techniciansAssigned,
      items: itemsData,
      purchase_order: wo.purchase_order || {},
      delivery_note: wo.delivery_note || {},
    };

    const htmlString = ReactDOMServer.renderToStaticMarkup(<Template2 data={data} />);
    const printWindow = window.open("", "_blank");
    printWindow.document.write(htmlString);
    printWindow.document.close();
    printWindow.print();
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

  const pageGroupSize = 3;
  const currentGroup = Math.floor((state.currentPage - 1) / pageGroupSize);
  const startPage = currentGroup * pageGroupSize + 1;
  const endPage = Math.min(startPage + pageGroupSize - 1, totalPages);
  const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  const handlePageChange = (page) => {
    setState((prev) => ({ ...prev, currentPage: page }));
  };

  const handleNext = () => {
    if (state.currentPage < totalPages) {
      setState((prev) => ({ ...prev, currentPage: prev.currentPage + 1 }));
    }
  };

  const handlePrev = () => {
    if (state.currentPage > 1) {
      setState((prev) => ({ ...prev, currentPage: prev.currentPage - 1 }));
    }
  };

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
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Sl No</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Created At</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">WO Number</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Assigned To</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Equipment Collection Status</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentWOs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="border p-2 text-center text-gray-500 whitespace-nowrap">
                    No processing work orders found.
                  </td>
                </tr>
              ) : (
                currentWOs.map((wo, index) => (
                  <tr key={wo.id} className={`border ${wo.manager_approval_status === 'Declined' ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                    <td className="border p-2 whitespace-nowrap">{startIndex + index + 1}</td>
                    <td className="border p-2 whitespace-nowrap">{new Date(wo.created_at).toLocaleDateString()}</td>
                    <td className="border p-2 whitespace-nowrap">{wo.wo_number || "N/A"}</td>
                    <td className="border p-2 whitespace-nowrap">{getAssignedTechnicians(wo.items)}</td>
                    <td className="border p-2 whitespace-nowrap">{wo.equipment_collection_status || "Pending"}</td>
                    <td className="border p-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleEditWO(wo)}
                          disabled={!hasPermission('processing_work_orders', 'edit')}
                          className={`px-3 py-1 rounded-md text-sm ${
                            hasPermission('processing_work_orders', 'edit')
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          Edit WO
                        </Button>
                        <Button
                          onClick={() => handleViewWO(wo)}
                          className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                        >
                          View WO
                        </Button>
                        <Button
                          onClick={() => handleDeleteWO(wo.id)}
                          disabled={!hasPermission('processing_work_orders', 'delete')}
                          className={`px-3 py-1 rounded-md text-sm ${
                            hasPermission('processing_work_orders', 'delete')
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          Delete
                        </Button>
                        <Button
                          onClick={() => handleMoveToApproval(wo.id)}
                          disabled={!isEligibleForApproval(wo)}
                          className={`px-3 py-1 rounded-md text-sm ${
                            isEligibleForApproval(wo)
                              ? "bg-indigo-600 text-white hover:bg-indigo-700"
                              : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          Move to Manager Approval
                        </Button>
                        <Button
                          onClick={() => handlePrint(wo)}
                          className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                        >
                          Print
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
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4 w-fit">
          <Button
            onClick={handlePrev}
            disabled={state.currentPage === 1}
            className="px-3 py-1 bg-gray-400 text-white rounded-md hover:bg-gray-500 disabled:bg-gray-300 min-w-fit"
          >
            Prev
          </Button>
          {pageNumbers.map((page) => (
            <Button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1 rounded-md min-w-fit ${
                state.currentPage === page
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {page}
            </Button>
          ))}
          <Button
            onClick={handleNext}
            disabled={state.currentPage === totalPages}
            className="px-3 py-1 bg-gray-400 text-white rounded-md hover:bg-gray-500 disabled:bg-gray-300 min-w-fit"
          >
            Next
          </Button>
        </div>
      )}
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
              <p><strong>Manager Approval Status:</strong> {state.selectedWO.manager_approval_status || "N/A"}</p>
              {state.selectedWO.manager_approval_status === "Declined" && (
                <p><strong>Decline Reason:</strong> {state.selectedWO.decline_reason || "N/A"}</p>
              )}
              <p><strong>Created At:</strong> {new Date(state.selectedWO.created_at).toLocaleDateString()}</p>
              <p><strong>Date Received:</strong> {state.selectedWO.date_received ? new Date(state.selectedWO.date_received).toLocaleDateString() : "N/A"}</p>
              <p><strong>Expected Completion:</strong> {state.selectedWO.expected_completion_date ? new Date(state.selectedWO.expected_completion_date).toLocaleDateString() : "N/A"}</p>
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
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Item</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Quantity</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Unit</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Unit Price</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Assigned To</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Certificate UUT Label</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Certificate Number</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Calibration Date</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Calibration Due Date</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">UUC Serial Number</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Certificate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.selectedWO.items.map((item) => (
                        <tr key={item.id} className="border">
                          <td className="border p-2 whitespace-nowrap">{state.itemsList.find((i) => i.id === item.item)?.name || "N/A"}</td>
                          <td className="border p-2 whitespace-nowrap">{item.quantity || "N/A"}</td>
                          <td className="border p-2 whitespace-nowrap">{state.units.find((u) => u.id === item.unit)?.name || "N/A"}</td>
                          <td className="border p-2 whitespace-nowrap">{item.unit_price ? Number(item.unit_price).toFixed(2) : "N/A"}</td>
                          <td className="border p-2 whitespace-nowrap">{state.technicians.find((t) => t.id === item.assigned_to)?.name || "N/A"}</td>
                          <td className="border p-2 whitespace-nowrap">{item.certificate_uut_label || "N/A"}</td>
                          <td className="border p-2 text-left whitespace-nowrap">{item.certificate_number || "N/A"}</td>
                          <td className="border p-2 whitespace-nowrap">{item.calibration_date ? new Date(item.calibration_date).toLocaleDateString() : "N/A"}</td>
                          <td className="border p-2 whitespace-nowrap">{item.calibration_due_date ? new Date(item.calibration_due_date).toLocaleDateString() : "N/A"}</td>
                          <td className="border p-2 whitespace-nowrap">{item.uuc_serial_number || "N/A"}</td>
                          <td className="border p-2 whitespace-nowrap">
                            {item.certificate_file ? (
                              <a
                                href={item.certificate_file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                View Certificate
                              </a>
                            ) : (
                              "N/A"
                            )}
                          </td>
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