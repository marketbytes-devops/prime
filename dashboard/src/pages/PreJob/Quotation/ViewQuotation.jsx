import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../helpers/apiClient';
import InputField from '../../../components/InputField';
import Button from '../../../components/Button';
import Modal from '../../../components/Modal';

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
    editQuotation: null,
    editQuotationStatus: '',
    editFollowupFrequency: '',
    editRemarks: '',
  });

  useEffect(() => {
    Promise.all([
      apiClient.get('/quotations/'),
      apiClient.get('channels/'),
      apiClient.get('teams/'),
      apiClient.get('items/'),
      apiClient.get('units/'),
    ])
      .then(([quotationsRes, channelsRes, teamsRes, itemsRes, unitsRes]) => {
        console.log('Quotations data:', quotationsRes.data);
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

  const handleConvertToPO = async id => {
    try {
      // Placeholder for POST /purchase-orders/
      console.log('Converting to PO:', id);
      alert('Convert to PO not implemented.');
    } catch (error) {
      console.error('Error converting to PO:', error);
      alert('Failed to convert to PO.');
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
            <p><strong>Follow-up Frequency:</strong> ${quotation.followup_frequency || 'N/A'}</p>
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
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const openModal = quotation => {
    console.log('Opening modal for Quotation:', quotation, 'Items:', quotation.items);
    setState(prev => ({
      ...prev,
      isModalOpen: true,
      selectedQuotation: quotation,
      editQuotation: quotation,
      editQuotationStatus: quotation.quotation_status || 'Pending',
      editFollowupFrequency: quotation.followup_frequency || '24_hours',
      editRemarks: quotation.remarks || '',
    }));
  };

  const closeModal = () => {
    setState(prev => ({
      ...prev,
      isModalOpen: false,
      selectedQuotation: null,
      editQuotation: null,
      editQuotationStatus: '',
      editFollowupFrequency: '',
      editRemarks: '',
    }));
  };

  const handleUpdateQuotation = async () => {
    try {
      const updatePayload = {
        quotation_status: state.editQuotationStatus,
        followup_frequency: state.editFollowupFrequency,
        remarks: state.editRemarks,
      };
      console.log('Updating Quotation:', updatePayload);
      await apiClient.patch(`/quotations/${state.editQuotation.id}/`, updatePayload);
      const response = await apiClient.get('/quotations/');
      setState(prev => ({
        ...prev,
        quotations: response.data || [],
        isModalOpen: false,
        selectedQuotation: null,
        editQuotation: null,
        editQuotationStatus: '',
        editFollowupFrequency: '',
        editRemarks: '',
      }));
      alert('Quotation updated successfully.');
    } catch (error) {
      console.error('Error updating quotation:', error);
      alert('Failed to update quotation.');
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
                <th className="border p-2 text-left text-sm font-semibold text-gray-700">
                  Sl No
                </th>
                <th className="border p-2 text-left text-sm font-semibold text-gray-700">
                  Quotation ID
                </th>
                <th className="border p-2 text-left text-sm font-semibold text-gray-700">
                  Company Name
                </th>
                <th className="border p-2 text-left text-sm font-semibold text-gray-700">
                  Created Date
                </th>
                <th className="border p-2 text-left text-sm font-semibold text-gray-700">
                  Assigned Sales Person
                </th>
                <th className="border p-2 text-left text-sm font-semibold text-gray-700">
                  Quotation Status
                </th>
                <th className="border p-2 text-left text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {currentQuotations.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="border p-2 text-center text-sm text-gray-500"
                  >
                    No quotations found.
                  </td>
                </tr>
              ) : (
                currentQuotations.map((quotation, index) => (
                  <tr key={quotation.id} className="border hover:bg-gray-50">
                    <td className="border p-2">{startIndex + index + 1}</td>
                    <td className="border p-2">{quotation.id}</td>
                    <td className="border p-2">{quotation.company_name || 'N/A'}</td>
                    <td className="border p-2">
                      {new Date(quotation.created_at).toLocaleDateString()}
                    </td>
                    <td className="border p-2">
                      {state.teamMembers.find(
                        m => m.id === quotation.assigned_sales_person
                      )?.name || 'N/A'}
                    </td>
                    <td className="border p-2">{quotation.quotation_status || 'N/A'}</td>
                    <td className="border p-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          onClick={() => openModal(quotation)}
                          className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                        >
                          View Details
                        </Button>
                        <Button
                          onClick={() => navigate(`/edit-quotation/${quotation.id}`)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => handlePrint(quotation)}
                          className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                        >
                          Print
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
                <strong>Quotation Status:</strong>{' '}
                <select
                  value={state.editQuotationStatus}
                  onChange={e =>
                    setState(prev => ({ ...prev, editQuotationStatus: e.target.value }))
                  }
                  className="p-2 border rounded-md focus:outline-indigo-600"
                >
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="PO Created">PO Created</option>
                </select>
              </p>
              <p>
                <strong>Next Follow-up Date:</strong>{' '}
                {state.selectedQuotation.next_followup_date
                  ? new Date(state.selectedQuotation.next_followup_date).toLocaleDateString()
                  : 'N/A'}
              </p>
              <p>
                <strong>Follow-up Frequency:</strong>{' '}
                <select
                  value={state.editFollowupFrequency}
                  onChange={e =>
                    setState(prev => ({ ...prev, editFollowupFrequency: e.target.value }))
                  }
                  className="p-2 border rounded-md focus:outline-indigo-600"
                >
                  <option value="24_hours">24 Hours</option>
                  <option value="3_days">3 Days</option>
                  <option value="7_days">7 Days</option>
                  <option value="every_7th_day">Every 7th Day</option>
                </select>
              </p>
              <p>
                <strong>Remarks:</strong>{' '}
                <InputField
                  type="text"
                  value={state.editRemarks}
                  onChange={e =>
                    setState(prev => ({ ...prev, editRemarks: e.target.value }))
                  }
                  className="w-full"
                />
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
                        <th className="border p-2 text-left text-sm font-semibold text-gray-700">Item</th>
                        <th className="border p-2 text-left text-sm font-semibold text-gray-700">Quantity</th>
                        <th className="border p-2 text-left text-sm font-semibold text-gray-700">Unit</th>
                        <th className="border p-2 text-left text-sm font-semibold text-gray-700">Unit Price</th>
                        <th className="border p-2 text-left text-sm font-semibold text-gray-700">Total Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.selectedQuotation.items.map(item => (
                        <tr key={item.id} className="border">
                          <td className="border p-2">
                            {state.itemsList.find(i => i.id === item.item)?.name || 'N/A'}
                          </td>
                          <td className="border p-2">{item.quantity || 'N/A'}</td>
                          <td className="border p-2">
                            {state.units.find(u => u.id === item.unit)?.name || 'N/A'}
                          </td>
                          <td className="border p-2">
                            ${item.unit_price ? Number(item.unit_price).toFixed(2) : 'N/A'}
                          </td>
                          <td className="border p-2">
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
            <div className="flex justify-end gap-2">
              <Button
                onClick={handleUpdateQuotation}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Update
              </Button>
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
    </div>
  );
};

export default ViewQuotation;