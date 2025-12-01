import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import apiClient from "../../../helpers/apiClient";
import { toast } from "react-toastify";
import InputField from "../../../components/InputField";
import Modal from "../../../components/Modal";
import * as ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const SearchableDropdown = ({
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

  // Sync displayed text with selected value
  useEffect(() => {
    const selected = options.find((o) => o.id === value);
    setSearchTerm(selected ? selected.name : "");
  }, [value, options]);

  // Click-outside handler
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((o) =>
    o.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option) => {
    onChange(option.id, options);
    setSearchTerm(option.name);
    setIsOpen(false);
  };

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

  const handleAddItem = async () => {
    const newItem = await createAndSelect(newItemName);
    if (newItem) {
      setNewItemName("");
      onChange(newItem.id, [...options, newItem]);
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
          onChange(newItem.id, [...options, newItem]);
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
          onChange(newItem.id, [...options, newItem]);
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

const AddRFQ = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);

  // ✅ CORRECTED: isNewClient should be at the main state level, not inside items array
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
    items: [
      // ❌ REMOVE isNewClient from here
      {
        sl_no: 1,
        item: "",
        item_name: "",
        quantity: "",
        unit: "",
        unit_name: "",
        unit_price: "",
      },
    ],
    channels: [],
    teamMembers: [],
    itemsList: [],
    units: [],
    isNewClient: !!location.state?.preFilledData, // ✅ MOVED to correct position
  });

  // ✅ CORRECT: Modal state initialization
  const [isModalOpen, setIsModalOpen] = useState(
    !location.state?.preFilledData // Only show modal if NOT coming from existing client
  );

  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [companyNameError, setCompanyNameError] = useState("");

  /* -------------------------------------------------
   *  Load master data (channels, team, items, units)
   * ------------------------------------------------- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [chanRes, teamRes, itemRes, unitRes] = await Promise.all([
          apiClient.get("channels/"),
          apiClient.get("teams/"),
          apiClient.get("items/"),
          apiClient.get("units/"),
        ]);
        setState((prev) => ({
          ...prev,
          channels: chanRes.data || [],
          teamMembers: teamRes.data || [],
          itemsList: itemRes.data || [],
          units: unitRes.data || [],
        }));
      } catch (err) {
        toast.error("Failed to load master data");
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const locationState = location.state;
    if (locationState?.preFilledData) {
      setState((prev) => ({
        ...prev,
        isNewClient: true, // This will show the RFQ form
        company_name: locationState.preFilledData.company_name || "",
        company_address: locationState.preFilledData.company_address || "",
        company_phone: locationState.preFilledData.company_phone || "",
        company_email: locationState.preFilledData.company_email || "",
        rfq_channel: locationState.preFilledData.rfq_channel || "",
        point_of_contact_name:
          locationState.preFilledData.point_of_contact_name || "",
        point_of_contact_email:
          locationState.preFilledData.point_of_contact_email || "",
        point_of_contact_phone:
          locationState.preFilledData.point_of_contact_phone || "",
      }));

      // Set the step to 2 if coming from existing client
      if (locationState.preFilledData.skipToStep) {
        setStep(locationState.preFilledData.skipToStep);
      }

      // ✅ ADD THIS: Close the modal when coming from existing client
      setIsModalOpen(false);
    }
  }, [location.state]);

  // ... rest of your code
  /* -------------------------------------------------
   *  Helper: ensure item/unit exists (create if not)
   * ------------------------------------------------- */
  const ensureItemExists = async (name) => {
    if (!name.trim()) return null;
    const existing = state.itemsList.find(
      (i) => i.name.toLowerCase() === name.toLowerCase()
    );
    if (existing) return existing.id;

    try {
      const res = await apiClient.post("items/", { name: name.trim() });
      const newItem = res.data;
      setState((prev) => ({
        ...prev,
        itemsList: [...prev.itemsList, newItem],
      }));
      toast.success(`Item created: ${name}`);
      return newItem.id;
    } catch (err) {
      toast.error(`Failed to create item: ${name}`);
      return null;
    }
  };

  const ensureUnitExists = async (name) => {
    if (!name.trim()) return null;
    const existing = state.units.find(
      (u) => u.name.toLowerCase() === name.toLowerCase()
    );
    if (existing) return existing.id;

    try {
      const res = await apiClient.post("units/", { name: name.trim() });
      const newUnit = res.data;
      setState((prev) => ({
        ...prev,
        units: [...prev.units, newUnit],
      }));
      toast.success(`Unit created: ${name}`);
      return newUnit.id;
    } catch (err) {
      toast.error(`Failed to create unit: ${name}`);
      return null;
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    if (!validTypes.includes(file.type)) {
      toast.error("Only .xlsx, .xls, .csv allowed");
      return;
    }

    setUploading(true);
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());

      const worksheet = workbook.worksheets[0];
      if (!worksheet) throw new Error("No worksheet found");

      const rows = [];
      worksheet.eachRow({ includeEmpty: false }, (row) => {
        rows.push(row.values);
      });

      const header = rows[0].slice(1);
      const dataRows = rows.slice(1);

      const newItems = [];

      for (let i = 0; i < dataRows.length; i++) {
        const raw = dataRows[i].slice(1);

        const col = (keys) => {
          return keys.reduce((val, k) => {
            const idx = header.findIndex(
              (h) =>
                h &&
                h.toString().toLowerCase().replace(/\s/g, "") ===
                  k.toLowerCase()
            );
            return val ?? (idx > -1 ? raw[idx] : undefined);
          }, undefined);
        };

        const itemName = (col(["item", "name"]) ?? "").toString().trim();
        const qtyRaw = col(["quantity", "qty"]) ?? "";
        const unitName = (col(["unit"]) ?? "Each").toString().trim();
        const priceRaw = col(["unitprice", "price", "unit_price"]) ?? "";
        const slNo = col(["sl.no", "slno", "sl_no"]) ?? i + 1;

        if (!itemName || !qtyRaw) continue;

        toast.info(`Processing: ${itemName} (${qtyRaw} ${unitName})`);

        const [itemId, unitId] = await Promise.all([
          ensureItemExists(itemName),
          ensureUnitExists(unitName),
        ]);

        if (itemId) {
          newItems.push({
            sl_no: Number(slNo) || i + 1,
            item: itemId,
            item_name: itemName,
            quantity: Number(qtyRaw) || 1,
            unit: unitId,
            unit_name: unitName,
            unit_price: priceRaw ? Number(priceRaw) : "",
          });
        }
      }

      setState((prev) => ({ ...prev, items: newItems }));
      toast.success(`Loaded & auto-created ${newItems.length} items!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to process file – check console for details");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const addItem = () => {
    setState((prev) => {
      const nextSlNo = prev.items.length + 1;
      return {
        ...prev,
        items: [
          ...prev.items,
          {
            sl_no: nextSlNo,
            item: "",
            quantity: "",
            unit: "",
            item_name: "",
            unit_name: "",
            unit_price: "",
          },
        ],
      };
    });
  };

  const removeItem = (idx) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
  };

  const handleItemChange = (idx, field, value, newOptions) => {
    setState((prev) => {
      const newItems = [...prev.items];
      newItems[idx][field] = value;

      if (field === "item" && newOptions) {
        return { ...prev, items: newItems, itemsList: newOptions };
      }
      if (field === "unit" && newOptions) {
        return { ...prev, items: newItems, units: newOptions };
      }
      return { ...prev, items: newItems };
    });
  };

  const isStepValid = () => {
    if (step === 1) return state.company_name.trim() !== "";
    if (step === 3) {
      if (state.items.length === 0) return true;
      return state.items.every((i) => i.item && i.quantity > 0 && i.unit);
    }
    return true;
  };

  const handleNext = (e) => {
    e.preventDefault();

    if (step === 1 && !state.company_name.trim()) {
      setCompanyNameError("Company name is required");
      toast.error("Company name is required");
      return;
    }

    if (!isStepValid()) {
      if (step === 3)
        toast.error("Complete all items or remove incomplete ones");
      return;
    }
    setStep((s) => s + 1);
    setCompanyNameError("");
  };

  const handlePrev = () => setStep((s) => s - 1);

  // AddRFQ.jsx → Replace your handleSubmit function with this one:

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!state.company_name.trim()) {
      setCompanyNameError("Company name is required");
      toast.error("Company name is required");
      return;
    }

    setLoading(true);

    const validItems = state.items.filter(
      (it) =>
        it.item &&
        it.item !== 0 &&
        it.unit &&
        it.unit !== 0 &&
        it.quantity &&
        Number(it.quantity) > 0
    );

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
      items: validItems.map((it) => ({
        item: Number(it.item),
        quantity: Number(it.quantity),
        unit: Number(it.unit),
        unit_price: it.unit_price ? Number(it.unit_price) : null,
      })),
    };

    try {
      await apiClient.post("rfqs/", payload);

      // SUCCESS TOAST WITH BACKGROUND EMAIL INFO
      toast.success(
        <div>
          <strong>RFQ Created Successfully!</strong>
          <br />
          <span className="text-sm opacity-90">
            Notification emails are being sent in the background...
          </span>
        </div>,
        {
          icon: "Success",
          style: { background: "#10b981", color: "white" },
          progressStyle: { background: "#86efac" },
          autoClose: 5000,
        }
      );

      navigate("/view-rfq");
    } catch (err) {
      console.error("RFQ submission error:", err);
      const errors = err.response?.data;
      if (errors?.items) {
        toast.error("Some items have invalid data. Please check.");
      } else {
        toast.error(errors?.detail || "Failed to save RFQ");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClientSelect = (type) => {
    setIsModalOpen(false);
    if (type === "new") setState((prev) => ({ ...prev, isNewClient: true }));
    else navigate("/existing-client");
  };

  const handleDownloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("RFQ Template");

    ws.columns = [
      { header: "Sl.no", key: "sl_no", width: 10 },
      { header: "Item", key: "item", width: 35 },
      { header: "Quantity", key: "quantity", width: 15 },
      { header: "Unit", key: "unit", width: 15 },
      { header: "Unit Price", key: "unit_price", width: 15 },
    ];

    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4F81BD" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };

    ws.addRow({
      sl_no: 1,
      item: "Pressure Gauge",
      quantity: 4,
      unit: "Pcs",
      unit_price: 150.0,
    });

    try {
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/octet-stream",
      });
      saveAs(blob, "RFQ_Template.xlsx");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate template");
    }
  };

  const renderStep1 = () => (
    <div className="grid gap-4">
      {/* Company Details */}
      <div className="bg-white p-4 space-y-4 rounded-md shadow">
        <h2 className="text-black text-xl font-semibold">Company Details</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Name <span className="text-red-500">*</span>
          </label>
          <InputField
            type="text"
            placeholder="Enter company name"
            value={state.company_name}
            onChange={(e) =>
              setState((prev) => ({ ...prev, company_name: e.target.value }))
            }
            onBlur={() => {
              if (!state.company_name.trim()) {
                setCompanyNameError("Company name is required");
              } else {
                setCompanyNameError("");
              }
            }}
            maxLength={100}
            required
            error={companyNameError}
            className={companyNameError ? "border-red-500" : ""}
          />
          {companyNameError && (
            <p className="mt-1 text-sm text-red-600">{companyNameError}</p>
          )}
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

      {/* RFQ Channel */}
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
            {state.channels.map((c) => (
              <option key={c.id} value={c.id}>
                {c.channel_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Point of Contact */}
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
            {state.teamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.designation || "No designation"})
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
    <div className="grid gap-6">
      {/* Upload Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-dashed border-indigo-300 rounded-xl p-8 text-center">
        <h3 className="text-2xl font-bold text-indigo-800 mb-3">
          Upload Excel/CSV → Server Processes 500+ Items
        </h3>
        <p className="text-gray-600 mb-4">
          Columns: <code className="bg-gray-200 px-2 rounded">Sl.no</code>,{" "}
          <code className="bg-gray-200 px-2 rounded">Item</code>,{" "}
          <code className="bg-gray-200 px-2 rounded">Quantity</code>,{" "}
          <code className="bg-gray-200 px-2 rounded">Unit</code>,{" "}
          <code className="bg-gray-200 px-2 rounded">Unit Price</code>
          <br />
        </p>
        <label className="cursor-pointer">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
          <div className="inline-block bg-indigo-600 text-white px-8 py-2 rounded-xl hover:bg-indigo-700 transition text-lg shadow-lg">
            {uploading ? "Processing…" : "Upload File"}
          </div>
        </label>
        <div className="mt-3 flex items-center justify-center">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="w-fit px-8 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 flex items-center gap-2 transition-opacity duration-300 opacity-90 hover:opacity-100"
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
      </div>

      {/* Items List */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-bold">Items List </h3>
        </div>

        {state.items.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <p className="text-gray-500 text-lg">
              No items yet. Upload or add manually, or skip to submit without
              items.
            </p>
          </div>
        ) : (
          state.items.map((it, idx) => (
            <div
              key={idx}
              className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-md"
            >
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-bold text-indigo-700">
                  {it.sl_no && (
                    <span className="text-black text-md">Sl.no {it.sl_no}</span>
                  )}
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {/* Item */}
                <div>
                  <label className="block font-medium mb-1">Item</label>
                  <SearchableDropdown
                    options={state.itemsList}
                    value={it.item}
                    onChange={(val, opts) =>
                      handleItemChange(idx, "item", val, opts)
                    }
                    placeholder="Type or select item"
                    allowAddItem
                    apiEndpoint="items/"
                  />
                </div>

                {/* Quantity */}
                <div>
                  <label className="block font-medium mb-1">Quantity</label>
                  <InputField
                    type="number"
                    value={it.quantity}
                    onChange={(e) =>
                      handleItemChange(idx, "quantity", e.target.value)
                    }
                    min="1"
                    className="text-md"
                  />
                </div>

                {/* Unit */}
                <div>
                  <label className="block font-medium mb-1">Unit</label>
                  <SearchableDropdown
                    options={state.units}
                    value={it.unit}
                    onChange={(val, opts) =>
                      handleItemChange(idx, "unit", val, opts)
                    }
                    placeholder="Type or select unit"
                    allowAddItem
                    apiEndpoint="units/"
                  />
                </div>

                {/* Unit Price */}
                <div>
                  <label className="block font-medium mb-1">
                    Unit Price (SAR)
                  </label>
                  <InputField
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={it.unit_price}
                    onChange={(e) =>
                      handleItemChange(idx, "unit_price", e.target.value)
                    }
                    className="text-md"
                  />
                </div>

                {/* Remove */}
                <div>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="relative top-7 bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded transition-opacity duration-300 opacity-90 hover:opacity-100"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-opacity duration-300 opacity-90 hover:opacity-100"
      >
        + Add Manual
      </button>
    </div>
  );

  return (
    <div className="mx-auto p-4">
      <h1 className="text-2xl text-center sm:text-left font-bold mb-4">
        Add RFQ
      </h1>

      {/* Step Indicator */}
      <div className="flex justify-center sm:justify-between items-center gap-8 mb-8">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`text-center ${
              step === s ? "text-indigo-600 font-bold" : "text-gray-400"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full border-2 mx-auto mb-2 flex items-center justify-center text-xl
                ${
                  step === s
                    ? "border-indigo-600 bg-indigo-100"
                    : "border-gray-300"
                }`}
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
        title="Client Type"
      >
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => handleClientSelect("new")}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl transition-opacity duration-300 opacity-90 hover:opacity-100"
          >
            New Client
          </button>
          <button
            type="button"
            onClick={() => handleClientSelect("existing")}
            className="w-full bg-gray-200 hover:bg-gray-300 py-2 rounded-xl transition-opacity duration-300 opacity-90 hover:opacity-100"
          >
            Existing Client
          </button>
        </div>
      </Modal>

      {/* Form (only when New Client selected) */}
      {state.isNewClient && (
        <form onSubmit={handleSubmit} className="space-y-8">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          {/* Navigation Buttons */}
          <div className="flex justify-between space-x-4">
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-2 rounded-lg transition-opacity duration-300 opacity-90 hover:opacity-100"
              >
                ← Back
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2 rounded-lg ml-auto transition-opacity duration-300 opacity-90 hover:opacity-100"
              >
                Next →
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || !state.company_name.trim()}
                className={`bg-green-600 hover:bg-green-700 text-white px-12 py-3 rounded-lg ml-auto flex items-center gap-3 transition-all duration-300 ${
                  loading || !state.company_name.trim()
                    ? "opacity-50 cursor-not-allowed"
                    : "opacity-90 hover:opacity-100 shadow-lg"
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Creating RFQ...
                  </>
                ) : (
                  "Submit RFQ"
                )}
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
};

export default AddRFQ;
