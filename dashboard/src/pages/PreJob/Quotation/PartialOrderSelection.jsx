import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import apiClient from "../../../helpers/apiClient";

const PartialOrderSelection = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { quotationData } = location.state || {};
  const [numberOfPartialOrders, setNumberOfPartialOrders] = useState("");
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [createdPartialOrders, setCreatedPartialOrders] = useState([]);
  const [usedItemIds, setUsedItemIds] = useState([]);

  useEffect(() => {
    if (quotationData?.items) {
      console.log("Quotation Data Items:", quotationData.items);
      setSavedItems(quotationData.items);
    } else {
      console.warn("No quotation data or items found:", quotationData);
    }
  }, [quotationData]);

  const handleNumberOfPartialOrdersChange = (e) => {
    const value = e.target.value === "" ? "" : parseInt(e.target.value, 10);
    console.log("Number of Partial Orders Changed:", value);
    if (value && (value < 1 || value > savedItems.length)) {
      toast.error(`Number of partial orders must be between 1 and ${savedItems.length}.`);
      return;
    }
    setNumberOfPartialOrders(value);
    setSelectedItemIds([]);
    setCreatedPartialOrders([]);
    setUsedItemIds([]);
  };

  const handleItemSelection = (itemId) => {
    setSelectedItemIds((prev) => {
      if (prev.includes(itemId)) {
        console.log("Deselecting item:", itemId);
        return prev.filter((id) => id !== itemId);
      }
      const remainingItemsCount = savedItems.length - usedItemIds.length;
      const remainingPartialOrders = numberOfPartialOrders - createdPartialOrders.length;
      const maxItemsPerOrder = remainingPartialOrders > 1 ? savedItems.length - (numberOfPartialOrders - 1) : remainingItemsCount;
      
      if (prev.length >= maxItemsPerOrder) {
        toast.error(`Cannot select more than ${maxItemsPerOrder} items for this partial order.`);
        console.warn("Max items per order exceeded:", maxItemsPerOrder);
        return prev;
      }
      console.log("Selecting item:", itemId);
      return [...prev, itemId];
    });
  };

  const isGenerateDisabled = () => {
    if (!numberOfPartialOrders) {
      console.log("Generate disabled: Number of partial orders not specified");
      return true;
    }
    if (createdPartialOrders.length >= numberOfPartialOrders) {
      console.log("Generate disabled: Maximum number of partial orders reached");
      return true;
    }
    if (selectedItemIds.length === 0) {
      console.log("Generate disabled: No items selected");
      return true;
    }
    const remainingItemsCount = savedItems.length - usedItemIds.length;
    const remainingPartialOrders = numberOfPartialOrders - createdPartialOrders.length;
    const maxItemsPerOrder = remainingPartialOrders > 1 ? savedItems.length - (numberOfPartialOrders - 1) : remainingItemsCount;
    
    if (remainingPartialOrders > 1 && selectedItemIds.length > maxItemsPerOrder) {
      console.log("Generate disabled: Too many items selected for remaining partial orders");
      return true;
    }
    if (remainingPartialOrders === 1 && selectedItemIds.length !== remainingItemsCount) {
      console.log("Generate disabled: Must select all remaining items for the last partial order");
      return true;
    }
    if (selectedItemIds.some((id) => usedItemIds.includes(id))) {
      console.log("Generate disabled: Includes already used items");
      return true;
    }
    return false;
  };

  const handleGeneratePartialOrder = async () => {
    console.log("Generating partial order with item IDs:", selectedItemIds);
    const remainingItemsCount = savedItems.length - usedItemIds.length;
    const remainingPartialOrders = numberOfPartialOrders - createdPartialOrders.length;

    try {
      const selectedItems = savedItems.filter((item) => selectedItemIds.includes(item.id));
      if (!selectedItems.length) {
        toast.error("No valid items selected.");
        console.error("No valid items found for IDs:", selectedItemIds);
        return;
      }

      const formData = new FormData();
      formData.append("quotation", quotationData.id);
      formData.append("order_type", "partial");
      formData.append("client_po_number", "");
      formData.append(
        "items",
        JSON.stringify(
          selectedItems.map((item) => ({
            item: item.item || null,
            quantity: item.quantity,
            unit: item.unit || null,
            unit_price: item.unit_price || null,
          }))
        )
      );

      console.log("Sending formData to API:", Object.fromEntries(formData));
      const response = await apiClient.post("/purchase-orders/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newPartialOrder = { ...response.data, items: selectedItems };
      setCreatedPartialOrders((prev) => [...prev, newPartialOrder]);
      setUsedItemIds((prev) => [...prev, ...selectedItemIds]);
      setSelectedItemIds([]);
      toast.success(`Partial purchase order ${createdPartialOrders.length + 1} created successfully!`);
      console.log("API Response:", response.data);
    } catch (err) {
      console.error("Failed to create partial purchase order:", err);
      toast.error("Failed to create partial purchase order: " + (err.response?.data?.detail || "Unknown error"));
    }
  };

  const handleFinish = () => {
    if (!numberOfPartialOrders) {
      toast.error("Please specify the number of partial orders.");
      console.warn("Number of partial orders not specified");
      return;
    }
    if (createdPartialOrders.length !== numberOfPartialOrders) {
      toast.error(`Please create exactly ${numberOfPartialOrders} partial orders.`);
      console.warn("Incorrect number of partial orders:", createdPartialOrders.length, numberOfPartialOrders);
      return;
    }
    if (usedItemIds.length !== savedItems.length) {
      toast.error("All items must be selected across partial orders.");
      console.warn("Not all items used:", usedItemIds, savedItems.length);
      return;
    }
    navigate("/pre-job/view-quotation", { state: { quotationId: quotationData.id, partialOrders: createdPartialOrders, refresh: true } });
  };

  const remainingItems = savedItems.filter((item) => !usedItemIds.includes(item.id));

  if (!quotationData || !quotationData.items || quotationData.items.length === 0) {
    return <p className="text-red-600 text-center">No quotation data or items found.</p>;
  }

  return (
    <div className="container mx-auto p-4 bg-transparent min-h-screen">
      <h2 className="text-xl font-semibold mb-4 text-black">Partial Order Selection for Quotation ID {quotationData.id}</h2>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Number of Partial Orders</label>
          <input
            type="number"
            value={numberOfPartialOrders}
            onChange={handleNumberOfPartialOrdersChange}
            className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            min="1"
            max={savedItems.length}
            placeholder="Enter number of partial orders"
            required
          />
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Note: You must create exactly {numberOfPartialOrders || "the specified number of"} partial orders. For {numberOfPartialOrders > 1 ? "the first " + (numberOfPartialOrders - 1) : "all"} partial order(s), you can select up to {savedItems.length - (numberOfPartialOrders - 1)} items. The last partial order must include all remaining items.
        </p>

        {createdPartialOrders.length > 0 && (
          <div className="mb-6">
            <h3 className="text-md font-semibold mb-2 text-black">Created Partial Orders</h3>
            {createdPartialOrders.map((order, index) => (
              <div key={index} className="mb-4">
                <h4 className="text-sm font-medium text-gray-700">Partial Order {index + 1}</h4>
                <div className="overflow-x-auto rounded-lg shadow-sm">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 text-sm font-medium text-black text-left whitespace-nowrap">
                          Item
                        </th>
                        <th className="px-4 py-2 text-sm font-medium text-black text-left whitespace-nowrap">
                          Quantity
                        </th>
                        <th className="px-4 py-2 text-sm font-medium text-black text-left whitespace-nowrap">
                          Unit
                        </th>
                        <th className="px-4 py-2 text-sm font-medium text-black text-left whitespace-nowrap">
                          Unit Price
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item) => (
                        <tr key={item.id} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-black whitespace-nowrap">
                            {item.item_name || ""}
                          </td>
                          <td className="px-4 py-3 text-sm text-black whitespace-nowrap">
                            {item.quantity || ""}
                          </td>
                          <td className="px-4 py-3 text-sm text-black whitespace-nowrap">
                            {item.unit || ""}
                          </td>
                          <td className="px-4 py-3 text-sm text-black whitespace-nowrap">
                            ${item.unit_price != null ? Number(item.unit_price).toFixed(2) : "0.00"}
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

        {remainingItems.length > 0 && (
          <div className="mb-4">
            <h3 className="text-md font-semibold mb-2 text-black">
              Select Items for Partial Order {createdPartialOrders.length + 1}
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              Selected items: {selectedItemIds.length} (Remaining: {remainingItems.length})
            </p>
            <div className="overflow-x-auto rounded-lg shadow-sm">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-sm font-medium text-black text-left whitespace-nowrap">
                      Select
                    </th>
                    <th className="px-4 py-2 text-sm font-medium text-black text-left whitespace-nowrap">
                      Item
                    </th>
                    <th className="px-4 py-2 text-sm font-medium text-black text-left whitespace-nowrap">
                      Quantity
                    </th>
                    <th className="px-4 py-2 text-sm font-medium text-black text-left whitespace-nowrap">
                      Unit
                    </th>
                    <th className="px-4 py-2 text-sm font-medium text-black text-left whitespace-nowrap">
                      Unit Price
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {remainingItems.map((item) => (
                    <tr key={item.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-black whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedItemIds.includes(item.id)}
                          onChange={() => handleItemSelection(item.id)}
                          disabled={usedItemIds.includes(item.id)}
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-black whitespace-nowrap">
                        {item.item_name || ""}
                      </td>
                      <td className="px-4 py-3 text-sm text-black whitespace-nowrap">
                        {item.quantity || ""}
                      </td>
                      <td className="px-4 py-3 text-sm text-black whitespace-nowrap">
                        {item.unit || ""}
                      </td>
                      <td className="px-4 py-3 text-sm text-black whitespace-nowrap">
                        ${item.unit_price != null ? Number(item.unit_price).toFixed(2) : "0.00"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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