import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../../helpers/apiClient';
import InputField from '../../../components/InputField';
import Button from '../../../components/Button';
import Modal from '../../../components/Modal';
import Template1 from '../../../components/Templates/RFQ/Template1';

const ViewQuotation = () => {
  const navigate = useNavigate();
  const [state, setState] = useState({
    quotations: [],
    channels: [],
    teamMembers: [],
    itemsList: [],
    units: [],
    searchTerm: '',
    sortBy: 'company_name',
    currentPage: 1,
    itemsPerPage: 20,
    isModalOpen: false,
    selectedQuotation: null,
    isPoModalOpen: false,
    isFullOrderModalOpen: false,
    isUploadPoModalOpen: false,
    partialOrders: [],
    poUploads: {},
    fullOrderPo: {
      clientPoNumber: '',
      poFile: null,
      poStatus: 'not_available',
    },
    fullOrderErrors: { clientPoNumber: '', poFile: '' },
    isNotApprovedModalOpen: false,
    notApprovedReason: '',
    selectedQuotationId: null,
  });

  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ref for react-to-print
  const componentRef = useRef();

  // Use react-to-print hook
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  // Open preview modal
  const openPreview = (quotation) => {
    setState((prev) => ({
      ...prev,
      isModalOpen: true,
      selectedQuotation: quotation,
    }));
  };

  // Fetch profile and permissions
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

  // Check permissions
  const hasPermission = (page, action) => {
    if (isSuperadmin) return true;
    const perm = permissions.find((p) => p.page === page);
    return perm && perm[`can_${action}`];
  };

  // Fetch quotations and related data
  const fetchQuotations = async () => {
    try {
      const [quotationsRes, channelsRes, teamsRes, itemsRes, unitsRes] = await Promise.all([
        apiClient.get('/quotations/'),
        apiClient.get('/channels/'),
        apiClient.get('/teams/'),
        apiClient.get('/items/'),
        apiClient.get('/units/'),
      ]);

      const quotationsWithPOs = await Promise.all(
        quotationsRes.data.map(async (quotation) => {
          try {
            const poRes = await apiClient.get(`/purchase-orders/?quotation_id=${quotation.id}`);
            return { ...quotation, purchase_orders: poRes.data || [] };
          } catch (error) {
            console.error(`Error fetching POs for quotation ${quotation.id}:`, error);
            return { ...quotation, purchase_orders: [] };
          }
        }),
      );

      setState((prev) => ({
        ...prev,
        quotations: quotationsWithPOs || [],
        channels: channelsRes.data || [],
        teamMembers: teamsRes.data || [],
        itemsList: itemsRes.data || [],
        units: unitsRes.data || [],
      }));
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load quotations.');
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  // Delete quotation
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this quotation?')) {
      try {
        const quotationRes = await apiClient.get(`/quotations/${id}/`);
        const quotation = quotationRes.data;
        const rfqId = quotation.rfq;
        await apiClient.delete(`/quotations/${id}/`);
        if (rfqId) {
          try {
            const rfqRes = await apiClient.get(`/rfqs/${rfqId}/`);
            const rfq = rfqRes.data;
            if (rfq.rfq_status === 'Completed') {
              const payload = {
                rfq_status: 'Processing',
                items: rfq.items || [],
              };
              await apiClient.patch(`/rfqs/${rfqId}/`, payload);
            }
          } catch (error) {
            console.error(`Error updating RFQ ${rfqId} status:`, error);
            toast.error('Failed to update associated RFQ status.');
          }
        }
        await fetchQuotations();
        toast.success('Quotation deleted successfully!');
      } catch (error) {
        console.error('Error deleting quotation:', error);
        toast.error('Failed to delete quotation.');
      }
    }
  };

  // Convert to PO
  const handleConvertToPO = (id) => {
    setState((prev) => ({
      ...prev,
      isPoModalOpen: true,
      selectedQuotation: prev.quotations.find((q) => q.id === id),
    }));
  };

  // Upload PO
  const handleUploadPO = (id) => {
    const quotation = state.quotations.find((q) => q.id === id);
    const currentPartialOrders = quotation.purchase_orders.filter((po) => po.order_type === 'partial');
    setState((prev) => ({
      ...prev,
      isUploadPoModalOpen: true,
      selectedQuotation: quotation,
      partialOrders: currentPartialOrders,
      poUploads: currentPartialOrders.reduce(
        (acc, po) => ({
          ...acc,
          [po.id]: {
            clientPoNumber: po.client_po_number || '',
            poFile: null,
            poStatus: po.client_po_number || po.po_file ? 'available' : 'not_available',
            errors: { clientPoNumber: '', poFile: '' },
          },
        }),
        {},
      ),
    }));
  };

  // Handle PO option
  const handlePoOption = (option) => {
    if (option === 'full') {
      setState((prev) => ({
        ...prev,
        isPoModalOpen: false,
        isFullOrderModalOpen: true,
      }));
    } else if (option === 'partial') {
      navigate('/pre-job/partial-order-selection', {
        state: {
          quotationData: state.selectedQuotation,
          itemsList: state.itemsList,
        },
      });
      setState((prev) => ({ ...prev, isPoModalOpen: false }));
    }
  };

  // Validate full order
  const validateFullOrder = () => {
    let isValid = true;
    const errors = { clientPoNumber: '', poFile: '' };
    if (state.fullOrderPo.poStatus === 'available') {
      if (!state.fullOrderPo.clientPoNumber.trim()) {
        errors.clientPoNumber = 'Client PO Number is required';
        isValid = false;
      }
      if (!state.fullOrderPo.poFile) {
        errors.poFile = 'PO File is required';
        isValid = false;
      }
    }
    setState((prev) => ({ ...prev, fullOrderErrors: errors }));
    return isValid;
  };

  // Submit full order
  const handleFullOrderSubmit = async () => {
    if (state.fullOrderPo.poStatus === 'available' && !validateFullOrder()) {
      return;
    }
    try {
      const formData = new FormData();
      formData.append('quotation', state.selectedQuotation.id);
      formData.append('order_type', 'full');
      if (state.fullOrderPo.poStatus === 'available') {
        formData.append('client_po_number', state.fullOrderPo.clientPoNumber);
        formData.append('po_file', state.fullOrderPo.poFile);
      }
      await apiClient.post('/purchase-orders/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchQuotations();
      setState((prev) => ({
        ...prev,
        isFullOrderModalOpen: false,
        selectedQuotation: null,
        fullOrderPo: {
          clientPoNumber: '',
          poFile: null,
          poStatus: 'not_available',
        },
        fullOrderErrors: { clientPoNumber: '', poFile: '' },
      }));
      toast.success('Full Purchase Order created successfully.');
    } catch (error) {
      console.error('Error creating PO:', error);
      toast.error('Failed to create Full Purchase Order.');
    }
  };

  // Validate partial order
  const validatePartialOrder = (poId) => {
    let isValid = true;
    const errors = { clientPoNumber: '', poFile: '' };
    if (state.poUploads[poId]?.poStatus === 'available') {
      if (!state.poUploads[poId]?.clientPoNumber.trim()) {
        errors.clientPoNumber = 'Client PO Number is required';
        isValid = false;
      }
      if (!state.poUploads[poId]?.poFile) {
        errors.poFile = 'PO File is required';
        isValid = false;
      }
    }
    setState((prev) => ({
      ...prev,
      poUploads: {
        ...prev.poUploads,
        [poId]: { ...prev.poUploads[poId], errors },
      },
    }));
    return isValid;
  };

  // Submit PO upload
  const handlePoUploadSubmit = async () => {
    let allValid = true;
    for (const poId of Object.keys(state.poUploads)) {
      if (!validatePartialOrder(poId)) {
        allValid = false;
      }
    }
    if (!allValid) {
      return;
    }
    try {
      for (const poId of Object.keys(state.poUploads)) {
        const { clientPoNumber, poFile, poStatus } = state.poUploads[poId];
        if (poStatus === 'available') {
          const formData = new FormData();
          formData.append('client_po_number', clientPoNumber);
          formData.append('po_file', poFile);
          await apiClient.patch(`/purchase-orders/${poId}/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } else if (poStatus === 'not_available') {
          const formData = new FormData();
          formData.append('client_po_number', '');
          formData.append('po_file', '');
          await apiClient.patch(`/purchase-orders/${poId}/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
      }
      await fetchQuotations();
      setState((prev) => ({
        ...prev,
        isUploadPoModalOpen: false,
        selectedQuotation: null,
        partialOrders: [],
        poUploads: {},
      }));
      toast.success('PO details uploaded successfully.');
    } catch (error) {
      console.error('Error uploading PO details:', error);
      toast.error('Failed to upload PO details.');
    }
  };

  // Handle status change
  const handleStatusChange = (id, value) => {
    if (value === 'Not Approved') {
      setState((prev) => ({
        ...prev,
        isNotApprovedModalOpen: true,
        selectedQuotationId: id,
        notApprovedReason: '',
      }));
    } else {
      handleUpdateField(id, 'quotation_status', value);
    }
  };

  // Submit not approved reason
  const handleNotApprovedSubmit = async () => {
    if (!state.notApprovedReason.trim()) {
      toast.error('Please provide a reason for non-approval.');
      return;
    }
    try {
      setIsSubmitting(true);
      await apiClient.patch(`/quotations/${state.selectedQuotationId}/update_status/`, {
        status: 'Not Approved',
        not_approved_reason_remark: state.notApprovedReason,
      });
      await fetchQuotations();
      setState((prev) => ({
        ...prev,
        isNotApprovedModalOpen: false,
        selectedQuotationId: null,
        notApprovedReason: '',
      }));
      toast.success('Quotation status updated to Not Approved.');
    } catch (error) {
      console.error('Error updating quotation status:', error);
      toast.error('Failed to update quotation status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close not approved modal
  const closeNotApprovedModal = () => {
    setState((prev) => ({
      ...prev,
      isNotApprovedModalOpen: false,
      selectedQuotationId: null,
      notApprovedReason: '',
    }));
    setIsSubmitting(false);
  };

  // Update field
  const handleUpdateField = async (id, field, value) => {
    try {
      const updatePayload = { [field]: value || null };
      await apiClient.patch(`/quotations/${id}/`, updatePayload);
      await fetchQuotations();
      toast.success(`${field} updated successfully!`);
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      toast.error(`Failed to update ${field}.`);
    }
  };

  // Check if PO is complete
  const isPoComplete = (quotation) => {
    if (!quotation.purchase_orders || quotation.purchase_orders.length === 0) {
      return false;
    }
    const hasFullOrder = quotation.purchase_orders.some((po) => po.order_type === 'full' && (po.client_po_number || po.po_file));
    if (hasFullOrder) {
      return true;
    }
    const partialOrders = quotation.purchase_orders.filter((po) => po.order_type === 'partial');
    if (partialOrders.length === 0) {
      return false;
    }
    return partialOrders.every((po) => po.client_po_number || po.po_file);
  };

  // Filter and sort quotations
  const filteredQuotations = state.quotations
    .filter(
      (quotation) =>
        (quotation.company_name || '').toLowerCase().includes(state.searchTerm.toLowerCase()) ||
        (quotation.id || '').toString().includes(state.searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      if (state.sortBy === 'company_name') {
        return (a.company_name || '').localeCompare(b.company_name || '');
      } else if (state.sortBy === 'rfq_id') {
        return (a.id || '').toString().localeCompare((b.id || '').toString());
      } else if (state.sortBy === 'created_at') {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      return 0;
    });

  // Pagination logic
  const totalPages = Math.ceil(filteredQuotations.length / state.itemsPerPage);
  const startIndex = (state.currentPage - 1) * state.itemsPerPage;
  const endIndex = startIndex + state.itemsPerPage;
  const currentQuotations = filteredQuotations.slice(startIndex, endIndex);
  const pageGroupSize = 3;
  const currentGroup = Math.floor((state.currentPage - 1) / pageGroupSize);
  const startPage = currentGroup * pageGroupSize + 1;
  const endPage = Math.min(startPage + pageGroupSize - 1, totalPages);
  const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  // Handle page change
  const handlePageChange = (page) => {
    setState((prev) => ({ ...prev, currentPage: page }));
  };

  // Handle next page
  const handleNext = () => {
    if (state.currentPage < totalPages) {
      setState((prev) => ({ ...prev, currentPage: prev.currentPage + 1 }));
    }
  };

  // Handle previous page
  const handlePrev = () => {
    if (state.currentPage > 1) {
      setState((prev) => ({ ...prev, currentPage: prev.currentPage - 1 }));
    }
  };

  // Check if quotation has both order types
  const hasBothOrderTypes = (quotation) => {
    if (!quotation.purchase_orders) return false;
    const hasFull = quotation.purchase_orders.some((po) => po.order_type === 'full');
    const hasPartial = quotation.purchase_orders.some((po) => po.order_type === 'partial');
    return hasFull && hasPartial;
  };

  // Close modals
  const closeModal = () => {
    setState((prev) => ({
      ...prev,
      isModalOpen: false,
      selectedQuotation: null,
    }));
  };

  const closePoModal = () => {
    setState((prev) => ({
      ...prev,
      isPoModalOpen: false,
      selectedQuotation: null,
    }));
  };

  const closeFullOrderModal = () => {
    setState((prev) => ({
      ...prev,
      isFullOrderModalOpen: false,
      selectedQuotation: null,
      fullOrderPo: {
        clientPoNumber: '',
        poFile: null,
        poStatus: 'not_available',
      },
      fullOrderErrors: { clientPoNumber: '', poFile: '' },
    }));
  };

  const closeUploadPoModal = () => {
    setState((prev) => ({
      ...prev,
      isUploadPoModalOpen: false,
      selectedQuotation: null,
      partialOrders: [],
      poUploads: {},
    }));
  };

  return (
    <div className="mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">View Quotations</h1>
      <div className="bg-white p-4 space-y-4 rounded-md shadow w-full">
        {/* Search and sort controls */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search Quotations
            </label>
            <InputField
              type="text"
              placeholder="Search by company name or Quotation ID..."
              value={state.searchTerm}
              onChange={(e) => setState((prev) => ({ ...prev, searchTerm: e.target.value }))}
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              id="sort"
              value={state.sortBy}
              onChange={(e) => setState((prev) => ({ ...prev, sortBy: e.target.value }))}
              className="p-2 border rounded focus:outline-indigo-500"
            >
              <option value="company_name">Company Name</option>
              <option value="rfq_id">Quotation ID</option>
              <option value="created_at">Creation Date</option>
            </select>
          </div>
        </div>

        {/* Quotations table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Sl No</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Quotation Series Number</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Company Name</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Created Date</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Assigned Sales Person</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap min-w-[150px]">Quotation Status</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Next Follow-up Date</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Remarks</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentQuotations.length === 0 ? (
                <tr>
                  <td colSpan="10" className="border p-2 text-center text-gray-500 whitespace-nowrap">
                    No quotations found.
                  </td>
                </tr>
              ) : (
                currentQuotations.map((quotation, index) => (
                  <tr key={quotation.id} className="border hover:bg-gray-50">
                    <td className="border p-2 whitespace-nowrap">{startIndex + index + 1}</td>
                    <td className="border p-2 whitespace-nowrap">{quotation.series_number || 'N/A'}</td>
                    <td className="border p-2 whitespace-nowrap">{quotation.company_name || 'N/A'}</td>
                    <td className="border p-2 whitespace-nowrap">{new Date(quotation.created_at).toLocaleDateString()}</td>
                    <td className="border p-2 whitespace-nowrap">
                      {state.teamMembers.find((m) => m.id === quotation.assigned_sales_person)?.name || 'N/A'}
                    </td>
                    <td className="border p-2 whitespace-nowrap min-w-[150px]">
                      <select
                        value={quotation.quotation_status || 'Pending'}
                        onChange={(e) => handleStatusChange(quotation.id, e.target.value)}
                        className="p-1 border rounded focus:outline-indigo-500 w-full"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="PO Created">PO Created</option>
                        <option value="Not Approved">Not Approved</option>
                      </select>
                    </td>
                    <td className="border p-2 whitespace-nowrap">
                      {quotation.next_followup_date ? new Date(quotation.next_followup_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="border p-2 whitespace-nowrap">
                      <InputField
                        type="text"
                        value={quotation.remarks || ''}
                        onChange={(e) => handleUpdateField(quotation.id, 'remarks', e.target.value)}
                        className="w-full p-1"
                      />
                    </td>
                    <td className="border p-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => openPreview(quotation)}
                          className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                        >
                          View Details
                        </Button>
                        <Button
                          onClick={() => navigate(`/edit-quotation/${quotation.id}`)}
                          disabled={isPoComplete(quotation) || !hasPermission('quotation', 'edit')}
                          className={`px-3 py-1 rounded-md text-sm ${
                            isPoComplete(quotation) || !hasPermission('quotation', 'edit')
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => {
                            setState((prev) => ({
                              ...prev,
                              selectedQuotation: quotation,
                            }));
                            setTimeout(handlePrint, 500);
                          }}
                          disabled={quotation.quotation_status !== 'Approved'}
                          className={`px-3 py-1 rounded-md text-sm ${
                            quotation.quotation_status === 'Approved'
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          Print
                        </Button>
                        {hasBothOrderTypes(quotation) || isPoComplete(quotation) ? null : quotation.purchase_orders?.some(
                            (po) => po.order_type === 'partial',
                          ) ? (
                          <Button
                            onClick={() => handleUploadPO(quotation.id)}
                            disabled={isPoComplete(quotation)}
                            className={`px-3 py-1 rounded-md text-sm ${
                              isPoComplete(quotation)
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-yellow-600 text-white hover:bg-yellow-700'
                            }`}
                          >
                            Upload PO
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleConvertToPO(quotation.id)}
                            disabled={quotation.quotation_status !== 'Approved' || isPoComplete(quotation)}
                            className={`px-3 py-1 rounded-md text-sm ${
                              quotation.quotation_status === 'Approved' && !isPoComplete(quotation)
                                ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            Convert to PO
                          </Button>
                        )}
                        <Button
                          onClick={() => handleDelete(quotation.id)}
                          disabled={!hasPermission('quotation', 'delete')}
                          className={`px-3 py-1 rounded-md text-sm ${
                            !hasPermission('quotation', 'delete')
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-red-600 text-white hover:bg-red-700'
                          }`}
                        >
                          Delete
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

      {/* Pagination */}
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

      {/* Hidden Template1 for printing */}
      <div style={{ display: 'none' }}>
        {state.selectedQuotation && (
          <Template1
            ref={componentRef}
            data={{
              id: state.selectedQuotation.id,
              series_number: state.selectedQuotation.series_number || 'QU-PI-GOPC-240825',
              created_at: state.selectedQuotation.created_at,
              company_name: state.selectedQuotation.company_name || 'Gulf Oil Performance Industrial Company',
              company_address:
                state.selectedQuotation.company_address || '4798, Road 130, Al Jubail, 35729 Ash Sharqiyah, Saudi Arabia',
              company_phone: state.selectedQuotation.company_phone || 'N/A',
              company_email: state.selectedQuotation.company_email || 'danny@primearabiagroup.com',
              point_of_contact_name: state.selectedQuotation.point_of_contact_name || 'N/A',
              items: state.selectedQuotation.items.map((item) => ({
                id: item.id,
                name: state.itemsList.find((i) => i.id === item.item)?.name || 'N/A',
                quantity: item.quantity || 1,
                unit_price: item.unit_price || 350.0,
                unit: state.units.find((u) => u.id === item.unit)?.name || 'Nos',
              })),
            }}
          />
        )}
      </div>

      {/* Modals */}
      <Modal isOpen={state.isModalOpen} onClose={closeModal} title={`Quotation Details - ID ${state.selectedQuotation?.id || 'N/A'}`}>
        {/* Modal content */}
      </Modal>
      <Modal
        isOpen={state.isPoModalOpen}
        onClose={closePoModal}
        title={`Convert Quotation ${state.selectedQuotation?.id} to PO`}
      >
        {/* PO Modal content */}
      </Modal>
      <Modal
        isOpen={state.isFullOrderModalOpen}
        onClose={closeFullOrderModal}
        title={`Create Full PO for Quotation ${state.selectedQuotation?.id}`}
      >
        {/* Full Order Modal content */}
      </Modal>
      <Modal
        isOpen={state.isUploadPoModalOpen}
        onClose={closeUploadPoModal}
        title={`Upload PO Details for Quotation ${state.selectedQuotation?.id}`}
      >
        {/* Upload PO Modal content */}
      </Modal>
      <Modal isOpen={state.isNotApprovedModalOpen} onClose={closeNotApprovedModal} title="Reason for Not Approved">
        {/* Not Approved Modal content */}
      </Modal>
    </div>
  );
};

export default ViewQuotation;
