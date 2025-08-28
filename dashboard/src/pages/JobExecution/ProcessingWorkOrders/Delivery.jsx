import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../../helpers/apiClient';
import InputField from '../../../components/InputField';
import Button from '../../../components/Button';
import Modal from '../../../components/Modal';

const Delivery = () => {
  const navigate = useNavigate();
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

  const fetchData = async () => {
    try {
      const [dnRes, techRes, itemsRes, unitsRes] = await Promise.all([
        apiClient.get('delivery-notes/'),
        apiClient.get('technicians/'),
        apiClient.get('items/'),
        apiClient.get('units/'),
      ]);

      const deliveryNotes = dnRes.data || [];
      console.log('Fetched deliveryNotes:', deliveryNotes); 

      const workOrdersPromises = deliveryNotes.map((dn) =>
        apiClient.get(`/work-orders/${dn.work_order_id}/`).then((res) => ({
          id: dn.work_order_id, 
          work_order: res.data || {},
        })).catch((error) => {
          console.error(`Error fetching work order ${dn.work_order_id}:`, error);
          return { id: dn.work_order_id, work_order: {} };
        })
      );

      const workOrdersData = await Promise.all(workOrdersPromises);
      console.log('Fetched workOrdersData:', workOrdersData);

      const updatedDeliveryNotes = deliveryNotes.map((dn) => {
        const woData = workOrdersData.find((w) => w.id === dn.work_order_id);
        return {
          ...dn,
          work_order: woData ? woData.work_order : {},
        };
      });

      console.log('Updated deliveryNotes:', updatedDeliveryNotes);

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
      const deliveryNote = state.deliveryNotes.find((dn) => dn.work_order?.id === woId);
      setState((prev) => ({
        ...prev,
        isViewModalOpen: true,
        selectedWO: deliveryNote?.work_order || null,
      }));
    }
  };

  const handleInitiateDelivery = (workOrder) => {
    navigate(`/job-execution/processing-work-orders/delivery/${workOrder.id}`);
  };

  const hasDeliveryNote = (workOrderId) => {
    return state.deliveryNotes.some((dn) => dn.work_order_id === workOrderId);
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

  console.log('Filtered deliveryNotes:', filteredDNs);

  const totalPages = Math.ceil(filteredDNs.length / state.itemsPerPage);
  const startIndex = (state.currentPage - 1) * state.itemsPerPage;
  const currentDNs = filteredDNs.slice(startIndex, startIndex + state.itemsPerPage);
  console.log('Current deliveryNotes:', currentDNs);

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
      {filteredDNs.length === 0 && (
        <p className="text-gray-500 mb-4">No delivery notes match the current filter.</p>
      )}
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
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Sl No</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">DN Number</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">WO Number</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Created Date</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Delivery Status</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentDNs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="border p-2 text-center text-gray-500">
                    No delivery notes available.
                  </td>
                </tr>
              ) : (
                currentDNs.map((dn, index) => (
                  <tr key={dn.id} className="border hover:bg-gray-50">
                    <td className="border p-2 whitespace-nowrap">{startIndex + index + 1}</td>
                    <td className="border p-2 whitespace-nowrap">{dn.dn_number || 'N/A'}</td>
                    <td className="border p-2 whitespace-nowrap">{dn.work_order?.wo_number || 'N/A'}</td>
                    <td className="border p-2 whitespace-nowrap">
                      {dn.created_at ? new Date(dn.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="border p-2 whitespace-nowrap">{dn.delivery_status || 'N/A'}</td>
                    <td className="border p-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleViewWO(dn.work_order?.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm whitespace-nowrap"
                        >
                          View WO
                        </Button>
                        <Button
                          onClick={() => handleOpenModal(dn)}
                          disabled={
                            !hasPermission('delivery', 'edit') ||
                            !hasDeliveryNote(dn.work_order?.id) ||
                            dn.delivery_status === 'Delivered'
                          }
                          className={`px-3 py-1 rounded-md text-sm whitespace-nowrap ${
                            hasPermission('delivery', 'edit') &&
                            hasDeliveryNote(dn.work_order?.id) &&
                            dn.delivery_status !== 'Delivered'
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          Upload Signed DN
                        </Button>
                        <Button
                          onClick={() => handleInitiateDelivery(dn.work_order)}
                          disabled={
                            !hasPermission('delivery', 'edit') ||
                            hasDeliveryNote(dn.work_order?.id) ||
                            dn.work_order?.status !== 'Approved'
                          }
                          className={`px-3 py-1 rounded-md text-sm whitespace-nowrap ${
                            hasPermission('delivery', 'edit') &&
                            !hasDeliveryNote(dn.work_order?.id) &&
                            dn.work_order?.status === 'Approved'
                              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          Initiate Delivery
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-4 w-fit">
            <Button
              onClick={handlePrev}
              disabled={state.currentPage === 1}
              className="px-3 py-1 bg-gray-400 text-white rounded-md hover:bg-gray-500 disabled:bg-gray-300 min-w-fit whitespace-nowrap"
            >
              Prev
            </Button>
            {pageNumbers.map((page) => (
              <Button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 rounded-md min-w-fit whitespace-nowrap ${
                  state.currentPage === page ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {page}
              </Button>
            ))}
            <Button
              onClick={handleNext}
              disabled={state.currentPage === totalPages}
              className="px-3 py-1 bg-gray-400 text-white rounded-md hover:bg-gray-500 disabled:bg-gray-300 min-w-fit whitespace-nowrap"
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
              disabled={!state.signedDeliveryNote || !hasPermission('delivery', 'edit')}
              className={`px-4 py-2 rounded-md whitespace-nowrap ${
                state.signedDeliveryNote && hasPermission('delivery', 'edit')
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Upload
            </Button>
            <Button
              onClick={() => setState((prev) => ({ ...prev, isModalOpen: false, selectedDN: null, signedDeliveryNote: null }))}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 whitespace-nowrap"
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
        {state.selectedWO ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-black">Work Order Details</h3>
              <p><strong>WO Number:</strong> {state.selectedWO.wo_number || 'N/A'}</p>
              <p><strong>Status:</strong> {state.selectedWO.status || 'N/A'}</p>
              <p><strong>Created At:</strong> {state.selectedWO.created_at ? new Date(state.selectedWO.created_at).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Date Received:</strong> {state.selectedWO.date_received ? new Date(state.selectedWO.date_received).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Expected Completion:</strong> {state.selectedWO.expected_completion_date ? new Date(state.selectedWO.expected_completion_date).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Onsite/Lab:</strong> {state.selectedWO.onsite_or_lab || 'N/A'}</p>
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
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Range</th>
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
                          <td className="border p-2 whitespace-nowrap">{item.range || 'N/A'}</td>
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
        ) : (
          <p className="text-gray-500">No work order selected.</p>
        )}
      </Modal>
    </div>
  );
};

export default Delivery;