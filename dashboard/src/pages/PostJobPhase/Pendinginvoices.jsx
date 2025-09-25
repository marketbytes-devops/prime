import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../utils/apiClient';
import Button from '../components/Button';
import Modal from '../components/Modal';
import PendingInvoicesViewModal from '../components/PendingInvoicesViewModal';
import { hasPermission } from '../utils/auth';

const PendingInvoices = () => {
  const [state, setState] = useState({
    workOrders: [],
    purchaseOrders: [],
    deliveryNotes: [],
    technicians: [],
    itemsList: [],
    units: [],
    quotations: [],
    channels: [],
    workOrderDeliveryPairs: [],
    searchTerm: '',
    sortBy: 'created_at',
    currentPage: 1,
    itemsPerPage: 20,
    isViewModalOpen: false,
    selectedPair: null,
    isUploadPOModalOpen: false,
    selectedWOForPOUpload: null,
    poUpload: { poNumber: '', poFile: null },
    poUploadErrors: { poNumber: '', poFile: '' },
    isUploadDNModalOpen: false,
    selectedDNForUpload: null,
    signedDeliveryNote: null,
    isStatusModalOpen: false,
    selectedWorkOrderId: null,
    selectedDNId: null,
    newStatus: '',
    dueInDays: '',
    receivedDate: '',
    originalInvoiceStatus: '',
    invoiceUploadType: '',
    isUploadInvoiceModalOpen: false,
    selectedWOForInvoiceUpload: null,
    invoiceUpload: { invoiceFile: null },
    invoiceUploadErrors: { invoiceFile: '' },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

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

      const workOrders = woRes.data.map(wo => ({
        ...wo,
        invoice_status: wo.invoice_status ? wo.invoice_status.toLowerCase() : 'pending',
      })) || [];

      const workOrderDeliveryPairs = [];
      
      workOrders.forEach(workOrder => {
        const relatedDNs = deliveryNotes.filter(dn => dn.work_order_id === workOrder.id);
        
        if (relatedDNs.length > 0) {
          relatedDNs.forEach(dn => {
            workOrderDeliveryPairs.push({
              id: `${workOrder.id}-${dn.id}`,
              workOrder: workOrder,
              deliveryNote: dn,
              workOrderId: workOrder.id,
              deliveryNoteId: dn.id,
            });
          });
        } else {
          workOrderDeliveryPairs.push({
            id: `${workOrder.id}-no-dn`,
            workOrder: workOrder,
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

  const isPOComplete = (workOrder) => {
    const poId = workOrder.purchase_order;
    const purchaseOrder = state.purchaseOrders.find((po) => po.id === poId);
    return purchaseOrder && (purchaseOrder.client_po_number || purchaseOrder.po_file);
  };

  const isPOEmpty = (workOrder) => {
    const poId = workOrder.purchase_order;
    const purchaseOrder = state.purchaseOrders.find((po) => po.id === poId);
    return !purchaseOrder || (!purchaseOrder.client_po_number && !purchaseOrder.po_file);
  };

  const isDUTComplete = (workOrder) => {
    return workOrder.items.every((item) => item.dut_status === 'completed');
  };

  const isDNReadyForUpload = (deliveryNote) => {
    return deliveryNote && !deliveryNote.signed_delivery_note;
  };

  const isDNComplete = (deliveryNote) => {
    return deliveryNote && deliveryNote.signed_delivery_note;
  };

  const canUploadInvoice = (pair) => {
    return isPOComplete(pair.workOrder) && isDUTComplete(pair.workOrder) && (pair.deliveryNote ? isDNComplete(pair.deliveryNote) : true);
  };

  const getQuotationDetails = (workOrder) => {
    if (!workOrder) return { company_name: 'N/A', series_number: 'N/A' };
    const quotation = state.quotations.find((q) => q.id === workOrder.quotation);
    return {
      company_name: quotation?.company_name || 'N/A',
      series_number: quotation?.series_number || 'N/A',
    };
  };

  const getDNSeriesNumber = (deliveryNote) => {
    return deliveryNote ? deliveryNote.dn_number : 'N/A';
  };

  const getAssignedTechnicians = (items) => {
    const technicianIds = new Set(items.flatMap((item) => item.assigned_technicians || []));
    const technicians = state.technicians
      .filter((tech) => technicianIds.has(tech.id))
      .map((tech) => tech.name)
      .join(', ');
    return technicians || 'N/A';
  };

  const handleViewDocument = async (pair, docType) => {
    try {
      let url;
      if (docType === 'po') {
        const poId = pair.workOrder.purchase_order;
        const purchaseOrder = state.purchaseOrders.find((po) => po.id === poId);
        if (!purchaseOrder?.po_file) {
          toast.error('No PO file available.');
          return;
        }
        url = purchaseOrder.po_file;
      } else if (docType === 'wo') {
        url = pair.workOrder.wo_file;
      } else if (docType === 'dn') {
        if (!pair.deliveryNote?.signed_delivery_note) {
          toast.error('No signed delivery note available.');
          return;
        }
        url = pair.deliveryNote.signed_delivery_note;
      } else if (docType === 'invoice') {
        if (!pair.workOrder.invoice_file) {
          toast.error('No invoice file available.');
          return;
        }
        url = pair.workOrder.invoice_file;
      }

      if (url) {
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error(`Error viewing ${docType}:`, error);
      toast.error(`Failed to view ${docType}.`);
    }
  };

  const handleUploadPO = (pair) => {
    setState((prev) => ({
      ...prev,
      isUploadPOModalOpen: true,
      selectedWOForPOUpload: pair.workOrder,
      poUpload: { poNumber: '', poFile: null },
      poUploadErrors: { poNumber: '', poFile: '' },
    }));
  };

  const handleUploadPOConfirm = async () => {
    const { poNumber, poFile } = state.poUpload;
    if (!poNumber) {
      setState((prev) => ({
        ...prev,
        poUploadErrors: { ...prev.poUploadErrors, poNumber: 'PO number is required.' },
      }));
      return;
    }
    if (!poFile) {
      setState((prev) => ({
        ...prev,
        poUploadErrors: { ...prev.poUploadErrors, poFile: 'PO file is required.' },
      }));
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('client_po_number', poNumber);
      formData.append('po_file', poFile);

      await apiClient.patch(`/purchase-orders/${state.selectedWOForPOUpload.purchase_order}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('PO uploaded successfully.');
      setState((prev) => ({
        ...prev,
        isUploadPOModalOpen: false,
        selectedWOForPOUpload: null,
        poUpload: { poNumber: '', poFile: null },
        poUploadErrors: { poNumber: '', poFile: '' },
      }));
      await fetchData();
    } catch (error) {
      console.error('Error uploading PO:', error);
      toast.error('Failed to upload PO.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadDN = (pair) => {
    setState((prev) => ({
      ...prev,
      isUploadDNModalOpen: true,
      selectedDNForUpload: pair.deliveryNote,
      signedDeliveryNote: null,
    }));
  };

  const handleUploadDNConfirm = async () => {
    if (!state.signedDeliveryNote) {
      toast.error('Please upload a signed delivery note.');
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('signed_delivery_note', state.signedDeliveryNote);
      await apiClient.post(`delivery-notes/${state.selectedDNForUpload.id}/upload-signed-note/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Signed delivery note uploaded successfully.');
      setState((prev) => ({
        ...prev,
        isUploadDNModalOpen: false,
        selectedDNForUpload: null,
        signedDeliveryNote: null,
      }));
      await fetchData();
    } catch (error) {
      console.error('Error uploading signed delivery note:', error);
      toast.error('Failed to upload signed delivery note.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = (pair, newStatus) => {
    const workOrder = pair.workOrder;
    if (workOrder.invoice_status === 'processed') {
      toast.error('Cannot change status from "Processed" to another status.');
      return;
    }
    if (workOrder.invoice_status === 'raised' && newStatus === 'raised') {
      toast.warn(
        'The invoice status is already set to "Raised."',
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

    if (newStatus === 'raised') {
      confirmStatusUpdate(pair.workOrderId, newStatus, null, null, pair.deliveryNoteId);
    } else {
      setState((prev) => ({
        ...prev,
        isStatusModalOpen: true,
        selectedWorkOrderId: workOrder.id,
        selectedDNId: pair.deliveryNoteId,
        newStatus,
        dueInDays: '',
        receivedDate: '',
        originalInvoiceStatus: workOrder?.invoice_status || 'pending',
        invoiceUploadType: newStatus === 'processed' ? 'Final' : '',
      }));
    }
  };

  const handleStatusModalSubmit = () => {
    const { selectedWorkOrderId, selectedDNId, newStatus, receivedDate } = state;
    const workOrder = state.workOrders.find((wo) => wo.id === selectedWorkOrderId);

    if (workOrder.invoice_status === 'processed') {
      toast.error('Cannot change status from "Processed" to another status.');
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
        selectedWOForInvoiceUpload: workOrder,
        invoiceUpload: { invoiceFile: null },
        invoiceUploadErrors: { invoiceFile: '' },
      }));
    } else {
      confirmStatusUpdate(selectedWorkOrderId, newStatus, null, receivedDate, selectedDNId);
    }
  };

  const confirmStatusUpdate = async (workOrderId, newStatus, dueInDays, receivedDate, deliveryNoteId) => {
    try {
      setIsSubmitting(true);
      const payload = { invoice_status: newStatus };
      if (newStatus === 'raised' && dueInDays) {
        payload.due_in_days = parseInt(dueInDays);
      } else if (newStatus === 'processed' && receivedDate) {
        payload.received_date = receivedDate;
      }
      if (deliveryNoteId) {
        payload.delivery_note_id = deliveryNoteId;
      }

      await apiClient.post(`work-orders/${workOrderId}/update-invoice-status/`, payload);
      toast.success('Work order invoice status updated successfully.');
      setState((prev) => ({
        ...prev,
        isStatusModalOpen: false,
        selectedWorkOrderId: null,
        selectedDNId: null,
        newStatus: '',
        dueInDays: '',
        receivedDate: '',
        originalInvoiceStatus: '',
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

  const validateInvoiceUpload = () => {
    let isValid = true;
    const errors = { invoiceFile: '' };
    if (!state.invoiceUpload.invoiceFile) {
      errors.invoiceFile = 'Invoice file is required.';
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
      if (state.newStatus === 'raised' && state.dueInDays) {
        payload.due_in_days = parseInt(state.dueInDays);
      } else if (state.newStatus === 'processed' && state.receivedDate) {
        payload.received_date = state.receivedDate;
      }
      if (state.selectedDNId) {
        payload.delivery_note_id = state.selectedDNId;
      }

      await apiClient.post(`work-orders/${state.selectedWorkOrderId}/update-invoice-status/`, payload);

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

  const filteredPairs = state.workOrderDeliveryPairs
    .filter((pair) =>
      getQuotationDetails(pair.workOrder).company_name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      getQuotationDetails(pair.workOrder).series_number.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      pair.workOrder.wo_number?.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      getDNSeriesNumber(pair.deliveryNote).toLowerCase().includes(state.searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (state.sortBy === 'created_at') {
        return new Date(b.workOrder.created_at) - new Date(a.workOrder.created_at);
      }
      return getQuotationDetails(a.workOrder)[state.sortBy].localeCompare(getQuotationDetails(b.workOrder)[state.sortBy]);
    });

  const totalPages = Math.ceil(filteredPairs.length / state.itemsPerPage);
  const startIndex = (state.currentPage - 1) * state.itemsPerPage;
  const currentPairs = filteredPairs.slice(startIndex, startIndex + state.itemsPerPage);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-black">Pending Invoices</h1>
      <div className="mb-4 flex justify-between items-center">
        <input
          type="text"
          placeholder="Search by company name, quotation number, WO number, or DN number"
          value={state.searchTerm}
          onChange={(e) => setState((prev) => ({ ...prev, searchTerm: e.target.value }))}
          className="p-2 border rounded w-1/3 focus:outline-indigo-500"
        />
        <select
          value={state.sortBy}
          onChange={(e) => setState((prev) => ({ ...prev, sortBy: e.target.value }))}
          className="p-2 border rounded focus:outline-indigo-500"
        >
          <option value="created_at">Sort by Created Date</option>
          <option value="company_name">Sort by Company Name</option>
          <option value="series_number">Sort by Quotation Number</option>
        </select>
      </div>

      <table className="w-full border-collapse bg-white shadow-md rounded-lg">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left text-sm font-semibold text-gray-700">S.No</th>
            <th className="border p-2 text-left text-sm font-semibold text-gray-700">Company Name</th>
            <th className="border p-2 text-left text-sm font-semibold text-gray-700">Quotation Number</th>
            <th className="border p-2 text-left text-sm font-semibold text-gray-700">WO Number</th>
            <th className="border p-2 text-left text-sm font-semibold text-gray-700">DN Number</th>
            <th className="border p-2 text-left text-sm font-semibold text-gray-700">Created Date</th>
            <th className="border p-2 text-left text-sm font-semibold text-gray-700">Assigned Technicians</th>
            <th className="border p-2 text-left text-sm font-semibold text-gray-700">Actions</th>
            <th className="border p-2 text-left text-sm font-semibold text-gray-700">Invoice Status</th>
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
                <td className="border p-2 whitespace-nowrap">{startIndex + index + 1}</td>
                <td className="border p-2 whitespace-nowrap">{getQuotationDetails(pair.workOrder).company_name}</td>
                <td className="border p-2 whitespace-nowrap">{getQuotationDetails(pair.workOrder).series_number}</td>
                <td className="border p-2 whitespace-nowrap">{pair.workOrder.wo_number || 'N/A'}</td>
                <td className="border p-2 whitespace-nowrap">{getDNSeriesNumber(pair.deliveryNote)}</td>
                <td className="border p-2 whitespace-nowrap">{new Date(pair.workOrder.created_at).toLocaleDateString()}</td>
                <td className="border p-2 whitespace-nowrap">{getAssignedTechnicians(pair.workOrder.items)}</td>
                <td className="border p-2 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => (isPOEmpty(pair.workOrder) ? handleUploadPO(pair) : handleViewDocument(pair, 'po'))}
                      disabled={isSubmitting}
                      className={`px-3 py-1 rounded-md text-sm whitespace-nowrap ${
                        isSubmitting
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
                      disabled={isSubmitting}
                      className={`px-3 py-1 rounded-md text-sm whitespace-nowrap ${
                        isSubmitting
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {isSubmitting ? 'Submitting...' : 'View WO'}
                    </Button>
                    <Button
                      onClick={() => (isDNReadyForUpload(pair.deliveryNote) ? handleUploadDN(pair) : handleViewDocument(pair, 'dn'))}
                      disabled={isSubmitting || !pair.deliveryNote}
                      className={`px-3 py-1 rounded-md text-sm whitespace-nowrap ${
                        isSubmitting || !pair.deliveryNote
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
                      disabled={isSubmitting || !pair.workOrder.invoice_file}
                      className={`px-3 py-1 rounded-md text-sm whitespace-nowrap ${
                        isSubmitting || !pair.workOrder.invoice_file
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {isSubmitting ? 'Submitting...' : pair.workOrder.invoice_file ? 'View Invoice' : 'No Invoice'}
                    </Button>
                  </div>
                </td>
                <td className="border p-2 whitespace-nowrap">
                  <select
                    value={pair.workOrder.invoice_status || 'pending'}
                    onChange={(e) => handleUpdateStatus(pair, e.target.value)}
                    disabled={isSubmitting}
                    className={`w-full p-2 border rounded focus:outline-indigo-500 text-sm ${
                      isSubmitting ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="pending">Pending</option>
                    <option value="raised">Raised</option>
                    <option value="processed">Processed</option>
                  </select>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="mt-4 flex justify-between items-center">
        <div>
          Showing {startIndex + 1} to {Math.min(startIndex + state.itemsPerPage, filteredPairs.length)} of{' '}
          {filteredPairs.length} entries
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setState((prev) => ({ ...prev, currentPage: prev.currentPage - 1 }))}
            disabled={state.currentPage === 1}
            className={`px-3 py-1 rounded-md text-sm ${
              state.currentPage === 1 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Previous
          </Button>
          <Button
            onClick={() => setState((prev) => ({ ...prev, currentPage: prev.currentPage + 1 }))}
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
      </div>

      {state.isViewModalOpen && (
        <PendingInvoicesViewModal
          pair={state.selectedPair}
          workOrders={state.workOrders}
          purchaseOrders={state.purchaseOrders}
          deliveryNotes={state.deliveryNotes}
          quotations={state.quotations}
          channels={state.channels}
          itemsList={state.itemsList}
          units={state.units}
          onClose={() => setState((prev) => ({ ...prev, isViewModalOpen: false, selectedPair: null }))}
        />
      )}

      <Modal
        isOpen={state.isUploadPOModalOpen}
        onClose={() =>
          setState((prev) => ({
            ...prev,
            isUploadPOModalOpen: false,
            selectedWOForPOUpload: null,
            poUpload: { poNumber: '', poFile: null },
            poUploadErrors: { poNumber: '', poFile: '' },
          }))
        }
        title="Upload Purchase Order"
      >
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-black">Upload PO</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">PO Number</label>
            <input
              type="text"
              value={state.poUpload.poNumber}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  poUpload: { ...prev.poUpload, poNumber: e.target.value },
                  poUploadErrors: { ...prev.poUploadErrors, poNumber: '' },
                }))
              }
              className="w-full p-2 border rounded focus:outline-indigo-500"
              disabled={isSubmitting}
            />
            {state.poUploadErrors.poNumber && (
              <p className="text-red-500 text-sm mt-1">{state.poUploadErrors.poNumber}</p>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">PO File</label>
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
              <p className="text-red-500 text-sm mt-1">{state.poUploadErrors.poFile}</p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  isUploadPOModalOpen: false,
                  selectedWOForPOUpload: null,
                  poUpload: { poNumber: '', poFile: null },
                  poUploadErrors: { poNumber: '', poFile: '' },
                }))
              }
              disabled={isSubmitting}
              className={`px-3 py-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm ${
                isSubmitting ? 'cursor-not-allowed' : ''
              }`}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUploadPOConfirm}
              disabled={isSubmitting}
              className={`px-3 py-1 rounded-md text-sm ${
                isSubmitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? 'Uploading...' : 'Upload'}
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
            signedDeliveryNote: null,
          }))
        }
        title="Upload Signed Delivery Note"
      >
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-black">Upload Signed Delivery Note</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Signed Delivery Note</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setState((prev) => ({ ...prev, signedDeliveryNote: e.target.files[0] }))}
              className="w-full p-2 border rounded focus:outline-indigo-500"
              disabled={isSubmitting}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  isUploadDNModalOpen: false,
                  selectedDNForUpload: null,
                  signedDeliveryNote: null,
                }))
              }
              disabled={isSubmitting}
              className={`px-3 py-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm ${
                isSubmitting ? 'cursor-not-allowed' : ''
              }`}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUploadDNConfirm}
              disabled={isSubmitting}
              className={`px-3 py-1 rounded-md text-sm ${
                isSubmitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? 'Uploading...' : 'Upload'}
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
            dueInDays: '',
            receivedDate: '',
            originalInvoiceStatus: '',
            invoiceUploadType: '',
          }))
        }
        title="Update Invoice Status"
      >
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-black">Update Invoice Status</h2>
          {state.newStatus === 'processed' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Received Date</label>
              <input
                type="date"
                value={state.receivedDate}
                onChange={(e) => setState((prev) => ({ ...prev, receivedDate: e.target.value }))}
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
                  isStatusModalOpen: false,
                  selectedWorkOrderId: null,
                  selectedDNId: null,
                  newStatus: '',
                  dueInDays: '',
                  receivedDate: '',
                  originalInvoiceStatus: '',
                  invoiceUploadType: '',
                }))
              }
              disabled={isSubmitting}
              className={`px-3 py-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm ${
                isSubmitting ? 'cursor-not-allowed' : ''
              }`}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStatusModalSubmit}
              disabled={isSubmitting}
              className={`px-3 py-1 rounded-md text-sm ${
                isSubmitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Confirm'}
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
            invoiceUpload: { invoiceFile: null },
            invoiceUploadErrors: { invoiceFile: '' },
            invoiceUploadType: '',
          }))
        }
        title={`Upload ${state.invoiceUploadType} Invoice`}
      >
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-black">Upload {state.invoiceUploadType} Invoice</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice File</label>
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
              <p className="text-red-500 text-sm mt-1">{state.invoiceUploadErrors.invoiceFile}</p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  isUploadInvoiceModalOpen: false,
                  selectedWOForInvoiceUpload: null,
                  invoiceUpload: { invoiceFile: null },
                  invoiceUploadErrors: { invoiceFile: '' },
                  invoiceUploadType: '',
                }))
              }
              disabled={isSubmitting}
              className={`px-3 py-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm ${
                isSubmitting ? 'cursor-not-allowed' : ''
              }`}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInvoiceUploadSubmit}
              disabled={isSubmitting}
              className={`px-3 py-1 rounded-md text-sm ${
                isSubmitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PendingInvoices;