import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../../helpers/apiClient';
import InputField from '../../components/InputField';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

const ProcessedInvoices = () => {
  const [state, setState] = useState({
    workOrders: [],
    purchaseOrders: [], // Added to store purchase orders
    quotations: [], // Added to store quotations
    technicians: [],
    itemsList: [],
    units: [],
    searchTerm: '',
    sortBy: 'created_at',
    currentPage: 1,
    itemsPerPage: 20,
    isWOModalOpen: false,
    selectedWO: null,
    paymentReferenceNumbers: {}, // Store input values for each work order
    paymentRefErrors: {}, // Store validation errors for each work order
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
      const [woRes, poRes, quotationsRes, techRes, itemsRes, unitsRes] = await Promise.all([
        apiClient.get('work-orders/'),
        apiClient.get('purchase-orders/'), // Added to fetch purchase orders
        apiClient.get('quotations/'), // Added to fetch quotations
        apiClient.get('technicians/'),
        apiClient.get('items/'),
        apiClient.get('units/'),
      ]);

      const paymentReferenceNumbers = {};
      (woRes.data || []).forEach((wo) => {
        paymentReferenceNumbers[wo.id] = wo.payment_reference_number || '';
      });

      setState((prev) => ({
        ...prev,
        workOrders: woRes.data || [],
        purchaseOrders: poRes.data || [], // Store purchase orders
        quotations: quotationsRes.data || [], // Store quotations
        technicians: techRes.data || [],
        itemsList: itemsRes.data || [],
        units: unitsRes.data || [],
        paymentReferenceNumbers,
        paymentRefErrors: {},
      }));
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data.');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleViewWO = (workOrder) => {
    setState((prev) => ({
      ...prev,
      isWOModalOpen: true,
      selectedWO: workOrder,
    }));
  };

  const viewInvoice = (workOrder) => {
    if (workOrder.invoice_file) {
      window.open(workOrder.invoice_file, '_blank');
    } else {
      toast.error(`No invoice file found for WO ${workOrder.wo_number}`);
    }
  };

  const validatePaymentRef = (value) => {
    if (!value.trim()) {
      return 'Payment Reference Number is required';
    }
    return '';
  };

  const handlePaymentRefChange = (workOrderId, value) => {
    setState((prev) => ({
      ...prev,
      paymentReferenceNumbers: {
        ...prev.paymentReferenceNumbers,
        [workOrderId]: value,
      },
      paymentRefErrors: {
        ...prev.paymentRefErrors,
        [workOrderId]: validatePaymentRef(value),
      },
    }));
  };

  const handlePaymentRefSubmit = async (workOrderId) => {
    const value = state.paymentReferenceNumbers[workOrderId];
    const error = validatePaymentRef(value);
    if (error) {
      setState((prev) => ({
        ...prev,
        paymentRefErrors: {
          ...prev.paymentRefErrors,
          [workOrderId]: error,
        },
      }));
      return;
    }

    try {
      await apiClient.patch(`/work-orders/${workOrderId}/`, {
        payment_reference_number: value,
      });
      toast.success(`Payment Reference Number updated for WO ${state.workOrders.find((wo) => wo.id === workOrderId)?.wo_number || 'N/A'}`);
      setState((prev) => ({
        ...prev,
        workOrders: prev.workOrders.map((wo) =>
          wo.id === workOrderId ? { ...wo, payment_reference_number: value } : wo
        ),
        paymentRefErrors: {
          ...prev.paymentRefErrors,
          [workOrderId]: '',
        },
      }));
    } catch (error) {
      console.error('Error updating payment reference number:', error);
      toast.error('Failed to update payment reference number.');
      const originalValue = state.workOrders.find((wo) => wo.id === workOrderId)?.payment_reference_number || '';
      setState((prev) => ({
        ...prev,
        paymentReferenceNumbers: {
          ...prev.paymentReferenceNumbers,
          [workOrderId]: originalValue,
        },
        paymentRefErrors: {
          ...prev.paymentRefErrors,
          [workOrderId]: '',
        },
      }));
    }
  };

  const getAssignedTechnicians = (items) => {
    const technicianIds = [...new Set(items?.map((item) => item.assigned_to).filter((id) => id))];
    if (technicianIds.length === 0) return 'None';
    if (technicianIds.length > 1) return 'Multiple';
    const technician = state.technicians.find((t) => t.id === technicianIds[0]);
    return technician ? `${technician.name} (${technician.designation || 'N/A'})` : 'N/A';
  };

  const getCompanyName = (workOrder) => {
    const po = state.purchaseOrders.find((po) => po.id === workOrder.purchase_order);
    if (!po) return 'N/A';
    const quotation = state.quotations.find((q) => q.id === po.quotation);
    return quotation?.company_name || 'N/A';
  };

  const filteredWorkOrders = state.workOrders
    .filter(
      (workOrder) =>
        workOrder.invoice_status === 'processed' &&
        ((workOrder.wo_number || '').toLowerCase().includes(state.searchTerm.toLowerCase()) ||
         getCompanyName(workOrder).toLowerCase().includes(state.searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      if (state.sortBy === 'created_at') {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      return 0;
    });

  const totalPages = Math.ceil(filteredWorkOrders.length / state.itemsPerPage);
  const startIndex = (state.currentPage - 1) * state.itemsPerPage;
  const currentWorkOrders = filteredWorkOrders.slice(startIndex, startIndex + state.itemsPerPage);

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
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Work Orders</label>
            <InputField
              type="text"
              placeholder="Search by WO Number or Company Name..."
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
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">WO Number</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Created Date</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Assigned To</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Payment Reference Number</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Processed Date</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentWorkOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="border p-2 text-center text-gray-500">
                    No processed invoices found.
                  </td>
                </tr>
              ) : (
                currentWorkOrders.map((workOrder, index) => (
                  <tr key={workOrder.id} className="border hover:bg-gray-50">
                    <td className="border p-2 whitespace-nowrap">{startIndex + index + 1}</td>
                    <td className="border p-2 whitespace-nowrap">{getCompanyName(workOrder)}</td>
                    <td className="border p-2 whitespace-nowrap">
                      <button
                        onClick={() => handleViewWO(workOrder)}
                        className="text-blue-600 hover:underline"
                      >
                        {workOrder.wo_number || 'N/A'}
                      </button>
                    </td>
                    <td className="border p-2 whitespace-nowrap">{new Date(workOrder.created_at).toLocaleDateString()}</td>
                    <td className="border p-2 whitespace-nowrap">{getAssignedTechnicians(workOrder.items)}</td>
                    <td className="border p-2 whitespace-nowrap">
                      <InputField
                        type="text"
                        value={state.paymentReferenceNumbers[workOrder.id] || ''}
                        onChange={(e) => handlePaymentRefChange(workOrder.id, e.target.value)}
                        onBlur={() => handlePaymentRefSubmit(workOrder.id)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handlePaymentRefSubmit(workOrder.id);
                          }
                        }}
                        disabled={!hasPermission('processed_invoices', 'edit')}
                        className={`w-full p-1 border rounded focus:outline-indigo-500 ${
                          state.paymentRefErrors[workOrder.id] ? 'border-red-500' : ''
                        }`}
                        placeholder="Enter Payment Ref"
                      />
                      {state.paymentRefErrors[workOrder.id] && (
                        <p className="text-red-500 text-xs mt-1">{state.paymentRefErrors[workOrder.id]}</p>
                      )}
                    </td>
                    <td className="border p-2 whitespace-nowrap">
                      {workOrder.received_date ? new Date(workOrder.received_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="border p-2 whitespace-nowrap">
                      <Button
                        onClick={() => viewInvoice(workOrder)}
                        className="px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
                        disabled={!hasPermission('processed_invoices', 'view') || !workOrder.invoice_file}
                      >
                        View Invoice
                      </Button>
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
        onClose={() => setState((prev) => ({ ...prev, isWOModalOpen: false, selectedWO: null }))}
        title={`Work Order Details - ${state.selectedWO?.wo_number || 'N/A'}`}
      >
        {state.selectedWO ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-black">Work Order Details</h3>
              <p><strong className="text-sm font-medium text-gray-700 whitespace-nowrap">WO Number:</strong> {state.selectedWO.wo_number || 'N/A'}</p>
              <p><strong className="text-sm font-medium text-gray-700 whitespace-nowrap">Company Name:</strong> {getCompanyName(state.selectedWO)}</p>
              <p><strong className="text-sm font-medium text-gray-700 whitespace-nowrap">Status:</strong> {state.selectedWO.status || 'N/A'}</p>
              <p><strong className="text-sm font-medium text-gray-700 whitespace-nowrap">Invoice Status:</strong> {state.selectedWO.invoice_status || 'Processed'}</p>
              <p><strong className="text-sm font-medium text-gray-700 whitespace-nowrap">Manager Approval Status:</strong> {state.selectedWO.manager_approval_status || 'N/A'}</p>
              {state.selectedWO.manager_approval_status === 'Declined' && (
                <p><strong className="text-sm font-medium text-gray-700 whitespace-nowrap">Decline Reason:</strong> {state.selectedWO.decline_reason || 'N/A'}</p>
              )}
              <p><strong className="text-sm font-medium text-gray-700 whitespace-nowrap">Created At:</strong> {state.selectedWO.created_at ? new Date(state.selectedWO.created_at).toLocaleDateString() : 'N/A'}</p>
              <p><strong className="text-sm font-medium text-gray-700 whitespace-nowrap">Received Date:</strong> {state.selectedWO.received_date ? new Date(state.selectedWO.received_date).toLocaleDateString() : 'N/A'}</p>
              <p><strong className="text-sm font-medium text-gray-700 whitespace-nowrap">Payment Reference Number:</strong> {state.selectedWO.payment_reference_number || 'N/A'}</p>
              <p><strong className="text-sm font-medium text-gray-700 whitespace-nowrap">Expected Completion Date:</strong> {state.selectedWO.expected_completion_date ? new Date(state.selectedWO.expected_completion_date).toLocaleDateString() : 'N/A'}</p>
              <p><strong className="text-sm font-medium text-gray-700 whitespace-nowrap">Onsite/Lab:</strong> {state.selectedWO.onsite_or_lab || 'N/A'}</p>
              <p><strong className="text-sm font-medium text-gray-700 whitespace-nowrap">Site Location:</strong> {state.selectedWO.site_location || 'N/A'}</p>
              <p><strong className="text-sm font-medium text-gray-700 whitespace-nowrap">Remarks:</strong> {state.selectedWO.remarks || 'N/A'}</p>
              <p><strong className="text-sm font-medium text-gray-700 whitespace-nowrap">Invoice File:</strong> {state.selectedWO.invoice_file ? (
                <a
                  href={state.selectedWO.invoice_file}
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
    </div>
  );
};

export default ProcessedInvoices;