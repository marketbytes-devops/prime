import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../../helpers/apiClient';
import InputField from '../../../components/InputField';
import Button from '../../../components/Button';
import Modal from '../../../components/Modal';
import Template1 from '../../../components/Templates/DeliveryNote/Template1';

const PendingDeliveries = () => {
  const navigate = useNavigate();
  const templateRef = useRef(null);
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
        apiClient.get('delivery-notes/', {
          params: { delivery_status: 'Delivery Pending' },
        }),
        apiClient.get('technicians/'),
        apiClient.get('items/'),
        apiClient.get('units/'),
      ]);

      const filteredDeliveryNotes = (dnRes.data || []).filter(
        (dn) => dn.dn_number && !dn.dn_number.startsWith('TEMP-DN')
      );

      setState((prev) => ({
        ...prev,
        deliveryNotes: filteredDeliveryNotes,
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

  const handleOpenCompleteModal = (dn) => {
    setState((prev) => ({
      ...prev,
      isCompleteModalOpen: true,
      selectedDNForComplete: dn,
      signedDeliveryNote: null,
      dueInDays: '',
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

      await apiClient.post(`work-orders/${selectedDNForComplete.work_order.id}/update-invoice-status/`, {
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

  const handlePrint = (dn) => {
    if (templateRef.current) {
      setState((prev) => ({
        ...prev,
        selectedDN: dn, // Temporarily set selectedDN for rendering Template1
      }));
      setTimeout(() => {
        const printContent = templateRef.current;
        const printWindow = window.open('', '_blank');

        printWindow.document.write(`
          <html>
            <head>
              <title>Delivery Note - ${dn.dn_number || 'N/A'}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { border: 1px solid #000; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .text-center { text-align: center; }
                .font-bold { font-weight: bold; }
                .mb-4 { margin-bottom: 16px; }
                .mt-8 { margin-top: 32px; }
                .text-xs { font-size: 12px; }
                .no-border { border: none; }
                .item-divider { border-bottom: 2px solid #000; }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);

        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }, 0); // Use setTimeout to ensure templateRef is updated
    }
  };

  const filteredDNs = state.deliveryNotes
    .filter(
      (dn) =>
        (dn.dn_number || '').toLowerCase().includes(state.searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (state.sortBy === 'created_at') {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (state.sortBy === 'dn_number') {
        return (a.dn_number || '').localeCompare(b.dn_number || '');
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
    <>
      <div className="hidden">
        <div ref={templateRef}>
          <Template1 deliveryNote={state.selectedDN} itemsList={state.itemsList} units={state.units} />
        </div>
      </div>
      <div className="mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Pending Deliveries</h1>
        {filteredDNs.length === 0 && (
          <div className="text-center text-gray-500 mt-4">No delivery notes match the current filter.</div>
        )}
        <div className="bg-white p-4 space-y-4 rounded-md shadow w-full">
          <div className="mb-6 flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Delivery Notes</label>
              <InputField
                type="text"
                placeholder="Search by DN Number..."
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
                <option value="dn_number">DN Number</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left text-sm font-medium text-gray-700">Sl No</th>
                  <th className="border p-2 text-left text-sm font-medium text-gray-700">DN Number</th>
                  <th className="border p-2 text-left text-sm font-medium text-gray-700">Created At</th>
                  <th className="border p-2 text-left text-sm font-medium text-gray-700">Delivery Status</th>
                  <th className="border p-2 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentDNs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="border p-2 text-center text-gray-500">
                      No delivery notes available.
                    </td>
                  </tr>
                ) : (
                  currentDNs.map((dn, index) => (
                    <tr key={dn.id} className="border hover:bg-gray-50">
                      <td className="border p-2">{startIndex + index + 1}</td>
                      <td className="border p-2">{dn.dn_number || 'N/A'}</td>
                      <td className="border p-2">{new Date(dn.created_at).toLocaleDateString()}</td>
                      <td className="border p-2">{dn.delivery_status || 'N/A'}</td>
                      <td className="border p-2">
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleViewDN(dn)}
                            className="whitespace-nowrap px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                          >
                            View DN
                          </Button>
                          <Button
                            onClick={() => handleOpenCompleteModal(dn)}
                            disabled={!hasPermission('delivery', 'edit') || dn.delivery_status === 'Delivered'}
                            className={`whitespace-nowrap px-3 py-1 rounded-md text-sm ${hasPermission('delivery', 'edit') && dn.delivery_status !== 'Delivered'
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }`}
                          >
                            Complete Delivery
                          </Button>
                          <Button
                            onClick={() => handlePrint(dn)}
                            className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                          >
                            Print DN
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
                className={`px-3 py-1 rounded-md min-w-fit ${state.currentPage === page ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
          onClose={() => setState((prev) => ({ ...prev, isViewModalOpen: false, selectedDN: null }))}
          title={`Delivery Note Details - ${state.selectedDN?.dn_number || 'N/A'}`}
        >
          {state.selectedDN ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-black">Delivery Note Details</h3>
                <p><strong>DN Number:</strong> {state.selectedDN.dn_number || 'N/A'}</p>
                <p><strong>Delivery Status:</strong> {state.selectedDN.delivery_status || 'N/A'}</p>
                <p>
                  <strong>Created At:</strong>{' '}
                  {state.selectedDN.created_at ? new Date(state.selectedDN.created_at).toLocaleDateString() : 'N/A'}
                </p>
                <p>
                  <strong>Signed Delivery Note:</strong>{' '}
                  {state.selectedDN.signed_delivery_note ? (
                    <a
                      href={state.selectedDN.signed_delivery_note}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View Signed DN
                    </a>
                  ) : (
                    'N/A'
                  )}
                </p>
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
                          <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Components</th>
                        </tr>
                      </thead>
                      <tbody>
                        {state.selectedDN.items.map((item) => (
                          <tr key={item.id} className="border">
                            <td className="border p-2 whitespace-nowrap">
                              {state.itemsList.find((i) => i.id === item.item)?.name || 'N/A'}
                            </td>
                            <td className="border p-2 whitespace-nowrap">{item.range || 'N/A'}</td>
                            <td className="border p-2 whitespace-nowrap">{item.quantity || 'N/A'}</td>
                            <td className="border p-2 whitespace-nowrap">{item.delivered_quantity || 'N/A'}</td>
                            <td className="border p-2 whitespace-nowrap">
                              {state.units.find((u) => u.id === Number(item.uom))?.name || 'N/A'}
                            </td>
                            <td className="border p-2 whitespace-nowrap bg-gray-100">
                              {item.components && item.components.length > 0 ? (
                                <div className="space-y-2">
                                  {item.components.map((comp, index) => (
                                    <div
                                      key={index}
                                      className="flex items-center gap-2 p-2 border border-gray-300 rounded-md bg-white"
                                    >
                                      <span className="font-medium text-gray-700">{comp.component || 'N/A'} :</span>
                                      <span className="text-gray-600">{comp.value || 'N/A'}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                'No components'
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
            <p className="text-gray-500">No delivery note selected.</p>
          )}
        </Modal>
        <Modal
          isOpen={state.isCompleteModalOpen}
          onClose={() =>
            setState((prev) => ({
              ...prev,
              isCompleteModalOpen: false,
              selectedDNForComplete: null,
              signedDeliveryNote: null,
              dueInDays: '',
            }))
          }
          title={`Complete Delivery - ${state.selectedDNForComplete?.dn_number || 'N/A'}`}
        >
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-black">Complete Delivery</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload Signed Delivery Note</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setState((prev) => ({ ...prev, signedDeliveryNote: e.target.files[0] }))}
                className="w-full p-2 border rounded focus:outline-indigo-500"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Due in Days for Invoice</label>
              <InputField
                type="number"
                value={state.dueInDays}
                onChange={(e) => setState((prev) => ({ ...prev, dueInDays: e.target.value }))}
                className="w-full p-2 border rounded focus:outline-indigo-500"
                min="1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    isCompleteModalOpen: false,
                    selectedDNForComplete: null,
                    signedDeliveryNote: null,
                    dueInDays: '',
                  }))
                }
                className="px-3 py-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCompleteDelivery}
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Complete
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
};

export default PendingDeliveries;