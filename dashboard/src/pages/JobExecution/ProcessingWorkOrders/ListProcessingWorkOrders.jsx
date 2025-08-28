import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import apiClient from "../../../helpers/apiClient";
import InputField from "../../../components/InputField";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";
import Template2 from "../../../components/Templates/RFQ/Template2";

const ListProcessingWorkOrders = () => {
  const navigate = useNavigate();
  const [state, setState] = useState({
    workOrders: [],
    itemsList: [],
    units: [],
    technicians: [],
    searchTerm: "",
    sortBy: "created_at",
    currentPage: 1,
    itemsPerPage: 20,
    isModalOpen: false,
    selectedWO: null,
    isSubmitting: false,
  });

  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get("/profile/");
        const user = response.data;
        setIsSuperadmin(user.is_superuser || user.role?.name === "Superadmin");
        const roleId = user.role?.id;
        if (roleId) {
          const res = await apiClient.get(`/roles/${roleId}/`);
          setPermissions(res.data.permissions || []);
        } else {
          setPermissions([]);
        }
      } catch (error) {
        console.error("Unable to fetch user profile:", error);
        setPermissions([]);
        setIsSuperadmin(false);
      } finally {
        setIsLoadingPermissions(false);
      }
    };
    fetchProfile();
  }, []);

  const hasPermission = (page, action) => {
    if (isSuperadmin) return true;
    const perm = permissions.find((p) => p.page === page);
    return perm && perm[`can_${action}`];
  };

  const fetchData = async () => {
    try {
      const [woRes, itemsRes, unitsRes, techRes] = await Promise.all([
        apiClient.get("/work-orders/?status=Submitted"),
        apiClient.get("/items/"),
        apiClient.get("/units/"),
        apiClient.get("/technicians/"),
      ]);
      setState((prev) => ({
        ...prev,
        workOrders: woRes.data || [],
        itemsList: itemsRes.data || [],
        units: unitsRes.data || [],
        technicians: techRes.data || [],
      }));
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load work orders.");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleViewWO = (wo) => {
    setState((prev) => ({
      ...prev,
      isModalOpen: true,
      selectedWO: wo,
    }));
  };

  const handleEditWO = (woId) => {
    navigate(`/job-execution/processing-work-orders/edit-work-order/${woId}`);
  };

  const handleDeleteWO = async (woId) => {
    if (window.confirm("Are you sure you want to delete this work order?")) {
      try {
        await apiClient.delete(`/work-orders/${woId}/`);
        toast.success("Work order deleted successfully.");
        navigate("/purchase-orders");
        await fetchData();
      } catch (error) {
        console.error("Error deleting work order:", error);
        toast.error("Failed to delete work order.");
      }
    }
  };

  const handleMoveToApproval = async (woId) => {
    const wo = state.workOrders.find((w) => w.id === woId);
    if (!wo) {
      toast.error("Work order not found.");
      return;
    }
    const isComplete = wo.items.every(
      (item) =>
        item.certificate_number &&
        item.certificate_uut_label &&
        item.calibration_date &&
        item.calibration_due_date &&
        item.uuc_serial_number &&
        item.certificate_file &&
        item.range !== null &&
        item.range !== undefined
    );
    if (!isComplete) {
      toast.warn("Please complete all Device Under Test details before moving to approval.");
      navigate(`/job-execution/processing-work-orders/edit-work-order/${woId}?scrollToDUT=true`);
      return;
    }
    try {
      const response = await apiClient.post(`/work-orders/${woId}/move-to-approval/`);
      toast.success(response.data.status);
      await fetchData();
    } catch (error) {
      console.error("Error moving work order to approval:", error);
      toast.error(error.response?.data?.error || "Failed to move work order to approval.");
    }
  };

  const handlePrint = (wo) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head><title>Work Order ${wo.wo_number}</title></head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>Work Order Details</h1>
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 1.25rem; font-weight: 600;">Work Order Details</h2>
            <p><strong>Work Order Number:</strong> ${wo.wo_number || "Not Provided"}</p>
            <p><strong>Work Order Type:</strong> ${wo.wo_type || "Not Provided"}</p>
            <p><strong>Date Received:</strong> ${
              wo.date_received ? new Date(wo.date_received).toLocaleDateString() : "Not Provided"
            }</p>
            <p><strong>Expected Completion Date:</strong> ${
              wo.expected_completion_date ? new Date(wo.expected_completion_date).toLocaleDateString() : "Not Provided"
            }</p>
            <p><strong>Onsite or Lab:</strong> ${wo.onsite_or_lab || "Not Provided"}</p>
            <p><strong>Site Location:</strong> ${wo.site_location || "Not Provided"}</p>
            <p><strong>Remarks:</strong> ${wo.remarks || "Not Provided"}</p>
          </div>
          <div>
            <h2 style="font-size: 1.25rem; font-weight: 600;">Device Under Test Details</h2>
            <table border="1" style="width: 100%; border-collapse: collapse;">
              <tr style="background-color: #f2f2f2;">
                <th style="padding: 8px; text-align: left;">Item</th>
                <th style="padding: 8px; text-align: left;">Quantity</th>
                <th style="padding: 8px; text-align: left;">Unit</th>
                <th style="padding: 8px; text-align: left;">Range</th>
                <th style="padding: 8px; text-align: left;">Assigned To</th>
                <th style="padding: 8px; text-align: left;">Certificate UUT Label</th>
                <th style="padding: 8px; text-align: left;">Certificate Number</th>
                <th style="padding: 8px; text-align: left;">Calibration Date</th>
                <th style="padding: 8px; text-align: left;">Calibration Due Date</th>
                <th style="padding: 8px; text-align: left;">UUC Serial Number</th>
                <th style="padding: 8px; text-align: left;">Certificate</th>
              </tr>
              ${wo.items
                .map(
                  (item) => `
                    <tr>
                      <td style="padding: 8px;">${
                        state.itemsList.find((i) => i.id === item.item)?.name || "Not Provided"
                      }</td>
                      <td style="padding: 8px; text-align: center;">${item.quantity || "Not Provided"}</td>
                      <td style="padding: 8px; text-align: left;">${
                        state.units.find((u) => u.id === item.unit)?.name || "Not Provided"
                      }</td>
                      <td style="padding: 8px; text-align: left;">${item.range || "Not Provided"}</td>
                      <td style="padding: 8px; text-align: left;">${
                        state.technicians.find((t) => t.id === item.assigned_to)?.name || "Not Provided"
                      }</td>
                      <td style="padding: 8px; text-align: left;">${
                        item.certificate_uut_label || "Not Provided"
                      }</td>
                      <td style="padding: 8px; text-align: left;">${
                        item.certificate_number || "Not Provided"
                      }</td>
                      <td style="padding: 8px; text-align: left;">${
                        item.calibration_date ? new Date(item.calibration_date).toLocaleDateString() : "Not Provided"
                      }</td>
                      <td style="padding: 8px; text-align: left;">${
                        item.calibration_due_date ? new Date(item.calibration_due_date).toLocaleDateString() : "Not Provided"
                      }</td>
                      <td style="padding: 8px; text-align: left;">${
                        item.uuc_serial_number || "Not Provided"
                      }</td>
                      <td style="padding: 8px; text-align: left;">${
                        item.certificate_file
                          ? `<a href="${item.certificate_file}" target="_blank">View Certificate</a>`
                          : "Not Provided"
                      }</td>
                    </tr>
                  `
                )
                .join("")}
            </table>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const filteredWOs = state.workOrders
    .filter(
      (wo) =>
        (wo.wo_number || "")
          .toLowerCase()
          .includes(state.searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (state.sortBy === "created_at") {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (state.sortBy === "wo_number") {
        return (a.wo_number || "").localeCompare(b.wo_number || "");
      }
      return 0;
    });

  const totalPages = Math.ceil(filteredWOs.length / state.itemsPerPage);
  const startIndex = (state.currentPage - 1) * state.itemsPerPage;
  const currentWOs = filteredWOs.slice(
    startIndex,
    startIndex + state.itemsPerPage
  );

  const pageGroupSize = 3;
  const currentGroup = Math.floor((state.currentPage - 1) / pageGroupSize);
  const startPage = currentGroup * pageGroupSize + 1;
  const endPage = Math.min(startPage + pageGroupSize - 1, totalPages);
  const pageNumbers = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i
  );

  const handlePageChange = (page) => {
    setState((prev) => ({ ...prev, currentPage: page }));
  };

  const handleNext = () => {
    if (state.currentPage < totalPages) {
      setState((prev) => ({ ...prev, currentPage: prev.currentPage + 1 }));
    }
  };

  const handlePrev = () => {
    if (state.currentPage > 1) {
      setState((prev) => ({ ...prev, currentPage: prev.currentPage - 1 }));
    }
  };

  return (
    <div className="mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Processing Work Orders</h1>
      <div className="bg-white p-4 space-y-4 rounded-md shadow w-full">
        <div className="mb-6 flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Work Orders
            </label>
            <InputField
              type="text"
              placeholder="Search by WO number..."
              value={state.searchTerm}
              onChange={(e) =>
                setState((prev) => ({ ...prev, searchTerm: e.target.value }))
              }
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              value={state.sortBy}
              onChange={(e) =>
                setState((prev) => ({ ...prev, sortBy: e.target.value }))
              }
              className="p-2 border rounded focus:outline-indigo-500"
            >
              <option value="created_at">Creation Date</option>
              <option value="wo_number">Work Order Number</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">
                  Sl No
                </th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">
                  Created At
                </th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">
                  Work Order Number
                </th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">
                  Assigned To
                </th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">
                  Equipment Collection Status
                </th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {currentWOs.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="border p-2 text-center text-gray-500 whitespace-nowrap"
                  >
                    No work orders found.
                  </td>
                </tr>
              ) : (
                currentWOs.map((wo, index) => (
                  <tr key={wo.id} className="border hover:bg-gray-50">
                    <td className="border p-2 whitespace-nowrap">
                      {startIndex + index + 1}
                    </td>
                    <td className="border p-2 whitespace-nowrap">
                      {new Date(wo.created_at).toLocaleDateString()}
                    </td>
                    <td className="border p-2 whitespace-nowrap">
                      {wo.wo_number || "Not Provided"}
                    </td>
                    <td className="border p-2 whitespace-nowrap">
                      {wo.items
                        .map(
                          (item) =>
                            state.technicians.find((t) => t.id === item.assigned_to)
                              ?.name || "Not Provided"
                        )
                        .filter((name, index, self) => self.indexOf(name) === index)
                        .join(", ")}
                    </td>
                    <td className="border p-2 whitespace-nowrap">
                      {wo.status || "Submitted"}
                    </td>
                    <td className="border p-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleViewWO(wo)}
                          className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                        >
                          View
                        </Button>
                        <Button
                          onClick={() => handleEditWO(wo.id)}
                          disabled={!hasPermission("work_orders", "edit")}
                          className={`px-3 py-1 rounded-md text-sm ${
                            !hasPermission("work_orders", "edit")
                              ? "bg-gray-300 cursor-not-allowed"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          }`}
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDeleteWO(wo.id)}
                          disabled={!hasPermission("work_orders", "delete")}
                          className={`px-3 py-1 rounded-md text-sm ${
                            !hasPermission("work_orders", "delete")
                              ? "bg-gray-300 cursor-not-allowed"
                              : "bg-red-600 text-white hover:bg-red-700"
                          }`}
                        >
                          Delete
                        </Button>
                        <Button
                          onClick={() => handleMoveToApproval(wo.id)}
                          disabled={!hasPermission("work_orders", "edit")} // Only permission-based disable
                          className={`px-3 py-1 rounded-md text-sm ${
                            !hasPermission("work_orders", "edit")
                              ? "bg-gray-300 cursor-not-allowed"
                              : "bg-indigo-600 text-white hover:bg-indigo-700"
                          }`}
                        >
                          Move to Manager Approval
                        </Button>
                        <Button
                          onClick={() => handlePrint(wo)}
                          className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                        >
                          Print
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4 w-fit">
          <Button
            onClick={handlePrev}
            disabled={state.currentPage === 1}
            className="px-3 py-1 bg-gray-400 text-white rounded-md hover:bg-gray-500 disabled:bg-gray-300 min-w-fit"
          >
            Prev
          </Button>
          {pageNumbers.map((page) => (
            <Button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1 rounded-md min-w-fit ${
                state.currentPage === page
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {page}
            </Button>
          ))}
          <Button
            onClick={handleNext}
            disabled={state.currentPage === totalPages}
            className="px-3 py-1 bg-gray-400 text-white rounded-md hover:bg-gray-500 disabled:bg-gray-300 min-w-fit"
          >
            Next
          </Button>
        </div>
      )}
      <Modal
        isOpen={state.isModalOpen}
        onClose={() =>
          setState((prev) => ({
            ...prev,
            isModalOpen: false,
            selectedWO: null,
          }))
        }
        title={`Work Order Details - ${state.selectedWO?.wo_number || "Not Provided"}`}
      >
        {state.selectedWO && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-black">
                Work Order Details
              </h3>
              <p>
                <strong>Work Order Number:</strong>{" "}
                {state.selectedWO.wo_number || "Not Provided"}
              </p>
              <p>
                <strong>Work Order Type:</strong>{" "}
                {state.selectedWO.wo_type || "Not Provided"}
              </p>
              <p>
                <strong>Date Received:</strong>{" "}
                {state.selectedWO.date_received
                  ? new Date(state.selectedWO.date_received).toLocaleDateString()
                  : "Not Provided"}
              </p>
              <p>
                <strong>Expected Completion Date:</strong>{" "}
                {state.selectedWO.expected_completion_date
                  ? new Date(
                      state.selectedWO.expected_completion_date
                    ).toLocaleDateString()
                  : "Not Provided"}
              </p>
              <p>
                <strong>Onsite or Lab:</strong>{" "}
                {state.selectedWO.onsite_or_lab || "Not Provided"}
              </p>
              <p>
                <strong>Site Location:</strong>{" "}
                {state.selectedWO.site_location || "Not Provided"}
              </p>
              <p>
                <strong>Remarks:</strong> {state.selectedWO.remarks || "Not Provided"}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-black">
                Device Under Test Details
              </h3>
              {state.selectedWO.items && state.selectedWO.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">
                          Item
                        </th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">
                          Quantity
                        </th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">
                          Unit
                        </th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">
                          Range
                        </th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">
                          Assigned To
                        </th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">
                          Certificate UUT Label
                        </th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">
                          Certificate Number
                        </th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">
                          Calibration Date
                        </th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">
                          Calibration Due Date
                        </th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">
                          UUC Serial Number
                        </th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">
                          Certificate
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.selectedWO.items.map((item) => (
                        <tr key={item.id} className="border">
                          <td className="border p-2 whitespace-nowrap">
                            {state.itemsList.find((i) => i.id === item.item)
                              ?.name || "Not Provided"}
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            {item.quantity || "Not Provided"}
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            {state.units.find((u) => u.id === item.unit)?.name ||
                              "Not Provided"}
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            {item.range || "Not Provided"}
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            {state.technicians.find((t) => t.id === item.assigned_to)
                              ?.name || "Not Provided"}
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            {item.certificate_uut_label || "Not Provided"}
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            {item.certificate_number || "Not Provided"}
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            {item.calibration_date
                              ? new Date(item.calibration_date).toLocaleDateString()
                              : "Not Provided"}
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            {item.calibration_due_date
                              ? new Date(
                                  item.calibration_due_date
                                ).toLocaleDateString()
                              : "Not Provided"}
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            {item.uuc_serial_number || "Not Provided"}
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            {item.certificate_file ? (
                              <a
                                href={item.certificate_file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:underline"
                              >
                                View Certificate
                              </a>
                            ) : (
                              "Not Provided"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No items available.</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ListProcessingWorkOrders;