import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import apiClient from "../../../helpers/apiClient";
import InputField from "../../../components/InputField";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";

const ListPurchaseOrders = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState({
    purchaseOrders: [],
    technicians: [],
    itemsList: [],
    units: [],
    quotations: [],
    series: [],
    channels: [],
    searchTerm: "",
    sortBy: "created_at",
    currentPage: 1,
    itemsPerPage: 20,
    isModalOpen: false,
    isWOModalOpen: false,
    selectedPO: null,
    woType: "",
    dateReceived: "",
    expectedCompletionDate: "",
    onsiteOrLab: "",
    site_location: "",
    remarks: "",
    numberOfSplitOrders: "",
    selectedItemIds: [],
    savedItems: [],
    createdSplitOrders: [],
    usedItemIds: [],
    workOrderStatusMap: {},
    splitOrderAssignedTo: "",
    singleOrderAssignedTo: "",
    isSubmitting: false,
  });

  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
  const [seriesError, setSeriesError] = useState("");

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
        poRes,
        techRes,
        itemsRes,
        unitsRes,
        quotationsRes,
        seriesRes,
        channelsRes,
      ] = await Promise.all([
        apiClient.get("purchase-orders/"),
        apiClient.get("technicians/"),
        apiClient.get("items/"),
        apiClient.get("units/"),
        apiClient.get("quotations/"),
        apiClient.get("series/"),
        apiClient.get("channels/"),
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
            : [];
      });
      setState((prev) => ({
        ...prev,
        purchaseOrders: updatedPurchaseOrders,
        technicians: techRes.data || [],
        itemsList: itemsRes.data || [],
        units: unitsRes.data || [],
        quotations: quotationsRes.data || [],
        series: seriesRes.data || [],
        channels: channelsRes.data || [],
        workOrderStatusMap,
      }));
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load purchase orders.");
    }
  };

  useEffect(() => {
    fetchData();
  }, [location.pathname]);

  const hasWorkOrder = (poId) => {
    return state.workOrderStatusMap[poId]?.length > 0;
  };

  const handleConvertToWO = (po) => {
    const savedItems = po.items.map((item) => ({
      id: item.id,
      item_id: item.item,
      name: state.itemsList.find((i) => i.id === item.item)?.name || "N/A",
      quantity: item.quantity || 0,
      unit: item.unit,
      unit_price: item.unit_price,
      remaining_quantity: item.quantity || 0,
      assigned_quantity: "",
      assigned_to: "",
    }));
    setState((prev) => ({
      ...prev,
      isWOModalOpen: true,
      selectedPO: po,
      savedItems,
      woType: "",
      numberOfSplitOrders: "",
      selectedItemIds: [],
      createdSplitOrders: [],
      usedItemIds: [],
      splitOrderAssignedTo: "",
      singleOrderAssignedTo: "",
    }));
    setSeriesError("");
  };

  const handleViewPO = (po) => {
    setState((prev) => ({
      ...prev,
      isModalOpen: true,
      selectedPO: po,
    }));
  };

  const handleNumberOfSplitOrdersChange = (e) => {
    const value = e.target.value === "" ? "" : parseInt(e.target.value, 10);
    const totalQuantity = state.savedItems.reduce(
      (total, item) => total + (item.quantity || 0),
      0
    );

    if (value && value > totalQuantity) {
      toast.error(
        `Number of split orders cannot exceed the total quantity (${totalQuantity}).`
      );
      return;
    }

    if (value && value < 1) {
      toast.error("Number of split orders must be at least 1.");
      return;
    }

    setState((prev) => ({
      ...prev,
      numberOfSplitOrders: value,
      selectedItemIds: [],
      createdSplitOrders: [],
      usedItemIds: [],
      savedItems: prev.savedItems.map((item) => ({
        ...item,
        assigned_quantity: "",
        remaining_quantity: item.quantity || 0,
      })),
      splitOrderAssignedTo: "",
    }));
  };

  const calculateTotalQuantity = () => {
    return state.savedItems.reduce(
      (total, item) => total + (item.quantity || 0),
      0
    );
  };

  const handleItemSelection = (itemId) => {
    setState((prev) => {
      const selectedItemIds = prev.selectedItemIds.includes(itemId)
        ? prev.selectedItemIds.filter((id) => id !== itemId)
        : [...prev.selectedItemIds, itemId];
      return { ...prev, selectedItemIds };
    });
  };

  const handleAssignedQuantityChange = (itemId, value) => {
    const assignedQuantity = value === "" ? "" : parseInt(value, 10);
    setState((prev) => {
      const updatedItems = prev.savedItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              assigned_quantity: assignedQuantity,
            }
          : item
      );
      const selectedItem = updatedItems.find((item) => item.id === itemId);
      if (
        assignedQuantity !== "" &&
        (isNaN(assignedQuantity) ||
          assignedQuantity < 0 ||
          assignedQuantity > selectedItem.remaining_quantity)
      ) {
        toast.error(
          `Assigned quantity must be between 0 and ${selectedItem.remaining_quantity}.`
        );
        return prev;
      }
      return { ...prev, savedItems: updatedItems };
    });
  };

  const handleAssignedToChange = (itemId, value) => {
    setState((prev) => ({
      ...prev,
      savedItems: prev.savedItems.map((item) =>
        item.id === itemId ? { ...item, assigned_to: value } : item
      ),
    }));
  };

  const handleSplitOrderAssignedToChange = (value) => {
    setState((prev) => ({ ...prev, splitOrderAssignedTo: value }));
  };

  const handleSingleOrderAssignedToChange = (value) => {
    setState((prev) => ({
      ...prev,
      singleOrderAssignedTo: value,
      savedItems: prev.savedItems.map((item) => ({
        ...item,
        assigned_to: value,
      })),
    }));
  };

  const isGenerateDisabled = () => {
    if (!state.numberOfSplitOrders || state.woType !== "Split") return true;
    if (state.createdSplitOrders.length >= state.numberOfSplitOrders)
      return true;
    if (state.selectedItemIds.length === 0) return true;
    if (
      !state.splitOrderAssignedTo ||
      !state.technicians.some(
        (t) => t.id === parseInt(state.splitOrderAssignedTo)
      )
    ) {
      return true;
    }
    const selectedItems = state.savedItems.filter((item) =>
      state.selectedItemIds.includes(item.id)
    );
    const allHaveValidAssignedQuantity = selectedItems.every(
      (item) =>
        item.assigned_quantity !== "" &&
        !isNaN(item.assigned_quantity) &&
        item.assigned_quantity > 0 &&
        item.assigned_quantity <= item.remaining_quantity
    );
    if (!allHaveValidAssignedQuantity) return true;
    const isLastSplitOrder =
      state.createdSplitOrders.length + 1 === state.numberOfSplitOrders;
    if (isLastSplitOrder) {
      const updatedItems = state.savedItems.map((item) =>
        selectedItems.find((selected) => selected.id === item.id)
          ? {
              ...item,
              remaining_quantity:
                item.remaining_quantity - (item.assigned_quantity || 0),
            }
          : item
      );
      const allItemsFullyAssigned = updatedItems.every(
        (item) => item.remaining_quantity === 0
      );
      if (!allItemsFullyAssigned) return true;
    }
    return false;
  };

  const isSubmitDisabled = () => {
    if (!state.woType) return true;
    if (state.woType === "Single") {
      return (
        !state.singleOrderAssignedTo ||
        !state.technicians.some(
          (t) => t.id === parseInt(state.singleOrderAssignedTo)
        )
      );
    }
    if (state.woType === "Split") {
      if (state.createdSplitOrders.length !== state.numberOfSplitOrders)
        return true;
      const allItemsAssigned = state.savedItems.every(
        (item) => item.remaining_quantity === 0
      );
      if (!allItemsAssigned) return true;
    }
    return false;
  };

  const handleGenerateSplitOrder = () => {
    const selectedItems = state.savedItems
      .filter((item) => state.selectedItemIds.includes(item.id))
      .map((item) => ({
        ...item,
        quantity: item.assigned_quantity,
        assigned_to: state.splitOrderAssignedTo,
      }));
    if (!selectedItems.length) {
      toast.error("No valid items selected.");
      return;
    }
    setState((prev) => {
      const updatedItems = prev.savedItems.map((item) =>
        prev.selectedItemIds.includes(item.id)
          ? {
              ...item,
              remaining_quantity:
                item.remaining_quantity - (item.assigned_quantity || 0),
              assigned_quantity: "",
            }
          : item
      );
      return {
        ...prev,
        createdSplitOrders: [
          ...prev.createdSplitOrders,
          { items: selectedItems },
        ],
        usedItemIds: [
          ...prev.usedItemIds,
          ...prev.selectedItemIds.filter((id) =>
            updatedItems.find(
              (item) => item.id === id && item.remaining_quantity === 0
            )
          ),
        ],
        selectedItemIds: [],
        savedItems: updatedItems,
        splitOrderAssignedTo: "",
      };
    });
    toast.success(
      `Split Work Order ${
        state.createdSplitOrders.length + 1
      } generated successfully!`
    );
  };

  const handleWOSubmit = async () => {
    setState((prev) => ({ ...prev, isSubmitting: true }));
    const workOrderSeries = state.series.find(
      (s) => s.series_name === "Work Order"
    );
    if (!workOrderSeries) {
      setSeriesError(
        "The 'Work Order' series is not configured. Please add it in the Additional Settings section to convert this purchase order into a work order."
      );
      setState((prev) => ({ ...prev, isSubmitting: false }));
      toast.warn(
        "The 'Work Order' series is missing. Configure it in Additional Settings."
      );
      return;
    }
    setSeriesError("");
    try {
      const basePayload = {
        purchase_order: state.selectedPO.id,
        quotation: state.selectedPO.quotation,
        status: "Submitted",
        date_received: state.dateReceived,
        expected_completion_date: state.expectedCompletionDate,
        onsite_or_lab: state.onsiteOrLab,
        site_location: state.site_location,
        remarks: state.remarks,
        items: [],
        wo_type: state.woType,
      };
      let responses = [];
      if (state.woType === "Single") {
        if (
          !state.singleOrderAssignedTo ||
          !state.technicians.some(
            (t) => t.id === parseInt(state.singleOrderAssignedTo)
          )
        ) {
          toast.error("Please select a valid technician for all items.");
          setState((prev) => ({ ...prev, isSubmitting: false }));
          return;
        }
        basePayload.items = state.savedItems.map((item) => ({
          item: item.item_id,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          assigned_to: parseInt(state.singleOrderAssignedTo),
        }));
        const response = await apiClient.post("work-orders/", basePayload);
        responses.push(response.data);
      } else if (state.woType === "Split") {
        if (state.createdSplitOrders.length !== state.numberOfSplitOrders) {
          toast.error(
            "Please create exactly the specified number of split orders."
          );
          setState((prev) => ({ ...prev, isSubmitting: false }));
          return;
        }
        if (state.savedItems.some((item) => item.remaining_quantity !== 0)) {
          toast.error("All items must be fully assigned to split orders.");
          setState((prev) => ({ ...prev, isSubmitting: false }));
          return;
        }
        for (const order of state.createdSplitOrders) {
          const allHaveAssignedTo = order.items.every(
            (item) =>
              item.assigned_to !== "" &&
              state.technicians.some((t) => t.id === parseInt(item.assigned_to))
          );
          if (!allHaveAssignedTo) {
            toast.error(
              "All items in split orders must be assigned to a valid technician."
            );
            setState((prev) => ({ ...prev, isSubmitting: false }));
            return;
          }
          basePayload.items = order.items.map((item) => ({
            item: item.item_id,
            quantity: item.quantity,
            unit: item.unit,
            unit_price: item.unit_price,
            assigned_to: item.assigned_to ? parseInt(item.assigned_to) : null,
          }));
          const response = await apiClient.post("work-orders/", basePayload);
          responses.push(response.data);
        }
      }
      await apiClient.patch(
        `/purchase-orders/${state.selectedPO.id}/update_status/`,
        {
          status: "Completed",
        }
      );
      toast.success(
        "Work Order(s) created successfully and Purchase Order marked as Completed."
      );
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
        site_location: "",
        remarks: "",
        numberOfSplitOrders: "",
        selectedItemIds: [],
        savedItems: [],
        createdSplitOrders: [],
        usedItemIds: [],
        splitOrderAssignedTo: "",
        singleOrderAssignedTo: "",
        isSubmitting: false,
      }));
      await fetchData();
    } catch (error) {
      console.error("Error creating work order:", {
        message: error.message,
        response: error.response?.data || "No response data",
        status: error.response?.status,
      });
      if (
        error.response?.data?.items?.every(
          (item) => item.range?.[0] === "Range is required for each item."
        )
      ) {
        toast.error(
          "Work Order creation succeeded, but range details are required. Please update them in the Edit Work Order section."
        );
        const updatedWorkOrderStatusMap = { ...state.workOrderStatusMap };
        const responses = [{ id: Date.now() }];
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
          site_location: "",
          remarks: "",
          numberOfSplitOrders: "",
          selectedItemIds: [],
          savedItems: [],
          createdSplitOrders: [],
          usedItemIds: [],
          splitOrderAssignedTo: "",
          singleOrderAssignedTo: "",
          isSubmitting: false,
        }));
        await fetchData();
      } else {
        toast.error("Failed to create Work Order. Check console for details.");
        setState((prev) => ({ ...prev, isSubmitting: false }));
      }
    }
  };

  const handleDeletePO = async (poId) => {
    if (
      window.confirm("Are you sure you want to delete this purchase order?")
    ) {
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

  const handleUpdateStatus = async (poId, status) => {
    try {
      await apiClient.patch(`/purchase-orders/${poId}/update_status/`, {
        status,
      });
      toast.success("Purchase order status updated successfully.");
      await fetchData();
    } catch (error) {
      console.error("Error updating purchase order status:", error);
      toast.error("Failed to update purchase order status.");
    }
  };

    const getQuotationDetails = (po) => {
    const quotation = state.quotations.find((q) => q.id === po.quotation);
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
    };
  };

  const filteredPOs = state.purchaseOrders
    .filter(
      (po) =>
        (po.client_po_number || "")
          .toLowerCase()
          .includes(state.searchTerm.toLowerCase()) ||
        (po.id || "").toString().includes(state.searchTerm.toLowerCase()) ||
        getQuotationDetails(po)
          .company_name.toLowerCase()
          .includes(state.searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (state.sortBy === "created_at") {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (state.sortBy === "client_po_number") {
        return (a.client_po_number || "").localeCompare(
          b.client_po_number || ""
        );
      } else if (state.sortBy === "company_name") {
        return getQuotationDetails(a).company_name.localeCompare(
          getQuotationDetails(b).company_name
        );
      }
      return 0;
    });

  const totalPages = Math.ceil(filteredPOs.length / state.itemsPerPage);
  const startIndex = (state.currentPage - 1) * state.itemsPerPage;
  const currentPOs = filteredPOs.slice(
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

  const getAssignedSalesPersonName = (po) => {
    const quotation = state.quotations.find((q) => q.id === po.quotation);
    return quotation?.assigned_sales_person_name || "N/A";
  };

  const getStatusDisplay = (poId) => {
    const po = state.purchaseOrders.find((p) => p.id === poId);
    return po ? po.status : "Collection Pending";
  };


  const remainingItems = state.savedItems.filter(
    (item) => !state.usedItemIds.includes(item.id)
  );

  return (
    <div className="mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Initiate Work Order</h1>
      <div className="bg-white p-4 space-y-4 rounded-md shadow w-full">
        <div className="mb-6 flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Purchase Orders
            </label>
            <InputField
              type="text"
              placeholder="Search by PO number, ID, or Company Name..."
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
              <option value="client_po_number">PO Number</option>
              <option value="company_name">Company Name</option>
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
                  Purchase Order Series Number
                </th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">
                  PO Number
                </th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">
                  Company Name
                </th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">
                  Assigned To
                </th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">
                  Current Status
                </th>
                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {currentPOs.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="border p-2 text-center text-gray-500 whitespace-nowrap"
                  >
                    No purchase orders found.
                  </td>
                </tr>
              ) : (
                currentPOs.map((po, index) => (
                  <tr key={po.id} className="border hover:bg-gray-50">
                    <td className="border p-2 whitespace-nowrap">
                      {startIndex + index + 1}
                    </td>
                    <td className="border p-2 whitespace-nowrap">
                      {new Date(po.created_at).toLocaleDateString()}
                    </td>
                    <td className="border p-2 whitespace-nowrap">
                      {po.series_number || "N/A"}
                    </td>
                    <td className="border p-2 whitespace-nowrap">
                      {po.client_po_number || "Nil"}
                    </td>
                    <td className="border p-2 whitespace-nowrap">
                      {getQuotationDetails(po).company_name}
                    </td>
                    <td className="border p-2 whitespace-nowrap">
                      {getAssignedSalesPersonName(po)}
                    </td>
                    <td className="border p-2 whitespace-nowrap">
                      <select
                        disabled={!hasPermission("purchase_orders", "edit")}
                        value={po.status || "Collection Pending"}
                        onChange={(e) =>
                          handleUpdateStatus(po.id, e.target.value)
                        }
                        className="p-1 border rounded focus:outline-indigo-500 w-full"
                      >
                        <option value="Collection Pending">
                          Collection Pending
                        </option>
                        <option value="Collected">Collected</option>
                        <option value="Completed">Completed</option>
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
                          disabled={hasWorkOrder(po.id)}
                          className={`px-3 py-1 text-white rounded-md text-sm ${
                            hasWorkOrder(po.id)
                              ? "bg-gray-300 cursor-not-allowed"
                              : "bg-blue-600 hover:bg-blue-700"
                          }`}
                        >
                          Convert to Work Order
                        </Button>
                        <Button
                          onClick={() => handleDeletePO(po.id)}
                          disabled={!hasPermission("purchase_orders", "delete")}
                          className={`px-3 py-1 rounded-md text-sm ${
                            !hasPermission("purchase_orders", "delete")
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : "bg-red-600 text-white hover:bg-red-700"
                          }`}
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
            selectedPO: null,
          }))
        }
        title={`Purchase Order Details - ID ${state.selectedPO?.id || "N/A"}`}
      >
        {state.selectedPO && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-black">
                Company Details
              </h3>
              <p>
                <strong>Series Number:</strong>{" "}
                {getQuotationDetails(state.selectedPO).series_number}
              </p>
              <p>
                <strong>Company Name:</strong>{" "}
                {getQuotationDetails(state.selectedPO).company_name}
              </p>
              <p>
                <strong>Company Address:</strong>{" "}
                {getQuotationDetails(state.selectedPO).company_address}
              </p>
              <p>
                <strong>Company Phone:</strong>{" "}
                {getQuotationDetails(state.selectedPO).company_phone}
              </p>
              <p>
                <strong>Company Email:</strong>{" "}
                {getQuotationDetails(state.selectedPO).company_email}
              </p>
              <p>
                <strong>Channel:</strong>{" "}
                {getQuotationDetails(state.selectedPO).channel}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-black">
                Contact Details
              </h3>
              <p>
                <strong>Contact Name:</strong>{" "}
                {getQuotationDetails(state.selectedPO).contact_name}
              </p>
              <p>
                <strong>Contact Email:</strong>{" "}
                {getQuotationDetails(state.selectedPO).contact_email}
              </p>
              <p>
                <strong>Contact Phone:</strong>{" "}
                {getQuotationDetails(state.selectedPO).contact_phone}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-black">
                Purchase Order Details
              </h3>
              <p>
                <strong>Series Number:</strong>{" "}
                {state.selectedPO.series_number || "N/A"}
              </p>
              <p>
                <strong>Client PO Number:</strong>{" "}
                {state.selectedPO.client_po_number || "Nil"}
              </p>
              <p>
                <strong>Order Type:</strong> {state.selectedPO.order_type}
              </p>
              <p>
                <strong>Created:</strong>{" "}
                {new Date(state.selectedPO.created_at).toLocaleDateString()}
              </p>
              <p>
                <strong>PO File:</strong>{" "}
                {state.selectedPO.po_file ? (
                  <a
                    href={state.selectedPO.po_file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline"
                  >
                    View File
                  </a>
                ) : (
                  "Nil"
                )}
              </p>
              <p>
                <strong>Assigned Sales Person:</strong>{" "}
                {getAssignedSalesPersonName(state.selectedPO)}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-black">
                Purchase Order Items
              </h3>
              {state.selectedPO.items && state.selectedPO.items.length > 0 ? (
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
                          Total Price
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.selectedPO.items.map((item) => (
                        <tr key={item.id} className="border">
                          <td className="border p-2 whitespace-nowrap">
                            {state.itemsList.find((i) => i.id === item.item)
                              ?.name || "N/A"}
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            {item.quantity || "N/A"}
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            {state.units.find((u) => u.id === item.unit)
                              ?.name || "N/A"}
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            SAR{" "}
                            {item.unit_price
                              ? Number(item.unit_price).toFixed(2)
                              : "N/A"}
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            SAR{" "}
                            {item.quantity && item.unit_price
                              ? Number(item.quantity * item.unit_price).toFixed(
                                  2
                                )
                              : "0.00"}
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
      <Modal
        isOpen={state.isWOModalOpen}
        onClose={() =>
          setState((prev) => ({
            ...prev,
            isWOModalOpen: false,
            selectedPO: null,
            singleOrderAssignedTo: "",
          }))
        }
        title="Create Work Order"
      >
        <div className="space-y-4">
          {seriesError && (
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
              role="alert"
            >
              <span className="block sm:inline">{seriesError}</span>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Work Order Type
            </label>
            <select
              value={state.woType}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  woType: e.target.value,
                  singleOrderAssignedTo: "",
                  savedItems: prev.savedItems.map((item) => ({
                    ...item,
                    assigned_to: "",
                  })),
                }))
              }
              className="p-2 border rounded w-full"
            >
              <option value="">Select Work Order Type</option>
              <option value="Single">Single</option>
              <option value="Split">Split</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Received
            </label>
            <InputField
              type="date"
              value={state.dateReceived}
              onChange={(e) =>
                setState((prev) => ({ ...prev, dateReceived: e.target.value }))
              }
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expected Completion Date
            </label>
            <InputField
              type="date"
              value={state.expectedCompletionDate}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  expectedCompletionDate: e.target.value,
                }))
              }
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Onsite or Lab
            </label>
            <select
              value={state.onsiteOrLab}
              onChange={(e) =>
                setState((prev) => ({ ...prev, onsiteOrLab: e.target.value }))
              }
              className="p-2 border rounded w-full"
            >
              <option value="">Select</option>
              <option value="Onsite">Onsite</option>
              <option value="Lab">Lab</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Site Location
            </label>
            <InputField
              type="text"
              value={state.site_location}
              onChange={(e) =>
                setState((prev) => ({ ...prev, site_location: e.target.value }))
              }
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Remarks
            </label>
            <InputField
              type="text"
              value={state.remarks}
              onChange={(e) =>
                setState((prev) => ({ ...prev, remarks: e.target.value }))
              }
              className="w-full"
            />
          </div>
          {state.woType === "Split" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Split Orders
              </label>
              <InputField
                type="number"
                value={state.numberOfSplitOrders}
                onChange={handleNumberOfSplitOrdersChange}
                className="w-full"
                min="1"
                placeholder="Enter number of split orders"
              />
            </div>
          )}
          <div>
            <h3 className="text-lg font-medium text-black mb-2">
              Purchase Order Items
            </h3>
            {state.savedItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">
                        Item
                      </th>
                      <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">
                        Remaining Quantity
                      </th>
                      <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">
                        Unit
                      </th>
                      <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">
                        Unit Price
                      </th>
                      <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">
                        Total Price
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.savedItems.map((item) => (
                      <tr key={item.id} className="border">
                        <td className="border p-2 whitespace-nowrap">
                          {item.name || "N/A"}
                        </td>
                        <td className="border p-2 whitespace-nowrap">
                          {item.remaining_quantity || "0"}
                        </td>
                        <td className="border p-2 whitespace-nowrap">
                          {state.units.find((u) => u.id === item.unit)?.name ||
                            "N/A"}
                        </td>
                        <td className="border p-2 whitespace-nowrap">
                          SAR{" "}
                          {item.unit_price
                            ? Number(item.unit_price).toFixed(2)
                            : "N/A"}
                        </td>
                        <td className="border p-2 whitespace-nowrap">
                          SAR{" "}
                          {item.quantity && item.unit_price
                            ? Number(item.quantity * item.unit_price).toFixed(2)
                            : "0.00"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No items available.</p>
            )}
            {state.woType === "Single" && (
              <div className="mt-4">
                <h4 className="text-md font-medium mb-2">
                  Assign Technician to All Items
                </h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned To
                  </label>
                  <select
                    value={state.singleOrderAssignedTo}
                    onChange={(e) =>
                      handleSingleOrderAssignedToChange(e.target.value)
                    }
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
                <div className="overflow-x-auto mt-4">
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
                          Total Price
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.savedItems.map((item) => (
                        <tr key={item.id} className="border">
                          <td className="border p-2 whitespace-nowrap">
                            {item.name || "N/A"}
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            {item.quantity || "N/A"}
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            {state.units.find((u) => u.id === item.unit)
                              ?.name || "N/A"}
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            SAR{" "}
                            {item.unit_price
                              ? Number(item.unit_price).toFixed(2)
                              : "N/A"}
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            SAR{" "}
                            {item.quantity && item.unit_price
                              ? Number(item.quantity * item.unit_price).toFixed(
                                  2
                                )
                              : "0.00"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {state.woType === "Split" && state.numberOfSplitOrders && (
              <div className="mt-4">
                {state.createdSplitOrders.length > 0 && (
                  <div>
                    <h3 className="text-md font-semibold mb-2 text-black">
                      Created Split Orders
                    </h3>
                    {state.createdSplitOrders.map((order, index) => (
                      <div key={index} className="mb-4 p-2 border rounded">
                        <h4 className="text-md font-medium">
                          Split Order {index + 1}
                        </h4>
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
                                  Total Price
                                </th>
                                <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">
                                  Assigned To
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {order.items.map((item) => (
                                <tr key={item.id} className="border">
                                  <td className="border p-2 whitespace-nowrap">
                                    {item.name || "N/A"}
                                  </td>
                                  <td className="border p-2 whitespace-nowrap">
                                    {item.quantity || "N/A"}
                                  </td>
                                  <td className="border p-2 whitespace-nowrap">
                                    {state.units.find((u) => u.id === item.unit)
                                      ?.name || "N/A"}
                                  </td>
                                  <td className="border p-2 whitespace-nowrap">
                                    SAR{" "}
                                    {item.unit_price
                                      ? Number(item.unit_price).toFixed(2)
                                      : "N/A"}
                                  </td>
                                  <td className="border p-2 whitespace-nowrap">
                                    SAR{" "}
                                    {item.quantity && item.unit_price
                                      ? Number(
                                          item.quantity * item.unit_price
                                        ).toFixed(2)
                                      : "0.00"}
                                  </td>
                                  <td className="border p-2 whitespace-nowrap">
                                    {state.technicians.find(
                                      (t) => t.id === parseInt(item.assigned_to)
                                    )?.name || "N/A"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {state.createdSplitOrders.length <
                  state.numberOfSplitOrders && (
                  <div>
                    <h4 className="text-md font-medium mb-2">
                      Select Items for Split Order{" "}
                      {state.createdSplitOrders.length + 1}
                    </h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Assigned To
                      </label>
                      <select
                        value={state.splitOrderAssignedTo}
                        onChange={(e) =>
                          handleSplitOrderAssignedToChange(e.target.value)
                        }
                        className="p-2 border rounded w-full mb-4"
                      >
                        <option value="">Select Technician</option>
                        {state.technicians.map((technician) => (
                          <option key={technician.id} value={technician.id}>
                            {technician.name} ({technician.designation})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-200">
                            <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">
                              Select
                            </th>
                            <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">
                              Item
                            </th>
                            <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">
                              Remaining Quantity
                            </th>
                            <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">
                              Assigned Quantity
                            </th>
                            <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">
                              Unit
                            </th>
                            <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">
                              Unit Price
                            </th>
                            <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">
                              Total Price
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {remainingItems.map((item) => (
                            <tr key={item.id} className="border">
                              <td className="border p-2 whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={state.selectedItemIds.includes(
                                    item.id
                                  )}
                                  onChange={() => handleItemSelection(item.id)}
                                  disabled={item.remaining_quantity === 0}
                                />
                              </td>
                              <td className="border p-2 whitespace-nowrap">
                                {item.name || "N/A"}
                              </td>
                              <td className="border p-2 whitespace-nowrap">
                                {item.remaining_quantity || "0"}
                              </td>
                              <td className="border p-2 whitespace-nowrap">
                                <InputField
                                  type="number"
                                  value={item.assigned_quantity}
                                  onChange={(e) =>
                                    handleAssignedQuantityChange(
                                      item.id,
                                      e.target.value
                                    )
                                  }
                                  className="w-full"
                                  min="0"
                                  max={item.remaining_quantity}
                                  disabled={
                                    !state.selectedItemIds.includes(item.id) ||
                                    item.remaining_quantity === 0
                                  }
                                  placeholder="Enter quantity"
                                />
                              </td>
                              <td className="border p-2 whitespace-nowrap">
                                {state.units.find((u) => u.id === item.unit)
                                  ?.name || "N/A"}
                              </td>
                              <td className="border p-2 whitespace-nowrap">
                                SAR{" "}
                                {item.unit_price
                                  ? Number(item.unit_price).toFixed(2)
                                  : "N/A"}
                              </td>
                              <td className="border p-2 whitespace-nowrap">
                                SAR{" "}
                                {item.quantity && item.unit_price
                                  ? Number(
                                      item.quantity * item.unit_price
                                    ).toFixed(2)
                                  : "0.00"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Button
                      onClick={handleGenerateSplitOrder}
                      disabled={isGenerateDisabled()}
                      className={`px-4 py-2 mt-2 rounded-md ${
                        isGenerateDisabled()
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
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
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  isWOModalOpen: false,
                  selectedPO: null,
                  singleOrderAssignedTo: "",
                }))
              }
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleWOSubmit}
              disabled={isSubmitDisabled() || state.isSubmitting}
              className={`px-4 py-2 rounded-md ${
                isSubmitDisabled() || state.isSubmitting
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {state.isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ListPurchaseOrders;