import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../../helpers/apiClient";
import { toast } from "react-toastify";
import InputField from "../../../components/InputField";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const SearchableDropdown = ({ options, value, onChange, placeholder, allowAddItem, apiEndpoint }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [addingItem, setAddingItem] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const selected = options.find(o => o.id === value);
    setSearchTerm(selected ? selected.name : "");
  }, [value, options]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(o =>
    o.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option) => {
    onChange(option.id, options);
    setSearchTerm(option.name);
    setIsOpen(false);
  };

  const createAndSelect = async (name) => {
    if (!name.trim()) return null;
    if (options.some(o => o.name.toLowerCase() === name.toLowerCase())) {
      const existing = options.find(o => o.name.toLowerCase() === name.toLowerCase());
      return existing;
    }

    setAddingItem(true);
    try {
      const res = await apiClient.post(apiEndpoint, { name: name.trim() });
      toast.success(`${apiEndpoint === "items/" ? "Item" : "Unit"} created: ${name}`);
      return res.data;
    } catch (err) {
      toast.error(`Failed to create ${apiEndpoint === "items/" ? "item" : "unit"}`);
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
      const exact = filteredOptions.find(o => o.name.toLowerCase() === searchTerm.toLowerCase());
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
      const exact = options.find(o => o.name.toLowerCase() === searchTerm.toLowerCase());
      if (exact) {
        onChange(exact.id, options);
      } else if (allowAddItem && searchTerm.trim()) {
        const newItem = await createAndSelect(searchTerm);
        if (newItem) {
          onChange(newItem.id, [...options, newItem]);
        }
      }
    }
    setIsOpen(false);
  };

  const handleDownloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('RFQ Template');

    worksheet.columns = [
      { header: 'Item Name', key: 'item', width: 30 },
      { header: 'Quantity', key: 'quantity', width: 15 },
      { header: 'Unit', key: 'unit', width: 15 },
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' },
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.addRow({
      item: 'Example: Cement Bag',
      quantity: 100,
      unit: 'Bag',
    });

    const buffer = await workbook.xlsx.writeBuffer();

    const fileName = 'RFQ_Template.xlsx';
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    saveAs(blob, fileName);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <InputField
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => { setSearchTerm(e.target.value); setIsOpen(true); }}
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
                placeholder={`Add new ${apiEndpoint === "items/" ? "item" : "unit"}...`}
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="flex-1 p-2 border rounded text-sm"
                disabled={addingItem}
              />
              <Button
                onClick={handleAddItem}
                className="bg-green-600 text-white px-3 rounded hover:bg-green-700 text-sm"
                disabled={addingItem || !newItemName.trim()}
              >
                {addingItem ? "..." : "+"}
              </Button>
            </div>
          )}
          {filteredOptions.length > 0 ? (
            filteredOptions.map(o => (
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
              {searchTerm.trim() ? `Press Enter to create "${searchTerm}"` : "No options"}
            </div>
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
    company_name: "", company_address: "", company_phone: "", company_email: "",
    rfq_channel: "", point_of_contact_name: "", point_of_contact_email: "", point_of_contact_phone: "",
    assigned_sales_person: "", due_date_for_quotation: "",
    items: [
      {
        sl_no: 1,
        item: "",
        item_name: "",
        quantity: "",
        unit: "",
        unit_name: ""
      }
    ],
    channels: [],
    teamMembers: [],
    itemsList: [],
    units: [],
    isNewClient: false,
  });

  const [isModalOpen, setIsModalOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [chanRes, teamRes, itemRes, unitRes] = await Promise.all([
          apiClient.get("channels/"), apiClient.get("teams/"),
          apiClient.get("items/"), apiClient.get("units/"),
        ]);
        setState(prev => ({
          ...prev,
          channels: chanRes.data || [],
          teamMembers: teamRes.data || [],
          itemsList: itemRes.data || [],
          units: unitRes.data || [],
        }));
      } catch (err) {
        toast.error("Failed to load data");
      }
    };
    fetchData();
  }, []);

  // AUTO CREATE + RETURN ID
  const ensureItemExists = async (name) => {
    if (!name.trim()) return null;
    const existing = state.itemsList.find(i => i.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing.id;

    try {
      const res = await apiClient.post("items/", { name: name.trim() });
      const newItem = res.data;
      setState(prev => ({ ...prev, itemsList: [...prev.itemsList, newItem] }));
      toast.success(`Item created: ${name}`);
      return newItem.id;
    } catch (err) {
      toast.error(`Failed to create item: ${name}`);
      return null;
    }
  };

  const ensureUnitExists = async (name) => {
    if (!name.trim()) return null;
    const existing = state.units.find(u => u.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing.id;

    try {
      const res = await apiClient.post("units/", { name: name.trim() });
      const newUnit = res.data;
      setState(prev => ({ ...prev, units: [...prev.units, newUnit] }));
      toast.success(`Unit created: ${name}`);
      return newUnit.id;
    } catch (err) {
      toast.error(`Failed to create unit: ${name}`);
      return null;
    }
  };

  // EXCEL UPLOAD WITH AUTO-CREATE
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
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
      const XLSX = await import("xlsx");
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const data = new Uint8Array(ev.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        const newItems = [];
        for (const [i, row] of json.entries()) {
          const itemName = (row["Item"] || row["item"] || row["Name"] || "").toString().trim();
          const qty = row["Quantity"] || row["quantity"] || row["Qty"] || "";
          const unitName = (row["Unit"] || row["unit"] || "").toString().trim();
          const slNo = row["Sl.no"] || row["Sl.No"] || row["sl_no"] || (i + 1);

          if (!itemName || !qty) continue;

          toast.info(`Processing: ${itemName} (${qty} ${unitName || "???"})`);

          const [itemId, unitId] = await Promise.all([
            ensureItemExists(itemName),
            ensureUnitExists(unitName || "Each")
          ]);

          if (itemId) {
            newItems.push({
              sl_no: slNo,
              item: itemId,
              item_name: itemName,
              quantity: Number(qty) || 1,
              unit: unitId,
              unit_name: unitName || "Each",
            });
          }
        }

        setState(prev => ({ ...prev, items: newItems }));
        toast.success(`Loaded & auto-created ${newItems.length} items!`);
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

  const addItem = () => {
    setState(prev => {
      const nextSlNo = prev.items.length + 1;
      return {
        ...prev,
        items: [...prev.items, {
          sl_no: nextSlNo,
          item: "",
          quantity: "",
          unit: "",
          item_name: "",
          unit_name: ""
        }],
      };
    });
  };

  const removeItem = (idx) => {
    setState(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
  };

  const handleItemChange = (idx, field, value, newOptions) => {
    setState(prev => {
      const newItems = [...prev.items];
      newItems[idx][field] = value;
      if (field === "item" && newOptions) return { ...prev, items: newItems, itemsList: newOptions };
      if (field === "unit" && newOptions) return { ...prev, items: newItems, units: newOptions };
      return { ...prev, items: newItems };
    });
  };

  const isStepValid = () => {
    if (step === 3) {
      return state.items.length > 0 && state.items.every(i => i.item && i.quantity > 0 && i.unit);
    }
    return true;
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (isStepValid() || step < 3) setStep(s => s + 1);
    else toast.error("Please complete all items");
  };

  const handlePrev = () => setStep(s => s - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      items: state.items.map(it => ({
        item: Number(it.item),
        quantity: Number(it.quantity),
        unit: Number(it.unit),
        unit_price: null,
      })),
    };

    try {
      await apiClient.post("rfqs/", payload);
      toast.success("RFQ Created Successfully!");
      navigate("/view-rfq");
    } catch (err) {
      toast.error("Failed to save RFQ");
    } finally {
      setLoading(false);
    }
  };

  const handleClientSelect = (type) => {
    setIsModalOpen(false);
    if (type === "new") setState(prev => ({ ...prev, isNewClient: true }));
    else navigate("/existing-client");
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
            type="number"
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
    <div className="grid gap-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-dashed border-indigo-300 rounded-xl p-8 text-center">
        <h3 className="text-2xl font-bold text-indigo-800 mb-3">
          Upload Excel/CSV → Auto-Create Items & Units
        </h3>
        <p className="text-gray-600 mb-4">
          Columns: <code className="bg-gray-200 px-2 rounded">Sl.no</code>,{" "}
          <code className="bg-gray-200 px-2 rounded">Item</code>,{" "}
          <code className="bg-gray-200 px-2 rounded">Quantity</code>,{" "}
          <code className="bg-gray-200 px-2 rounded">Unit</code>
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
            {uploading ? "Processing..." : "Upload File"}
          </div>
        </label>
        <div className="mt-3">
          <Button
              type="button"
              onClick={handleDownloadTemplate}
              className="bg-green-600 text-white text-sm rounded-md hover:bg-green-700 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Template
            </Button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-bold">Items List</h3>
        </div>

        {state.items.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <p className="text-gray-500 text-lg">No items yet. Upload or add manually.</p>
          </div>
        ) : (
          state.items.map((it, idx) => (
            <div key={idx} className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-bold text-indigo-700">
                  {it.sl_no && <span className="text-black text-md">Sl.no {it.sl_no}</span>}
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block font-medium mb-1">Item</label>
                  <SearchableDropdown
                    options={state.itemsList}
                    value={it.item}
                    onChange={(val, opts) => handleItemChange(idx, "item", val, opts)}
                    placeholder="Type or select item"
                    allowAddItem
                    apiEndpoint="items/"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Quantity</label>
                  <InputField
                    type="number"
                    value={it.quantity}
                    onChange={e => handleItemChange(idx, "quantity", e.target.value)}
                    min="1"
                    className="text-md"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Unit</label>
                  <SearchableDropdown
                    options={state.units}
                    value={it.unit}
                    onChange={(val, opts) => handleItemChange(idx, "unit", val, opts)}
                    placeholder="Type or select unit"
                    allowAddItem
                    apiEndpoint="units/"
                  />
                </div>
                <div>
                  <Button
                    onClick={() => removeItem(idx)}
                    className="relative top-7 bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <Button onClick={addItem} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg">
        + Add Manual
      </Button>
    </div>
  );

  return (
    <div className="mx-auto p-4">
      <h1 className="text-2xl text-center sm:text-left font-bold mb-4">Add RFQ</h1>
      <div className="flex justify-center sm:justify-between items-center gap-8 mb-8">
        {[1, 2, 3].map(s => (
          <div key={s} className={`text-center ${step === s ? "text-indigo-600 font-bold" : "text-gray-400"}`}>
            <div className={`w-10 h-10 rounded-full border-2 mx-auto mb-2 flex items-center justify-center text-xl
              ${step === s ? "border-indigo-600 bg-indigo-100" : "border-gray-300"}`}>
              {s}
            </div>
            <p className="text-sm">
              {s === 1 ? "Client" : s === 2 ? "Assign" : "Items"}
            </p>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { }} title="Client Type">
        <div className="space-y-4">
          <Button onClick={() => handleClientSelect("new")} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl">
            New Client
          </Button>
          <Button onClick={() => handleClientSelect("existing")} className="w-full bg-gray-200 hover:bg-gray-300 py-2 rounded-xl">
            Existing Client
          </Button>
        </div>
      </Modal>

      {state.isNewClient && (
        <form onSubmit={handleSubmit} className="space-y-8">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          <div className="flex justify-between space-x-4">
            {step > 1 && (
              <Button type="button" onClick={handlePrev} className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-2 rounded-lg">
                ← Back
              </Button>
            )}
            {step < 3 ? (
              <Button type="button" onClick={handleNext} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2 rounded-lg ml-auto">
                Next →
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={loading || state.items.length === 0}
                className={`bg-green-600 hover:bg-green-700 text-white px-12 py-2 rounded-lg ml-auto
                  ${loading || state.items.length === 0 ? "opacity-50" : ""}`}
              >
                {loading ? "Saving..." : "Submit RFQ"}
              </Button>
            )}
          </div>
        </form>
      )}
    </div>
  );
};

export default AddRFQ;