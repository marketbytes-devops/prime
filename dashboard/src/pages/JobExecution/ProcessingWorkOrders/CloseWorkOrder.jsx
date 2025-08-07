import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../../../helpers/apiClient';
import InputField from '../../../components/InputField';
import Button from '../../../components/Button';
import Modal from '../../../components/Modal';

const CloseWorkOrder = () => {
  const [state, setState] = useState({
    workOrders: [],
    technicians: [],
    searchTerm: '',
    sortBy: 'created_at',
    currentPage: 1,
    itemsPerPage: 10,
    isModalOpen: false,
    uploadModalOpen: false,
    selectedWO: null,
    purchaseOrderFile: null,
    workOrderFile: null,
    signedDeliveryNoteFile: null,
    isViewModalOpen: false,
    selectedViewWO: null,
  });

  const fetchWorkOrders = async () => {
    try {
      const [woRes, techRes] = await Promise.all([
        apiClient.get('work-orders/', { params: { status: 'Approved' } }),
        apiClient.get('technicians/'),
      ]);
      const userEmail = localStorage.getItem('userEmail');
      const filteredWOs = woRes.data
        .filter(wo => wo.created_by?.email === userEmail || !wo.created_by)
        .map(wo => ({
          ...wo,
          assigned_to: wo.items || [],
        }));
      setState(prev => ({
        ...prev,
        workOrders: filteredWOs || [],
        technicians: techRes.data || [],
      }));
    } catch (error) {
      console.error('Error fetching work orders:', error);
      toast.error('Failed to load work orders.');
    }
  };

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const handleCloseWO = async () => {
    try {
      const formData = new FormData();
      if (state.purchaseOrderFile) formData.append('purchase_order_file', state.purchaseOrderFile);
      if (state.workOrderFile) formData.append('work_order_file', state.workOrderFile);
      if (state.signedDeliveryNoteFile) formData.append('signed_delivery_note_file', state.signedDeliveryNoteFile);

      await apiClient.patch(`work-orders/${state.selectedWO.id}/close/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Work Order closed and submitted for invoicing.');
      setState(prev => ({
        ...prev,
        isModalOpen: false,
        uploadModalOpen: false,
        selectedWO: null,
        purchaseOrderFile: null,
        workOrderFile: null,
        signedDeliveryNoteFile: null,
      }));
      fetchWorkOrders();
    } catch (error) {
      console.error('Error closing work order:', error);
      toast.error('Failed to close work order.');
    }
  };

  const handleOpenModal = (wo) => {
    setState(prev => ({
      ...prev,
      isModalOpen: true,
      selectedWO: wo,
    }));
  };

  const handleViewWO = (woId) => {
    const workOrder = state.workOrders.find(wo => wo.id === woId);
    setState(prev => ({
      ...prev,
      isViewModalOpen: true,
      selectedViewWO: workOrder || null,
    }));
  };

  const handleOpenUploadModal = (documentType) => {
    setState(prev => ({ ...prev, uploadModalOpen: true }));
    setSelectedDocument(documentType);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    setState(prev => {
      if (prev.uploadModalOpen) {
        if (selectedDocument === 'purchase_order') return { ...prev, purchaseOrderFile: file };
        if (selectedDocument === 'work_order') return { ...prev, workOrderFile: file };
        if (selectedDocument === 'signed_delivery_note') return { ...prev, signedDeliveryNoteFile: file };
      }
      return prev;
    });
    setState(prev => ({ ...prev, uploadModalOpen: false }));
  };

  const getAssignedTo = (items) => {
    const technicianIds = [
      ...new Set(items.map(item => item.assigned_to).filter(id => id)),
    ];
    if (technicianIds.length === 0) return "None";
    if (technicianIds.length > 1) return "Multiple";
    const technician = state.technicians.find(t => t.id === technicianIds[0]);
    return technician ? `${technician.name} (${technician.designation || "N/A"})` : "None";
  };

  const [selectedDocument, setSelectedDocument] = useState(null);

  const filteredWOs = state.workOrders
    .filter(wo =>
      (wo.quotation?.company_name || '').toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      (wo.wo_number || '').toLowerCase().includes(state.searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (state.sortBy === 'created_at') {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (state.sortBy === 'company_name') {
        return (a.quotation?.company_name || '').localeCompare(b.quotation?.company_name || '');
      }
      return 0;
    });

  const totalPages = Math.ceil(filteredWOs.length / state.itemsPerPage);
  const startIndex = (state.currentPage - 1) * state.itemsPerPage;
  const currentWOs = filteredWOs.slice(startIndex, startIndex + state.itemsPerPage);

  // Set Created At to today's date: 03:46 PM IST, August 07, 2025
  const today = new Date('2025-08-07T10:16:00Z').toLocaleDateString(); // Adjusted to IST

  return (
    <div className="mx-auto p-4 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Close Work Orders</h1>
      <div className="bg-white p-6 space-y-6 rounded-lg shadow-lg">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Work Orders</label>
            <InputField
              type="text"
              placeholder="Search by company name or WO Number..."
              value={state.searchTerm}
              onChange={e => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="w-full md:w-1/4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={state.sortBy}
              onChange={e => setState(prev => ({ ...prev, sortBy: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                <th className="border p-3 text-left text-sm font-medium text-gray-700">Sl No</th>
                <th className="border p-3 text-left text-sm font-medium text-gray-700">Created At</th>
                <th className="border p-3 text-left text-sm font-medium text-gray-700">WO Number</th>
                <th className="border p-3 text-left text-sm font-medium text-gray-700">Assigned To</th>
                <th className="border p-3 text-left text-sm font-medium text-gray-700" colSpan="2">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentWOs.map((wo, index) => (
                <tr key={wo.id} className="border hover:bg-gray-50">
                  <td className="border p-3">{startIndex + index + 1}</td>
                  <td className="border p-3">{today}</td>
                  <td className="border p-3">{wo.wo_number}</td>
                  <td className="border p-3">{getAssignedTo(wo.assigned_to)}</td>
                  <td className="border p-3">
                    <Button
                      onClick={() => handleViewWO(wo.id)}
                      className="px-2 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm w-full"
                    >
                      View WO
                    </Button>
                  </td>
                  <td className="border p-3">
                    <Button
                      onClick={() => handleOpenModal(wo)}
                      className="px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm w-full"
                    >
                      Submit for Invoicing
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center mt-6">
          <Button
            onClick={() => setState(prev => ({ ...prev, currentPage: Math.max(prev.currentPage - 1, 1) }))}
            disabled={state.currentPage === 1}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:bg-gray-300"
          >
            Previous
          </Button>
          <span className="text-sm text-gray-700">
            Page {state.currentPage} of {totalPages}
          </span>
          <Button
            onClick={() => setState(prev => ({ ...prev, currentPage: Math.min(prev.currentPage + 1, totalPages) }))}
            disabled={state.currentPage === totalPages}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:bg-gray-300"
          >
            Next
          </Button>
        </div>
      </div>
      <Modal
        isOpen={state.isModalOpen}
        onClose={() => setState(prev => ({ ...prev, isModalOpen: false, selectedWO: null, purchaseOrderFile: null, workOrderFile: null, signedDeliveryNoteFile: null }))}
        title="Close Work Order"
      >
        <div className="space-y-6 p-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Submit</h3>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Order (Optional)</label>
            <select
              onChange={(e) => e.target.value === 'upload' && handleOpenUploadModal('purchase_order')}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select</option>
              <option value="upload">Upload</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Work Order (Optional)</label>
            <select
              onChange={(e) => e.target.value === 'upload' && handleOpenUploadModal('work_order')}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select</option>
              <option value="upload">Upload</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Signed Delivery Note</label>
            <select
              onChange={(e) => e.target.value === 'upload' && handleOpenUploadModal('signed_delivery_note')}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select</option>
              <option value="upload">Upload</option>
            </select>
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <Button
              onClick={handleCloseWO}
              disabled={!state.signedDeliveryNoteFile}
              className={`px-4 py-2 rounded-md ${state.signedDeliveryNoteFile ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-300 text-gray-500'}`}
            >
              Submit
            </Button>
            <Button
              onClick={() => setState(prev => ({ ...prev, isModalOpen: false, selectedWO: null, purchaseOrderFile: null, workOrderFile: null, signedDeliveryNoteFile: null }))}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={state.uploadModalOpen}
        onClose={() => setState(prev => ({ ...prev, uploadModalOpen: false }))}
        title="Upload Document"
      >
        <div className="space-y-6 p-4">
          <input
            type="file"
            onChange={handleFileUpload}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex justify-end gap-4">
            <Button
              onClick={() => {
                handleFileUpload({ target: { files: [state.purchaseOrderFile || state.workOrderFile || state.signedDeliveryNoteFile] } });
                setState(prev => ({ ...prev, uploadModalOpen: false }));
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Upload
            </Button>
            <Button
              onClick={() => setState(prev => ({ ...prev, uploadModalOpen: false }))}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={state.isViewModalOpen}
        onClose={() => setState(prev => ({ ...prev, isViewModalOpen: false, selectedViewWO: null }))}
        title={`Work Order Details - ${state.selectedViewWO?.wo_number || "N/A"}`}
      >
        {state.selectedViewWO && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-black">Work Order Details</h3>
              <p><strong>WO Number:</strong> {state.selectedViewWO.wo_number || "N/A"}</p>
              <p><strong>Status:</strong> {state.selectedViewWO.status || "N/A"}</p>
              <p><strong>Manager Approval Status:</strong> {state.selectedViewWO.manager_approval_status || "N/A"}</p>
              {state.selectedViewWO.manager_approval_status === "Declined" && (
                <p><strong>Decline Reason:</strong> {state.selectedViewWO.decline_reason || "N/A"}</p>
              )}
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
                          <td className="border p-2 whitespace-nowrap">{item.item?.name || "N/A"}</td>
                          <td className="border p-2 whitespace-nowrap">{item.quantity || "N/A"}</td>
                          <td className="border p-2 whitespace-nowrap">{item.unit?.name || "N/A"}</td>
                          <td className="border p-2 whitespace-nowrap">{item.unit_price ? Number(item.unit_price).toFixed(2) : "N/A"}</td>
                          <td className="border p-2 whitespace-nowrap">{state.technicians.find(t => t.id === item.assigned_to)?.name || "N/A"}</td>
                          <td className="border p-2 whitespace-nowrap">{item.certificate_uut_label || "N/A"}</td>
                          <td className="border p-2 whitespace-nowrap">{item.certificate_number || "N/A"}</td>
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

export default CloseWorkOrder;