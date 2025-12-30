import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import apiClient from "../../../helpers/apiClient";
import InputField from "../../../components/InputField";
import Loading from "../../../components/Loading";
import { toast } from "react-toastify";

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
    rfq_status: "",
    vat_applicable: false,
    items: [{ item: "", quantity: "", unit: "", unit_price: "" }],
    channels: [],
    teamMembers: [],
    itemsList: [],
    units: [],
    loading: true,
    lastSaved: null,
    submitting: false,
  });

  // New states for quotation handling
  const [hasExistingQuotation, setHasExistingQuotation] = useState(false);
  const [quotationId, setQuotationId] = useState(null);
  const [isManualEditing, setIsManualEditing] = useState(false);

  // ────────────────────────────────────────────────────────────────
  // Local searchable dropdown component (copied from AddRFQ)
  // Used for both Item and Unit selection with search + create new
  // ────────────────────────────────────────────────────────────────
  const EditSearchableDropdown = ({
    options,
    value,
    onChange,
    placeholder,
    allowAddItem,
    apiEndpoint,
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [newItemName, setNewItemName] = useState("");
    const [addingItem, setAddingItem] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
      const selected = options.find((o) => o.id === value);
      setSearchTerm(selected ? selected.name : "");
    }, [value, options]);

    useEffect(() => {
      const handleClickOutside = (e) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target))
          setIsOpen(false);
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredOptions = options.filter((o) =>
      o.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const createAndSelect = async (name) => {
      if (!name.trim()) return null;
      const existing = options.find(
        (o) => o.name.toLowerCase() === name.toLowerCase()
      );
      if (existing) return existing;

      setAddingItem(true);
      try {
        const res = await apiClient.post(apiEndpoint, { name: name.trim() });
        toast.success(
          `${apiEndpoint === "items/" ? "Item" : "Unit"} created: ${name}`
        );
        return res.data;
      } catch (err) {
        toast.error(
          `Failed to create ${apiEndpoint === "items/" ? "item" : "unit"}`
        );
        return null;
      } finally {
        setAddingItem(false);
      }
    };

    const handleSelect = (option) => {
      onChange(option.id, options); // ← pass current options
      setSearchTerm(option.name);
      setIsOpen(false);
    };

    const handleAddItem = async () => {
      const newItem = await createAndSelect(newItemName);
      if (newItem) {
        setNewItemName("");
        onChange(newItem.id, [...options, newItem]); // ← pass new list
        setSearchTerm(newItem.name);
      }
    };

    const handleKeyDown = async (e) => {
      if (e.key === "Enter" && searchTerm.trim()) {
        e.preventDefault();
        const exact = filteredOptions.find(
          (o) => o.name.toLowerCase() === searchTerm.toLowerCase()
        );
        if (exact) {
          handleSelect(exact);
        } else if (allowAddItem) {
          const newItem = await createAndSelect(searchTerm);
          if (newItem) {
            onChange(newItem.id, [...options, newItem]); // ← pass new list
            setSearchTerm(newItem.name);
          }
        }
      }
    };

    const handleBlur = async () => {
      if (searchTerm.trim()) {
        const exact = options.find(
          (o) => o.name.toLowerCase() === searchTerm.toLowerCase()
        );
        if (exact) {
          onChange(exact.id, options);
        } else if (allowAddItem) {
          const newItem = await createAndSelect(searchTerm);
          if (newItem) {
            onChange(newItem.id, [...options, newItem]); // ← pass new list
          }
        }
      }
      setIsOpen(false);
    };

    return (
      <div className="relative w-full" ref={dropdownRef}>
        <InputField
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="w-full p-2 border rounded focus:outline-indigo-500"
          disabled={addingItem}
        />
        {isOpen && (
          <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
            {allowAddItem && (
              <div className="p-2 border-b flex gap-2">
                <InputField
                  placeholder={`Add new ${
                    apiEndpoint === "items/" ? "item" : "unit"
                  }...`}
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="flex-1 p-2 border rounded text-sm"
                  disabled={addingItem}
                />
                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={addingItem || !newItemName.trim()}
                  className={`bg-green-600 text-white px-3 rounded hover:bg-green-700 text-sm transition-opacity duration-300 ${
                    addingItem || !newItemName.trim()
                      ? "opacity-50 cursor-not-allowed"
                      : "opacity-90 hover:opacity-100"
                  }`}
                >
                  {addingItem ? "…" : "+"}
                </button>
              </div>
            )}
            {filteredOptions.length > 0 ? (
              filteredOptions.map((o) => (
                <div
                  key={o.id}
                  className="p-2 hover:bg-indigo-100 cursor-pointer text-sm"
                  onMouseDown={() => handleSelect(o)}
                >
                  {o.name}
                </div>
              ))
            ) : (
              <div className="p-2 text-gray-500 text-sm">
                {searchTerm.trim()
                  ? `Press Enter to create "${searchTerm}"`
                  : "No options"}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ────────────────────────────────────────────────────────────────
  // Rest of your original component code (only items section updated)
  // ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rfqRes, channelsRes, teamsRes, itemsRes, unitsRes] =
          await Promise.all([
            apiClient.get(`rfqs/${id}/`),
            apiClient.get("channels/"),
            apiClient.get("teams/"),
            apiClient.get("items/"),
            apiClient.get("units/"),
          ]);

        setState((prev) => ({
          ...prev,
          company_name: rfqRes.data.company_name || "",
          company_address: rfqRes.data.company_address || "",
          company_phone: rfqRes.data.company_phone || "",
          company_email: rfqRes.data.company_email || "",
          rfq_channel: rfqRes.data.rfq_channel || "",
          point_of_contact_name: rfqRes.data.point_of_contact_name || "",
          point_of_contact_email: rfqRes.data.point_of_contact_email || "",
          point_of_contact_phone: rfqRes.data.point_of_contact_phone || "",
          assigned_sales_person: rfqRes.data.assigned_sales_person || "",
          due_date_for_quotation: rfqRes.data.due_date_for_quotation || "",
          rfq_status: rfqRes.data.rfq_status || "Processing",
          vat_applicable: rfqRes.data.vat_applicable || false,
          items:
            rfqRes.data.items && rfqRes.data.items.length
              ? rfqRes.data.items.map((item) => ({
                  item: item.item || "",
                  quantity: item.quantity || "",
                  unit: item.unit || "",
                  unit_price: item.unit_price || "",
                }))
              : [{ item: "", quantity: "", unit: "", unit_price: "" }],
          channels: channelsRes.data || [],
          teamMembers: teamsRes.data || [],
          itemsList: itemsRes.data || [],
          units: unitsRes.data || [],
          loading: false,
        }));
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load RFQ data.");
        setState((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    const checkExistingQuotation = async () => {
      if (!isQuotation) return;

      try {
        const response = await apiClient.get(`/quotations/?rfq=${id}`);
        if (response.data && response.data.length > 0) {
          setHasExistingQuotation(true);
          setQuotationId(response.data[0].id);
        }
      } catch (error) {
        console.error("Failed to check existing quotation:", error);
      }
    };

    checkExistingQuotation();
  }, [id, isQuotation]);

  useEffect(() => {
    if (!state.loading && scrollToVat && vatSectionRef.current) {
      const timer = setTimeout(() => {
        vatSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [state.loading, scrollToVat]);

  const buildRfqPayload = useCallback(
    () => ({
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
    }),
    [
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
    ]
  );

  const buildQuotationPayload = useCallback(
    () => ({
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
      quotation_status: "Pending",
      followup_frequency: "24_hours",
      remarks: "",
      vat_applicable: state.vat_applicable,
      items: state.items.map((item) => ({
        item: item.item || null,
        quantity: item.quantity ? parseInt(item.quantity) : null,
        unit: item.unit || null,
        unit_price: item.unit_price ? parseFloat(item.unit_price) : null,
      })),
    }),
    [
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
    ]
  );

  const allItemsHavePrice = useCallback(() => {
    return state.items.every(
      (item) =>
        item.unit_price != null &&
        item.unit_price !== "" &&
        !isNaN(parseFloat(item.unit_price)) &&
        parseFloat(item.unit_price) >= 0
    );
  }, [state.items]);

  const autosave = useCallback(
    debounce(async () => {
      try {
        const rfqPayload = buildRfqPayload();
        if (allItemsHavePrice() && rfqPayload.rfq_status !== "Completed") {
          rfqPayload.rfq_status = "Completed";
          setState((prev) => ({ ...prev, rfq_status: "Completed" }));
        }
        await apiClient.patch(`rfqs/${id}/`, rfqPayload);
        setState((prev) => ({ ...prev, lastSaved: new Date() }));
      } catch (error) {
        console.error("Error autosaving RFQ:", error);
      }
    }, 2000),
    [buildRfqPayload, id, allItemsHavePrice]
  );

  useEffect(() => {
    if (!state.loading && !isManualEditing) {
      // ← only autosave when NOT manually editing
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
    setIsManualEditing(true); // ← activate mode
    setState((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { item: "", quantity: "", unit: "", unit_price: "" },
      ],
    }));
  };

  const removeItem = (index) => {
    setIsManualEditing(true); // ← activate mode
    setState((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemChange = (index, field, value, newOptions = null) => {
    setIsManualEditing(true); // ← activate mode when user types/selects
    setState((prev) => {
      const newItems = prev.items.map((it, i) =>
        i === index ? { ...it, [field]: value } : it
      );

      if (newOptions) {
        if (field === "item") {
          return { ...prev, items: newItems, itemsList: newOptions };
        }
        if (field === "unit") {
          return { ...prev, items: newItems, units: newOptions };
        }
      }

      return { ...prev, items: newItems };
    });
  };

  const handleUpdateRFQ = async () => {
    setState((prev) => ({ ...prev, submitting: true }));
    try {
      const rfqPayload = buildRfqPayload();

      if (allItemsHavePrice() && rfqPayload.rfq_status !== "Completed") {
        rfqPayload.rfq_status = "Completed";
        setState((prev) => ({ ...prev, rfq_status: "Completed" }));
      }

      await apiClient.patch(`rfqs/${id}/`, rfqPayload);

      setState((prev) => ({ ...prev, lastSaved: new Date() }));
      toast.success("RFQ updated successfully!");
      setIsManualEditing(false);
    } catch (error) {
      console.error("Error updating RFQ:", error);
      toast.error("Failed to update RFQ");
    } finally {
      setState((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleCreateQuotation = async () => {
    if (!allItemsHavePrice()) {
      toast.error("All items must have valid unit prices to create quotation.");
      return;
    }

    if (hasExistingQuotation) {
      toast.info("Quotation already exists for this RFQ.");
      return;
    }

    setState((prev) => ({ ...prev, submitting: true }));
    try {
      setIsManualEditing(false);
      const rfqPayload = buildRfqPayload();
      rfqPayload.rfq_status = "Completed";
      await apiClient.patch(`rfqs/${id}/`, rfqPayload);

      const quotationPayload = buildQuotationPayload();
      const response = await apiClient.post("/quotations/", quotationPayload);

      setHasExistingQuotation(true);
      setQuotationId(response.data.id);

      toast.success("Quotation created successfully!");
      navigate("/view-quotation");
    } catch (error) {
      console.error("Error creating quotation:", error);
      toast.error("Failed to create quotation");
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
      {/* Company Details */}
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
              value={state.company_name || ""}
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
              value={state.company_address || ""}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  company_address: e.target.value,
                }))
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
              value={state.company_phone || ""}
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
              value={state.company_email || ""}
              onChange={(e) =>
                setState((prev) => ({ ...prev, company_email: e.target.value }))
              }
            />
          </div>
        </div>
      </div>

      {/* RFQ Channel */}
      <div className="bg-white p-4 space-y-4 rounded-md shadow">
        <h3 className="text-xl font-semibold text-black">RFQ Channel</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            RFQ Channel
          </label>
          <select
            value={state.rfq_channel || ""}
            onChange={(e) =>
              setState((prev) => ({ ...prev, rfq_channel: e.target.value }))
            }
            className="w-full p-2 border rounded-md focus:outline-indigo-600"
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

      {/* Point of Contact */}
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
              value={state.point_of_contact_name || ""}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  point_of_contact_name: e.target.value,
                }))
              }
              maxLength={100}
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
                value={state.point_of_contact_email || ""}
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
                value={state.point_of_contact_phone || ""}
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
      </div>

      {/* Assignment & Due Date */}
      <div className="bg-white p-4 space-y-4 rounded-md shadow">
        <h3 className="text-xl font-semibold text-black">
          Assignment & Due Date
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assigned Sales Person
            </label>
            <select
              value={state.assigned_sales_person || ""}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  assigned_sales_person: e.target.value,
                }))
              }
              className="w-full p-2 border rounded-md focus:outline-indigo-600"
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
              value={state.due_date_for_quotation || ""}
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

      {/* RFQ Status */}
      <div className="bg-white p-4 space-y-4 rounded-md shadow">
        <h3 className="text-xl font-semibold text-black">RFQ Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              RFQ Status
            </label>
            <select
              value={state.rfq_status || ""}
              onChange={(e) =>
                setState((prev) => ({ ...prev, rfq_status: e.target.value }))
              }
              className="w-full p-2 border rounded-md focus:outline-indigo-600"
            >
              <option value="">Select Status</option>
              <option value="Processing">Processing</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Items - with searchable dropdown */}
      <div className="bg-white p-4 space-y-4 rounded-md shadow">
        <h3 className="text-xl font-semibold text-black">Items</h3>
        {state.items.map((item, index) => (
          <div
            key={index}
            className="border p-4 rounded-md bg-gray-50 shadow mb-4"
          >
            <h4 className="text-sm font-semibold mb-2">Item {index + 1}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Item - Searchable Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item
                </label>
                <EditSearchableDropdown
                  options={state.itemsList}
                  value={item.item || ""}
                  onChange={(val, opts) =>
                    handleItemChange(index, "item", val, opts)
                  } // ← FIXED
                  placeholder="Type or select item..."
                  allowAddItem={true}
                  apiEndpoint="items/"
                />
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <InputField
                  type="number"
                  placeholder="Enter quantity"
                  value={item.quantity || ""}
                  onChange={(e) =>
                    handleItemChange(index, "quantity", e.target.value)
                  }
                  min={0}
                />
              </div>

              {/* Unit - Searchable Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit
                </label>
                <EditSearchableDropdown
                  options={state.units}
                  value={item.unit || ""}
                  onChange={(val, opts) =>
                    handleItemChange(index, "unit", val, opts)
                  } // ← FIXED
                  placeholder="Type or select unit..."
                  allowAddItem={true}
                  apiEndpoint="units/"
                />
              </div>

              {/* Unit Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Price
                </label>
                <InputField
                  type="number"
                  placeholder="Enter unit price"
                  value={item.unit_price || ""}
                  onChange={(e) =>
                    handleItemChange(index, "unit_price", e.target.value)
                  }
                  min={0}
                  step="0.01"
                />
              </div>

              {state.items.length > 1 && (
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="w-full bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addItem}
          className="bg-blue-600 text-white rounded-md w-full hover:bg-blue-500"
        >
          Add Item
        </button>
      </div>

      {/* VAT Section */}
      <div
        className="bg-white p-4 space-y-4 rounded-md shadow"
        ref={vatSectionRef}
      >
        <h3 className="text-xl font-semibold text-black">Is VAT Applicable?</h3>
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          <div className="flex items-center">
            <label className="flex items-center text-sm font-medium text-gray-700">
              VAT Applicable (15%)
            </label>
            <input
              type="checkbox"
              checked={state.vat_applicable}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  vat_applicable: e.target.checked,
                }))
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
        {isQuotation ? "Convert to Quotation" : "Edit RFQ"}
      </h1>
      <div className="text-sm text-center sm:text-left text-gray-600 mb-4">
        Last saved:{" "}
        {state.lastSaved
          ? state.lastSaved.toLocaleTimeString()
          : "Not saved yet"}
      </div>
      <form className="mb-6">
        {renderForm()}

        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={() => {
              handleUpdateRFQ();
              if (isQuotation && !hasExistingQuotation) {
                handleCreateQuotation();
              }
            }}
            disabled={state.submitting || (isQuotation && !allItemsHavePrice())}
            className={`px-8 py-3 rounded-md text-white font-medium ${
              state.submitting || (isQuotation && !allItemsHavePrice())
                ? "bg-gray-400 cursor-not-allowed"
                : isQuotation
                ? "bg-green-600 hover:bg-green-700"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {state.submitting
              ? "Processing..."
              : isQuotation
              ? "Submit Quotation"
              : "Save RFQ"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditRFQ;
