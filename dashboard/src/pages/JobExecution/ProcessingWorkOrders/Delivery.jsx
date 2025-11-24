import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import apiClient from "../../../helpers/apiClient";
import InputField from "../../../components/InputField";
import Modal from "../../../components/Modal";

const Delivery = () => {
  const navigate = useNavigate();
  const [state, setState] = useState({
    workOrders: [],
    technicians: [],
    itemsList: [],
    units: [],
    deliveryNotes: [],
    quotations: [], 
    purchaseOrders: [], 
    channels: [], 
    searchTerm: "",
    sortBy: "created_at",
    currentPage: 1,
    itemsPerPage: 20,
    isViewModalOpen: false,
    selectedWO: null,
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
      const [
        woRes,
        techRes,
        itemsRes,
        dnRes,
        unitsRes,
        quotationsRes,
        poRes,
        channelsRes,
      ] = await Promise.all([
        apiClient.get("work-orders/", { params: { status: "Approved" } }),
        apiClient.get("technicians/"),
        apiClient.get("items/"),
        apiClient.get("delivery-notes/"), 
        apiClient.get("units/"),
        apiClient.get("quotations/"),
        apiClient.get("purchase-orders/"),
        apiClient.get("channels/"),
      ]);
      console.log("Fetched WOs in Delivery:", woRes.data); 
      const allDNs = dnRes.data || []; 
      const deliveryNotes =
        allDNs.filter(
          (dn) => dn.dn_number && !dn.dn_number.startsWith("TEMP-DN")
        ) || [];
      console.log("Filtered Real DNs in Delivery:", deliveryNotes); 

      setState((prev) => ({
        ...prev,
        workOrders: woRes.data || [],
        deliveryNotes, 
        technicians: techRes.data || [],
        itemsList: itemsRes.data || [],
        units: unitsRes.data || [],
        quotations: quotationsRes.data || [],
        purchaseOrders: poRes.data || [],
        channels: channelsRes.data || [],
      }));
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load work orders.");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getQuotationDetails = (wo) => {
    const purchaseOrder = state.purchaseOrders.find(
      (po) => po.id === wo.purchase_order
    );
    const quotation = state.quotations.find((q) => q.id === wo.quotation);
    return {
      series_number: quotation?.series_number || "N/A",
      company_name: quotation?.company_name || "N/A",
      company_address: quotation?.company_address || "N/A",
      company_phone: quotation?.company_phone || "N/A",
      company_email: quotation?.company_email || "N/A",
      channel:
        state.channels.find((c) => c.id === quotation?.rfq_channel)
          ?.channel_name || "N/A",
      contact_name: quotation?.point_of_contact_name || "N/A",
      contact_email: quotation?.point_of_contact_email || "N/A",
      contact_phone: quotation?.point_of_contact_phone || "N/A",
      po_series_number: purchaseOrder?.series_number || "N/A",
      client_po_number: purchaseOrder?.client_po_number || "N/A",
      order_type: purchaseOrder?.order_type || "N/A",
      created_at: purchaseOrder?.created_at
        ? new Date(purchaseOrder.created_at).toLocaleDateString()
        : "N/A",
      po_file: purchaseOrder?.po_file || null,
      assigned_sales_person: quotation?.assigned_sales_person_name || "N/A",
    };
  };

  const filteredWOs = state.workOrders
    .filter(
      (wo) =>
        getQuotationDetails(wo)
          .company_name.toLowerCase()
          .includes(state.searchTerm.toLowerCase()) ||
        (wo.wo_number || "")
          .toLowerCase()
          .includes(state.searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (state.sortBy === "created_at") {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (state.sortBy === "company_name") {
        return getQuotationDetails(a).company_name.localeCompare(
          getQuotationDetails(b).company_name
        );
      }
      return 0;
    });

  const handleViewWO = (wo) => {
    setState((prev) => ({
      ...prev,
      isViewModalOpen: true,
      selectedWO: wo,
    }));
  };

  const handleInitiateDelivery = (workOrder) => {
    navigate(
      `/job-execution/processing-work-orders/initiate-delivery/${workOrder.id}`
    );
  };

  const getAssignedTechnicians = (items) => {
    const technicianIds = [
      ...new Set(items.map((item) => item.assigned_to).filter((id) => id)),
    ];
    if (technicianIds.length === 0) return "None";
    if (technicianIds.length > 1) return "Multiple";
    const technician = state.technicians.find((t) => t.id === technicianIds[0]);
    return technician
      ? `${technician.name} (${technician.designation || "N/A"})`
      : "N/A";
  };

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
      <h1 className="text-2xl font-bold mb-4">Delivery</h1>
      
      {filteredWOs.length === 0 && (
        <div className="text-center text-gray-500 mt-4">
          No work orders match the current filter.
        </div>
      )}
      
      <div className="bg-white p-4 rounded-md shadow w-full">
        {/* Updated Search Section - Matching Manager Approval Design */}
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-3">Search Work Orders</h2>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="w-full sm:w-80">
              <InputField
                type="text"
                placeholder="Search by company name or WO Number..."
                value={state.searchTerm}
                onChange={(e) =>
                  setState((prev) => ({ ...prev, searchTerm: e.target.value }))
                }
                className="w-full"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Sort By
              </label>
              <select
                value={state.sortBy}
                onChange={(e) =>
                  setState((prev) => ({ ...prev, sortBy: e.target.value }))
                }
                className="p-2 border rounded focus:outline-indigo-500 text-sm"
              >
                <option value="created_at">Creation Date</option>
                <option value="company_name">Company Name</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left text-sm font-medium text-gray-700">
                  Sl No
                </th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700">
                  WO Number
                </th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700">
                  Company Name
                </th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700">
                  Created At
                </th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700">
                  Assigned To
                </th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {currentWOs.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="border p-2 text-center text-gray-500"
                  >
                    No work orders available.
                  </td>
                </tr>
              ) : (
                currentWOs.map((wo, index) => (
                  <tr key={wo.id} className="border hover:bg-gray-50">
                    <td className="border p-2">{startIndex + index + 1}</td>
                    <td className="border p-2">{wo.wo_number || "N/A"}</td>
                    <td className="border p-2">
                      {getQuotationDetails(wo).company_name}
                    </td>
                    <td className="border p-2">
                      {new Date(wo.created_at).toLocaleDateString()}
                    </td>
                    <td className="border p-2">
                      {getAssignedTechnicians(wo.items)}
                    </td>
                    <td className="border p-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewWO(wo)}
                          className="whitespace-nowrap px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                        >
                          View WO & Certificates
                        </button>
                        <button
                          onClick={() => handleInitiateDelivery(wo)}
                          disabled={
                            !hasPermission("delivery", "edit") ||
                            state.deliveryNotes.some((dn) => dn.work_order === wo.id)
                          }
                          className={`whitespace-nowrap px-3 py-1 rounded-md text-sm ${
                            !hasPermission("delivery", "edit") ||
                            state.deliveryNotes.some((dn) => dn.work_order === wo.id)
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : "bg-indigo-600 text-white hover:bg-indigo-700"
                          }`}
                        >
                          {state.deliveryNotes.some((dn) => dn.work_order === wo.id)
                            ? "Delivery Initiated"
                            : "Initiate Delivery"}
                        </button>
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
          <button
            onClick={handlePrev}
            disabled={state.currentPage === 1}
            className="px-3 py-1 bg-gray-400 text-white rounded-md hover:bg-gray-500 disabled:bg-gray-300 min-w-fit"
          >
            Prev
          </button>
          {pageNumbers.map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1 rounded-md min-w-fit ${
                state.currentPage === page
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={handleNext}
            disabled={state.currentPage === totalPages}
            className="px-3 py-1 bg-gray-400 text-white rounded-md hover:bg-gray-500 disabled:bg-gray-300 min-w-fit"
          >
            Next
          </button>
        </div>
      )}
      
      <Modal
        isOpen={state.isViewModalOpen}
        onClose={() =>
          setState((prev) => ({
            ...prev,
            isViewModalOpen: false,
            selectedWO: null,
          }))
        }
        title={`Work Order Details - ${state.selectedWO?.wo_number || "N/A"}`}
      >
        {state.selectedWO ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-black">
                Company Details
              </h3>
              <p>
                <strong>Series Number:</strong>{" "}
                {getQuotationDetails(state.selectedWO).series_number}
              </p>
              <p>
                <strong>Company Name:</strong>{" "}
                {getQuotationDetails(state.selectedWO).company_name}
              </p>
              <p>
                <strong>Company Address:</strong>{" "}
                {getQuotationDetails(state.selectedWO).company_address}
              </p>
              <p>
                <strong>Company Phone:</strong>{" "}
                {getQuotationDetails(state.selectedWO).company_phone}
              </p>
              <p>
                <strong>Company Email:</strong>{" "}
                {getQuotationDetails(state.selectedWO).company_email}
              </p>
              <p>
                <strong>Channel:</strong>{" "}
                {getQuotationDetails(state.selectedWO).channel}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-black">
                Contact Details
              </h3>
              <p>
                <strong>Contact Name:</strong>{" "}
                {getQuotationDetails(state.selectedWO).contact_name}
              </p>
              <p>
                <strong>Contact Email:</strong>{" "}
                {getQuotationDetails(state.selectedWO).contact_email}
              </p>
              <p>
                <strong>Contact Phone:</strong>{" "}
                {getQuotationDetails(state.selectedWO).contact_phone}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-black">
                Purchase Order Details
              </h3>
              <p>
                <strong>Series Number:</strong>{" "}
                {getQuotationDetails(state.selectedWO).po_series_number}
              </p>
              <p>
                <strong>Client PO Number:</strong>{" "}
                {getQuotationDetails(state.selectedWO).client_po_number}
              </p>
              <p>
                <strong>Order Type:</strong>{" "}
                {getQuotationDetails(state.selectedWO).order_type}
              </p>
              <p>
                <strong>Created:</strong>{" "}
                {getQuotationDetails(state.selectedWO).created_at}
              </p>
              <p>
                <strong>PO File:</strong>{" "}
                {getQuotationDetails(state.selectedWO).po_file ? (
                  <a
                    href={getQuotationDetails(state.selectedWO).po_file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline"
                  >
                    View File
                  </a>
                ) : (
                  "N/A"
                )}
              </p>
              <p>
                <strong>Assigned Sales Person:</strong>{" "}
                {getQuotationDetails(state.selectedWO).assigned_sales_person}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-black">
                Work Order Details
              </h3>
              <p>
                <strong>Work Order Number:</strong>{" "}
                {state.selectedWO.wo_number || "N/A"}
              </p>
              <p>
                <strong>Work Order Type:</strong>{" "}
                {state.selectedWO.wo_type || "N/A"}
              </p>
              <p>
                <strong>Date Received:</strong>{" "}
                {state.selectedWO.date_received
                  ? new Date(
                      state.selectedWO.date_received
                    ).toLocaleDateString()
                  : "N/A"}
              </p>
              <p>
                <strong>Expected Completion Date:</strong>{" "}
                {state.selectedWO.expected_completion_date
                  ? new Date(
                      state.selectedWO.expected_completion_date
                    ).toLocaleDateString()
                  : "N/A"}
              </p>
              <p>
                <strong>Onsite or Lab:</strong>{" "}
                {state.selectedWO.onsite_or_lab || "N/A"}
              </p>
              <p>
                <strong>Site Location:</strong>{" "}
                {state.selectedWO.site_location || "N/A"}
              </p>
              <p>
                <strong>Remarks:</strong> {state.selectedWO.remarks || "N/A"}
              </p>
              <p>
                <strong>Status:</strong> {state.selectedWO.status || "N/A"}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-black">Items</h3>
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
                          Unit Price
                        </th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">
                          Range
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
                              ?.name || "N/A"}
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            {item.quantity || "N/A"}
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            {state.units.find((u) => u.id === Number(item.unit))
                              ?.name || "N/A"}
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            {item.unit_price
                              ? Number(item.unit_price).toFixed(2)
                              : "N/A"}
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            {item.range || "N/A"}
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            {item.certificate_uut_label || "N/A"}
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            {item.certificate_number || "N/A"}
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            {item.calibration_date
                              ? new Date(
                                  item.calibration_date
                                ).toLocaleDateString()
                              : "N/A"}
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            {item.calibration_due_date
                              ? new Date(
                                  item.calibration_due_date
                                ).toLocaleDateString()
                              : "N/A"}
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            {item.uuc_serial_number || "N/A"}
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
                              "N/A"
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
        ) : (
          <p className="text-gray-500">No work order selected.</p>
        )}
      </Modal>
    </div>
  );
};

export default Delivery;