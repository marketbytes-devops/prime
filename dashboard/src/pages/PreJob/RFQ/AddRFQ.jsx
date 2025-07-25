import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../helpers/apiClient';
import InputField from '../../../components/InputField';
import Button from '../../../components/Button';

const AddRFQ = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
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
    items: [{ item: '', quantity: '', unit: '' }],
    channels: [],
    teamMembers: [],
    itemsList: [],
    units: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [channelsRes, teamsRes, itemsRes, unitsRes] = await Promise.all([
          apiClient.get('channels/'),
          apiClient.get('teams/'),
          apiClient.get('items/'),
          apiClient.get('units/'),
        ]);
        setState(prev => ({
          ...prev,
          channels: channelsRes.data || [],
          teamMembers: teamsRes.data || [],
          itemsList: itemsRes.data || [],
          units: unitsRes.data || [],
        }));
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  const addItem = () => {
    setState(prev => ({
      ...prev,
      items: [...prev.items, { item: '', quantity: '', unit: '' }],
    }));
  };

  const removeItem = (index) => {
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

  const isStepValid = () => {
    if (step === 1) {
      return (
        state.company_name &&
        state.company_address &&
        state.company_phone &&
        state.company_email &&
        state.rfq_channel &&
        state.point_of_contact_name &&
        state.point_of_contact_email &&
        state.point_of_contact_phone
      );
    } else if (step === 2) {
      return state.assigned_sales_person && state.due_date_for_quotation;
    } else if (step === 3) {
      return state.items.every(item => item.item && item.quantity && item.unit);
    }
    return false;
  };

  const handleNext = () => {
    setStep(prev => prev + 1);
  };

  const handlePrev = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!isStepValid()) return;
    const payload = {
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
      rfq_status: null,
      items: state.items.map(item => ({
        item: item.item || null,
        quantity: item.quantity ? parseInt(item.quantity) : null,
        unit: item.unit || null,
        unit_price: null,
      })),
    };
    await apiClient.post('rfqs/', payload);
    navigate('/view-rfq');
  };

  const renderStep1 = () => (
    <div className="grid gap-4">
      <div className="bg-white p-4 space-y-4 rounded-md shadow">
        <h2 className="text-black text-xl font-semibold">Company Details</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Name
          </label>
          <InputField
            type="text"
            placeholder="Enter company name"
            value={state.company_name}
            onChange={e =>
              setState(prev => ({ ...prev, company_name: e.target.value }))
            }
            maxLength={100}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Address
          </label>
          <InputField
            type="text"
            placeholder="Enter company address"
            value={state.company_address}
            onChange={e =>
              setState(prev => ({ ...prev, company_address: e.target.value }))
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Phone
          </label>
          <InputField
            type="text"
            placeholder="Enter company phone"
            value={state.company_phone}
            onChange={e =>
              setState(prev => ({ ...prev, company_phone: e.target.value }))
            }
            maxLength={20}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Email
          </label>
          <InputField
            type="email"
            placeholder="Enter company email"
            value={state.company_email}
            onChange={e =>
              setState(prev => ({ ...prev, company_email: e.target.value }))
            }
          />
        </div>
      </div>
      <div className="bg-white p-4 space-y-4 rounded-md shadow">
        <h2 className="text-black text-xl font-semibold">RFQ Channel</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            RFQ Channel
          </label>
          <select
            value={state.rfq_channel}
            onChange={e =>
              setState(prev => ({ ...prev, rfq_channel: e.target.value }))
            }
            className="w-full p-2 border rounded focus:outline-indigo-500"
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
        <h2 className="text-black text-xl font-semibold">Point of Contact</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact Name
          </label>
          <InputField
            type="text"
            placeholder="Enter contact name"
            value={state.point_of_contact_name}
            onChange={e =>
              setState(prev => ({ ...prev, point_of_contact_name: e.target.value }))
            }
            maxLength={100}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact Email
          </label>
          <InputField
            type="email"
            placeholder="Enter contact email"
            value={state.point_of_contact_email}
            onChange={e =>
              setState(prev => ({ ...prev, point_of_contact_email: e.target.value }))
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact Phone
          </label>
          <InputField
            type="text"
            placeholder="Enter contact phone"
            value={state.point_of_contact_phone}
            onChange={e =>
              setState(prev => ({ ...prev, point_of_contact_phone: e.target.value }))
            }
            maxLength={20}
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="grid gap-4">
      <div className="bg-white p-4 space-y-4 rounded-md shadow">
        <h2 className="text-black text-xl font-semibold">
          Assigned Person & Due Date
        </h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assigned Sales Person
          </label>
          <select
            value={state.assigned_sales_person}
            onChange={e =>
              setState(prev => ({ ...prev, assigned_sales_person: e.target.value }))
            }
            className="w-full p-2 border rounded focus:outline-indigo-500"
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
            value={state.due_date_for_quotation}
            onChange={e =>
              setState(prev => ({ ...prev, due_date_for_quotation: e.target.value }))
            }
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="grid gap-4">
      {state.items.map((item, index) => (
        <div key={index} className="border p-4 rounded bg-gray-50">
          <h4 className="text-md font-medium mb-2">Item {index + 1}</h4>
          <div className="flex items-center justify-between gap-4">
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item
              </label>
              <select
                value={item.item}
                onChange={e => handleItemChange(index, 'item', e.target.value)}
                className="w-full p-2 border rounded focus:outline-indigo-500"
              >
                <option value="">Select Item</option>
                {state.itemsList.map(i => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <InputField
                type="number"
                placeholder="Enter quantity"
                value={item.quantity}
                onChange={e => handleItemChange(index, 'quantity', e.target.value)}
                min={0}
              />
            </div>
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <select
                value={item.unit}
                onChange={e => handleItemChange(index, 'unit', e.target.value)}
                className="w-full p-2 border rounded focus:outline-indigo-500"
              >
                <option value="">Select Unit</option>
                {state.units.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            {state.items.length > 1 && (
              <Button
                onClick={() => removeItem(index)}
                className="mt-5 w-full bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Remove Item
              </Button>
            )}
          </div>
        </div>
      ))}
      <Button
        onClick={addItem}
        className="bg-blue-500 text-white rounded-md hover:bg-blue-400 mt-2"
      >
        Add Another Item
      </Button>
    </div>
  );

  return (
    <div className="mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Add RFQ</h1>
      <div className="flex justify-between mb-6">
        <div
          className={`flex-1 text-start ${
            step === 1 ? 'font-bold text-indigo-600' : 'text-gray-500'
          }`}
        >
          Step 1: Company & Contact
        </div>
        <div
          className={`flex-1 text-center ${
            step === 2 ? 'font-bold text-indigo-600' : 'text-gray-500'
          }`}
        >
          Step 2: Assignment & Dates
        </div>
        <div
          className={`flex-1 text-end ${
            step === 3 ? 'font-bold text-indigo-600' : 'text-gray-500'
          }`}
        >
          Step 3: Items
        </div>
      </div>
      <form onSubmit={handleSubmit} className="mb-6">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        <div className="flex justify-between space-x-4 mt-6">
          {step > 1 && (
            <Button
              onClick={handlePrev}
              className="bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Previous
            </Button>
          )}
          {step < 3 ? (
            <Button
              onClick={handleNext}
              className="bg-indigo-500 text-white rounded-md hover:bg-indigo-600 ml-auto"
            >
              Next
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={!isStepValid()}
              className={`bg-indigo-500 text-white rounded-md hover:bg-indigo-600 ml-auto ${
                !isStepValid() ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Submit RFQ
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AddRFQ;