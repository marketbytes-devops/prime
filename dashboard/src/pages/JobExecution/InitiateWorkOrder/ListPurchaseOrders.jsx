import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../../helpers/apiClient';
import InputField from '../../../components/InputField';
import Button from '../../../components/Button';
import Modal from '../../../components/Modal';

const ListPurchaseOrders = () => {
  const navigate = useNavigate();
  const [state, setState] = useState({
    purchaseOrders: [],
    teamMembers: [],
    searchTerm: '',
    sortBy: 'created_at',
    currentPage: 1,
    itemsPerPage: 20,
    isModalOpen: false,
    selectedPO: null,
    isWOModalOpen: false,
    woType: '',
    dateReceived: '',
    expectedCompletionDate: '',
    onsiteOrLab: '',
    range: '',
    serialNumber: '',
    siteLocation: '',
    remarks: '',
    assignedTo: '',
  });

  const fetchPurchaseOrders = async () => {
    try {
      const [poRes, teamRes] = await Promise.all([
        apiClient.get('purchase-orders/'),
        apiClient.get('teams/'),
      ]);
      setState(prev => ({
        ...prev,
        purchaseOrders: poRes.data || [],
        teamMembers: teamRes.data || [],
      }));
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load purchase orders.');
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const handleConvertToWO = po => {
    setState(prev => ({
      ...prev,
      isWOModalOpen: true,
      selectedPO: po,
    }));
  };

  const handleWOSubmit = async () => {
    try {
      const payload = {
        purchase_order: state.selectedPO.id,
        quotation: state.selectedPO.quotation,
        status: 'Collection Pending',
        date_received: state.dateReceived,
        expected_completion_date: state.expectedCompletionDate,
        onsite_or_lab: state.onsiteOrLab,
        range: state.range,
        serial_number: state.serialNumber,
        site_location: state.siteLocation,
        remarks: state.remarks,
        assigned_to: state.assignedTo,
        created_by: state.teamMembers.find(m => m.email === localStorage.getItem('userEmail'))?.id,
      };
      await apiClient.post('work-orders/', payload);
      toast.success('Work Order created successfully.');
      setState(prev => ({
        ...prev,
        isWOModalOpen: false,
        selectedPO: null,
        woType: '',
        dateReceived: '',
        expectedCompletionDate: '',
        onsiteOrLab: '',
        range: '',
        serialNumber: '',
        siteLocation: '',
        remarks: '',
        assignedTo: '',
      }));
      fetchPurchaseOrders();
    } catch (error) {
      console.error('Error creating work order:', error);
      toast.error('Failed to create Work Order.');
    }
  };

  const filteredPOs = state.purchaseOrders
    .filter(po =>
      (po.quotation.company_name || '').toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      (po.id || '').toString().includes(state.searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (state.sortBy === 'created_at') {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (state.sortBy === 'company_name') {
        return (a.quotation.company_name || '').localeCompare(b.quotation.company_name || '');
      }
      return 0;
    });

  const totalPages = Math.ceil(filteredPOs.length / state.itemsPerPage);
  const startIndex = (state.currentPage - 1) * state.itemsPerPage;
  const currentPOs = filteredPOs.slice(startIndex, startIndex + state.itemsPerPage);

  return (
    <div className="mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Initiate Work Order</h1>
      <div className="bg-white p-4 space-y-4 rounded-md shadow w-full">
        <div className="mb-6 flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Purchase Orders</label>
            <InputField
              type="text"
              placeholder="Search by company name or PO ID..."
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
                <th className="border p-2 text-left text-sm font-medium text-gray-700">PO ID</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700">Company Name</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700">Created Date</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700">Assigned To</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentPOs.map((po, index) => (
                <tr key={po.id} className="border hover:bg-gray-50">
                  <td className="border p-2">{startIndex + index + 1}</td>
                  <td className="border p-2">{po.id}</td>
                  <td className="border p-2">{po.quotation.company_name || 'N/A'}</td>
                  <td className="border p-2">{new Date(po.created_at).toLocaleDateString()}</td>
                  <td className="border p-2">{po.quotation.assigned_sales_person_name || 'N/A'}</td>
                  <td className="border p-2">{po.quotation.quotation_status}</td>
                  <td className="border p-2">
                    <Button
                      onClick={() => handleConvertToWO(po)}
                      className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    >
                      Convert to Work Order
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Modal
        isOpen={state.isWOModalOpen}
        onClose={() => setState(prev => ({ ...prev, isWOModalOpen: false, selectedPO: null }))}
        title="Create Work Order"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Work Order Type</label>
            <select
              value={state.woType}
              onChange={e => setState(prev => ({ ...prev, woType: e.target.value }))}
              className="p-2 border rounded w-full"
            >
              <option value="">Select Type</option>
              <option value="Single">Single WO</option>
              <option value="Split">Split WO</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Received</label>
            <InputField
              type="date"
              value={state.dateReceived}
              onChange={e => setState(prev => ({ ...prev, dateReceived: e.target.value }))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Completion Date</label>
            <InputField
              type="date"
              value={state.expectedCompletionDate}
              onChange={e => setState(prev => ({ ...prev, expectedCompletionDate: e.target.value }))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Onsite or Lab</label>
            <select
              value={state.onsiteOrLab}
              onChange={e => setState(prev => ({ ...prev, onsiteOrLab: e.target.value }))}
              className="p-2 border rounded w-full"
            >
              <option value="">Select</option>
              <option value="Onsite">Onsite</option>
              <option value="Lab">Lab</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Range</label>
            <InputField
              type="text"
              value={state.range}
              onChange={e => setState(prev => ({ ...prev, range: e.target.value }))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
            <InputField
              type="text"
              value={state.serialNumber}
              onChange={e => setState(prev => ({ ...prev, serialNumber: e.target.value }))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Site Location</label>
            <InputField
              type="text"
              value={state.siteLocation}
              onChange={e => setState(prev => ({ ...prev, siteLocation: e.target.value }))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
            <InputField
              type="text"
              value={state.remarks}
              onChange={e => setState(prev => ({ ...prev, remarks: e.target.value }))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
            <select
              value={state.assignedTo}
              onChange={e => setState(prev => ({ ...prev, assignedTo: e.target.value }))}
              className="p-2 border rounded w-full"
            >
              <option value="">Select Technician</option>
              {state.teamMembers.map(member => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              onClick={handleWOSubmit}
              disabled={!state.woType || !state.dateReceived || !state.expectedCompletionDate}
              className={`px-4 py-2 rounded-md ${state.woType && state.dateReceived && state.expectedCompletionDate ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-300 text-gray-500'}`}
            >
              Submit
            </Button>
            <Button
              onClick={() => setState(prev => ({ ...prev, isWOModalOpen: false, selectedPO: null }))}
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

export default ListPurchaseOrders;