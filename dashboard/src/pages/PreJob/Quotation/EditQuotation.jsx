import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../../helpers/apiClient';
import InputField from '../../../components/InputField';
import Button from '../../../components/Button';
import Loading from '../../../components/Loading';

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const EditQuotation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const itemsSectionRef = useRef(null);
  const [state, setState] = useState({
    company_name: '',
    company_address: '',
    company_phone: '',
    company_email: '',
    rfq_channel: '',
    point_of_contact_name: '',
    point_of_contact_email: '',
    point_of_contact_phone: '',
    assigned_sales_person: '',
    due_date_for_quotation: '',
    quotation_status: '',
    followup_frequency: '',
    next_followup_date: '',
    remarks: '',
    vat_applicable: false, // Added vat_applicable to state
    items: [{ item: '', quantity: '', unit: '', unit_price: '' }],
    channels: [],
    teamMembers: [],
    itemsList: [],
    units: [],
    loading: true,
    lastSaved: null,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [quotationRes, channelsRes, teamsRes, itemsRes, unitsRes] = await Promise.all([
          apiClient.get(`/quotations/${id}/`),
          apiClient.get('/channels/'),
          apiClient.get('/teams/'),
          apiClient.get('/items/'),
          apiClient.get('/units/'),
        ]);
        console.log('Quotation data:', quotationRes.data, 'Items:', quotationRes.data.items);
        setState(prev => ({
          ...prev,
          company_name: quotationRes.data.company_name || '',
          company_address: quotationRes.data.company_address || '',
          company_phone: quotationRes.data.company_phone || '',
          company_email: quotationRes.data.company_email || '',
          rfq_channel: quotationRes.data.rfq_channel || '',
          point_of_contact_name: quotationRes.data.point_of_contact_name || '',
          point_of_contact_email: quotationRes.data.point_of_contact_email || '',
          point_of_contact_phone: quotationRes.data.point_of_contact_phone || '',
          assigned_sales_person: quotationRes.data.assigned_sales_person || '',
          due_date_for_quotation: quotationRes.data.due_date_for_quotation || '',
          quotation_status: quotationRes.data.quotation_status || 'Pending',
          followup_frequency: quotationRes.data.followup_frequency || '24_hours',
          next_followup_date: quotationRes.data.next_followup_date || '',
          remarks: quotationRes.data.remarks || '',
          vat_applicable: quotationRes.data.vat_applicable || false, // Initialize vat_applicable
          items: quotationRes.data.items && quotationRes.data.items.length
            ? quotationRes.data.items.map(item => ({
              item: item.item || '',
              quantity: item.quantity || '',
              unit: item.unit || '',
              unit_price: item.unit_price || '',
            }))
            : [{ item: '', quantity: '', unit: '', unit_price: '' }],
          channels: channelsRes.data || [],
          teamMembers: teamsRes.data || [],
          itemsList: itemsRes.data || [],
          units: unitsRes.data || [],
          loading: false,
        }));
        if (itemsSectionRef.current) {
          itemsSectionRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        alert('Failed to load quotation data.');
        setState(prev => ({ ...prev, loading: false }));
      }
    };
    fetchData();
  }, [id]);

  const buildQuotationPayload = useCallback(() => ({
    company_name: state.company_name || null,
    company_address: state.company_address || null,
    company_phone: state.company_phone || null,
    company_email: state.company_email || null,
    rfq_channel: state.rfq_channel || null,
    point_of_contact_name: state.point_of_contact_name || null,
    point_of_contact_email: state.point_of_contact_email || null,
    point_of_contact_phone: state.point_of_contact_phone || null,
    assigned_sales_person: state.assigned_sales_person || null,
    due_date_for_quotation: state.due_date_for_quotation || null,
    quotation_status: state.quotation_status || null,
    followup_frequency: state.followup_frequency || null,
    remarks: state.remarks || null,
    vat_applicable: state.vat_applicable, // Include vat_applicable in payload
    items: state.items.map(item => ({
      item: item.item || null,
      quantity: item.quantity ? parseInt(item.quantity) : null,
      unit: item.unit || null,
      unit_price: item.unit_price ? parseFloat(item.unit_price) : null,
    })),
  }), [
    state.company_name,
    state.company_address,
    state.company_phone,
    state.company_email,
    state.rfq_channel,
    state.point_of_contact_name,
    state.point_of_contact_email,
    state.point_of_contact_phone,
    state.assigned_sales_person,
    state.due_date_for_quotation,
    state.quotation_status,
    state.followup_frequency,
    state.remarks,
    state.vat_applicable, // Added to dependencies
    state.items,
  ]);

  const autosave = useCallback(
    debounce(async () => {
      try {
        const quotationPayload = buildQuotationPayload();
        console.log('Autosaving Quotation:', quotationPayload);
        await apiClient.patch(`/quotations/${id}/`, quotationPayload);
        setState(prev => ({ ...prev, lastSaved: new Date() }));
      } catch (error) {
        console.error('Error autosaving quotation:', error);
      }
    }, 2000),
    [buildQuotationPayload, id]
  );

  useEffect(() => {
    if (!state.loading) {
      autosave();
    }
  }, [
    state.company_name,
    state.company_address,
    state.company_phone,
    state.company_email,
    state.rfq_channel,
    state.point_of_contact_name,
    state.point_of_contact_email,
    state.point_of_contact_phone,
    state.assigned_sales_person,
    state.due_date_for_quotation,
    state.quotation_status,
    state.followup_frequency,
    state.remarks,
    state.vat_applicable, 
    state.items,
    autosave,
    state.loading,
  ]);

  const addItem = () => {
    setState(prev => ({
      ...prev,
      items: [...prev.items, { item: '', quantity: '', unit: '', unit_price: '' }],
    }));
  };

  const removeItem = index => {
    setState(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemChange = (index, field, value) => {
    setState(prev => {
      const newItems = [...prev.items];
      newItems[index][field] = value;
      return { ...prev, items: newItems };
    });
  };

  const isFormValid = () => {
    const isBasicInfoValid =
      state.company_name &&
      state.company_address &&
      state.company_phone &&
      state.company_email &&
      state.rfq_channel &&
      state.point_of_contact_name &&
      state.point_of_contact_email &&
      state.point_of_contact_phone &&
      state.assigned_sales_person &&
      state.due_date_for_quotation &&
      state.quotation_status &&
      state.followup_frequency;

    const isItemsValid = state.items.every(
      item => item.item && item.quantity && item.unit && item.unit_price
    );

    return isBasicInfoValid && isItemsValid;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!isFormValid()) {
      alert('Please fill all required fields.');
      return;
    }
    try {
      const quotationPayload = buildQuotationPayload();
      console.log('Updating Quotation:', quotationPayload);
      await apiClient.patch(`/quotations/${id}/`, quotationPayload);
      navigate('/view-quotation');
    } catch (error) {
      console.error('Error submitting:', error);
      alert('Failed to submit.');
    }
  };

  const renderForm = () => (
    <div className="grid gap-6">
      <div className="bg-white p-4 space-y-4 rounded-md shadow">
        <h3 className="text-xl font-semibold text-black">Company Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name
            </label>
            <InputField
              type="text"
              placeholder="Enter company name"
              value={state.company_name || ''}
              onChange={e =>
                setState(prev => ({ ...prev, company_name: e.target.value }))
              }
              maxLength={100}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Address
            </label>
            <InputField
              type="text"
              placeholder="Enter company address"
              value={state.company_address || ''}
              onChange={e =>
                setState(prev => ({ ...prev, company_address: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Phone
            </label>
            <InputField
              type="text"
              placeholder="Enter company phone"
              value={state.company_phone || ''}
              onChange={e =>
                setState(prev => ({ ...prev, company_phone: e.target.value }))
              }
              maxLength={20}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Email
            </label>
            <InputField
              type="email"
              placeholder="Enter company email"
              value={state.company_email || ''}
              onChange={e =>
                setState(prev => ({ ...prev, company_email: e.target.value }))
              }
              required
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-4 space-y-4 rounded-md shadow">
        <h3 className="text-xl font-semibold text-black">Quotation Channel</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quotation Channel
          </label>
          <select
            value={state.rfq_channel || ''}
            onChange={e =>
              setState(prev => ({ ...prev, rfq_channel: e.target.value }))
            }
            className="w-full p-2 border rounded-md focus:outline-indigo-600"
            required
          >
            <option value="">Select Channel</option>
            {state.channels.map(channel => (
              <option key={channel.id} value={channel.id}>
                {channel.channel_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white p-4 space-y-4 rounded-md shadow">
        <h3 className="text-xl font-semibold text-black">Point of Contact</h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Name
            </label>
            <InputField
              type="text"
              placeholder="Enter contact name"
              value={state.point_of_contact_name || ''}
              onChange={e =>
                setState(prev => ({ ...prev, point_of_contact_name: e.target.value }))
              }
              maxLength={100}
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Email
              </label>
              <InputField
                type="email"
                placeholder="Enter contact email"
                value={state.point_of_contact_email || ''}
                onChange={e =>
                  setState(prev => ({ ...prev, point_of_contact_email: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Phone
              </label>
              <InputField
                type="text"
                placeholder="Enter contact phone"
                value={state.point_of_contact_phone || ''}
                onChange={e =>
                  setState(prev => ({ ...prev, point_of_contact_phone: e.target.value }))
                }
                maxLength={20}
                required
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 space-y-4 rounded-md shadow">
        <h3 className="text-xl font-semibold text-black">Assignment & Due Date</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assigned Sales Person
            </label>
            <select
              value={state.assigned_sales_person || ''}
              onChange={e =>
                setState(prev => ({ ...prev, assigned_sales_person: e.target.value }))
              }
              className="w-full p-2 border rounded-md focus:outline-indigo-600"
              required
            >
              <option value="">Select Team Member</option>
              {state.teamMembers.map(member => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.designation || 'No designation'})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date for Quotation
            </label>
            <InputField
              type="date"
              value={state.due_date_for_quotation || ''}
              onChange={e =>
                setState(prev => ({ ...prev, due_date_for_quotation: e.target.value }))
              }
              required
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-4 space-y-4 rounded-md shadow">
        <h3 className="text-xl font-semibold text-black">Quotation Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quotation Status
            </label>
            <select
              value={state.quotation_status || ''}
              onChange={e =>
                setState(prev => ({ ...prev, quotation_status: e.target.value }))
              }
              className="w-full p-2 border rounded-md focus:outline-indigo-600"
              required
            >
              <option value="">Select Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="PO Created">PO Created</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Follow-up Frequency
            </label>
            <select
              value={state.followup_frequency || ''}
              onChange={e =>
                setState(prev => ({ ...prev, followup_frequency: e.target.value }))
              }
              className="w-full p-2 border rounded-md focus:outline-indigo-600"
              required
            >
              <option value="">Select Frequency</option>
              <option value="24_hours">24 Hours</option>
              <option value="3_days">3 Days</option>
              <option value="7_days">7 Days</option>
              <option value="every_7th_day">Every 7th Day</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Next Follow-up Date
            </label>
            <InputField
              type="date"
              value={state.next_followup_date || ''}
              readOnly
              className="w-full bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Remarks
            </label>
            <InputField
              type="text"
              placeholder="Enter remarks"
              value={state.remarks || ''}
              onChange={e =>
                setState(prev => ({ ...prev, remarks: e.target.value }))
              }
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-4 space-y-4 rounded-md shadow" ref={itemsSectionRef}>
        <h3 className="text-xl font-semibold text-black">Items</h3>
        {state.items.map((item, index) => (
          <div key={index} className="border p-4 rounded-md bg-gray-50 shadow mb-4">
            <h4 className="text-sm font-semibold mb-2">Item {index + 1}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item
                </label>
                <select
                  value={item.item || ''}
                  onChange={e => handleItemChange(index, 'item', e.target.value)}
                  className="w-full p-2 border rounded-md focus:outline-indigo-600"
                  required
                >
                  <option value="">Select Item</option>
                  {state.itemsList.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <InputField
                  type="number"
                  placeholder="Enter quantity"
                  value={item.quantity || ''}
                  onChange={e => handleItemChange(index, 'quantity', e.target.value)}
                  min={0}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit
                </label>
                <select
                  value={item.unit || ''}
                  onChange={e => handleItemChange(index, 'unit', e.target.value)}
                  className="w-full p-2 border rounded-md focus:outline-indigo-600"
                  required
                >
                  <option value="">Select Unit</option>
                  {state.units.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Price
                </label>
                <InputField
                  type="number"
                  placeholder="Enter unit price"
                  value={item.unit_price || ''}
                  onChange={e => handleItemChange(index, 'unit_price', e.target.value)}
                  min={0}
                  step="0.01"
                  required
                />
              </div>
              {state.items.length > 1 && (
                <div className="mt-6">
                  <Button
                    onClick={() => removeItem(index)}
                    className="w-full bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
        <Button
          onClick={addItem}
          className="bg-blue-600 text-white rounded-md w-full hover:bg-blue-500"
        >
          Add Item
        </Button>
      </div>
      <div className="bg-white p-4 space-y-4 rounded-md shadow">
        <h3 className="text-xl font-semibold text-black">Is VAT Applicable?</h3>
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          <div className='flex items-center'>
            <label className="flex items-center text-sm font-medium text-gray-700">
              VAT Applicable (15%)
            </label>
            <input
              type="checkbox"
              checked={state.vat_applicable}
              onChange={e =>
                setState(prev => ({ ...prev, vat_applicable: e.target.checked }))
              }
              className="ml-2"
            />
          </div>
        </div>
      </div>
    </div>
  );

  if (state.loading) {
    return <div className="flex justify-center items-center min-h-screen"><Loading /></div>;
  }

  return (
    <div className="mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Edit Quotation</h1>
      <div className="text-sm text-gray-600 mb-4">
        Last saved:{' '}
        {state.lastSaved ? state.lastSaved.toLocaleTimeString() : 'Not saved yet'}
      </div>
      <form onSubmit={handleSubmit} className="mb-6">
        {renderForm()}
        <div className="flex justify-end mt-6">
          <Button
            type="submit"
            disabled={!isFormValid()}
            className={`bg-indigo-600 text-white rounded-md hover:bg-indigo-700 px-4 py-2 ${!isFormValid() ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
            Update Quotation
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditQuotation;