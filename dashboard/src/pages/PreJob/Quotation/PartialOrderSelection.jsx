import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import apiClient from "../../../helpers/apiClient";
import InputField from "../../../components/InputField";

const PartialOrderSelection = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { quotationData } = location.state || {};

  const [state, setState] = useState({
    numberOfPartialOrders: "",
    savedItems: [],
    createdPartialOrders: [],
    units: [],
    itemsList: [],
    isAllPartialsCreated: false,
    quantityAssignments: {},
    currentPartialIndex: 0,
    isWorkflowCompleted: false,
  });

  useEffect(() => {
    if (!quotationData?.items) {
      console.warn("No quotation data or items found:", quotationData);
      toast.error("No quotation data or items found.");
      navigate("/view-quotation");
      return;
    }

    const fetchData = async () => {
      try {
        const [unitsRes, itemsRes] = await Promise.all([
          apiClient.get("/units/"),
          apiClient.get("/items/"),
        ]);

        const initialSavedItems = quotationData.items.map((item) => ({
          ...item,
          item_name: item.item_name || (item.item ? item.item.name : null),
          product_name: item.product_name || null,
          quantity: item.quantity || 0,
          unit: item.unit || null,
          unit_price: item.unit_price || 0,
        }));

        const initialQuantityAssignments = {};
        initialSavedItems.forEach((item) => {
          initialQuantityAssignments[item.id] = {
            remainingQuantity: item.quantity || 0,
            assignments: [],
          };
        });

        setState((prev) => ({
          ...prev,
          savedItems: initialSavedItems,
          units: unitsRes.data || [],
          itemsList: itemsRes.data || [],
          quantityAssignments: initialQuantityAssignments,
        }));
      } catch (error) {
        console.error("Error fetching units or items:", error);
        toast.error("Failed to load units or items.");
      }
    };

    fetchData();
  }, [quotationData, navigate]);

  const handleNumberOfPartialOrdersChange = (e) => {
    const value = e.target.value === "" ? "" : parseInt(e.target.value, 10);
    if (value && value < 1) {
      toast.error("Number of partial orders must be at least 1.");
      return;
    }

    const initialQuantityAssignments = {};
    state.savedItems.forEach((item) => {
      initialQuantityAssignments[item.id] = {
        remainingQuantity: item.quantity || 0,
        assignments: [],
      };
    });

    setState((prev) => ({
      ...prev,
      numberOfPartialOrders: value,
      createdPartialOrders: [],
      isAllPartialsCreated: false,
      quantityAssignments: initialQuantityAssignments,
      currentPartialIndex: 0,
      isWorkflowCompleted: false,
    }));
  };

  const handleQuantityAssignment = (itemId, quantity) => {
    if (!state.numberOfPartialOrders) {
      toast.error("Please enter the number of partial orders first.");
      return;
    }

    const assignedQuantity = quantity === "" ? 0 : parseInt(quantity, 10);
    const currentAssignment = state.quantityAssignments[itemId];

    if (assignedQuantity < 0) {
      toast.error("Quantity cannot be negative.");
      return;
    }

    if (assignedQuantity > currentAssignment.remainingQuantity) {
      toast.error(
        `Cannot assign more than ${currentAssignment.remainingQuantity} remaining quantity.`
      );
      return;
    }

    setState((prev) => {
      const newQuantityAssignments = { ...prev.quantityAssignments };
      const existingAssignmentIndex = newQuantityAssignments[itemId].assignments.findIndex(
        (a) => a.partialOrderIndex === prev.currentPartialIndex
      );

      if (existingAssignmentIndex !== -1) {
        const existingQuantity =
          newQuantityAssignments[itemId].assignments[existingAssignmentIndex].quantity;
        newQuantityAssignments[itemId].remainingQuantity += existingQuantity;
        newQuantityAssignments[itemId].assignments.splice(existingAssignmentIndex, 1);
      }

      if (assignedQuantity > 0) {
        newQuantityAssignments[itemId].remainingQuantity -= assignedQuantity;
        newQuantityAssignments[itemId].assignments.push({
          quantity: assignedQuantity,
          partialOrderIndex: prev.currentPartialIndex,
        });
      }

      return {
        ...prev,
        quantityAssignments: newQuantityAssignments,
      };
    });
  };

  const getCurrentPartialAssignment = (itemId) => {
    const assignment = state.quantityAssignments[itemId]?.assignments.find(
      (a) => a.partialOrderIndex === state.currentPartialIndex
    );
    return assignment?.quantity || "";
  };

  const isGenerateDisabled = () => {
    const { numberOfPartialOrders, createdPartialOrders } = state;
    if (!numberOfPartialOrders) return true;
    if (createdPartialOrders.length >= numberOfPartialOrders) return true;

    const hasAssignments = Object.values(state.quantityAssignments).some((assignment) =>
      assignment.assignments.some(
        (a) => a.partialOrderIndex === state.currentPartialIndex
      )
    );

    if (!hasAssignments) return true;
    return false;
  };

  const handleGeneratePartialOrder = async () => {
    let selectedItems = [];
    Object.entries(state.quantityAssignments).forEach(([itemId, assignment]) => {
      const partialAssignment = assignment.assignments.find(
        (a) => a.partialOrderIndex === state.currentPartialIndex
      );
      if (partialAssignment && partialAssignment.quantity > 0) {
        const originalItem = state.savedItems.find((item) => item.id === parseInt(itemId));
        selectedItems.push({
          ...originalItem,
          quantity: partialAssignment.quantity,
        });
      }
    });

    if (!selectedItems.length) {
      toast.error("No valid items selected.");
      return;
    }

    const formData = new FormData();
    formData.append("quotation", quotationData.id);
    formData.append("order_type", "partial");
    formData.append(
      "items",
      JSON.stringify(
        selectedItems.map((item) => ({
          item: item.item || null,
          item_name: item.item_name || state.itemsList.find((i) => i.id === item.item)?.name || null,
          product_name: item.product_name || null,
          quantity: item.quantity,
          unit: item.unit || null,
          unit_price: item.unit_price || null,
        }))
      )
    );

    try {
      const response = await apiClient.post("/purchase-orders/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setState((prev) => {
        const newCreatedPartialOrders = [
          ...prev.createdPartialOrders,
          {
            ...response.data,
            items: response.data.items.map((item) => ({
              ...item,
              total_price: item.quantity && item.unit_price ? item.quantity * item.unit_price : 0,
            })),
          },
        ];

        let isAllPartialsCreated =
          newCreatedPartialOrders.length === prev.numberOfPartialOrders &&
          Object.values(prev.quantityAssignments).every(
            (assignment) => assignment.remainingQuantity === 0
          );

        return {
          ...prev,
          createdPartialOrders: newCreatedPartialOrders,
          currentPartialIndex: prev.currentPartialIndex + 1,
          isAllPartialsCreated,
          isWorkflowCompleted: false,
        };
      });

      toast.success(`Partial purchase order ${state.createdPartialOrders.length + 1} created successfully!`);
    } catch (error) {
      console.error("Error creating partial order:", error);
      toast.error("Failed to create partial order.");
    }
  };

  const handleCancelPartial = async (index) => {
    const orderToCancel = state.createdPartialOrders[index];
    if (!orderToCancel) return;

    try {
      await apiClient.delete(`/purchase-orders/${orderToCancel.id}/`);
      setState((prev) => {
        const newCreatedPartialOrders = prev.createdPartialOrders.filter((_, i) => i !== index);
        const newQuantityAssignments = { ...prev.quantityAssignments };

        Object.entries(newQuantityAssignments).forEach(([itemId, assignment]) => {
          const cancelledAssignment = assignment.assignments.find(
            (a) => a.partialOrderIndex === index
          );
          if (cancelledAssignment) {
            newQuantityAssignments[itemId].remainingQuantity += cancelledAssignment.quantity;
            newQuantityAssignments[itemId].assignments = assignment.assignments.filter(
              (a) => a.partialOrderIndex !== index
            );
            newQuantityAssignments[itemId].assignments = assignment.assignments.map((a) =>
              a.partialOrderIndex > index ? { ...a, partialOrderIndex: a.partialOrderIndex - 1 } : a
            );
          }
        });

        const isAllPartialsCreated =
          newCreatedPartialOrders.length === prev.numberOfPartialOrders &&
          Object.values(newQuantityAssignments).every(
            (assignment) => assignment.remainingQuantity === 0
          );

        return {
          ...prev,
          createdPartialOrders: newCreatedPartialOrders,
          quantityAssignments: newQuantityAssignments,
          currentPartialIndex: Math.max(0, prev.currentPartialIndex - 1),
          isAllPartialsCreated,
          isWorkflowCompleted: false,
        };
      });

      toast.success(`Partial order ${index + 1} canceled successfully.`);
    } catch (error) {
      console.error("Error canceling partial order:", error);
      toast.error("Failed to cancel partial order.");
    }
  };

  const handleCancel = async () => {
    try {
      for (const order of state.createdPartialOrders) {
        await apiClient.delete(`/purchase-orders/${order.id}/`);
      }

      const initialQuantityAssignments = {};
      state.savedItems.forEach((item) => {
        initialQuantityAssignments[item.id] = {
          remainingQuantity: item.quantity || 0,
          assignments: [],
        };
      });

      setState((prev) => ({
        ...prev,
        createdPartialOrders: [],
        quantityAssignments: initialQuantityAssignments,
        currentPartialIndex: 0,
        isWorkflowCompleted: false,
      }));

      toast.info("All created partial orders have been reset.");
    } catch (error) {
      console.error("Error deleting partial orders:", error);
      toast.error("Failed to reset partial orders.");
    }
  };

  const handleFinish = async () => {
    if (!state.numberOfPartialOrders || state.createdPartialOrders.length !== state.numberOfPartialOrders) {
      toast.error("Please create exactly the specified number of partial orders.");
      return;
    }

    const hasRemainingQuantity = Object.values(state.quantityAssignments).some(
      (assignment) => assignment.remainingQuantity > 0
    );

    if (hasRemainingQuantity) {
      toast.error("All item quantities must be fully assigned to partial orders.");
      return;
    }

    try {
      await apiClient.patch(`/quotations/${quotationData.id}/`, {
        partial_order_workflow_completed: true,
      });

      setState((prev) => ({
        ...prev,
        isWorkflowCompleted: true,
      }));

      toast.success("Partial order workflow completed successfully!");
      navigate("/view-quotation", {
        state: {
          quotationId: quotationData.id,
          partialOrders: state.createdPartialOrders,
          workflowCompleted: true,
        },
      });
    } catch (error) {
      console.error("Error completing workflow:", error);
      toast.error("Failed to complete workflow.");
    }
  };

  const handlePrevious = async () => {
    if (state.createdPartialOrders.length > 0 && !state.isWorkflowCompleted) {
      const confirmLeave = window.confirm(
        "You have created partial orders but haven't completed the workflow. " +
        "If you leave now, these partial orders will be deleted. Do you want to continue?"
      );
      if (confirmLeave) {
        try {
          for (const order of state.createdPartialOrders) {
            await apiClient.delete(`/purchase-orders/${order.id}/`);
          }
        } catch (error) {
          console.error("Error cleaning up partial orders:", error);
        }
        navigate("/view-quotation");
      }
    } else {
      navigate("/view-quotation");
    }
  };

  const canCreateMore = state.createdPartialOrders.length < state.numberOfPartialOrders;

  return (
    <div className="container mx-auto p-4 bg-transparent min-h-screen">
      <button
        onClick={handlePrevious}
        className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 text-sm"
      >
        Go Back
      </button>

      <div className="flex justify-start items-center mb-4 mt-4">
        <h2 className="text-xl font-semibold text-black">Partial Order Selection</h2>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-4">
          <InputField
            type="number"
            label="Number of Partial Orders"
            value={state.numberOfPartialOrders}
            onChange={handleNumberOfPartialOrdersChange}
            placeholder="Enter number of partial orders"
            min="1"
            required
            className="w-full"
          />
        </div>

        <div className="mb-4">
          <h3 className="text-md font-semibold mb-2 text-black">
            {state.numberOfPartialOrders
              ? `Assign Quantities for Partial Order ${state.currentPartialIndex + 1}`
              : "Items"}
          </h3>
          <div className="overflow-x-auto rounded-lg shadow-sm">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-sm font-medium text-black text-left">Item</th>
                  <th className="px-4 py-2 text-sm font-medium text-black text-left">
                    {state.numberOfPartialOrders ? "Remaining Quantity" : "Quantity"}
                  </th>
                  {state.numberOfPartialOrders && (
                    <th className="px-4 py-2 text-sm font-medium text-black text-left">Assign Quantity</th>
                  )}
                  <th className="px-4 py-2 text-sm font-medium text-black text-left">Unit</th>
                  <th className="px-4 py-2 text-sm font-medium text-black text-left">Unit Price</th>
                </tr>
              </thead>
              <tbody>
                {state.savedItems.map((item) => (
                  <tr key={item.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-black">
                      {state.itemsList.find((i) => i.id === item.item)?.name || item.item_name || item.product_name || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm text-black">
                      {state.numberOfPartialOrders
                        ? state.quantityAssignments[item.id]?.remainingQuantity || 0
                        : item.quantity || 0}
                    </td>
                    {state.numberOfPartialOrders && (
                      <td className="px-4 py-3 text-sm text-black">
                        <InputField
                          type="number"
                          value={getCurrentPartialAssignment(item.id)}
                          onChange={(e) => handleQuantityAssignment(item.id, e.target.value)}
                          placeholder="0"
                          min="0"
                          max={state.quantityAssignments[item.id]?.remainingQuantity || 0}
                          className="w-full"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm text-black">
                      {state.units.find((u) => u.id === item.unit)?.name || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm text-black">
                      SAR {item.unit_price != null ? Number(item.unit_price).toFixed(2) : "0.00"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {state.createdPartialOrders.length > 0 && (
          <div className="mb-6">
            <h3 className="text-md font-semibold mb-2 text-black">Created Partial Orders</h3>
            {state.createdPartialOrders.map((order, index) => (
              <div key={index} className="mb-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-700">Partial Order {index + 1}</h4>
                  <button
                    onClick={() => handleCancelPartial(index)}
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-sm"
                  >
                    Cancel
                  </button>
                </div>
                <div className="overflow-x-auto rounded-lg shadow-sm mt-2">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 text-sm font-medium text-black text-left">Item</th>
                        <th className="px-4 py-2 text-sm font-medium text-black text-left">Quantity</th>
                        <th className="px-4 py-2 text-sm font-medium text-black text-left">Unit</th>
                        <th className="px-4 py-2 text-sm font-medium text-black text-left">Unit Price</th>
                        <th className="px-4 py-2 text-sm font-medium text-black text-left">Total Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item) => (
                        <tr key={item.id} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-black">
                            {state.itemsList.find((i) => i.id === item.item)?.name || item.item_name || item.product_name || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-sm text-black">{item.quantity || "N/A"}</td>
                          <td className="px-4 py-3 text-sm text-black">
                            {state.units.find((u) => u.id === item.unit)?.name || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-sm text-black">
                            SAR {item.unit_price != null ? Number(item.unit_price).toFixed(2) : "0.00"}
                          </td>
                          <td className="px-4 py-3 text-sm text-black">
                            SAR {item.total_price != null ? Number(item.total_price).toFixed(2) : "0.00"}
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

        <div className="flex justify-end space-x-2">
          <button
            onClick={handleCancel}
            className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600"
          >
            Cancel All
          </button>
          <button
            onClick={handleGeneratePartialOrder}
            className={`px-3 py-2 rounded transition-colors duration-200 flex items-center ${
              isGenerateDisabled()
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-green-500 text-white hover:bg-green-600"
            }`}
            disabled={isGenerateDisabled()}
          >
            Generate Partial
          </button>
          <button
            onClick={handleFinish}
            className={`px-3 py-2 rounded transition-colors duration-200 ${
              state.isAllPartialsCreated
                ? "bg-green-500 text-white hover:bg-green-600"
                : "bg-gray-200 text-black hover:bg-gray-300"
            }`}
          >
            Finish
          </button>
        </div>
      </div>
    </div>
  );
};

export default PartialOrderSelection;