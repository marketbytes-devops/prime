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
    selectedDeliveryNoteItemId: null,
    selectedDNId: null,
    newStatus: '',
    dueInDays: '',
    receivedDate: '',
    originalInvoiceStatus: '',
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
    selectedDNItemForInvoiceUpload: null,
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
            invoice_status: item.invoice_status ? item.invoice_status.toLowerCase() : 'pending',
          })),
        }));

      const workOrders = woRes.data || [];

      const workOrderDeliveryPairs = [];

      workOrders.forEach((workOrder) => {
        const relatedDNs = deliveryNotes.filter((dn) => dn.work_order_id === workOrder.id);
        if (relatedDNs.length > 0) {
          relatedDNs.forEach((dn) => {
            dn.items.forEach((dnItem) => {
              workOrderDeliveryPairs.push({
                id: `${workOrder.id}-${dn.id}-${dnItem.id}`,
                workOrder,
                deliveryNote: dn,
                deliveryNoteItem: dnItem,
                workOrderId: workOrder.id,
                deliveryNoteId: dn.id,
                deliveryNoteItemId: dnItem.id,
              });
            });
          });
        } else {
          workOrderDeliveryPairs.push({
            id: `${workOrder.id}-no-dn`,
            workOrder,
            deliveryNote: null,
            deliveryNoteItem: null,
            workOrderId: workOrder.id,
            deliveryNoteId: null,
            deliveryNoteItemId: null,
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
    if (type === 'wo') {
      setState((prev) => ({
        ...prev,
        isWOModalOpen: true,
        selectedWO: pair.workOrder,
      }));
    } else if (type === 'po') {
      const poId = pair.workOrder.purchase_order;
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
      if (pair.deliveryNoteItem && pair.deliveryNoteItem.invoice_file) {
        window.open(pair.deliveryNoteItem.invoice_file, '_blank');
      } else {
        toast.error('No invoice file available.');
      }
    }
  };

  const handleUploadPO = (pair) => {
    const poId = pair.workOrder.purchase_order;
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
    setState((prev) => ({
      ...prev,
      isUploadWOModalOpen: true,
      selectedWOForUpload: pair.workOrder,
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
    const deliveryNoteItem = pair.deliveryNoteItem;
    if (!deliveryNoteItem) {
      toast.error('Delivery note item not found.');
      return;
    }
    setState((prev) => ({
      ...prev,
      isUploadInvoiceModalOpen: true,
      selectedWOForInvoiceUpload: pair.workOrder,
      selectedDNItemForInvoiceUpload: deliveryNoteItem,
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
      const formData = new FormData();
      formData.append('invoice_status', state.newStatus);
      if (state.newStatus === 'raised' && state.dueInDays) {
        formData.append('due_in_days', parseInt(state.dueInDays));
      } else if (state.newStatus === 'processed' && state.receivedDate) {
        formData.append('received_date', state.receivedDate);
      }
      formData.append('invoice_file', state.invoiceUpload.invoiceFile);
      formData.append('delivery_note_item_id', state.selectedDNItemForInvoiceUpload.id);

      await apiClient.patch(
        `work-orders/${state.selectedWOForInvoiceUpload.id}/update-delivery-note-item-invoice-status/`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      toast.success(`${state.invoiceUploadType} Invoice file uploaded and status updated successfully.`);
      setState((prev) => ({
        ...prev,
        isUploadInvoiceModalOpen: false,
        selectedWOForInvoiceUpload: null,
        selectedDNItemForInvoiceUpload: null,
        invoiceUpload: { invoiceFile: null },
        invoiceUploadErrors: { invoiceFile: '' },
        invoiceUploadType: '',
        isStatusModalOpen: false,
        selectedDeliveryNoteItemId: null,
        newStatus: '',
        dueInDays: '',
        receivedDate: '',
        originalInvoiceStatus: '',
      }));
      await fetchData();
    } catch (error) {
      console.error(`Error updating status or uploading ${state.invoiceUploadType.toLowerCase()} invoice file:`, error);
      toast.error(`Failed to update status or upload ${state.invoiceUploadType.toLowerCase()} invoice file.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = (pair, newStatus) => {
    const deliveryNoteItem = pair.deliveryNoteItem;
    if (!deliveryNoteItem) {
      toast.error('Delivery note item not found.');
      return;
    }
    if (deliveryNoteItem.invoice_status === 'raised' && newStatus === 'raised') {
      toast.warn(
        'The invoice status is already set to "Raised." Once a Proforma invoice is submitted, it cannot be updated to "Raised" again.',
        {
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: 'colored',
        }
      );
      return;
    }
    if (deliveryNoteItem.invoice_status === 'processed') {
      toast.warn(
        'The invoice status is already set to "Processed." It cannot be changed once processed.',
        {
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: 'colored',
        }
      );
      return;
    }
    setState((prev) => ({
      ...prev,
      isStatusModalOpen: true,
      selectedDeliveryNoteItemId: deliveryNoteItem.id,
      selectedDNId: pair.deliveryNoteId,
      newStatus,
      dueInDays: '',
      receivedDate: '',
      originalInvoiceStatus: deliveryNoteItem?.invoice_status || 'pending',
      invoiceUploadType: newStatus === 'raised' ? 'Proforma' : newStatus === 'processed' ? 'Final' : '',
    }));
  };

  const handleStatusModalSubmit = () => {
    const { selectedDeliveryNoteItemId, newStatus, dueInDays, receivedDate } = state;
    const deliveryNoteItem = state.workOrderDeliveryPairs
      .find((pair) => pair.deliveryNoteItemId === selectedDeliveryNoteItemId)
      ?.deliveryNoteItem;

    if (!deliveryNoteItem) {
      toast.error('Delivery note item not found.');
      return;
    }

    if (deliveryNoteItem.invoice_status === 'raised' && newStatus === 'raised') {
      toast.error(
        'Once submitted, the Proforma invoice cannot be updated to "Raised" again.',
        {
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: 'colored',
        }
      );
      return;
    }

    if (deliveryNoteItem.invoice_status === 'processed') {
      toast.error(
        'The invoice status is already "Processed" and cannot be changed.',
        {
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: 'colored',
        }
      );
      return;
    }

    if (newStatus === 'raised' && (!dueInDays || isNaN(dueInDays) || parseInt(dueInDays) <= 0)) {
      toast.error('Please enter a valid number of days.');
      return;
    }

    if (newStatus === 'processed' && !receivedDate) {
      toast.error('Please select a received date.');
      return;
    }

    if (newStatus === 'raised' || newStatus === 'processed') {
      setState((prev) => ({
        ...prev,
        isStatusModalOpen: false,
        isUploadInvoiceModalOpen: true,
        selectedWOForInvoiceUpload: state.workOrderDeliveryPairs.find(
          (pair) => pair.deliveryNoteItemId === selectedDeliveryNoteItemId
        ).workOrder,
        selectedDNItemForInvoiceUpload: deliveryNoteItem,
        invoiceUpload: { invoiceFile: null },
        invoiceUploadErrors: { invoiceFile: '' },
      }));
    } else {
      confirmStatusUpdate(selectedDeliveryNoteItemId, newStatus, dueInDays, receivedDate);
    }
  };

  const confirmStatusUpdate = async (deliveryNoteItemId, newStatus, dueInDays, receivedDate) => {
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('invoice_status', newStatus);
      if (newStatus === 'raised' && dueInDays) {
        formData.append('due_in_days', parseInt(dueInDays));
      } else if (newStatus === 'processed' && receivedDate) {
        formData.append('received_date', receivedDate);
      }
      formData.append('delivery_note_item_id', deliveryNoteItemId);

      const workOrderId = state.workOrderDeliveryPairs.find(
        (pair) => pair.deliveryNoteItemId === deliveryNoteItemId
      ).workOrderId;

      await apiClient.patch(
        `work-orders/${workOrderId}/update-delivery-note-item-invoice-status/`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      toast.success('Delivery note item invoice status updated successfully.');
      setState((prev) => ({
        ...prev,
        isStatusModalOpen: false,
        selectedDeliveryNoteItemId: null,
        selectedDNId: null,
        newStatus: '',
        dueInDays: '',
        receivedDate: '',
        originalInvoiceStatus: '',
        invoiceUploadType: '',
      }));
      await fetchData();
    } catch (error) {
      console.error('Error updating delivery note item invoice status:', error);
      toast.error('Failed to update delivery note item invoice status.');
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
    return (
      isPOComplete(pair.workOrder) &&
      isDUTComplete(pair.workOrder) &&
      isDNComplete(pair.deliveryNote) &&
      pair.deliveryNoteItem &&
      pair.deliveryNoteItem.invoice_status !== 'processed'
    );
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
      (pair.deliveryNoteItem && getItemName(pair.deliveryNoteItem.item).toLowerCase().includes(state.searchTerm.toLowerCase()))
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
              placeholder="Search by WO Number, Quotation, DN Number, Company Name, or Item..."
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
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Item</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Created Date</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Assigned To</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">View Documents</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Invoice Status</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentPairs.length === 0 ? (
                <tr>
                  <td colSpan="11" className="border p-2 text-center text-gray-500">
                    No work orders found.
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
                    <td className="border p-2 whitespace-nowrap">{pair.deliveryNoteItem ? getItemName(pair.deliveryNoteItem.item) : 'N/A'}</td>
                    <td className="border p-2 whitespace-nowrap">
                      {pair.workOrder.created_at
                        ? new Date(pair.workOrder.created_at).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="border p-2 whitespace-nowrap">{getAssignedTechnicians(pair.workOrder.items)}</td>
                    <td className="border p-2 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {hasPermission('Work Orders', 'view') && (
                          <Button
                            onClick={() => handleViewDocument(pair, 'wo')}
                            className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                            disabled={!pair.workOrder}
                          >
                            WO
                          </Button>
                        )}
                        {hasPermission('Purchase Orders', 'view') && (
                          <Button
                            onClick={() => handleViewDocument(pair, 'po')}
                            className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                            disabled={isPOEmpty(pair.workOrder)}
                          >
                            PO
                          </Button>
                        )}
                        {hasPermission('Delivery Notes', 'view') && (
                          <Button
                            onClick={() => handleViewDocument(pair, 'dn')}
                            className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                            disabled={!pair.deliveryNote}
                          >
                            DN
                          </Button>
                        )}
                        {hasPermission('Invoices', 'view') && pair.deliveryNoteItem?.invoice_file && (
                          <Button
                            onClick={() => handleViewDocument(pair, 'invoice')}
                            className="bg-purple-500 text-white px-2 py-1 rounded hover:bg-purple-600"
                          >
                            Invoice
                          </Button>
                        )}
                      </div>
                    </td>
                    <td className="border p-2 whitespace-nowrap">
                      {pair.deliveryNoteItem ? pair.deliveryNoteItem.invoice_status || 'Pending' : 'N/A'}
                    </td>
                    <td className="border p-2 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {hasPermission('Purchase Orders', 'edit') && isPOEmpty(pair.workOrder) && (
                          <Button
                            onClick={() => handleUploadPO(pair)}
                            className="bg-indigo-500 text-white px-2 py-1 rounded hover:bg-indigo-600"
                          >
                            Upload PO
                          </Button>
                        )}
                        {hasPermission('Work Orders', 'edit') && !isDUTComplete(pair.workOrder) && (
                          <Button
                            onClick={() => handleUploadWO(pair)}
                            className="bg-teal-500 text-white px-2 py-1 rounded hover:bg-teal-600"
                          >
                            Upload DUT
                          </Button>
                        )}
                        {hasPermission('Delivery Notes', 'edit') && isDNReadyForUpload(pair.deliveryNote) && (
                          <Button
                            onClick={() => handleUploadDN(pair)}
                            className="bg-orange-500 text-white px-2 py-1 rounded hover:bg-orange-600"
                          >
                            Upload DN
                          </Button>
                        )}
                        {hasPermission('Invoices', 'edit') && canUploadInvoice(pair) && (
                          <>
                            <Button
                              onClick={() => handleUpdateStatus(pair, 'raised')}
                              className="bg-pink-500 text-white px-2 py-1 rounded hover:bg-pink-600"
                              disabled={pair.deliveryNoteItem?.invoice_status === 'raised' || pair.deliveryNoteItem?.invoice_status === 'processed'}
                            >
                              Raise Invoice
                            </Button>
                            <Button
                              onClick={() => handleUpdateStatus(pair, 'processed')}
                              className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                              disabled={pair.deliveryNoteItem?.invoice_status !== 'raised'}
                            >
                              Process Invoice
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <Button
              onClick={handlePrev}
              disabled={state.currentPage === 1}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
            >
              Previous
            </Button>
            <div className="flex space-x-2">
              {pageNumbers.map((page) => (
                <Button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 rounded ${
                    state.currentPage === page
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              onClick={handleNext}
              disabled={state.currentPage === totalPages}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Work Order Modal */}
      <Modal
        isOpen={state.isWOModalOpen}
        onClose={() => setState((prev) => ({ ...prev, isWOModalOpen: false, selectedWO: null }))}
        title="Work Order Details"
      >
        {state.selectedWO && (
          <div className="space-y-4">
            <p><strong>WO Number:</strong> {state.selectedWO.wo_number || 'N/A'}</p>
            <p><strong>Status:</strong> {state.selectedWO.status || 'N/A'}</p>
            <p><strong>Created At:</strong> {state.selectedWO.created_at ? new Date(state.selectedWO.created_at).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Created By:</strong> {state.selectedWO.created_by_name || 'N/A'}</p>
            <p><strong>Remarks:</strong> {state.selectedWO.remarks || 'N/A'}</p>
            <h3 className="text-lg font-semibold">Items</h3>
            <ul className="list-disc pl-5">
              {state.selectedWO.items?.map((item) => (
                <li key={item.id}>
                  {getItemName(item.item)} - Quantity: {item.quantity}, Range: {item.range || 'N/A'}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal>

      {/* Purchase Order Modal */}
      <Modal
        isOpen={state.isPOModalOpen}
        onClose={() => setState((prev) => ({ ...prev, isPOModalOpen: false, selectedPO: null }))}
        title="Purchase Order Details"
      >
        {state.selectedPO && (
          <div className="space-y-4">
            <p><strong>PO Number:</strong> {state.selectedPO.series_number || 'N/A'}</p>
            <p><strong>Client PO Number:</strong> {state.selectedPO.client_po_number || 'N/A'}</p>
            <p><strong>Order Type:</strong> {state.selectedPO.order_type || 'N/A'}</p>
            {state.selectedPO.po_file && (
              <p>
                <strong>PO File:</strong>{' '}
                <a href={state.selectedPO.po_file} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  View File
                </a>
              </p>
            )}
          </div>
        )}
      </Modal>

      {/* Delivery Note Modal */}
      <Modal
        isOpen={state.isDNModalOpen}
        onClose={() => setState((prev) => ({ ...prev, isDNModalOpen: false, selectedDN: null }))}
        title="Delivery Note Details"
      >
        {state.selectedDN && (
          <div className="space-y-4">
            <p><strong>DN Number:</strong> {state.selectedDN.dn_number || 'N/A'}</p>
            <p><strong>Work Order:</strong> {getWONumberByDN(state.selectedDN)}</p>
            <p><strong>Delivery Status:</strong> {state.selectedDN.delivery_status || 'N/A'}</p>
            {state.selectedDN.signed_delivery_note && (
              <p>
                <strong>Signed Delivery Note:</strong>{' '}
                <a
                  href={state.selectedDN.signed_delivery_note}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  View File
                </a>
              </p>
            )}
            <h3 className="text-lg font-semibold">Items</h3>
            <ul className="list-disc pl-5">
              {state.selectedDN.items?.map((item) => (
                <li key={item.id}>
                  {getItemName(item.item)} - Quantity: {item.quantity}, Invoice Status: {item.invoice_status || 'Pending'}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal>

      {/* Upload PO Modal */}
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
        title="Upload Purchase Order"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">PO Status</label>
            <select
              value={state.poUpload.poStatus}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  poUpload: { ...prev.poUpload, poStatus: e.target.value },
                }))
              }
              className="w-full p-2 border rounded focus:outline-indigo-500"
            >
              <option value="not_available">Not Available</option>
              <option value="available">Available</option>
            </select>
          </div>
          {state.poUpload.poStatus === 'available' && (
            <>
              <InputField
                label="Client PO Number"
                type="text"
                value={state.poUpload.clientPoNumber}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    poUpload: { ...prev.poUpload, clientPoNumber: e.target.value },
                  }))
                }
                error={state.poUploadErrors.clientPoNumber}
              />
              <InputField
                label="PO File"
                type="file"
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    poUpload: { ...prev.poUpload, poFile: e.target.files[0] },
                  }))
                }
                error={state.poUploadErrors.poFile}
              />
            </>
          )}
          <Button
            onClick={handlePOUploadSubmit}
            disabled={isSubmitting}
            className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </Modal>

      {/* Upload Work Order Modal */}
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
        title="Upload Work Order Certificate"
      >
        <div className="space-y-4">
          <InputField
            label="Certificate File"
            type="file"
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                woUpload: { ...prev.woUpload, certificateFile: e.target.files[0] },
              }))
            }
            error={state.woUploadErrors.certificateFile}
          />
          <Button
            onClick={handleWOUploadSubmit}
            disabled={isSubmitting}
            className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </Modal>

      {/* Upload Delivery Note Modal */}
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
        title="Upload Signed Delivery Note"
      >
        <div className="space-y-4">
          <InputField
            label="Signed Delivery Note"
            type="file"
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                dnUpload: { ...prev.dnUpload, signedDeliveryNote: e.target.files[0] },
              }))
            }
            error={state.dnUploadErrors.signedDeliveryNote}
          />
          <Button
            onClick={handleUploadDNSubmit}
            disabled={isSubmitting}
            className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </Modal>

      {/* Update Invoice Status Modal */}
      <Modal
        isOpen={state.isStatusModalOpen}
        onClose={() =>
          setState((prev) => ({
            ...prev,
            isStatusModalOpen: false,
            selectedDeliveryNoteItemId: null,
            selectedDNId: null,
            newStatus: '',
            dueInDays: '',
            receivedDate: '',
            originalInvoiceStatus: '',
            invoiceUploadType: '',
          }))
        }
        title={`Update Invoice Status to ${state.newStatus === 'raised' ? 'Raised' : state.newStatus === 'processed' ? 'Processed' : ''}`}
      >
        <div className="space-y-4">
          {state.newStatus === 'raised' && (
            <InputField
              label="Due in Days"
              type="number"
              value={state.dueInDays}
              onChange={(e) =>
                setState((prev) => ({ ...prev, dueInDays: e.target.value }))
              }
              placeholder="Enter number of days"
            />
          )}
          {state.newStatus === 'processed' && (
            <InputField
              label="Received Date"
              type="date"
              value={state.receivedDate}
              onChange={(e) =>
                setState((prev) => ({ ...prev, receivedDate: e.target.value }))
              }
            />
          )}
          <Button
            onClick={handleStatusModalSubmit}
            disabled={isSubmitting}
            className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600"
          >
            {isSubmitting ? 'Submitting...' : 'Proceed'}
          </Button>
        </div>
      </Modal>

      {/* Upload Invoice Modal */}
      <Modal
        isOpen={state.isUploadInvoiceModalOpen}
        onClose={() =>
          setState((prev) => ({
            ...prev,
            isUploadInvoiceModalOpen: false,
            selectedWOForInvoiceUpload: null,
            selectedDNItemForInvoiceUpload: null,
            invoiceUpload: { invoiceFile: null },
            invoiceUploadErrors: { invoiceFile: '' },
            invoiceUploadType: '',
          }))
        }
        title={`Upload ${state.invoiceUploadType} Invoice`}
      >
        <div className="space-y-4">
          <InputField
            label={`${state.invoiceUploadType} Invoice File`}
            type="file"
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                invoiceUpload: { ...prev.invoiceUpload, invoiceFile: e.target.files[0] },
              }))
            }
            error={state.invoiceUploadErrors.invoiceFile}
          />
          <Button
            onClick={handleInvoiceUploadSubmit}
            disabled={isSubmitting}
            className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default PendingInvoices;