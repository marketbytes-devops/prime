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
    dueInDays: '',
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
    selectedDNForInvoiceUpload: null,
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
      if (pair.deliveryNote && pair.deliveryNote.items) {
        const itemsWithInvoices = pair.deliveryNote.items.filter(item => item.invoice_file);
        if (itemsWithInvoices.length > 0) {
          window.open(itemsWithInvoices[0].invoice_file, '_blank');
        } else {
          toast.error('No invoice files available.');
        }
      } else {
        toast.error('No invoice files available.');
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

  const handleUploadInvoice = (pair) => {
    if (!pair.deliveryNote || !pair.deliveryNote.items || pair.deliveryNote.items.length === 0) {
      toast.error('No delivery note items found.');
      return;
    }

    setState((prev) => ({
      ...prev,
      isUploadInvoiceModalOpen: true,
      selectedWOForInvoiceUpload: pair.workOrder,
      selectedDNForInvoiceUpload: pair.deliveryNote,
      invoiceUpload: { invoiceFile: null },
      invoiceUploadErrors: { invoiceFile: '' },
      invoiceUploadType: 'Final',
      newStatus: 'processed',
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
      if (state.newStatus === 'processed' && state.receivedDate) {
        formData.append('received_date', state.receivedDate);
      }
      const itemIds = state.selectedDNForInvoiceUpload.items.map(item => item.id);
      formData.append('delivery_note_item_ids', JSON.stringify(itemIds));
      formData.append('invoice_file', state.invoiceUpload.invoiceFile);

      await apiClient.patch(
        `work-orders/${state.selectedWOForInvoiceUpload.id}/update-delivery-note-item-invoice-status/`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      toast.success(`${state.invoiceUploadType} Invoice file uploaded and status updated successfully for all items.`);
      setState((prev) => ({
        ...prev,
        isUploadInvoiceModalOpen: false,
        selectedWOForInvoiceUpload: null,
        selectedDNForInvoiceUpload: null,
        invoiceUpload: { invoiceFile: null },
        invoiceUploadErrors: { invoiceFile: '' },
        invoiceUploadType: '',
        isStatusModalOpen: false,
        selectedWorkOrderId: null,
        selectedDNId: null,
        newStatus: '',
        dueInDays: '',
        receivedDate: '',
      }));
      await fetchData();
    } catch (error) {
      console.error(`Error uploading ${state.invoiceUploadType.toLowerCase()} invoice file:`, error);
      toast.error(`Failed to upload ${state.invoiceUploadType.toLowerCase()} invoice file.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = (pair, newStatus) => {
    if (!pair.deliveryNote || !pair.deliveryNote.items || pair.deliveryNote.items.length === 0) {
      toast.error('No delivery note items found.');
      return;
    }

    const allItemsProcessed = pair.deliveryNote.items.every(item => item.invoice_status === 'processed');
    if (allItemsProcessed && newStatus !== 'pending') {
      toast.warn(
        'The invoice status for all items is already set to "Processed." It cannot be changed except to "Pending."',
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
      selectedWorkOrderId: pair.workOrderId,
      selectedDNId: pair.deliveryNoteId,
      newStatus,
      dueInDays: newStatus === 'raised' ? prev.dueInDays : '',
      receivedDate: newStatus === 'processed' ? prev.receivedDate : '',
      invoiceUploadType: newStatus === 'processed' ? 'Final' : '',
    }));
  };

  const handleStatusModalSubmit = () => {
    const { selectedDNId, newStatus, dueInDays, receivedDate } = state;

    const deliveryNote = state.deliveryNotes.find(dn => dn.id === selectedDNId);
    if (!deliveryNote) {
      toast.error('Delivery note not found.');
      return;
    }

    const allItemsProcessed = deliveryNote.items.every(item => item.invoice_status === 'processed');
    if (allItemsProcessed && newStatus !== 'pending') {
      toast.error(
        'The invoice status for all items is already "Processed" and cannot be changed except to "Pending."',
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

    if (newStatus === 'processed') {
      setState((prev) => ({
        ...prev,
        isStatusModalOpen: false,
        isUploadInvoiceModalOpen: true,
        selectedWOForInvoiceUpload: state.workOrderDeliveryPairs.find(
          pair => pair.deliveryNoteId === selectedDNId
        ).workOrder,
        selectedDNForInvoiceUpload: deliveryNote,
        invoiceUpload: { invoiceFile: null },
        invoiceUploadErrors: { invoiceFile: '' },
      }));
    } else {
      confirmStatusUpdate(selectedDNId, newStatus, dueInDays);
    }
  };

  const confirmStatusUpdate = async (deliveryNoteId, newStatus, dueInDays) => {
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('invoice_status', newStatus);
      if (newStatus === 'raised' && dueInDays) {
        formData.append('due_in_days', parseInt(dueInDays));
      }
      const deliveryNote = state.deliveryNotes.find(dn => dn.id === deliveryNoteId);
      const itemIds = deliveryNote.items.map(item => item.id);
      formData.append('delivery_note_item_ids', JSON.stringify(itemIds));

      const workOrderId = state.workOrderDeliveryPairs.find(
        pair => pair.deliveryNoteId === deliveryNoteId
      ).workOrderId;

      await apiClient.patch(
        `work-orders/${workOrderId}/update-delivery-note-item-invoice-status/`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      toast.success('Delivery note invoice status updated successfully for all items.');
      setState((prev) => ({
        ...prev,
        isStatusModalOpen: false,
        selectedWorkOrderId: null,
        selectedDNId: null,
        newStatus: '',
        dueInDays: '',
        receivedDate: '',
        invoiceUploadType: '',
      }));
      await fetchData();
    } catch (error) {
      console.error('Error updating delivery note invoice status:', error);
      toast.error('Failed to update delivery note invoice status.');
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
      pair.deliveryNote &&
      pair.deliveryNote.items &&
      !pair.deliveryNote.items.every(item => item.invoice_status === 'processed')
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

  const getInvoiceStatusForDN = (deliveryNote) => {
    if (!deliveryNote || !deliveryNote.items || deliveryNote.items.length === 0) return 'N/A';
    const statuses = [...new Set(deliveryNote.items.map(item => item.invoice_status || 'pending'))];
    return statuses.length === 1 ? statuses[0] : 'Mixed';
  };

  const filteredPairs = state.workOrderDeliveryPairs
    .filter((pair) =>
      (pair.workOrder.wo_number || '').toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      getQuotationDetails(pair.workOrder).series_number.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      getDNSeriesNumber(pair.deliveryNote).toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      getQuotationDetails(pair.workOrder).company_name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      (pair.deliveryNote && pair.deliveryNote.items &&
       pair.deliveryNote.items.some(item => getItemName(item.item).toLowerCase().includes(state.searchTerm.toLowerCase())))
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
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Items</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Created Date</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Assigned To</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">View Documents</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Invoice Status</th>
              </tr>
            </thead>
            <tbody>
              {currentPairs.length === 0 ? (
                <tr>
                  <td colSpan="10" className="border p-2 text-center text-gray-500">
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
                    <td className="border p-2 whitespace-nowrap">
                      {pair.deliveryNote && pair.deliveryNote.items && pair.deliveryNote.items.length > 0 ? (
                        <div className="space-y-1 max-w-xs">
                          {pair.deliveryNote.items.map((item, itemIndex) => (
                            <div key={item.id} className="text-sm">
                              {getItemName(item.item)} {item.range && `(${item.range})`}
                            </div>
                          ))}
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="border p-2 whitespace-nowrap">
                      {pair.workOrder.created_at
                        ? new Date(pair.workOrder.created_at).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="border p-2 whitespace-nowrap">{getAssignedTechnicians(pair.workOrder.items)}</td>
                    <td className="border p-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => (isPOEmpty(pair.workOrder) ? handleUploadPO(pair) : handleViewDocument(pair, 'po'))}
                          disabled={isSubmitting || !hasPermission('pending_invoices', 'view') || (!isPOEmpty(pair.workOrder) && !isPOComplete(pair.workOrder))}
                          className={`px-3 py-1 rounded-md text-sm whitespace-nowrap ${
                            isSubmitting || !hasPermission('pending_invoices', 'view') || (!isPOEmpty(pair.workOrder) && !isPOComplete(pair.workOrder))
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : isPOEmpty(pair.workOrder)
                              ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {isSubmitting ? 'Submitting...' : isPOEmpty(pair.workOrder) ? 'Upload PO' : 'View PO'}
                        </Button>
                        <Button
                          onClick={() => handleViewDocument(pair, 'wo')}
                          disabled={isSubmitting || !hasPermission('pending_invoices', 'view') || !isDUTComplete(pair.workOrder)}
                          className={`px-3 py-1 rounded-md text-sm whitespace-nowrap ${
                            isSubmitting || !hasPermission('pending_invoices', 'view') || !isDUTComplete(pair.workOrder)
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {isSubmitting ? 'Submitting...' : 'View WO'}
                        </Button>
                        <Button
                          onClick={() => (isDNReadyForUpload(pair.deliveryNote) ? handleUploadDN(pair) : handleViewDocument(pair, 'dn'))}
                          disabled={isSubmitting || !hasPermission('pending_invoices', 'view') || (!isDNReadyForUpload(pair.deliveryNote) && !isDNComplete(pair.deliveryNote))}
                          className={`px-3 py-1 rounded-md text-sm whitespace-nowrap ${
                            isSubmitting || !hasPermission('pending_invoices', 'view') || (!isDNReadyForUpload(pair.deliveryNote) && !isDNComplete(pair.deliveryNote))
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : isDNReadyForUpload(pair.deliveryNote)
                              ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                              : 'bg-purple-600 text-white hover:bg-purple-700'
                          }`}
                        >
                          {isSubmitting ? 'Submitting...' : isDNReadyForUpload(pair.deliveryNote) ? 'Upload DN' : 'View DN'}
                        </Button>
                        <Button
                          onClick={() => handleViewDocument(pair, 'invoice')}
                          disabled={isSubmitting || !hasPermission('pending_invoices', 'view') || 
                            !(pair.deliveryNote && pair.deliveryNote.items && 
                              pair.deliveryNote.items.some(item => item.invoice_file))}
                          className={`px-3 py-1 rounded-md text-sm whitespace-nowrap ${
                            isSubmitting || !hasPermission('pending_invoices', 'view') || 
                            !(pair.deliveryNote && pair.deliveryNote.items && 
                              pair.deliveryNote.items.some(item => item.invoice_file))
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          }`}
                        >
                          {isSubmitting ? 'Submitting...' : 
                           (pair.deliveryNote && pair.deliveryNote.items && 
                            pair.deliveryNote.items.some(item => item.invoice_file)) ? 'View Invoice' : 'No Invoice'}
                        </Button>
                      </div>
                    </td>
                    <td className="border p-2 whitespace-nowrap">
                      {pair.deliveryNote && pair.deliveryNote.items && pair.deliveryNote.items.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600">{getInvoiceStatusForDN(pair.deliveryNote)}</span>
                          <select
                            onChange={(e) => handleUpdateStatus(pair, e.target.value)}
                            disabled={isSubmitting || !hasPermission('pending_invoices', 'edit') || !canUploadInvoice(pair)}
                            className={`px-3 py-1 rounded-md text-sm border ${
                              isSubmitting || !hasPermission('pending_invoices', 'edit') || !canUploadInvoice(pair)
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                            }`}
                            value=""
                          >
                            <option value="" disabled>Select Status</option>
                            <option value="pending">Pending</option>
                            <option value="raised">Raised</option>
                            <option value="processed">Processed</option>
                          </select>
                        </div>
                      ) : (
                        'N/A'
                      )}
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
              disabled={state.currentPage === 1 || isSubmitting}
              className={`px-3 py-1 rounded-md text-sm ${
                state.currentPage === 1 || isSubmitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Prev'}
            </Button>
            {pageNumbers.map((page) => (
              <Button
                key={page}
                onClick={() => handlePageChange(page)}
                disabled={isSubmitting}
                className={`px-3 py-1 rounded-md text-sm min-w-fit whitespace-nowrap ${
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
              className={`px-3 py-1 rounded-md text-sm ${
                state.currentPage === totalPages || isSubmitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Next'}
            </Button>
          </div>
        )}
      </div>

      <Modal
        isOpen={state.isPOModalOpen}
        onClose={() => setState((prev) => ({ ...prev, isPOModalOpen: false, selectedPO: null }))}
        title={`Purchase Order Details - ${state.selectedPO?.series_number || 'N/A'}`}
      >
        {state.selectedPO && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-black">Company Details</h3>
              <p><strong>Series Number:</strong> {getQuotationDetails(state.workOrders.find(wo => wo.purchase_order === state.selectedPO.id)).series_number}</p>
              <p><strong>Company Name:</strong> {getQuotationDetails(state.workOrders.find(wo => wo.purchase_order === state.selectedPO.id)).company_name}</p>
              <p><strong>Company Address:</strong> {getQuotationDetails(state.workOrders.find(wo => wo.purchase_order === state.selectedPO.id)).company_address}</p>
              <p><strong>Company Phone:</strong> {getQuotationDetails(state.workOrders.find(wo => wo.purchase_order === state.selectedPO.id)).company_phone}</p>
              <p><strong>Company Email:</strong> {getQuotationDetails(state.workOrders.find(wo => wo.purchase_order === state.selectedPO.id)).company_email}</p>
              <p><strong>Channel:</strong> {getQuotationDetails(state.workOrders.find(wo => wo.purchase_order === state.selectedPO.id)).channel}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-black">Contact Details</h3>
              <p><strong>Contact Name:</strong> {getQuotationDetails(state.workOrders.find(wo => wo.purchase_order === state.selectedPO.id)).contact_name}</p>
              <p><strong>Contact Email:</strong> {getQuotationDetails(state.workOrders.find(wo => wo.purchase_order === state.selectedPO.id)).contact_email}</p>
              <p><strong>Contact Phone:</strong> {getQuotationDetails(state.workOrders.find(wo => wo.purchase_order === state.selectedPO.id)).contact_phone}</p>
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
              <p><strong>Assigned Sales Person:</strong> {getQuotationDetails(state.workOrders.find(wo => wo.purchase_order === state.selectedPO.id)).assigned_sales_person}</p>
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
                            SAR {item.unit_price ? Number(item.unit_price).toFixed(2) : 'N/A'}
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            SAR {item.quantity && item.unit_price ? Number(item.quantity * item.unit_price).toFixed(2) : '0.00'}
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
                            {item.calibration_date
                              ? new Date(item.calibration_date).toLocaleDateString()
                              : 'Not Provided'}
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            {item.calibration_due_date
                              ? new Date(item.calibration_due_date).toLocaleDateString()
                              : 'Not Provided'}
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
        isOpen={state.isDNModalOpen}
        onClose={() => setState((prev) => ({ ...prev, isDNModalOpen: false, selectedDN: null }))}
        title={`Delivery Note Details - ${state.selectedDN?.dn_number || 'N/A'}`}
      >
        {state.selectedDN && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-black">Company Details</h3>
              <p><strong>Series Number:</strong> {getQuotationDetails(state.workOrders.find(wo => wo.id === state.selectedDN.work_order_id)).series_number}</p>
              <p><strong>Company Name:</strong> {getQuotationDetails(state.workOrders.find(wo => wo.id === state.selectedDN.work_order_id)).company_name}</p>
              <p><strong>Company Address:</strong> {getQuotationDetails(state.workOrders.find(wo => wo.id === state.selectedDN.work_order_id)).company_address}</p>
              <p><strong>Company Phone:</strong> {getQuotationDetails(state.workOrders.find(wo => wo.id === state.selectedDN.work_order_id)).company_phone}</p>
              <p><strong>Company Email:</strong> {getQuotationDetails(state.workOrders.find(wo => wo.id === state.selectedDN.work_order_id)).company_email}</p>
              <p><strong>Channel:</strong> {getQuotationDetails(state.workOrders.find(wo => wo.id === state.selectedDN.work_order_id)).channel}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-black">Contact Details</h3>
              <p><strong>Contact Name:</strong> {getQuotationDetails(state.workOrders.find(wo => wo.id === state.selectedDN.work_order_id)).contact_name}</p>
              <p><strong>Contact Email:</strong> {getQuotationDetails(state.workOrders.find(wo => wo.id === state.selectedDN.work_order_id)).contact_email}</p>
              <p><strong>Contact Phone:</strong> {getQuotationDetails(state.workOrders.find(wo => wo.id === state.selectedDN.work_order_id)).contact_phone}</p>
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
                  <a href={state.selectedDN.signed_delivery_note} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                    View File
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
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Invoice Status</th>
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
                          <td className="border p-2 whitespace-nowrap">{item.invoice_status || 'Pending'}</td>
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
        isOpen={state.isUploadPOModalOpen}
        onClose={() => setState((prev) => ({
          ...prev,
          isUploadPOModalOpen: false,
          selectedPOForUpload: null,
          poUpload: { clientPoNumber: '', poFile: null, poStatus: 'not_available' },
          poUploadErrors: { clientPoNumber: '', poFile: '' },
        }))}
        title={`Upload PO Details for ${state.selectedPOForUpload?.series_number || 'N/A'}`}
      >
        <div className="space-y-4">
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={state.poUpload.poStatus === 'available'}
                onChange={() =>
                  setState((prev) => ({
                    ...prev,
                    poUpload: {
                      ...prev.poUpload,
                      poStatus: 'available',
                      clientPoNumber: prev.poUpload.clientPoNumber || '',
                      poFile: null,
                    },
                    poUploadErrors: { ...prev.poUploadErrors, clientPoNumber: '', poFile: '' },
                  }))
                }
                className="mr-2"
              />
              PO Available
            </label>
            <label className="flex items-center mt-2">
              <input
                type="checkbox"
                checked={state.poUpload.poStatus === 'not_available'}
                onChange={() =>
                  setState((prev) => ({
                    ...prev,
                    poUpload: {
                      ...prev.poUpload,
                      poStatus: 'not_available',
                      clientPoNumber: '',
                      poFile: null,
                    },
                    poUploadErrors: { ...prev.poUploadErrors, clientPoNumber: '', poFile: '' },
                  }))
                }
                className="mr-2"
              />
              Nil
            </label>
          </div>
          {state.poUpload.poStatus === 'available' && (
            <>
              <div>
                <InputField
                  label="Client PO Number"
                  type="text"
                  value={state.poUpload.clientPoNumber}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      poUpload: { ...prev.poUpload, clientPoNumber: e.target.value },
                      poUploadErrors: { ...prev.poUploadErrors, clientPoNumber: '' },
                    }))
                  }
                />
                {state.poUploadErrors.clientPoNumber && (
                  <p className="text-red-500 text-sm mt-1">{state.poUploadErrors.clientPoNumber}</p>
                )}
              </div>
              <div>
                <InputField
                  label="Upload PO File"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      poUpload: { ...prev.poUpload, poFile: e.target.files[0] },
                      poUploadErrors: { ...prev.poUploadErrors, poFile: '' },
                    }))
                  }
                />
                {state.poUploadErrors.poFile && (
                  <p className="text-red-500 text-sm mt-1">{state.poUploadErrors.poFile}</p>
                )}
              </div>
            </>
          )}
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => setState((prev) => ({
                ...prev,
                isUploadPOModalOpen: false,
                selectedPOForUpload: null,
                poUpload: { clientPoNumber: '', poFile: null, poStatus: 'not_available' },
                poUploadErrors: { clientPoNumber: '', poFile: '' },
              }))}
              disabled={isSubmitting}
              className={`px-3 py-1 rounded-md text-sm ${
                isSubmitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Cancel'}
            </Button>
            <Button
              onClick={handlePOUploadSubmit}
              disabled={isSubmitting || !hasPermission('pending_invoices', 'edit')}
              className={`px-3 py-1 rounded-md text-sm ${
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
        onClose={() => setState((prev) => ({
          ...prev,
          isUploadWOModalOpen: false,
          selectedWOForUpload: null,
          woUpload: { certificateFile: null },
          woUploadErrors: { certificateFile: '' },
        }))}
        title={`Upload Work Order Certificate for ${state.selectedWOForUpload?.wo_number || 'N/A'}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Certificate File</label>
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
            />
            {state.woUploadErrors.certificateFile && (
              <p className="text-red-500 text-sm mt-1">{state.woUploadErrors.certificateFile}</p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => setState((prev) => ({
                ...prev,
                isUploadWOModalOpen: false,
                selectedWOForUpload: null,
                woUpload: { certificateFile: null },
                woUploadErrors: { certificateFile: '' },
              }))}
              disabled={isSubmitting}
              className={`px-3 py-1 rounded-md text-sm ${
                isSubmitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Cancel'}
            </Button>
            <Button
              onClick={handleWOUploadSubmit}
              disabled={isSubmitting || !hasPermission('pending_invoices', 'edit')}
              className={`px-3 py-1 rounded-md text-sm ${
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
        onClose={() => setState((prev) => ({
          ...prev,
          isUploadDNModalOpen: false,
          selectedDNForUpload: null,
          dnUpload: { signedDeliveryNote: null },
          dnUploadErrors: { signedDeliveryNote: '' },
        }))}
        title={`Upload Signed Delivery Note for ${state.selectedDNForUpload?.dn_number || 'N/A'}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Signed Delivery Note</label>
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
            />
            {state.dnUploadErrors.signedDeliveryNote && (
              <p className="text-red-500 text-sm mt-1">{state.dnUploadErrors.signedDeliveryNote}</p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => setState((prev) => ({
                ...prev,
                isUploadDNModalOpen: false,
                selectedDNForUpload: null,
                dnUpload: { signedDeliveryNote: null },
                dnUploadErrors: { signedDeliveryNote: '' },
              }))}
              disabled={isSubmitting}
              className={`px-3 py-1 rounded-md text-sm ${
                isSubmitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Cancel'}
            </Button>
            <Button
              onClick={handleUploadDNSubmit}
              disabled={isSubmitting || !hasPermission('pending_invoices', 'edit')}
              className={`px-3 py-1 rounded-md text-sm ${
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
        onClose={() => setState((prev) => ({
          ...prev,
          isUploadInvoiceModalOpen: false,
          selectedWOForInvoiceUpload: null,
          selectedDNForInvoiceUpload: null,
          invoiceUpload: { invoiceFile: null },
          invoiceUploadErrors: { invoiceFile: '' },
          invoiceUploadType: '',
          isStatusModalOpen: false,
          selectedWorkOrderId: null,
          selectedDNId: null,
          newStatus: '',
          dueInDays: '',
          receivedDate: '',
        }))}
        title={`Upload ${state.invoiceUploadType} Invoice for ${state.selectedWOForInvoiceUpload?.wo_number || 'N/A'} - DN: ${state.selectedDNForInvoiceUpload?.dn_number || 'N/A'}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{state.invoiceUploadType} Invoice File</label>
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
                selectedDNForInvoiceUpload: null,
                invoiceUpload: { invoiceFile: null },
                invoiceUploadErrors: { invoiceFile: '' },
                invoiceUploadType: '',
                isStatusModalOpen: false,
                selectedWorkOrderId: null,
                selectedDNId: null,
                newStatus: '',
                dueInDays: '',
                receivedDate: '',
              }))}
              disabled={isSubmitting}
              className={`px-3 py-1 rounded-md text-sm ${
                isSubmitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Cancel'}
            </Button>
            <Button
              onClick={handleInvoiceUploadSubmit}
              disabled={isSubmitting || !hasPermission('pending_invoices', 'edit')}
              className={`px-3 py-1 rounded-md text-sm ${
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
        onClose={() => setState((prev) => ({
          ...prev,
          isStatusModalOpen: false,
          selectedWorkOrderId: null,
          selectedDNId: null,
          newStatus: '',
          dueInDays: '',
          receivedDate: '',
          invoiceUploadType: '',
        }))}
        title={`Update Invoice Status to ${state.newStatus || 'Unknown'}`}
      >
        <div className="space-y-4">
          {state.newStatus === 'raised' && (
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
          {state.newStatus === 'pending' && (
            <p className="text-sm text-gray-600">
              Setting status to Pending will clear any due dates or received dates.
            </p>
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
                invoiceUploadType: '',
              }))}
              disabled={isSubmitting}
              className={`px-3 py-1 rounded-md text-sm ${
                isSubmitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Cancel'}
            </Button>
            <Button
              onClick={handleStatusModalSubmit}
              disabled={isSubmitting || !hasPermission('pending_invoices', 'edit')}
              className={`px-3 py-1 rounded-md text-sm ${
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