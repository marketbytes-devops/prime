// src/pages/PreJob/RFQ/AddRFQ.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../../helpers/apiClient";
import { toast } from "react-toastify";
import InputField from "../../../components/InputField";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";

const AddRFQ = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [state, setState] = useState({
    company_name: "",
    company_address: "",
    company_phone: "",
    company_email: "",
    rfq_channel: "",
    point_of_contact_name: "",
    point_of_contact_email: "",
    point_of_contact_phone: "",
    assigned_sales_person: "",
    due_date_for_quotation: "",
    items: [{ item: "", quantity: "", unit: "" }],
    channels: [],
    teamMembers: [],
    itemsList: [],
    units: [],
    isNewClient: false, // Track if "New Client" is selected
  });
  const [isModalOpen, setIsModalOpen] = useState(true); // Initial client selection modal
  const [isExistingClientModalOpen, setIsExistingClientModalOpen] = useState(false);
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [rfqChannels, setRfqChannels] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [formData, setFormData] = useState({
    company_name: "",
    address: "",
    phone: "",
    email: "",
    rfq_channel: "",
    attention_name: "",
    attention_phone: "",
    attention_email: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [channelsRes, teamsRes, itemsRes, unitsRes, clientsRes, channelsResRfq] = await Promise.all([
          apiClient.get("channels/"),
          apiClient.get("teams/"),
          apiClient.get("items/"),
          apiClient.get("units/"),
          apiClient.get("/rfqs/"),
          apiClient.get("/channels/"),
        ]);
        setState((prev) => ({
          ...prev,
          channels: channelsRes.data || [],
          teamMembers: teamsRes.data || [],
          itemsList: itemsRes.data || [],
          units: unitsRes.data || [],
        }));
        const clientData = Array.isArray(clientsRes.data)
          ? clientsRes.data
          : clientsRes.data.results || [];
        setClients(clientData);
        setFilteredClients(clientData.sort((a, b) => a.company_name.localeCompare(b.company_name)));
        setRfqChannels(channelsResRfq.data.map((channel) => channel.channel_name) || []);
        setError(null);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load clients or RFQ channels.");
        toast.error("Failed to load clients or RFQ channels.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const filtered = clients
      .filter((client) =>
        client.company_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => a.company_name.localeCompare(b.company_name));
    setFilteredClients(filtered);
  }, [searchQuery, clients]);

  useEffect(() => {
    if (selectedClient) {
      setFormData({
        company_name: selectedClient.company_name || "",
        address: selectedClient.address || "",
        phone: selectedClient.phone || "",
        email: selectedClient.email || "",
        rfq_channel: selectedClient.rfq_channel || "",
        attention_name: selectedClient.attention_name || "",
        attention_phone: selectedClient.attention_phone || "",
        attention_email: selectedClient.attention_email || "",
      });
    }
  }, [selectedClient]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const addItem = () => {
    setState((prev) => ({
      ...prev,
      items: [...prev.items, { item: "", quantity: "", unit: "" }],
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
      return state.items.every((item) => item.item && item.quantity && item.unit);
    }
    return false;
  };

  const handleNext = () => {
    setStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e) => {
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
      items: state.items.map((item) => ({
        item: item.item || null,
        quantity: item.quantity ? parseInt(item.quantity) : null,
        unit: item.unit || null,
        unit_price: null,
      })),
    };
    await apiClient.post("rfqs/", payload);
    navigate("/view-rfq");
  };

  const handleClientSelect = (type) => {
    setIsModalOpen(false);
    if (type === "new") {
      setState((prev) => ({ ...prev, isNewClient: true }));
    } else if (type === "existing") {
      setIsExistingClientModalOpen(true);
    }
  };

  const handleExistingClientSelect = (client) => {
    setSelectedClient(client);
    setSearchQuery("");
    setShowDropdown(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCloseClientForm = () => {
    setSelectedClient(null);
    setFormData({
      company_name: "",
      address: "",
      phone: "",
      email: "",
      rfq_channel: "",
      attention_name: "",
      attention_phone: "",
      attention_email: "",
    });
    setSearchQuery("");
    setIsExistingClientModalOpen(false);
  };

  const handleExistingSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { attention_email, attention_phone, attention_name } = formData;
    if (attention_email && !/\S+@\S+\.\S+/.test(attention_email)) {
      toast.error("Attention Email is invalid.");
      setIsSubmitting(false);
      return;
    }

    if (!selectedClient?.id) {
      toast.error("Please select a client first.");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        ...selectedClient,
        attention_name: attention_name || null,
        attention_phone: attention_phone || null,
        attention_email: attention_email || null,
      };

      await apiClient.put(`/add-rfqs/${selectedClient.id}/`, payload);
      toast.success("Point of Contact updated successfully!");
      setIsExistingClientModalOpen(false);
      setState((prev) => ({
        ...prev,
        company_name: payload.company_name,
        company_address: payload.address,
        company_phone: payload.phone,
        company_email: payload.email,
        rfq_channel: payload.rfq_channel,
        point_of_contact_name: payload.attention_name,
        point_of_contact_email: payload.attention_email,
        point_of_contact_phone: payload.attention_phone,
      }));
    } catch (error) {
      console.error("Failed to update Point of Contact:", error);
      toast.error("Failed to update Point of Contact.");
    } finally {
      setIsSubmitting(false);
    }
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
            onChange={(e) =>
              setState((prev) => ({ ...prev, company_name: e.target.value }))
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
            onChange={(e) =>
              setState((prev) => ({ ...prev, company_address: e.target.value }))
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
            onChange={(e) =>
              setState((prev) => ({ ...prev, company_phone: e.target.value }))
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
            onChange={(e) =>
              setState((prev) => ({ ...prev, company_email: e.target.value }))
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
            onChange={(e) =>
              setState((prev) => ({ ...prev, rfq_channel: e.target.value }))
            }
            className="w-full p-2 border rounded focus:outline-indigo-500"
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
        <h2 className="text-black text-xl font-semibold">Point of Contact</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact Name
          </label>
          <InputField
            type="text"
            placeholder="Enter contact name"
            value={state.point_of_contact_name}
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                point_of_contact_name: e.target.value,
              }))
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
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                point_of_contact_email: e.target.value,
              }))
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
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                point_of_contact_phone: e.target.value,
              }))
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
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                assigned_sales_person: e.target.value,
              }))
            }
            className="w-full p-2 border rounded focus:outline-indigo-500"
          >
            <option value="">Select Team Member</option>
            {state.teamMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} ({member.designation || "No designation"})
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
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                due_date_for_quotation: e.target.value,
              }))
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
                onChange={(e) => handleItemChange(index, "item", e.target.value)}
                className="w-full p-2 border rounded focus:outline-indigo-500"
              >
                <option value="">Select Item</option>
                {state.itemsList.map((i) => (
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
                onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                min={0}
              />
            </div>
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <select
                value={item.unit}
                onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                className="w-full p-2 border rounded focus:outline-indigo-500"
              >
                <option value="">Select Unit</option>
                {state.units.map((u) => (
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
            step === 1 ? "font-bold text-indigo-600" : "text-gray-500"
          }`}
        >
          Step 1: Company & Contact
        </div>
        <div
          className={`flex-1 text-center ${
            step === 2 ? "font-bold text-indigo-600" : "text-gray-500"
          }`}
        >
          Step 2: Assignment & Dates
        </div>
        <div
          className={`flex-1 text-end ${
            step === 3 ? "font-bold text-indigo-600" : "text-gray-500"
          }`}
        >
          Step 3: Items
        </div>
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Select Client Type"
      >
        <div className="flex flex-col space-y-4">
          <Button
            onClick={() => handleClientSelect("new")}
            className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
          >
            New Client
          </Button>
          <Button
            onClick={() => handleClientSelect("existing")}
            className="bg-gray-200 text-gray-800 p-3 rounded-lg hover:bg-gray-300 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
          >
            Existing Client
          </Button>
        </div>
      </Modal>
      <Modal
        isOpen={isExistingClientModalOpen}
        onClose={handleCloseClientForm}
        title="Select Existing Client"
      >
        <div className="p-4">
          {!selectedClient && (
            <div className="mb-4 relative" ref={dropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Client
              </label>
              <input
                type="text"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className="w-full p-2 border rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-500 text-sm"
              />
              {showDropdown &&
                searchQuery &&
                (filteredClients.length > 0 ? (
                  <ul className="absolute z-10 w-full max-w-md bg-white border border-gray-400 rounded mt-1 max-h-40 overflow-y-auto">
                    {filteredClients.map((client) => (
                      <li
                        key={client.id}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleExistingClientSelect(client)}
                      >
                        {client.company_name} (ID: {client.id})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600 mt-2">No clients found.</p>
                ))}
            </div>
          )}

          {loading && <p className="text-gray-600">Loading clients...</p>}
          {error && <p className="text-red-500">{error}</p>}

          {selectedClient && !loading && (
            <form onSubmit={handleExistingSubmit}>
              <div className="flex justify-end mb-2">
                <button
                  onClick={handleCloseClientForm}
                  className="text-gray-600 hover:text-gray-900 font-bold text-xl"
                  aria-label="Close client form"
                >
                  ✕
                </button>
              </div>

              <h3 className="text-lg font-medium mt-4 mb-2">Client Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {[
                  { name: "company_name", label: "Company Name" },
                  { name: "address", label: "Company Address" },
                  { name: "phone", label: "Company Phone" },
                  { name: "email", label: "Company Email", type: "email" },
                ].map((field) => (
                  <div key={field.name} className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700">
                      {field.label}
                    </label>
                    <input
                      type={field.type || "text"}
                      name={field.name}
                      value={formData[field.name] || ""}
                      readOnly
                      disabled
                      className="mt-1 p-2 border border-gray-300 rounded bg-gray-100 text-gray-800 cursor-not-allowed text-sm"
                    />
                  </div>
                ))}
              </div>

              <h3 className="text-lg font-medium mt-4 mb-2">RFQ Channel</h3>
              <div className="mb-6">
                <input
                  type="text"
                  value={formData.rfq_channel || ""}
                  readOnly
                  disabled
                  className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-gray-800 cursor-not-allowed text-sm"
                />
              </div>

              <h3 className="text-lg font-medium mt-4 mb-2">Point of Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: "attention_name", label: "Name" },
                  { name: "attention_phone", label: "Phone" },
                ].map((field) => (
                  <div key={field.name} className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700">{field.label}</label>
                    <input
                      type="text"
                      name={field.name}
                      value={formData[field.name] || ""}
                      onChange={handleInputChange}
                      className="mt-1 p-2 border rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-500 text-sm"
                      placeholder={`Enter ${field.label}`}
                    />
                  </div>
                ))}
                <div className="md:col-span-2 flex flex-col">
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    name="attention_email"
                    value={formData.attention_email || ""}
                    onChange={handleInputChange}
                    className="mt-1 p-2 border rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-500 text-sm"
                    placeholder="Enter Email"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 disabled:bg-gray-400"
              >
                {isSubmitting ? "Saving..." : "Save Point of Contact"}
              </button>
            </form>
          )}
        </div>
      </Modal>
      {state.isNewClient && (
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
                  !isStepValid() ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Submit RFQ
              </Button>
            )}
          </div>
        </form>
      )}
    </div>
  );
};

export default AddRFQ;