import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import apiClient from "../../../helpers/apiClient";
import InputField from "../../../components/InputField";

// Custom hook for managing quantity assignments
const useQuantityAssignments = (items, numberOfPartialOrders) => {
  const [quantityAssignments, setQuantityAssignments] = useState({});

  const initializeAssignments = useCallback(() => {
    const initialAssignments = {};
    items.forEach((item) => {
      initialAssignments[item.id] = {
        remainingQuantity: item.quantity || 0,
        assignments: [],
      };
    });
    setQuantityAssignments(initialAssignments);
  }, [items]);

  useEffect(() => {
    if (items.length > 0) {
      initializeAssignments();
    }
  }, [items, numberOfPartialOrders, initializeAssignments]);

  const updateAssignment = useCallback((itemId, quantity, partialIndex) => {
    setQuantityAssignments(prev => {
      const newAssignments = { ...prev };
      const currentAssignment = newAssignments[itemId];
      
      // Find existing assignment for this partial order
      const existingIndex = currentAssignment.assignments.findIndex(
        a => a.partialOrderIndex === partialIndex
      );

      // Restore quantity from existing assignment
      if (existingIndex !== -1) {
        const existingQuantity = currentAssignment.assignments[existingIndex].quantity;
        newAssignments[itemId].remainingQuantity += existingQuantity;
        newAssignments[itemId].assignments.splice(existingIndex, 1);
      }

      // Add new assignment if quantity > 0
      if (quantity > 0) {
        newAssignments[itemId].remainingQuantity -= quantity;
        newAssignments[itemId].assignments.push({
          quantity,
          partialOrderIndex: partialIndex,
        });
        // Warn if remaining quantity becomes negative
        if (newAssignments[itemId].remainingQuantity < 0) {
          toast.warn(`Warning: Assigned quantity exceeds original quantity for item ${itemId}.`);
        }
      }

      return newAssignments;
    });
  }, []);

  const removeAssignmentsForPartial = useCallback((partialIndex) => {
    setQuantityAssignments(prev => {
      const newAssignments = { ...prev };
      
      Object.entries(newAssignments).forEach(([itemId, assignment]) => {
        const removedAssignment = assignment.assignments.find(
          a => a.partialOrderIndex === partialIndex
        );
        
        if (removedAssignment) {
          newAssignments[itemId].remainingQuantity += removedAssignment.quantity;
          newAssignments[itemId].assignments = assignment.assignments
            .filter(a => a.partialOrderIndex !== partialIndex)
            .map(a => a.partialOrderIndex > partialIndex 
              ? { ...a, partialOrderIndex: a.partialOrderIndex - 1 } 
              : a
            );
        }
      });

      return newAssignments;
    });
  }, []);

  return {
    quantityAssignments,
    updateAssignment,
    removeAssignmentsForPartial,
    initializeAssignments
  };
};

