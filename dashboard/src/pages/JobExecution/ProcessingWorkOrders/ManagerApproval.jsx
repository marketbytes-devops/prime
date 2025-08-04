import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../../../helpers/apiClient';
import Button from '../../../components/Button';
import Modal from '../../../components/Modal';
import InputField from '../../../components/InputField';

const ManagerApproval = () => {
  const [state, setState] = useState({
    workOrders: [],
    itemsList: [],
    units: [],
    technicians: [],
    searchTerm: '',
    sortBy: 'created_at',
    currentPage: 1,
    itemsPerPage: 20,
    isViewModalOpen: false,
    isApproveModalOpen: false,
    isDeclineModalOpen: false,
    selectedWO: null,
    declineReason: '',
    deliveryNoteType: 'single',
    isWorkOrderComplete: true,
  });

  const fetchData = async () => {
    try {
      const [woRes, itemsRes, unitsRes, techRes] = await Promise.all([
        apiClient.get('work-orders/', { params: { status: 'Manager Approval' } }),
        apiClient.get('items/'),
        apiClient.get('units/'),
        apiClient.get('technicians/'),
      ]);
      setState(prev => ({
        ...prev,
        workOrders: woRes.data || [],
        itemsList: itemsRes.data || [],
        units: unitsRes.data || [],
        technicians: techRes.data || [],
      }));
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load work orders.');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleViewWO = (wo) => {
    setState(prev => ({
      ...prev,
      isViewModalOpen: true,
      selectedWO: wo,
    }));
  };

  const handleApprove = async () => {
    try {
      await apiClient.post(`work-orders/${state.selectedWO.id}/approve/`, {
        delivery_note_type: state.deliveryNoteType,
      });
      toast.success('Work Order approved and Delivery Note created.');
      setState(prev => ({
        ...prev,
        isApproveModalOpen: false,
        selectedWO: null,
        deliveryNoteType: 'single',
        isWorkOrderComplete: true,
      }));
      fetchData();
    } catch (error) {
      console.error('Error approving work order:', error);
      toast.error('Failed to approve Work Order.');
    }
  };

  const handleDecline = async () => {
    try {
      await apiClient.post(`work-orders/${state.selectedWO.id}/decline/`, {
        decline_reason: state.declineReason,
      });
      toast.success('Work Order declined and returned to Processing Work Orders.');
      setState(prev => ({
        ...prev,
        isDeclineModalOpen: false,
        selectedWO: null,
        declineReason: '',
      }));
      fetchData();
    } catch (error) {
      console.error('Error declining work order:', error);
      toast.error(error.response?.data?.error || 'Failed to decline Work Order.');
    }
  };

  const getAssignedTechnicians = (items) => {
    const technicianIds = [...new Set(items.map((item) => item.assigned_to).filter((id) => id))];
    if (technicianIds.length === 0) return "None";
    if (technicianIds.length > 1) return "Multiple";
    const technician = state.technicians.find((t) => t.id === technicianIds[0]);
    return technician ? `${technician.name} (${technician.designation || "N/A"})` : "N/A";
  };

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

  const pageGroupSize = 3;
  const currentGroup = Math.floor((state.currentPage - 1) / pageGroupSize);
  const startPage = currentGroup * pageGroupSize + 1;
  const endPage = Math.min(startPage + pageGroupSize - 1, totalPages);
  const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  const handlePageChange = (page) => {
    setState(prev => ({ ...prev, currentPage: page }));
  };

  const handleNext = () => {
    if (state.currentPage < totalPages) {
      setState(prev => ({ ...prev, currentPage: prev.currentPage + 1 }));
    }
  };

  const handlePrev = () => {
    if (state.currentPage > 1) {
      setState(prev => ({ ...prev, currentPage: prev.currentPage - 1 }));
    }
  };

  return (
    <div className="mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Manager Approval</h1>
      <div className="bg-white p-4 space-y-4 rounded-md shadow w-full">
        <div className="mb-6 flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Work Orders</label>
            <InputField
              type="text"
              placeholder="Search by company name or WO Number..."
              value={state.searchTerm}
              onChange={e => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={state.sortBy}
              onChange={e => setState(prev => ({ ...prev, sortBy: e.target.value }))}
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
                <th className="border p-2 text-left text-sm font-medium text-gray-700">Sl No</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700">WO Number</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700">Created At</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700">Assigned To</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentWOs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="border p-2 text-center text-gray-500">
                    No work orders found.
                  </td>
                </tr>
              ) : (
                currentWOs.map((wo, index) => (
                  <tr key={wo.id} className="border hover:bg-gray-50">
                    <td className="border p-2">{startIndex + index + 1}</td>
                    <td className="border p-2">{wo.wo_number || 'N/A'}</td>
                    <td className="border p-2">{new Date(wo.created_at).toLocaleDateString()}</td>
                    <td className="border p-2">{getAssignedTechnicians(wo.items)}</td>
                    <td className="border p-2">
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleViewWO(wo)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                        >
                          View WO & Certificates
                        </Button>
                        <Button
                          onClick={() => setState(prev => ({ ...prev, isApproveModalOpen: true, selectedWO: wo }))}
                          className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                        >
                          Approve
                        </Button>
                        <Button
                          onClick={() => setState(prev => ({ ...prev, isDeclineModalOpen: true, selectedWO: wo }))}
                          className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                        >
                          Decline
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
                state.currentPage === page ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
        onClose={() => setState(prev => ({ ...prev, isViewModalOpen: false, selectedWO: null }))}
        title={`Work Order Details - ${state.selectedWO?.wo_number || 'N/A'}`}
      >
        {state.selectedWO && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-black">Work Order Details</h3>
              <p><strong>WO Number:</strong> {state.selectedWO.wo_number || 'N/A'}</p>
              <p><strong>Status:</strong> {state.selectedWO.status || 'N/A'}</p>
              <p><strong>Created At:</strong> {new Date(state.selectedWO.created_at).toLocaleDateString()}</p>
              <p><strong>Date Received:</strong> {state.selectedWO.date_received ? new Date(state.selectedWO.date_received).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Expected Completion:</strong> {state.selectedWO.expected_completion_date ? new Date(state.selectedWO.expected_completion_date).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Onsite/Lab:</strong> {state.selectedWO.onsite_or_lab || 'N/A'}</p>
              <p><strong>Range:</strong> {state.selectedWO.range || 'N/A'}</p>
              <p><strong>Serial Number:</strong> {state.selectedWO.serial_number || 'N/A'}</p>
              <p><strong>Site Location:</strong> {state.selectedWO.site_location || 'N/A'}</p>
              <p><strong>Remarks:</strong> {state.selectedWO.remarks || 'N/A'}</p>
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
      <Modal
        isOpen={state.isApproveModalOpen}
        onClose={() => setState(prev => ({ ...prev, isApproveModalOpen: false, selectedWO: null, deliveryNoteType: 'single', isWorkOrderComplete: true }))}
        title={`Approve Work Order - ${state.selectedWO?.wo_number || 'N/A'}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Work Order Complete?</label>
            <select
              value={state.isWorkOrderComplete ? 'yes' : 'no'}
              onChange={e => setState(prev => ({ ...prev, isWorkOrderComplete: e.target.value === 'yes' }))}
              className="p-2 border rounded w-full"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          {state.isWorkOrderComplete && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Note Type</label>
              <select
                value={state.deliveryNoteType}
                onChange={e => setState(prev => ({ ...prev, deliveryNoteType: e.target.value }))}
                className="p-2 border rounded w-full"
              >
                <option value="single">Single Delivery Note</option>
                <option value="multiple">Multiple Delivery Notes</option>
              </select>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              onClick={handleApprove}
              disabled={!state.isWorkOrderComplete}
              className={`px-4 py-2 rounded-md ${
                state.isWorkOrderComplete ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-300 text-gray-500'
              }`}
            >
              Submit
            </Button>
            <Button
              onClick={() => setState(prev => ({ ...prev, isApproveModalOpen: false, selectedWO: null, deliveryNoteType: 'single', isWorkOrderComplete: true }))}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={state.isDeclineModalOpen}
        onClose={() => setState(prev => ({ ...prev, isDeclineModalOpen: false, selectedWO: null, declineReason: '' }))}
        title="Decline Work Order"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Decline Reason</label>
            <InputField
              type="text"
              value={state.declineReason}
              onChange={e => setState(prev => ({ ...prev, declineReason: e.target.value }))}
              className="w-full"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              onClick={handleDecline}
              disabled={!state.declineReason}
              className={`px-4 py-2 rounded-md ${state.declineReason ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-300 text-gray-500'}`}
            >
              Submit
            </Button>
            <Button
              onClick={() => setState(prev => ({ ...prev, isDeclineModalOpen: false, selectedWO: null, declineReason: '' }))}
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

export default ManagerApproval;