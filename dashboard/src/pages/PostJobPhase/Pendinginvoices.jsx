import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../../helpers/apiClient';
import InputField from '../../components/InputField';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { useNavigate } from 'react-router-dom';

const PendingInvoices = () => {
  const navigate = useNavigate();
  const [state, setState] = useState({
    workOrders: [],
    purchaseOrders: [],
    deliveryNotes: [],
    technicians: [],
    itemsList: [],
    units: [],
    quotations: [],
    channels: [],
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
    selectedDNId: null,
    newStatus: '',
    receivedDate: '',
    isUploadPOModalOpen: false,
    selectedPOForUpload: null,
    poUpload: { clientPoNumber: '', poFile: null, poStatus: 'not_available' },
    poUploadErrors: { clientPoNumber: '', poFile: '' },
    isUploadDNModalOpen: false,
    selectedDNForUpload: null,
    dnUpload: { signedDeliveryNote: null },
    dnUploadErrors: { signedDeliveryNote: '' },
    isUploadInvoiceModalOpen: false,
    selectedWOForInvoiceUpload: null,
    selectedDNId: null,
    invoiceUpload: { invoiceFile: null },
    invoiceUploadErrors: { invoiceFile: '' },
    invoiceUploadType: '',
    isUploadWOModalOpen: false,
    selectedWOForUpload: null,
    woUpload: { certificateFile: null },
    woUploadErrors: { certificateFile: '' },
    workOrderDeliveryPairs: [],
  });

  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const [woRes, poRes, dnRes, techRes, itemsRes, unitsRes, quotationsRes, channelsRes] = await Promise.all([
        apiClient.get('work-orders/'),
        apiClient.get('purchase-orders/'),
        apiClient.get('delivery-notes/'),
        apiClient.get('technicians/'),
        apiClient.get('items/'),
        apiClient.get('units/'),
        apiClient.get('quotations/'),
        apiClient.get('channels/'),
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

      const workOrders = (woRes.data || []).map((wo) => ({
        ...wo,
        invoice_status: wo.invoice_status ? wo.invoice_status.toLowerCase() : 'pending',
      }));

      const workOrderDeliveryPairs = [];
      workOrders.forEach((workOrder) => {
        const relatedDNs = deliveryNotes.filter((dn) => dn.work_order_id === workOrder.id);
        if (relatedDNs.length > 0) {
          relatedDNs.forEach((dn) => {
            workOrderDeliveryPairs.push({
              id: `${workOrder.id}-${dn.id}`,
              workOrder,
              deliveryNote: dn,
              workOrderId: workOrder.id,
              deliveryNoteId: dn.id,
            });
          });
        } else {
          workOrderDeliveryPairs.push({
            id: `${workOrder.id}-no-dn`,
            workOrder,
            deliveryNote: null,
            workOrderId: workOrder.id,
            deliveryNoteId: null,
          });
        }
      });

      setState((prev) => ({
        ...prev,
        workOrders,
        purchaseOrders: poRes.data || [],
        deliveryNotes,
        technicians: techRes.data || [],
        itemsList: itemsRes.data || [],
        units: unitsRes.data || [],
        quotations: quotationsRes.data || [],
        channels: channelsRes.data || [],
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

  const getQuotationDetails = (workOrder) => {
    const po = state.purchaseOrders.find((po) => po.id === workOrder.purchase_order);
    const quotation = po ? state.quotations.find((q) => q.id === po.quotation) : null;
    return {
      series_number: quotation?.series_number || 'N/A',
      company_name: quotation?.company_name || 'N/A',
      company_address: quotation?.company_address || 'N/A',
      company_phone: quotation?.company_phone || 'N/A',
      company_email: quotation?.company_email || 'N/A',
      channel: state.channels.find((c) => c.id === quotation?.rfq_channel)?.channel_name || 'N/A',
      contact_name: quotation?.point_of_contact_name || 'N/A',
      contact_email: quotation?.point_of_contact_email || 'N/A',
      contact_phone: quotation?.point_of_contact_phone || 'N/A',
      po_series_number: po?.series_number || 'N/A',
      client_po_number: po?.client_po_number || 'N/A',
      order_type: po?.order_type || 'N/A',
      created_at: po?.created_at ? new Date(po.created_at).toLocaleDateString() : 'N/A',
      po_file: po?.po_file || null,
      assigned_sales_person: quotation?.assigned_sales_person_name || 'N/A',
    };
  };

  const handleViewDocument = (pair, type) => {
    const workOrder = pair.workOrder;
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
      if (!pair.deliveryNote) {
        toast.error('Delivery note not found.');
        return;
      }
      setState((prev) => ({
        ...prev,
        isDNModalOpen: true,
        selectedDN: pair.deliveryNote,
      }));
    } else if (type === 'invoice') {
      if (workOrder.invoice_file) {
        window.open(workOrder.invoice_file, '_blank');
      } else {
        toast.error('No invoice file available.');
      }
    }
  };

  const handleUploadPO = (pair) => {
    const workOrder = pair.workOrder;
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
        poStatus: purchaseOrder.client_po_number || purchaseOrder.po_file ? 'available' : 'not_available',
      },
      poUploadErrors: { clientPoNumber: '', poFile: '' },
    }));
  };

  const validatePOUpload = () => {
    let isValid = true;
    const errors = { clientPoNumber: '', poFile: '' };
    if (state.poUpload.poStatus === 'available') {
      if (!state.poUpload.clientPoNumber.trim()) {
        errors.clientPoNumber = 'Client PO Number is required';
        isValid = false;
      }
      if (!state.poUpload.poFile) {
        errors.poFile = 'PO File is required';
        isValid = false;
      }
    }
    setState((prev) => ({ ...prev, poUploadErrors: errors }));
    return isValid;
  };

  const handlePOUploadSubmit = async () => {
    if (state.poUpload.poStatus === 'available' && !validatePOUpload()) {
      return;
    }
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('client_po_number', state.poUpload.clientPoNumber || '');
      if (state.poUpload.poFile) {
        formData.append('po_file', state.poUpload.poFile);
      } else if (state.poUpload.poStatus === 'not_available') {
        formData.append('po_file', '');
      }
      await apiClient.patch(`/purchase-orders/${state.selectedPOForUpload.id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchData();
      setState((prev) => ({
        ...prev,
        isUploadPOModalOpen: false,
        selectedPOForUpload: null,
        poUpload: { clientPoNumber: '', poFile: null, poStatus: 'not_available' },
        poUploadErrors: { clientPoNumber: '', poFile: '' },
      }));
      toast.success('PO details uploaded successfully.');
    } catch (error) {
      console.error('Error uploading PO details:', error);
      toast.error('Failed to upload PO details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadWO = (pair) => {
    const workOrder = pair.workOrder;
    setState((prev) => ({
      ...prev,
      isUploadWOModalOpen: true,
      selectedWOForUpload: workOrder,
      woUpload: { certificateFile: null },
      woUploadErrors: { certificateFile: '' },
    }));
  };

  const validateWOUpload = () => {
    let isValid = true;
    const errors = { certificateFile: '' };
    if (!state.woUpload.certificateFile) {
      errors.certificateFile = 'Certificate File is required';
      isValid = false;
    }
    setState((prev) => ({ ...prev, woUploadErrors: errors }));
    return isValid;
  };

  const handleWOUploadSubmit = async () => {
    if (!validateWOUpload()) {
      return;
    }
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('certificate_file', state.woUpload.certificateFile);
      await apiClient.patch(`/work-orders/${state.selectedWOForUpload.id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Work order certificate uploaded successfully.');
      setState((prev) => ({
        ...prev,
        isUploadWOModalOpen: false,
        selectedWOForUpload: null,
        woUpload: { certificateFile: null },
        woUploadErrors: { certificateFile: '' },
      }));
      await fetchData();
    } catch (error) {
      console.error('Error uploading work order certificate:', error);
      toast.error('Failed to upload work order certificate.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadDN = (pair) => {
    if (!pair.deliveryNote) {
      toast.error('Delivery note not found.');
      return;
    }
    setState((prev) => ({
      ...prev,
      isUploadDNModalOpen: true,
      selectedDNForUpload: pair.deliveryNote,
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
      setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadInvoice = (pair, status) => {
    const workOrder = pair.workOrder;
    setState((prev) => ({
      ...prev,
      isUploadInvoiceModalOpen: true,
      selectedWOForInvoiceUpload: workOrder,
      selectedDNId: pair.deliveryNoteId,
      invoiceUpload: { invoiceFile: null },
      invoiceUploadErrors: { invoiceFile: '' },
      invoiceUploadType: status === 'raised' ? 'Proforma' : 'Final',
      newStatus: status,
    }));
  };

  const validateInvoiceUpload = () => {
    let isValid = true;
    const errors = { invoiceFile: '' };
    if (!state.invoiceUpload.invoiceFile) {
      errors.invoiceFile = `${state.invoiceUploadType} Invoice File is required`;
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
      setIsSubmitting(true);
      const payload = { invoice_status: state.newStatus };
      if (state.newStatus === 'processed' && state.receivedDate) {
        payload.received_date = state.receivedDate;
      }
      if (state.selectedDNId) {
        payload.delivery_note_id = state.selectedDNId;
      }

      await apiClient.post(`work-orders/${state.selectedWOForInvoiceUpload.id}/update-invoice-status/`, payload);

      const formData = new FormData();
      formData.append('invoice_file', state.invoiceUpload.invoiceFile);
      await apiClient.patch(`/work-orders/${state.selectedWOForInvoiceUpload.id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(`${state.invoiceUploadType} Invoice file uploaded and status updated successfully.`);
      setState((prev) => ({
        ...prev,
        isUploadInvoiceModalOpen: false,
        selectedWOForInvoiceUpload: null,
        selectedDNId: null,
        invoiceUpload: { invoiceFile: null },
        invoiceUploadErrors: { invoiceFile: '' },
        invoiceUploadType: '',
        isStatusModalOpen: false,
        selectedWorkOrderId: null,
        newStatus: '',
        receivedDate: '',
      }));
      await fetchData();
    } catch (error) {
      console.error(`Error updating status or uploading ${state.invoiceUploadType.toLowerCase()} invoice file:`, error);
      toast.error(`Failed to update status or upload ${state.invoiceUploadType.toLowerCase()} invoice file.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (pair, newStatus) => {
    const workOrder = pair.workOrder;
    if (workOrder.invoice_status === 'processed') {
      toast.warn('The invoice status is already set to "Processed." It cannot be changed to another status.');
      return;
    }
    if (newStatus === 'raised') {
      try {
        setIsSubmitting(true);
        const payload = { invoice_status: newStatus, delivery_note_id: pair.deliveryNoteId };
        await apiClient.post(`work-orders/${workOrder.id}/update-invoice-status/`, payload);
        toast.success('Invoice status updated to Raised.');
        await fetchData();
      } catch (error) {
        console.error('Error updating invoice status:', error);
        toast.error('Failed to update invoice status.');
      } finally {
        setIsSubmitting(false);
      }
    } else if (newStatus === 'processed') {
      setState((prev) => ({
        ...prev,
        isStatusModalOpen: true,
        selectedWorkOrderId: workOrder.id,
        selectedDNId: pair.deliveryNoteId,
        newStatus,
        receivedDate: '',
        invoiceUploadType: 'Final',
      }));
    } else {
      try {
        setIsSubmitting(true);
        const payload = { invoice_status: newStatus, delivery_note_id: pair.deliveryNoteId };
        await apiClient.post(`work-orders/${workOrder.id}/update-invoice-status/`, payload);
        toast.success('Invoice status updated successfully.');
        await fetchData();
      } catch (error) {
        console.error('Error updating invoice status:', error);
        toast.error('Failed to update invoice status.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleStatusModalSubmit = async () => {
    const { selectedWorkOrderId, selectedDNId, newStatus, receivedDate } = state;
    if (newStatus === 'processed' && !receivedDate) {
      toast.error('Please select a received date.');
      return;
    }
    try {
      setIsSubmitting(true);
      const payload = { invoice_status: newStatus };
      if (newStatus === 'processed' && receivedDate) {
        payload.received_date = receivedDate;
      }
      if (selectedDNId) {
        payload.delivery_note_id = selectedDNId;
      }
      await apiClient.post(`work-orders/${selectedWorkOrderId}/update-invoice-status/`, payload);
      toast.success('Work order invoice status updated successfully.');
      setState((prev) => ({
        ...prev,
        isStatusModalOpen: false,
        selectedWorkOrderId: null,
        selectedDNId: null,
        newStatus: '',
        receivedDate: '',
        invoiceUploadType: '',
      }));
      await fetchData();
    } catch (error) {
      console.error('Error updating work order invoice status:', error);
      toast.error('Failed to update work order invoice status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDUTComplete = (wo) => {
    return wo.items.every(
      (item) =>
        item.certificate_number &&
        item.certificate_uut_label &&
        item.calibration_date &&
        item.calibration_due_date &&
        item.uuc_serial_number &&
        item.certificate_file &&
        item.range !== null &&
        item.range !== undefined
    );
  };

  const isPOComplete = (workOrder) => {
    const poId = workOrder.purchase_order;
    const purchaseOrder = state.purchaseOrders.find((po) => po.id === poId);
    return purchaseOrder && purchaseOrder.client_po_number && purchaseOrder.po_file;
  };

  const isPOEmpty = (workOrder) => {
    const poId = workOrder.purchase_order;
    const purchaseOrder = state.purchaseOrders.find((po) => po.id === poId);
    return !purchaseOrder || (!purchaseOrder.client_po_number && !purchaseOrder.po_file);
  };

  const isDNReadyForUpload = (deliveryNote) => {
    return deliveryNote && !deliveryNote.signed_delivery_note;
  };

  const isDNComplete = (deliveryNote) => {
    return deliveryNote && deliveryNote.signed_delivery_note;
  };

  const canUploadInvoice = (pair) => {
    return isPOComplete(pair.workOrder) && isDUTComplete(pair.workOrder) && (!pair.deliveryNote || isDNComplete(pair.deliveryNote));
  };

  const getAssignedTechnicians = (items) => {
    const technicianIds = [...new Set(items?.map((item) => item.assigned_to).filter((id) => id))];
    if (technicianIds.length === 0) return 'None';
    if (technicianIds.length > 1) return 'Multiple';
    const technician = state.technicians.find((t) => t.id === technicianIds[0]);
    return technician ? `${technician.name} (${technician.designation || 'N/A'})` : 'N/A';
  };

  const getWONumberByDN = (dn) => {
    const workOrder = state.workOrders.find((wo) => wo.id === dn.work_order_id);
    return workOrder?.wo_number || 'N/A';
  };

  const getDNSeriesNumber = (deliveryNote) => {
    return deliveryNote?.dn_number || 'N/A';
  };

  const filteredPairs = state.workOrderDeliveryPairs
    .filter(
      (pair) =>
        (pair.workOrder.wo_number || '').toLowerCase().includes(state.searchTerm.toLowerCase()) ||
        getQuotationDetails(pair.workOrder).series_number.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
        getDNSeriesNumber(pair.deliveryNote).toLowerCase().includes(state.searchTerm.toLowerCase()) ||
        getQuotationDetails(pair.workOrder).company_name.toLowerCase().includes(state.searchTerm.toLowerCase())
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
              {currentPairs.length === 0 ? (
                <tr>
                  <td colSpan="9" className="border p-2 text-center text-gray-500">
                    No work orders found.
                  </td>
                </tr>
              ) : (
                currentPairs.map((pair, index) => (
                  <tr key={pair.id} className="border hover:bg-gray-50">
                    <td className="border p-2">{startIndex + index + 1}</td>
                    <td className="border p-2">{getQuotationDetails(pair.workOrder).company_name}</td>
                    <td className="border p-2">{getQuotationDetails(pair.workOrder).series_number}</td>
                    <td className="border p-2">{pair.workOrder.wo_number || 'N/A'}</td>
                    <td className="border p-2">{getDNSeriesNumber(pair.deliveryNote)}</td>
                    <td className="border p-2">
                      {pair.workOrder.created_at ? new Date(pair.workOrder.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="border p-2">{getAssignedTechnicians(pair.workOrder.items)}</td>
                    <td className="border p-2">
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleViewDocument(pair, 'po')}
                          disabled={isSubmitting || !hasPermission('pending_invoices', 'view') || isPOComplete(pair.workOrder)}
                          className={`whitespace-nowrap px-3 py-1 text-sm rounded-md ${
                            isSubmitting || !hasPermission('pending_invoices', 'view') || isPOComplete(pair.workOrder)
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          View PO
                        </Button>
                        <Button
                          onClick={() => handleViewDocument(pair, 'wo')}
                          disabled={isSubmitting || !hasPermission('pending_invoices', 'view')}
                          className={`whitespace-nowrap px-3 py-1 text-sm rounded-md ${
                            isSubmitting || !hasPermission('pending_invoices', 'view')
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          View WO
                        </Button>
                        <Button
                          onClick={() => handleViewDocument(pair, 'dn')}
                          disabled={isSubmitting || !hasPermission('pending_invoices', 'view') || !pair.deliveryNote || isDNComplete(pair.deliveryNote)}
                          className={`whitespace-nowrap px-3 py-1 text-sm rounded-md ${
                            isSubmitting || !hasPermission('pending_invoices', 'view') || !pair.deliveryNote || isDNComplete(pair.deliveryNote)
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-purple-600 text-white hover:bg-purple-700'
                          }`}
                        >
                          View DN
                        </Button>
                        <Button
                          onClick={() => handleViewDocument(pair, 'invoice')}
                          disabled={isSubmitting || !hasPermission('pending_invoices', 'view') || !pair.workOrder.invoice_file}
                          className={`whitespace-nowrap px-3 py-1 text-sm rounded-md ${
                            isSubmitting || !hasPermission('pending_invoices', 'view') || !pair.workOrder.invoice_file
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          }`}
                        >
                          View Invoice
                        </Button>
                      </div>
                    </td>
                    <td className="border p-2">
                      <div className="flex items-center gap-2">
                        <select
                          value={pair.workOrder.invoice_status || 'pending'}
                          onChange={(e) => handleUpdateStatus(pair, e.target.value)}
                          disabled={isSubmitting || !hasPermission('pending_invoices', 'edit') || pair.workOrder.invoice_status === 'processed'}
                          className={`w-full p-2 border rounded focus:outline-indigo-500 text-sm ${
                            isSubmitting || !hasPermission('pending_invoices', 'edit') || pair.workOrder.invoice_status === 'processed'
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : ''
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="raised">Raised</option>
                          <option value="processed">Processed</option>
                        </select>
                        {(pair.workOrder.invoice_status === 'raised' || pair.workOrder.invoice_status === 'processed') && (
                          <Button
                            onClick={() => handleUploadInvoice(pair, pair.workOrder.invoice_status)}
                            disabled={isSubmitting || !hasPermission('pending_invoices', 'edit') || !canUploadInvoice(pair)}
                            className={`whitespace-nowrap px-3 py-1 text-sm rounded-md ${
                              isSubmitting || !hasPermission('pending_invoices', 'edit') || !canUploadInvoice(pair)
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            Upload Invoice
                          </Button>
                        )}
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
            disabled={state.currentPage === 1 || isSubmitting}
            className={`px-3 py-1 bg-gray-400 text-white rounded-md hover:bg-gray-500 disabled:bg-gray-300 min-w-fit`}
          >
            {isSubmitting ? 'Submitting...' : 'Prev'}
          </Button>
          {pageNumbers.map((page) => (
            <Button
              key={page}
              onClick={() => handlePageChange(page)}
              disabled={isSubmitting}
              className={`whitespace-nowrap px-3 py-1 rounded-md min-w-fit ${
                isSubmitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : state.currentPage === page
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {isSubmitting ? 'Submitting...' : page}
            </Button>
          ))}
          <Button
            onClick={handleNext}
            disabled={state.currentPage === totalPages || isSubmitting}
            className={`whitespace-nowrap px-3 py-1 bg-gray-400 text-white rounded-md hover:bg-gray-500 disabled:bg-gray-300 min-w-fit`}
          >
            {isSubmitting ? 'Submitting...' : 'Next'}
          </Button>
        </div>
      )}
      <Modal
        isOpen={state.isWOModalOpen}
        onClose={() => setState((prev) => ({ ...prev, isWOModalOpen: false, selectedWO: null }))}
        title={`Work Order Details - ${state.selectedWO?.wo_number || 'N/A'}`}
      >
        {state.selectedWO && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-black">Company Details</h3>
              <p><strong>Series Number:</strong> {getQuotationDetails(state.selectedWO).series_number}</p>
              <p><strong>Company Name:</strong> {getQuotationDetails(state.selectedWO).company_name}</p>
              <p><strong>Company Address:</strong> {getQuotationDetails(state.selectedWO).company_address}</p>
              <p><strong>Company Phone:</strong> {getQuotationDetails(state.selectedWO).company_phone}</p>
              <p><strong>Company Email:</strong> {getQuotationDetails(state.selectedWO).company_email}</p>
              <p><strong>Channel:</strong> {getQuotationDetails(state.selectedWO).channel}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-black">Contact Details</h3>
              <p><strong>Contact Name:</strong> {getQuotationDetails(state.selectedWO).contact_name}</p>
              <p><strong>Contact Email:</strong> {getQuotationDetails(state.selectedWO).contact_email}</p>
              <p><strong>Contact Phone:</strong> {getQuotationDetails(state.selectedWO).contact_phone}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-black">Work Order Details</h3>
              <p><strong>WO Number:</strong> {state.selectedWO.wo_number || 'N/A'}</p>
              <p><strong>Created Date:</strong> {new Date(state.selectedWO.created_at).toLocaleDateString()}</p>
              <p><strong>Assigned To:</strong> {getAssignedTechnicians(state.selectedWO.items)}</p>
              <p><strong>Invoice Status:</strong> {state.selectedWO.invoice_status || 'pending'}</p>
              <p>
                <strong>Invoice File:</strong>{' '}
                {state.selectedWO.invoice_file ? (
                  <a
                    href={state.selectedWO.invoice_file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline"
                  >
                    View File
                  </a>
                ) : (
                  'N/A'
                )}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-black">Device Under Test Details</h3>
              {state.selectedWO.items && state.selectedWO.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Item</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Quantity</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Unit</th>
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
                          <td className="border p-2 whitespace-nowrap">
                            {state.itemsList.find((i) => i.id === item.item)?.name || 'Not Provided'}
                          </td>
                          <td className="border p-2 whitespace-nowrap">{item.quantity || 'Not Provided'}</td>
                          <td className="border p-2 whitespace-nowrap">
                            {state.units.find((u) => u.id === item.unit)?.name || 'Not Provided'}
                          </td>
                          <td className="border p-2 whitespace-nowrap">{item.range || 'Not Provided'}</td>
                          <td className="border p-2 whitespace-nowrap">{item.certificate_uut_label || 'Not Provided'}</td>
                          <td className="border p-2 whitespace-nowrap">{item.certificate_number || 'Not Provided'}</td>
                          <td className="border p-2 whitespace-nowrap">
                            {item.calibration_date ? new Date(item.calibration_date).toLocaleDateString() : 'Not Provided'}
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            {item.calibration_due_date ? new Date(item.calibration_due_date).toLocaleDateString() : 'Not Provided'}
                          </td>
                          <td className="border p-2 whitespace-nowrap">{item.uuc_serial_number || 'Not Provided'}</td>
                          <td className="border p-2 whitespace-nowrap">
                            {item.certificate_file ? (
                              <a
                                href={item.certificate_file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:underline"
                              >
                                View Certificate
                              </a>
                            ) : (
                              'Not Provided'
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
      <Modal
        isOpen={state.isPOModalOpen}
        onClose={() => setState((prev) => ({ ...prev, isPOModalOpen: false, selectedPO: null }))}
        title={`Purchase Order Details - ${state.selectedPO?.series_number || 'N/A'}`}
      >
        {state.selectedPO && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-black">Company Details</h3>
              <p><strong>Series Number:</strong> {getQuotationDetails(state.selectedWO).series_number}</p>
              <p><strong>Company Name:</strong> {getQuotationDetails(state.selectedWO).company_name}</p>
              <p><strong>Company Address:</strong> {getQuotationDetails(state.selectedWO).company_address}</p>
              <p><strong>Company Phone:</strong> {getQuotationDetails(state.selectedWO).company_phone}</p>
              <p><strong>Company Email:</strong> {getQuotationDetails(state.selectedWO).company_email}</p>
              <p><strong>Channel:</strong> {getQuotationDetails(state.selectedWO).channel}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-black">Contact Details</h3>
              <p><strong>Contact Name:</strong> {getQuotationDetails(state.selectedWO).contact_name}</p>
              <p><strong>Contact Email:</strong> {getQuotationDetails(state.selectedWO).contact_email}</p>
              <p><strong>Contact Phone:</strong> {getQuotationDetails(state.selectedWO).contact_phone}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-black">Purchase Order Details</h3>
              <p><strong>Series Number:</strong> {state.selectedPO.series_number || 'N/A'}</p>
              <p><strong>Client PO Number:</strong> {state.selectedPO.client_po_number || 'N/A'}</p>
              <p><strong>Order Type:</strong> {state.selectedPO.order_type || 'N/A'}</p>
              <p><strong>Created:</strong> {state.selectedPO.created_at ? new Date(state.selectedPO.created_at).toLocaleDateString() : 'N/A'}</p>
              <p>
                <strong>PO File:</strong>{' '}
                {state.selectedPO.po_file ? (
                  <a href={state.selectedPO.po_file} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                    View File
                  </a>
                ) : (
                  'N/A'
                )}
              </p>
              <p><strong>Assigned Sales Person:</strong> {getQuotationDetails(state.selectedWO).assigned_sales_person}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-black">Items</h3>
              {state.selectedPO.items && state.selectedPO.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Item</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Quantity</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Unit</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Unit Price</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Total Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.selectedPO.items.map((item) => (
                        <tr key={item.id} className="border">
                          <td className="border p-2 whitespace-nowrap">
                            {state.itemsList.find((i) => i.id === item.item)?.name || item.item_name || 'N/A'}
                          </td>
                          <td className="border p-2 whitespace-nowrap">{item.quantity || 'N/A'}</td>
                          <td className="border p-2 whitespace-nowrap">
                            {state.units.find((u) => u.id === item.unit)?.name || 'N/A'}
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            ${item.unit_price ? Number(item.unit_price).toFixed(2) : 'N/A'}
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            ${item.quantity && item.unit_price ? Number(item.quantity * item.unit_price).toFixed(2) : '0.00'}
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
      <Modal
        isOpen={state.isDNModalOpen}
        onClose={() => setState((prev) => ({ ...prev, isDNModalOpen: false, selectedDN: null }))}
        title={`Delivery Note Details - ${state.selectedDN?.dn_number || 'N/A'}`}
      >
        {state.selectedDN ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-black">Company Details</h3>
              <p><strong>Series Number:</strong> {getQuotationDetails(state.selectedWO).series_number}</p>
              <p><strong>Company Name:</strong> {getQuotationDetails(state.selectedWO).company_name}</p>
              <p><strong>Company Address:</strong> {getQuotationDetails(state.selectedWO).company_address}</p>
              <p><strong>Company Phone:</strong> {getQuotationDetails(state.selectedWO).company_phone}</p>
              <p><strong>Company Email:</strong> {getQuotationDetails(state.selectedWO).company_email}</p>
              <p><strong>Channel:</strong> {getQuotationDetails(state.selectedWO).channel}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-black">Contact Details</h3>
              <p><strong>Contact Name:</strong> {getQuotationDetails(state.selectedWO).contact_name}</p>
              <p><strong>Contact Email:</strong> {getQuotationDetails(state.selectedWO).contact_email}</p>
              <p><strong>Contact Phone:</strong> {getQuotationDetails(state.selectedWO).contact_phone}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-black">Delivery Note Details</h3>
              <p><strong>DN Number:</strong> {state.selectedDN.dn_number || 'N/A'}</p>
              <p><strong>WO Number:</strong> {getWONumberByDN(state.selectedDN)}</p>
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
                    className="text-indigo-600 hover:underline"
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
        isOpen={state.isUploadPOModalOpen}
        onClose={() =>
          setState((prev) => ({
            ...prev,
            isUploadPOModalOpen: false,
            selectedPOForUpload: null,
            poUpload: { clientPoNumber: '', poFile: null, poStatus: 'not_available' },
            poUploadErrors: { clientPoNumber: '', poFile: '' },
          }))
        }
        title={`Upload PO Details - ${state.selectedPOForUpload?.series_number || 'N/A'}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PO Status</label>
            <select
              value={state.poUpload.poStatus}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  poUpload: { ...prev.poUpload, poStatus: e.target.value },
                  poUploadErrors: { clientPoNumber: '', poFile: '' },
                }))
              }
              className="w-full p-2 border rounded focus:outline-indigo-500"
              disabled={isSubmitting}
            >
              <option value="not_available">Not Available</option>
              <option value="available">Available</option>
            </select>
          </div>
          {state.poUpload.poStatus === 'available' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client PO Number</label>
                <InputField
                  type="text"
                  value={state.poUpload.clientPoNumber}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      poUpload: { ...prev.poUpload, clientPoNumber: e.target.value },
                      poUploadErrors: { ...prev.poUploadErrors, clientPoNumber: '' },
                    }))
                  }
                  className="w-full p-2 border rounded focus:outline-indigo-500"
                  disabled={isSubmitting}
                />
                {state.poUploadErrors.clientPoNumber && (
                  <p className="text-red-500 text-sm">{state.poUploadErrors.clientPoNumber}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload PO File</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      poUpload: { ...prev.poUpload, poFile: e.target.files[0] },
                      poUploadErrors: { ...prev.poUploadErrors, poFile: '' },
                    }))
                  }
                  className="w-full p-2 border rounded focus:outline-indigo-500"
                  disabled={isSubmitting}
                />
                {state.poUploadErrors.poFile && (
                  <p className="text-red-500 text-sm">{state.poUploadErrors.poFile}</p>
                )}
              </div>
            </>
          )}
          <div className="flex justify-end gap-2">
            <Button
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  isUploadPOModalOpen: false,
                  selectedPOForUpload: null,
                  poUpload: { clientPoNumber: '', poFile: null, poStatus: 'not_available' },
                  poUploadErrors: { clientPoNumber: '', poFile: '' },
                }))
              }
              disabled={isSubmitting}
              className={`whitespace-nowrap px-3 py-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm ${
                isSubmitting ? 'cursor-not-allowed' : ''
              }`}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePOUploadSubmit}
              disabled={isSubmitting || !hasPermission('pending_invoices', 'edit')}
              className={`whitespace-nowrap px-3 py-1 rounded-md text-sm ${
                isSubmitting || !hasPermission('pending_invoices', 'edit')
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={state.isUploadWOModalOpen}
        onClose={() =>
          setState((prev) => ({
            ...prev,
            isUploadWOModalOpen: false,
            selectedWOForUpload: null,
            woUpload: { certificateFile: null },
            woUploadErrors: { certificateFile: '' },
          }))
        }
        title={`Upload Work Order Certificate - ${state.selectedWOForUpload?.wo_number || 'N/A'}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Certificate File</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  woUpload: { ...prev.woUpload, certificateFile: e.target.files[0] },
                  woUploadErrors: { ...prev.woUploadErrors, certificateFile: '' },
                }))
              }
              className="w-full p-2 border rounded focus:outline-indigo-500"
              disabled={isSubmitting}
            />
            {state.woUploadErrors.certificateFile && (
              <p className="text-red-500 text-sm">{state.woUploadErrors.certificateFile}</p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  isUploadWOModalOpen: false,
                  selectedWOForUpload: null,
                  woUpload: { certificateFile: null },
                  woUploadErrors: { certificateFile: '' },
                }))
              }
              disabled={isSubmitting}
              className={`whitespace-nowrap px-3 py-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm ${
                isSubmitting ? 'cursor-not-allowed' : ''
              }`}
            >
              Cancel
            </Button>
            <Button
              onClick={handleWOUploadSubmit}
              disabled={isSubmitting || !hasPermission('pending_invoices', 'edit')}
              className={`whitespace-nowrap px-3 py-1 rounded-md text-sm ${
                isSubmitting || !hasPermission('pending_invoices', 'edit')
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={state.isUploadDNModalOpen}
        onClose={() =>
          setState((prev) => ({
            ...prev,
            isUploadDNModalOpen: false,
            selectedDNForUpload: null,
            dnUpload: { signedDeliveryNote: null },
            dnUploadErrors: { signedDeliveryNote: '' },
          }))
        }
        title={`Upload Signed Delivery Note - ${state.selectedDNForUpload?.dn_number || 'N/A'}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Signed Delivery Note</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  dnUpload: { ...prev.dnUpload, signedDeliveryNote: e.target.files[0] },
                  dnUploadErrors: { ...prev.dnUploadErrors, signedDeliveryNote: '' },
                }))
              }
              className="w-full p-2 border rounded focus:outline-indigo-500"
              disabled={isSubmitting}
            />
            {state.dnUploadErrors.signedDeliveryNote && (
              <p className="text-red-500 text-sm">{state.dnUploadErrors.signedDeliveryNote}</p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  isUploadDNModalOpen: false,
                  selectedDNForUpload: null,
                  dnUpload: { signedDeliveryNote: null },
                  dnUploadErrors: { signedDeliveryNote: '' },
                }))
              }
              disabled={isSubmitting}
              className={`whitespace-nowrap px-3 py-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm ${
                isSubmitting ? 'cursor-not-allowed' : ''
              }`}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUploadDNSubmit}
              disabled={isSubmitting || !hasPermission('pending_invoices', 'edit')}
              className={`whitespace-nowrap px-3 py-1 rounded-md text-sm ${
                isSubmitting || !hasPermission('pending_invoices', 'edit')
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={state.isUploadInvoiceModalOpen}
        onClose={() =>
          setState((prev) => ({
            ...prev,
            isUploadInvoiceModalOpen: false,
            selectedWOForInvoiceUpload: null,
            selectedDNId: null,
            invoiceUpload: { invoiceFile: null },
            invoiceUploadErrors: { invoiceFile: '' },
            invoiceUploadType: '',
            newStatus: '',
          }))
        }
        title={`Upload ${state.invoiceUploadType} Invoice - ${state.selectedWOForInvoiceUpload?.wo_number || 'N/A'}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload {state.invoiceUploadType} Invoice File</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  invoiceUpload: { ...prev.invoiceUpload, invoiceFile: e.target.files[0] },
                  invoiceUploadErrors: { ...prev.invoiceUploadErrors, invoiceFile: '' },
                }))
              }
              className="w-full p-2 border rounded focus:outline-indigo-500"
              disabled={isSubmitting}
            />
            {state.invoiceUploadErrors.invoiceFile && (
              <p className="text-red-500 text-sm">{state.invoiceUploadErrors.invoiceFile}</p>
            )}
          </div>
          {state.invoiceUploadType === 'Final' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Received Date</label>
              <InputField
                type="date"
                value={state.receivedDate}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    receivedDate: e.target.value,
                  }))
                }
                className="w-full p-2 border rounded focus:outline-indigo-500"
                disabled={isSubmitting}
              />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  isUploadInvoiceModalOpen: false,
                  selectedWOForInvoiceUpload: null,
                  selectedDNId: null,
                  invoiceUpload: { invoiceFile: null },
                  invoiceUploadErrors: { invoiceFile: '' },
                  invoiceUploadType: '',
                  newStatus: '',
                  receivedDate: '',
                }))
              }
              disabled={isSubmitting}
              className={`whitespace-nowrap px-3 py-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm ${
                isSubmitting ? 'cursor-not-allowed' : ''
              }`}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInvoiceUploadSubmit}
              disabled={isSubmitting || !hasPermission('pending_invoices', 'edit')}
              className={`whitespace-nowrap px-3 py-1 rounded-md text-sm ${
                isSubmitting || !hasPermission('pending_invoices', 'edit')
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={state.isStatusModalOpen}
        onClose={() =>
          setState((prev) => ({
            ...prev,
            isStatusModalOpen: false,
            selectedWorkOrderId: null,
            selectedDNId: null,
            newStatus: '',
            receivedDate: '',
            invoiceUploadType: '',
          }))
        }
        title="Update Invoice Status"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Received Date</label>
            <InputField
              type="date"
              value={state.receivedDate}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  receivedDate: e.target.value,
                }))
              }
              className="w-full p-2 border rounded focus:outline-indigo-500"
              disabled={isSubmitting}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  isStatusModalOpen: false,
                  selectedWorkOrderId: null,
                  selectedDNId: null,
                  newStatus: '',
                  receivedDate: '',
                  invoiceUploadType: '',
                }))
              }
              disabled={isSubmitting}
              className={`whitespace-nowrap px-3 py-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm ${
                isSubmitting ? 'cursor-not-allowed' : ''
              }`}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStatusModalSubmit}
              disabled={isSubmitting || !hasPermission('pending_invoices', 'edit')}
              className={`whitespace-nowrap px-3 py-1 rounded-md text-sm ${
                isSubmitting || !hasPermission('pending_invoices', 'edit')
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PendingInvoices;