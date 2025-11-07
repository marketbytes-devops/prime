import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../../../helpers/apiClient';
import InputField from '../../../components/InputField';
import Button from '../../../components/Button';
import Loading from '../../../components/Loading';
import { toast } from 'react-toastify';

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const EditRFQ = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isQuotation = location.state?.isQuotation || false;
  const scrollToVat = location.state?.scrollToVat || false;
  const vatSectionRef = useRef(null);

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
    rfq_status: '',
    vat_applicable: false,
    items: [{ item: '', quantity: '', unit: '', unit_price: '' }],
    channels: [],
    teamMembers: [],
    itemsList: [],
    units: [],
    loading: true,
    lastSaved: null,
    submitting: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rfqRes, channelsRes, teamsRes, itemsRes, unitsRes] = await Promise.all([
          apiClient.get(`rfqs/${id}/`),
          apiClient.get('channels/'),
          apiClient.get('teams/'),
          apiClient.get('items/'),
          apiClient.get('units/'),
        ]);

        setState((prev) => ({
          ...prev,
          company_name: rfqRes.data.company_name || '',
          company_address: rfqRes.data.company_address || '',
          company_phone: rfqRes.data.company_phone || '',
          company_email: rfqRes.data.company_email || '',
          rfq_channel: rfqRes.data.rfq_channel || '',
          point_of_contact_name: rfqRes.data.point_of_contact_name || '',
          point_of_contact_email: rfqRes.data.point_of_contact_email || '',
          point_of_contact_phone: rfqRes.data.point_of_contact_phone || '',
          assigned_sales_person: rfqRes.data.assigned_sales_person || '',
          due_date_for_quotation: rfqRes.data.due_date_for_quotation || '',
          rfq_status: rfqRes.data.rfq_status || 'Processing',
          vat_applicable: rfqRes.data.vat_applicable || false,
          items: rfqRes.data.items && rfqRes.data.items.length
            ? rfqRes.data.items.map((item) => ({
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

        if (scrollToVat && vatSectionRef.current) {
          setTimeout(() => {
            vatSectionRef.current.scrollIntoView({ behavior: 'smooth' });
          }, 150);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load RFQ data.');
        setState((prev) => ({ ...prev, loading: false }));
      }
    };
    fetchData();
  }, [id, scrollToVat]);

  const buildRfqPayload = useCallback(() => ({
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
    rfq_status: state.rfq_status || null,
    vat_applicable: state.vat_applicable,
    items: state.items.map((item) => ({
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
    state.rfq_status,
    state.vat_applicable,
    state.items,
  ]);

  const buildQuotationPayload = useCallback(() => ({
    rfq: id,
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
    quotation_status: 'Pending',
    followup_frequency: '24_hours',
    remarks: '',
    vat_applicable: state.vat_applicable,
    items: state.items.map((item) => ({
      item: item.item || null,
      quantity: item.quantity ? parseInt(item.quantity) : null,
      unit: item.unit || null,
      unit_price: item.unit_price ? parseFloat(item.unit_price) : null,
    })),
  }), [
    id,
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
    state.vat_applicable,
    state.items,
  ]);

  const autosave = useCallback(
    debounce(async () => {
      try {
        const rfqPayload = buildRfqPayload();
        const hasUnitPrices = state.items.every(
          (item) => item.unit_price != null && item.unit_price !== ''
        );
        if (hasUnitPrices && rfqPayload.rfq_status !== 'Completed') {
          rfqPayload.rfq_status = 'Completed';
          setState((prev) => ({ ...prev, rfq_status: 'Completed' }));
        }
        await apiClient.patch(`rfqs/${id}/`, rfqPayload);
        setState((prev) => ({ ...prev, lastSaved: new Date() }));
      } catch (error) {
        console.error('Error autosaving RFQ:', error);
      }
    }, 2000),
    [buildRfqPayload, id, state.items]
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
    state.rfq_status,
    state.vat_applicable,
    state.items,
    autosave,
    state.loading,
  ]);

  const addItem = () => {
    setState((prev) => ({
      ...prev,
      items: [...prev.items, { item: '', quantity: '', unit: '', unit_price: '' }],
    }));
  };

  const removeItem = (index) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemChange = (index, field, value) => {
    setState((prev) => {
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
      state.rfq_status;
    const isItemsValid = state.items.every(
      (item) =>
        item.item &&
        item.quantity &&
        item.unit &&
        (!isQuotation || (isQuotation && item.unit_price))
    );
    return isBasicInfoValid && isItemsValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) {
      toast.error('Please fill all required fields, including unit prices for quotation conversion.');
      if (isQuotation && vatSectionRef.current) {
        vatSectionRef.current.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    setState((prev) => ({ ...prev, submitting: true }));
    try {
      const rfqPayload = buildRfqPayload();
      const hasUnitPrices = state.items.every(
        (item) => item.unit_price != null && item.unit_price !== ''
      );
      if (hasUnitPrices) {
        rfqPayload.rfq_status = 'Completed';
      }
      await apiClient.patch(`rfqs/${id}/`, rfqPayload);

      if (isQuotation) {
        const quotationPayload = buildQuotationPayload();
        await apiClient.post('/quotations/', quotationPayload);
      }

      navigate(isQuotation ? '/view-quotation' : '/view-rfq');
      toast.success(isQuotation ? 'Quotation created successfully!' : 'RFQ updated successfully!');
    } catch (error) {
      console.error('Error submitting:', error);
      toast.error('Failed to submit.');
    } finally {
      setState((prev) => ({ ...prev, submitting: false }));
    }
  };

  if (state.loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading />
      </div>
    );
  }

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
              onChange={(e) =>
                setState((prev) => ({ ...prev, company_name: e.target.value }))
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
              onChange={(e) =>
                setState((prev) => ({ ...prev, company_address: e.target.value }))
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
              onChange={(e) =>
                setState((prev) => ({ ...prev, company_phone: e.target.value }))
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
              onChange={(e) =>
                setState((prev) => ({ ...prev, company_email: e.target.value }))
              }
              required
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-4 space-y-4 rounded-md shadow">
        <h3 className="text-xl font-semibold text-black">RFQ Channel</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            RFQ Channel
          </label>
          <select
            value={state.rfq_channel || ''}
            onChange={(e) =>
              setState((prev) => ({ ...prev, rfq_channel: e.target.value }))
            }
            className="w-full p-2 border rounded-md focus:outline-indigo-600"
            required
          >
            <option value="">Select Channel</option>
            {state.channels.map((channel) => (
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
              onChange={(e) =>
                setState((prev) => ({ ...prev, point_of_contact_name: e.target.value }))
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
                onChange={(e) =>
                  setState((prev) => ({ ...prev, point_of_contact_email: e.target.value }))
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
                onChange={(e) =>
                  setState((prev) => ({ ...prev, point_of_contact_phone: e.target.value }))
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
              onChange={(e) =>
                setState((prev) => ({ ...prev, assigned_sales_person: e.target.value }))
              }
              className="w-full p-2 border rounded-md focus:outline-indigo-600"
              required
            >
              <option value="">Select Team Member</option>
              {state.teamMembers.map((member) => (
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
              onChange={(e) =>
                setState((prev) => ({ ...prev, due_date_for_quotation: e.target.value }))
              }
              required
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-4 space-y-4 rounded-md shadow">
        <h3 className="text-xl font-semibold text-black">RFQ Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              RFQ Status
            </label>
            <select
              value={state.rfq_status || ''}
              onChange={(e) =>
                setState((prev) => ({ ...prev, rfq_status: e.target.value }))
              }
              className="w-full p-2 border rounded-md focus:outline-indigo-600"
              required
            >
              <option value="">Select Status</option>
              <option value="Processing">Processing</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 space-y-4 rounded-md shadow">
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
                  onChange={(e) => handleItemChange(index, 'item', e.target.value)}
                  className="w-full p-2 border rounded-md focus:outline-indigo-600"
                  required
                >
                  <option value="">Select Item</option>
                  {state.itemsList.map((i) => (
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
                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
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
                  onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                  className="w-full p-2 border rounded-md focus:outline-indigo-600"
                  required
                >
                  <option value="">Select Unit</option>
                  {state.units.map((u) => (
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
                  onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                  min={0}
                  step="0.01"
                  required={isQuotation}
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

      <div className="bg-white p-4 space-y-4 rounded-md shadow" ref={vatSectionRef}>
        <h3 className="text-xl font-semibold text-black">Is VAT Applicable?</h3>
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          <div className="flex items-center">
            <label className="flex items-center text-sm font-medium text-gray-700">VAT Applicable (15%)</label>
            <input
              type="checkbox"
              checked={state.vat_applicable}
              onChange={(e) =>
                setState((prev) => ({ ...prev, vat_applicable: e.target.checked }))
              }
              className="ml-2"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto p-4">
      <h1 className="text-2xl text-center sm:text-left font-semibold mb-4">
        {isQuotation ? 'Convert to Quotation' : 'Edit RFQ'}
      </h1>
      <div className="text-sm text-center sm:text-left text-gray-600 mb-4">
        Last saved:{' '}
        {state.lastSaved ? state.lastSaved.toLocaleTimeString() : 'Not saved yet'}
      </div>
      <form onSubmit={handleSubmit} className="mb-6">
        {renderForm()}
        <div className="flex justify-end mt-6">
          <Button
            type="submit"
            disabled={!isFormValid() || state.submitting}
            className={`bg-indigo-600 text-white rounded-md hover:bg-indigo-700 px-4 py-2 ${(!isFormValid() || state.submitting) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
            {state.submitting ? 'Submitting...' : (isQuotation ? 'Submit Quotation' : 'Update RFQ')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditRFQ;