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
    itemsList: [], // Added to store items list
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
          itemsList: itemsRes.data || [], // Store items list
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

    const response = await apiClient.post("/purchase-orders/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    setState(prev => ({
      ...prev,
      createdPartialOrders: [
        ...prev.createdPartialOrders,
        { ...response.data, items: response.data.items.map(item => ({
          ...item,
          total_price: item.quantity && item.unit_price ? item.quantity * item.unit_price : 0,
        })) },
      ],
      usedItemIds: [...prev.usedItemIds, ...state.selectedItemIds],
      selectedItemIds: [],
    }));
    toast.success(`Partial purchase order ${state.createdPartialOrders.length + 1} created successfully!`);

    if (state.createdPartialOrders.length + 1 === state.numberOfPartialOrders && state.usedItemIds.length === state.savedItems.length) {
      navigate("/view-quotation", { state: { quotationId: quotationData.id, partialOrders: state.createdPartialOrders } });
    }
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
                <h4 className="text-sm font-medium text-gray-700">Partial Order {index + 1}</h4>
                <div className="overflow-x-auto rounded-lg shadow-sm">
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
            className="bg-gray-200 text-black px-3 py-2 rounded hover:bg-gray-300"
          >
            Finish
          </button>
        </div>
      </div>
    </div>
  );
};

export default PartialOrderSelection;