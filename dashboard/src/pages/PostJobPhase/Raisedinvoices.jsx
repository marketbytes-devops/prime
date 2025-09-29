import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../../helpers/apiClient';
import InputField from '../../components/InputField';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

const RaisedInvoices = () => {
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
    workOrderDeliveryPairs: [],
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
        relatedDNs.forEach((dn) => {
          dn.items.forEach((dnItem) => {
            if (dnItem.invoice_status === 'raised') {
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
      if (pair.deliveryNoteItem?.invoice_file) {
        window.open(pair.deliveryNoteItem.invoice_file, '_blank');
      } else {
        toast.error('No invoice file available.');
      }
    }
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
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">WO Number</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">DN Number</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Item</th>
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
                    No raised invoices found.
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
                      {pair.deliveryNoteItem ? `${getItemName(pair.deliveryNoteItem.item)} ${pair.deliveryNoteItem.range ? `(${pair.deliveryNoteItem.range})` : ''}` : 'N/A'}
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
                          onClick={() => handleViewDocument(pair, 'po')}
                          disabled={!hasPermission('raised_invoices', 'view')}
                          className={`px-3 py-1 rounded-md text-sm whitespace-nowrap ${
                            !hasPermission('raised_invoices', 'view')
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          View PO
                        </Button>
                        <Button
                          onClick={() => handleViewDocument(pair, 'wo')}
                          disabled={!hasPermission('raised_invoices', 'view')}
                          className={`px-3 py-1 rounded-md text-sm whitespace-nowrap ${
                            !hasPermission('raised_invoices', 'view')
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          View WO
                        </Button>
                        <Button
                          onClick={() => handleViewDocument(pair, 'dn')}
                          disabled={!hasPermission('raised_invoices', 'view')}
                          className={`px-3 py-1 rounded-md text-sm whitespace-nowrap ${
                            !hasPermission('raised_invoices', 'view')
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-purple-600 text-white hover:bg-purple-700'
                          }`}
                        >
                          View DN
                        </Button>
                        <Button
                          onClick={() => handleViewDocument(pair, 'invoice')}
                          disabled={!hasPermission('raised_invoices', 'view') || !pair.deliveryNoteItem?.invoice_file}
                          className={`px-3 py-1 rounded-md text-sm whitespace-nowrap ${
                            !hasPermission('raised_invoices', 'view') || !pair.deliveryNoteItem?.invoice_file
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          }`}
                        >
                          View Invoice
                        </Button>
                      </div>
                    </td>
                    <td className="border p-2 whitespace-nowrap">{pair.deliveryNoteItem?.invoice_status || 'Raised'}</td>
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
    </div>
  );
};

export default RaisedInvoices;