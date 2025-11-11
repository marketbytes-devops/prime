/*  AddRFQ.jsx  */
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../../helpers/apiClient";
import { toast } from "react-toastify";
import InputField from "../../../components/InputField";
import Modal from "../../../components/Modal";
import * as ExcelJS from "exceljs";
import { saveAs } from "file-saver";

/* ---------- tiny clsx helper (no external dep) ---------- */
const clsx = (...args) =>
  args
    .flat()
    .filter(Boolean)
    .join(" ")
    .trim();

/* ---------- SearchableDropdown (unchanged, only className cleaned) ---------- */
const SearchableDropdown = ({
  options,
  value,
  onChange,
  placeholder,
  allowAddItem,
  apiEndpoint,
  error,
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
    const clickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  const filtered = options.filter((o) =>
    o.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const select = (opt) => {
    onChange(opt.id, options);
    setSearchTerm(opt.name);
    setIsOpen(false);
  };

  const create = async (name) => {
    if (!name.trim()) return null;
    const existing = options.find(
      (o) => o.name.toLowerCase() === name.toLowerCase()
    );
    if (existing) return existing;

    setAddingItem(true);
    try {
      const { data } = await apiClient.post(apiEndpoint, { name: name.trim() });
      toast.success(
        `${apiEndpoint === "items/" ? "Item" : "Unit"} created: ${name}`
      );
      return data;
    } catch {
      toast.error(`Failed to create ${apiEndpoint === "items/" ? "item" : "unit"}`);
      return null;
    } finally {
      setAddingItem(false);
    }
  };

  const addNew = async () => {
    const item = await create(newItemName);
    if (item) {
      setNewItemName("");
      onChange(item.id, [...options, item]);
      setSearchTerm(item.name);
    }
  };

  const keyDown = async (e) => {
    if (e.key !== "Enter" || !searchTerm.trim()) return;
    e.preventDefault();
    const exact = filtered.find(
      (o) => o.name.toLowerCase() === searchTerm.toLowerCase()
    );
    if (exact) return select(exact);
    if (allowAddItem) {
      const item = await create(searchTerm);
      if (item) {
        onChange(item.id, [...options, item]);
        setSearchTerm(item.name);
      }
    }
  };

  const blur = async () => {
    if (!searchTerm.trim()) return setIsOpen(false);
    const exact = options.find(
      (o) => o.name.toLowerCase() === searchTerm.toLowerCase()
    );
    if (exact) return select(exact);
    if (allowAddItem) {
      const item = await create(searchTerm);
      if (item) {
        onChange(item.id, [...options, item]);
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
        onKeyDown={keyDown}
        onBlur={blur}
        className={clsx(
          "w-full p-2 border rounded focus:outline-indigo-500",
          error && "border-red-500"
        )}
        disabled={addingItem}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {allowAddItem && (
            <div className="flex gap-2 p-2 border-b">
              <InputField
                placeholder={`Add new ${apiEndpoint === "items/" ? "item" : "unit"}...`}
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="flex-1 p-2 border rounded text-sm"
                disabled={addingItem}
              />
              <button
                type="button"
                onClick={addNew}
                disabled={addingItem || !newItemName.trim()}
                className={clsx(
                  "bg-green-600 text-white px-3 rounded text-sm transition-opacity",
                  addingItem || !newItemName.trim()
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:opacity-100"
                )}
              >
                {addingItem ? "..." : "+"}
              </button>
            </div>
          )}

          {filtered.length ? (
            filtered.map((o) => (
              <div
                key={o.id}
                className="p-2 hover:bg-indigo-100 cursor-pointer text-sm"
                onMouseDown={() => select(o)}
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

/* ---------- STEP COMPONENTS ---------- */
const Step1 = ({
  state,
  errors,
  onFieldChange,
  channels,
}) => (
  <div className="space-y-6">
    {/* Company Details */}
    <section className="bg-white p-4 rounded-md shadow">
      <h2 className="text-xl font-semibold mb-4">Company Details</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Company Name <span className="text-red-500">*</span>
        </label>
        <InputField
          type="text"
          placeholder="Enter company name"
          value={state.company_name}
          onChange={(e) => onFieldChange("company_name", e.target.value)}
          className={errors.company_name ? "border-red-500" : ""}
        />
        {errors.company_name && (
          <p className="text-red-500 text-xs mt-1">{errors.company_name}</p>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Company Address
        </label>
        <InputField
          type="text"
          placeholder="Enter company address"
          value={state.company_address}
          onChange={(e) => onFieldChange("company_address", e.target.value)}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Company Phone
        </label>
        <InputField
          type="tel"
          placeholder="Enter company phone"
          value={state.company_phone}
          onChange={(e) => onFieldChange("company_phone", e.target.value)}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Company Email
        </label>
        <InputField
          type="email"
          placeholder="Enter company email"
          value={state.company_email}
          onChange={(e) => onFieldChange("company_email", e.target.value)}
        />
      </div>
    </section>

    {/* RFQ Channel */}
    <section className="bg-white p-4 rounded-md shadow">
      <h2 className="text-xl font-semibold mb-4">RFQ Channel</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          RFQ Channel <span className="text-red-500">*</span>
        </label>
        <select
          value={state.rfq_channel}
          onChange={(e) => onFieldChange("rfq_channel", e.target.value)}
          className={clsx(
            "w-full p-2 border rounded focus:outline-indigo-500",
            errors.rfq_channel && "border-red-500"
          )}
        >
          <option value="">Select Channel</option>
          {channels.map((c) => (
            <option key={c.id} value={c.id}>
              {c.channel_name}
            </option>
          ))}
        </select>
        {errors.rfq_channel && (
          <p className="text-red-500 text-xs mt-1">{errors.rfq_channel}</p>
        )}
      </div>
    </section>

    {/* Point of Contact */}
    <section className="bg-white p-4 rounded-md shadow">
      <h2 className="text-xl font-semibold mb-4">Point of Contact</h2>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Contact Name
        </label>
        <InputField
          type="text"
          placeholder="Enter contact name"
          value={state.point_of_contact_name}
          onChange={(e) => onFieldChange("point_of_contact_name", e.target.value)}
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Contact Email
        </label>
        <InputField
          type="email"
          placeholder="Enter contact email"
          value={state.point_of_contact_email}
          onChange={(e) => onFieldChange("point_of_contact_email", e.target.value)}
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Contact Phone
        </label>
        <InputField
          type="tel"
          placeholder="Enter contact phone"
          value={state.point_of_contact_phone}
          onChange={(e) => onFieldChange("point_of_contact_phone", e.target.value)}
        />
      </div>
    </section>
  </div>
);

const Step2 = ({
  state,
  errors,
  onFieldChange,
  teamMembers,
}) => (
  <section className="bg-white p-4 rounded-md shadow space-y-6">
    <h2 className="text-xl font-semibold">Assigned Person &amp; Due Date</h2>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Assigned Sales Person <span className="text-red-500">*</span>
      </label>
      <select
        value={state.assigned_sales_person}
        onChange={(e) => onFieldChange("assigned_sales_person", e.target.value)}
        className={clsx(
          "w-full p-2 border rounded focus:outline-indigo-500",
          errors.assigned_sales_person && "border-red-500"
        )}
      >
        <option value="">Select Team Member</option>
        {teamMembers.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name} ({m.designation || "No designation"})
          </option>
        ))}
      </select>
      {errors.assigned_sales_person && (
        <p className="text-red-500 text-xs mt-1">{errors.assigned_sales_person}</p>
      )}
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Due Date for Quotation <span className="text-red-500">*</span>
      </label>
      <InputField
        type="date"
        value={state.due_date_for_quotation}
        onChange={(e) => onFieldChange("due_date_for_quotation", e.target.value)}
        className={errors.due_date_for_quotation ? "border-red-500" : ""}
      />
      {errors.due_date_for_quotation && (
        <p className="text-red-500 text-xs mt-1">{errors.due_date_for_quotation}</p>
      )}
    </div>
  </section>
);

const Step3 = ({
  state,
  errors,
  itemsList,
  units,
  onItemChange,
  onAddItem,
  onRemoveItem,
  uploading,
  fileInputRef,
  onFileUpload,
  onDownloadTemplate,
}) => (
  <div className="space-y-8">
    {/* Upload */}
    <section className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-dashed border-indigo-300 rounded-xl p-8 text-center">
      <h3 className="text-2xl font-bold text-indigo-800 mb-3">
        Upload Excel/CSV to Auto‑Create Items &amp; Units
      </h3>
      <p className="text-gray-600 mb-4">
        Columns: <code className="bg-gray-200 px-2 rounded">Sl.no</code>,{" "}
        <code className="bg-gray-200 px-2 rounded">Item</code>,{" "}
        <code className="bg-gray-200 px-2 rounded">Quantity</code>,{" "}
        <code className="bg-gray-200 px-2 rounded">Unit</code>,{" "}
        <code className="bg-gray-200 px-2 rounded">Unit Price</code>
      </p>

      <label className="cursor-pointer">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={onFileUpload}
          disabled={uploading}
          className="hidden"
        />
        <div className="inline-block bg-indigo-600 text-white px-8 py-2 rounded-xl hover:bg-indigo-700 transition text-lg shadow-lg">
          {uploading ? "Processing..." : "Upload File"}
        </div>
      </label>

      <div className="mt-4">
        <button
          type="button"
          onClick={onDownloadTemplate}
          className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-opacity opacity-90 hover:opacity-100"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Download Template
        </button>
      </div>
    </section>

    {/* Items List */}
    <section>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold">Items List</h3>
      </div>

      {state.items.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <p className="text-gray-500 text-lg">
            No items yet. Upload or add manually.
          </p>
        </div>
      ) : (
        state.items.map((it, idx) => (
          <div
            key={idx}
            className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-6 shadow-md"
          >
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-bold text-indigo-700">
                {it.sl_no && <span className="text-black">Sl.no {it.sl_no}</span>}
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {/* Item */}
              <div>
                <label className="block font-medium mb-1">
                  Item <span className="text-red-500">*</span>
                </label>
                <SearchableDropdown
                  options={itemsList}
                  value={it.item}
                  onChange={(val, opts) => onItemChange(idx, "item", val, opts)}
                  placeholder="Type or select item"
                  allowAddItem
                  apiEndpoint="items/"
                  error={errors.items[idx]?.item}
                />
              </div>

              {/* Quantity */}
              <div>
                <label className="block font-medium mb-1">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <InputField
                  type="number"
                  min="1"
                  value={it.quantity}
                  onChange={(e) => onItemChange(idx, "quantity", e.target.value)}
                  className={clsx(
                    "text-md",
                    errors.items[idx]?.quantity && "border-red-500"
                  )}
                />
                {errors.items[idx]?.quantity && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.items[idx].quantity}
                  </p>
                )}
              </div>

              {/* Unit */}
              <div>
                <label className="block font-medium mb-1">
                  Unit <span className="text-red-500">*</span>
                </label>
                <SearchableDropdown
                  options={units}
                  value={it.unit}
                  onChange={(val, opts) => onItemChange(idx, "unit", val, opts)}
                  placeholder="Type or select unit"
                  allowAddItem
                  apiEndpoint="units/"
                  error={errors.items[idx]?.unit}
                />
              </div>

              {/* Unit Price */}
              <div>
                <label className="block font-medium mb-1">Unit Price (SAR)</label>
                <InputField
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={it.unit_price}
                  onChange={(e) => onItemChange(idx, "unit_price", e.target.value)}
                  className="text-md"
                />
              </div>

              {/* Remove */}
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => onRemoveItem(idx)}
                  className="bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded transition-opacity opacity-90 hover:opacity-100"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))
      )}

      <button
        type="button"
        onClick={onAddItem}
        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-opacity opacity-90 hover:opacity-100"
      >
        + Add Manual
      </button>
    </section>
  </div>
);

/* ---------- MAIN COMPONENT ---------- */
const AddRFQ = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

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
    items: [],
    channels: [],
    teamMembers: [],
    itemsList: [],
    units: [],
    isNewClient: false,
  });

  const [errors, setErrors] = useState({
    company_name: "",
    rfq_channel: "",
    assigned_sales_person: "",
    due_date_for_quotation: "",
    items: [], // array of objects per row
  });

  /* -------------------------------------------------- */
  /*   DATA FETCHING                                    */
  /* -------------------------------------------------- */
  useEffect(() => {
    const load = async () => {
      try {
        const [chan, team, item, unit] = await Promise.all([
          apiClient.get("channels/"),
          apiClient.get("teams/"),
          apiClient.get("items/"),
          apiClient.get("units/"),
        ]);
        setState((s) => ({
          ...s,
          channels: chan.data || [],
          teamMembers: team.data || [],
          itemsList: item.data || [],
          units: unit.data || [],
        }));
      } catch (e) {
        console.error(e);
        toast.error("Failed to load master data");
      }
    };
    load();
  }, []);

  /* -------------------------------------------------- */
  /*   VALIDATION LOGIC                                 */
  /* -------------------------------------------------- */
  const validateField = (name, value, rowIdx = null) => {
    if (name === "company_name" && !value?.trim())
      return "Company name is required";
    if (name === "rfq_channel" && !value) return "RFQ channel is required";
    if (name === "assigned_sales_person" && !value)
      return "Sales person is required";
    if (name === "due_date_for_quotation" && !value)
      return "Due date is required";

    if (rowIdx !== null) {
      if (name === "item" && !value) return "Item is required";
      if (name === "quantity" && (!value || Number(value) <= 0))
        return "Quantity must be > 0";
      if (name === "unit" && !value) return "Unit is required";
    }
    return "";
  };

  const validateCurrentStep = () => {
    const newErr = { ...errors, items: [] };

    if (step === 1) {
      newErr.company_name = validateField("company_name", state.company_name);
      newErr.rfq_channel = validateField("rfq_channel", state.rfq_channel);
    }
    if (step === 2) {
      newErr.assigned_sales_person = validateField(
        "assigned_sales_person",
        state.assigned_sales_person
      );
      newErr.due_date_for_quotation = validateField(
        "due_date_for_quotation",
        state.due_date_for_quotation
      );
    }
    if (step === 3) {
      state.items.forEach((it, i) => {
        newErr.items[i] = {
          item: validateField("item", it.item, i),
          quantity: validateField("quantity", it.quantity, i),
          unit: validateField("unit", it.unit, i),
        };
      });
    }

    setErrors(newErr);

    const flat = Object.values(newErr).flatMap((v) =>
      typeof v === "object" && v !== null ? Object.values(v) : v
    );
    return flat.every((e) => !e);
  };

  /* -------------------------------------------------- */
  /*   CALLBACKS (memoised)                             */
  /* -------------------------------------------------- */
  const onFieldChange = useCallback((field, value) => {
    setState((s) => ({ ...s, [field]: value }));
    setErrors((e) => ({ ...e, [field]: validateField(field, value) }));
  }, []);

  const onItemChange = useCallback((idx, field, value, newOpts) => {
    setState((s) => {
      const items = [...s.items];
      items[idx][field] = value;
      if (field === "item" && newOpts) return { ...s, items, itemsList: newOpts };
      if (field === "unit" && newOpts) return { ...s, items, units: newOpts };
      return { ...s, items };
    });
    setErrors((e) => {
      const row = { ...(e.items[idx] || {}) };
      row[field] = validateField(field, value, idx);
      const newItems = [...(e.items || [])];
      newItems[idx] = row;
      return { ...e, items: newItems };
    });
  }, []);

  const addItem = useCallback(() => {
    const next = state.items.length + 1;
    setState((s) => ({
      ...s,
      items: [
        ...s.items,
        {
          sl_no: next,
          item: "",
          quantity: "",
          unit: "",
          item_name: "",
          unit_name: "",
          unit_price: "",
        },
      ],
    }));
    setErrors((e) => ({ ...e, items: [...e.items, {}] }));
  }, [state.items.length]);

  const removeItem = useCallback((idx) => {
    setState((s) => ({
      ...s,
      items: s.items.filter((_, i) => i !== idx),
    }));
    setErrors((e) => ({
      ...e,
      items: e.items.filter((_, i) => i !== idx),
    }));
  }, []);

  const goNext = (e) => {
    e.preventDefault();
    if (validateCurrentStep()) setStep((s) => s + 1);
    else toast.error("Please fix the highlighted fields");
  };

  const goPrev = () => setStep((s) => s - 1);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validateCurrentStep()) {
      toast.error("Please fix all errors before submitting");
      return;
    }

    setLoading(true);
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
      rfq_status: "Pending",
      items: state.items.map((i) => ({
        item: Number(i.item),
        quantity: Number(i.quantity),
        unit: Number(i.unit),
        unit_price: i.unit_price ? Number(i.unit_price) : null,
      })),
    };

    try {
      await apiClient.post("rfqs/", payload);
      toast.success("RFQ created successfully!");
      navigate("/view-rfq");
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "Failed to save RFQ";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const selectClient = (type) => {
    setIsModalOpen(false);
    if (type === "new") setState((s) => ({ ...s, isNewClient: true }));
    else navigate("/existing-client");
  };

  const downloadTemplate = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("RFQ Template");
    ws.columns = [
      { header: "Sl.no", key: "sl_no", width: 10 },
      { header: "Item", key: "item", width: 35 },
      { header: "Quantity", key: "quantity", width: 15 },
      { header: "Unit", key: "unit", width: 15 },
      { header: "Unit Price", key: "unit_price", width: 15 },
    ];
    const header = ws.getRow(1);
    header.font = { bold: true, color: { argb: "FFFFFFFF" } };
    header.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4F81BD" },
    };
    header.alignment = { vertical: "middle", horizontal: "center" };
    ws.addRow({
      sl_no: 1,
      item: "Pressure Gauge",
      quantity: 4,
      unit: "Pcs",
      unit_price: 150.0,
    });

    try {
      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: "application/octet-stream" });
      saveAs(blob, "RFQ_Template.xlsx");
    } catch {
      toast.error("Failed to generate template");
    }
  };

  /* -------------------------------------------------- */
  /*   FILE UPLOAD (unchanged logic, just memoised)    */
  /* -------------------------------------------------- */
  const ensureItem = async (name) => {
    if (!name.trim()) return null;
    const ex = state.itemsList.find(
      (i) => i.name.toLowerCase() === name.toLowerCase()
    );
    if (ex) return ex.id;
    const { data } = await apiClient.post("items/", { name: name.trim() });
    setState((s) => ({ ...s, itemsList: [...s.itemsList, data] }));
    toast.success(`Item created: ${name}`);
    return data.id;
  };

  const ensureUnit = async (name) => {
    if (!name.trim()) return null;
    const ex = state.units.find(
      (u) => u.name.toLowerCase() === name.toLowerCase()
    );
    if (ex) return ex.id;
    const { data } = await apiClient.post("units/", { name: name.trim() });
    setState((s) => ({ ...s, units: [...s.units, data] }));
    toast.success(`Unit created: ${name}`);
    return data.id;
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowed = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    if (!allowed.includes(file.type)) {
      toast.error("Only .xlsx, .xls, .csv allowed");
      return;
    }

    setUploading(true);
    try {
      const XLSX = await import("xlsx");
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const data = new Uint8Array(ev.target.result);
        const wb = XLSX.read(data, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        const newItems = [];
        for (const [i, r] of rows.entries()) {
          const itemName = (
            r["Item"] ||
            r["item"] ||
            r["Name"] ||
            ""
          ).toString().trim();
          const qty = r["Quantity"] || r["quantity"] || r["Qty"] || "";
          const unitName = (r["Unit"] || r["unit"] || "").toString().trim();
          const price = r["Unit Price"] || r["unit_price"] || r["Price"] || "";
          const sl = r["Sl.no"] || r["Sl.No"] || r["sl_no"] || i + 1;

          if (!itemName || !qty) continue;

          const [itemId, unitId] = await Promise.all([
            ensureItem(itemName),
            ensureUnit(unitName || "Each"),
          ]);

          if (itemId) {
            newItems.push({
              sl_no: sl,
              item: itemId,
              item_name: itemName,
              quantity: Number(qty) || 1,
              unit: unitId,
              unit_name: unitName || "Each",
              unit_price: price ? Number(price) : "",
            });
          }
        }

        setState((s) => ({ ...s, items: newItems }));
        setErrors((e) => ({ ...e, items: newItems.map(() => ({})) }));
        toast.success(`Loaded ${newItems.length} items`);
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error(err);
      toast.error("Failed to process file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  /* -------------------------------------------------- */
  /*   RENDER                                            */
  /* -------------------------------------------------- */
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-center sm:text-left mb-6">
        Add RFQ
      </h1>

      {/* Step Indicator */}
      <div className="flex justify-center sm:justify-between items-center gap-8 mb-8">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={clsx(
              "text-center",
              step === s ? "text-indigo-600 font-bold" : "text-gray-400"
            )}
          >
            <div
              className={clsx(
                "w-10 h-10 rounded-full border-2 mx-auto mb-2 flex items-center justify-center text-xl",
                step === s
                  ? "border-indigo-600 bg-indigo-100"
                  : "border-gray-300"
              )}
            >
              {s}
            </div>
            <p className="text-sm">
              {s === 1 ? "Client" : s === 2 ? "Assign" : "Items"}
            </p>
          </div>
        ))}
      </div>

      {/* Client Type Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Select Client Type"
      >
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => selectClient("new")}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl transition-opacity opacity-90 hover:opacity-100"
          >
            New Client
          </button>
          <button
            type="button"
            onClick={() => selectClient("existing")}
            className="w-full bg-gray-200 hover:bg-gray-300 py-2 rounded-xl transition-opacity opacity-90 hover:opacity-100"
          >
            Existing Client
          </button>
        </div>
      </Modal>

      {/* FORM */}
      {state.isNewClient && (
        <form onSubmit={onSubmit} className="space-y-8">
          {step === 1 && (
            <Step1
              state={state}
              errors={errors}
              onFieldChange={onFieldChange}
              channels={state.channels}
            />
          )}
          {step === 2 && (
            <Step2
              state={state}
              errors={errors}
              onFieldChange={onFieldChange}
              teamMembers={state.teamMembers}
            />
          )}
          {step === 3 && (
            <Step3
              state={state}
              errors={errors}
              itemsList={state.itemsList}
              units={state.units}
              onItemChange={onItemChange}
              onAddItem={addItem}
              onRemoveItem={removeItem}
              uploading={uploading}
              fileInputRef={fileInputRef}
              onFileUpload={handleFile}
              onDownloadTemplate={downloadTemplate}
            />
          )}

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            {step > 1 && (
              <button
                type="button"
                onClick={goPrev}
                className="order-2 sm:order-1 w-full sm:w-auto bg-gray-500 hover:bg-gray-600 text-white px-8 py-2 rounded-lg transition-opacity opacity-90 hover:opacity-100"
              >
                Back
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={goNext}
                className="order-1 sm:order-2 w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2 rounded-lg transition-opacity opacity-90 hover:opacity-100"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className={clsx(
                  "order-1 sm:order-2 w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-12 py-2 rounded-lg transition-opacity",
                  loading
                    ? "opacity-50 cursor-not-allowed"
                    : "opacity-90 hover:opacity-100"
                )}
              >
                {loading ? "Saving..." : "Submit RFQ"}
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
};

export default AddRFQ;