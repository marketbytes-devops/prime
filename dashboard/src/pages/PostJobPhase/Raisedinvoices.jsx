import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../../helpers/apiClient';
import InputField from '../../components/InputField';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { v4 as uuidv4 } from 'uuid';

const RaisedInvoices = () => {
  const [state, setState] = useState({
    workOrders: [],
    purchaseOrders: [],
    deliveryNotes: [],
    quotations: [],
    technicians: [],
    itemsList: [],
    units: [],
    searchTerm: '',
    sortBy: 'created_at',
    currentPage: 1,
    itemsPerPage: 20,
    isWOModalOpen: false,
    selectedWO: null,
    isPaymentModalOpen: false,
    selectedWorkOrderId: null,
    selectedDNItemId: null,
    paymentReferenceNumber: '',
    paymentReferenceError: '',
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
      const [woRes, poRes, dnRes, quotationsRes, techRes, itemsRes, unitsRes] = await Promise.all([
        apiClient.get('work-orders/'),
        apiClient.get('purchase-orders/'),
        apiClient.get('delivery-notes/'),
        apiClient.get('quotations/'),
        apiClient.get('technicians/'),
        apiClient.get('items/'),
        apiClient.get('units/'),
      ]);

      const deliveryNotes = dnRes.data
        .filter((dn) => dn.dn_number && !dn.dn_number.startsWith('TEMP-DN'))
        .map((dn) => ({
          ...dn,
          items: dn.items.map((item) => ({
            ...item,
            uom: item.uom ? Number(item.uom) : null,
            components: item.components || [],
            invoice_status: item.invoice_status ? item.invoice_status.toLowerCase() : 'pending',
          })),
        }));

      const workOrderDeliveryPairs = [];
      const workOrders = woRes.data || [];

      workOrders.forEach((workOrder) => {
        const relatedDNs = deliveryNotes.filter((dn) => dn.work_order_id === workOrder.id);
        if (relatedDNs.length > 0) {
          relatedDNs.forEach((dn) => {
            dn.items.forEach((dnItem) => {
              if (dnItem.invoice_status === 'processed') {
                workOrderDeliveryPairs.push({
                  id: `${workOrder.id}-${dn.id}-${dnItem.id}`,
                  workOrder,
                  deliveryNote: dn,
                  deliveryNoteItem: dnItem,
                  workOrderId: workOrder.id,
                  deliveryNoteId: dn.id,
                  deliveryNoteItemId: dnItem.id,
                });
              }
            });
          });
        }
      });

      setState((prev) => ({
        ...prev,
        workOrders,
        purchaseOrders: poRes.data || [],
        deliveryNotes,
        quotations: quotationsRes.data || [],
        technicians: techRes.data || [],
        itemsList: itemsRes.data || [],
        units: unitsRes.data || [],
        workOrderDeliveryPairs,
      }));
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data.');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleViewWO = (pair) => {
    setState((prev) => ({
      ...prev,
      isWOModalOpen: true,
      selectedWO: pair.workOrder,
      selectedDNItemId: pair.deliveryNoteItemId,
    }));
  };

  const handlePaymentProcess = (pair) => {
    setState((prev) => ({
      ...prev,
      isPaymentModalOpen: true,
      selectedWorkOrderId: pair.workOrderId,
      selectedDNItemId: pair.deliveryNoteItemId,
      paymentReferenceNumber: '',
      paymentReferenceError: '',
    }));
  };

  const validatePayment = () => {
    let isValid = true;
    const errors = { paymentReferenceError: '' };
    if (!state.paymentReferenceNumber.trim()) {
      errors.paymentReferenceError = 'Payment Reference Number is required';
      isValid = false;
    }
    setState((prev) => ({ ...prev, paymentReferenceError: errors.paymentReferenceError }));
    return isValid;
  };

  const handlePaymentSubmit = async () => {
    if (!validatePayment()) {
      return;
    }
    try {
      const formData = new FormData();
      formData.append('invoice_status', 'processed');
      formData.append('delivery_note_item_id', state.selectedDNItemId);
      formData.append('payment_reference_number', state.paymentReferenceNumber);

      await apiClient.patch(
        `work-orders/${state.selectedWorkOrderId}/update-delivery-note-item-invoice-status/`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      toast.success('Payment processed successfully.');
      setState((prev) => ({
        ...prev,
        isPaymentModalOpen: false,
        selectedWorkOrderId: null,
        selectedDNItemId: null,
        paymentReferenceNumber: '',
        paymentReferenceError: '',
      }));
      await fetchData();
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Failed to process payment.');
    }
  };

  const viewInvoice = (pair) => {
    if (pair.deliveryNoteItem?.invoice_file) {
      window.open(pair.deliveryNoteItem.invoice_file, '_blank');
    } else {
      toast.error('No invoice file available.');
    }
  };

  const getAssignedTechnicians = (items) => {
    const technicianIds = [...new Set(items?.map((item) => item.assigned_to).filter((id) => id))];
    if (technicianIds.length === 0) return 'None';
    if (technicianIds.length > 1) return 'Multiple';
    const technician = state.technicians.find((t) => t.id === technicianIds[0]);
    return technician ? `${technician.name} (${technician.designation || 'N/A'})` : 'N/A';
  };

  const getQuotationDetails = (workOrder) => {
    const po = state.purchaseOrders.find((po) => po.id === workOrder.purchase_order);
    const quotation = po ? state.quotations.find((q) => q.id === po.quotation) : null;
    return {
      company_name: quotation?.company_name || 'N/A',
      series_number: quotation?.series_number || 'N/A',
    };
  };

  const getWONumberByDN = (dn) => {
    const workOrder = state.workOrders.find((wo) => wo.id === dn.work_order_id);
    return workOrder?.wo_number || 'N/A';
  };

  const getDNSeriesNumber = (deliveryNote) => {
    return deliveryNote?.dn_number || 'N/A';
  };

  const getItemName = (itemId) => {
    const item = state.itemsList.find((i) => i.id === itemId);
    return item ? item.name : 'N/A';
  };

  const filteredPairs = state.workOrderDeliveryPairs
    .filter((pair) =>
      (pair.workOrder.wo_number || '').toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      getQuotationDetails(pair.workOrder).series_number.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      getDNSeriesNumber(pair.deliveryNote).toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      getQuotationDetails(pair.workOrder).company_name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      getItemName(pair.deliveryNoteItem.item).toLowerCase().includes(state.searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (state.sortBy === 'created_at') {
        return new Date(b.workOrder.created_at) - new Date(a.workOrder.created_at);
      }
      return 0;
    });

  const totalPages = Math.ceil(filteredPairs.length / state.itemsPerPage);
  const startIndex = (state.currentPage - 1) * state.itemsPerPage;
  const currentPairs = filteredPairs.slice(startIndex, startIndex + state.itemsPerPage);
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
      <h1 className="text-2xl font-bold mb-4">Processed Invoices</h1>
      <div className="bg-white p-4 space-y-4 rounded-md shadow w-full">
        <div className="mb-6 flex gap-4 items-center">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Invoices</label>
            <InputField
              type="text"
              placeholder="Search by WO Number, Quotation, DN Number, Company Name, or Item..."
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
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Sl No</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Company Name</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Quotation Number</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">WO Number</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">DN Number</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Item</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Created Date</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Assigned To</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Invoice Status</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentPairs.length === 0 ? (
                <tr>
                  <td colSpan="10" className="border p-2 text-center text-gray-500">
                    No processed invoices found.
                  </td>
                </tr>
              ) : (
                currentPairs.map((pair, index) => (
                  <tr key={pair.id} className="border hover:bg-gray-50">
                    <td className="border p-2 whitespace-nowrap">{startIndex + index + 1}</td>
                    <td className="border p-2 whitespace-nowrap">{getQuotationDetails(pair.workOrder).company_name}</td>
                    <td className="border p-2 whitespace-nowrap">{getQuotationDetails(pair.workOrder).series_number}</td>
                    <td className="border p-2 whitespace-nowrap">{pair.workOrder.wo_number || 'N/A'}</td>
                    <td className="border p-2 whitespace-nowrap">{getDNSeriesNumber(pair.deliveryNote)}</td>
                    <td className="border p-2 whitespace-nowrap">{getItemName(pair.deliveryNoteItem.item)}</td>
                    <td className="border p-2 whitespace-nowrap">{new Date(pair.workOrder.created_at).toLocaleDateString()}</td>
                    <td className="border p-2 whitespace-nowrap">{getAssignedTechnicians(pair.workOrder.items)}</td>
                    <td className="border p-2 whitespace-nowrap">{pair.deliveryNoteItem.invoice_status}</td>
                    <td className="border p-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handlePaymentProcess(pair)}
                          disabled={!hasPermission('raised_invoices', 'edit')}
                          className={`px-3 py-1 rounded-md text-sm whitespace-nowrap ${
                            hasPermission('raised_invoices', 'edit')
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          Payment Process
                        </Button>
                        <Button
                          onClick={() => viewInvoice(pair)}
                          className="px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm whitespace-nowrap"
                        >
                          View Invoice
                        </Button>
                        <Button
                          onClick={() => handleViewWO(pair)}
                          className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm whitespace-nowrap"
                        >
                          View WO
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
              className="px-3 py-1 bg-gray-400 text-white rounded-md hover:bg-gray-500 disabled:bg-gray-300 min-w-fit"
            >
              Prev
            </Button>
            {pageNumbers.map((page) => (
              <Button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 rounded-md min-w-fit ${
                  state.currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
        isOpen={state.isWOModalOpen}
        onClose={() => setState((prev) => ({ ...prev, isWOModalOpen: false, selectedWO: null, selectedDNItemId: null }))}
        title={`Work Order Details - ${state.selectedWO?.wo_number || 'N/A'}`}
      >
        {state.selectedWO ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-black">Work Order Details</h3>
              <p><strong className="text-sm font-medium text-gray-700 whitespace-nowrap">WO Number:</strong> {state.selectedWO.wo_number || 'N/A'}</p>
              <p><strong className="text-sm font-medium text-gray-700 whitespace-nowrap">Company Name:</strong> {getQuotationDetails(state.selectedWO).company_name}</p>
              <p><strong className="text-sm font-medium text-gray-700 whitespace-nowrap">Status:</strong> {state.selectedWO.status || 'N/A'}</p>
              <p><strong className="text-sm font-medium text-gray-700 whitespace-nowrap">Invoice Status:</strong> {state.workOrderDeliveryPairs.find((pair) => pair.workOrderId === state.selectedWO.id && pair.deliveryNoteItemId === state.selectedDNItemId)?.deliveryNoteItem.invoice_status || 'Processed'}</p>
              <p><strong className="text-sm font-medium text-gray-700 whitespace-nowrap">Manager Approval Status:</strong> {state.selectedWO.manager_approval_status || 'N/A'}</p>
              {state.selectedWO.manager_approval_status === 'Declined' && (
                <p><strong className="text-sm font-medium text-gray-700 whitespace-nowrap">Decline Reason:</strong> {state.selectedWO.decline_reason || 'N/A'}</p>
              )}
              <p><strong className="text-sm font-medium text-gray-700 whitespace-nowrap">Created At:</strong> {state.selectedWO.created_at ? new Date(state.selectedWO.created_at).toLocaleDateString() : 'N/A'}</p>
              <p><strong className="text-sm font-medium text-gray-700 whitespace-nowrap">Received Date:</strong> {state.workOrderDeliveryPairs.find((pair) => pair.workOrderId === state.selectedWO.id && pair.deliveryNoteItemId === state.selectedDNItemId)?.deliveryNoteItem.received_date ? new Date(state.workOrderDeliveryPairs.find((pair) => pair.workOrderId === state.selectedWO.id && pair.deliveryNoteItemId === state.selectedDNItemId).deliveryNoteItem.received_date).toLocaleDateString() : 'N/A'}</p>
              <p><strong className="text-sm font-medium text-gray-700 whitespace-nowrap">Expected Completion Date:</strong> {state.selectedWO.expected_completion_date ? new Date(state.selectedWO.expected_completion_date).toLocaleDateString() : 'N/A'}</p>
              <p><strong className="text-sm font-medium text-gray-700 whitespace-nowrap">Onsite/Lab:</strong> {state.selectedWO.onsite_or_lab || 'N/A'}</p>
              <p><strong className="text-sm font-medium text-gray-700 whitespace-nowrap">Site Location:</strong> {state.selectedWO.site_location || 'N/A'}</p>
              <p><strong className="text-sm font-medium text-gray-700 whitespace-nowrap">Remarks:</strong> {state.selectedWO.remarks || 'N/A'}</p>
              <p><strong className="text-sm font-medium text-gray-700 whitespace-nowrap">Invoice File:</strong> {state.workOrderDeliveryPairs.find((pair) => pair.workOrderId === state.selectedWO.id && pair.deliveryNoteItemId === state.selectedDNItemId)?.deliveryNoteItem.invoice_file ? (
                <a
                  href={state.workOrderDeliveryPairs.find((pair) => pair.workOrderId === state.selectedWO.id && pair.deliveryNoteItemId === state.selectedDNItemId)?.deliveryNoteItem.invoice_file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  View Invoice
                </a>
              ) : 'Not Uploaded'}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-black">Items</h3>
              {state.selectedWO.items && state.selectedWO.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Item</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Quantity</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Unit</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Assigned To</th>
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
                        <tr key={item.id} className="border hover:bg-gray-50">
                          <td className="border p-2 whitespace-nowrap">{state.itemsList.find((i) => i.id === item.item)?.name || 'N/A'}</td>
                          <td className="border p-2 whitespace-nowrap">{item.quantity || 'N/A'}</td>
                          <td className="border p-2 whitespace-nowrap">{state.units.find((u) => u.id === item.unit)?.name || 'N/A'}</td>
                          <td className="border p-2 whitespace-nowrap">{state.technicians.find((t) => t.id === item.assigned_to)?.name || 'N/A'}</td>
                          <td className="border p-2 whitespace-nowrap">{item.range || 'N/A'}</td>
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
                                className="text-blue-600 hover:text-blue-800"
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
        ) : (
          <p className="text-gray-500">No work order selected.</p>
        )}
      </Modal>

      <Modal
        isOpen={state.isPaymentModalOpen}
        onClose={() => setState((prev) => ({
          ...prev,
          isPaymentModalOpen: false,
          selectedWorkOrderId: null,
          selectedDNItemId: null,
          paymentReferenceNumber: '',
          paymentReferenceError: '',
        }))}
        title="Process Payment"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Reference Number</label>
            <InputField
              type="text"
              placeholder="Enter payment reference number"
              value={state.paymentReferenceNumber}
              onChange={(e) => setState((prev) => ({
                ...prev,
                paymentReferenceNumber: e.target.value,
                paymentReferenceError: '',
              }))}
              className="w-full p-2 border rounded focus:outline-indigo-500"
            />
            {state.paymentReferenceError && (
              <p className="text-red-500 text-sm mt-1">{state.paymentReferenceError}</p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => setState((prev) => ({
                ...prev,
                isPaymentModalOpen: false,
                selectedWorkOrderId: null,
                selectedDNItemId: null,
                paymentReferenceNumber: '',
                paymentReferenceError: '',
              }))}
              className="px-3 py-1 bg-gray-400 text-white rounded-md hover:bg-gray-500"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePaymentSubmit}
              disabled={!hasPermission('raised_invoices', 'edit')}
              className={`px-3 py-1 rounded-md ${
                hasPermission('raised_invoices', 'edit')
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Submit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RaisedInvoices;