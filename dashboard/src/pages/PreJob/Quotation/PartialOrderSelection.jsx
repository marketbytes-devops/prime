import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../../helpers/apiClient';
import Button from '../../../components/Button';

const PartialOrderSelection = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { quotationData, itemsList } = location.state || {};
  const [state, setState] = useState({
    numberOfPartialOrders: '',
    selectedItemIds: [],
    savedItems: [],
    createdPartialOrders: [],
    usedItemIds: [],
  });

  useEffect(() => {
    if (quotationData?.items) {
      console.log('Quotation Data Items:', quotationData.items);
      setState(prev => ({ ...prev, savedItems: quotationData.items }));
    } else {
      console.warn('No quotation data or items found:', quotationData);
    }
  }, [quotationData]);

  const handleNumberOfPartialOrdersChange = e => {
    const value = e.target.value === '' ? '' : parseInt(e.target.value, 10);
    console.log('Number of Partial Orders Changed:', value);
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

  const handleItemSelection = itemId => {
    setState(prev => {
      const selectedItemIds = prev.selectedItemIds.includes(itemId)
        ? prev.selectedItemIds.filter(id => id !== itemId)
        : [...prev.selectedItemIds, itemId];
      const remainingItemsCount = prev.savedItems.length - prev.usedItemIds.length;
      const remainingPartialOrders = prev.numberOfPartialOrders - prev.createdPartialOrders.length;
      const maxItemsPerOrder =
        remainingPartialOrders > 1
          ? state.savedItems.length - (state.numberOfPartialOrders - 1)
          : remainingItemsCount;

      if (selectedItemIds.length > maxItemsPerOrder) {
        toast.error(`Cannot select more than ${maxItemsPerOrder} items for this partial order.`);
        return prev;
      }
      console.log('Selecting item:', itemId);
      return { ...prev, selectedItemIds };
    });
  };

  const isGenerateDisabled = () => {
    if (!state.numberOfPartialOrders) {
      console.log('Generate disabled: Number of partial orders not specified');
      return true;
    }
    if (state.createdPartialOrders.length >= state.numberOfPartialOrders) {
      console.log('Generate disabled: Maximum number of partial orders reached');
      return true;
    }
    if (state.selectedItemIds.length === 0) {
      console.log('Generate disabled: No items selected');
      return true;
    }
    const remainingItemsCount = state.savedItems.length - state.usedItemIds.length;
    const remainingPartialOrders = state.numberOfPartialOrders - state.createdPartialOrders.length;
    const maxItemsPerOrder =
      remainingPartialOrders > 1
        ? state.savedItems.length - (state.numberOfPartialOrders - 1)
        : remainingItemsCount;

    if (remainingPartialOrders > 1 && state.selectedItemIds.length > maxItemsPerOrder) {
      console.log('Generate disabled: Too many items selected for remaining partial orders');
      return true;
    }
    if (remainingPartialOrders === 1 && state.selectedItemIds.length !== remainingItemsCount) {
      console.log('Generate disabled: Must select all remaining items for the last partial order');
      return true;
    }
    if (state.selectedItemIds.some(id => state.usedItemIds.includes(id))) {
      console.log('Generate disabled: Includes already used items');
      return true;
    }
    return false;
  };

  const handleGeneratePartialOrder = async () => {
    console.log('Generating partial order with item IDs:', state.selectedItemIds);
    const remainingItemsCount = state.savedItems.length - state.usedItemIds.length;
    const remainingPartialOrders = state.numberOfPartialOrders - state.createdPartialOrders.length;

    try {
      const selectedItems = state.savedItems
        .filter(item => state.selectedItemIds.includes(item.id))
        .map(item => ({
          ...item,
          name: itemsList.find(i => i.id === item.item)?.name || 'N/A',
        }));
      if (!selectedItems.length) {
        toast.error('No valid items selected.');
        console.error('No valid items found for IDs:', state.selectedItemIds);
        return;
      }

      const formData = new FormData();
      formData.append('quotation', quotationData.id);
      formData.append('order_type', 'partial');
      formData.append(
        'items',
        JSON.stringify(
          selectedItems.map(item => ({
            item: item.item || null,
            quantity: item.quantity,
            unit: item.unit || null,
            unit_price: item.unit_price || null,
          }))
        )
      );

      console.log('Sending formData to API:', Object.fromEntries(formData));
      const response = await apiClient.post('/purchase-orders/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setState(prev => ({
        ...prev,
        createdPartialOrders: [...prev.createdPartialOrders, { ...response.data, items: selectedItems }],
        usedItemIds: [...prev.usedItemIds, ...prev.selectedItemIds],
        selectedItemIds: [],
      }));
      toast.success(`Partial purchase order ${state.createdPartialOrders.length + 1} created successfully!`);
      console.log('API Response:', response.data);
    } catch (err) {
      console.error('Failed to create partial purchase order:', err);
      toast.error('Failed to create partial purchase order: ' + (err.response?.data?.detail || 'Unknown error'));
    }
  };

  const handleFinish = () => {
    if (!state.numberOfPartialOrders) {
      toast.error('Please specify the number of partial orders.');
      console.warn('Number of partial orders not specified');
      return;
    }
    if (state.createdPartialOrders.length !== state.numberOfPartialOrders) {
      toast.error(`Please create exactly ${state.numberOfPartialOrders} partial orders.`);
      console.warn('Incorrect number of partial orders:', state.createdPartialOrders.length, state.numberOfPartialOrders);
      return;
    }
    if (state.usedItemIds.length !== state.savedItems.length) {
      toast.error('All items must be selected across partial orders.');
      console.warn('Not all items used:', state.usedItemIds, state.savedItems.length);
      return;
    }
    navigate('/view-quotation', {
      state: { quotationId: quotationData.id, partialOrders: state.createdPartialOrders, refresh: true },
    });
  };

  const remainingItems = state.savedItems
    .filter(item => !state.usedItemIds.includes(item.id))
    .map(item => ({
      ...item,
      name: itemsList.find(i => i.id === item.item)?.name || 'N/A',
    }));

  if (!quotationData || !state.savedItems.length) {
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
            value={state.numberOfPartialOrders}
            onChange={handleNumberOfPartialOrdersChange}
            className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            min="1"
            max={state.savedItems.length}
            placeholder="Enter number of partial orders"
            required
          />
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Note: You must create exactly {state.numberOfPartialOrders || 'the specified number of'} partial orders. For {state.numberOfPartialOrders > 1 ? `the first ${state.numberOfPartialOrders - 1}` : 'all'} partial order(s), you can select up to {state.savedItems.length - (state.numberOfPartialOrders - 1)} items. The last partial order must include all remaining items.
        </p>
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
                        <th className="px-4 py-2 text-sm font-medium text-black text-left whitespace-nowrap">
                          Total Price
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map(item => (
                        <tr key={item.id} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-black whitespace-nowrap">
                            {item.name || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-black whitespace-nowrap">
                            {item.quantity || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-black whitespace-nowrap">
                            {item.unit || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-black whitespace-nowrap">
                            ${item.unit_price != null ? Number(item.unit_price).toFixed(2) : '0.00'}
                          </td>
                          <td className="px-4 py-3 text-sm text-black whitespace-nowrap">
                            ${item.quantity && item.unit_price ? Number(item.quantity * item.unit_price).toFixed(2) : '0.00'}
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
              Select Items for Partial Order {state.createdPartialOrders.length + 1}
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              Selected items: {state.selectedItemIds.length} (Remaining: {remainingItems.length})
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
                    <th className="px-4 py-2 text-sm font-medium text-black text-left whitespace-nowrap">
                      Total Price
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {remainingItems.map(item => (
                    <tr key={item.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-black whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={state.selectedItemIds.includes(item.id)}
                          onChange={() => handleItemSelection(item.id)}
                          disabled={state.usedItemIds.includes(item.id)}
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-black whitespace-nowrap">
                        {item.name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-black whitespace-nowrap">
                        {item.quantity || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-black whitespace-nowrap">
                        {item.unit || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-black whitespace-nowrap">
                        ${item.unit_price != null ? Number(item.unit_price).toFixed(2) : '0.00'}
                      </td>
                      <td className="px-4 py-3 text-sm text-black whitespace-nowrap">
                        ${item.quantity && item.unit_price ? Number(item.quantity * item.unit_price).toFixed(2) : '0.00'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <div className="flex justify-end space-x-2">
          <Button
            onClick={handleGeneratePartialOrder}
            disabled={isGenerateDisabled()}
            className={`px-3 py-2 rounded transition-colors duration-200 flex items-center ${
              isGenerateDisabled()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            Generate Partial
          </Button>
          <Button
            onClick={handleFinish}
            className="bg-gray-200 text-black px-3 py-2 rounded hover:bg-gray-300"
          >
            Finish
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PartialOrderSelection;