import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import apiClient from "../../../helpers/apiClient";
import InputField from "../../../components/InputField";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";

const CloseWorkOrder = () => {
  const [state, setState] = useState({
    workOrders: [],
    technicians: [],
    itemsList: [],
    units: [],
    searchTerm: "",
    sortBy: "created_at",
    currentPage: 1,
    itemsPerPage: 20,
    isModalOpen: false,
    uploadModalOpen: false,
    selectedWO: null,
    purchaseOrderFile: null,
    workOrderFile: null,
    signedDeliveryNoteFile: null,
    isViewModalOpen: false,
    selectedViewWO: null,
    uploadDocumentType: null,
  });
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get('/profile/');
        const user = response.data;
        setIsSuperadmin(user.is_superuser || user.role?.name === 'Superadmin');
        const roleId = user.role?.id;
        if (roleId) {
          const res = await apiClient.get(`/roles/${roleId}/`);
          setPermissions(res.data.permissions || []);
        } else {
          setPermissions([]);
        }
      } catch (error) {
        console.error('Unable to fetch user profile:', error);
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
      const [woRes, techRes, itemsRes, unitsRes] = await Promise.all([
        apiClient.get("work-orders/", { params: { status: "Approved" } }),
        apiClient.get("technicians/"),
        apiClient.get("items/"),
        apiClient.get("units/"),
      ]);
      const userEmail = localStorage.getItem("userEmail");
      const filteredWOs = woRes.data
        .filter((wo) => wo.created_by?.email === userEmail || !wo.created_by)
        .map((wo) => ({
          ...wo,
          items: wo.items || [],
        }));
      setState((prev) => ({
        ...prev,
        workOrders: filteredWOs || [],
        technicians: techRes.data || [],
        itemsList: itemsRes.data || [],
        units: unitsRes.data || [],
      }));
    } catch (error) {
      console.error("Error fetching work orders:", error);
      toast.error("Failed to load work orders.");
    }
  };

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const handleCloseWO = async () => {
    try {
      const formData = new FormData();
      if (state.purchaseOrderFile) formData.append("purchase_order_file", state.purchaseOrderFile);
      if (state.workOrderFile) formData.append("work_order_file", state.workOrderFile);
      if (state.signedDeliveryNoteFile) formData.append("signed_delivery_note_file", state.signedDeliveryNoteFile);

      await apiClient.patch(`work-orders/${state.selectedWO.id}/close/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Work Order closed and submitted for invoicing.");
      setState((prev) => ({
        ...prev,
        isModalOpen: false,
        uploadModalOpen: false,
        selectedWO: null,
        purchaseOrderFile: null,
        workOrderFile: null,
        signedDeliveryNoteFile: null,
        uploadDocumentType: null,
      }));
      fetchWorkOrders();
    } catch (error) {
      console.error("Error closing work order:", error);
      toast.error("Failed to close work order.");
    }
  };

  const handleOpenModal = (wo) => {
    setState((prev) => ({
      ...prev,
      isModalOpen: true,
      selectedWO: wo,
    }));
  };

  const handleViewWO = (wo) => {
    setState((prev) => ({
      ...prev,
      isViewModalOpen: true,
      selectedViewWO: wo || null,
    }));
  };

  const handleOpenUploadModal = (documentType) => {
    setState((prev) => ({ ...prev, uploadModalOpen: true, uploadDocumentType: documentType }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setState((prev) => ({
      ...prev,
      uploadModalOpen: false,
      ...(prev.uploadDocumentType === "purchase_order" && { purchaseOrderFile: file }),
      ...(prev.uploadDocumentType === "work_order" && { workOrderFile: file }),
      ...(prev.uploadDocumentType === "signed_delivery_note" && { signedDeliveryNoteFile: file }),
      uploadDocumentType: null,
    }));
  };

  const getAssignedTechnicians = (items) => {
    const technicianIds = [...new Set(items.map((item) => item.assigned_to).filter((id) => id))];
    if (technicianIds.length === 0) return "None";
    if (technicianIds.length > 1) return "Multiple";
    const technician = state.technicians.find((t) => t.id === technicianIds[0]);
    return technician ? `${technician.name} (${technician.designation || "N/A"})` : "N/A";
  };

  const filteredWOs = state.workOrders
    .filter(
      (wo) =>
        (wo.quotation?.company_name || "").toLowerCase().includes(state.searchTerm.toLowerCase()) ||
        (wo.wo_number || "").toLowerCase().includes(state.searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (state.sortBy === "created_at") {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (state.sortBy === "company_name") {
        return (a.quotation?.company_name || "").localeCompare(b.quotation?.company_name || "");
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
      <h1 className="text-2xl font-bold mb-4">Close Work Orders</h1>
      <div className="bg-white p-4 space-y-4 rounded-md shadow w-full">
        <div className="mb-6 flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Work Orders</label>
            <InputField
              type="text"
              placeholder="Search by company name or WO Number..."
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
              <option value="company_name">Company Name</option>
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
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentWOs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="border p-2 text-center text-gray-500 whitespace-nowrap">
                    No work orders found.
                  </td>
                </tr>
              ) : (
                currentWOs.map((wo, index) => (
                  <tr key={wo.id} className="border hover:bg-gray-50">
                    <td className="border p-2 whitespace-nowrap">{startIndex + index + 1}</td>
                    <td className="border p-2 whitespace-nowrap">{new Date(wo.created_at).toLocaleDateString()}</td>
                    <td className="border p-2 whitespace-nowrap">{wo.wo_number || "N/A"}</td>
                    <td className="border p-2 whitespace-nowrap">{getAssignedTechnicians(wo.items)}</td>
                    <td className="border p-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleViewWO(wo)}
                          className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                        >
                          View WO
                        </Button>
                        <Button
                          onClick={() => handleOpenModal(wo)}
                          disabled={!hasPermission('close_work_order', 'edit')}
                          className={`px-3 py-1 rounded-md text-sm ${
                            hasPermission('close_work_order', 'edit')
                              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          Submit for Invoicing
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
        isOpen={state.isModalOpen}
        onClose={() =>
          setState((prev) => ({
            ...prev,
            isModalOpen: false,
            selectedWO: null,
            purchaseOrderFile: null,
            workOrderFile: null,
            signedDeliveryNoteFile: null,
            uploadDocumentType: null,
          }))
        }
        title="Close Work Order"
      >
        <div className="space-y-4 p-4">
          <h3 className="text-lg font-medium text-black">Submit for Invoicing</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Order (Optional)</label>
            <select
              onChange={(e) => e.target.value === "upload" && handleOpenUploadModal("purchase_order")}
              className="p-2 border rounded focus:outline-indigo-500 w-full"
            >
              <option value="">Select</option>
              <option value="upload">Upload</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Work Order (Optional)</label>
            <select
              onChange={(e) => e.target.value === "upload" && handleOpenUploadModal("work_order")}
              className="p-2 border rounded focus:outline-indigo-500 w-full"
            >
              <option value="">Select</option>
              <option value="upload">Upload</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Signed Delivery Note</label>
            <select
              onChange={(e) => e.target.value === "upload" && handleOpenUploadModal("signed_delivery_note")}
              className="p-2 border rounded focus:outline-indigo-500 w-full"
            >
              <option value="">Select</option>
              <option value="upload">Upload</option>
            </select>
          </div>
          <div className="flex justify-end gap-4 mt-4">
            <Button
              onClick={handleCloseWO}
              disabled={!state.signedDeliveryNoteFile || !hasPermission('close_work_order', 'edit')}
              className={`px-3 py-1 rounded-md text-sm ${
                state.signedDeliveryNoteFile && hasPermission('close_work_order', 'edit')
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Submit
            </Button>
            <Button
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  isModalOpen: false,
                  selectedWO: null,
                  purchaseOrderFile: null,
                  workOrderFile: null,
                  signedDeliveryNoteFile: null,
                  uploadDocumentType: null,
                }))
              }
              className="px-3 py-1 bg-gray-400 text-white rounded-md hover:bg-gray-500 text-sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={state.uploadModalOpen}
        onClose={() => setState((prev) => ({ ...prev, uploadModalOpen: false, uploadDocumentType: null }))}
        title={`Upload ${state.uploadDocumentType?.replace("_", " ") || "Document"}`}
      >
        <div className="space-y-4 p-4">
          <input
            type="file"
            onChange={handleFileUpload}
            className="p-2 border rounded focus:outline-indigo-500 w-full"
          />
          <div className="flex justify-end gap-4">
            <Button
              onClick={() => setState((prev) => ({ ...prev, uploadModalOpen: false }))}
              className="px-3 py-1 bg-gray-400 text-white rounded-md hover:bg-gray-500 text-sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={state.isViewModalOpen}
        onClose={() => setState((prev) => ({ ...prev, isViewModalOpen: false, selectedViewWO: null }))}
        title={`Work Order Details - ${state.selectedViewWO?.wo_number || "N/A"}`}
      >
        {state.selectedViewWO && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-black">Work Order Details</h3>
              <p><strong>WO Number:</strong> {state.selectedViewWO.wo_number || "N/A"}</p>
              <p><strong>Status:</strong> {state.selectedViewWO.status || "N/A"}</p>
              <p><strong>Created At:</strong> {new Date(state.selectedViewWO.created_at).toLocaleDateString()}</p>
              <p><strong>Date Received:</strong> {state.selectedViewWO.date_received ? new Date(state.selectedViewWO.date_received).toLocaleDateString() : "N/A"}</p>
              <p><strong>Expected Completion:</strong> {state.selectedViewWO.expected_completion_date ? new Date(state.selectedViewWO.expected_completion_date).toLocaleDateString() : "N/A"}</p>
              <p><strong>Onsite/Lab:</strong> {state.selectedViewWO.onsite_or_lab || "N/A"}</p>
              <p><strong>Range:</strong> {state.selectedViewWO.range || "N/A"}</p>
              <p><strong>Serial Number:</strong> {state.selectedViewWO.serial_number || "N/A"}</p>
              <p><strong>Site Location:</strong> {state.selectedViewWO.site_location || "N/A"}</p>
              <p><strong>Remarks:</strong> {state.selectedViewWO.remarks || "N/A"}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-black">Items</h3>
              {state.selectedViewWO.items && state.selectedViewWO.items.length > 0 ? (
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
                      {state.selectedViewWO.items.map((item) => (
                        <tr key={item.id} className="border">
                          <td className="border p-2 whitespace-nowrap">{state.itemsList.find((i) => i.id === item.item)?.name || 'N/A'}</td>
                          <td className="border p-2 whitespace-nowrap">{item.quantity || 'N/A'}</td>
                          <td className="border p-2 whitespace-nowrap">{state.units.find((u) => u.id === item.unit)?.name || 'N/A'}</td>
                          <td className="border p-2 whitespace-nowrap">{item.unit_price ? Number(item.unit_price).toFixed(2) : 'N/A'}</td>
                          <td className="border p-2 whitespace-nowrap">{state.technicians.find((t) => t.id === item.assigned_to)?.name || 'N/A'}</td>
                          <td className="border p-2 whitespace-nowrap">{item.certificate_uut_label || 'N/A'}</td>
                          <td className="border p-2 whitespace-nowrap">{item.certificate_number || 'N/A'}</td>
                          <td className="border p-2 whitespace-nowrap">{item.calibration_date ? new Date(item.calibration_date).toLocaleDateString() : 'N/A'}</td>
                          <td className="border p-2 whitespace-nowrap">{item.calibration_due_date ? new Date(item.calibration_due_date).toLocaleDateString() : 'N/A'}</td>
                          <td className="border p-2 whitespace-nowrap">{item.uuc_serial_number || 'N/A'}</td>
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
                              'N/A'
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

export default CloseWorkOrder;