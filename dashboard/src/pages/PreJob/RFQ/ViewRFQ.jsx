import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../helpers/apiClient';
import InputField from '../../../components/InputField';
import Button from '../../../components/Button';
import Modal from '../../../components/Modal';
import ReactDOMServer from 'react-dom/server';
import Template1 from '../../../components/Templates/RFQ/Template1';

const ViewRFQ = () => {
  const navigate = useNavigate();
  const [state, setState] = useState({
    rfqs: [],
    channels: [],
    teamMembers: [],
    itemsList: [],
    units: [],
    searchTerm: '',
    sortBy: 'created_at',
    sortOrder: 'asc',
    currentPage: 1,
    itemsPerPage: 20,
    isModalOpen: false,
    selectedRfq: null,
  });

  const fetchRFQs = async () => {
    try {
      const [rfqsRes, channelsRes, teamsRes, itemsRes, unitsRes] = await Promise.all([
        apiClient.get('rfqs/'),
        apiClient.get('channels/'),
        apiClient.get('teams/'),
        apiClient.get('items/'),
        apiClient.get('units/'),
      ]);

      const rfqsWithQuotationStatus = await Promise.all(
        rfqsRes.data.map(async (rfq) => {
          try {
            const quotationRes = await apiClient.get(`/quotations/?rfq=${rfq.id}`);
            const hasQuotation = quotationRes.data.length > 0;
            console.log(`RFQ ${rfq.id} hasQuotation: ${hasQuotation}`);
            return { ...rfq, hasQuotation };
          } catch (error) {
            console.error(`Error checking quotation for RFQ ${rfq.id}:`, error);
            return { ...rfq, hasQuotation: false };
          }
        })
      );

      setState(prev => ({
        ...prev,
        rfqs: rfqsWithQuotationStatus || [],
        channels: channelsRes.data || [],
        teamMembers: teamsRes.data || [],
        itemsList: itemsRes.data || [],
        units: unitsRes.data || [],
      }));
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to load RFQs.');
    }
  };

  useEffect(() => {
    fetchRFQs();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this RFQ?')) {
      try {
        await apiClient.delete(`rfqs/${id}/`);
        await fetchRFQs();
      } catch (error) {
        console.error('Error deleting RFQ:', error);
        alert('Failed to delete RFQ.');
      }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const rfqResponse = await apiClient.get(`rfqs/${id}/`);
      const currentRfq = rfqResponse.data;
      const payload = {
        rfq_status: newStatus,
        items: currentRfq.items || [],
      };
      await apiClient.patch(`rfqs/${id}/`, payload);
      console.log(`Status updated for RFQ ${id} to ${newStatus}`);
      await fetchRFQs();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status.');
    }
  };

  const handleConvertToQuotation = async (rfq) => {
    try {
      navigate(`/edit-rfq/${rfq.id}`, { state: { isQuotation: true } });
    } catch (error) {
      console.error('Error initiating quotation conversion:', error);
      alert('Failed to initiate quotation conversion.');
    }
  };

  const handlePrint = (rfq) => {
    const channelName = state.channels.find(c => c.id === rfq.rfq_channel)?.channel_name || 'N/A';
    const salesPersonName = state.teamMembers.find(m => m.id === rfq.assigned_sales_person)?.name || 'N/A';

    const itemsData = (rfq.items || []).map(item => ({
      id: item.id,
      name: state.itemsList.find(i => i.id === item.item)?.name || 'N/A',
      quantity: item.quantity || '',
      unit: state.units.find(u => u.id === item.unit)?.name || 'N/A',
      unit_price: item.unit_price || ''
    }));

    const data = { ...rfq, channelName, salesPersonName, items: itemsData };

    const htmlString = ReactDOMServer.renderToStaticMarkup(<Template1 data={data} />);
    const printWindow = window.open("", "_blank");
    printWindow.document.write(htmlString);
    printWindow.document.close();
    printWindow.print();
  };

  const openModal = (rfq) => {
    setState(prev => ({
      ...prev,
      isModalOpen: true,
      selectedRfq: rfq,
    }));
  };

  const closeModal = () => {
    setState(prev => ({
      ...prev,
      isModalOpen: false,
      selectedRfq: null,
    }));
  };

  const filteredRfqs = state.rfqs
    .filter(rfq =>
      (rfq.company_name || '').toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      (rfq.series_number || '').toLowerCase().includes(state.searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (state.sortBy === 'company_name') {
        return state.sortOrder === 'asc'
          ? (a.company_name || '').localeCompare(b.company_name || '')
          : (b.company_name || '').localeCompare(a.company_name || '');
      } else if (state.sortBy === 'rfq_status') {
        return state.sortOrder === 'asc'
          ? (a.rfq_status || '').localeCompare(b.rfq_status || '')
          : (b.rfq_status || '').localeCompare(a.rfq_status || '');
      } else if (state.sortBy === 'created_at') {
        return state.sortOrder === 'asc'
          ? new Date(a.created_at) - new Date(b.created_at)
          : new Date(b.created_at) - new Date(a.created_at);
      } else if (state.sortBy === 'series_number') {
        return state.sortOrder === 'asc'
          ? (a.series_number || '').localeCompare(b.series_number || '')
          : (b.series_number || '').localeCompare(a.series_number || '');
      }
      return 0;
    });

  const totalPages = Math.ceil(filteredRfqs.length / state.itemsPerPage);
  const startIndex = (state.currentPage - 1) * state.itemsPerPage;
  const endIndex = startIndex + state.itemsPerPage;
  const currentRfqs = filteredRfqs.slice(startIndex, endIndex);

  const pageGroupSize = 3;
  const currentGroup = Math.floor((state.currentPage - 1) / pageGroupSize);
  const startPage = currentGroup * pageGroupSize + 1;
  const endPage = Math.min(startPage + pageGroupSize - 1, totalPages);
  const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  const handlePageChange = (page) => {
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
      <h1 className="text-2xl font-bold mb-4">View RFQs</h1>
      <div className="bg-white p-4 space-y-4 rounded-md shadow w-full">
        <div className="mb-6 flex gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search RFQs
            </label>
            <InputField
              type="text"
              placeholder="Search by company name or RFQ number..."
              value={state.searchTerm}
              onChange={e => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
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
              onChange={e => setState(prev => ({ ...prev, sortBy: e.target.value }))}
              className="p-2 border rounded focus:outline-indigo-500"
            >
              <option value="created_at">Creation Date (FIFO)</option>
              <option value="company_name">Company Name</option>
              <option value="series_number">RFQ Number</option>
              <option value="rfq_status">Status</option>
            </select>
          </div>
          <div>
            <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-1">
              Sort Order
            </label>
            <select
              id="sortOrder"
              value={state.sortOrder}
              onChange={e => setState(prev => ({ ...prev, sortOrder: e.target.value }))}
              className="p-2 border rounded focus:outline-indigo-500"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Sl No</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">RFQ Number</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Created Date</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Assigned Sales Person</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap min-w-[150px]">Status</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentRfqs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="border p-2 text-center text-gray-500 whitespace-nowrap">No RFQs found.</td>
                </tr>
              ) : (
                currentRfqs.map((rfq, index) => (
                  <tr key={rfq.id} className="border hover:bg-gray-50">
                    <td className="border p-2 whitespace-nowrap">{startIndex + index + 1}</td>
                    <td className="border p-2 whitespace-nowrap">{rfq.series_number || 'N/A'}</td>
                    <td className="border p-2 whitespace-nowrap">{new Date(rfq.created_at).toLocaleDateString()}</td>
                    <td className="border p-2 whitespace-nowrap">
                      {state.teamMembers.find(m => m.id === rfq.assigned_sales_person)?.name || 'N/A'}
                    </td>
                    <td className="border p-2 whitespace-nowrap min-w-[150px]">
                      <select
                        value={rfq.rfq_status || ''}
                        onChange={e => handleStatusChange(rfq.id, e.target.value)}
                        className="p-1 border rounded focus:outline-indigo-500 w-full"
                      >
                        <option value="Processing">Processing</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>
                    <td className="border p-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => openModal(rfq)}
                          className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                        >
                          View Details
                        </Button>
                        <Button
                          onClick={() => handleConvertToQuotation(rfq)}
                          disabled={rfq.rfq_status !== 'Completed' || rfq.hasQuotation}
                          className={`px-3 py-1 rounded-md text-sm ${rfq.rfq_status === 'Completed' && !rfq.hasQuotation
                            ? 'bg-purple-600 text-white hover:bg-purple-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                          Convert to Quotation
                        </Button>
                        <Button
                          onClick={() => navigate(`/edit-rfq/${rfq.id}`)}
                          disabled={rfq.hasQuotation}
                          className={`px-3 py-1 rounded-md text-sm ${!rfq.hasQuotation
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => handlePrint(rfq)}
                          className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                        >
                          Print
                        </Button>
                        <Button
                          onClick={() => handleDelete(rfq.id)}
                          disabled={rfq.hasQuotation}
                          className={`px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm ${rfq.hasQuotation ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : ''
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
              className={`px-3 py-1 rounded-md min-w-fit ${state.currentPage === page
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
        title={`RFQ Details - ${state.selectedRfq?.series_number || 'N/A'}`}
      >
        {state.selectedRfq && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-black">Company Details</h3>
              <p><strong>RFQ Number:</strong> {state.selectedRfq.series_number || 'N/A'}</p>
              <p><strong>Company Name:</strong> {state.selectedRfq.company_name || 'N/A'}</p>
              <p><strong>Company Address:</strong> {state.selectedRfq.company_address || 'N/A'}</p>
              <p><strong>Company Phone:</strong> {state.selectedRfq.company_phone || 'N/A'}</p>
              <p><strong>Company Email:</strong> {state.selectedRfq.company_email || 'N/A'}</p>
              <p><strong>Channel:</strong> {state.channels.find(c => c.id === state.selectedRfq.rfq_channel)?.channel_name || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-black">Contact Details</h3>
              <p><strong>Contact Name:</strong> {state.selectedRfq.point_of_contact_name || 'N/A'}</p>
              <p><strong>Contact Email:</strong> {state.selectedRfq.point_of_contact_email || 'N/A'}</p>
              <p><strong>Contact Phone:</strong> {state.selectedRfq.point_of_contact_phone || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-black">Assignment & Status</h3>
              <p><strong>Assigned Sales Person:</strong> {state.teamMembers.find(m => m.id === state.selectedRfq.assigned_sales_person)?.name || 'N/A'}</p>
              <p><strong>Due Date:</strong> {state.selectedRfq.due_date_for_quotation ? new Date(state.selectedRfq.due_date_for_quotation).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Status:</strong> {state.selectedRfq.rfq_status || 'N/A'}</p>
              <p><strong>Created:</strong> {new Date(state.selectedRfq.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-black">Items</h3>
              {state.selectedRfq.items && Array.isArray(state.selectedRfq.items) && state.selectedRfq.items.length > 0 ? (
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
                      {state.selectedRfq.items.map(item => (
                        <tr key={item.id} className="border">
                          <td className="border p-2 whitespace-nowrap">{state.itemsList.find(i => i.id === item.item)?.name || 'N/A'}</td>
                          <td className="border p-2 whitespace-nowrap">{item.quantity || 'N/A'}</td>
                          <td className="border p-2 whitespace-nowrap">{state.units.find(u => u.id === item.unit)?.name || 'N/A'}</td>
                          <td className="border p-2 whitespace-nowrap">${item.unit_price ? Number(item.unit_price).toFixed(2) : 'N/A'}</td>
                          <td className="border p-2 whitespace-nowrap">${item.quantity && item.unit_price ? Number(item.quantity * item.unit_price).toFixed(2) : '0.00'}</td>
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

export default ViewRFQ;