import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import apiClient from "../../../helpers/apiClient";
import InputField from "../../../components/InputField";
import Button from "../../../components/Button";
import Loading from "../../../components/Loading";
import { format } from 'date-fns';

const EditDeclinedWorkOrders = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dutRef = useRef(null);
  const [state, setState] = useState({
    workOrder: null,
    itemsList: [],
    units: [],
    technicians: [],
    items: [],
    dateReceived: "",
    expectedCompletionDate: "",
    onsiteOrLab: "",
    siteLocation: "",
    remarks: "",
    assignedTo: "",
    fileChanges: {},
    isSaving: false,
  });

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get("scrollToDUT") === "true" && dutRef.current) {
      const element = dutRef.current;
      const y = element.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }, [location, state.workOrder]);

  const fetchData = async () => {
    try {
      const [woRes, itemsRes, unitsRes, techRes] = await Promise.all([
        apiClient.get(`work-orders/${id}/`),
        apiClient.get("items/"),
        apiClient.get("units/"),
        apiClient.get("technicians/"),
      ]);
      const workOrder = woRes.data;
      const expandedItems = workOrder.items.flatMap((item) =>
        Array.from({ length: item.quantity }, (_, idx) => ({
          id: `${item.item}_${idx + 1}`.padStart(6, "0"),
          item: item.item,
          quantity: 1,
          unit: item.unit,
          unit_price: item.unit_price,
          certificate_uut_label: item.certificate_uut_label || "",
          certificate_number: item.certificate_number || "",
          calibration_date: item.calibration_date || "",
          calibration_due_date: item.calibration_due_date || "",
          uuc_serial_number: item.uuc_serial_number || "",
          assigned_to: item.assigned_to || "",
          certificate_file: item.certificate_file || null,
          range: item.range || "",
        }))
      );

      setState((prev) => ({
        ...prev,
        workOrder,
        itemsList: itemsRes.data || [],
        units: unitsRes.data || [],
        technicians: techRes.data || [],
        items: expandedItems,
        dateReceived: workOrder.date_received ? format(new Date(workOrder.date_received), 'dd-MM-yyyy') : "",
        expectedCompletionDate: workOrder.expected_completion_date ? format(new Date(workOrder.expected_completion_date), 'dd-MM-yyyy') : "",
        onsiteOrLab: workOrder.onsite_or_lab || "",
        siteLocation: workOrder.site_location || "",
        remarks: workOrder.remarks || "",
        assignedTo: workOrder.created_by || "",
        fileChanges: {},
      }));
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load work order.");
      navigate("/job-execution/processing-work-orders/declined-work-orders");
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleItemChange = (index, field, value) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleFileChange = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const maxSize = 1 * 1024 * 1024; 
      if (file.size > maxSize) {
        alert('File size exceeds 1 MB limit. Please upload a smaller file.');
        e.target.value = ''; // Clear the input
        e.target.focus(); // Focus back on the input
        setState((prev) => ({
          ...prev,
          fileChanges: {
            ...prev.fileChanges,
            [index]: null, // Clear the file change
          },
        }));
        return;
      }
      setState((prev) => ({
        ...prev,
        fileChanges: {
          ...prev.fileChanges,
          [index]: file,
        },
      }));
    } else {
      setState((prev) => ({
        ...prev,
        fileChanges: {
          ...prev.fileChanges,
          [index]: null,
        },
      }));
    }
  };

  const isFormValid = () => {
    return state.items.every((item, index) =>
      item.certificate_uut_label &&
      item.certificate_number &&
      item.calibration_date &&
      item.calibration_due_date &&
      item.uuc_serial_number &&
      (item.certificate_file || state.fileChanges[index])
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      toast.error("Please fill all required certificate details for every item before saving.");
      return;
    }
    setState((prev) => ({ ...prev, isSaving: true }));
    try {
      const formData = new FormData();

      formData.append("purchase_order", state.workOrder?.purchase_order || "");
      formData.append("quotation", state.workOrder?.quotation || "");
      formData.append("date_received", state.dateReceived || null);
      formData.append("expected_completion_date", state.expectedCompletionDate || null);
      formData.append("onsite_or_lab", state.onsiteOrLab || "");
      formData.append("site_location", state.siteLocation || "");
      formData.append("remarks", state.remarks || "");
      formData.append("created_by", state.assignedTo || "");

      state.items.forEach((item, index) => {
        formData.append(`items[${index}]id`, item.id || "");
        formData.append(`items[${index}]item`, item.item || "");
        formData.append(`items[${index}]quantity`, item.quantity || 1);
        formData.append(`items[${index}]unit`, item.unit || "");
        formData.append(`items[${index}]unit_price`, item.unit_price || "");
        formData.append(`items[${index}]certificate_uut_label`, item.certificate_uut_label || "");
        formData.append(`items[${index}]certificate_number`, item.certificate_number || "");
        formData.append(`items[${index}]calibration_date`, item.calibration_date || null);
        formData.append(`items[${index}]calibration_due_date`, item.calibration_due_date || null);
        formData.append(`items[${index}]uuc_serial_number`, item.uuc_serial_number || "");
        formData.append(`items[${index}]assigned_to`, item.assigned_to || "");
        formData.append(`items[${index}]range`, item.range || "");
        if (state.fileChanges[index]) {
          formData.append(`items[${index}]certificate_file`, state.fileChanges[index]);
        }
      });

      await apiClient.put(`work-orders/${id}/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Declined Work Order updated successfully.");
      navigate("/job-execution/processing-work-orders/declined-work-orders");
    } catch (error) {
      console.error("Error updating work order:", error.response?.data || error);
      toast.error("Failed to update Work Order: " + (error.response?.data?.detail || JSON.stringify(error.response?.data)));
    } finally {
      setState((prev) => ({ ...prev, isSaving: false }));
    }
  };

  if (!state.workOrder) return <div className="flex justify-center items-center min-h-screen"><Loading /></div>;

  return (
    <div className="mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Edit Declined Work Order - {state.workOrder.wo_number || "Not Provided"}</h1>
      <div className="bg-white p-6 space-y-6 rounded-md shadow">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Received</label>
            <InputField
              type="text"
              value={state.dateReceived}
              disabled={true}
              className="w-full bg-gray-100 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Completion Date</label>
            <InputField
              type="text"
              value={state.expectedCompletionDate}
              disabled={true}
              className="w-full bg-gray-100 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Onsite or Lab</label>
            <select
              value={state.onsiteOrLab}
              disabled={true}
              className="p-2 border rounded w-full bg-gray-100 cursor-not-allowed"
            >
              <option value="">Select</option>
              <option value="Onsite">Onsite</option>
              <option value="Lab">Lab</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Site Location</label>
            <InputField
              type="text"
              value={state.siteLocation}
              disabled={true}
              className="w-full bg-gray-100 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
            <InputField
              type="text"
              value={state.remarks}
              disabled={true}
              className="w-full bg-gray-100 cursor-not-allowed"
            />
          </div>
        </div>

        <div ref={dutRef}>
          <h3 className="text-lg font-medium text-black mb-4">Device Under Test Details</h3>
          {state.items.map((item, index) => (
            <div key={item.id} className="border p-4 rounded-md mb-4 space-y-4">
              <h4 className="text-md font-medium text-gray-700">
                Item: {state.itemsList.find((i) => i.id === item.item)?.name || "Not Provided"} #{item.id.split('_')[1]}
              </h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                <select
                  value={item.assigned_to || ""}
                  onChange={(e) => handleItemChange(index, "assigned_to", e.target.value)}
                  className="p-2 border rounded w-full"
                >
                  <option value="">Select Technician</option>
                  {state.technicians.map((technician) => (
                    <option key={technician.id} value={technician.id}>
                      {technician.name} ({technician.designation})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Certificate UUT Label</label>
                <InputField
                  type="text"
                  value={item.certificate_uut_label || ""}
                  onChange={(e) => handleItemChange(index, "certificate_uut_label", e.target.value)}
                  className="w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Number</label>
                <InputField
                  type="text"
                  value={item.certificate_number || ""}
                  onChange={(e) => handleItemChange(index, "certificate_number", e.target.value)}
                  className="w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Calibration Date</label>
                <InputField
                  type="date"
                  value={item.calibration_date || ""}
                  onChange={(e) => handleItemChange(index, "calibration_date", e.target.value)}
                  className="w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Calibration Due Date</label>
                <InputField
                  type="date"
                  value={item.calibration_due_date || ""}
                  onChange={(e) => handleItemChange(index, "calibration_due_date", e.target.value)}
                  className="w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Range</label>
                <InputField
                  type="text"
                  value={item.range || ""}
                  onChange={(e) => handleItemChange(index, "range", e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">UUC Serial Number</label>
                <InputField
                  type="text"
                  value={item.uuc_serial_number || ""}
                  onChange={(e) => handleItemChange(index, "uuc_serial_number", e.target.value)}
                  className="w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Certificate (Upload 1 MB file)
                </label>
                {item.certificate_file && (
                  <div className="mb-2">
                    <span className="text-sm text-gray-600">
                      Current file:
                      <a
                        href={item.certificate_file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline ml-1"
                      >
                        View Current Certificate
                      </a>
                    </span>
                  </div>
                )}
                <input
                  type="file"
                  onChange={(e) => handleFileChange(index, e)}
                  className="w-full p-2 border rounded"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  required={!item.certificate_file}
                />
                {state.fileChanges[index] && (
                  <div className="mt-1 text-sm text-green-600">
                    New file selected: {state.fileChanges[index].name}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid() || state.isSaving}
            className={`px-4 py-2 rounded-md ${!isFormValid() || state.isSaving ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"}`}
          >
            {state.isSaving ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            onClick={() => navigate("/job-execution/processing-work-orders/declined-work-orders")}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditDeclinedWorkOrders;