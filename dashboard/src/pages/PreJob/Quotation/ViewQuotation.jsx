import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../../../helpers/apiClient';
import InputField from '../../../components/InputField';
import Button from '../../../components/Button';
import Modal from '../../../components/Modal';

const ViewQuotation = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
  });

  useEffect(() => {
    Promise.all([
      apiClient.get('/quotations/'),
      apiClient.get('/channels/'),
      apiClient.get('/teams/'),
      apiClient.get('/items/'),
      apiClient.get('/units/'),
    ])
      .then(([quotationsRes, channelsRes, teamsRes, itemsRes, unitsRes]) => {
        setState(prev => ({
          ...prev,
          quotations: quotationsRes.data || [],
          channels: channelsRes.data || [],
          teamMembers: teamsRes.data || [],
          itemsList: itemsRes.data || [],
          units: unitsRes.data || [],
        }));
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        alert('Failed to load quotations.');
      });
  }, []);

  useEffect(() => {
    if (state.isModalOpen && state.selectedQuotation) {
      apiClient.get(`/purchase-orders/?quotation_id=${state.selectedQuotation.id}`)
        .then(response => {
          setState(prev => ({
            ...prev,
            selectedQuotation: { ...prev.selectedQuotation, purchase_orders: response.data },
          }));
        })
        .catch(error => console.error('Error fetching POs:', error));
    }
  }, [state.isModalOpen, state.selectedQuotation]);

  useEffect(() => {
    if (location.state?.refresh) {
      apiClient.get('/quotations/')
        .then(response => {
          setState(prev => ({
            ...prev,
            quotations: response.data || [],
            currentPage: 1,
          }));
        })
        .catch(error => console.error('Error refreshing quotations:', error));
    }
  }, [location.state]);

  const handleDelete = async id => {
    if (window.confirm('Are you sure you want to delete this quotation?')) {
      try {
        await apiClient.delete(`/quotations/${id}/`);
        const response = await apiClient.get('/quotations/');
        setState(prev => ({
          ...prev,
          quotations: response.data || [],
          currentPage: 1,
        }));
      } catch (error) {
        console.error('Error deleting quotation:', error);
        alert('Failed to delete quotation.');
      }
    }
  };

  const handleConvertToPO = id => {
    setState(prev => ({
      ...prev,
      isPoModalOpen: true,
      selectedQuotation: prev.quotations.find(q => q.id === id),
    }));
  };

  const handleUploadPO = id => {
    apiClient.get(`/purchase-orders/?quotation_id=${id}`)
      .then(response => {
        setState(prev => ({
          ...prev,
          isUploadPoModalOpen: true,
          selectedQuotation: prev.quotations.find(q => q.id === id),
          partialOrders: response.data.filter(po => po.order_type === 'partial'),
          poUploads: response.data.reduce((acc, po) => ({
            ...acc,
            [po.id]: { clientPoNumber: po.client_po_number || '', poFile: null },
          }), {}),
        }));
      })
      .catch(error => {
        console.error('Error fetching partial orders:', error);
        alert('Failed to load partial orders.');
      });
  };

  const handlePoOption = option => {
    if (option === 'full') {
      setState(prev => ({
        ...prev,
        isPoModalOpen: false,
        isFullOrderModalOpen: true,
      }));
    } else if (option === 'partial') {
      navigate('/pre-job/partial-order-selection', {
        state: { quotationData: state.selectedQuotation },
      });
      setState(prev => ({ ...prev, isPoModalOpen: false }));
    }
  };

  const handleFullOrderSubmit = async () => {
    try {
      const formData = new FormData();
      formData.append('quotation', state.selectedQuotation.id);
      formData.append('order_type', 'full');

      await apiClient.post('/purchase-orders/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const response = await apiClient.get('/quotations/');
      setState(prev => ({
        ...prev,
        quotations: response.data || [],
        isFullOrderModalOpen: false,
        selectedQuotation: null,
      }));
      alert('Full Purchase Order created successfully.');
    } catch (error) {
      console.error('Error creating PO:', error);
      alert('Failed to create Full Purchase Order.');
    }
  };

  const handlePoUploadSubmit = async () => {
    try {
      for (const poId of Object.keys(state.poUploads)) {
        const { clientPoNumber, poFile } = state.poUploads[poId];
        if (clientPoNumber || poFile) {
          const formData = new FormData();
          if (clientPoNumber) formData.append('client_po_number', clientPoNumber);
          if (poFile) formData.append('po_file', poFile);
          await apiClient.patch(`/purchase-orders/${poId}/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
      }
      const response = await apiClient.get('/quotations/');
      setState(prev => ({
        ...prev,
        quotations: response.data || [],
        isUploadPoModalOpen: false,
        selectedQuotation: null,
        partialOrders: [],
        poUploads: {},
      }));
      alert('PO details uploaded successfully.');
    } catch (error) {
      console.error('Error uploading PO details:', error);
      alert('Failed to upload PO details.');
    }
  };

  const handlePrint = quotation => {
    const channelName =
      state.channels.find(c => c.id === quotation.rfq_channel)?.channel_name || 'N/A';
    const salesPersonName =
      state.teamMembers.find(m => m.id === quotation.assigned_sales_person)?.name || 'N/A';
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head><title>Quotation ${quotation.id}</title></head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>Quotation Details</h1>
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 1.25rem; font-weight: 600;">Company Details</h2>
            <p><strong>Quotation ID:</strong> ${quotation.id}</p>
            <p><strong>RFQ ID:</strong> ${quotation.rfq || 'N/A'}</p>
            <p><strong>Company Name:</strong> ${quotation.company_name || 'N/A'}</p>
            <p><strong>Company Address:</strong> ${quotation.company_address || 'N/A'}</p>
            <p><strong>Company Phone:</strong> ${quotation.company_phone || 'N/A'}</p>
            <p><strong>Company Email:</strong> ${quotation.company_email || 'N/A'}</p>
            <p><strong>Channel:</strong> ${channelName}</p>
          </div>
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 1.25rem; font-weight: 600;">Contact Details</h2>
            <p><strong>Contact Name:</strong> ${quotation.point_of_contact_name || 'N/A'}</p>
            <p><strong>Contact Email:</strong> ${quotation.point_of_contact_email || 'N/A'}</p>
            <p><strong>Contact Phone:</strong> ${quotation.point_of_contact_phone || 'N/A'}</p>
          </div>
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 1.25rem; font-weight: 600;">Assignment & Status</h2>
            <p><strong>Assigned Sales Person:</strong> ${salesPersonName}</p>
            <p><strong>Due Date:</strong> ${
              quotation.due_date_for_quotation
                ? new Date(quotation.due_date_for_quotation).toLocaleDateString()
                : 'N/A'
            }</p>
            <p><strong>Created:</strong> ${new Date(quotation.created_at).toLocaleDateString()}</p>
            <p><strong>Quotation Status:</strong> ${quotation.quotation_status || 'N/A'}</p>
            <p><strong>Next Follow-up Date:</strong> ${
              quotation.next_followup_date
                ? new Date(quotation.next_followup_date).toLocaleDateString()
                : 'N/A'
            }</p>
            <p><strong>Remarks:</strong> ${quotation.remarks || 'N/A'}</p>
          </div>
          <div>
            <h2 style="font-size: 1.25rem; font-weight: 600;">Items</h2>
            <table border="1" style="width: 100%; border-collapse: collapse;">
              <tr style="background-color: #f2f2f2;">
                <th style="padding: 8px; text-align: left;">Item</th>
                <th style="padding: 8px; text-align: left;">Quantity</th>
                <th style="padding: 8px; text-align: left;">Unit</th>
                <th style="padding: 8px; text-align: left;">Unit Price</th>
                <th style="padding: 8px; text-align: left;">Total Price</th>
              </tr>
              ${
                quotation.items && Array.isArray(quotation.items) && quotation.items.length > 0
                  ? quotation.items
                      .map(
                        item => `
                        <tr>
                          <td style="padding: 8px;">${
                            state.itemsList.find(i => i.id === item.item)?.name || 'N/A'
                          }</td>
                          <td style="padding: 8px; text-align: center;">${
                            item.quantity || 'N/A'
                          }</td>
                          <td style="padding: 8px; text-align: left;">${
                            state.units.find(u => u.id === item.unit)?.name || 'N/A'
                          }</td>
                          <td style="padding: 8px; text-align: right;">$${
                            item.unit_price ? Number(item.unit_price).toFixed(2) : 'N/A'
                          }</td>
                          <td style="padding: 8px; text-align: right;">$${
                            item.quantity && item.unit_price
                              ? Number(item.quantity * item.unit_price).toFixed(2)
                              : '0.00'
                          }</td>
                        </tr>
                      `
                      )
                      .join('')
                  : '<tr><td colspan="5" style="padding: 8px; text-align: center;">No items added.</td></tr>'
              }
            </table>
          </div>
          ${
            quotation.purchase_orders && quotation.purchase_orders.length > 0
              ? `
          <div style="margin-top: 20px;">
            <h2 style="font-size: 1.25rem; font-weight: 600;">Purchase Orders</h2>
            ${quotation.purchase_orders
              .map(
                (po, index) => `
                <div style="margin-bottom: 20px;">
                  <h3 style="font-size: 1.1rem; font-weight: 600;">Purchase Order ${index + 1} (ID: ${po.id}, Type: ${po.order_type})</h3>
                  <p><strong>Client PO Number:</strong> ${po.client_po_number || 'N/A'}</p>
                  <p><strong>PO File:</strong> ${po.po_file ? `<a href="${po.po_file}" target="_blank">View File</a>` : 'N/A'}</p>
                  <p><strong>Created:</strong> ${new Date(po.created_at).toLocaleDateString()}</p>
                  <table border="1" style="width: 100%; border-collapse: collapse;">
                    <tr style="background-color: #f2f2f2;">
                      <th style="padding: 8px; text-align: left;">Item</th>
                      <th style="padding: 8px; text-align: left;">Quantity</th>
                      <th style="padding: 8px; text-align: left;">Unit</th>
                      <th style="padding: 8px; text-align: left;">Unit Price</th>
                      <th style="padding: 8px; text-align: left;">Total Price</th>
                    </tr>
                    ${
                      po.items && po.items.length > 0
                        ? po.items
                            .map(
                              item => `
                              <tr>
                                <td style="padding: 8px;">${
                                  state.itemsList.find(i => i.id === item.item)?.name || 'N/A'
                                }</td>
                                <td style="padding: 8px; text-align: center;">${
                                  item.quantity || 'N/A'
                                }</td>
                                <td style="padding: 8px; text-align: left;">${
                                  state.units.find(u => u.id === item.unit)?.name || 'N/A'
                                }</td>
                                <td style="padding: 8px; text-align: right;">$${
                                  item.unit_price ? Number(item.unit_price).toFixed(2) : 'N/A'
                                }</td>
                                <td style="padding: 8px; text-align: right;">$${
                                  item.quantity && item.unit_price
                                    ? Number(item.quantity * item.unit_price).toFixed(2)
                                    : '0.00'
                                }</td>
                              </tr>
                            `
                            )
                            .join('')
                        : '<tr><td colspan="5" style="padding: 8px; text-align: center;">No items added.</td></tr>'
                    }
                  </table>
                </div>
              `
              )
              .join('')}
          </div>
          `
              : ''
          }
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const openModal = quotation => {
    setState(prev => ({
      ...prev,
      isModalOpen: true,
      selectedQuotation: quotation,
    }));
  };

  const closeModal = () => {
    setState(prev => ({
      ...prev,
      isModalOpen: false,
      selectedQuotation: null,
    }));
  };

  const closePoModal = () => {
    setState(prev => ({
      ...prev,
      isPoModalOpen: false,
      selectedQuotation: null,
    }));
  };

  const closeFullOrderModal = () => {
    setState(prev => ({
      ...prev,
      isFullOrderModalOpen: false,
      selectedQuotation: null,
    }));
  };

  const closeUploadPoModal = () => {
    setState(prev => ({
      ...prev,
      isUploadPoModalOpen: false,
      selectedQuotation: null,
      partialOrders: [],
      poUploads: {},
    }));
  };

  const handleUpdateField = async (id, field, value) => {
    try {
      const updatePayload = { [field]: value || null };
      await apiClient.patch(`/quotations/${id}/`, updatePayload);
      setState(prev => ({
        ...prev,
        quotations: prev.quotations.map(quotation =>
          quotation.id === id ? { ...quotation, [field]: value } : quotation
        ),
      }));
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      alert(`Failed to update ${field}.`);
    }
  };

  const filteredQuotations = state.quotations
    .filter(
      quotation =>
        (quotation.company_name || '')
          .toLowerCase()
          .includes(state.searchTerm.toLowerCase()) ||
        (quotation.id || '')
          .toString()
          .includes(state.searchTerm.toLowerCase())
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

  const totalPages = Math.ceil(filteredQuotations.length / state.itemsPerPage);
  const startIndex = (state.currentPage - 1) * state.itemsPerPage;
  const endIndex = startIndex + state.itemsPerPage;
  const currentQuotations = filteredQuotations.slice(startIndex, endIndex);

  const pageGroupSize = 3;
  const currentGroup = Math.floor((state.currentPage - 1) / pageGroupSize);
  const startPage = currentGroup * pageGroupSize + 1;
  const endPage = Math.min(startPage + pageGroupSize - 1, totalPages);
  const pageNumbers = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i
  );

  const handlePageChange = page => {
    setState(prev => ({ ...prev, currentPage: page }));
  };

  const handleNext = () => {
    if (state.currentPage < totalPages) {
      setState(prev => ({ ...prev, currentPage: prev.currentPage + 1 }));
    }
  };

  const handlePrev = () => {
    if (state.currentPage > 1) {
      setState(prev => ({ ...prev, currentPage: prev.currentPage - 1 }));
    }
  };

  const hasAnyOrder = quotation => {
    return quotation.purchase_orders && quotation.purchase_orders.length > 0;
  };

  return (
    <div className="mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">View Quotations</h1>
      <div className="bg-white p-4 space-y-4 rounded-md shadow w-full">
        <div className="mb-6 flex gap-4">
          <div className="flex-1">
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Search Quotations
            </label>
            <InputField
              type="text"
              placeholder="Search by company name or Quotation ID..."
              value={state.searchTerm}
              onChange={e =>
                setState(prev => ({ ...prev, searchTerm: e.target.value }))
              }
              className="w-full"
            />
          </div>
          <div>
            <label
              htmlFor="sort"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Sort By
            </label>
            <select
              id="sortBy"
              value={state.sortBy}
              onChange={e =>
                setState(prev => ({ ...prev, sortBy: e.target.value }))
              }
              className="p-2 border rounded-md focus:outline-indigo-600"
            >
              <option value="company_name">Company Name</option>
              <option value="rfq_id">Quotation ID</option>
              <option value="created_at">Created Date</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Sl No
                </th>
                <th className="border p-2 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Quotation ID
                </th>
                <th className="border p-2 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Company Name
                </th>
                <th className="border p-2 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Created Date
                </th>
                <th className="border p-2 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Assigned Sales Person
                </th>
                <th className="border p-2 text-left text-sm font-semibold text-gray-700 whitespace-nowrap min-w-[150px]">
                  Quotation Status
                </th>
                <th className="border p-2 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Next Follow-up Date
                </th>
                <th className="border p-2 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Remarks
                </th>
                <th className="border p-2 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {currentQuotations.length === 0 ? (
                <tr>
                  <td
                    colSpan="10"
                    className="border p-2 text-center text-sm text-gray-500 whitespace-nowrap"
                  >
                    No quotations found.
                  </td>
                </tr>
              ) : (
                currentQuotations.map((quotation, index) => (
                  <tr key={quotation.id} className="border hover:bg-gray-50">
                    <td className="border p-2 whitespace-nowrap">{startIndex + index + 1}</td>
                    <td className="border p-2 whitespace-nowrap">{quotation.id}</td>
                    <td className="border p-2 whitespace-nowrap">{quotation.company_name || 'N/A'}</td>
                    <td className="border p-2 whitespace-nowrap">
                      {new Date(quotation.created_at).toLocaleDateString()}
                    </td>
                    <td className="border p-2 whitespace-nowrap">
                      {state.teamMembers.find(
                        m => m.id === quotation.assigned_sales_person
                      )?.name || 'N/A'}
                    </td>
                    <td className="border p-2 whitespace-nowrap min-w-[150px]">
                      <select
                        value={quotation.quotation_status || 'Pending'}
                        onChange={e =>
                          handleUpdateField(quotation.id, 'quotation_status', e.target.value)
                        }
                        className="p-1 border rounded-md focus:outline-indigo-600 w-full"
                      >
                        <option value="Pending" className="whitespace-nowrap">Pending</option>
                        <option value="Approved" className="whitespace-nowrap">Approved</option>
                        <option value="PO Created" className="whitespace-nowrap">PO Created</option>
                      </select>
                    </td>
                    <td className="border p-2 whitespace-nowrap">
                      {quotation.next_followup_date
                        ? new Date(quotation.next_followup_date).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="border p-2 whitespace-nowrap">
                      <InputField
                        type="text"
                        value={quotation.remarks || ''}
                        onChange={e =>
                          handleUpdateField(quotation.id, 'remarks', e.target.value)
                        }
                        className="w-full p-1"
                      />
                    </td>
                    <td className="border p-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => openModal(quotation)}
                          className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                        >
                          View Details
                        </Button>
                        {!hasAnyOrder(quotation) && (
                          <>
                            <Button
                              onClick={() => navigate(`/edit-quotation/${quotation.id}`)}
                              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                            >
                              Edit
                            </Button>
                            <Button
                              onClick={() => handleConvertToPO(quotation.id)}
                              disabled={quotation.quotation_status !== 'Approved'}
                              className={`px-3 py-1 rounded-md text-sm ${
                                quotation.quotation_status === 'Approved'
                                  ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }`}
                            >
                              Convert to PO
                            </Button>
                          </>
                        )}
                        <Button
                          onClick={() => handlePrint(quotation)}
                          className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                        >
                          Print
                        </Button>
                        {quotation.purchase_orders?.some(po => po.order_type === 'partial') &&
                          !hasAnyOrder(quotation) && (
                            <Button
                              onClick={() => handleUploadPO(quotation.id)}
                              className="px-3 py-1 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm"
                            >
                              Upload PO
                            </Button>
                          )}
                        <Button
                          onClick={() => handleDelete(quotation.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
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
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4 w-fit">
          <Button
            onClick={handlePrev}
            disabled={state.currentPage === 1}
            className="px-3 py-1 bg-gray-400 text-white rounded-md hover:bg-gray-500 disabled:bg-gray-300 min-w-fit"
          >
            Prev
          </Button>
          {pageNumbers.map(page => (
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
      <Modal
        isOpen={state.isModalOpen}
        onClose={closeModal}
        title={`Quotation Details - ID ${state.selectedQuotation?.id || 'N/A'}`}
      >
        {state.selectedQuotation && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-800">Company Details</h3>
              <p><strong>Quotation ID:</strong> {state.selectedQuotation.id}</p>
              <p><strong>RFQ ID:</strong> {state.selectedQuotation.rfq || 'N/A'}</p>
              <p><strong>Company Name:</strong> {state.selectedQuotation.company_name || 'N/A'}</p>
              <p><strong>Company Address:</strong> {state.selectedQuotation.company_address || 'N/A'}</p>
              <p><strong>Company Phone:</strong> {state.selectedQuotation.company_phone || 'N/A'}</p>
              <p><strong>Company Email:</strong> {state.selectedQuotation.company_email || 'N/A'}</p>
              <p>
                <strong>Channel:</strong>{' '}
                {state.channels.find(c => c.id === state.selectedQuotation.rfq_channel)?.channel_name || 'N/A'}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-800">Contact Details</h3>
              <p><strong>Contact Name:</strong> {state.selectedQuotation.point_of_contact_name || 'N/A'}</p>
              <p><strong>Contact Email:</strong> {state.selectedQuotation.point_of_contact_email || 'N/A'}</p>
              <p><strong>Contact Phone:</strong> {state.selectedQuotation.point_of_contact_phone || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-800">Assignment & Status</h3>
              <p>
                <strong>Assigned Sales Person:</strong>{' '}
                {state.teamMembers.find(m => m.id === state.selectedQuotation.assigned_sales_person)?.name || 'N/A'}
              </p>
              <p>
                <strong>Due Date:</strong>{' '}
                {state.selectedQuotation.due_date_for_quotation
                  ? new Date(state.selectedQuotation.due_date_for_quotation).toLocaleDateString()
                  : 'N/A'}
              </p>
              <p>
                <strong>Created:</strong>{' '}
                {new Date(state.selectedQuotation.created_at).toLocaleDateString()}
              </p>
              <p>
                <strong>Quotation Status:</strong> {state.selectedQuotation.quotation_status || 'N/A'}
              </p>
              <p>
                <strong>Next Follow-up Date:</strong>{' '}
                {state.selectedQuotation.next_followup_date
                  ? new Date(state.selectedQuotation.next_followup_date).toLocaleDateString()
                  : 'N/A'}
              </p>
              <p>
                <strong>Remarks:</strong> {state.selectedQuotation.remarks || 'N/A'}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-800">Items</h3>
              {state.selectedQuotation.items &&
              Array.isArray(state.selectedQuotation.items) &&
              state.selectedQuotation.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="border p-2 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
                          Item
                        </th>
                        <th className="border p-2 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
                          Quantity
                        </th>
                        <th className="border p-2 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
                          Unit
                        </th>
                        <th className="border p-2 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
                          Unit Price
                        </th>
                        <th className="border p-2 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
                          Total Price
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.selectedQuotation.items.map(item => (
                        <tr key={item.id} className="border">
                          <td className="border p-2 whitespace-nowrap">
                            {state.itemsList.find(i => i.id === item.item)?.name || 'N/A'}
                          </td>
                          <td className="border p-2 whitespace-nowrap">{item.quantity || 'N/A'}</td>
                          <td className="border p-2 whitespace-nowrap">
                            {state.units.find(u => u.id === item.unit)?.name || 'N/A'}
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            ${item.unit_price ? Number(item.unit_price).toFixed(2) : 'N/A'}
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            ${item.quantity && item.unit_price
                              ? Number(item.quantity * item.unit_price).toFixed(2)
                              : '0.00'}
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
            {state.selectedQuotation.purchase_orders && state.selectedQuotation.purchase_orders.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-800">Purchase Orders</h3>
                {state.selectedQuotation.purchase_orders.map((po, index) => (
                  <div key={po.id} className="mb-4">
                    <p><strong>PO ID:</strong> {po.id} ({po.order_type})</p>
                    <p><strong>Client PO Number:</strong> {po.client_po_number || 'N/A'}</p>
                    <p><strong>PO File:</strong> {po.po_file ? <a href={po.po_file} target="_blank" rel="noopener noreferrer">View File</a> : 'N/A'}</p>
                    <p><strong>Created:</strong> {new Date(po.created_at).toLocaleDateString()}</p>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-200">
                          <th className="border p-2 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
                            Item
                          </th>
                          <th className="border p-2 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
                            Quantity
                          </th>
                          <th className="border p-2 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
                            Unit
                          </th>
                          <th className="border p-2 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
                            Unit Price
                          </th>
                          <th className="border p-2 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
                            Total Price
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {po.items && po.items.length > 0 ? (
                          po.items.map(item => (
                            <tr key={item.id} className="border">
                              <td className="border p-2 whitespace-nowrap">
                                {state.itemsList.find(i => i.id === item.item)?.name || 'N/A'}
                              </td>
                              <td className="border p-2 whitespace-nowrap">{item.quantity || 'N/A'}</td>
                              <td className="border p-2 whitespace-nowrap">
                                {state.units.find(u => u.id === item.unit)?.name || 'N/A'}
                              </td>
                              <td className="border p-2 whitespace-nowrap">
                                ${item.unit_price ? Number(item.unit_price).toFixed(2) : 'N/A'}
                              </td>
                              <td className="border p-2 whitespace-nowrap">
                                ${item.quantity && item.unit_price
                                  ? Number(item.quantity * item.unit_price).toFixed(2)
                                  : '0.00'}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="border p-2 text-center text-sm text-gray-500 whitespace-nowrap">
                              No items added.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
      <Modal
        isOpen={state.isPoModalOpen}
        onClose={closePoModal}
        title="Convert to Purchase Order"
      >
        <div className="space-y-4">
          <p className="text-gray-700">Select an option to convert Quotation ID {state.selectedQuotation?.id} to a Purchase Order:</p>
          <div className="flex justify-center gap-4">
            <Button
              onClick={() => handlePoOption('full')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Full Order
            </Button>
            <Button
              onClick={() => handlePoOption('partial')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Partial Order
            </Button>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={closePoModal}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={state.isFullOrderModalOpen}
        onClose={closeFullOrderModal}
        title="Create Full Order PO"
      >
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button
              onClick={handleFullOrderSubmit}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Submit
            </Button>
            <Button
              onClick={closeFullOrderModal}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={state.isUploadPoModalOpen}
        onClose={closeUploadPoModal}
        title="Upload PO Details"
      >
        <div className="space-y-4">
          {state.partialOrders.map((po, index) => (
            <div key={po.id} className="border p-4 rounded-md">
              <h3 className="text-md font-medium text-gray-800">Partial Order {index + 1} (ID: {po.id})</h3>
              <div className="mt-2">
                <label
                  htmlFor={`clientPoNumber-${po.id}`}
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Client PO Number
                </label>
                <InputField
                  type="text"
                  id={`clientPoNumber-${po.id}`}
                  value={state.poUploads[po.id]?.clientPoNumber || ''}
                  onChange={e =>
                    setState(prev => ({
                      ...prev,
                      poUploads: {
                        ...prev.poUploads,
                        [po.id]: { ...prev.poUploads[po.id], clientPoNumber: e.target.value },
                      },
                    }))
                  }
                  className="w-full"
                  placeholder="Enter Client PO Number (optional)"
                />
              </div>
              <div className="mt-2">
                <label
                  htmlFor={`poFile-${po.id}`}
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Upload PO File
                </label>
                <input
                  type="file"
                  id={`poFile-${po.id}`}
                  onChange={e =>
                    setState(prev => ({
                      ...prev,
                      poUploads: {
                        ...prev.poUploads,
                        [po.id]: { ...prev.poUploads[po.id], poFile: e.target.files[0] },
                      },
                    }))
                  }
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>
          ))}
          <div className="flex justify-end gap-2">
            <Button
              onClick={handlePoUploadSubmit}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Save
            </Button>
            <Button
              onClick={closeUploadPoModal}
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

export default ViewQuotation;