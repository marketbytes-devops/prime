import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../../helpers/apiClient';
import InputField from '../../components/InputField';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

const CompletedWO = () => {
  const [state, setState] = useState({
    workOrders: [],
    purchaseOrders: [],
    deliveryNotes: [],
    technicians: [],
    itemsList: [],
    units: [],
    searchTerm: '',
    sortBy: 'created_at',
    currentPage: 1,
    itemsPerPage: 20,
    isWOModalOpen: false,
    isPOModalOpen: false,
    isDNModalOpen: false,
    selectedWO: null,
    selectedPO: null,
    selectedDN: null,
  });

  const fetchData = async () => {
    try {
      const [woRes, poRes, dnRes, techRes, itemsRes, unitsRes] = await Promise.all([
        apiClient.get('work-orders/'),
        apiClient.get('purchase-orders/'),
        apiClient.get('delivery-notes/'),
        apiClient.get('technicians/'),
        apiClient.get('items/'),
        apiClient.get('units/'),
      ]);

      const userEmail = localStorage.getItem('userEmail');
      const filteredWOs = (woRes.data || []).filter(
        (wo) => wo.created_by?.email === userEmail || !wo.created_by
      );

      setState((prev) => ({
        ...prev,
        workOrders: filteredWOs,
        purchaseOrders: poRes.data || [],
        deliveryNotes: dnRes.data || [],
        technicians: techRes.data || [],
        itemsList: itemsRes.data || [],
        units: unitsRes.data || [],
      }));
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load completed work orders.');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleViewDocument = (wo, type) => {
    if (type === 'wo') {
      setState((prev) => ({
        ...prev,
        isWOModalOpen: true,
        selectedWO: wo,
      }));
    } else if (type === 'po') {
      console.log('workOrder:', wo);
      const poId = wo.purchase_order;
      console.log('workOrder.purchase_order:', poId);
      const purchaseOrder = state.purchaseOrders.find((po) => po.id === poId);
      console.log('Found PO:', purchaseOrder);
      setState((prev) => ({
        ...prev,
        isPOModalOpen: true,
        selectedPO: purchaseOrder || null,
      }));
      if (!purchaseOrder) {
        toast.error('Purchase order not found. Please check if the purchase order ID matches.');
      }
    } else if (type === 'dn') {
      const deliveryNote = state.deliveryNotes.find((dn) => dn.work_order === wo.id);
      setState((prev) => ({
        ...prev,
        isDNModalOpen: true,
        selectedDN: deliveryNote || null,
      }));
    }
  };

  const handleDeleteWorkOrder = async (workOrderId) => {
    try {
      await apiClient.delete(`work-orders/${workOrderId}/`);
      toast.success('Work order deleted successfully.');
      fetchData();
    } catch (error) {
      console.error('Error deleting work order:', error);
      toast.error('Failed to delete work order.');
    }
  };

  const getAssignedTechnicians = (items) => {
    const technicianIds = [...new Set(items.map((item) => item.assigned_to).filter((id) => id))];
    if (technicianIds.length === 0) return 'None';
    if (technicianIds.length > 1) return 'Multiple';
    const technician = state.technicians.find((t) => t.id === technicianIds[0]);
    return technician ? `${technician.name} (${technician.designation || 'N/A'})` : 'N/A';
  };

  const getInvoiceStatus = (wo) => {
    const deliveryNote = state.deliveryNotes.find((dn) => dn.work_order === wo.id);
    return deliveryNote?.invoice_status || 'Pending';
  };

  const filteredWOs = state.workOrders
    .filter((wo) =>
      (wo.wo_number || '').toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      (wo.quotation?.company_name || '').toLowerCase().includes(state.searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (state.sortBy === 'created_at') {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (state.sortBy === 'company_name') {
        return (a.quotation?.company_name || '').localeCompare(b.quotation?.company_name || '');
      }
      return 0;
    });

  const totalPages = Math.ceil(filteredWOs.length / state.itemsPerPage);
  const startIndex = (state.currentPage - 1) * state.itemsPerPage;
  const currentWOs = filteredWOs.slice(startIndex, startIndex + state.itemsPerPage);

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
      <h1 className="text-2xl font-bold mb-4">Completed Work Orders</h1>
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
              <option value="company_name">Company Name</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left text-sm font-medium text-gray-700">Sl No</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700">Created At</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700">WO Number</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700">Assigned To</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700">View Documents</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700">Invoice Status</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentWOs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="border p-2 text-center text-gray-500">
                    No completed work orders found.
                  </td>
                </tr>
              ) : (
                currentWOs.map((wo, index) => (
                  <tr key={wo.id} className="border hover:bg-gray-50">
                    <td className="border p-2">{startIndex + index + 1}</td>
                    <td className="border p-2">08/08/2025</td>
                    <td className="border p-2">{wo.wo_number || 'N/A'}</td>
                    <td className="border p-2">{getAssignedTechnicians(wo.items || [])}</td>
                    <td className="border p-2">
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleViewDocument(wo, 'po')}
                          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                        >
                          View PO
                        </Button>
                        <Button
                          onClick={() => handleViewDocument(wo, 'wo')}
                          className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                        >
                          View WO
                        </Button>
                        <Button
                          onClick={() => handleViewDocument(wo, 'dn')}
                          className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                        >
                          View DN
                        </Button>
                      </div>
                    </td>
                    <td className="border p-2">{getInvoiceStatus(wo)}</td>
                    <td className="border p-2">
                      <Button
                        onClick={() => handleDeleteWorkOrder(wo.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                      >
                        Delete
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

      {/* Work Order Modal */}
      <Modal
        isOpen={state.isWOModalOpen}
        onClose={() => setState((prev) => ({ ...prev, isWOModalOpen: false, selectedWO: null }))}
        title={`Work Order Details - ${state.selectedWO?.wo_number || 'N/A'}`}
      >
        {state.selectedWO && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-black">Work Order Details</h3>
              <p><strong>WO Number:</strong> {state.selectedWO.wo_number || 'N/A'}</p>
              <p><strong>Status:</strong> {state.selectedWO.status || 'N/A'}</p>
              <p><strong>Created At:</strong> {new Date(state.selectedWO.created_at).toLocaleDateString()}</p>
              <p><strong>Date Received:</strong> {state.selectedWO.date_received ? new Date(state.selectedWO.date_received).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Expected Completion:</strong> {state.selectedWO.expected_completion_date ? new Date(state.selectedWO.expected_completion_date).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Onsite/Lab:</strong> {state.selectedWO.onsite_or_lab || 'N/A'}</p>
              <p><strong>Range:</strong> {state.selectedWO.range || 'N/A'}</p>
              <p><strong>Serial Number:</strong> {state.selectedWO.serial_number || 'N/A'}</p>
              <p><strong>Site Location:</strong> {state.selectedWO.site_location || 'N/A'}</p>
              <p><strong>Remarks:</strong> {state.selectedWO.remarks || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-black">Items</h3>
              {state.selectedWO.items && state.selectedWO.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Item</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Quantity</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Unit</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Assigned To</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.selectedWO.items.map((item) => (
                        <tr key={item.id} className="border">
                          <td className="border p-2 whitespace-nowrap">{state.itemsList.find((i) => i.id === item.item)?.name || 'N/A'}</td>
                          <td className="border p-2 whitespace-nowrap">{item.quantity || 'N/A'}</td>
                          <td className="border p-2 whitespace-nowrap">{state.units.find((u) => u.id === item.unit)?.name || 'N/A'}</td>
                          <td className="border p-2 whitespace-nowrap">{state.technicians.find((t) => t.id === item.assigned_to)?.name || 'N/A'}</td>
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

      {/* Purchase Order Modal */}
      <Modal
        isOpen={state.isPOModalOpen}
        onClose={() => setState((prev) => ({ ...prev, isPOModalOpen: false, selectedPO: null }))}
        title={`Purchase Order Details - ID ${state.selectedPO?.id || 'N/A'}`}
      >
        {state.selectedPO ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-black">Purchase Order Details</h3>
              <p><strong>PO ID:</strong> {state.selectedPO.id || 'N/A'}</p>
              <p><strong>Client PO Number:</strong> {state.selectedPO.client_po_number || 'N/A'}</p>
              <p><strong>Order Type:</strong> {state.selectedPO.order_type || 'N/A'}</p>
              <p><strong>Created:</strong> {state.selectedPO.created_at ? new Date(state.selectedPO.created_at).toLocaleDateString() : 'N/A'}</p>
              <p><strong>PO File:</strong> {state.selectedPO.po_file ? (
                <a
                  href={state.selectedPO.po_file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {state.selectedPO.po_file.split('/').pop() || 'View File'}
                </a>
              ) : 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-black">Device Under Test Details</h3>
              {state.selectedPO.items && state.selectedPO.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Item</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Quantity</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.selectedPO.items.map((item) => (
                        <tr key={item.id} className="border">
                          <td className="border p-2 whitespace-nowrap">{state.itemsList.find((i) => i.id === item.item)?.name || 'N/A'}</td>
                          <td className="border p-2 whitespace-nowrap">{item.quantity || 'N/A'}</td>
                          <td className="border p-2 whitespace-nowrap">{state.units.find((u) => u.id === item.unit)?.name || 'N/A'}</td>
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
          <p className="text-gray-500">No purchase order found.</p>
        )}
      </Modal>

      {/* Delivery Note Modal */}
      <Modal
        isOpen={state.isDNModalOpen}
        onClose={() => setState((prev) => ({ ...prev, isDNModalOpen: false, selectedDN: null }))}
        title={`Delivery Note Details - ${state.selectedDN?.dn_number || 'N/A'}`}
      >
        {state.selectedDN ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-black">Delivery Note Details</h3>
              <p><strong>DN Number:</strong> {state.selectedDN.dn_number || 'N/A'}</p>
              <p><strong>WO Number:</strong> {state.workOrders.find((wo) => wo.id === state.selectedDN.work_order)?.wo_number || 'N/A'}</p>
              <p><strong>Created At:</strong> {new Date(state.selectedDN.created_at).toLocaleDateString()}</p>
              <p><strong>Delivery Status:</strong> {state.selectedDN.delivery_status || 'N/A'}</p>
              <p><strong>Signed Delivery Note:</strong> {state.selectedDN.signed_delivery_note ? (
                <a
                  href={state.selectedDN.signed_delivery_note}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View File
                </a>
              ) : 'N/A'}</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No delivery note found.</p>
        )}
      </Modal>
    </div>
  );
};

export default CompletedWO;