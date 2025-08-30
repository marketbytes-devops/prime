import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../../../helpers/apiClient';
import InputField from '../../../components/InputField';
import Button from '../../../components/Button';

const InitiateDelivery = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({
    selectedWorkOrder: null,
    deliveryType: 'Single',
    deliveryItems: [],
    numberOfSplitDNs: '',
    createdSplitDNs: [],
    selectedItemIds: [],
    usedItemIds: [],
    isSubmitting: false,
    itemsList: [],
    units: [],
    isLoading: true,
  });

  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [woRes, itemsRes, unitsRes] = await Promise.all([
          apiClient.get(`/work-orders/${id}/`),
          apiClient.get('items/'),
          apiClient.get('units/'),
        ]);

        const workOrder = woRes.data;
        const initialItems = workOrder.items.map((item) => ({
          id: item.id,
          item: item.item,
          name: itemsRes.data.find((i) => i.id === item.item)?.name || 'N/A',
          make: '',
          dial_size: '',
          case: '',
          connection: '',
          wetted_parts: '',
          range: item.range || '',
          quantity: item.quantity || '',
          delivered_quantity: item.quantity || '',
          uom: unitsRes.data.find((u) => u.id === item.unit)?.id || '',
          remaining_quantity: item.quantity || 0,
          assigned_quantity: '',
          showAdditionalInfo: false,
          error: '',
        }));

        setState((prev) => ({
          ...prev,
          selectedWorkOrder: workOrder,
          deliveryItems: initialItems.length > 0 ? initialItems : prev.deliveryItems,
          itemsList: itemsRes.data || [],
          units: unitsRes.data || [],
          isLoading: false,
        }));
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load work order details.');
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    const fetchProfile = async () => {
      try {
        const response = await apiClient.get('/profile/');
        const user = response.data;
        setIsSuperadmin(user.is_superuser || user.role?.name === 'Superadmin');
        const roleId = user.role?.id;
        if (roleId) {
          const res = await apiClient.get(`/roles/${roleId}/`);
          setPermissions(res.data.permissions || []);
        } else {
          setPermissions([]);
        }
      } catch (error) {
        console.error('Unable to fetch user profile:', error);
        setPermissions([]);
        setIsSuperadmin(false);
      } finally {
        setIsLoadingPermissions(false);
      }
    };

    fetchProfile();
    fetchData();
  }, [id]);

  const hasPermission = (page, action) => {
    if (isSuperadmin) return true;
    const perm = permissions.find((p) => p.page === page);
    return perm && perm[`can_${action}`];
  };

  const handleDeliveryTypeChange = (e) => {
    setState((prev) => ({
      ...prev,
      deliveryType: e.target.value,
      createdSplitDNs: [],
      selectedItemIds: [],
      usedItemIds: [],
      numberOfSplitDNs: '',
      deliveryItems: prev.deliveryItems.map((item) => ({
        ...item,
        assigned_quantity: '',
        remaining_quantity: parseInt(item.quantity) || 0,
        error: '',
      })),
    }));
  };

  const handleNumberOfSplitDNsChange = (e) => {
    const value = e.target.value === '' ? '' : parseInt(e.target.value, 10);
    if (value && value < 1) {
      toast.error('Number of split delivery notes must be at least 1.');
      return;
    }
    setState((prev) => ({
      ...prev,
      numberOfSplitDNs: value,
      selectedItemIds: [],
      createdSplitDNs: [],
      usedItemIds: [],
      deliveryItems: prev.deliveryItems.map((item) => ({
        ...item,
        assigned_quantity: '',
        remaining_quantity: parseInt(item.quantity) || 0,
        error: '',
      })),
    }));
  };

  const handleItemSelection = (itemId) => {
    setState((prev) => {
      const selectedItemIds = prev.selectedItemIds.includes(itemId)
        ? prev.selectedItemIds.filter((id) => id !== itemId)
        : [...prev.selectedItemIds, itemId];
      return { ...prev, selectedItemIds };
    });
  };

  const handleItemChange = (index, field, value) => {
    setState((prev) => ({
      ...prev,
      deliveryItems: prev.deliveryItems.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: value,
              delivered_quantity: field === 'quantity' ? value : item.delivered_quantity,
              remaining_quantity: field === 'quantity' ? parseInt(value) || 0 : item.remaining_quantity,
              error: '',
            }
          : item
      ),
    }));
  };

  const handleAssignedQuantityChange = (itemId, value) => {
    const assignedQuantity = value === '' ? '' : parseInt(value, 10);
    setState((prev) => {
      const updatedItems = prev.deliveryItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              assigned_quantity: assignedQuantity,
              error:
                assignedQuantity !== '' &&
                (isNaN(assignedQuantity) || assignedQuantity < 0 || assignedQuantity > item.remaining_quantity)
                  ? `Quantity must be between 0 and ${item.remaining_quantity}`
                  : '',
            }
          : item
      );
      return { ...prev, deliveryItems: updatedItems };
    });
  };

  const handleSplitDNItemChange = (dnIndex, itemId, field, value) => {
    setState((prev) => {
      const updatedSplitDNs = prev.createdSplitDNs.map((dn, i) => {
        if (i !== dnIndex) return dn;
        return {
          ...dn,
          items: dn.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  [field]: field === 'quantity' || field === 'delivered_quantity' ? parseInt(value) || '' : value,
                  error:
                    field === 'quantity' && value !== '' && (isNaN(value) || parseInt(value) <= 0)
                      ? 'Quantity must be a positive number'
                      : '',
                }
              : item
          ),
        };
      });
      return { ...prev, createdSplitDNs: updatedSplitDNs };
    });
  };

  const toggleAdditionalInfo = (index) => {
    setState((prev) => ({
      ...prev,
      deliveryItems: prev.deliveryItems.map((item, i) =>
        i === index ? { ...item, showAdditionalInfo: !item.showAdditionalInfo } : item
      ),
    }));
  };

  const addNewItem = (index) => {
    setState((prev) => ({
      ...prev,
      deliveryItems: [
        ...prev.deliveryItems.slice(0, index + 1),
        {
          id: Date.now() + index,
          item: prev.deliveryItems[index].item,
          name: prev.itemsList.find((i) => i.id === prev.deliveryItems[index].item)?.name || 'N/A',
          make: '',
          dial_size: '',
          case: '',
          connection: '',
          wetted_parts: '',
          range: '',
          quantity: '',
          delivered_quantity: '',
          uom: prev.deliveryItems[index].uom,
          remaining_quantity: 0,
          assigned_quantity: '',
          showAdditionalInfo: false,
          error: '',
        },
        ...prev.deliveryItems.slice(index + 1),
      ],
    }));
  };

  const deleteSplitDN = (index) => {
    setState((prev) => {
      const deletedDN = prev.createdSplitDNs[index];
      const updatedItems = prev.deliveryItems.map((item) => {
        const deletedItem = deletedDN.items.find((di) => di.id === item.id);
        if (deletedItem) {
          return {
            ...item,
            remaining_quantity: (item.remaining_quantity || 0) + (parseInt(deletedItem.quantity) || 0),
            assigned_quantity: '',
            error: '',
          };
        }
        return item;
      });
      return {
        ...prev,
        createdSplitDNs: prev.createdSplitDNs.filter((_, i) => i !== index),
        usedItemIds: prev.usedItemIds.filter(
          (id) => !deletedDN.items.some((item) => item.id === id)
        ),
        deliveryItems: updatedItems,
      };
    });
    toast.success(`Split Delivery Note ${index + 1} deleted.`);
  };

  const isGenerateDisabled = () => {
    if (!state.numberOfSplitDNs || state.deliveryType !== 'Multiple') return true;
    if (state.createdSplitDNs.length >= state.numberOfSplitDNs) return true;
    if (state.selectedItemIds.length === 0) return true;
    const selectedItems = state.deliveryItems.filter((item) =>
      state.selectedItemIds.includes(item.id)
    );
    const allHaveValidAssignedQuantity = selectedItems.every(
      (item) =>
        item.assigned_quantity !== '' &&
        !isNaN(item.assigned_quantity) &&
        item.assigned_quantity > 0 &&
        item.assigned_quantity <= item.remaining_quantity
    );
    if (!allHaveValidAssignedQuantity) return true;
    const isLastSplitDN = state.createdSplitDNs.length + 1 === state.numberOfSplitDNs;
    if (isLastSplitDN) {
      const updatedItems = state.deliveryItems.map((item) =>
        selectedItems.find((selected) => selected.id === item.id)
          ? {
              ...item,
              remaining_quantity: item.remaining_quantity - (item.assigned_quantity || 0),
            }
          : item
      );
      return !updatedItems.every((item) => item.remaining_quantity === 0);
    }
    return false;
  };

  const isSubmitDisabled = () => {
    if (!state.deliveryType) return true;
    if (state.deliveryType === 'Single') {
      return !state.deliveryItems.every(
        (item) =>
          item.item &&
          item.quantity &&
          item.delivered_quantity &&
          item.uom &&
          parseInt(item.quantity) === parseInt(item.delivered_quantity)
      );
    }
    if (state.deliveryType === 'Multiple') {
      if (state.createdSplitDNs.length !== state.numberOfSplitDNs) return true;
      return !state.deliveryItems.every((item) => item.remaining_quantity === 0) ||
        !state.createdSplitDNs.every((dn) =>
          dn.items.every(
            (item) =>
              item.item &&
              item.uom &&
              item.quantity &&
              !isNaN(item.quantity) &&
              item.quantity > 0
          )
        );
    }
    return false;
  };

  const handleGenerateSplitDN = () => {
    const selectedItems = state.deliveryItems
      .filter((item) => state.selectedItemIds.includes(item.id))
      .map((item) => ({
        ...item,
        quantity: item.assigned_quantity,
        delivered_quantity: item.assigned_quantity,
      }));
    if (!selectedItems.length) {
      toast.error('No valid items selected.');
      return;
    }
    setState((prev) => {
      const updatedItems = prev.deliveryItems.map((item) =>
        prev.selectedItemIds.includes(item.id)
          ? {
              ...item,
              remaining_quantity: item.remaining_quantity - (parseInt(item.assigned_quantity) || 0),
              assigned_quantity: '',
            }
          : item
      );
      return {
        ...prev,
        createdSplitDNs: [...prev.createdSplitDNs, { items: selectedItems }],
        usedItemIds: [
          ...prev.usedItemIds,
          ...prev.selectedItemIds.filter((id) =>
            updatedItems.find((item) => item.id === id && item.remaining_quantity === 0)
          ),
        ],
        selectedItemIds: [],
        deliveryItems: updatedItems,
      };
    });
    toast.success(`Split Delivery Note ${state.createdSplitDNs.length + 1} generated successfully!`);
  };

  const handleSubmitDelivery = async () => {
    if (isSubmitDisabled()) {
      toast.error('Please complete all required fields and ensure all quantities are assigned.');
      return;
    }

    if (!window.confirm('Are you sure you want to submit the delivery?')) {
      return;
    }

    setState((prev) => ({ ...prev, isSubmitting: true }));

    try {
      const basePayload = {
        delivery_type: state.deliveryType,
        items: [],
      };

      if (state.deliveryType === 'Single') {
        basePayload.items = state.deliveryItems.map((item) => ({
          item: item.item,
          make: item.make || null,
          dial_size: item.dial_size || null,
          case: item.case || null,
          connection: item.connection || null,
          wetted_parts: item.wetted_parts || null,
          range: item.range || null,
          quantity: parseInt(item.quantity) || null,
          delivered_quantity: parseInt(item.delivered_quantity) || null,
          uom: item.uom || null,
        }));
        await apiClient.post(`/work-orders/${state.selectedWorkOrder.id}/initiate-delivery/`, basePayload);
      } else if (state.deliveryType === 'Multiple') {
        for (const dn of state.createdSplitDNs) {
          basePayload.items = dn.items.map((item) => ({
            item: item.item,
            make: item.make || null,
            dial_size: item.dial_size || null,
            case: item.case || null,
            connection: item.connection || null,
            wetted_parts: item.wetted_parts || null,
            range: item.range || null,
            quantity: parseInt(item.quantity) || null,
            delivered_quantity: parseInt(item.delivered_quantity) || null,
            uom: item.uom || null,
          }));
          await apiClient.post(`/work-orders/${state.selectedWorkOrder.id}/initiate-delivery/`, basePayload);
        }
      }

      toast.success('Delivery initiated successfully as ' + state.deliveryType + ' Delivery Note(s).');
      navigate('/job-execution/processing-work-orders/delivery');
    } catch (error) {
      console.error('Error initiating delivery:', error);
      toast.error('Failed to initiate delivery.');
      setState((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  const remainingItems = state.deliveryItems.filter((item) => !state.usedItemIds.includes(item.id));

  if (state.isLoading || isLoadingPermissions) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="mx-auto p-6 max-w-7xl">
      <h1 className="text-2xl font-bold mb-6">Initiate Delivery for Work Order - {state.selectedWorkOrder?.wo_number || 'N/A'}</h1>
      <div className="bg-white p-6 space-y-6 rounded-md shadow">
        <div className="flex items-center justify-between">
          <div className="w-1/3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Type</label>
            <select
              value={state.deliveryType}
              onChange={handleDeliveryTypeChange}
              className="w-full p-2 border rounded focus:outline-indigo-500"
            >
              <option value="Single">Single DN</option>
              <option value="Multiple">Multiple DN</option>
            </select>
          </div>
          {state.deliveryType === 'Multiple' && (
            <div className="w-1/3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Split Delivery Notes</label>
              <InputField
                type="number"
                value={state.numberOfSplitDNs}
                onChange={handleNumberOfSplitDNsChange}
                className="w-full p-2 border rounded"
                min="1"
                placeholder="Enter number of split DNs"
              />
            </div>
          )}
        </div>
        {state.deliveryType === 'Multiple' && state.numberOfSplitDNs && (
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-black">
              Creating Split Delivery Note {state.createdSplitDNs.length + 1} of {state.numberOfSplitDNs}
            </h3>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-indigo-600 h-2.5 rounded-full"
                style={{ width: `${(state.createdSplitDNs.length / state.numberOfSplitDNs) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
        <div>
          <h3 className="text-lg font-medium text-black mb-2">Items</h3>
          {state.deliveryItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">
                      {state.deliveryType === 'Multiple' && state.numberOfSplitDNs ? 'Select' : 'SL'}
                    </th>
                    <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Description of Item</th>
                    <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Range</th>
                    <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Quantity</th>
                    <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Unit</th>
                    <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Delivered Quantity</th>
                    {state.deliveryType === 'Multiple' && state.numberOfSplitDNs && (
                      <>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Remaining Quantity</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Assigned Quantity</th>
                      </>
                    )}
                    <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {state.deliveryItems.map((item, index) => (
                    <tr key={item.id} className="border">
                      <td className="border p-2 whitespace-nowrap">
                        {state.deliveryType === 'Multiple' && state.numberOfSplitDNs ? (
                          <input
                            type="checkbox"
                            checked={state.selectedItemIds.includes(item.id)}
                            onChange={() => handleItemSelection(item.id)}
                            disabled={item.remaining_quantity === 0 || state.createdSplitDNs.length >= state.numberOfSplitDNs}
                          />
                        ) : (
                          index + 1
                        )}
                      </td>
                      <td className="border p-2 whitespace-nowrap">
                        <select
                          value={item.item}
                          onChange={(e) => handleItemChange(index, 'item', e.target.value)}
                          className="w-full p-2 border rounded"
                          disabled={
                            state.deliveryType === 'Multiple' &&
                            state.numberOfSplitDNs &&
                            state.usedItemIds.includes(item.id)
                          }
                        >
                          <option value="">Select Item</option>
                          {state.itemsList.map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.name}
                            </option>
                          ))}
                        </select>
                        {item.showAdditionalInfo && (
                          <div className="mt-2 p-2 border rounded bg-gray-50">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Make</label>
                                <InputField
                                  type="text"
                                  value={item.make}
                                  onChange={(e) => handleItemChange(index, 'make', e.target.value)}
                                  className="w-full p-2 border rounded"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Dial Size</label>
                                <InputField
                                  type="text"
                                  value={item.dial_size}
                                  onChange={(e) => handleItemChange(index, 'dial_size', e.target.value)}
                                  className="w-full p-2 border rounded"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Case</label>
                                <InputField
                                  type="text"
                                  value={item.case}
                                  onChange={(e) => handleItemChange(index, 'case', e.target.value)}
                                  className="w-full p-2 border rounded"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Connection</label>
                                <InputField
                                  type="text"
                                  value={item.connection}
                                  onChange={(e) => handleItemChange(index, 'connection', e.target.value)}
                                  className="w-full p-2 border rounded"
                                />
                              </div>
                              <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Wetted Parts</label>
                                <InputField
                                  type="text"
                                  value={item.wetted_parts}
                                  onChange={(e) => handleItemChange(index, 'wetted_parts', e.target.value)}
                                  className="w-full p-2 border rounded"
                                />
                              </div>
                            </div>
                            <Button
                              onClick={() => addNewItem(index)}
                              className="mt-2 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm whitespace-nowrap"
                            >
                              + Add Item
                            </Button>
                          </div>
                        )}
                        {item.error && <p className="text-red-500 text-sm mt-1">{item.error}</p>}
                      </td>
                      <td className="border p-2 whitespace-nowrap">
                        <InputField
                          type="text"
                          value={item.range}
                          onChange={(e) => handleItemChange(index, 'range', e.target.value)}
                          className="w-full p-2 border rounded"
                        />
                      </td>
                      <td className="border p-2 whitespace-nowrap">
                        <InputField
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          className="w-full p-2 border rounded"
                          min="0"
                        />
                      </td>
                      <td className="border p-2 whitespace-nowrap">
                        <select
                          value={item.uom}
                          onChange={(e) => handleItemChange(index, 'uom', e.target.value)}
                          className="w-full p-2 border rounded"
                        >
                          <option value="">Select Unit</option>
                          {state.units.map((unit) => (
                            <option key={unit.id} value={unit.id}>
                              {unit.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="border p-2 whitespace-nowrap">
                        <InputField
                          type="number"
                          value={item.delivered_quantity}
                          onChange={(e) => handleItemChange(index, 'delivered_quantity', e.target.value)}
                          className="w-full p-2 border rounded"
                          min="0"
                        />
                      </td>
                      {state.deliveryType === 'Multiple' && state.numberOfSplitDNs && (
                        <>
                          <td className="border p-2 whitespace-nowrap">{item.remaining_quantity || '0'}</td>
                          <td className="border p-2 whitespace-nowrap">
                            <InputField
                              type="number"
                              value={item.assigned_quantity}
                              onChange={(e) => handleAssignedQuantityChange(item.id, e.target.value)}
                              className="w-full p-2 border rounded"
                              min="0"
                              max={item.remaining_quantity}
                              disabled={
                                !state.selectedItemIds.includes(item.id) ||
                                item.remaining_quantity === 0 ||
                                state.createdSplitDNs.length >= state.numberOfSplitDNs
                              }
                              placeholder="Enter quantity"
                            />
                          </td>
                        </>
                      )}
                      <td className="border p-2 whitespace-nowrap">
                        <Button
                          onClick={() => toggleAdditionalInfo(index)}
                          className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm whitespace-nowrap"
                        >
                          {item.showAdditionalInfo ? 'Hide Additional Info' : 'Show Additional Info'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No items available.</p>
          )}
          {state.deliveryType === 'Multiple' && state.numberOfSplitDNs && (
            <div className="mt-4">
              <Button
                onClick={handleGenerateSplitDN}
                disabled={isGenerateDisabled()}
                className={`px-4 py-2 rounded-md whitespace-nowrap ${
                  isGenerateDisabled()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Generate Split DN {state.createdSplitDNs.length + 1}
              </Button>
            </div>
          )}
        </div>
        {state.createdSplitDNs.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-black mb-2">Created Split Delivery Notes</h3>
            {state.createdSplitDNs.map((dn, index) => (
              <div key={index} className="mb-4 p-4 border rounded bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-md font-medium">Split Delivery Note {index + 1}</h4>
                  <Button
                    onClick={() => deleteSplitDN(index)}
                    className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm whitespace-nowrap"
                  >
                    Delete
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Description of Item</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Make</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Dial Size</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Case</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Connection</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Wetted Parts</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Range</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Quantity</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dn.items.map((item) => (
                        <tr key={item.id} className="border">
                          <td className="border p-2 whitespace-nowrap">
                            <select
                              value={item.item}
                              onChange={(e) => handleSplitDNItemChange(index, item.id, 'item', e.target.value)}
                              className="w-full p-2 border rounded"
                            >
                              <option value="">Select Item</option>
                              {state.itemsList.map((i) => (
                                <option key={i.id} value={i.id}>
                                  {i.name}
                                </option>
                              ))}
                            </select>
                            {item.error && <p className="text-red-500 text-sm mt-1">{item.error}</p>}
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            <InputField
                              type="text"
                              value={item.make}
                              onChange={(e) => handleSplitDNItemChange(index, item.id, 'make', e.target.value)}
                              className="w-full p-2 border rounded"
                            />
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            <InputField
                              type="text"
                              value={item.dial_size}
                              onChange={(e) => handleSplitDNItemChange(index, item.id, 'dial_size', e.target.value)}
                              className="w-full p-2 border rounded"
                            />
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            <InputField
                              type="text"
                              value={item.case}
                              onChange={(e) => handleSplitDNItemChange(index, item.id, 'case', e.target.value)}
                              className="w-full p-2 border rounded"
                            />
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            <InputField
                              type="text"
                              value={item.connection}
                              onChange={(e) => handleSplitDNItemChange(index, item.id, 'connection', e.target.value)}
                              className="w-full p-2 border rounded"
                            />
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            <InputField
                              type="text"
                              value={item.wetted_parts}
                              onChange={(e) => handleSplitDNItemChange(index, item.id, 'wetted_parts', e.target.value)}
                              className="w-full p-2 border rounded"
                            />
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            <InputField
                              type="text"
                              value={item.range}
                              onChange={(e) => handleSplitDNItemChange(index, item.id, 'range', e.target.value)}
                              className="w-full p-2 border rounded"
                            />
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            <InputField
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleSplitDNItemChange(index, item.id, 'quantity', e.target.value)}
                              className="w-full p-2 border rounded"
                              min="0"
                            />
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            <select
                              value={item.uom}
                              onChange={(e) => handleSplitDNItemChange(index, item.id, 'uom', e.target.value)}
                              className="w-full p-2 border rounded"
                            >
                              <option value="">Select Unit</option>
                              {state.units.map((unit) => (
                                <option key={unit.id} value={unit.id}>
                                  {unit.name}
                                </option>
                              ))}
                            </select>
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
        <div className="flex justify-end gap-2 mt-6">
          <Button
            onClick={handleSubmitDelivery}
            disabled={state.isSubmitting || !hasPermission('delivery', 'edit') || isSubmitDisabled()}
            className={`px-4 py-2 rounded-md whitespace-nowrap ${
              state.isSubmitting || !hasPermission('delivery', 'edit') || isSubmitDisabled()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {state.isSubmitting ? 'Submitting...' : 'Submit Delivery'}
          </Button>
          <Button
            onClick={() => navigate('/job-execution/processing-work-orders/delivery')}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 whitespace-nowrap"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InitiateDelivery;