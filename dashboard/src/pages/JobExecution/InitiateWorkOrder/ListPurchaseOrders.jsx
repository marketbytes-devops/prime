import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import apiClient from "../../../helpers/apiClient";
import InputField from "../../../components/InputField";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";

const ListPurchaseOrders = () => {
  const navigate = useNavigate();
  const [state, setState] = useState({
    purchaseOrders: [],
    technicians: [],
    itemsList: [],
    units: [],
    quotations: [],
    series: [],
    searchTerm: "",
    sortBy: "created_at",
    currentPage: 1,
    itemsPerPage: 20,
    isModalOpen: false,
    isWOTypeModalOpen: false,
    isWOModalOpen: false,
    selectedPO: null,
    woType: "",
    dateReceived: "",
    expectedCompletionDate: "",
    onsiteOrLab: "",
    range: "",
    serialNumber: "",
    site_location: "",
    remarks: "",
    assignedTo: "",
    numberOfSplitOrders: "",
    selectedItemIds: [],
    savedItems: [],
    createdSplitOrders: [],
    usedItemIds: [],
    workOrderStatusMap: {},
  });

  const fetchData = async () => {
    try {
      const [poRes, techRes, itemsRes, unitsRes, quotationsRes, seriesRes] =
        await Promise.all([
          apiClient.get("purchase-orders/"),
          apiClient.get("technicians/"),
          apiClient.get("items/"),
          apiClient.get("units/"),
          apiClient.get("quotations/"),
          apiClient.get("series/"),
        ]);

      const purchaseOrders = poRes.data || [];
      const workOrdersPromises = purchaseOrders.map((po) =>
        apiClient.get(`/work-orders/?purchase_order=${po.id}`).then((res) => ({
          id: po.id,
          work_orders: res.data || [],
        }))
      );
      const workOrdersData = await Promise.all(workOrdersPromises);

      const updatedPurchaseOrders = purchaseOrders.map((po) => {
        const woData = workOrdersData.find((w) => w.id === po.id);
        return { ...po, work_orders: woData ? woData.work_orders : [] };
      });

      const workOrderStatusMap = {};
      updatedPurchaseOrders.forEach((po) => {
        workOrderStatusMap[po.id] =
          po.work_orders.length > 0
            ? po.work_orders.map((wo) => ({ id: wo.id, status: wo.status }))
            : [{ id: null, status: "Collection Pending" }];
      });

      setState((prev) => ({
        ...prev,
        purchaseOrders: updatedPurchaseOrders,
        technicians: techRes.data || [],
        itemsList: itemsRes.data || [],
        units: unitsRes.data || [],
        quotations: quotationsRes.data || [],
        series: seriesRes.data || [],
        workOrderStatusMap,
        assignedTo: "",
      }));
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load purchase orders.");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (state.assignedTo && !state.technicians.some((t) => t.id === parseInt(state.assignedTo))) {
      setState((prev) => ({ ...prev, assignedTo: "" }));
      toast.warn("Selected technician is no longer valid. Please select again.");
    }
  }, [state.assignedTo, state.technicians]);

  const handleConvertToWO = (po) => {
    setState((prev) => ({
      ...prev,
      isWOTypeModalOpen: true,
      selectedPO: po,
      savedItems: po.items.map((item) => ({
        ...item,
        name: prev.itemsList.find((i) => i.id === item.item)?.name || "N/A",
      })),
      numberOfSplitOrders: "",
      selectedItemIds: [],
      createdSplitOrders: [],
      usedItemIds: [],
      assignedTo: "",
    }));
  };

  const handleViewPO = (po) => {
    setState((prev) => ({
      ...prev,
      isModalOpen: true,
      selectedPO: po,
    }));
  };

  const handleWOTypeOption = (type) => {
    setState((prev) => ({
      ...prev,
      isWOTypeModalOpen: false,
      isWOModalOpen: true,
      woType: type,
      selectedItemIds: type === "Single" ? prev.savedItems.map((item) => item.id) : [],
      assignedTo: "",
    }));
  };

  const handleNumberOfSplitOrdersChange = (e) => {
    const value = e.target.value === "" ? "" : parseInt(e.target.value, 10);
    if (value && (value < 1 || value > state.savedItems.length)) {
      toast.error(`Number of split orders must be between 1 and ${state.savedItems.length}.`);
      return;
    }
    setState((prev) => ({
      ...prev,
      numberOfSplitOrders: value,
      selectedItemIds: [],
      createdSplitOrders: [],
      usedItemIds: [],
    }));
  };

  const handleItemSelection = (itemId) => {
    setState((prev) => {
      const selectedItemIds = prev.selectedItemIds.includes(itemId)
        ? prev.selectedItemIds.filter((id) => id !== itemId)
        : [...prev.selectedItemIds, itemId];
      const remainingItemsCount = prev.savedItems.length - prev.usedItemIds.length;
      const remainingSplitOrders = prev.numberOfSplitOrders - prev.createdSplitOrders.length;
      const maxItemsPerOrder =
        remainingSplitOrders > 1
          ? remainingItemsCount - (remainingSplitOrders - 1)
          : remainingItemsCount;

      if (selectedItemIds.length > maxItemsPerOrder) {
        toast.error(`Cannot select more than ${maxItemsPerOrder} items.`);
        return prev;
      }
      return { ...prev, selectedItemIds };
    });
  };

  const isGenerateDisabled = () => {
    if (!state.numberOfSplitOrders || state.woType !== "Split") return true;
    if (state.createdSplitOrders.length >= state.numberOfSplitOrders) return true;
    if (state.selectedItemIds.length === 0) return true;
    const remainingItemsCount = state.savedItems.length - state.usedItemIds.length;
    const remainingSplitOrders = state.numberOfSplitOrders - state.createdSplitOrders.length;
    const maxItemsPerOrder =
      remainingSplitOrders > 1
        ? remainingItemsCount - (remainingSplitOrders - 1)
        : remainingItemsCount;

    if (remainingSplitOrders > 1 && state.selectedItemIds.length > maxItemsPerOrder) return true;
    if (remainingSplitOrders === 1 && state.selectedItemIds.length !== remainingItemsCount) return true;
    if (state.selectedItemIds.some((id) => state.usedItemIds.includes(id))) return true;
    return false;
  };

  const handleGenerateSplitOrder = () => {
    const selectedItems = state.savedItems
      .filter((item) => state.selectedItemIds.includes(item.id))
      .map((item) => ({ ...item }));
    if (!selectedItems.length) {
      toast.error("No valid items selected.");
      return;
    }

    setState((prev) => ({
      ...prev,
      createdSplitOrders: [
        ...prev.createdSplitOrders,
        { items: selectedItems },
      ],
      usedItemIds: [...prev.usedItemIds, ...prev.selectedItemIds],
      selectedItemIds: [],
    }));
    toast.success(`Split Work Order ${state.createdSplitOrders.length + 1} generated successfully!`);
  };

  const handleWOSubmit = async () => {
    if (!state.assignedTo && state.woType === "Single") {
      toast.error("Please select a technician for Assigned To.");
      return;
    }
    const workOrderSeries = state.series.find((s) => s.series_name === "Work Order");
    if (!workOrderSeries) {
      toast.error("Work Order series not found.");
      return;
    }
    try {
      const basePayload = {
        purchase_order: state.selectedPO.id,
        quotation: state.selectedPO.quotation,
        status: "Submitted",
        date_received: state.dateReceived,
        expected_completion_date: state.expectedCompletionDate,
        onsite_or_lab: state.onsiteOrLab,
        range: state.range,
        serial_number: state.serialNumber,
        site_location: state.site_location,
        remarks: state.remarks,
        assigned_to: state.assignedTo ? parseInt(state.assignedTo) : null,
        items: [],
      };

      if (state.assignedTo && !state.technicians.some((t) => t.id === parseInt(state.assignedTo))) {
        toast.error("Selected technician is invalid. Please select a valid technician.");
        return;
      }

      let responses = [];
      if (state.woType === "Single") {
        basePayload.items = state.savedItems.map((item) => ({
          item: item.item,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
        }));
        const response = await apiClient.post("work-orders/", basePayload);
        responses.push(response.data);
      } else if (state.woType === "Split") {
        if (state.createdSplitOrders.length !== state.numberOfSplitOrders) {
          toast.error("Please create exactly the specified number of split orders.");
          return;
        }
        if (state.usedItemIds.length !== state.savedItems.length) {
          toast.error("All items must be assigned to split orders.");
          return;
        }
        for (const order of state.createdSplitOrders) {
          basePayload.items = order.items.map((item) => ({
            item: item.item,
            quantity: item.quantity,
            unit: item.unit,
            unit_price: item.unit_price,
          }));
          const response = await apiClient.post("work-orders/", basePayload);
          responses.push(response.data);
        }
      }

      toast.success("Work Order(s) created successfully");

      const updatedWorkOrderStatusMap = { ...state.workOrderStatusMap };
      responses.forEach((response) => {
        updatedWorkOrderStatusMap[state.selectedPO.id] = [
          ...(updatedWorkOrderStatusMap[state.selectedPO.id] || []),
          { id: response.id, status: "Submitted" },
        ];
      });

      setState((prev) => ({
        ...prev,
        workOrderStatusMap: updatedWorkOrderStatusMap,
        isWOModalOpen: false,
        woType: "",
        dateReceived: "",
        expectedCompletionDate: "",
        onsiteOrLab: "",
        range: "",
        serialNumber: "",
        site_location: "",
        remarks: "",
        assignedTo: "",
        numberOfSplitOrders: "",
        selectedItemIds: [],
        savedItems: [],
        createdSplitOrders: [],
        usedItemIds: [],
      }));

      await fetchData();
    } catch (error) {
      console.error("Error creating work order:", {
        message: error.message,
        response: error.response?.data || "No response data",
        status: error.response?.status,
      });
      toast.error("Failed to create Work Order. Check console for details.");
    }
  };

  const handleUpdateStatus = async (poId, status) => {
    try {
      const response = await apiClient.patch(`/purchase-orders/${poId}/update_status/`, { status });
      setState((prev) => {
        const updatedPOs = prev.purchaseOrders.map((po) =>
          po.id === poId ? { ...po, status: response.data.status } : po
        );
        return { ...prev, purchaseOrders: updatedPOs };
      });
      toast.success("Purchase Order status updated successfully.");
    } catch (error) {
      console.error("Error updating purchase order status:", error.response?.data || error);
      toast.error("Failed to update Purchase Order status.");
    }
  };

  const handlePrint = () => {
    const po = state.selectedPO;
    const quotation = state.quotations.find((q) => q.id === po.quotation);
    const salesPersonName = quotation?.assigned_sales_person_name || "N/A";
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head><title>Work Order for PO ${po.id}</title></head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>Work Order Details</h1>
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 1.25rem; font-weight: 600;">Purchase Order Details</h2>
            <p><strong>PO ID:</strong> ${po.id}</p>
            <p><strong>Client PO Number:</strong> ${po.client_po_number || "N/A"}</p>
            <p><strong>Order Type:</strong> ${po.order_type}</p>
            <p><strong>Created:</strong> ${new Date(po.created_at).toLocaleDateString()}</p>
            <p><strong>PO File:</strong> ${po.po_file ? po.po_file.split("/").pop() || "File Uploaded" : "N/A"}</p>
            <p><strong>Assigned Sales Person:</strong> ${salesPersonName}</p>
          </div>
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 1.25rem; font-weight: 600;">Work Order Details</h2>
            <p><strong>Work Order Type:</strong> ${state.woType || "N/A"}</p>
            <p><strong>Date Received:</strong> ${state.dateReceived ? new Date(state.dateReceived).toLocaleDateString() : "N/A"}</p>
            <p><strong>Expected Completion Date:</strong> ${state.expectedCompletionDate ? new Date(state.expectedCompletionDate).toLocaleDateString() : "N/A"}</p>
            <p><strong>Onsite or Lab:</strong> ${state.onsiteOrLab || "N/A"}</p>
            <p><strong>Range:</strong> ${state.range || "N/A"}</p>
            <p><strong>Serial Number:</strong> ${state.serialNumber || "N/A"}</p>
            <p><strong>Site Location:</strong> ${state.site_location || "N/A"}</p>
            <p><strong>Remarks:</strong> ${state.remarks || "N/A"}</p>
            <p><strong>Assigned To:</strong> ${state.technicians.find((t) => t.id === parseInt(state.assignedTo))?.name || "N/A"}</p>
          </div>
          <div>
            <h2 style="font-size: 1.25rem; font-weight: 600;">Items</h2>
            <table border="1" style="width: 100%; border-collapse: collapse;">
              <tr style="background-color: #f2f2f2;">
                <th style="padding: 8px; text-align: left;">Item</th>
                <th style="padding: 8px; text-align: left;">Quantity</th>
                <th style="padding: 8px; text-align: left;">Unit</th>
                <th style="padding: 8px; text-align: left;">Unit Price</th>
                <th style="padding: 8px; text-align: left;">Total Price</th>
              </tr>
              ${state.woType === "Single"
                ? state.savedItems
                    .map(
                      (item) => `
                        <tr>
                          <td style="padding: 8px;">${item.name || "N/A"}</td>
                          <td style="padding: 8px; text-align: center;">${item.quantity || "N/A"}</td>
                          <td style="padding: 8px; text-align: left;">${state.units.find((u) => u.id === item.unit)?.name || "N/A"}</td>
                          <td style="padding: 8px; text-align: right;">${item.unit_price ? Number(item.unit_price).toFixed(2) : "N/A"}</td>
                          <td style="padding: 8px; text-align: right;">${item.quantity && item.unit_price ? Number(item.quantity * item.unit_price).toFixed(2) : "0.00"}</td>
                        </tr>
                      `
                    )
                    .join("")
                : state.createdSplitOrders
                    .map(
                      (order, index) => `
                        <tr>
                          <td colspan="5" style="padding: 8px; font-weight: bold;">Split Order ${index + 1}</td>
                        </tr>
                        ${order.items
                          .map(
                            (item) => `
                              <tr>
                                <td style="padding: 8px;">${item.name || "N/A"}</td>
                                <td style="padding: 8px; text-align: center;">${item.quantity || "N/A"}</td>
                                <td style="padding: 8px; text-align: left;">${state.units.find((u) => u.id === item.unit)?.name || "N/A"}</td>
                                <td style="padding: 8px; text-align: right;">${item.unit_price ? Number(item.unit_price).toFixed(2) : "N/A"}</td>
                                <td style="padding: 8px; text-align: right;">${item.quantity && item.unit_price ? Number(item.quantity * item.unit_price).toFixed(2) : "0.00"}</td>
                              </tr>
                            `
                          )
                          .join("")}
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

  const handleDeletePO = async (poId) => {
    if (window.confirm("Are you sure you want to delete this purchase order?")) {
      try {
        await apiClient.delete(`purchase-orders/${poId}/`);
        toast.success("Purchase order deleted successfully.");
        fetchData();
      } catch (error) {
        console.error("Error deleting purchase order:", error);
        toast.error("Failed to delete purchase order.");
      }
    }
  };

  const filteredPOs = state.purchaseOrders
    .filter(
      (po) =>
        (po.client_po_number || "").toLowerCase().includes(state.searchTerm.toLowerCase()) ||
        (po.id || "").toString().includes(state.searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (state.sortBy === "created_at") {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (state.sortBy === "client_po_number") {
        return (a.client_po_number || "").localeCompare(b.client_po_number || "");
      }
      return 0;
    });

  const totalPages = Math.ceil(filteredPOs.length / state.itemsPerPage);
  const startIndex = (state.currentPage - 1) * state.itemsPerPage;
  const currentPOs = filteredPOs.slice(startIndex, startIndex + state.itemsPerPage);

  const pageGroupSize = 3;
  const currentGroup = Math.floor((state.currentPage - 1) / pageGroupSize);
  const startPage = currentGroup * pageGroupSize + 1;
  const endPage = Math.min(startPage + pageGroupSize - 1, totalPages);
  const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

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

  const getAssignedSalesPersonName = (po) => {
    const quotation = state.quotations.find((q) => q.id === po.quotation);
    return quotation?.assigned_sales_person_name || "N/A";
  };

  const getStatusDisplay = (poId) => {
    const po = state.purchaseOrders.find((p) => p.id === poId);
    return po ? po.status : "Collection Pending";
  };

  const canConvertToWorkOrder = (poId) => {
    const po = state.purchaseOrders.find((p) => p.id === poId);
    return po && po.status === "Collected";
  };

  const remainingItems = state.savedItems.filter((item) => !state.usedItemIds.includes(item.id));

  return (
    <div className="mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Initiate Work Order</h1>
      <div className="bg-white p-4 space-y-4 rounded-md shadow w-full">
        <div className="mb-6 flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Purchase Orders</label>
            <InputField
              type="text"
              placeholder="Search by PO number or ID..."
              value={state.searchTerm}
              onChange={(e) => setState((prev) => ({ ...prev, searchTerm: e.target.value }))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={state.sortBy}
              onChange={(e) => setState((prev) => ({ ...prev, sortBy: e.target.value }))}
              className="p-2 border rounded focus:outline-indigo-500"
            >
              <option value="created_at">Creation Date</option>
              <option value="client_po_number">PO Number</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Sl No</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Created At</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">PO Number</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Assigned To</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Current Status</th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentPOs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="border p-2 text-center text-gray-500 whitespace-nowrap">No purchase orders found.</td>
                </tr>
              ) : (
                currentPOs.map((po, index) => (
                  <tr key={po.id} className="border hover:bg-gray-50">
                    <td className="border p-2 whitespace-nowrap">{startIndex + index + 1}</td>
                    <td className="border p-2 whitespace-nowrap">{new Date(po.created_at).toLocaleDateString()}</td>
                    <td className="border p-2 whitespace-nowrap">{po.client_po_number || "N/A"}</td>
                    <td className="border p-2 whitespace-nowrap">{getAssignedSalesPersonName(po)}</td>
                    <td className="border p-2 whitespace-nowrap">
                      <select
                        value={po.status || "Collection Pending"}
                        onChange={(e) => handleUpdateStatus(po.id, e.target.value)}
                        className="p-1 border rounded focus:outline-indigo-500 w-full"
                      >
                        <option value="Collection Pending">Collection Pending</option>
                        <option value="Collected">Collected</option>
                      </select>
                    </td>
                    <td className="border p-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleViewPO(po)}
                          className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                        >
                          View PO
                        </Button>
                        <Button
                          onClick={() => handleConvertToWO(po)}
                          className="px-3 py-1 text-white rounded-md text-sm bg-blue-600 hover:bg-blue-700"
                          disabled={!canConvertToWorkOrder(po.id)}
                        >
                          Convert to Work Order
                        </Button>
                        <Button
                          onClick={() => handleDeletePO(po.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                        >
                          Delete
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
              className={`px-3 py-1 rounded-md min-w-fit ${state.currentPage === page ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
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
        onClose={() => setState((prev) => ({ ...prev, isModalOpen: false, selectedPO: null }))}
        title={`Purchase Order Details - ID ${state.selectedPO?.id || "N/A"}`}
      >
        {state.selectedPO && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-black">Purchase Order Details</h3>
              <p><strong>PO ID:</strong> {state.selectedPO.id}</p>
              <p><strong>Client PO Number:</strong> {state.selectedPO.client_po_number || "N/A"}</p>
              <p><strong>Order Type:</strong> {state.selectedPO.order_type}</p>
              <p><strong>Created:</strong> {new Date(state.selectedPO.created_at).toLocaleDateString()}</p>
              <p><strong>PO File:</strong> {state.selectedPO.po_file ? state.selectedPO.po_file.split("/").pop() || "File Uploaded" : "N/A"}</p>
              <p><strong>Assigned Sales Person:</strong> {getAssignedSalesPersonName(state.selectedPO)}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-black">Items</h3>
              {state.selectedPO.items && state.selectedPO.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Item</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Quantity</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Unit</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Unit Price</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Total Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.selectedPO.items.map((item) => (
                        <tr key={item.id} className="border">
                          <td className="border p-2 whitespace-nowrap">{state.itemsList.find((i) => i.id === item.item)?.name || "N/A"}</td>
                          <td className="border p-2 whitespace-nowrap">{item.quantity || "N/A"}</td>
                          <td className="border p-2 whitespace-nowrap">{state.units.find((u) => u.id === item.unit)?.name || "N/A"}</td>
                          <td className="border p-2 whitespace-nowrap">{item.unit_price ? Number(item.unit_price).toFixed(2) : "N/A"}</td>
                          <td className="border p-2 whitespace-nowrap">{item.quantity && item.unit_price ? Number(item.quantity * item.unit_price).toFixed(2) : "0.00"}</td>
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
      <Modal
        isOpen={state.isWOTypeModalOpen}
        onClose={() => setState((prev) => ({ ...prev, isWOTypeModalOpen: false, selectedPO: null }))}
        title="Convert to Work Order"
      >
        <div className="space-y-4">
          <p className="text-gray-700">Select an option to convert Purchase Order to a Work Order:</p>
          <div className="flex justify-center gap-4">
            <Button
              onClick={() => handleWOTypeOption("Single")}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Single Order
            </Button>
            <Button
              onClick={() => handleWOTypeOption("Split")}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Split Order
            </Button>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => setState((prev) => ({ ...prev, isWOTypeModalOpen: false, selectedPO: null }))}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={state.isWOModalOpen}
        onClose={() => setState((prev) => ({ ...prev, isWOModalOpen: false, selectedPO: null }))}
        title="Create Work Order"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Work Order Type</label>
            <InputField
              type="text"
              value={state.woType}
              onChange={() => {}}
              disabled
              className="w-full p-2 border rounded bg-gray-100"
            />
          </div>
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
              value={state.site_location}
              onChange={(e) => setState((prev) => ({ ...prev, site_location: e.target.value }))}
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
          {state.woType === "Split" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Split Orders</label>
              <InputField
                type="number"
                value={state.numberOfSplitOrders}
                onChange={handleNumberOfSplitOrdersChange}
                className="w-full"
                min="1"
                max={state.savedItems.length}
                placeholder="Enter number of split orders"
              />
            </div>
          )}
          <div>
            <h3 className="text-lg font-medium text-black mb-2">Items</h3>
            {state.savedItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Item</th>
                      <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Quantity</th>
                      <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Unit</th>
                      <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Unit Price</th>
                      <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Total Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.savedItems.map((item) => (
                      <tr key={item.id} className="border">
                        <td className="border p-2 whitespace-nowrap">{item.name || "N/A"}</td>
                        <td className="border p-2 whitespace-nowrap">{item.quantity || "N/A"}</td>
                        <td className="border p-2 whitespace-nowrap">{state.units.find((u) => u.id === item.unit)?.name || "N/A"}</td>
                        <td className="border p-2 whitespace-nowrap">{item.unit_price ? Number(item.unit_price).toFixed(2) : "N/A"}</td>
                        <td className="border p-2 whitespace-nowrap">{item.quantity && item.unit_price ? Number(item.quantity * item.unit_price).toFixed(2) : "0.00"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No items available.</p>
            )}
            {state.woType === "Split" && state.numberOfSplitOrders && (
              <div className="mt-4">
                {state.createdSplitOrders.length > 0 && (
                  <div>
                    <h3 className="text-md font-semibold mb-2 text-black">Created Split Orders</h3>
                    {state.createdSplitOrders.map((order, index) => (
                      <div key={index} className="mb-4 p-2 border rounded">
                        <h4 className="text-md font-medium">Split Order {index + 1}</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-gray-200">
                                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Item</th>
                                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Quantity</th>
                                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Unit</th>
                                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Unit Price</th>
                                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Total Price</th>
                              </tr>
                            </thead>
                            <tbody>
                              {order.items.map((item) => (
                                <tr key={item.id} className="border">
                                  <td className="border p-2 whitespace-nowrap">{item.name || "N/A"}</td>
                                  <td className="border p-2 whitespace-nowrap">{item.quantity || "N/A"}</td>
                                  <td className="border p-2 whitespace-nowrap">{state.units.find((u) => u.id === item.unit)?.name || "N/A"}</td>
                                  <td className="border p-2 whitespace-nowrap">{item.unit_price ? Number(item.unit_price).toFixed(2) : "N/A"}</td>
                                  <td className="border p-2 whitespace-nowrap">{item.quantity && item.unit_price ? Number(item.quantity * item.unit_price).toFixed(2) : "0.00"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {state.createdSplitOrders.length < state.numberOfSplitOrders && (
                  <div>
                    <h4 className="text-md font-medium mb-2">Select Items for Split Order {state.createdSplitOrders.length + 1}</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-200">
                            <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Select</th>
                            <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Item</th>
                            <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Quantity</th>
                            <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Unit</th>
                            <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Unit Price</th>
                            <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Total Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {remainingItems.map((item) => (
                            <tr key={item.id} className="border">
                              <td className="border p-2 whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={state.selectedItemIds.includes(item.id)}
                                  onChange={() => handleItemSelection(item.id)}
                                  disabled={state.usedItemIds.includes(item.id)}
                                />
                              </td>
                              <td className="border p-2 whitespace-nowrap">{item.name || "N/A"}</td>
                              <td className="border p-2 whitespace-nowrap">{item.quantity || "N/A"}</td>
                              <td className="border p-2 whitespace-nowrap">{state.units.find((u) => u.id === item.unit)?.name || "N/A"}</td>
                              <td className="border p-2 whitespace-nowrap">{item.unit_price ? Number(item.unit_price).toFixed(2) : "N/A"}</td>
                              <td className="border p-2 whitespace-nowrap">{item.quantity && item.unit_price ? Number(item.quantity * item.unit_price).toFixed(2) : "0.00"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Button
                      onClick={handleGenerateSplitOrder}
                      disabled={isGenerateDisabled()}
                      className={`px-4 py-2 mt-2 rounded-md ${isGenerateDisabled() ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"}`}
                    >
                      Generate Split Order
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => setState((prev) => ({ ...prev, isWOModalOpen: false, selectedPO: null }))}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleWOSubmit}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Submit
            </Button>
            <Button
              onClick={handlePrint}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Print
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ListPurchaseOrders;