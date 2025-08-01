import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import apiClient from "../../../helpers/apiClient";
import InputField from "../../../components/InputField";
import Button from "../../../components/Button";

const EditProcessingWorkOrders = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({
    workOrder: null,
    itemsList: [],
    units: [],
    technicians: [],
    items: [],
    dateReceived: "",
    expectedCompletionDate: "",
    onsiteOrLab: "",
    range: "",
    serialNumber: "",
    siteLocation: "",
    remarks: "",
    assignedTo: "",
  });

  const fetchData = async () => {
    try {
      const [woRes, itemsRes, unitsRes, techRes] = await Promise.all([
        apiClient.get(`work-orders/${id}/`),
        apiClient.get("items/"),
        apiClient.get("units/"),
        apiClient.get("technicians/"),
      ]);
      const workOrder = woRes.data;
      setState((prev) => ({
        ...prev,
        workOrder,
        itemsList: itemsRes.data || [],
        units: unitsRes.data || [],
        technicians: techRes.data || [],
        items: workOrder.items || [],
        dateReceived: workOrder.date_received || "",
        expectedCompletionDate: workOrder.expected_completion_date || "",
        onsiteOrLab: workOrder.onsite_or_lab || "",
        range: workOrder.range || "",
        serialNumber: workOrder.serial_number || "",
        siteLocation: workOrder.site_location || "",
        remarks: workOrder.remarks || "",
        assignedTo: workOrder.assigned_to || "",
      }));
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load work order.");
      navigate("/job-execution/processing-work-orders/list-all-processing-work-orders");
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

  const handleSubmit = async () => {
    try {
      const payload = {
        date_received: state.dateReceived,
        expected_completion_date: state.expectedCompletionDate,
        onsite_or_lab: state.onsiteOrLab,
        range: state.range,
        serial_number: state.serialNumber,
        site_location: state.siteLocation,
        remarks: state.remarks,
        assigned_to: state.assignedTo || null,
        items: state.items.map((item) => ({
          id: item.id,
          item: item.item,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          certificate_number: item.certificate_number,
          calibration_date: item.calibration_date,
          calibration_due_date: item.calibration_due_date,
          uuc_serial_number: item.uuc_serial_number,
        })),
      };
      await apiClient.put(`work-orders/${id}/`, payload);
      toast.success("Work Order updated successfully.");
      navigate("/job-execution/processing-work-orders/list-all-processing-work-orders");
    } catch (error) {
      console.error("Error updating work order:", error);
      toast.error("Failed to update Work Order.");
    }
  };

  const handleMoveToApproval = async () => {
    try {
      await apiClient.post(`work-orders/${id}/move_to_approval/`);
      toast.success("Work Order moved to Manager Approval.");
      navigate("/job-execution/processing-work-orders/list-all-processing-work-orders");
    } catch (error) {
      console.error("Error moving to approval:", error);
      toast.error("Failed to move Work Order to approval.");
    }
  };

  if (!state.workOrder) return <div>Loading...</div>;

  return (
    <div className="mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Edit Work Order - {state.workOrder.wo_number}</h1>
      <div className="bg-white p-6 space-y-6 rounded-md shadow">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Received</label>
            <InputField
              type="date"
              value={state.dateReceived}
              onChange={(e) => setState((prev) => ({ ...prev, dateReceived: e.target.value }))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Completion Date</label>
            <InputField
              type="date"
              value={state.expectedCompletionDate}
              onChange={(e) => setState((prev) => ({ ...prev, expectedCompletionDate: e.target.value }))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Onsite or Lab</label>
            <select
              value={state.onsiteOrLab}
              onChange={(e) => setState((prev) => ({ ...prev, onsiteOrLab: e.target.value }))}
              className="p-2 border rounded w-full"
            >
              <option value="">Select</option>
              <option value="Onsite">Onsite</option>
              <option value="Lab">Lab</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Range</label>
            <InputField
              type="text"
              value={state.range}
              onChange={(e) => setState((prev) => ({ ...prev, range: e.target.value }))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
            <InputField
              type="text"
              value={state.serialNumber}
              onChange={(e) => setState((prev) => ({ ...prev, serialNumber: e.target.value }))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Site Location</label>
            <InputField
              type="text"
              value={state.siteLocation}
              onChange={(e) => setState((prev) => ({ ...prev, siteLocation: e.target.value }))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
            <InputField
              type="text"
              value={state.remarks}
              onChange={(e) => setState((prev) => ({ ...prev, remarks: e.target.value }))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
            <select
              value={state.assignedTo}
              onChange={(e) => setState((prev) => ({ ...prev, assignedTo: e.target.value }))}
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
        </div>
        <div>
          <h3 className="text-lg font-medium text-black mb-4">Device Under Test Details</h3>
          {state.items.map((item, index) => (
            <div key={index} className="border p-4 rounded-md mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
                <select
                  value={item.item}
                  onChange={(e) => handleItemChange(index, "item", e.target.value)}
                  className="p-2 border rounded w-full"
                >
                  <option value="">Select Item</option>
                  {state.itemsList.map((i) => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <InputField
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <select
                  value={item.unit}
                  onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                  className="p-2 border rounded w-full"
                >
                  <option value="">Select Unit</option>
                  {state.units.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Number</label>
                <InputField
                  type="text"
                  value={item.certificate_number}
                  onChange={(e) => handleItemChange(index, "certificate_number", e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Calibration Date</label>
                <InputField
                  type="date"
                  value={item.calibration_date}
                  onChange={(e) => handleItemChange(index, "calibration_date", e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Calibration Due Date</label>
                <InputField
                  type="date"
                  value={item.calibration_due_date}
                  onChange={(e) => handleItemChange(index, "calibration_due_date", e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">UUC Serial Number</label>
                <InputField
                  type="text"
                  value={item.uuc_serial_number}
                  onChange={(e) => handleItemChange(index, "uuc_serial_number", e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Certificate</label>
                <input
                  type="file"
                  onChange={(e) => handleItemChange(index, "certificate_file", e.target.files[0])}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button
            onClick={handleMoveToApproval}
            disabled={!state.items.every((item) => item.certificate_number && item.calibration_due_date)}
            className={`px-4 py-2 rounded-md ${state.items.every((item) => item.certificate_number && item.calibration_due_date) ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-gray-300 text-gray-500"}`}
          >
            Move to Approval
          </Button>
          <Button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save Changes
          </Button>
          <Button
            onClick={() => navigate("/job-execution/processing-work-orders/list-all-processing-work-orders")}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditProcessingWorkOrders;