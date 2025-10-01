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
    workOrders: [],
    purchaseOrders: [],
    quotations: [],
    channels: [],
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
      const [dnRes, woRes, poRes, quotationsRes, channelsRes, techRes, itemsRes, unitsRes] = await Promise.all([
        apiClient.get('delivery-notes/', {
          params: { delivery_status: 'Delivery Pending' },
        }),
        apiClient.get('work-orders/'),
        apiClient.get('purchase-orders/'),
        apiClient.get('quotations/'),
        apiClient.get('channels/'),
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
        workOrders: woRes.data || [],
        purchaseOrders: poRes.data || [],
        quotations: quotationsRes.data || [],
        channels: channelsRes.data || [],
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

  const getWorkOrderByDN = (dn) => {
    return state.workOrders.find(wo => wo.id === dn.work_order_id);
  };

  const getPurchaseOrderByWO = (workOrder) => {
    if (!workOrder) return null;
    return state.purchaseOrders.find(po => po.id === workOrder.purchase_order);
  };

  const getQuotationByPO = (purchaseOrder) => {
    if (!purchaseOrder) return null;
    return state.quotations.find(q => q.id === purchaseOrder.quotation);
  };

  const getQuotationDetails = (dn) => {
    const workOrder = getWorkOrderByDN(dn);
    const purchaseOrder = getPurchaseOrderByWO(workOrder);
    const quotation = getQuotationByPO(purchaseOrder);
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
      po_series_number: purchaseOrder?.series_number || 'N/A',
      client_po_number: purchaseOrder?.client_po_number || 'N/A',
      order_type: purchaseOrder?.order_type || 'N/A',
      created_at: purchaseOrder?.created_at ? new Date(purchaseOrder.created_at).toLocaleDateString() : 'N/A',
      po_file: purchaseOrder?.po_file || null,
      assigned_sales_person: quotation?.assigned_sales_person_name || 'N/A',
    };
  };

  const getCompanyNameByDN = (dn) => {
    return getQuotationDetails(dn).company_name;
  };

  const getQuotationNumberByDN = (dn) => {
    return getQuotationDetails(dn).series_number;
  };

  const getWONumberByDN = (dn) => {
    const workOrder = getWorkOrderByDN(dn);
    return workOrder?.wo_number || 'N/A';
  };

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
    }));
  };

  const handleCompleteDelivery = async () => {
    const { selectedDNForComplete, signedDeliveryNote } = state;
    if (!signedDeliveryNote) {
      toast.warn('Please upload a signed delivery note before submitting.');
      return;
    }
 
    if (!window.confirm('Are you sure you want to complete this delivery? This will move the work order to Pending Invoices.')) {
      return;
    }
 
    try {
      setIsSubmitting(true);

      const deliveryFormData = new FormData();
      deliveryFormData.append('signed_delivery_note', signedDeliveryNote);
      await apiClient.post(`delivery-notes/${selectedDNForComplete.id}/upload-signed-note/`, deliveryFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
 
      const invoiceFormData = new FormData();
      invoiceFormData.append('delivery_note_id', selectedDNForComplete.id);
      invoiceFormData.append('invoice_status', 'pending');  
      await apiClient.post('/invoices/', invoiceFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
 
      toast.success('Delivery completed and invoice created. Work order moved to Pending Invoices.');
      setState((prev) => ({
        ...prev,
        isCompleteModalOpen: false,
        selectedDNForComplete: null,
        signedDeliveryNote: null,
      }));
      fetchData();
    } catch (error) {
      console.error('Error completing delivery:', error);
      if (error.response && error.response.data) {
        const errors = error.response.data;
        if (errors.delivery_note_id) {
          toast.error(`Invoice creation failed: ${errors.delivery_note_id.join(', ')}`);
        } else {
          toast.error('Failed to complete delivery or create invoice.');
        }
      } else {
        toast.error('Failed to complete delivery or create invoice.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = (dn) => {
    if (templateRef.current) {
      setState((prev) => ({
        ...prev,
        selectedDN: dn,
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
      }, 0);
    }
  };

  const filteredDNs = state.deliveryNotes
    .filter(
      (dn) =>
        (dn.dn_number || '').toLowerCase().includes(state.searchTerm.toLowerCase()) ||
        getCompanyNameByDN(dn).toLowerCase().includes(state.searchTerm.toLowerCase()) ||
        getQuotationNumberByDN(dn).toLowerCase().includes(state.searchTerm.toLowerCase()) ||
        getWONumberByDN(dn).toLowerCase().includes(state.searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (state.sortBy === 'created_at') {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (state.sortBy === 'dn_number') {
        return (a.dn_number || '').localeCompare(b.dn_number || '');
      } else if (state.sortBy === 'company_name') {
        return getCompanyNameByDN(a).localeCompare(getCompanyNameByDN(b));
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
                placeholder="Search by DN Number, Company Name, Quotation Number, or WO Number..."
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
                <option value="company_name">Company Name</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="whitespace-nowrap border p-2 text-left text-sm font-medium text-gray-700">Sl No</th>
                  <th className="whitespace-nowrap border p-2 text-left text-sm font-medium text-gray-700">Company Name</th>
                  <th className="whitespace-nowrap border p-2 text-left text-sm font-medium text-gray-700">Quotation Number</th>
                  <th className="whitespace-nowrap border p-2 text-left text-sm font-medium text-gray-700">WO Number</th>
                  <th className="whitespace-nowrap border p-2 text-left text-sm font-medium text-gray-700">DN Number</th>
                  <th className="whitespace-nowrap border p-2 text-left text-sm font-medium text-gray-700">Created At</th>
                  <th className="whitespace-nowrap border p-2 text-left text-sm font-medium text-gray-700">Delivery Status</th>
                  <th className="whitespace-nowrap border p-2 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentDNs.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="border p-2 text-center text-gray-500">
                      No delivery notes available.
                    </td>
                  </tr>
                ) : (
                  currentDNs.map((dn, index) => (
                    <tr key={dn.id} className="border hover:bg-gray-50">
                      <td className="whitespace-nowrap border p-2">{startIndex + index + 1}</td>
                      <td className="whitespace-nowrap border p-2">{getCompanyNameByDN(dn)}</td>
                      <td className="whitespace-nowrap border p-2">{getQuotationNumberByDN(dn)}</td>
                      <td className="whitespace-nowrap border p-2">{getWONumberByDN(dn)}</td>
                      <td className="whitespace-nowrap border p-2">{dn.dn_number || 'N/A'}</td>
                      <td className="whitespace-nowrap border p-2">{new Date(dn.created_at).toLocaleDateString()}</td>
                      <td className="whitespace-nowrap border p-2">{dn.delivery_status || 'N/A'}</td>
                      <td className="whitespace-nowrap border p-2">
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleViewDN(dn)}
                            disabled={isSubmitting || !hasPermission('pending_deliveries', 'view')}
                            className={`whitespace-nowrap px-3 py-1 text-sm rounded-md ${
                              isSubmitting || !hasPermission('pending_deliveries', 'view')
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            View DN
                          </Button>
                          <Button
                            onClick={() => handleOpenCompleteModal(dn)}
                            disabled={isSubmitting || !hasPermission('pending_deliveries', 'edit') || dn.delivery_status === 'Delivered'}
                            className={`whitespace-nowrap px-3 py-1 rounded-md text-sm ${
                              isSubmitting || !hasPermission('pending_deliveries', 'edit') || dn.delivery_status === 'Delivered'
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                            }`}
                          >
                            {isSubmitting ? 'Completing...' : 'Complete'}
                          </Button>
                          <Button
                            onClick={() => handlePrint(dn)}
                            disabled={isSubmitting || !hasPermission('pending_deliveries', 'view')}
                            className={`whitespace-nowrap px-3 py-1 text-sm rounded-md ${
                              isSubmitting || !hasPermission('pending_deliveries', 'view')
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
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
          isOpen={state.isViewModalOpen}
          onClose={() => setState((prev) => ({ ...prev, isViewModalOpen: false, selectedDN: null }))}
          title={`Delivery Note Details - ${state.selectedDN?.dn_number || 'N/A'}`}
        >
          {state.selectedDN ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-black">Company Details</h3>
                <p><strong>Series Number:</strong> {getQuotationDetails(state.selectedDN).series_number}</p>
                <p><strong>Company Name:</strong> {getQuotationDetails(state.selectedDN).company_name}</p>
                <p><strong>Company Address:</strong> {getQuotationDetails(state.selectedDN).company_address}</p>
                <p><strong>Company Phone:</strong> {getQuotationDetails(state.selectedDN).company_phone}</p>
                <p><strong>Company Email:</strong> {getQuotationDetails(state.selectedDN).company_email}</p>
                <p><strong>Channel:</strong> {getQuotationDetails(state.selectedDN).channel}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-black">Contact Details</h3>
                <p><strong>Contact Name:</strong> {getQuotationDetails(state.selectedDN).contact_name}</p>
                <p><strong>Contact Email:</strong> {getQuotationDetails(state.selectedDN).contact_email}</p>
                <p><strong>Contact Phone:</strong> {getQuotationDetails(state.selectedDN).contact_phone}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-black">Purchase Order Details</h3>
                <p><strong>Series Number:</strong> {getQuotationDetails(state.selectedDN).po_series_number}</p>
                <p><strong>Client PO Number:</strong> {getQuotationDetails(state.selectedDN).client_po_number}</p>
                <p><strong>Order Type:</strong> {getQuotationDetails(state.selectedDN).order_type}</p>
                <p><strong>Created:</strong> {getQuotationDetails(state.selectedDN).created_at}</p>
                <p>
                  <strong>PO File:</strong>{' '}
                  {getQuotationDetails(state.selectedDN).po_file ? (
                    <a
                      href={getQuotationDetails(state.selectedDN).po_file}
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
                <p><strong>Assigned Sales Person:</strong> {getQuotationDetails(state.selectedDN).assigned_sales_person}</p>
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
          isOpen={state.isCompleteModalOpen}
          onClose={() =>
            setState((prev) => ({
              ...prev,
              isCompleteModalOpen: false,
              selectedDNForComplete: null,
              signedDeliveryNote: null,
            }))
          }
          title={`Complete Delivery - ${state.selectedDNForComplete?.dn_number || 'N/A'}`}
        >
          <div className="space-y-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload Signed Delivery Note</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setState((prev) => ({ ...prev, signedDeliveryNote: e.target.files[0] }))}
                className="w-full p-2 border rounded focus:outline-indigo-500"
                disabled={isSubmitting || !hasPermission('pending_deliveries', 'edit')}
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
                onClick={handleCompleteDelivery}
                disabled={isSubmitting || !hasPermission('pending_deliveries', 'edit')}
                className={`whitespace-nowrap px-3 py-1 rounded-md text-sm ${
                  isSubmitting || !hasPermission('pending_deliveries', 'edit')
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? 'Completing...' : 'Complete'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
};

export default PendingDeliveries;