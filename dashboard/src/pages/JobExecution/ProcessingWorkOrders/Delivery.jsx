import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../../../helpers/apiClient';
import InputField from '../../../components/InputField';
import Button from '../../../components/Button';
import Modal from '../../../components/Modal';

const Delivery = () => {
  const [state, setState] = useState({
    deliveryNotes: [],
    technicians: [],
    itemsList: [],
    units: [],
    searchTerm: '',
    sortBy: 'created_at',
    currentPage: 1,
    itemsPerPage: 20,
    isModalOpen: false,
    selectedDN: null,
    signedDeliveryNote: null,
    statusFilter: 'all',
    isViewModalOpen: false,
    selectedWO: null,
  });

  const fetchData = async () => {
    try {
      const [dnRes, techRes, itemsRes, unitsRes] = await Promise.all([
        apiClient.get('delivery-notes/'),
        apiClient.get('technicians/'),
        apiClient.get('items/'),
        apiClient.get('units/'),
      ]);
      const deliveryNotes = dnRes.data || [];
      const workOrdersPromises = deliveryNotes.map((dn) =>
        apiClient.get(`/work-orders/?id=${dn.work_order}`).then((res) => ({
          id: dn.id,
          work_order: res.data[0] || {},
        }))
      );
      const workOrdersData = await Promise.all(workOrdersPromises);

      const updatedDeliveryNotes = deliveryNotes.map((dn) => {
        const woData = workOrdersData.find((w) => w.id === dn.id);
        return {
          ...dn,
          work_order: woData ? woData.work_order : {},
        };
      });

      setState((prev) => ({
        ...prev,
        deliveryNotes: updatedDeliveryNotes,
        technicians: techRes.data || [],
        itemsList: itemsRes.data || [],
        units: unitsRes.data || [],
      }));
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load delivery notes.');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUploadSignedNote = async () => {
    try {
      const formData = new FormData();
      formData.append('signed_delivery_note', state.signedDeliveryNote);
      await apiClient.post(`delivery-notes/${state.selectedDN.id}/upload-signed-note/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await apiClient.patch(`delivery-notes/${state.selectedDN.id}/`, { delivery_status: 'Delivered' });
      toast.success('Signed Delivery Note uploaded and status updated to Delivered.');
      setState((prev) => ({
        ...prev,
        isModalOpen: false,
        selectedDN: null,
        signedDeliveryNote: null,
      }));
      fetchData();
    } catch (error) {
      console.error('Error uploading signed delivery note:', error);
      toast.error('Failed to upload signed delivery note.');
    }
  };

  const handleOpenModal = (dn) => {
    setState((prev) => ({
      ...prev,
      isModalOpen: true,
      selectedDN: dn,
    }));
  };

  const handleViewWO = (woId) => {
    if (woId) {
      const workOrder = state.deliveryNotes.find((dn) => dn.work_order?.id === woId)?.work_order;
      setState((prev) => ({
        ...prev,
        isViewModalOpen: true,
        selectedWO: workOrder || null,
      }));
    }
  };

  const getAssignedTechnicians = (items) => {
    const technicianIds = [...new Set(items.map((item) => item.assigned_to).filter((id) => id))];
    if (technicianIds.length === 0) return 'None';
    if (technicianIds.length > 1) return 'Multiple';
    const technician = state.technicians.find((t) => t.id === technicianIds[0]);
    return technician ? `${technician.name} (${technician.designation || 'N/A'})` : 'None';
  };

  const filteredDNs = state.deliveryNotes
    .filter(
      (dn) =>
        (dn.work_order?.wo_number || '').toLowerCase().includes(state.searchTerm.toLowerCase()) ||
        (dn.dn_number || '').toLowerCase().includes(state.searchTerm.toLowerCase())
    )
    .filter((dn) => state.statusFilter === 'all' || dn.delivery_status === state.statusFilter)
    .sort((a, b) => {
      if (state.sortBy === 'created_at') {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      return 0;
    });

  const totalPages = Math.ceil(filteredDNs.length / state.itemsPerPage);
  const startIndex = (state.currentPage - 1) * state.itemsPerPage;
  const currentDNs = filteredDNs.slice(startIndex, startIndex + state.itemsPerPage);

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
      <h1 className="text-2xl font-bold mb-4">Delivery</h1>
      <div className="bg-white p-4 space-y-4 rounded-md shadow w-full">
        <div className="mb-6 flex gap-4 items-center">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Delivery Notes</label>
            <InputField
              type="text"
              placeholder="Search by WO Number or DN Number..."
              value={state.searchTerm}
              onChange={(e) => setState((prev) => ({ ...prev, searchTerm: e.target.value }))}
              className="w-full p-2 border rounded focus:outline-indigo-500"
            />
          </div>
          <div className="w-40">
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={state.sortBy}
              onChange={(e) => setState((prev) => ({ ...prev, sortBy: e.target.value }))}
              className="w-full p-2 border rounded focus:outline-indigo-500"
            >
              <option value="created_at">Creation Date</option>
            </select>
          </div>
          <div className="w-40">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status Filter</label>
            <select
              value={state.statusFilter}
              onChange={(e) => setState((prev) => ({ ...prev, statusFilter: e.target.value }))}
              className="w-full p-2 border rounded focus:outline-indigo-500"
            >
              <option value="all">All</option>
              <option value="Delivery Pending">Delivery Pending</option>
              <option value="Delivered">Delivered</option>
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
                  <td className="border p-2">{new Date(dn.created_at).toLocaleDateString()}</td>
                  <td className="border p-2">{dn.work_order?.items ? getAssignedTechnicians(dn.work_order.items) : 'None'}</td>
                  <td className="border p-2">{dn.delivery_status}</td>
                  <td className="border p-2">
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleViewWO(dn.work_order?.id)}
                        className="whitespace-nowrap px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                      >
                        View WO
                      </Button>
                      <Button
                        onClick={() => handleOpenModal(dn)}
                        className="whitespace-nowrap px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                      >
                        Upload Signed DN
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
      </div>
      <Modal
        isOpen={state.isModalOpen}
        onClose={() => setState((prev) => ({ ...prev, isModalOpen: false, selectedDN: null, signedDeliveryNote: null }))}
        title="Upload Signed Delivery Note"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Signed Delivery Note</label>
            <input
              type="file"
              onChange={(e) => setState((prev) => ({ ...prev, signedDeliveryNote: e.target.files[0] }))}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              onClick={handleUploadSignedNote}
              disabled={!state.signedDeliveryNote}
              className={`whitespace-nowrap px-4 py-2 rounded-md ${state.signedDeliveryNote ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-300 text-gray-500'}`}
            >
              Upload
            </Button>
            <Button
              onClick={() => setState((prev) => ({ ...prev, isModalOpen: false, selectedDN: null, signedDeliveryNote: null }))}
              className="whitespace-nowrap px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={state.isViewModalOpen}
        onClose={() => setState((prev) => ({ ...prev, isViewModalOpen: false, selectedWO: null }))}
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
                              <a href={item.certificate_file} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
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

export default Delivery;