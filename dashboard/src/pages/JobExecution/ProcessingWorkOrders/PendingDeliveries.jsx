import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../utils/apiClient';
import Button from '../components/Button';
import Modal from '../components/Modal';
import PendingDeliveriesViewModal from '../components/PendingDeliveriesViewModal';
import { hasPermission } from '../utils/auth';

const PendingDeliveries = () => {
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

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [dnRes, woRes, poRes, techRes, itemsRes, unitsRes, quotationsRes, channelsRes] = await Promise.all([
        apiClient.get('delivery-notes/'),
        apiClient.get('work-orders/'),
        apiClient.get('purchase-orders/'),
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

      setState((prev) => ({
        ...prev,
        deliveryNotes,
        workOrders: woRes.data || [],
        purchaseOrders: poRes.data || [],
        technicians: techRes.data || [],
        itemsList: itemsRes.data || [],
        units: unitsRes.data || [],
        quotations: quotationsRes.data || [],
        channels: channelsRes.data || [],
      }));
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data.');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCompleteDelivery = async () => {
    const { selectedDNForComplete, signedDeliveryNote } = state;
    if (!signedDeliveryNote) {
      toast.error('Please upload a signed delivery note.');
      return;
    }

    if (!window.confirm('Are you sure you want to complete this delivery? This will mark the delivery as completed.')) {
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('signed_delivery_note', signedDeliveryNote);
      await apiClient.post(`delivery-notes/${selectedDNForComplete.id}/upload-signed-note/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Delivery completed successfully.');
      setState((prev) => ({
        ...prev,
        isCompleteModalOpen: false,
        selectedDNForComplete: null,
        signedDeliveryNote: null,
      }));
      fetchData();
    } catch (error) {
      console.error('Error completing delivery:', error);
      toast.error('Failed to complete delivery.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getQuotationDetails = (workOrderId) => {
    const workOrder = state.workOrders.find((wo) => wo.id === workOrderId);
    if (!workOrder) return { company_name: 'N/A', series_number: 'N/A' };
    const quotation = state.quotations.find((q) => q.id === workOrder.quotation);
    return {
      company_name: quotation?.company_name || 'N/A',
      series_number: quotation?.series_number || 'N/A',
    };
  };

  const getAssignedTechnicians = (items) => {
    const technicianIds = new Set(items.flatMap((item) => item.assigned_technicians || []));
    const technicians = state.technicians
      .filter((tech) => technicianIds.has(tech.id))
      .map((tech) => tech.name)
      .join(', ');
    return technicians || 'N/A';
  };

  const filteredDeliveryNotes = state.deliveryNotes
    .filter((dn) => !dn.signed_delivery_note)
    .filter((dn) =>
      dn.dn_number.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      getQuotationDetails(dn.work_order_id).company_name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      getQuotationDetails(dn.work_order_id).series_number.toLowerCase().includes(state.searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (state.sortBy === 'created_at') {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      return a[state.sortBy].localeCompare(b[state.sortBy]);
    });

  const totalPages = Math.ceil(filteredDeliveryNotes.length / state.itemsPerPage);
  const startIndex = (state.currentPage - 1) * state.itemsPerPage;
  const currentDeliveryNotes = filteredDeliveryNotes.slice(startIndex, startIndex + state.itemsPerPage);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-black">Pending Deliveries</h1>
      <div className="mb-4 flex justify-between items-center">
        <input
          type="text"
          placeholder="Search by DN number, company name, or quotation number"
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
          <option value="dn_number">Sort by DN Number</option>
          <option value="company_name">Sort by Company Name</option>
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
          </tr>
        </thead>
        <tbody>
          {currentDeliveryNotes.length === 0 ? (
            <tr>
              <td colSpan="8" className="border p-2 text-center text-gray-500">
                No pending deliveries found.
              </td>
            </tr>
          ) : (
            currentDeliveryNotes.map((dn, index) => {
              const workOrder = state.workOrders.find((wo) => wo.id === dn.work_order_id);
              return (
                <tr key={dn.id} className="border hover:bg-gray-50">
                  <td className="border p-2 whitespace-nowrap">{startIndex + index + 1}</td>
                  <td className="border p-2 whitespace-nowrap">{getQuotationDetails(dn.work_order_id).company_name}</td>
                  <td className="border p-2 whitespace-nowrap">{getQuotationDetails(dn.work_order_id).series_number}</td>
                  <td className="border p-2 whitespace-nowrap">{workOrder?.wo_number || 'N/A'}</td>
                  <td className="border p-2 whitespace-nowrap">{dn.dn_number}</td>
                  <td className="border p-2 whitespace-nowrap">{new Date(dn.created_at).toLocaleDateString()}</td>
                  <td className="border p-2 whitespace-nowrap">{getAssignedTechnicians(dn.items)}</td>
                  <td className="border p-2 whitespace-nowrap">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setState((prev) => ({ ...prev, isViewModalOpen: true, selectedDN: dn }))}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                      >
                        View
                      </Button>
                      {hasPermission('pending_deliveries', 'edit') && (
                        <Button
                          onClick={() =>
                            setState((prev) => ({ ...prev, isCompleteModalOpen: true, selectedDNForComplete: dn }))
                          }
                          disabled={isSubmitting}
                          className={`px-3 py-1 rounded-md text-sm ${
                            isSubmitting
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {isSubmitting ? 'Submitting...' : 'Complete'}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      <div className="mt-4 flex justify-between items-center">
        <div>
          Showing {startIndex + 1} to {Math.min(startIndex + state.itemsPerPage, filteredDeliveryNotes.length)} of{' '}
          {filteredDeliveryNotes.length} entries
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
        <PendingDeliveriesViewModal
          deliveryNote={state.selectedDN}
          workOrders={state.workOrders}
          purchaseOrders={state.purchaseOrders}
          quotations={state.quotations}
          channels={state.channels}
          itemsList={state.itemsList}
          units={state.units}
          onClose={() => setState((prev) => ({ ...prev, isViewModalOpen: false, selectedDN: null }))}
        />
      )}

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
          <h2 className="text-lg font-medium text-black">Complete Delivery</h2>
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
  );
};

export default PendingDeliveries;