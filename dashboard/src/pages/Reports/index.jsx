import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../../helpers/apiClient';
import InputField from '../../components/InputField';
import Button from '../../components/Button';

const Reports = () => {
  const [state, setState] = useState({
    rfqs: [],
    quotations: [],
    purchaseOrders: [],
    workOrders: [],
    deliveryNotes: [],
    invoices: [],
    channels: [],
    itemsList: [],
    reportData: [],
    searchTerm: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
    dateFromFilter: '',
    dateToFilter: '',
    currentPage: 1,
    itemsPerPage: 20,
    isLoading: true,
    expandedRows: {},
  });

  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);

  // Get ALL unique calibration due dates from work order items
  const getAllCalibrationDueDates = (workOrder) => {
    if (!workOrder?.items) return [];
    const dates = workOrder.items
      .map(item => item.calibration_due_date)
      .filter(date => date);
    
    return [...new Set(dates)].sort((a, b) => new Date(a) - new Date(b));
  };

  // Calculate days remaining for a specific date
  const calculateDaysRemaining = (dueDate) => {
    if (!dueDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Get the earliest expired due date
  const getEarliestExpiredDate = (workOrder) => {
    if (!workOrder?.items) return null;
    const expiredItems = workOrder.items.filter(item => {
      const daysLeft = calculateDaysRemaining(item.calibration_due_date);
      return daysLeft < 0 && item.calibration_due_date;
    });
    if (expiredItems.length === 0) return null;
    return expiredItems.reduce((earliest, item) => {
      const date = new Date(item.calibration_due_date);
      const currentEarliest = earliest ? new Date(earliest) : date;
      return date < currentEarliest ? date : currentEarliest;
    }, null);
  };

  // Determine overall status (worst-case scenario)
  const getOverallStatus = (workOrder) => {
    const dueDates = getAllCalibrationDueDates(workOrder);
    if (dueDates.length === 0) return { status: 'N/A', color: 'bg-gray-100 text-gray-600 border-gray-300' };

    let hasExpired = false;
    let hasUrgent = false;
    let hasCritical = false;

    dueDates.forEach(date => {
      const daysLeft = calculateDaysRemaining(date);
      if (daysLeft < 0) hasExpired = true;
      else if (daysLeft <= 3) hasCritical = true;
      else if (daysLeft <= 7) hasUrgent = true;
    });

    if (hasExpired) return { status: 'EXPIRED', color: 'bg-red-100 text-red-800 border-red-300 font-semibold' };
    if (hasCritical) return { status: 'CRITICAL (≤3 days)', color: 'bg-orange-100 text-orange-800 border-orange-300 font-semibold' };
    if (hasUrgent) return { status: 'URGENT (≤7 days)', color: 'bg-yellow-100 text-yellow-800 border-yellow-300 font-semibold' };
    return { status: 'OK', color: 'bg-green-100 text-green-800 border-green-300' };
  };

  // Format all calibration dates with days remaining
  const formatCalibrationDates = (workOrder) => {
    const dueDates = getAllCalibrationDueDates(workOrder);
    if (dueDates.length === 0) return 'N/A';

    return dueDates.map(date => {
      const daysLeft = calculateDaysRemaining(date);
      let daysText = '';
      if (daysLeft < 0) daysText = 'EXPIRED';
      else if (daysLeft === 0) daysText = 'TODAY';
      else daysText = `${daysLeft} days`;
      
      return `${new Date(date).toLocaleDateString()} (${daysText})`;
    }).join('\n');
  };

  // Check if DN is complete (has signed delivery note)
  const isDNComplete = (deliveryNote) => {
    return deliveryNote && deliveryNote.signed_delivery_note;
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

      // Build report data starting from Work Orders - ONLY with signed DNs
      const reportData = [];

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

            if (relatedInvoices.length === 0) {
              // DN without invoice
              reportData.push({
                id: `dn-${dn.id}`,
                rfq,
                quotation,
                purchaseOrder,
                workOrder,
                deliveryNote: dn,
                invoice: null,
                channel: rfq ? channels.find((c) => c.id === rfq.rfq_channel) : null,
              });
            } else {
              // Complete chain with invoice(s)
              relatedInvoices.forEach((invoice) => {
                reportData.push({
                  id: `inv-${invoice.id}`,
                  rfq,
                  quotation,
                  purchaseOrder,
                  workOrder,
                  deliveryNote: dn,
                  invoice,
                  channel: rfq ? channels.find((c) => c.id === rfq.rfq_channel) : null,
                });
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
        reportData,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load report data.');
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    if (!isLoadingPermissions) {
      fetchData();
    }
  }, [isLoadingPermissions]);

  // Refresh status every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => ({
        ...prev,
      }));
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleViewFile = (url, fileName) => {
    if (url) {
      window.open(url, '_blank');
    } else {
      toast.error(`No ${fileName} available.`);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      raised: 'bg-blue-100 text-blue-800 border-blue-300',
      processed: 'bg-green-100 text-green-800 border-green-300',
    };
    return badges[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const filteredData = state.reportData
    .filter((row) => {
      const searchLower = state.searchTerm.toLowerCase();
      const matchesSearch =
        row.rfq?.rfq_number?.toLowerCase().includes(searchLower) ||
        row.quotation?.series_number?.toLowerCase().includes(searchLower) ||
        row.quotation?.company_name?.toLowerCase().includes(searchLower) ||
        row.purchaseOrder?.series_number?.toLowerCase().includes(searchLower) ||
        row.workOrder?.wo_number?.toLowerCase().includes(searchLower) ||
        row.deliveryNote?.dn_number?.toLowerCase().includes(searchLower);

      // Date range filter
      if (state.dateFromFilter || state.dateToFilter) {
        const createdDate = new Date(row.workOrder?.created_at);
        const fromDate = state.dateFromFilter ? new Date(state.dateFromFilter) : null;
        const toDate = state.dateToFilter ? new Date(state.dateToFilter) : null;

        if (fromDate && createdDate < fromDate) return false;
        if (toDate) {
          const nextDay = new Date(toDate);
          nextDay.setDate(nextDay.getDate() + 1);
          if (createdDate >= nextDay) return false;
        }
      }

      return matchesSearch;
    })
    .sort((a, b) => {
      if (state.sortBy === 'created_at') {
        const dateA = new Date(a.workOrder?.created_at || 0);
        const dateB = new Date(b.workOrder?.created_at || 0);
        return state.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      } else if (state.sortBy === 'calibration_due') {
        const datesA = getAllCalibrationDueDates(a.workOrder);
        const datesB = getAllCalibrationDueDates(b.workOrder);
        const dateA = datesA.length > 0 ? new Date(datesA[0]) : new Date(0);
        const dateB = datesB.length > 0 ? new Date(datesB[0]) : new Date(0);
        return state.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      } else if (state.sortBy === 'status') {
        const statusOrder = { EXPIRED: 0, 'CRITICAL (≤3 days)': 1, 'URGENT (≤7 days)': 2, OK: 3, 'N/A': 4 };
        const statusA = getOverallStatus(a.workOrder).status;
        const statusB = getOverallStatus(b.workOrder).status;
        const orderA = statusOrder[statusA] || 5;
        const orderB = statusOrder[statusB] || 5;
        return state.sortOrder === 'desc' ? orderB - orderA : orderA - orderB;
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
        <div className="text-lg font-semibold">Loading reports...</div>
      </div>
    );
  }

  if (!hasPermission('reports', 'view')) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg font-semibold text-red-600">You do not have permission to view reports.</div>
      </div>
    );
  }

  return (
    <div className="mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Complete Order Reports</h1>
      
      <div className="bg-white p-4 space-y-4 rounded-md shadow w-full">
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <InputField
              type="text"
              placeholder="Search by RFQ, Quotation, Company, PO, WO, or DN..."
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
              <option value="created_at">Creation Date</option>
              <option value="calibration_due">Calibration Due Date</option>
              <option value="status">Calibration Status</option>
            </select>
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
            <select
              value={state.sortOrder}
              onChange={(e) => setState((prev) => ({ ...prev, sortOrder: e.target.value, currentPage: 1 }))}
              className="w-full p-2 border rounded focus:outline-indigo-500"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <InputField
              type="date"
              value={state.dateFromFilter}
              onChange={(e) => setState((prev) => ({ ...prev, dateFromFilter: e.target.value, currentPage: 1 }))}
              className="w-full p-2 border rounded focus:outline-indigo-500"
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <InputField
              type="date"
              value={state.dateToFilter}
              onChange={(e) => setState((prev) => ({ ...prev, dateToFilter: e.target.value, currentPage: 1 }))}
              className="w-full p-2 border rounded focus:outline-indigo-500"
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => setState((prev) => ({ ...prev, dateFromFilter: '', dateToFilter: '', currentPage: 1 }))}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
            >
              Clear Dates
            </Button>
          </div>
        </div>

        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Total Work Orders:</strong> {filteredData.length} | <strong>Page:</strong> {state.currentPage} of {totalPages || 1}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Sl No</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">RFQ Number</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Company Name</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Channel</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Quotation Number</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">PO Number</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">WO Number</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">DN Number</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Calibration Due Dates</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Calibration Status</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Last Days of Contact</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Invoice Status</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Final Invoice</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Payment Slip</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Created Date</th>
              </tr>
            </thead>
            <tbody>
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan="15" className="border p-2 text-center text-gray-500">
                    No completed work orders found.
                  </td>
                </tr>
              ) : (
                currentData.map((row, index) => {
                  const overallStatus = getOverallStatus(row.workOrder);
                  const isExpanded = state.expandedRows[row.id];
                  const earliestExpiredDate = getEarliestExpiredDate(row.workOrder);
                  const daysSinceEarliestExpired = earliestExpiredDate ? -calculateDaysRemaining(earliestExpiredDate) : null;

                  return (
                    <React.Fragment key={row.id}>
                      <tr className="border hover:bg-gray-50">
                        <td className="border p-2 whitespace-nowrap">
                          <span>{startIndex + index + 1}</span>
                        </td>
                        <td className="border p-2 whitespace-nowrap">{row.rfq?.rfq_number || 'N/A'}</td>
                        <td className="border p-2 whitespace-nowrap">{row.quotation?.company_name || 'N/A'}</td>
                        <td className="border p-2 whitespace-nowrap">{row.channel?.channel_name || 'N/A'}</td>
                        <td className="border p-2 whitespace-nowrap">{row.quotation?.series_number || 'N/A'}</td>
                        <td className="border p-2 whitespace-nowrap">{row.purchaseOrder?.series_number || 'N/A'}</td>
                        <td className="border p-2 whitespace-nowrap">{row.workOrder?.wo_number || 'N/A'}</td>
                        <td className="border p-2 whitespace-nowrap">{row.deliveryNote?.dn_number || 'N/A'}</td>
                        
                        {/* Calibration Due Dates Column */}
                        <td className="border p-2 whitespace-nowrap">
                          <Button
                            onClick={() => setState((prev) => ({
                              ...prev,
                              expandedRows: {
                                ...prev.expandedRows,
                                [row.id]: !prev.expandedRows[row.id]
                              }
                            }))}
                            className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                          >
                            {isExpanded ? 'Hide' : 'Show'} Calibration Due Dates
                          </Button>
                        </td>

                        {/* Calibration Status Column */}
                        <td className="border p-2 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-md text-xs border ${overallStatus.color}`}>
                            {overallStatus.status}
                          </span>
                        </td>

                        {/* Last Days of Contact Column */}
                        <td className="border p-2 whitespace-nowrap">
                          {overallStatus.status === 'EXPIRED' && daysSinceEarliestExpired ? (
                            <span className={`px-2 py-1 rounded-md text-xs border bg-red-100 text-red-800`}>
                              Day {daysSinceEarliestExpired}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">N/A</span>
                          )}
                        </td>

                        <td className="border p-2 whitespace-nowrap">
                          {row.invoice ? (
                            <span className={`px-2 py-1 rounded-md text-xs border ${getStatusBadge(row.invoice.invoice_status)}`}>
                              {row.invoice.invoice_status?.charAt(0).toUpperCase() + row.invoice.invoice_status?.slice(1) || 'N/A'}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">No Invoice</span>
                          )}
                        </td>

                        <td className="border p-2 whitespace-nowrap">
                          {row.invoice?.final_invoice_file ? (
                            <Button
                              onClick={() => handleViewFile(row.invoice.final_invoice_file, 'Final Invoice')}
                              className="px-3 py-1 rounded-md text-sm bg-indigo-600 text-white hover:bg-indigo-700"
                            >
                              View Invoice
                            </Button>
                          ) : (
                            <span className="text-gray-400 text-xs">Not Available</span>
                          )}
                        </td>

                        <td className="border p-2 whitespace-nowrap">
                          {row.invoice?.processed_certificate_file ? (
                            <Button
                              onClick={() => handleViewFile(row.invoice.processed_certificate_file, 'Payment Slip')}
                              className="px-3 py-1 rounded-md text-sm bg-teal-600 text-white hover:bg-teal-700"
                            >
                              View Slip
                            </Button>
                          ) : (
                            <span className="text-gray-400 text-xs">Not Available</span>
                          )}
                        </td>

                        <td className="border p-2 whitespace-nowrap">
                          {row.workOrder?.created_at ? new Date(row.workOrder.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>

                      {/* Expanded Row - Show Calibration Due Dates */}
                      {isExpanded && (
                        <tr className="border bg-blue-50">
                          <td colSpan="15" className="border p-4">
                            <div className="ml-8">
                              <h4 className="font-semibold text-gray-700 mb-3">Calibration Due Dates for Items in this Work Order:</h4>
                              {row.workOrder?.items && row.workOrder.items.length > 0 ? (
                                <div className="space-y-2">
                                  {row.workOrder.items.map((item, itemIdx) => {
                                    const itemName = state.itemsList.find((i) => i.id === item.item)?.name || 'N/A';
                                    const daysLeft = calculateDaysRemaining(item.calibration_due_date);
                                    let daysText = '';
                                    let badgeClass = '';
                                    if (daysLeft < 0) {
                                      const daysPassed = -daysLeft;
                                      daysText = `Day ${daysPassed}`;
                                      badgeClass = 'bg-red-100 text-red-800 border-red-300';
                                    } else if (daysLeft === 0) {
                                      daysText = 'TODAY';
                                      badgeClass = 'bg-orange-100 text-orange-800 border-orange-300';
                                    } else if (daysLeft <= 3) {
                                      daysText = `${daysLeft} days`;
                                      badgeClass = 'bg-orange-100 text-orange-800 border-orange-300';
                                    } else if (daysLeft <= 7) {
                                      daysText = `${daysLeft} days`;
                                      badgeClass = 'bg-yellow-100 text-yellow-800 border-yellow-300';
                                    } else {
                                      daysText = `${daysLeft} days`;
                                      badgeClass = 'bg-green-100 text-green-800 border-green-300';
                                    }

                                    return (
                                      <div key={itemIdx} className="flex items-center gap-4 p-2 bg-white border border-gray-200 rounded">
                                        <span className="font-medium text-gray-700 min-w-[200px]">{itemName}</span>
                                        <span className="text-gray-600">
                                          Due: {item.calibration_due_date ? new Date(item.calibration_due_date).toLocaleDateString() : 'N/A'}
                                        </span>
                                        <span className={`px-2 py-1 rounded text-xs border ${badgeClass}`}>
                                          {daysText}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-gray-500">No items found.</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
    </div>
  );
};

export default Reports;