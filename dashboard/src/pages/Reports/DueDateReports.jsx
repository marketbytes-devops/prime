import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../../helpers/apiClient';
import InputField from '../../components/InputField';
import Loading from '../../components/Loading'; 

const DueDateReports = () => {
  const [state, setState] = useState({
    rfqs: [],
    quotations: [],
    purchaseOrders: [],
    workOrders: [],
    deliveryNotes: [],
    invoices: [],
    channels: [],
    itemsList: [],
    dueDateItems: [],
    searchTerm: '',
    sortBy: 'due_date',
    sortOrder: 'asc',
    dateFromFilter: '',
    dateToFilter: '',
    currentPage: 1,
    itemsPerPage: 20,
    isLoading: true,
  });

  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);

  const calculateDaysRemaining = (dueDate) => {
    if (!dueDate) return null;
    const today = new Date('2025-10-27'); 
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Get status for a due date
  const getDueDateStatus = (daysLeft) => {
    if (daysLeft < 0) return { status: 'OVERDUE', color: 'bg-red-100 text-red-800 border-red-300' };
    if (daysLeft === 0) return { status: 'TODAY', color: 'bg-orange-100 text-orange-800 border-orange-300' };
    if (daysLeft <= 3) return { status: 'CRITICAL', color: 'bg-orange-100 text-orange-800 border-orange-300' };
    if (daysLeft <= 7) return { status: 'URGENT', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
    return { status: 'OK', color: 'bg-green-100 text-green-800 border-green-300' };
  };

  // Format days text
  const formatDaysText = (daysLeft) => {
    if (daysLeft < 0) return `${Math.abs(daysLeft)} days overdue`;
    if (daysLeft === 0) return 'Today';
    return `${daysLeft} days remaining`;
  };

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

  // Check if DN is complete (has signed delivery note)
  const isDNComplete = (deliveryNote) => {
    return deliveryNote && deliveryNote.signed_delivery_note;
  };

  const fetchData = async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      const [rfqRes, quotationRes, poRes, woRes, dnRes, invoiceRes, channelRes, itemsRes] = await Promise.all([
        apiClient.get('rfqs/'),
        apiClient.get('quotations/'),
        apiClient.get('purchase-orders/'),
        apiClient.get('work-orders/'),
        apiClient.get('delivery-notes/'),
        apiClient.get('invoices/'),
        apiClient.get('channels/'),
        apiClient.get('items/'),
      ]);

      const rfqs = rfqRes.data || [];
      const quotations = quotationRes.data || [];
      const purchaseOrders = poRes.data || [];
      const workOrders = woRes.data || [];
      const deliveryNotes = dnRes.data.filter((dn) => dn.dn_number && !dn.dn_number.startsWith('TEMP-DN')) || [];
      const invoices = invoiceRes.data || [];
      const channels = channelRes.data || [];
      const itemsList = itemsRes.data || [];

      // Build flattened due date items from Work Orders with complete DNs
      const dueDateItems = [];

      workOrders.forEach((workOrder) => {
        // Find related Purchase Order
        const purchaseOrder = purchaseOrders.find((po) => po.id === workOrder.purchase_order);
        
        // Find related Quotation through Purchase Order
        const quotation = purchaseOrder ? quotations.find((q) => q.id === purchaseOrder.quotation) : null;
        
        // Find related RFQ through Quotation
        const rfq = quotation ? rfqs.find((r) => r.id === quotation.rfq) : null;
        
        // Find related Delivery Notes
        const relatedDNs = deliveryNotes.filter((dn) => dn.work_order_id === workOrder.id);

        // ONLY include signed/complete DNs
        relatedDNs.forEach((dn) => {
          if (isDNComplete(dn)) {
            const relatedInvoices = invoices.filter((inv) => inv.delivery_note === dn.id);

            // Include if there's at least one related invoice or even without (as per reports logic)
            if (relatedInvoices.length > 0 || true) { 
              // Flatten items with due dates
              workOrder.items?.forEach((item) => {
                if (item.calibration_due_date) {
                  const itemName = itemsList.find((i) => i.id === item.item)?.name || 'N/A';
                  const daysLeft = calculateDaysRemaining(item.calibration_due_date);
                  const status = getDueDateStatus(daysLeft);
                  const daysText = formatDaysText(daysLeft);

                  dueDateItems.push({
                    id: `${workOrder.id}-${item.id || 'unknown'}`,
                    companyName: quotation?.company_name || 'N/A',
                    woNumber: workOrder.wo_number || 'N/A',
                    itemName,
                    serialNumber: item.uuc_serial_number || 'N/A',
                    dueDate: item.calibration_due_date,
                    daysLeft,
                    status,
                    daysText,
                    rfq,
                    quotation,
                    purchaseOrder,
                    workOrder,
                    deliveryNote: dn,
                    invoice: relatedInvoices[0] || null, 
                    channel: rfq ? channels.find((c) => c.id === rfq.rfq_channel) : null,
                  });
                }
              });
            }
          }
        });
      });

      setState((prev) => ({
        ...prev,
        rfqs,
        quotations,
        purchaseOrders,
        workOrders,
        deliveryNotes,
        invoices,
        channels,
        itemsList,
        dueDateItems,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load due date reports.');
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    if (!isLoadingPermissions) {
      fetchData();
    }
  }, [isLoadingPermissions]);

  // Refresh every minute
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 60000);
    return () => clearInterval(interval);
  }, [isLoadingPermissions]);

  const filteredData = state.dueDateItems
    .filter((item) => {
      const searchLower = state.searchTerm.toLowerCase();
      const matchesSearch =
        item.companyName.toLowerCase().includes(searchLower) ||
        item.woNumber.toLowerCase().includes(searchLower) ||
        item.itemName.toLowerCase().includes(searchLower) ||
        item.serialNumber.toLowerCase().includes(searchLower);

      // Date range filter on due date
      if (state.dateFromFilter || state.dateToFilter) {
        const dueDateObj = new Date(item.dueDate);
        const fromDate = state.dateFromFilter ? new Date(state.dateFromFilter) : null;
        const toDate = state.dateToFilter ? new Date(state.dateToFilter) : null;

        if (fromDate && dueDateObj < fromDate) return false;
        if (toDate) {
          const nextDay = new Date(toDate);
          nextDay.setDate(nextDay.getDate() + 1);
          if (dueDateObj >= nextDay) return false;
        }
      }

      return matchesSearch;
    })
    .sort((a, b) => {
      if (state.sortBy === 'due_date') {
        const dateA = new Date(a.dueDate);
        const dateB = new Date(b.dueDate);
        return state.sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (state.sortBy === 'days_left') {
        return state.sortOrder === 'asc' ? a.daysLeft - b.daysLeft : b.daysLeft - a.daysLeft;
      } else if (state.sortBy === 'status') {
        const statusOrder = { OVERDUE: 0, TODAY: 1, CRITICAL: 2, URGENT: 3, OK: 4 };
        const orderA = statusOrder[a.status.status] || 5;
        const orderB = statusOrder[b.status.status] || 5;
        return state.sortOrder === 'asc' ? orderA - orderB : orderB - orderA;
      } else if (state.sortBy === 'company') {
        return state.sortOrder === 'asc'
          ? a.companyName.localeCompare(b.companyName)
          : b.companyName.localeCompare(a.companyName);
      }
      return 0;
    });

  const totalPages = Math.ceil(filteredData.length / state.itemsPerPage);
  const startIndex = (state.currentPage - 1) * state.itemsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + state.itemsPerPage);
  
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

  if (isLoadingPermissions || state.isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loading />
      </div>
    );
  }

  if (!hasPermission('due_date_reports', 'view')) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg font-semibold text-red-600">You do not have permission to view due date reports.</div>
      </div>
    );
  }

  return (
    <div className="mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Due Date Reports</h1>
      
      <div className="bg-white p-4 space-y-4 rounded-md shadow w-full">
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <InputField
              type="text"
              placeholder="Search by Company, WO, Item, or Serial..."
              value={state.searchTerm}
              onChange={(e) => setState((prev) => ({ ...prev, searchTerm: e.target.value, currentPage: 1 }))}
              className="w-full p-2 border rounded focus:outline-indigo-500"
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={state.sortBy}
              onChange={(e) => setState((prev) => ({ ...prev, sortBy: e.target.value, currentPage: 1 }))}
              className="w-full p-2 border rounded focus:outline-indigo-500"
            >
              <option value="due_date">Due Date</option>
              <option value="days_left">Days Left</option>
              <option value="status">Status</option>
              <option value="company">Company Name</option>
            </select>
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
            <select
              value={state.sortOrder}
              onChange={(e) => setState((prev) => ({ ...prev, sortOrder: e.target.value, currentPage: 1 }))}
              className="w-full p-2 border rounded focus:outline-indigo-500"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date (Due)</label>
            <InputField
              type="date"
              value={state.dateFromFilter}
              onChange={(e) => setState((prev) => ({ ...prev, dateFromFilter: e.target.value, currentPage: 1 }))}
              className="w-full p-2 border rounded focus:outline-indigo-500"
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date (Due)</label>
            <InputField
              type="date"
              value={state.dateToFilter}
              onChange={(e) => setState((prev) => ({ ...prev, dateToFilter: e.target.value, currentPage: 1 }))}
              className="w-full p-2 border rounded focus:outline-indigo-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setState((prev) => ({ ...prev, dateFromFilter: '', dateToFilter: '', currentPage: 1 }))}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
            >
              Clear Dates
            </button>
          </div>
        </div>

        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Total Items with Due Dates:</strong> {filteredData.length} | <strong>Page:</strong> {state.currentPage} of {totalPages || 1}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Sl No</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Company Name</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">WO Number</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Item Name</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Serial Number</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Due Date</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Days Remaining</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody>
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="border p-2 text-center text-gray-500">
                    No items with due dates found.
                  </td>
                </tr>
              ) : (
                currentData.map((item, index) => (
                  <tr key={item.id} className={item.status.status === 'OVERDUE' ? 'bg-red-50' : ''}>
                    <td className="border p-2 whitespace-nowrap">{startIndex + index + 1}</td>
                    <td className="border p-2 whitespace-nowrap">{item.companyName}</td>
                    <td className="border p-2 whitespace-nowrap">{item.woNumber}</td>
                    <td className="border p-2 whitespace-nowrap">{item.itemName}</td>
                    <td className="border p-2 whitespace-nowrap">{item.serialNumber}</td>
                    <td className="border p-2 whitespace-nowrap">
                      {new Date(item.dueDate).toLocaleDateString()}
                    </td>
                    <td className="border p-2 whitespace-nowrap">{item.daysText}</td>
                    <td className="border p-2 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-md text-xs border ${item.status.color}`}>
                        {item.status.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <button
              onClick={handlePrev}
              disabled={state.currentPage === 1}
              className={`px-3 py-1 rounded-md text-sm ${
                state.currentPage === 1
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Prev
            </button>
            {pageNumbers.map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 rounded-md text-sm min-w-fit whitespace-nowrap ${
                  state.currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={handleNext}
              disabled={state.currentPage === totalPages}
              className={`px-3 py-1 rounded-md text-sm ${
                state.currentPage === totalPages
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DueDateReports;