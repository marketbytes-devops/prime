import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../../helpers/apiClient';
import InputField from '../../components/InputField';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

const PendingInvoices = () => {
  const [state, setState] = useState({
    workOrders: [],
    purchaseOrders: [],
    deliveryNotes: [],
    technicians: [],
    itemsList: [],
    units: [],
    quotations: [],
    searchTerm: '',
    sortBy: 'created_at',
    currentPage: 1,
    itemsPerPage: 20,
    isWOModalOpen: false,
    selectedWO: null,
    isPOModalOpen: false,
    selectedPO: null,
    isDNModalOpen: false,
    selectedDN: null,
    isStatusModalOpen: false,
    selectedWorkOrderId: null,
    newStatus: '',
    dueInDays: '',
    receivedDate: '',
    isUploadPOModalOpen: false,
    selectedPOForUpload: null,
    poUpload: { clientPoNumber: '', poFile: null },
    poUploadErrors: { clientPoNumber: '', poFile: '' },
    isUploadDNModalOpen: false,
    selectedDNForUpload: null,
    dnUpload: { signedDeliveryNote: null },
    dnUploadErrors: { signedDeliveryNote: '' },
    isUploadInvoiceModalOpen: false,
    selectedWOForInvoiceUpload: null,
    invoiceUpload: { invoiceFile: null },
    invoiceUploadErrors: { invoiceFile: '' },
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
      const [woRes, poRes, dnRes, techRes, itemsRes, unitsRes, quotationsRes] = await Promise.all([
        apiClient.get('work-orders/'),
        apiClient.get('purchase-orders/'),
        apiClient.get('delivery-notes/'),
        apiClient.get('technicians/'),
        apiClient.get('items/'),
        apiClient.get('units/'),
        apiClient.get('quotations/'),
      ]);
      const deliveryNotes = dnRes.data
        .filter((dn) => dn.dn_number && !dn.dn_number.startsWith('TEMP-DN'))
        .map((dn) => ({
          ...dn,
          items: dn.items.map((item) => ({
            ...item,
            uom: item.uom ? Number(item.uom) : null,
            components: item.components || [],
          })),
        }));
      setState((prev) => ({
        ...prev,
        workOrders: woRes.data.map(wo => ({
          ...wo,
          invoice_status: wo.invoice_status || 'pending',
        })) || [],
        purchaseOrders: poRes.data || [],
        deliveryNotes: deliveryNotes || [],
        technicians: techRes.data || [],
        itemsList: itemsRes.data || [],
        units: unitsRes.data || [],
        quotations: quotationsRes.data || [],
      }));
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data.');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleViewDocument = (workOrder, type) => {
    if (type === 'wo') {
      setState((prev) => ({
        ...prev,
        isWOModalOpen: true,
        selectedWO: workOrder,
      }));
    } else if (type === 'po') {
      const poId = workOrder.purchase_order;
      const purchaseOrder = state.purchaseOrders.find((po) => po.id === poId);
      setState((prev) => ({
        ...prev,
        isPOModalOpen: true,
        selectedPO: purchaseOrder || null,
      }));
      if (!purchaseOrder) {
        toast.error('Purchase order not found.');
      }
    } else if (type === 'dn') {
      const dn = state.deliveryNotes.find((dn) => dn.work_order_id === workOrder.id);
      if (!dn) {
        toast.error('Delivery note not found.');
        return;
      }
      setState((prev) => ({
        ...prev,
        isDNModalOpen: true,
        selectedDN: dn,
      }));
    } else if (type === 'invoice') {
      if (workOrder.invoice_file) {
        window.open(workOrder.invoice_file, '_blank');
      }
    }
  };

  const handleUploadPO = (workOrder) => {
    const poId = workOrder.purchase_order;
    const purchaseOrder = state.purchaseOrders.find((po) => po.id === poId);
    if (!purchaseOrder) {
      toast.error('Purchase order not found.');
      return;
    }
    setState((prev) => ({
      ...prev,
      isUploadPOModalOpen: true,
      selectedPOForUpload: purchaseOrder,
      poUpload: {
        clientPoNumber: purchaseOrder.client_po_number || '',
        poFile: null,
      },
      poUploadErrors: { clientPoNumber: '', poFile: '' },
    }));
  };

  const validatePOUpload = () => {
    let isValid = true;
    const errors = { clientPoNumber: '', poFile: '' };
    if (!state.poUpload.clientPoNumber.trim()) {
      errors.clientPoNumber = 'Client PO Number is required';
      isValid = false;
    }
    if (!state.poUpload.poFile) {
      errors.poFile = 'PO File is required';
      isValid = false;
    }
    setState((prev) => ({ ...prev, poUploadErrors: errors }));
    return isValid;
  };

  const handlePOUploadSubmit = async () => {
    if (!validatePOUpload()) {
      return;
    }
    try {
      const formData = new FormData();
      formData.append('client_po_number', state.poUpload.clientPoNumber || '');
      formData.append('po_file', state.poUpload.poFile || '');
      await apiClient.patch(`/purchase-orders/${state.selectedPOForUpload.id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchData();
      setState((prev) => ({
        ...prev,
        isUploadPOModalOpen: false,
        selectedPOForUpload: null,
        poUpload: { clientPoNumber: '', poFile: null },
        poUploadErrors: { clientPoNumber: '', poFile: '' },
      }));
      toast.success('PO details uploaded successfully.');
    } catch (error) {
      console.error('Error uploading PO details:', error);
      toast.error('Failed to upload PO details.');
    }
  };

  const isPOEmpty = (workOrder) => {
    const poId = workOrder.purchase_order;
    const purchaseOrder = state.purchaseOrders.find((po) => po.id === poId);
    return !purchaseOrder || (!purchaseOrder.client_po_number && !purchaseOrder.po_file);
  };

  const isDNEmpty = (workOrder) => {
    const dn = state.deliveryNotes.find((dn) => dn.work_order_id === workOrder.id);
    return !dn || !dn.signed_delivery_note;
  };

  const handleUploadDN = (workOrder) => {
    const dn = state.deliveryNotes.find((dn) => dn.work_order_id === workOrder.id);
    if (!dn) {
      toast.error('Delivery note not found.');
      return;
    }
    setState((prev) => ({
      ...prev,
      isUploadDNModalOpen: true,
      selectedDNForUpload: dn,
      dnUpload: { signedDeliveryNote: null },
      dnUploadErrors: { signedDeliveryNote: '' },
    }));
  };

  const validateDNUpload = () => {
    let isValid = true;
    const errors = { signedDeliveryNote: '' };
    if (!state.dnUpload.signedDeliveryNote) {
      errors.signedDeliveryNote = 'Signed Delivery Note is required';
      isValid = false;
    }
    setState((prev) => ({ ...prev, dnUploadErrors: errors }));
    return isValid;
  };

  const handleUploadDNSubmit = async () => {
    if (!validateDNUpload()) {
      return;
    }
    try {
      const formData = new FormData();
      formData.append('signed_delivery_note', state.dnUpload.signedDeliveryNote);
      await apiClient.post(`/delivery-notes/${state.selectedDNForUpload.id}/upload-signed-note/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Signed Delivery Note uploaded and status updated to Delivered.');
      setState((prev) => ({
        ...prev,
        isUploadDNModalOpen: false,
        selectedDNForUpload: null,
        dnUpload: { signedDeliveryNote: null },
        dnUploadErrors: { signedDeliveryNote: '' },
      }));
      await fetchData();
    } catch (error) {
      console.error('Error uploading signed delivery note:', error);
      toast.error('Failed to upload signed delivery note.');
    }
  };

  const handleUploadInvoice = (workOrder) => {
    setState((prev) => ({
      ...prev,
      isUploadInvoiceModalOpen: true,
      selectedWOForInvoiceUpload: workOrder,
      invoiceUpload: { invoiceFile: null },
      invoiceUploadErrors: { invoiceFile: '' },
    }));
  };

  const validateInvoiceUpload = () => {
    let isValid = true;
    const errors = { invoiceFile: '' };
    if (!state.invoiceUpload.invoiceFile) {
      errors.invoiceFile = 'Invoice File is required';
      isValid = false;
    }
    setState((prev) => ({ ...prev, invoiceUploadErrors: errors }));
    return isValid;
  };

  const handleInvoiceUploadSubmit = async () => {
    if (!validateInvoiceUpload()) {
      return;
    }
    try {
      const formData = new FormData();
      formData.append('invoice_file', state.invoiceUpload.invoiceFile);
      await apiClient.patch(`/work-orders/${state.selectedWOForInvoiceUpload.id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Invoice file uploaded successfully.');
      setState((prev) => ({
        ...prev,
        isUploadInvoiceModalOpen: false,
        selectedWOForInvoiceUpload: null,
        invoiceUpload: { invoiceFile: null },
        invoiceUploadErrors: { invoiceFile: '' },
      }));
      await fetchData();
    } catch (error) {
      console.error('Error uploading invoice file:', error);
      toast.error('Failed to upload invoice file.');
    }
  };

  const handleUpdateStatus = (workOrderId, newStatus) => {
    setState((prev) => ({
      ...prev,
      isStatusModalOpen: true,
      selectedWorkOrderId: workOrderId,
      newStatus,
      dueInDays: '',
      receivedDate: '',
    }));
  };

  const confirmStatusUpdate = async (workOrderId, newStatus, dueInDays, receivedDate) => {
    try {
      const payload = { invoice_status: newStatus };
      if (newStatus === 'Raised' && dueInDays) {
        payload.due_in_days = parseInt(dueInDays);
      } else if (newStatus === 'processed' && receivedDate) {
        payload.received_date = receivedDate;
      }
      await apiClient.post(`work-orders/${workOrderId}/update-invoice-status/`, payload);
      toast.success('Work order invoice status updated successfully.');
      if (newStatus === 'Raised') {
        const workOrder = state.workOrders.find((wo) => wo.id === workOrderId);
        handleUploadInvoice(workOrder);
      } else if (newStatus === 'processed') {
        const workOrder = state.workOrders.find((wo) => wo.id === workOrderId);
        handleUploadInvoice(workOrder);
      }
      setState((prev) => ({
        ...prev,
        isStatusModalOpen: false,
        selectedWorkOrderId: null,
        newStatus: '',
        dueInDays: '',
        receivedDate: '',
      }));
      await fetchData();
    } catch (error) {
      console.error('Error updating work order invoice status:', error);
      toast.error('Failed to update work order invoice status.');
    }
  };

  const handleStatusModalSubmit = () => {
    const { selectedWorkOrderId, newStatus, dueInDays, receivedDate } = state;
    if (newStatus === 'Raised' && (!dueInDays || isNaN(dueInDays) || parseInt(dueInDays) <= 0)) {
      toast.error('Please enter a valid number of days.');
      return;
    }
    if (newStatus === 'processed' && !receivedDate) {
      toast.error('Please select a received date.');
      return;
    }
    confirmStatusUpdate(selectedWorkOrderId, newStatus, dueInDays, receivedDate);
  };

  const getAssignedTechnicians = (items) => {
    const technicianIds = [...new Set(items?.map((item) => item.assigned_to).filter((id) => id))];
    if (technicianIds.length === 0) return 'None';
    if (technicianIds.length > 1) return 'Multiple';
    const technician = state.technicians.find((t) => t.id === technicianIds[0]);
    return technician ? `${technician.name} (${technician.designation || 'N/A'})` : 'N/A';
  };

  const getAssignedSalesPersonName = (po) => {
    if (!po) return 'N/A';
    const quotation = state.quotations.find((q) => q.id === po.quotation);
    return quotation?.assigned_sales_person_name || 'N/A';
  };

  const getQuotationSeriesNumber = (workOrder) => {
    const po = state.purchaseOrders.find((po) => po.id === workOrder.purchase_order);
    if (!po) return 'N/A';
    const quotation = state.quotations.find((q) => q.id === po.quotation);
    return quotation?.series_number || 'N/A';
  };

  const getCompanyName = (workOrder) => {
    const po = state.purchaseOrders.find((po) => po.id === workOrder.purchase_order);
    if (!po) return 'N/A';
    const quotation = state.quotations.find((q) => q.id === po.quotation);
    return quotation?.company_name || 'N/A';
  };

  const getDNSeriesNumber = (workOrder) => {
    const dn = state.deliveryNotes.find((dn) => dn.work_order_id === workOrder.id);
    return dn?.dn_number || 'N/A';
  };

  const filteredWorkOrders = state.workOrders
    .filter((workOrder) =>
      (workOrder.wo_number || '').toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      getQuotationSeriesNumber(workOrder).toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      getDNSeriesNumber(workOrder).toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      getCompanyName(workOrder).toLowerCase().includes(state.searchTerm.toLowerCase())
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
      <h1 className="text-2xl font-bold mb-4">Pending Invoices</h1>
      <div className="bg-white p-4 space-y-4 rounded-md shadow w-full">
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Work Orders</label>
            <InputField
              type="text"
              placeholder="Search by WO Number, Quotation, DN Number, or Company Name..."
              value={state.searchTerm}
              onChange={(e) => setState((prev) => ({ ...prev, searchTerm: e.target.value }))}
              className="w-full p-2 border rounded focus:outline-indigo-500"
            />
          </div>
          <div className="flex-1 min-w-[150px]">
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
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Created Date</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Assigned To</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">View Documents</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Invoice Status</th>
              </tr>
            </thead>
            <tbody>
              {currentWorkOrders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="border p-2 text-center text-gray-500">
                    No work orders found.
                  </td>
                </tr>
              ) : (
                currentWorkOrders.map((workOrder, index) => (
                  <tr key={workOrder.id} className="border hover:bg-gray-50">
                    <td className="border p-2 whitespace-nowrap">{startIndex + index + 1}</td>
                    <td className="border p-2 whitespace-nowrap">{getCompanyName(workOrder)}</td>
                    <td className="border p-2 whitespace-nowrap">{getQuotationSeriesNumber(workOrder)}</td>
                    <td className="border p-2 whitespace-nowrap">{workOrder.wo_number || 'N/A'}</td>
                    <td className="border p-2 whitespace-nowrap">{getDNSeriesNumber(workOrder)}</td>
                    <td className="border p-2 whitespace-nowrap">{new Date(workOrder.created_at).toLocaleDateString()}</td>
                    <td className="border p-2 whitespace-nowrap">{getAssignedTechnicians(workOrder.items)}</td>
                    <td className="border p-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => (isPOEmpty(workOrder) ? handleUploadPO(workOrder) : handleViewDocument(workOrder, 'po'))}
                          className={`px-3 py-1 rounded-md text-sm whitespace-nowrap ${
                            isPOEmpty(workOrder)
                              ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {isPOEmpty(workOrder) ? 'Upload PO' : 'View PO'}
                        </Button>
                        <Button
                          onClick={() => handleViewDocument(workOrder, 'wo')}
                          className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm whitespace-nowrap"
                        >
                          View WO
                        </Button>
                        <Button
                          onClick={() => (isDNEmpty(workOrder) ? handleUploadDN(workOrder) : handleViewDocument(workOrder, 'dn'))}
                          className={`px-3 py-1 rounded-md text-sm whitespace-nowrap ${
                            isDNEmpty(workOrder)
                              ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                              : 'bg-purple-600 text-white hover:bg-purple-700'
                          }`}
                        >
                          {isDNEmpty(workOrder) ? 'Upload DN' : 'View DN'}
                        </Button>
                        <Button
                          onClick={() => handleViewDocument(workOrder, 'invoice')}
                          className={`px-3 py-1 rounded-md text-sm whitespace-nowrap ${
                            workOrder.invoice_file
                              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                          disabled={!workOrder.invoice_file}
                        >
                          {workOrder.invoice_file ? 'View Invoice' : 'No Invoice'}
                        </Button>
                      </div>
                    </td>
                    <td className="border p-2 whitespace-nowrap">
                      <select
                        value={workOrder.invoice_status || 'pending'}
                        onChange={(e) => handleUpdateStatus(workOrder.id, e.target.value)}
                        disabled={!hasPermission('pending_invoices', 'edit')}
                        className={`w-full p-2 border rounded focus:outline-indigo-500 text-sm ${
                          hasPermission('pending_invoices', 'edit')
                            ? ''
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="Raised">Raised</option>
                        <option value="processed">Processed</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <Button
              onClick={handlePrev}
              disabled={state.currentPage === 1}
              className={`px-3 py-1 rounded-md text-sm ${
                state.currentPage === 1
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Prev
            </Button>
            {pageNumbers.map((page) => (
              <Button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 rounded-md text-sm min-w-fit whitespace-nowrap ${
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
              className={`px-3 py-1 rounded-md text-sm ${
                state.currentPage === totalPages
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Next
            </Button>
          </div>
        )}
      </div>
      {/* Modals */}
      <Modal
        isOpen={state.isWOModalOpen}
        onClose={() => setState((prev) => ({ ...prev, isWOModalOpen: false, selectedWO: null }))}
        title={`Work Order Details - ${state.selectedWO?.wo_number || 'N/A'}`}
      >
        {/* ... (rest of the WO modal code) ... */}
      </Modal>
      <Modal
        isOpen={state.isPOModalOpen}
        onClose={() => setState((prev) => ({ ...prev, isPOModalOpen: false, selectedPO: null }))}
        title={`Purchase Order Details - ${state.selectedPO?.series_number || 'N/A'}`}
      >
        {/* ... (rest of the PO modal code) ... */}
      </Modal>
      <Modal
        isOpen={state.isDNModalOpen}
        onClose={() => setState((prev) => ({ ...prev, isDNModalOpen: false, selectedDN: null }))}
        title={`Delivery Note Details - ${state.selectedDN?.dn_number || 'N/A'}`}
      >
        {/* ... (rest of the DN modal code) ... */}
      </Modal>
      <Modal
        isOpen={state.isUploadPOModalOpen}
        onClose={() => setState((prev) => ({
          ...prev,
          isUploadPOModalOpen: false,
          selectedPOForUpload: null,
          poUpload: { clientPoNumber: '', poFile: null },
          poUploadErrors: { clientPoNumber: '', poFile: '' },
        }))}
        title={`Upload PO Details for ${state.selectedPOForUpload?.series_number || 'N/A'}`}
      >
        {/* ... (rest of the Upload PO modal code) ... */}
      </Modal>
      <Modal
        isOpen={state.isUploadDNModalOpen}
        onClose={() => setState((prev) => ({
          ...prev,
          isUploadDNModalOpen: false,
          selectedDNForUpload: null,
          dnUpload: { signedDeliveryNote: null },
          dnUploadErrors: { signedDeliveryNote: '' },
        }))}
        title={`Upload Signed Delivery Note for ${state.selectedDNForUpload?.dn_number || 'N/A'}`}
      >
        {/* ... (rest of the Upload DN modal code) ... */}
      </Modal>
      <Modal
        isOpen={state.isUploadInvoiceModalOpen}
        onClose={() => setState((prev) => ({
          ...prev,
          isUploadInvoiceModalOpen: false,
          selectedWOForInvoiceUpload: null,
          invoiceUpload: { invoiceFile: null },
          invoiceUploadErrors: { invoiceFile: '' },
        }))}
        title={`Upload Invoice for ${state.selectedWOForInvoiceUpload?.wo_number || 'N/A'}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice File</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  invoiceUpload: { ...prev.invoiceUpload, invoiceFile: e.target.files[0] },
                  invoiceUploadErrors: { ...prev.invoiceUploadErrors, invoiceFile: '' },
                }))
              }
              className="w-full p-2 border rounded focus:outline-indigo-500"
            />
            {state.invoiceUploadErrors.invoiceFile && (
              <p className="text-red-500 text-sm mt-1">{state.invoiceUploadErrors.invoiceFile}</p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => setState((prev) => ({
                ...prev,
                isUploadInvoiceModalOpen: false,
                selectedWOForInvoiceUpload: null,
                invoiceUpload: { invoiceFile: null },
                invoiceUploadErrors: { invoiceFile: '' },
              }))}
              className="px-3 py-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleInvoiceUploadSubmit}
              disabled={!hasPermission('pending_invoices', 'edit')}
              className={`px-3 py-1 rounded-md text-sm ${
                hasPermission('pending_invoices', 'edit')
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Submit
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={state.isStatusModalOpen}
        onClose={() => setState((prev) => ({
          ...prev,
          isStatusModalOpen: false,
          selectedWorkOrderId: null,
          newStatus: '',
          dueInDays: '',
          receivedDate: '',
        }))}
        title={`Update Invoice Status${state.newStatus ? ` to ${state.newStatus}` : ''}`}
      >
        <div className="space-y-4">
          {state.newStatus === 'Raised' && (
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
          )}
          {state.newStatus === 'processed' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Received Date</label>
              <InputField
                type="date"
                value={state.receivedDate}
                onChange={(e) => setState((prev) => ({ ...prev, receivedDate: e.target.value }))}
                className="w-full p-2 border rounded focus:outline-indigo-500"
              />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => setState((prev) => ({
                ...prev,
                isStatusModalOpen: false,
                selectedWorkOrderId: null,
                newStatus: '',
                dueInDays: '',
                receivedDate: '',
              }))}
              className="px-3 py-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleStatusModalSubmit}
              disabled={!hasPermission('pending_invoices', 'edit')}
              className={`px-3 py-1 rounded-md text-sm ${
                hasPermission('pending_invoices', 'edit')
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

export default PendingInvoices;
