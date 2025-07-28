import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../../helpers/apiClient';
import InputField from '../../../components/InputField';
import Button from '../../../components/Button';
import Modal from '../../../components/Modal';

const CloseWorkOrder = () => {
  const navigate = useNavigate();
  const [state, setState] = useState({
    workOrders: [],
    searchTerm: '',
    sortBy: 'created_at',
    currentPage: 1,
    itemsPerPage: 20,
    isModalOpen: false,
    selectedWO: null,
    purchaseOrderFile: null,
    workOrderFile: null,
    signedDeliveryNoteFile: null,
  });

  const fetchWorkOrders = async () => {
    try {
      const userEmail = localStorage.getItem('userEmail');
      const response = await apiClient.get('work-orders/', {
        params: { status: 'Delivered' },
      });
      // Filter work orders created by the current user
      const filteredWOs = response.data.filter(wo => wo.created_by?.email === userEmail);
      setState(prev => ({ ...prev, workOrders: filteredWOs || [] }));
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
      // Update work order status to Closed
      await apiClient.patch(`work-orders/${state.selectedWO.id}/`, {
        status: 'Closed',
      });
      toast.success('Work Order closed and submitted for invoicing.');
      setState(prev => ({
        ...prev,
        isModalOpen: false,
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

  const handleOpenModal = wo => {
    setState(prev => ({
      ...prev,
      isModalOpen: true,
      selectedWO: wo,
    }));
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
                <th className="border p-2 text-left text-sm font-medium text-gray-700">Company Name</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700">Created Date</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700">Assigned To</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentWOs.map((wo, index) => (
                <tr key={wo.id} className="border hover:bg-gray-50">
                  <td className="border p-2">{startIndex + index + 1}</td>
                  <td className="border p-2">{wo.wo_number}</td>
                  <td className="border p-2">{wo.quotation?.company_name || 'N/A'}</td>
                  <td className="border p-2">{new Date(wo.created_at).toLocaleDateString()}</td>
                  <td className="border p-2">{wo.assigned_to_name || 'N/A'}</td>
                  <td className="border p-2">
                    <Button
                      onClick={() => handleOpenModal(wo)}
                      className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    >
                      Close WO
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between mt-4">
          <Button
            onClick={() => setState(prev => ({ ...prev, currentPage: Math.max(prev.currentPage - 1, 1) }))}
            disabled={state.currentPage === 1}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:bg-gray-300"
          >
            Previous
          </Button>
          <span>
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
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-black">Documents</h3>
            <p className="text-sm text-gray-600">Upload the following documents to close the work order:</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Order (Optional)</label>
            <input
              type="file"
              onChange={e => setState(prev => ({ ...prev, purchaseOrderFile: e.target.files[0] }))}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Work Order (Optional)</label>
            <input
              type="file"
              onChange={e => setState(prev => ({ ...prev, workOrderFile: e.target.files[0] }))}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Signed Delivery Note</label>
            <input
              type="file"
              onChange={e => setState(prev => ({ ...prev, signedDeliveryNoteFile: e.target.files[0] }))}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              onClick={handleCloseWO}
              disabled={!state.signedDeliveryNoteFile}
              className={`px-4 py-2 rounded-md ${state.signedDeliveryNoteFile ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-300 text-gray-500'}`}
            >
              Submit for Invoicing
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
    </div>
  );
};

export default CloseWorkOrder;