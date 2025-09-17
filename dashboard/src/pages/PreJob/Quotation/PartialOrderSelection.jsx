import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import apiClient from "../../../helpers/apiClient";

const PartialOrderSelection = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { quotationData } = location.state || {};
  const [state, setState] = useState({
    numberOfPartialOrders: "",
    selectedItemIds: [],
    savedItems: [],
    createdPartialOrders: [],
    usedItemIds: [],
    units: [],
    itemsList: [],
    isAllPartialsCreated: false, // New state to track completion
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
        const [unitsRes, itemsRes] = await Promise.all([apiClient.get("/units/"), apiClient.get("/items/")]);
        const initialSavedItems = quotationData.items.map(item => ({
          ...item,
          item_name: item.item_name || (item.item ? item.item.name : null),
          product_name: item.product_name || null,
          quantity: item.quantity || 0,
          unit: item.unit || null,
          unit_price: item.unit_price || 0,
        }));
        setState(prev => ({
          ...prev,
          savedItems: initialSavedItems,
          units: unitsRes.data || [],
          itemsList: itemsRes.data || [],
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
    if (value && (value < 1 || value > state.savedItems.length)) {
      toast.error(`Number of partial orders must be between 1 and ${state.savedItems.length}.`);
      return;
    }
    setState(prev => ({
      ...prev,
      numberOfPartialOrders: value,
      selectedItemIds: [],
      createdPartialOrders: [],
      usedItemIds: [],
      isAllPartialsCreated: false, // Reset completion state
    }));
  };

  const handleItemSelection = (itemId) => {
    setState(prev => {
      const { selectedItemIds, createdPartialOrders, numberOfPartialOrders, usedItemIds } = prev;
      if (selectedItemIds.includes(itemId)) {
        return { ...prev, selectedItemIds: selectedItemIds.filter(id => id !== itemId) };
      }
      const remainingPartialOrders = numberOfPartialOrders - createdPartialOrders.length;
      const remainingItemsCount = state.savedItems.length - usedItemIds.length;
      const maxItemsPerOrder = remainingPartialOrders > 1
        ? remainingItemsCount - (remainingPartialOrders - 1)
        : remainingItemsCount;
      if (selectedItemIds.length >= maxItemsPerOrder) {
        toast.error(`Cannot select more than ${maxItemsPerOrder} items for this partial order.`);
        return prev;
      }
      return { ...prev, selectedItemIds: [...selectedItemIds, itemId] };
    });
  };

  const isGenerateDisabled = () => {
    const { numberOfPartialOrders, createdPartialOrders, selectedItemIds, usedItemIds } = state;
    if (!numberOfPartialOrders) return true;
    if (createdPartialOrders.length >= numberOfPartialOrders) return true;
    if (selectedItemIds.length === 0) return true;
    const remainingItemsCount = state.savedItems.length - usedItemIds.length;
    const remainingPartialOrders = numberOfPartialOrders - createdPartialOrders.length;
    const maxItemsPerOrder = remainingPartialOrders > 1
      ? remainingItemsCount - (remainingPartialOrders - 1)
      : remainingItemsCount;
    if (remainingPartialOrders > 1 && selectedItemIds.length > maxItemsPerOrder) return true;
    if (remainingPartialOrders === 1 && selectedItemIds.length !== remainingItemsCount) return true;
    if (selectedItemIds.some(id => usedItemIds.includes(id))) return true;
    return false;
  };

  const handleGeneratePartialOrder = async () => {
    const selectedItems = state.savedItems.filter(item => state.selectedItemIds.includes(item.id));
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
        selectedItems.map(item => ({
          item: item.item || null,
          item_name: item.item_name || state.itemsList.find(i => i.id === item.item)?.name || null,
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

      setState(prev => {
        const newCreatedPartialOrders = [
          ...prev.createdPartialOrders,
          { 
            ...response.data, 
            items: response.data.items.map(item => ({
              ...item,
              total_price: item.quantity && item.unit_price ? item.quantity * item.unit_price : 0,
            })),
            itemIds: [...prev.selectedItemIds]
          }
        ];
        const newUsedItemIds = [...prev.usedItemIds, ...prev.selectedItemIds];
        const isAllPartialsCreated = newCreatedPartialOrders.length === prev.numberOfPartialOrders && 
                                    newUsedItemIds.length === prev.savedItems.length;
        return {
          ...prev,
          createdPartialOrders: newCreatedPartialOrders,
          usedItemIds: newUsedItemIds,
          selectedItemIds: [],
          isAllPartialsCreated, // Update completion state
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
      
      setState(prev => {
        const newCreatedPartialOrders = prev.createdPartialOrders.filter((_, i) => i !== index);
        const newUsedItemIds = prev.usedItemIds.filter(id => !orderToCancel.itemIds.includes(id));
        const isAllPartialsCreated = newCreatedPartialOrders.length === prev.numberOfPartialOrders && 
                                    newUsedItemIds.length === prev.savedItems.length;
        return {
          ...prev,
          createdPartialOrders: newCreatedPartialOrders,
          usedItemIds: newUsedItemIds,
          isAllPartialsCreated, // Update completion state
        };
      });
      toast.success(`Partial order ${index + 1} canceled successfully.`);
    } catch (error) {
      console.error("Error canceling partial order:", error);
      toast.error("Failed to cancel partial order.");
    }
  };

  const handleCancel = () => {
    setState(prev => ({
      ...prev,
      createdPartialOrders: [],
      usedItemIds: [],
      selectedItemIds: [],
      isAllPartialsCreated: false, // Reset completion state
    }));
    toast.info("All created partial orders have been reset.");
  };

  const handleFinish = () => {
    if (!state.numberOfPartialOrders || state.createdPartialOrders.length !== state.numberOfPartialOrders || state.usedItemIds.length !== state.savedItems.length) {
      toast.error("Please create exactly the specified number of partial orders with all items.");
      return;
    }
    navigate("/view-quotation", { state: { quotationId: quotationData.id, partialOrders: state.createdPartialOrders } });
  };

  const remainingItems = state.savedItems.filter(item => !state.usedItemIds.includes(item.id));

  return (
    <div className="container mx-auto p-4 bg-transparent min-h-screen">
      <h2 className="text-xl font-semibold mb-4 text-black">Partial Order Selection</h2>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Number of Partial Orders</label>
          <input
            type="number"
            value={state.numberOfPartialOrders}
            onChange={handleNumberOfPartialOrdersChange}
            className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            min="1"
            max={state.savedItems.length}
            placeholder="Enter number of partial orders"
          />
        </div>
        {remainingItems.length > 0 && (
          <div className="mb-4">
            <h3 className="text-md font-semibold mb-2 text-black">Select Items</h3>
            <div className="overflow-x-auto rounded-lg shadow-sm">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-sm font-medium text-black text-left">Select</th>
                    <th className="px-4 py-2 text-sm font-medium text-black text-left">Item</th>
                    <th className="px-4 py-2 text-sm font-medium text-black text-left">Quantity</th>
                    <th className="px-4 py-2 text-sm font-medium text-black text-left">Unit</th>
                    <th className="px-4 py-2 text-sm font-medium text-black text-left">Unit Price</th>
                  </tr>
                </thead>
                <tbody>
                  {remainingItems.map(item => (
                    <tr key={item.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-black">
                        <input
                          type="checkbox"
                          checked={state.selectedItemIds.includes(item.id)}
                          onChange={() => handleItemSelection(item.id)}
                          disabled={state.usedItemIds.includes(item.id)}
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-black">
                        {state.itemsList.find(i => i.id === item.item)?.name || item.item_name || item.product_name || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm text-black">{item.quantity || "N/A"}</td>
                      <td className="px-4 py-3 text-sm text-black">
                        {state.units.find(u => u.id === item.unit)?.name || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm text-black">
                        ${item.unit_price != null ? Number(item.unit_price).toFixed(2) : "0.00"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
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
                      {order.items.map(item => (
                        <tr key={item.id} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-black">
                            {state.itemsList.find(i => i.id === item.item)?.name || item.item_name || item.product_name || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-sm text-black">{item.quantity || "N/A"}</td>
                          <td className="px-4 py-3 text-sm text-black">
                            {state.units.find(u => u.id === item.unit)?.name || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-sm text-black">
                            ${item.unit_price != null ? Number(item.unit_price).toFixed(2) : "0.00"}
                          </td>
                          <td className="px-4 py-3 text-sm text-black">
                            ${item.total_price != null ? Number(item.total_price).toFixed(2) : "0.00"}
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
                : "bg-grey-200 text-black hover:bg-gray-300"
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