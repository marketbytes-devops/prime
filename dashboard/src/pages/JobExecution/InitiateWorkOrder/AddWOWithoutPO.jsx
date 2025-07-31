import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../../helpers/apiClient';
import InputField from '../../../components/InputField';
import Button from '../../../components/Button';

const AddWOWithoutPO = () => {
  const navigate = useNavigate();
  const [state, setState] = useState({
    quotations: [],
    teamMembers: [],
    itemsList: [],
    units: [],
    selectedQuotation: '',
    dateReceived: '',
    expectedCompletionDate: '',
    onsiteOrLab: '',
    range: '',
    serialNumber: '',
    siteLocation: '',
    remarks: '',
    assignedTo: '',
    items: [],
  });

  const fetchData = async () => {
    try {
      const [quotationsRes, teamRes, itemsRes, unitsRes] = await Promise.all([
        apiClient.get('quotations/'),
        apiClient.get('technicians/'),
        apiClient.get('items/'),
        apiClient.get('units/'),
      ]);
      setState(prev => ({
        ...prev,
        quotations: quotationsRes.data || [],
        teamMembers: teamRes.data || [],
        itemsList: itemsRes.data || [],
        units: unitsRes.data || [],
      }));
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data.');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddItem = () => {
    setState(prev => ({
      ...prev,
      items: [...prev.items, { item: '', quantity: '', unit: '', unit_price: '' }],
    }));
  };

  const handleItemChange = (index, field, value) => {
    setState(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? { ...item, [field]: value } : item),
    }));
  };

  const handleRemoveItem = index => {
    setState(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        quotation: state.selectedQuotation,
        status: 'Collection Pending',
        date_received: state.dateReceived,
        expected_completion_date: state.expectedCompletionDate,
        onsite_or_lab: state.onsiteOrLab,
        range: state.range,
        serial_number: state.serialNumber,
        site_location: state.siteLocation,
        remarks: state.remarks,
        assigned_to: state.assignedTo,
        created_by: state.teamMembers.find(m => m.email === localStorage.getItem('userEmail'))?.id,
        items: state.items.map(item => ({
          item: parseInt(item.item),
          quantity: parseFloat(item.quantity),
          unit: parseInt(item.unit),
          unit_price: parseFloat(item.unit_price),
        })),
        manager_approval_status: 'Pending',
      };
      await apiClient.post('work-orders/', payload);
      toast.success('Work Order submitted for manager approval.');
      navigate('/job-execution/processing-work-orders/list-all-processing-work-orders');
    } catch (error) {
      console.error('Error creating work order:', error);
      toast.error('Failed to create Work Order.');
    }
  };

  const getAssignedSalesPersonName = () => {
    const quotation = state.quotations.find(q => q.id === parseInt(state.selectedQuotation));
    return quotation?.assigned_sales_person_name || 'N/A';
  };

  return (
    <div className="mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Add Work Order Without PO</h1>
      <div className="bg-white p-4 space-y-4 rounded-md shadow w-full">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Quotation</label>
          <select
            value={state.selectedQuotation}
            onChange={e => setState(prev => ({ ...prev, selectedQuotation: e.target.value }))}
            className="p-2 border rounded w-full focus:outline-indigo-500"
          >
            <option value="">Select Quotation</option>
            {state.quotations.map(q => (
              <option key={q.id} value={q.id}>{q.series_number || `Quotation ID ${q.id}`}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Sales Person</label>
          <InputField
            type="text"
            value={getAssignedSalesPersonName()}
            readOnly
            className="w-full bg-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date Received</label>
          <InputField
            type="date"
            value={state.dateReceived}
            onChange={e => setState(prev => ({ ...prev, dateReceived: e.target.value }))}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Expected Completion Date</label>
          <InputField
            type="date"
            value={state.expectedCompletionDate}
            onChange={e => setState(prev => ({ ...prev, expectedCompletionDate: e.target.value }))}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Onsite or Lab</label>
          <select
            value={state.onsiteOrLab}
            onChange={e => setState(prev => ({ ...prev, onsiteOrLab: e.target.value }))}
            className="p-2 border rounded w-full focus:outline-indigo-500"
          >
            <option value="">Select</option>
            <option value="Onsite">Onsite</option>
            <option value="Lab">Lab</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Range</label>
          <InputField
            type="text"
            value={state.range}
            onChange={e => setState(prev => ({ ...prev, range: e.target.value }))}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
          <InputField
            type="text"
            value={state.serialNumber}
            onChange={e => setState(prev => ({ ...prev, serialNumber: e.target.value }))}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Site Location</label>
          <InputField
            type="text"
            value={state.siteLocation}
            onChange={e => setState(prev => ({ ...prev, siteLocation: e.target.value }))}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
          <InputField
            type="text"
            value={state.remarks}
            onChange={e => setState(prev => ({ ...prev, remarks: e.target.value }))}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
          <select
            value={state.assignedTo}
            onChange={e => setState(prev => ({ ...prev, assignedTo: e.target.value }))}
            className="p-2 border rounded w-full focus:outline-indigo-500"
          >
            <option value="">Select Technician</option>
            {state.teamMembers.map(member => (
              <option key={member.id} value={member.id}>{member.name}</option>
            ))}
          </select>
        </div>
        <div>
          <h3 className="text-lg font-medium text-black mb-2">Items</h3>
          <Button onClick={handleAddItem} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Add Item
          </Button>
          {state.items.map((item, index) => (
            <div key={index} className="border p-4 mt-2 rounded-md space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium text-gray-700">Item {index + 1}</h4>
                <Button
                  onClick={() => handleRemoveItem(index)}
                  className="px-2 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                >
                  Remove
                </Button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
                <select
                  value={item.item}
                  onChange={e => handleItemChange(index, 'item', e.target.value)}
                  className="p-2 border rounded w-full focus:outline-indigo-500"
                >
                  <option value="">Select Item</option>
                  {state.itemsList.map(i => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <InputField
                  type="number"
                  value={item.quantity}
                  onChange={e => handleItemChange(index, 'quantity', e.target.value)}
                  className="w-full"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <select
                  value={item.unit}
                  onChange={e => handleItemChange(index, 'unit', e.target.value)}
                  className="p-2 border rounded w-full focus:outline-indigo-500"
                >
                  <option value="">Select Unit</option>
                  {state.units.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
                <InputField
                  type="number"
                  value={item.unit_price}
                  onChange={e => handleItemChange(index, 'unit_price', e.target.value)}
                  className="w-full"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button
            onClick={handleSubmit}
            disabled={
              !state.selectedQuotation ||
              !state.dateReceived ||
              !state.expectedCompletionDate ||
              state.items.length === 0 ||
              state.items.some(item => !item.item || !item.quantity || !item.unit || !item.unit_price)
            }
            className={`px-4 py-2 rounded-md ${
              state.selectedQuotation &&
              state.dateReceived &&
              state.expectedCompletionDate &&
              state.items.length > 0 &&
              !state.items.some(item => !item.item || !item.quantity || !item.unit || !item.unit_price)
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-300 text-gray-500'
            }`}
          >
            Submit for Approval
          </Button>
          <Button
            onClick={() => navigate('/job-execution/initiate-work-order/list-all-purchase-orders')}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddWOWithoutPO;