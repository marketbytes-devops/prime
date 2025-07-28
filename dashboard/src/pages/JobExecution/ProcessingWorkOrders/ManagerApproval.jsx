import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../../../helpers/apiClient';
import Button from '../../../components/Button';
import Modal from '../../../components/Modal';

const ManagerApproval = () => {
  const [state, setState] = useState({
    workOrders: [],
    searchTerm: '',
    sortBy: 'created_at',
    currentPage: 1,
    itemsPerPage: 20,
    isModalOpen: false,
    selectedWO: null,
    declineReason: '',
    deliveryNoteType: '',
  });

  const fetchWorkOrders = async () => {
    try {
      const response = await apiClient.get('work-orders/', { params: { status: 'Manager Approval' } });
      setState(prev => ({ ...prev, workOrders: response.data || [] }));
    } catch (error) {
      console.error('Error fetching work orders:', error);
      toast.error('Failed to load work orders.');
    }
  };

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const handleApprove = async wo => {
    try {
      await apiClient.post(`work-orders/${wo.id}/approve/`, {
        delivery_note_type: state.deliveryNoteType,
      });
      toast.success('Work Order approved and Delivery Note created.');
      fetchWorkOrders();
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
      toast.success('Work Order declined.');
      setState(prev => ({ ...prev, isModalOpen: false, selectedWO: null, declineReason: '' }));
      fetchWorkOrders();
    } catch (error) {
      console.error('Error declining work order:', error);
      toast.error('Failed to decline Work Order.');
    }
  };

  const filteredWOs = state.workOrders
    .filter(wo =>
      (wo.quotation.company_name || '').toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      (wo.wo_number || '').toLowerCase().includes(state.searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (state.sortBy === 'created_at') {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (state.sortBy === 'company_name') {
        return (a.quotation.company_name || '').localeCompare(b.quotation.company_name || '');
      }
      return 0;
    });

  const totalPages = Math.ceil(filteredWOs.length / state.itemsPerPage);
  const startIndex = (state.currentPage - 1) * state.itemsPerPage;
  const currentWOs = filteredWOs.slice(startIndex, startIndex + state.itemsPerPage);

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
                  <td className="border p-2">{wo.quotation.company_name || 'N/A'}</td>
                  <td className="border p-2">{new Date(wo.created_at).toLocaleDateString()}</td>
                  <td className="border p-2">{wo.assigned_to_name || 'N/A'}</td>
                  <td className="border p-2">
                    <Button
                      onClick={() => handleApprove(wo)}
                      className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() => setState(prev => ({ ...prev, isModalOpen: true, selectedWO: wo }))}
                      className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                    >
                      Decline
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Modal
        isOpen={state.isModalOpen}
        onClose={() => setState(prev => ({ ...prev, isModalOpen: false, selectedWO: null, declineReason: '' }))}
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
              onClick={() => setState(prev => ({ ...prev, isModalOpen: false, selectedWO: null, declineReason: '' }))}
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