const PartialOrderSelection = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { quotationData } = location.state || {};

  const [numberOfPartialOrders, setNumberOfPartialOrders] = useState("");
  const [createdPartialOrders, setCreatedPartialOrders] = useState([]);
  const [currentPartialIndex, setCurrentPartialIndex] = useState(0);
  const [units, setUnits] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [isWorkflowCompleted, setIsWorkflowCompleted] = useState(false);

  // Memoized processed items
  const processedItems = useMemo(() => {
    if (!quotationData?.items) return [];
    
    return quotationData.items.map((item) => ({
      ...item,
      item_name: item.item_name || (item.item ? item.item.name : null),
      product_name: item.product_name || null,
      quantity: item.quantity || 0,
      unit: item.unit || null,
      unit_price: item.unit_price || 0,
    }));
  }, [quotationData]);

  const {
    quantityAssignments,
    updateAssignment,
    removeAssignmentsForPartial,
    initializeAssignments
  } = useQuantityAssignments(processedItems, numberOfPartialOrders);

  // Cleanup function to delete partial orders
  const cleanupPartialOrders = useCallback(async () => {
    if (createdPartialOrders.length > 0 && !isWorkflowCompleted) {
      try {
        await Promise.all(
          createdPartialOrders.map(order =>
            apiClient.delete(`/purchase-orders/${order.id}/`).catch(error => {
              if (error.response?.status === 404) {
                console.warn(`Order ${order.id} not found, skipping deletion.`);
              } else {
                console.error(`Error deleting order ${order.id}:`, error);
              }
            })
          )
        );
        setCreatedPartialOrders([]); // Clear local state after cleanup
        console.log("Cleaned up partial orders on navigation");
      } catch (error) {
        console.error("Error during cleanup of partial orders:", error);
        toast.error("Failed to clean up partial orders.");
      }
    }
  }, [createdPartialOrders, isWorkflowCompleted]);

  // Handle browser navigation events (back button, refresh, close tab)
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (createdPartialOrders.length > 0 && !isWorkflowCompleted) {
        event.preventDefault();
        event.returnValue = 'You have unsaved draft partial orders. If you leave, they will be deleted. Continue?';
      }
    };

    const handlePopState = async (event) => {
      event.preventDefault(); // Prevent default navigation
      if (createdPartialOrders.length > 0 && !isWorkflowCompleted) {
        const confirmLeave = window.confirm(
          "You have unsaved draft partial orders. If you leave now, they will be deleted. Do you want to continue?"
        );
        
        if (confirmLeave) {
          await cleanupPartialOrders();
          navigate("/view-quotation");
        } else {
          // Push state to keep user on current page
          window.history.pushState(null, '', window.location.pathname);
        }
      } else {
        navigate("/view-quotation");
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [createdPartialOrders, isWorkflowCompleted, cleanupPartialOrders, navigate]);

  // Navigation guard effect
  useEffect(() => {
    if (!location.state?.quotationData?.items && !createdPartialOrders.length) {
      console.warn("No quotation data or items found:", quotationData);
      toast.error("No quotation data or items found.");
      navigate("/view-quotation");
    }
  }, [quotationData, navigate, location.state, createdPartialOrders.length]);

  // Data fetching effect
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [unitsRes, itemsRes] = await Promise.all([
          apiClient.get("/units/"),
          apiClient.get("/items/"),
        ]);

        setUnits(unitsRes.data || []);
        setItemsList(itemsRes.data || []);
      } catch (error) {
        console.error("Error fetching units or items:", error);
        toast.error("Failed to load units or items.");
      }
    };

    fetchData();
  }, []);

  const handleNumberOfPartialOrdersChange = (e) => {
    const value = e.target.value === "" ? "" : parseInt(e.target.value, 10);
    
    if (value && value < 1) {
      toast.error("Number of partial orders must be at least 1.");
      return;
    }

    setNumberOfPartialOrders(value);
    setCreatedPartialOrders([]);
    setCurrentPartialIndex(0);
    setIsWorkflowCompleted(false);
    initializeAssignments();
  };

  const handleQuantityAssignment = (itemId, quantity) => {
    if (!numberOfPartialOrders) {
      toast.error("Please enter the number of partial orders first.");
      return;
    }

    const assignedQuantity = quantity === "" ? 0 : parseInt(quantity, 10);

    if (assignedQuantity < 0) {
      toast.error("Quantity cannot be negative.");
      return;
    }

    updateAssignment(itemId, assignedQuantity, currentPartialIndex);
  };

  const getCurrentPartialAssignment = (itemId) => {
    const assignment = quantityAssignments[itemId]?.assignments.find(
      (a) => a.partialOrderIndex === currentPartialIndex
    );
    return assignment?.quantity || "";
  };

  const isGenerateDisabled = useMemo(() => {
    if (!numberOfPartialOrders) return true;
    if (createdPartialOrders.length >= numberOfPartialOrders) return true;

    const hasAssignments = Object.values(quantityAssignments).some((assignment) =>
      assignment.assignments.some(
        (a) => a.partialOrderIndex === currentPartialIndex
      )
    );

    return !hasAssignments;
  }, [numberOfPartialOrders, createdPartialOrders.length, quantityAssignments, currentPartialIndex]);

  const isAllPartialsCreated = useMemo(() => {
    return createdPartialOrders.length === numberOfPartialOrders;
  }, [createdPartialOrders.length, numberOfPartialOrders]);

  const handleGeneratePartialOrder = async () => {
    const selectedItems = [];
    
    Object.entries(quantityAssignments).forEach(([itemId, assignment]) => {
      const partialAssignment = assignment.assignments.find(
        (a) => a.partialOrderIndex === currentPartialIndex
      );
      
      if (partialAssignment && partialAssignment.quantity > 0) {
        const originalItem = processedItems.find((item) => item.id === parseInt(itemId));
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
    formData.append("is_draft", "true");
    formData.append(
      "items",
      JSON.stringify(
        selectedItems.map((item) => ({
          item: item.item || null,
          item_name: item.item_name || itemsList.find((i) => i.id === item.item)?.name || null,
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

      if (response.data?.id) {
        const newPartialOrder = {
          ...response.data,
          isDraft: true,
          items: response.data.items.map((item) => ({
            ...item,
            total_price: item.quantity && item.unit_price ? item.quantity * item.unit_price : 0,
          })),
        };

        setCreatedPartialOrders(prev => [...prev, newPartialOrder]);
        setCurrentPartialIndex(prev => prev + 1);
        toast.success(`Draft partial order ${createdPartialOrders.length + 1} created successfully!`);
      } else {
        throw new Error("Invalid response from server: Missing order ID");
      }
    } catch (error) {
      console.error("Error creating partial order:", error);
      toast.error("Failed to create partial order.");
    }
  };

  const handleCancelPartial = async (index) => {
    const orderToCancel = createdPartialOrders[index];
    if (!orderToCancel) return;

    try {
      await apiClient.delete(`/purchase-orders/${orderToCancel.id}/`).catch(error => {
        if (error.response?.status === 404) {
          console.warn(`Order ${orderToCancel.id} not found, skipping deletion.`);
        } else {
          throw error;
        }
      });
      
      setCreatedPartialOrders(prev => prev.filter((_, i) => i !== index));
      removeAssignmentsForPartial(index);
      setCurrentPartialIndex(prev => Math.max(0, prev - 1));

      toast.success(`Partial order ${index + 1} canceled successfully.`);
    } catch (error) {
      console.error("Error canceling partial order:", error);
      toast.error("Failed to cancel partial order.");
    }
  };

  const handleCancel = async () => {
    try {
      await cleanupPartialOrders();
      setCreatedPartialOrders([]);
      setCurrentPartialIndex(0);
      setIsWorkflowCompleted(false);
      initializeAssignments();
      toast.info("All draft partial orders have been canceled.");
    } catch (error) {
      console.error("Error deleting partial orders:", error);
      toast.error("Failed to cancel partial orders.");
    }
  };

  const handleFinish = async () => {
    if (!numberOfPartialOrders || createdPartialOrders.length !== numberOfPartialOrders) {
      toast.error("Please create exactly the specified number of partial orders.");
      return;
    }

    try {
      const finalizePromises = createdPartialOrders.map(order =>
        apiClient.patch(`/purchase-orders/${order.id}/`, {
          is_draft: false
        }).catch(error => {
          if (error.response?.status === 404) {
            console.warn(`Order ${order.id} not found, skipping finalization.`);
          } else {
            throw error;
          }
        })
      );

      await Promise.all(finalizePromises);

      await apiClient.patch(`/quotations/${quotationData.id}/`, {
        partial_order_workflow_completed: true,
      });

      setIsWorkflowCompleted(true);

      toast.success("Partial order workflow completed and saved successfully!");
      navigate("/view-quotation", {
        state: {
          quotationId: quotationData.id,
          partialOrders: createdPartialOrders.map(order => ({ ...order, isDraft: false })),
          workflowCompleted: true,
        },
      });
    } catch (error) {
      console.error("Error completing workflow:", error);
      toast.error("Failed to complete workflow.");
    }
  };

  const handlePrevious = async () => {
    if (createdPartialOrders.length > 0 && !isWorkflowCompleted) {
      const confirmLeave = window.confirm(
        "You have unsaved draft partial orders. If you leave now, they will be deleted. Do you want to continue?"
      );
      
      if (confirmLeave) {
        await cleanupPartialOrders();
        navigate("/view-quotation");
      }
    } else {
      navigate("/view-quotation");
    }
  };

  const getItemDisplayName = (item) => {
    return itemsList.find((i) => i.id === item.item)?.name || 
           item.item_name || 
           item.product_name || 
           "N/A";
  };

  const getUnitName = (unitId) => {
    return units.find((u) => u.id === unitId)?.name || "N/A";
  };

  const formatPrice = (price) => {
    return `SAR ${price != null ? Number(price).toFixed(2) : "0.00"}`;
  };

  if (!quotationData?.items && !createdPartialOrders.length) {
    return null; // Component will redirect via useEffect
  }

  return (
    <div className="container mx-auto p-4 bg-transparent min-h-screen">
      <button
        onClick={handlePrevious}
        className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 text-sm transition-colors"
      >
        Go Back
      </button>

      <div className="flex justify-start items-center mb-4 mt-4">
        <h2 className="text-xl font-semibold text-black">Partial Order Selection</h2>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* Number of Partial Orders Input */}
        <div className="mb-6">
          <InputField
            type="number"
            label="Number of Partial Orders"
            value={numberOfPartialOrders}
            onChange={handleNumberOfPartialOrdersChange}
            placeholder="Enter number of partial orders"
            min="1"
            required
            className="w-full"
          />
        </div>

        {/* Items Assignment Table */}
        <div className="mb-6">
          <h3 className="text-md font-semibold mb-3 text-black">
            {numberOfPartialOrders
              ? `Assign Quantities for Partial Order ${currentPartialIndex + 1}`
              : "Items from Quotation"}
          </h3>
          
          <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {numberOfPartialOrders ? "Remaining Qty" : "Quantity"}
                  </th>
                  {numberOfPartialOrders && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assign Qty
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Price
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {processedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-black font-medium">
                      {getItemDisplayName(item)}
                    </td>
                    <td className="px-4 py-3 text-sm text-black">
                      {numberOfPartialOrders
                        ? quantityAssignments[item.id]?.remainingQuantity || 0
                        : item.quantity || 0}
                      {quantityAssignments[item.id]?.remainingQuantity < 0 && (
                        <span className="text-red-500 ml-2">(Over-assigned)</span>
                      )}
                    </td>
                    {numberOfPartialOrders && (
                      <td className="px-4 py-3 text-sm text-black">
                        <InputField
                          type="number"
                          value={getCurrentPartialAssignment(item.id)}
                          onChange={(e) => handleQuantityAssignment(item.id, e.target.value)}
                          placeholder="0"
                          min="0"
                          className="w-24"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm text-black">
                      {getUnitName(item.unit)}
                    </td>
                    <td className="px-4 py-3 text-sm text-black">
                      {formatPrice(item.unit_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Created Partial Orders Display */}
        {createdPartialOrders.length > 0 && (
          <div className="mb-6">
            <h3 className="text-md font-semibold mb-3 text-black">
              Draft Partial Orders ({createdPartialOrders.length}/{numberOfPartialOrders})
            </h3>
            <div className="mb-2 p-2 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 text-sm">
              These are draft orders. They will only be saved permanently when you click "Finish".
            </div>
            
            <div className="space-y-4">
              {createdPartialOrders.map((order, index) => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900">
                      Draft Partial Order {index + 1} (ID: {order.id})
                    </h4>
                    <button
                      onClick={() => handleCancelPartial(index)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {order.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-3 py-2 text-sm text-black">{getItemDisplayName(item)}</td>
                            <td className="px-3 py-2 text-sm text-black">{item.quantity || "N/A"}</td>
                            <td className="px-3 py-2 text-sm text-black">{getUnitName(item.unit)}</td>
                            <td className="px-3 py-2 text-sm text-black">{formatPrice(item.unit_price)}</td>
                            <td className="px-3 py-2 text-sm text-black font-medium">
                              {formatPrice(item.total_price)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleCancel}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
          >
            Cancel All Drafts
          </button>
          
          <button
            onClick={handleGeneratePartialOrder}
            className={`px-4 py-2 rounded transition-colors duration-200 ${
              isGenerateDisabled
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
            disabled={isGenerateDisabled}
          >
            Generate Draft Partial Order
          </button>
          
          <button
            onClick={handleFinish}
            className={`px-4 py-2 rounded transition-colors duration-200 ${
              isAllPartialsCreated
                ? "bg-green-500 text-white hover:bg-green-600"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            disabled={!isAllPartialsCreated}
          >
            Finish & Save All
          </button>
        </div>

        {/* Progress Indicator */}
        {numberOfPartialOrders && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progress: {createdPartialOrders.length} of {numberOfPartialOrders} draft partial orders created</span>
              <span>
                {isAllPartialsCreated ? 
                  "Ready to finish and save" : 
                  "Create remaining partial orders"
                }
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartialOrderSelection;