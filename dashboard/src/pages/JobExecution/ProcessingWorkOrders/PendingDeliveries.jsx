import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../../helpers/apiClient';
import InputField from '../../../components/InputField';
import Button from '../../../components/Button';
import Modal from '../../../components/Modal';

const PendingDeliveries = () => {
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
    isViewModalOpen: false,
    selectedDN: null,
    isCompleteModalOpen: false,
    selectedDNForComplete: null,
    signedDeliveryNote: null,
    dueInDays: '',
    statusFilter: 'all',
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

      const updatedDeliveryNotes = deliveryNotes.map((dn) => {
        const woData = workOrdersData.find((w) => w.id === dn.work_order_id);
        return {
          ...dn,
          work_order: woData ? woData.work_order : {},
          // Use the embedded components directly from the API response
          items: dn.items.map((item) => ({
            ...item,
            components: item.components || [], // Ensure components is an array, default to empty if null/undefined
          })),
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

  const handleViewDN = (dn) => {
    setState((prev) => ({
      ...prev,
      isViewModalOpen: true,
      selectedDN: dn,
    }));
  };

  const handleCompleteDelivery = async () => {
    const { selectedDNForComplete, signedDeliveryNote, dueInDays } = state;
    if (!signedDeliveryNote) {
      toast.error('Please upload a signed delivery note.');
      return;
    }
    if (!dueInDays || isNaN(dueInDays) || parseInt(dueInDays) <= 0) {
      toast.error('Please enter a valid number of days for invoice due date.');
      return;
    }

    if (!window.confirm('Are you sure you want to complete this delivery? This will move the work order to Pending Invoices.')) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append('signed_delivery_note', signedDeliveryNote);
      await apiClient.post(`delivery-notes/${selectedDNForComplete.id}/upload-signed-note/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await apiClient.post(`work-orders/${selectedDNForComplete.work_order_id}/update-invoice-status/`, {
        invoice_status: 'Raised',
        due_in_days: parseInt(dueInDays),
      });

      toast.success('Delivery completed and work order moved to Pending Invoices.');
      setState((prev) => ({
        ...prev,
        isCompleteModalOpen: false,
        selectedDNForComplete: null,
        signedDeliveryNote: null,
        dueInDays: '',
      }));
      fetchData();
    } catch (error) {
      console.error('Error completing delivery:', error);
      toast.error('Failed to complete delivery.');
    }
  };

  const handleOpenCompleteModal = (dn) => {
    setState((prev) => ({
      ...prev,
      isCompleteModalOpen: true,
      selectedDNForComplete: dn,
      signedDeliveryNote: null,
      dueInDays: '',
    }));
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
      <h1 className="text-2xl font-bold mb-4">Pending Deliveries</h1>
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
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">DN Series Number</th>
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
                    <td className="border p-2 whitespace-nowrap">{new Date(dn.created_at).toLocaleDateString()}</td>
                    <td className="border p-2 whitespace-nowrap">{dn.delivery_status || 'N/A'}</td>
                    <td className="border p-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleViewDN(dn)}
                          className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm whitespace-nowrap"
                        >
                          View DN
                        </Button>
                        <Button
                          onClick={() => handleOpenCompleteModal(dn)}
                          disabled={!hasPermission('delivery', 'edit') || dn.delivery_status === 'Delivered'}
                          className={`px-3 py-1 rounded-md text-sm whitespace-nowrap ${
                            hasPermission('delivery', 'edit') && dn.delivery_status !== 'Delivered'
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          Complete Delivery
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
        isOpen={state.isViewModalOpen}
        onClose={() => setState((prev) => ({ ...prev, isViewModalOpen: false, selectedDN: null }))}
        title={`Delivery Note Details - ${state.selectedDN?.dn_number || 'N/A'}`}
      >
        {state.selectedDN ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-black">Delivery Note Details</h3>
              <p><strong>DN Number:</strong> {state.selectedDN.dn_number || 'N/A'}</p>
              <p><strong>Work Order Number:</strong> {state.selectedDN.work_order?.wo_number || 'N/A'}</p>
              <p><strong>Delivery Status:</strong> {state.selectedDN.delivery_status || 'N/A'}</p>
              <p><strong>Created At:</strong> {state.selectedDN.created_at ? new Date(state.selectedDN.created_at).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Signed Delivery Note:</strong> {state.selectedDN.signed_delivery_note ? (
                <a href={state.selectedDN.signed_delivery_note} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  View Signed DN
                </a>
              ) : 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-black">Items</h3>
              {state.selectedDN.items && state.selectedDN.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Item</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Range</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Quantity</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Delivered Quantity</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Unit</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Components {"(Component : Value)"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.selectedDN.items.map((item) => (
                        <tr key={item.id} className="border">
                          <td className="border p-2 whitespace-nowrap">{state.itemsList.find((i) => i.id === item.item)?.name || 'N/A'}</td>
                          <td className="border p-2 whitespace-nowrap">{item.range || 'N/A'}</td>
                          <td className="border p-2 whitespace-nowrap">{item.quantity || 'N/A'}</td>
                          <td className="border p-2 whitespace-nowrap">{item.delivered_quantity || 'N/A'}</td>
                          <td className="border p-2 whitespace-nowrap">
                            {state.units.find((u) => u.id === parseInt(item.uom))?.name || 'N/A'}
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            {item.components && item.components.length > 0 ? (
                              <ul className="list-decimal pl-4">
                                {item.components.map((comp, index) => (
                                  <li key={index}>
                                    {comp.component} : {comp.value}
                                  </li>
                                ))}
                              </ul>
                            ) : 'N/A'}
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
          <p className="text-gray-500">No delivery note selected.</p>
        )}
      </Modal>
      <Modal
        isOpen={state.isCompleteModalOpen}
        onClose={() => setState((prev) => ({ ...prev, isCompleteModalOpen: false, selectedDNForComplete: null, signedDeliveryNote: null, dueInDays: '' }))}
        title="Complete Delivery"
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due in Days</label>
            <InputField
              type="number"
              placeholder="Enter number of days"
              value={state.dueInDays}
              onChange={(e) => setState((prev) => ({ ...prev, dueInDays: e.target.value }))}
              className="w-full p-2 border rounded focus:outline-indigo-500"
              min="1"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              onClick={handleCompleteDelivery}
              disabled={!state.signedDeliveryNote || !state.dueInDays || !hasPermission('delivery', 'edit')}
              className={`px-4 py-2 rounded-md whitespace-nowrap ${
                state.signedDeliveryNote && state.dueInDays && hasPermission('delivery', 'edit')
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Complete
            </Button>
            <Button
              onClick={() => setState((prev) => ({ ...prev, isCompleteModalOpen: false, selectedDNForComplete: null, signedDeliveryNote: null, dueInDays: '' }))}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 whitespace-nowrap"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PendingDeliveries;