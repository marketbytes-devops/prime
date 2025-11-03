import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../../helpers/apiClient';
import InputField from '../../components/InputField';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

const formatDate = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const calculateDueDate = (createdAt, dueInDays) => {
  if (!createdAt || !dueInDays) return { formattedDueDate: 'N/A', isOverdue: false };
  const createdDate = new Date(createdAt);
  const dueDate = new Date(createdDate);
  dueDate.setDate(createdDate.getDate() + parseInt(dueInDays));
  const formattedDueDate = formatDate(dueDate);
  const currentDate = new Date();
  const isOverdue = dueDate < currentDate;
  return { formattedDueDate, isOverdue };
};

const RaisedInvoices = () => {
  const [state, setState] = useState({
    workOrders: [],
    purchaseOrders: [],
    deliveryNotes: [],
    invoices: [],
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
    selectedInvoiceId: null,
    newStatus: '',
    receivedDate: '',
    isUploadInvoiceModalOpen: false,
    selectedWOForInvoiceUpload: null,
    selectedDNForInvoiceUpload: null,
    invoiceUpload: { finalInvoiceFile: null, processedCertificateFile: null },
    invoiceUploadErrors: { finalInvoiceFile: '', processedCertificateFile: '' },
    invoiceUploadType: '',
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
      const [woRes, poRes, dnRes, invoiceRes, techRes, itemsRes, unitsRes, quotationsRes, channelsRes] = await Promise.all([
        apiClient.get('work-orders/'),
        apiClient.get('purchase-orders/'),
        apiClient.get('delivery-notes/'),
        apiClient.get('invoices/'),
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

      const workOrders = woRes.data || [];
      const invoices = invoiceRes.data || [];

      const workOrderDeliveryPairs = [];
      const seenInvoiceIds = new Set();

      workOrders.forEach((workOrder) => {
        const relatedDNs = deliveryNotes.filter((dn) => dn.work_order_id === workOrder.id);
        relatedDNs.forEach((dn) => {
          const relatedInvoices = invoices.filter(
            (invoice) => invoice.delivery_note === dn.id && invoice.invoice_status === 'raised'
          );
          relatedInvoices.forEach((invoice) => {
            if (!seenInvoiceIds.has(invoice.id)) {
              seenInvoiceIds.add(invoice.id);
              workOrderDeliveryPairs.push({
                id: `${workOrder.id}-${dn.id}-${invoice.id}`,
                workOrder,
                deliveryNote: dn,
                invoice,
                workOrderId: workOrder.id,
                deliveryNoteId: dn.id,
                invoiceId: invoice.id,
              });
            }
          });
        });
      });

      setState((prev) => ({
        ...prev,
        workOrders,
        purchaseOrders: poRes.data || [],
        deliveryNotes,
        invoices,
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
      if (pair.invoice?.final_invoice_file) {
        window.open(pair.invoice.final_invoice_file, '_blank');
      } else {
        toast.error('No final invoice file available.');
      }
    }
  };

  const handleUploadInvoiceFile = (pair, fileType) => {
    if (!pair.deliveryNote) {
      toast.error('Delivery note not found.');
      return;
    }
    
    setState((prev) => ({
      ...prev,
      isUploadInvoiceModalOpen: true,
      selectedWOForInvoiceUpload: pair.workOrder,
      selectedDNForInvoiceUpload: pair.deliveryNote,
      selectedInvoiceId: pair.invoiceId,
      invoiceUpload: { finalInvoiceFile: null, processedCertificateFile: null },
      invoiceUploadErrors: { finalInvoiceFile: '', processedCertificateFile: '' },
      invoiceUploadType: fileType,
      newStatus: 'raised',
    }));
  };

  const handleUpdateStatus = (pair, newStatus) => {
    if (!pair.invoice) {
      toast.error('No invoice found.');
      return;
    }

    if (pair.invoice.invoice_status === 'processed' && newStatus !== 'pending') {
      toast.warn(
        'The invoice status is already "Processed" and cannot be changed except to "Pending."',
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

    if (newStatus === 'processed') {
      // For processed status, show date modal first
      setState((prev) => ({
        ...prev,
        isStatusModalOpen: true,
        selectedWorkOrderId: pair.workOrderId,
        selectedDNId: pair.deliveryNoteId,
        selectedInvoiceId: pair.invoiceId,
        newStatus,
        receivedDate: '',
        invoiceUploadType: 'Processed',
      }));
    } else {
      // For other statuses, update directly
      confirmStatusUpdate(pair.invoiceId, newStatus, '');
    }
  };



  const handleInvoiceFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('File size exceeds 5 MB limit. Please upload a smaller file.');
        e.target.value = '';
        e.target.focus();
        setState((prev) => ({
          ...prev,
          invoiceUpload: {
            ...prev.invoiceUpload,
            finalInvoiceFile: state.invoiceUploadType === 'Final' ? null : prev.invoiceUpload.finalInvoiceFile,
            processedCertificateFile: state.invoiceUploadType === 'Processed' ? null : prev.invoiceUpload.processedCertificateFile,
          },
        }));
        return;
      }
      setState((prev) => ({
        ...prev,
        invoiceUpload: {
          ...prev.invoiceUpload,
          finalInvoiceFile: state.invoiceUploadType === 'Final' ? file : prev.invoiceUpload.finalInvoiceFile,
          processedCertificateFile: state.invoiceUploadType === 'Processed' ? file : prev.invoiceUpload.processedCertificateFile,
        },
        invoiceUploadErrors: {
          ...prev.invoiceUploadErrors,
          finalInvoiceFile: state.invoiceUploadType === 'Final' ? '' : prev.invoiceUploadErrors.finalInvoiceFile,
          processedCertificateFile: state.invoiceUploadType === 'Processed' ? '' : prev.invoiceUploadErrors.processedCertificateFile,
        },
      }));
    }
  };


  const handleInvoiceUploadSubmit = async () => {
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      
      // Use invoiceUploadType instead of newStatus to determine which file to upload
      if (state.invoiceUploadType === 'Final' && state.invoiceUpload.finalInvoiceFile) {
        formData.append('final_invoice_file', state.invoiceUpload.finalInvoiceFile);
        
        if (state.selectedInvoiceId) {
          await apiClient.patch(
            `/invoices/${state.selectedInvoiceId}/`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
          );
          toast.success('Invoice file uploaded successfully.');
        }
      } else if (state.invoiceUploadType === 'Processed' && state.invoiceUpload.processedCertificateFile) {
        formData.append('processed_certificate_file', state.invoiceUpload.processedCertificateFile);
        
        if (state.selectedInvoiceId) {
          await apiClient.patch(
            `/invoices/${state.selectedInvoiceId}/`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
          );
          toast.success('Certificate file uploaded successfully.');
        }
      } else {
        // No file provided - just close modal
        toast.info('No file uploaded. You can upload the file later using the + button.');
      }

      // Close modal and refresh
      setState((prev) => ({
        ...prev,
        isUploadInvoiceModalOpen: false,
        selectedWOForInvoiceUpload: null,
        selectedDNForInvoiceUpload: null,
        selectedInvoiceId: null,
        invoiceUpload: { finalInvoiceFile: null, processedCertificateFile: null },
        invoiceUploadErrors: { finalInvoiceFile: '', processedCertificateFile: '' },
        invoiceUploadType: '',
        newStatus: '',
        dueInDays: '',
        receivedDate: '',
      }));
      await fetchData();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file.');
    } finally {
      setIsSubmitting(false);
    }
  };


  const confirmStatusUpdate = async (invoiceId, newStatus, receivedDate) => {
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('invoice_status', newStatus);
      if (newStatus === 'processed' && receivedDate) {
        formData.append('received_date', receivedDate);
      }
      formData.append('delivery_note_id', state.selectedDNId);

      await apiClient.patch(
        `/invoices/${invoiceId}/`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      toast.success('Invoice status updated successfully.');

      // If status is processed, open slip upload modal
      if (newStatus === 'processed') {
        const workOrder = state.workOrders.find(wo => wo.id === state.selectedWorkOrderId);
        const deliveryNote = state.deliveryNotes.find(dn => dn.id === state.selectedDNId);
        
        setState((prev) => ({
          ...prev,
          isStatusModalOpen: false,
          isUploadInvoiceModalOpen: true,
          selectedWOForInvoiceUpload: workOrder,
          selectedDNForInvoiceUpload: deliveryNote,
          selectedInvoiceId: invoiceId,
          invoiceUpload: { finalInvoiceFile: null, processedCertificateFile: null },
          invoiceUploadErrors: { finalInvoiceFile: '', processedCertificateFile: '' },
          invoiceUploadType: 'Processed',
          newStatus: 'processed',
        }));
      } else {
        // For other statuses, just refresh data
        await fetchData();
        setState((prev) => ({
          ...prev,
          isStatusModalOpen: false,
          selectedWorkOrderId: null,
          selectedDNId: null,
          selectedInvoiceId: null,
          newStatus: '',
          receivedDate: '',
          invoiceUploadType: '',
        }));
      }
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast.error('Failed to update invoice status.');
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleStatusModalSubmit = () => {
    const { selectedInvoiceId, newStatus, receivedDate } = state;
    
    if (newStatus === 'processed' && !receivedDate) {
      toast.error('Please select a received date.');
      return;
    }
    
    confirmStatusUpdate(selectedInvoiceId, newStatus, receivedDate);
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

  const getInvoiceItems = (deliveryNote) => {
    if (!deliveryNote || !deliveryNote.items || deliveryNote.items.length === 0) return 'N/A';
    return (
      <div className="space-y-1 max-w-xs">
        {deliveryNote.items.map((item, itemIndex) => (
          <div key={item.id} className="text-sm">
            {getItemName(item.item)} {item.range && `(${item.range})`}
          </div>
        ))}
      </div>
    );
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
      <h1 className="text-2xl font-bold mb-4">Raised Invoices</h1>
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
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">PO Number</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">WO Number</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">DN Number</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Items</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Created Date</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Due Date</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Assigned To</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">View Documents</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Invoice Status</th>
              </tr>
            </thead>
            <tbody>
              {currentPairs.length === 0 ? (
                <tr>
                  <td colSpan="12" className="border p-2 text-center text-gray-500">
                    No raised invoices found.
                  </td>
                </tr>
              ) : (
                currentPairs.map((pair, index) => {
                  const { formattedDueDate, isOverdue } = calculateDueDate(
                    pair.invoice?.created_at,
                    pair.invoice?.due_in_days
                  );
                  return (
                    <tr key={pair.id} className="border hover:bg-gray-50">
                      <td className="border p-2 whitespace-nowrap">{startIndex + index + 1}</td>
                      <td className="border p-2 whitespace-nowrap">{getQuotationDetails(pair.workOrder).company_name}</td>
                      <td className="border p-2 whitespace-nowrap">{getQuotationDetails(pair.workOrder).series_number}</td>
                      <td className="border p-2 whitespace-nowrap">{getQuotationDetails(pair.workOrder).po_series_number}</td>
                      <td className="border p-2 whitespace-nowrap">{pair.workOrder.wo_number || 'N/A'}</td>
                      <td className="border p-2 whitespace-nowrap">{getDNSeriesNumber(pair.deliveryNote)}</td>
                      <td className="border p-2 whitespace-nowrap">{getInvoiceItems(pair.deliveryNote)}</td>
                      <td className="border p-2 whitespace-nowrap">
                        {pair.workOrder.created_at
                          ? formatDate(pair.workOrder.created_at)
                          : 'N/A'}
                      </td>
                      <td className={`border p-2 whitespace-nowrap ${isOverdue ? 'text-red-600' : ''}`}>
                        {formattedDueDate}
                      </td>
                      <td className="border p-2 whitespace-nowrap">{getAssignedTechnicians(pair.workOrder.items)}</td>
                      <td className="border p-2 whitespace-nowrap">


<td className="border p-2 whitespace-nowrap">
<div className="flex items-center gap-1">
  {/* View Invoice Button */}
  <Button
    onClick={() => handleViewDocument(pair, 'invoice')}
    disabled={
      isSubmitting ||
      !hasPermission('raised_invoices', 'view') ||
      !pair.invoice?.final_invoice_file
    }
    className={`px-3 py-1 rounded-md text-sm whitespace-nowrap ${
      isSubmitting ||
      !hasPermission('raised_invoices', 'view') ||
      !pair.invoice?.final_invoice_file
        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
        : 'bg-indigo-600 text-white hover:bg-indigo-700'
    }`}
  >
    {isSubmitting ? 'Submitting...' :
     pair.invoice?.final_invoice_file ? 'View Invoice' : 'No Invoice'}
  </Button>

  {/* Single Plus button for uploading invoice file - ALWAYS show when status is raised */}
  {pair.invoice?.invoice_status === 'raised' && (
    <Button
      onClick={() => handleUploadInvoiceFile(pair, 'Final')}
      disabled={isSubmitting || !hasPermission('raised_invoices', 'edit')}
      className="px-2 py-1 rounded-md text-sm bg-green-600 text-white hover:bg-green-700"
      title={pair.invoice?.final_invoice_file ? "Replace Invoice File" : "Upload Invoice File"}
    >
      +
    </Button>
  )}
</div>
</td>
             </td>
                      <td className="border p-2 whitespace-nowrap">
                        {pair.deliveryNote && pair.deliveryNote.items && pair.deliveryNote.items.length > 0 ? (
                          <select
                            onChange={(e) => {
                              const newStatus = e.target.value;
                              if (newStatus && newStatus !== pair.invoice?.invoice_status) {
                                handleUpdateStatus(pair, newStatus);
                              }
                            }}
                            disabled={isSubmitting || !hasPermission('raised_invoices', 'edit') || pair.invoice?.invoice_status === 'processed'}
                            value={pair.invoice?.invoice_status || 'raised'}
                            className={`min-w-[150px] px-3 py-2 rounded-md text-sm border ${
                              isSubmitting || !hasPermission('raised_invoices', 'edit') || pair.invoice?.invoice_status === 'processed'
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : pair.invoice?.invoice_status === 'pending'
                                ? 'bg-yellow-50 border-yellow-300 text-yellow-800 hover:bg-yellow-100'
                                : pair.invoice?.invoice_status === 'raised'
                                ? 'bg-blue-50 border-blue-300 text-blue-800 hover:bg-blue-100'
                                : 'bg-green-50 border-green-300 text-green-800 hover:bg-green-100'
                            }`}
                          >
                            <option value="raised">Raised</option>
                            <option value="pending">Pending</option>
                            <option value="processed">Processed</option>
                          </select>
                        ) : (
                          <span className="text-sm text-gray-500">Fill all the details</span>
                        )}
                      </td>
                    </tr>
                  );
                })
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

      {/* PO Modal */}
      <Modal
        isOpen={state.isPOModalOpen}
        onClose={() => setState((prev) => ({ ...prev, isPOModalOpen: false, selectedPO: null }))}
        title={`Purchase Order Details - ${state.selectedPO?.series_number || 'N/A'}`}
      >
        {state.selectedPO && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-black">Company Details</h3>
              <p><strong>Series Number:</strong> {getQuotationDetails(state.workOrders.find((wo) => wo.purchase_order === state.selectedPO.id)).series_number}</p>
              <p><strong>Company Name:</strong> {getQuotationDetails(state.workOrders.find((wo) => wo.purchase_order === state.selectedPO.id)).company_name}</p>
              <p><strong>Company Address:</strong> {getQuotationDetails(state.workOrders.find((wo) => wo.purchase_order === state.selectedPO.id)).company_address}</p>
              <p><strong>Company Phone:</strong> {getQuotationDetails(state.workOrders.find((wo) => wo.purchase_order === state.selectedPO.id)).company_phone}</p>
              <p><strong>Company Email:</strong> {getQuotationDetails(state.workOrders.find((wo) => wo.purchase_order === state.selectedPO.id)).company_email}</p>
              <p><strong>Channel:</strong> {getQuotationDetails(state.workOrders.find((wo) => wo.purchase_order === state.selectedPO.id)).channel}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-black">Contact Details</h3>
              <p><strong>Contact Name:</strong> {getQuotationDetails(state.workOrders.find((wo) => wo.purchase_order === state.selectedPO.id)).contact_name}</p>
              <p><strong>Contact Email:</strong> {getQuotationDetails(state.workOrders.find((wo) => wo.purchase_order === state.selectedPO.id)).contact_email}</p>
              <p><strong>Contact Phone:</strong> {getQuotationDetails(state.workOrders.find((wo) => wo.purchase_order === state.selectedPO.id)).contact_phone}</p>
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
              <p><strong>Assigned Sales Person:</strong> {getQuotationDetails(state.workOrders.find((wo) => wo.purchase_order === state.selectedPO.id)).assigned_sales_person}</p>
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

      {/* WO Modal */}
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

      {/* DN Modal */}
      <Modal
        isOpen={state.isDNModalOpen}
        onClose={() => setState((prev) => ({ ...prev, isDNModalOpen: false, selectedDN: null }))}
        title={`Delivery Note Details - ${state.selectedDN?.dn_number || 'N/A'}`}
      >
        {state.selectedDN && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-black">Company Details</h3>
              <p><strong>Series Number:</strong> {getQuotationDetails(state.workOrders.find((wo) => wo.id === state.selectedDN.work_order_id)).series_number}</p>
              <p><strong>Company Name:</strong> {getQuotationDetails(state.workOrders.find((wo) => wo.id === state.selectedDN.work_order_id)).company_name}</p>
              <p><strong>Company Address:</strong> {getQuotationDetails(state.workOrders.find((wo) => wo.id === state.selectedDN.work_order_id)).company_address}</p>
              <p><strong>Company Phone:</strong> {getQuotationDetails(state.workOrders.find((wo) => wo.id === state.selectedDN.work_order_id)).company_phone}</p>
              <p><strong>Company Email:</strong> {getQuotationDetails(state.workOrders.find((wo) => wo.id === state.selectedDN.work_order_id)).company_email}</p>
              <p><strong>Channel:</strong> {getQuotationDetails(state.workOrders.find((wo) => wo.id === state.selectedDN.work_order_id)).channel}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-black">Contact Details</h3>
              <p><strong>Contact Name:</strong> {getQuotationDetails(state.workOrders.find((wo) => wo.id === state.selectedDN.work_order_id)).contact_name}</p>
              <p><strong>Contact Email:</strong> {getQuotationDetails(state.workOrders.find((wo) => wo.id === state.selectedDN.work_order_id)).contact_email}</p>
              <p><strong>Contact Phone:</strong> {getQuotationDetails(state.workOrders.find((wo) => wo.id === state.selectedDN.work_order_id)).contact_phone}</p>
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
                      {state.selectedDN.items.map((item) => {
                        const relatedInvoice = state.invoices.find(
                          (invoice) => invoice.delivery_note === state.selectedDN.id
                        );
                        return (
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
                            <td className="border p-2 whitespace-nowrap">
                              {relatedInvoice ? relatedInvoice.invoice_status : 'Pending'}
                            </td>
                          </tr>
                        );
                      })}
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

      {/* Status Modal */}
      <Modal
        isOpen={state.isStatusModalOpen}
        onClose={() => setState((prev) => ({
          ...prev,
          isStatusModalOpen: false,
          selectedWorkOrderId: null,
          selectedDNId: null,
          selectedInvoiceId: null,
          newStatus: '',
          receivedDate: '',
          invoiceUploadType: '',
        }))}
        title={`Update Invoice Status to ${state.newStatus || 'Unknown'}`}
      >
        <div className="space-y-4">
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
              Setting status to Pending will clear any invoice files or received dates.
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => setState((prev) => ({
                ...prev,
                isStatusModalOpen: false,
                selectedWorkOrderId: null,
                selectedDNId: null,
                selectedInvoiceId: null,
                newStatus: '',
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
              disabled={isSubmitting || !hasPermission('raised_invoices', 'edit')}
              className={`px-3 py-1 rounded-md text-sm ${
                isSubmitting || !hasPermission('raised_invoices', 'edit')
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </div>
      </Modal>


      {/* Invoice Upload Modal */}
      <Modal
        isOpen={state.isUploadInvoiceModalOpen}
        onClose={() => {
          setState((prev) => ({
            ...prev,
            isUploadInvoiceModalOpen: false,
            selectedWOForInvoiceUpload: null,
            selectedDNForInvoiceUpload: null,
            selectedInvoiceId: null,
            invoiceUpload: { finalInvoiceFile: null, processedCertificateFile: null },
            invoiceUploadErrors: { finalInvoiceFile: '', processedCertificateFile: '' },
            invoiceUploadType: '',
          }));
          fetchData();
        }}
        title={`Upload ${state.invoiceUploadType} Invoice for ${state.selectedWOForInvoiceUpload?.wo_number || 'N/A'} - DN: ${state.selectedDNForInvoiceUpload?.dn_number || 'N/A'}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {state.invoiceUploadType} {state.invoiceUploadType === 'Final' ? 'Invoice' : 'Certificate'} File (Optional)
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleInvoiceFileChange(e)}
              className="w-full p-2 border rounded focus:outline-indigo-500"
            />
            {state.invoiceUploadErrors.finalInvoiceFile && state.invoiceUploadType === 'Final' && (
              <p className="text-red-500 text-sm mt-1">{state.invoiceUploadErrors.finalInvoiceFile}</p>
            )}
            {state.invoiceUploadErrors.processedCertificateFile && state.invoiceUploadType === 'Processed' && (
              <p className="text-red-500 text-sm mt-1">{state.invoiceUploadErrors.processedCertificateFile}</p>
            )}
            <p className="text-sm text-gray-600 mt-1">
              File upload is optional. You can upload it later using the + button.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                setState((prev) => ({
                  ...prev,
                  isUploadInvoiceModalOpen: false,
                  selectedWOForInvoiceUpload: null,
                  selectedDNForInvoiceUpload: null,
                  selectedInvoiceId: null,
                  invoiceUpload: { finalInvoiceFile: null, processedCertificateFile: null },
                  invoiceUploadErrors: { finalInvoiceFile: '', processedCertificateFile: '' },
                  invoiceUploadType: '',
                }));
                fetchData();
              }}
              disabled={isSubmitting}
              className={`px-3 py-1 rounded-md text-sm ${
                isSubmitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Skip Upload'}
            </Button>
            <Button
              onClick={handleInvoiceUploadSubmit}
              disabled={isSubmitting || !hasPermission('raised_invoices', 'edit')}
              className={`px-3 py-1 rounded-md text-sm ${
                isSubmitting || !hasPermission('raised_invoices', 'edit')
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Upload File'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RaisedInvoices;