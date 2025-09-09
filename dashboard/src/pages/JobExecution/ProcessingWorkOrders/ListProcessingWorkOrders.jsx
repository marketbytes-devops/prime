import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import apiClient from "../../../helpers/apiClient";
import InputField from "../../../components/InputField";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";
import Template1 from "../../../components/Templates/WorkOrder/Template1";
import ReactDOMServer from "react-dom/server";

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
        apiClient.get("items/"),
        apiClient.get("units/"),
        apiClient.get("technicians/"),
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
        navigate("/job-execution/initiate-work-order/list-all-purchase-orders");
        await fetchData();
      } catch (error) {
        console.error("Error deleting work order:", error);
        toast.error("Failed to delete work order.");
      }
    }
  };

  const isDUTComplete = (wo) => {
    return wo.items.every(
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
  };

  const handleAction = (woId) => {
    const wo = state.workOrders.find((w) => w.id === woId);
    if (!wo) {
      toast.error("Work order not found.");
      return;
    }
    if (!isDUTComplete(wo)) {
      navigate(
        `/job-execution/processing-work-orders/edit-work-order/${woId}?scrollToDUT=true`
      );
    } else {
      handleMoveToApproval(woId);
    }
  };

  const handleMoveToApproval = async (woId) => {
    try {
      const response = await apiClient.post(
        `/work-orders/${woId}/move-to-approval/`
      );
      toast.success(response.data.status);
      await fetchData();
    } catch (error) {
      console.error("Error moving work order to approval:", error);
      toast.error(
        error.response?.data?.error || "Failed to move work order to approval."
      );
    }
  };

  const handlePrint = async (wo) => {
    try {
      console.log("Work Order Object:", wo);

      let rfqDetails = null;
      let teamMembers = [];

      // Try multiple approaches to get RFQ details
      try {
        // First, try to get RFQ directly from work order
        if (wo.rfq) {
          const rfqRes = await apiClient.get(`/rfqs/${wo.rfq}/`);
          rfqDetails = rfqRes.data;
        } else if (wo.quotation?.rfq) {
          const rfqRes = await apiClient.get(`/rfqs/${wo.quotation.rfq}/`);
          rfqDetails = rfqRes.data;
        } else if (wo.quotation) {
          // Try to get quotation details first, then RFQ
          const quotationRes = await apiClient.get(`/quotations/${wo.quotation}/`);
          const quotationData = quotationRes.data;
          if (quotationData.rfq) {
            const rfqRes = await apiClient.get(`/rfqs/${quotationData.rfq}/`);
            rfqDetails = rfqRes.data;
          }
        }

        // Get team members for sales person name mapping
        const teamsRes = await apiClient.get("teams/");
        teamMembers = teamsRes.data || [];
      } catch (error) {
        console.warn("Error fetching RFQ details:", error);
        // Continue with fallback data
      }

      // Set up RFQ details with fallbacks
      if (!rfqDetails) {
        rfqDetails = {
          company_name: "Company Name Not Available",
          company_address: "Address Not Available",
          company_phone: "Phone Not Available",
          company_email: "Email Not Available",
          point_of_contact_name: "Contact Not Available",
          point_of_contact_phone: "Contact Phone Not Available",
          point_of_contact_email: "Contact Email Not Available",
          assigned_sales_person: null,
        };
      }

      // Map assigned sales person ID to name
      let assignedSalesPersonName = "Sales Person Not Available";
      if (rfqDetails.assigned_sales_person && teamMembers.length > 0) {
        const salesPerson = teamMembers.find(
          (member) => member.id === rfqDetails.assigned_sales_person
        );
        if (salesPerson) {
          assignedSalesPersonName = salesPerson.name;
        }
      }

      // Add sales person name to rfqDetails
      rfqDetails.assigned_sales_person_name = assignedSalesPersonName;

      // Map work order items with proper names
      const itemsData = wo.items.map((item) => ({
        id: item.id,
        name:
          state.itemsList.find((i) => i.id === item.item)?.name ||
          "Item Name Not Available",
        quantity: item.quantity || "Not Provided",
        unit:
          state.units.find((u) => u.id === item.unit)?.name || "Not Provided",
        range: item.range || "Not Provided",
        assigned_to_name:
          state.technicians.find((t) => t.id === item.assigned_to)?.name ||
          "Not Provided",
        certificate_uut_label: item.certificate_uut_label || "Not Provided",
        certificate_number: item.certificate_number || "Not Provided",
        calibration_date: item.calibration_date,
        calibration_due_date: item.calibration_due_date,
        uuc_serial_number: item.uuc_serial_number || "Not Provided",
        certificate_file: item.certificate_file,
      }));

      const printData = {
        ...wo,
        items: itemsData,
        rfqDetails: rfqDetails,
      };

      console.log("Print data being sent to template:", printData);

      const htmlString = ReactDOMServer.renderToStaticMarkup(
        <Template1 data={printData} />
      );

      const printWindow = window.open("", "_blank");
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Work Order ${wo.wo_number}</title>
            <style>
              body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
              @media print {
                body { margin: 0; }
                @page { margin: 0.5in; }
              }
            </style>
          </head>
          <body>${htmlString}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    } catch (error) {
      console.error("Error generating print:", error);
      toast.error(
        "Failed to generate print. Please try again or contact support."
      );
    }
  };

  const filteredWOs = state.workOrders
    .filter((wo) =>
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
                            state.technicians.find(
                              (t) => t.id === item.assigned_to
                            )?.name || "Not Provided"
                        )
                        .filter(
                          (name, index, self) => self.indexOf(name) === index
                        )
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
                          onClick={() => handleAction(wo.id)}
                          disabled={!hasPermission("work_orders", "edit")}
                          className={`px-3 py-1 rounded-md text-sm ${
                            !hasPermission("work_orders", "edit")
                              ? "bg-gray-300 cursor-not-allowed"
                              : isDUTComplete(
                                  state.workOrders.find((w) => w.id === wo.id)
                                )
                              ? "bg-indigo-600 text-white hover:bg-indigo-700"
                              : "bg-yellow-600 text-white hover:bg-yellow-700"
                          }`}
                        >
                          {isDUTComplete(
                            state.workOrders.find((w) => w.id === wo.id)
                          )
                            ? "Move to Manager Approval"
                            : "Update Device Test Details"}
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
        title={`Work Order Details - ${
          state.selectedWO?.wo_number || "Not Provided"
        }`}
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
                  ? new Date(
                      state.selectedWO.date_received
                    ).toLocaleDateString()
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
                <strong>Remarks:</strong>{" "}
                {state.selectedWO.remarks || "Not Provided"}
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
                            {state.units.find((u) => u.id === item.unit)
                              ?.name || "Not Provided"}
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            {item.range || "Not Provided"}
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            {state.technicians.find(
                              (t) => t.id === item.assigned_to
                            )?.name || "Not Provided"}
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            {item.certificate_uut_label || "Not Provided"}
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            {item.certificate_number || "Not Provided"}
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            {item.calibration_date
                              ? new Date(
                                  item.calibration_date
                                ).toLocaleDateString()
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