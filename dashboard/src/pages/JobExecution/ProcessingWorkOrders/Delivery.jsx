import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../../../helpers/apiClient';
import InputField from '../../../components/InputField';
import Button from '../../../components/Button';
import Modal from '../../../components/Modal';

const Delivery = () => {
  const [state, setState] = useState({
    deliveryNotes: [],
    searchTerm: '',
    sortBy: 'created_at',
    currentPage: 1,
    itemsPerPage: 20,
    isModalOpen: false,
    selectedDN: null,
    signedDeliveryNote: null,
  });

  const fetchDeliveryNotes = async () => {
    try {
      const response = await apiClient.get('delivery-notes/');
      setState(prev => ({ ...prev, deliveryNotes: response.data || [] }));
    } catch (error) {
      console.error('Error fetching delivery notes:', error);
      toast.error('Failed to load delivery notes.');
    }
  };

  useEffect(() => {
    fetchDeliveryNotes();
  }, []);

  const handleUploadSignedNote = async () => {
    try {
      const formData = new FormData();
      formData.append('signed_delivery_note', state.signedDeliveryNote);
      await apiClient.post(`delivery-notes/${state.selectedDN.id}/upload_signed_note/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Signed Delivery Note uploaded and status updated.');
      setState(prev => ({
        ...prev,
        isModalOpen: false,
        selectedDN: null,
        signedDeliveryNote: null,
      }));
      fetchDeliveryNotes();
    } catch (error) {
      console.error('Error uploading signed delivery note:', error);
      toast.error('Failed to upload signed delivery note.');
    }
  };

  const handleOpenModal = dn => {
    setState(prev => ({
      ...prev,
      isModalOpen: true,
      selectedDN: dn,
    }));
  };

  const filteredDNs = state.deliveryNotes
    .filter(dn =>
      (dn.work_order?.quotation?.company_name || '').toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      (dn.dn_number || '').toLowerCase().includes(state.searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (state.sortBy === 'created_at') {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (state.sortBy === 'company_name') {
        return (a.work_order?.quotation?.company_name || '').localeCompare(b.work_order?.quotation?.company_name || '');
      }
      return 0;
    });

  const totalPages = Math.ceil(filteredDNs.length / state.itemsPerPage);
  const startIndex = (state.currentPage - 1) * state.itemsPerPage;
  const currentDNs = filteredDNs.slice(startIndex, startIndex + state.itemsPerPage);

  return (
    <div className="mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Delivery</h1>
      <div className="bg-white p-4 space-y-4 rounded-md shadow w-full">
        <div className="mb-6 flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Delivery Notes</label>
            <InputField
              type="text"
              placeholder="Search by company name or DN Number..."
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
                <th className="border p-2 text-left text-sm font-medium text-gray-700">DN Number</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700">WO Number</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700">Company Name</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700">Created Date</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700">Assigned To</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700">Delivery Status</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentDNs.map((dn, index) => (
                <tr key={dn.id} className="border hover:bg-gray-50">
                  <td className="border p-2">{startIndex + index + 1}</td>
                  <td className="border p-2">{dn.dn_number || 'N/A'}</td>
                  <td className="border p-2">{dn.work_order?.wo_number || 'N/A'}</td>
                  <td className="border p-2">{dn.work_order?.quotation?.company_name || 'N/A'}</td>
                  <td className="border p-2">{new Date(dn.created_at).toLocaleDateString()}</td>
                  <td className="border p-2">{dn.work_order?.assigned_to_name || 'N/A'}</td>
                  <td className="border p-2">{dn.delivery_status}</td>
                  <td className="border p-2">
                    {dn.delivery_status === 'Delivery Pending' && (
                      <Button
                        onClick={() => handleOpenModal(dn)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                      >
                        Upload Signed DN
                      </Button>
                    )}
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
        onClose={() => setState(prev => ({ ...prev, isModalOpen: false, selectedDN: null, signedDeliveryNote: null }))}
        title="Upload Signed Delivery Note"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Signed Delivery Note</label>
            <input
              type="file"
              onChange={e => setState(prev => ({ ...prev, signedDeliveryNote: e.target.files[0] }))}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              onClick={handleUploadSignedNote}
              disabled={!state.signedDeliveryNote}
              className={`px-4 py-2 rounded-md ${state.signedDeliveryNote ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-300 text-gray-500'}`}
            >
              Upload
            </Button>
            <Button
              onClick={() => setState(prev => ({ ...prev, isModalOpen: false, selectedDN: null, signedDeliveryNote: null }))}
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

export default Delivery;