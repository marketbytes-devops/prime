import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../../../helpers/apiClient';
import Button from '../../../components/Button';
import Modal from '../../../components/Modal';
import InputField from '../../../components/InputField';
import { useNavigate } from 'react-router-dom';

const DeclinedWorkOrders = () => {
  const [state, setState] = useState({
    workOrders: [],
    itemsList: [],
    units: [],
    technicians: [],
    quotations: [],
    purchaseOrders: [],
    channels: [], // Added channels to state
    searchTerm: '',
    sortBy: 'created_at',
    currentPage: 1,
    itemsPerPage: 20,
    isViewModalOpen: false,
    isDeclineModalOpen: false,
    selectedWO: null,
    declineReason: '',
  });
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
  const navigate = useNavigate();

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
      const [woRes, itemsRes, unitsRes, techRes, quotationsRes, poRes, channelsRes] = await Promise.all([
        apiClient.get('work-orders/', { params: { status: 'Declined' } }),
        apiClient.get('items/'),
        apiClient.get('units/'),
        apiClient.get('technicians/'),
        apiClient.get('quotations/'),
        apiClient.get('purchase-orders/'),
        apiClient.get('channels/'), // Added fetch for channels
      ]);
      setState((prev) => ({
        ...prev,
        workOrders: woRes.data || [],
        itemsList: itemsRes.data || [],
        units: unitsRes.data || [],
        technicians: techRes.data || [],
        quotations: quotationsRes.data || [],
        purchaseOrders: poRes.data || [],
        channels: channelsRes.data || [], // Store channels in state
      }));
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load declined work orders.');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getQuotationDetails = (wo) => {
    const purchaseOrder = state.purchaseOrders.find((po) => po.id === wo.purchase_order);
    const quotation = state.quotations.find((q) => q.id === wo.quotation);
    return {
      series_number: quotation?.series_number || 'N/A',
      company_name: quotation?.company_name || 'N/A',
      company_address: quotation?.company_address || 'N/A',
      company_phone: quotation?.company_phone || 'N/A',
      company_email: quotation?.company_email || 'N/A',
      channel: state.channels.find((c) => c.id === quotation?.rfq_channel)?.channel_name || 'N/A', // Updated to use channels
      contact_name: quotation?.point_of_contact_name || 'N/A',
      contact_email: quotation?.point_of_contact_email || 'N/A',
      contact_phone: quotation?.point_of_contact_phone || 'N/A',
      po_series_number: purchaseOrder?.series_number || 'N/A',
      client_po_number: purchaseOrder?.client_po_number || 'N/A',
      order_type: purchaseOrder?.order_type || 'N/A',
      created_at: purchaseOrder?.created_at ? new Date(purchaseOrder.created_at).toLocaleDateString() : 'N/A',
      po_file: purchaseOrder?.po_file || null,
      assigned_sales_person: quotation?.assigned_sales_person_name || 'N/A', // Updated to use assigned_sales_person_name
    };
  };

  const handleViewWO = (wo) => {
    setState((prev) => ({
      ...prev,
      isViewModalOpen: true,
      selectedWO: wo,
    }));
  };

  const handleUpdate = (woId) => {
    navigate(`/job-execution/processing-work-orders/edit-declined-work-order/${woId}`, {
      state: { from: "/job-execution/processing-work-orders/declined-work-orders" },
    });
  };

  const handleDecline = async () => {
    try {
      await apiClient.post(`work-orders/${state.selectedWO.id}/decline/`, {
        decline_reason: state.declineReason,
      });
      toast.success('Work Order decline reason updated.');
      setState((prev) => ({
        ...prev,
        isDeclineModalOpen: false,
        selectedWO: null,
        declineReason: '',
      }));
      fetchData();
    } catch (error) {
      console.error('Error declining work order:', error);
      toast.error(error.response?.data?.error || 'Failed to update decline reason.');
    }
  };

  const handleResubmit = async (id) => {
    if (window.confirm("Are you sure you want to resubmit this work order for Manager Approval?")) {
      try {
        await apiClient.post(`work-orders/${id}/resubmit/`);
        toast.success('Work Order resubmitted for Manager Approval.');
        fetchData();
        navigate('/job-execution/processing-work-orders/manager-approval');
      } catch (error) {
        console.error('Error resubmitting work order:', error);
        toast.error(error.response?.data?.error || 'Failed to resubmit Work Order.');
      }
    }
  };

  const getAssignedTechnicians = (items) => {
    const technicianIds = [...new Set(items.map((item) => item.assigned_to).filter((id) => id))];
    if (technicianIds.length === 0) return 'None';
    if (technicianIds.length > 1) return 'Multiple';
    const technician = state.technicians.find((t) => t.id === technicianIds[0]);
    return technician ? `${technician.name} (${technician.designation || 'N/A'})` : 'N/A';
  };

  const filteredWOs = state.workOrders
    .filter(
      (wo) =>
        (wo.quotation?.company_name || '').toLowerCase().includes(state.searchTerm.toLowerCase()) ||
        (wo.wo_number || '').toLowerCase().includes(state.searchTerm.toLowerCase())
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

  const getTotalItemQuantity = (items) => {
    return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  };

  return (
    <div className="mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Declined Work Orders</h1>
      <div className="bg-white p-4 space-y-4 rounded-md shadow w-full">
        <div className="mb-6 flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Work Orders</label>
            <InputField
              type="text"
              placeholder="Search by company name or WO Number..."
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
              <option value="company_name">Company Name</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left text-sm font-medium text-gray-700">Sl No</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700">WO Number</th>
                {/* ADDED: Company Name Column */}
                <th className="border p-2 text-left text-sm font-medium text-gray-700 min-w-[180px]">Company Name</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700">Created At</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700">Assigned To</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700">Decline Reason</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentWOs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="border p-2 text-center text-gray-500">
                    No declined work orders found.
                  </td>
                </tr>
              ) : (
                currentWOs.map((wo, index) => (
                  <tr key={wo.id} className="border hover:bg-gray-50">
                    <td className="border p-2">{startIndex + index + 1}</td>
                    <td className="border p-2">{wo.wo_number || 'N/A'}</td>
                    {/* ADDED: Display Company Name */}
                    <td className="border p-2 min-w-[180px]">{wo.quotation?.company_name || 'N/A'}</td>
                    <td className="border p-2">{new Date(wo.created_at).toLocaleDateString()}</td>
                    <td className="border p-2">{getAssignedTechnicians(wo.items)}</td>
                    <td className="border p-2">{wo.decline_reason || 'N/A'}</td>
                    <td className="border p-2">
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleViewWO(wo)}
                          className="whitespace-nowrap px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                        >
                          View WO & Certificates
                        </Button>
                        <Button
                          onClick={() => handleUpdate(wo.id)}
                          disabled={!hasPermission('declined_work_orders', 'edit')}
                          className={`whitespace-nowrap px-3 py-1 rounded-md text-sm ${
                            hasPermission('declined_work_orders', 'edit')
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          Update
                        </Button>
                        <Button
                          onClick={() => handleResubmit(wo.id)}
                          disabled={!hasPermission('declined_work_orders', 'edit')}
                          className={`whitespace-nowrap px-3 py-1 rounded-md text-sm ${
                            hasPermission('declined_work_orders', 'edit')
                              ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          Resubmit for Manager Approval
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
                state.currentPage === page ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
      <Modal
        isOpen={state.isViewModalOpen}
        onClose={() => setState((prev) => ({ ...prev, isViewModalOpen: false, selectedWO: null }))}
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
              <h3 className="text-lg font-medium text-black">Purchase Order Details</h3>
              <p><strong>Series Number:</strong> {getQuotationDetails(state.selectedWO).po_series_number}</p>
              <p><strong>Client PO Number:</strong> {getQuotationDetails(state.selectedWO).client_po_number}</p>
              <p><strong>Order Type:</strong> {getQuotationDetails(state.selectedWO).order_type}</p>
              <p><strong>Created:</strong> {getQuotationDetails(state.selectedWO).created_at}</p>
              <p><strong>PO File:</strong> {getQuotationDetails(state.selectedWO).po_file ? (
                <a href={getQuotationDetails(state.selectedWO).po_file} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">View File</a>
              ) : 'N/A'}</p>
              <p><strong>Assigned Sales Person:</strong> {getQuotationDetails(state.selectedWO).assigned_sales_person}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-black">Work Order Details</h3>
              <p><strong>Work Order Number:</strong> {state.selectedWO.wo_number || 'N/A'}</p>
              <p><strong>Work Order Type:</strong> {state.selectedWO.wo_type || 'N/A'}</p>
              <p><strong>Date Received:</strong> {state.selectedWO.date_received ? new Date(state.selectedWO.date_received).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Expected Completion Date:</strong> {state.selectedWO.expected_completion_date ? new Date(state.selectedWO.expected_completion_date).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Onsite or Lab:</strong> {state.selectedWO.onsite_or_lab || 'N/A'}</p>
              <p><strong>Site Location:</strong> {state.selectedWO.site_location || 'N/A'}</p>
              <p><strong>Remarks:</strong> {state.selectedWO.remarks || 'N/A'}</p>
              <p><strong>Status:</strong> {state.selectedWO.status || 'N/A'}</p>
              <p><strong>Decline Reason:</strong> {state.selectedWO.decline_reason || 'N/A'}</p>
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
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Unit Price</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Range</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Assigned To</th>
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
                          <td className="border p-2 whitespace-nowrap">{state.itemsList.find((i) => i.id === item.item)?.name || 'N/A'}</td>
                          <td className="border p-2 whitespace-nowrap">{item.quantity || 'N/A'}</td>
                          <td className="border p-2 whitespace-nowrap">{state.units.find((u) => u.id === item.unit)?.name || 'N/A'}</td>
                          <td className="border p-2 whitespace-nowrap">{item.unit_price ? Number(item.unit_price).toFixed(2) : 'N/A'}</td>
                          <td className="border p-2 whitespace-nowrap">{item.range || 'N/A'}</td>
                          <td className="border p-2 whitespace-nowrap">{getAssignedTechnicians([item])}</td>
                          <td className="border p-2 whitespace-nowrap">{item.certificate_uut_label || 'N/A'}</td>
                          <td className="border p-2 whitespace-nowrap">{item.certificate_number || 'N/A'}</td>
                          <td className="border p-2 whitespace-nowrap">{item.calibration_date ? new Date(item.calibration_date).toLocaleDateString() : 'N/A'}</td>
                          <td className="border p-2 whitespace-nowrap">{item.calibration_due_date ? new Date(item.calibration_due_date).toLocaleDateString() : 'N/A'}</td>
                          <td className="border p-2 whitespace-nowrap">{item.uuc_serial_number || 'N/A'}</td>
                          <td className="border p-2 whitespace-nowrap">
                            {item.certificate_file ? (
                              <a href={item.certificate_file} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                                View Certificate
                              </a>
                            ) : (
                              'N/A'
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
        isOpen={state.isDeclineModalOpen}
        onClose={() => setState((prev) => ({ ...prev, isDeclineModalOpen: false, selectedWO: null, declineReason: '' }))}
        title="Update Decline Reason"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Decline Reason</label>
            <InputField
              type="text"
              value={state.declineReason}
              onChange={(e) => setState((prev) => ({ ...prev, declineReason: e.target.value }))}
              className="w-full"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              onClick={handleDecline}
              disabled={!state.declineReason || !hasPermission('declined_work_orders', 'edit')}
              className={`px-4 py-2 rounded-md ${
                state.declineReason && hasPermission('declined_work_orders', 'edit')
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Submit
            </Button>
            <Button
              onClick={() => setState((prev) => ({ ...prev, isDeclineModalOpen: false, selectedWO: null, declineReason: '' }))}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DeclinedWorkOrders;