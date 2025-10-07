import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../../helpers/apiClient";
import { toast } from "react-toastify";
import InputField from "../../../components/InputField";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";

const SearchableDropdown = ({ options, value, onChange, placeholder, allowAddItem, apiEndpoint }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [addingItem, setAddingItem] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const selectedOption = options.find((option) => option.id === value);
    setSearchTerm(selectedOption ? selectedOption.name : "");
  }, [value, options]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((option) =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option) => {
    onChange(option.id, options);
    setSearchTerm(option.name);
    setIsOpen(false);
  };

  const handleAddItem = async (itemName) => {
    if (!itemName.trim()) {
      toast.error("Please enter a valid name.");
      return;
    }

    if (options.some((option) => option.name.toLowerCase() === itemName.toLowerCase())) {
      toast.error("This name already exists.");
      return;
    }

    setAddingItem(true);
    try {
      const response = await apiClient.post(apiEndpoint, { name: itemName });
      toast.success("Added successfully!");
      const newItem = response.data;
      setNewItemName("");
      setSearchTerm(newItem.name);
      onChange(newItem.id, [...options, newItem]);
    } catch (error) {
      console.error(`Error adding to ${apiEndpoint}:`, error);
      toast.error(`Failed to add ${apiEndpoint === "items/" ? "item" : "unit"}.`);
    } finally {
      setAddingItem(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (searchTerm.trim()) {
        const selectedOption = filteredOptions.find(
          (option) => option.name.toLowerCase() === searchTerm.toLowerCase()
        );
        if (selectedOption) {
          handleSelect(selectedOption);
        } else if (allowAddItem) {
          handleAddItem(searchTerm);
        }
      }
    }
  };

  const handleBlur = () => {
    if (searchTerm.trim()) {
      const selectedOption = filteredOptions.find(
        (option) => option.name.toLowerCase() === searchTerm.toLowerCase()
      );
      if (selectedOption) {
        handleSelect(selectedOption);
      } else if (allowAddItem) {
        handleAddItem(searchTerm);
      } else {
        setSearchTerm(options.find((option) => option.id === value)?.name || "");
        onChange(value, options);
      }
    } else {
      setSearchTerm(options.find((option) => option.id === value)?.name || "");
      onChange(value, options);
    }
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <InputField
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className="w-full p-2 border rounded focus:outline-indigo-500"
        disabled={addingItem}
      />
      {isOpen && (
        <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto mt-1 transition-all duration-200 ease-in-out">
          {allowAddItem && (
            <div className="p-2 border-b grid grid-cols-2 items-center gap-2">
              <InputField
                type="text"
                placeholder={`Add new ${apiEndpoint === "items/" ? "item" : "unit"}...`}
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="flex-1 p-2 border rounded"
                disabled={addingItem}
              />
              <Button
                onClick={() => handleAddItem(newItemName)}
                className="bg-green-500 text-white p-2 rounded hover:bg-green-600"
                disabled={addingItem}
              >
                {addingItem ? "Adding..." : "+"}
              </Button>
            </div>
          )}
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <div
                key={option.id}
                className="p-2 hover:bg-indigo-100 cursor-pointer"
                onClick={() => handleSelect(option)}
              >
                {option.name}
              </div>
            ))
          ) : (
            <div className="p-2 text-gray-500">No options found</div>
          )}
        </div>
      )}
    </div>
  );
};

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
    clients: [], // Added for existing clients
    selectedClientId: null, // Track selected client
    isNewClient: false,
    originalContact: { // Store original Point of Contact for comparison
      point_of_contact_name: "",
      point_of_contact_email: "",
      point_of_contact_phone: "",
    },
  });
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [showClientList, setShowClientList] = useState(false); // Toggle client list modal
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [channelsRes, teamsRes, itemsRes, unitsRes, clientsRes] = await Promise.all([
          apiClient.get("channels/"),
          apiClient.get("teams/"),
          apiClient.get("items/"),
          apiClient.get("units/"),
          apiClient.get("clients/"), // Fetch clients
        ]);
        setState((prev) => ({
          ...prev,
          channels: channelsRes.data || [],
          teamMembers: teamsRes.data || [],
          itemsList: itemsRes.data || [],
          units: unitsRes.data || [],
          clients: clientsRes.data || [],
        }));
        setError(null);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load data.");
        toast.error("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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

  const handleItemChange = (index, field, value, newOptions) => {
    setState((prev) => {
      const newItems = [...prev.items];
      newItems[index][field] = value;
      return {
        ...prev,
        items: newItems,
        ...(newOptions && field === "item" && { itemsList: newOptions }),
        ...(newOptions && field === "unit" && { units: newOptions }),
      };
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
      return state.items.every(
        (item) =>
          item.item !== "" &&
          item.item !== null &&
          item.item !== undefined &&
          item.quantity !== "" &&
          item.quantity !== null &&
          item.quantity !== undefined &&
          item.unit !== "" &&
          item.unit !== null &&
          item.unit !== undefined
      );
    }
    return false;
  };

  const hasContactChanged = () => {
    return (
      state.point_of_contact_name !== state.originalContact.point_of_contact_name ||
      state.point_of_contact_email !== state.originalContact.point_of_contact_email ||
      state.point_of_contact_phone !== state.originalContact.point_of_contact_phone
    );
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (isStepValid()) {
      if (step < 3) {
        setStep((prev) => prev + 1);
      }
    } else {
      toast.error("Please fill all required fields.");
    }
  };

  const handlePrev = (e) => {
    e.preventDefault();
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isStepValid()) {
      console.log("Validation failed:", state.items);
      toast.error("Please fill all required fields.");
      return;
    }

    setLoading(true);
    console.log("Submitting payload:", {
      ...state,
      items: state.items.map((item) => ({
        item: item.item ? parseInt(item.item) : null,
        quantity: item.quantity ? parseInt(item.quantity) : null,
        unit: item.unit ? parseInt(item.unit) : null,
        unit_price: null,
      })),
    });

    try {
      await apiClient.post("rfqs/", {
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
        rfq_status: "Pending",
        items: state.items.map((item) => ({
          item: item.item ? parseInt(item.item) : null,
          quantity: item.quantity ? parseInt(item.quantity) : null,
          unit: item.unit ? parseInt(item.unit) : null,
          unit_price: null,
        })),
      });

      toast.success("RFQ created successfully!");
      navigate("/view-rfq");
    } catch (error) {
      console.error("Error submitting RFQ:", error);
      setError("Failed to create RFQ. Please check the item and unit selections.");
      toast.error("Failed to create RFQ. Please check the item and unit selections.");
    } finally {
      setLoading(false);
    }
  };

  const handleClientSelect = (type) => {
    if (type === "new") {
      setState((prev) => ({ ...prev, isNewClient: true }));
      setIsModalOpen(false);
    } else if (type === "existing") {
      setShowClientList(true);
    }
  };

  const handleClientSelection = (client) => {
    setState((prev) => ({
      ...prev,
      selectedClientId: client.id,
      company_name: client.company_name || "",
      company_address: client.company_address || "",
      company_phone: client.company_phone || "",
      company_email: client.company_email || "",
      rfq_channel: client.rfq_channel || "",
      point_of_contact_name: client.point_of_contact_name || "",
      point_of_contact_email: client.point_of_contact_email || "",
      point_of_contact_phone: client.point_of_contact_phone || "",
      originalContact: {
        point_of_contact_name: client.point_of_contact_name || "",
        point_of_contact_email: client.point_of_contact_email || "",
        point_of_contact_phone: client.point_of_contact_phone || "",
      },
      isNewClient: false,
    }));
    setShowClientList(false);
    setIsModalOpen(false);
  };

  const handleSaveContact = async (e) => {
    e.preventDefault();
    if (!state.selectedClientId) {
      toast.error("No client selected.");
      return;
    }

    setLoading(true);
    try {
      await apiClient.put(`/clients/${state.selectedClientId}/`, {
        point_of_contact_name: state.point_of_contact_name || null,
        point_of_contact_email: state.point_of_contact_email || null,
        point_of_contact_phone: state.point_of_contact_phone || null,
      });
      toast.success("Point of Contact updated successfully!");
      setState((prev) => ({
        ...prev,
        originalContact: {
          point_of_contact_name: prev.point_of_contact_name,
          point_of_contact_email: prev.point_of_contact_email,
          point_of_contact_phone: prev.point_of_contact_phone,
        },
      }));
      setStep(2); // Proceed to Step 2
    } catch (error) {
      console.error("Error updating Point of Contact:", error);
      toast.error("Failed to update Point of Contact.");
    } finally {
      setLoading(false);
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
              state.isNewClient &&
              setState((prev) => ({ ...prev, company_name: e.target.value }))
            }
            maxLength={100}
            disabled={!state.isNewClient}
            className={state.isNewClient ? "" : "bg-gray-100 cursor-not-allowed"}
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
              state.isNewClient &&
              setState((prev) => ({ ...prev, company_address: e.target.value }))
            }
            disabled={!state.isNewClient}
            className={state.isNewClient ? "" : "bg-gray-100 cursor-not-allowed"}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Phone
          </label>
          <InputField
            type="number"
            placeholder="Enter company phone"
            value={state.company_phone}
            onChange={(e) =>
              state.isNewClient &&
              setState((prev) => ({ ...prev, company_phone: e.target.value }))
            }
            maxLength={20}
            disabled={!state.isNewClient}
            className={state.isNewClient ? "" : "bg-gray-100 cursor-not-allowed"}
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
              state.isNewClient &&
              setState((prev) => ({ ...prev, company_email: e.target.value }))
            }
            disabled={!state.isNewClient}
            className={state.isNewClient ? "" : "bg-gray-100 cursor-not-allowed"}
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
              state.isNewClient &&
              setState((prev) => ({ ...prev, rfq_channel: e.target.value }))
            }
            className={state.isNewClient ? "w-full p-2 border rounded focus:outline-indigo-500" : "w-full p-2 border rounded bg-gray-100 cursor-not-allowed"}
            disabled={!state.isNewClient}
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
            type="number"
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
      {!state.isNewClient && (
        <div className="flex justify-end mt-4">
          {hasContactChanged() ? (
            <Button
              type="button"
              onClick={handleSaveContact}
              className="w-fit whitespace-nowrap bg-indigo-500 text-white rounded-md hover:bg-indigo-600"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Point of Contact"}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleNext}
              className="w-fit whitespace-nowrap bg-indigo-500 text-white rounded-md hover:bg-indigo-600"
              disabled={!isStepValid()}
            >
              Go to Next Step
            </Button>
          )}
        </div>
      )}
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

  const renderStep3 = () => {
    console.log("state.items:", state.items);
    return (
      <div className="grid gap-4">
        {state.items.map((item, index) => (
          <div key={index} className="border p-4 rounded bg-gray-50">
            <h4 className="text-md font-medium mb-2">Item {index + 1}</h4>
            <div className="grid grid-cols-1 sm:flex items-center justify-between gap-4">
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item
                </label>
                <SearchableDropdown
                  options={state.itemsList}
                  value={item.item}
                  onChange={(value, newOptions) => handleItemChange(index, "item", value, newOptions)}
                  placeholder="Search or enter item..."
                  allowAddItem={true}
                  apiEndpoint="items/"
                />
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
                <SearchableDropdown
                  options={state.units}
                  value={item.unit}
                  onChange={(value, newOptions) => handleItemChange(index, "unit", value, newOptions)}
                  placeholder="Search or enter unit..."
                  allowAddItem={true}
                  apiEndpoint="units/"
                />
              </div>
              {state.items.length > 1 && (
                <Button
                  type="button"
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
          type="button"
          onClick={addItem}
          className="bg-blue-500 text-white rounded-md hover:bg-blue-400 mt-2"
        >
          Add Another Item
        </Button>
      </div>
    );
  };

  return (
    <div className="mx-auto p-4">
      <h1 className="text-2xl text-center sm:text-left font-bold mb-4">Add RFQ</h1>
      <div className="grid space-y-2 sm:flex justify-center sm:justify-between mb-6">
        <div
          className={`flex-1 text-center sm:text-start ${step === 1 ? "font-bold text-indigo-600" : "text-gray-500"}`}
        >
          Step 1: Company & Contact
        </div>
        <div
          className={`flex-1 text-center sm:text-center ${step === 2 ? "font-bold text-indigo-600" : "text-gray-500"}`}
        >
          Step 2: Assignment & Dates
        </div>
        <div
          className={`flex-1 text-center sm:text-end ${step === 3 ? "font-bold text-indigo-600" : "text-gray-500"}`}
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
            className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 shadow-md hover:shadow-lg transition-colors duration-300"
          >
            New Client
          </Button>
          <Button
            onClick={() => handleClientSelect("existing")}
            className="bg-gray-200 text-black p-3 rounded-lg hover:bg-gray-300 shadow-md hover:shadow-lg transition-colors duration-300"
          >
            Existing Client
          </Button>
        </div>
      </Modal>
      <Modal
        isOpen={showClientList}
        onClose={() => {
          setShowClientList(false);
          setIsModalOpen(true);
        }}
        title="Select Existing Client"
      >
        <div className="flex flex-col space-y-2 max-h-60 overflow-y-auto">
          {state.clients.length > 0 ? (
            state.clients.map((client) => (
              <Button
                key={client.id}
                onClick={() => handleClientSelection(client)}
                className="bg-gray-100 text-black p-2 rounded-lg hover:bg-gray-200 transition-colors duration-300"
              >
                {client.company_name}
              </Button>
            ))
          ) : (
            <p className="text-gray-500">No clients found.</p>
          )}
        </div>
      </Modal>
      {(state.isNewClient || state.selectedClientId) && (
        <form onSubmit={handleSubmit} className="mb-6">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step > 1 && (
            <div className="mt-6">
              {step === 2 ? (
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    onClick={handlePrev}
                    className="w-full whitespace-nowrap bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="w-full whitespace-nowrap bg-indigo-500 text-white rounded-md hover:bg-indigo-600"
                    disabled={!isStepValid()}
                  >
                    Next
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <Button
                      type="button"
                      onClick={handlePrev}
                      className="w-full whitespace-nowrap bg-gray-500 text-white rounded-md hover:bg-gray-600"
                    >
                      Previous
                    </Button>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={!isStepValid() || loading}
                      className={`w-fit whitespace-nowrap bg-indigo-500 text-white rounded-md hover:bg-indigo-600 ${!isStepValid() || loading ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {loading ? "Submitting..." : "Submit RFQ"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
      )}
    </div>
  );
};

export default AddRFQ;