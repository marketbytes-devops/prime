import React from 'react';
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
    series: [],
    deliveryNoteSeriesId: null,
    isLoading: true,
  });

  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [woRes, itemsRes, unitsRes, seriesRes] = await Promise.all([
          apiClient.get(`/work-orders/${id}/`),
          apiClient.get('items/'),
          apiClient.get('units/'),
          apiClient.get('/series/'),
        ]);

        const workOrder = woRes.data;
        const initialItems = workOrder.items.map((item) => ({
          id: item.id,
          item: item.item,
          name: itemsRes.data.find((i) => i.id === item.item)?.name || 'N/A',
          range: item.range || '',
          quantity: item.quantity || '',
          delivered_quantity: item.quantity || '',
          uom: unitsRes.data.find((u) => u.id === item.unit)?.id || '',
          remaining_quantity: item.quantity || 0,
          assigned_quantity: '',
          components: [], // e.g., [{ component: 'Make', value: 'BrandX' }, { component: 'Dial Size', value: '2 inches' }]
          showAdditionalInfo: false,
          error: '',
        }));

        const deliveryNoteSeries = seriesRes.data.find((s) => s.series_name === 'Delivery Note');
        if (!deliveryNoteSeries) {
          toast.error('Delivery Note series not found.');
        }

        setState((prev) => ({
          ...prev,
          selectedWorkOrder: workOrder,
          deliveryItems: initialItems.length > 0 ? initialItems : prev.deliveryItems,
          itemsList: itemsRes.data || [],
          units: unitsRes.data || [],
          series: seriesRes.data || [],
          deliveryNoteSeriesId: deliveryNoteSeries?.id || null,
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

  const handleComponentChange = (itemIndex, compIndex, field, value) => {
    setState((prev) => ({
      ...prev,
      deliveryItems: prev.deliveryItems.map((item, i) =>
        i === itemIndex
          ? {
              ...item,
              components: item.components.map((comp, ci) =>
                ci === compIndex ? { ...comp, [field]: value } : comp
              ),
            }
          : item
      ),
    }));
  };

  const addComponent = (itemIndex) => {
    setState((prev) => ({
      ...prev,
      deliveryItems: prev.deliveryItems.map((item, i) =>
        i === itemIndex
          ? {
              ...item,
              components: [...item.components, { component: '', value: '' }],
            }
          : item
      ),
    }));
  };

  const removeComponent = (itemIndex, compIndex) => {
    setState((prev) => ({
      ...prev,
      deliveryItems: prev.deliveryItems.map((item, i) =>
        i === itemIndex
          ? {
              ...item,
              components: item.components.filter((_, ci) => ci !== compIndex),
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

  const handleSplitDNComponentChange = (dnIndex, itemId, compIndex, field, value) => {
    setState((prev) => {
      const updatedSplitDNs = prev.createdSplitDNs.map((dn, i) => {
        if (i !== dnIndex) return dn;
        return {
          ...dn,
          items: dn.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  components: item.components.map((comp, ci) =>
                    ci === compIndex ? { ...comp, [field]: value } : comp
                  ),
                }
              : item
          ),
        };
      });
      return { ...prev, createdSplitDNs: updatedSplitDNs };
    });
  };

  const addSplitDNComponent = (dnIndex, itemId) => {
    setState((prev) => {
      const updatedSplitDNs = prev.createdSplitDNs.map((dn, i) => {
        if (i !== dnIndex) return dn;
        return {
          ...dn,
          items: dn.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  components: [...item.components, { component: '', value: '' }],
                }
              : item
          ),
        };
      });
      return { ...prev, createdSplitDNs: updatedSplitDNs };
    });
  };

  const removeSplitDNComponent = (dnIndex, itemId, compIndex) => {
    setState((prev) => {
      const updatedSplitDNs = prev.createdSplitDNs.map((dn, i) => {
        if (i !== dnIndex) return dn;
        return {
          ...dn,
          items: dn.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  components: item.components.filter((_, ci) => ci !== compIndex),
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

  const toggleSplitDNAdditionalInfo = (dnIndex, itemId) => {
    setState((prev) => ({
      ...prev,
      createdSplitDNs: prev.createdSplitDNs.map((dn, i) =>
        i === dnIndex
          ? {
              ...dn,
              items: dn.items.map((item) =>
                item.id === itemId
                  ? { ...item, showAdditionalInfo: !item.showAdditionalInfo }
                  : item
              ),
            }
          : dn
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
          range: '',
          quantity: '',
          delivered_quantity: '',
          uom: prev.deliveryItems[index].uom,
          remaining_quantity: 0,
          assigned_quantity: '',
          components: [],
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
    if (!state.deliveryType || !state.deliveryNoteSeriesId) return true;
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
        components: [...item.components], // Deep copy components
        showAdditionalInfo: false, // Initialize showAdditionalInfo for split DN items
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
        series: state.deliveryNoteSeriesId,
        items: [],
      };

      if (state.deliveryType === 'Single') {
        basePayload.items = state.deliveryItems.map((item) => ({
          item: item.item,
          range: item.range || null,
          quantity: parseInt(item.quantity) || null,
          delivered_quantity: parseInt(item.delivered_quantity) || null,
          uom: item.uom || null,
          components: item.components,
        }));
        await apiClient.post(`/work-orders/${state.selectedWorkOrder.id}/initiate-delivery/`, basePayload);
      } else if (state.deliveryType === 'Multiple') {
        for (const dn of state.createdSplitDNs) {
          basePayload.items = dn.items.map((item) => ({
            item: item.item,
            range: item.range || null,
            quantity: parseInt(item.quantity) || null,
            delivered_quantity: parseInt(item.delivered_quantity) || null,
            uom: item.uom || null,
            components: item.components,
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
                    {state.deliveryType === 'Single' && (
                      <>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Additional Info</th>
                        <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Actions</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {remainingItems.map((item, index) => (
                    <React.Fragment key={item.id}>
                      <tr className="border hover:bg-gray-50">
                        <td className="border p-2">
                          {state.deliveryType === 'Multiple' && state.numberOfSplitDNs ? (
                            <input
                              type="checkbox"
                              checked={state.selectedItemIds.includes(item.id)}
                              onChange={() => handleItemSelection(item.id)}
                              disabled={state.usedItemIds.includes(item.id)}
                            />
                          ) : (
                            index + 1
                          )}
                        </td>
                        <td className="border p-2">{item.name}</td>
                        <td className="border p-2">
                          <InputField
                            type="text"
                            value={item.range}
                            onChange={(e) => handleItemChange(index, 'range', e.target.value)}
                            className="w-full p-1 border rounded"
                          />
                        </td>
                        <td className="border p-2">
                          <InputField
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            className="w-full p-1 border rounded"
                            min="0"
                          />
                        </td>
                        <td className="border p-2">
                          <select
                            value={item.uom}
                            onChange={(e) => handleItemChange(index, 'uom', e.target.value)}
                            className="w-full p-1 border rounded"
                          >
                            <option value="">Select Unit</option>
                            {state.units.map((unit) => (
                              <option key={unit.id} value={unit.id}>
                                {unit.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="border p-2">
                          <InputField
                            type="number"
                            value={item.delivered_quantity}
                            onChange={(e) => handleItemChange(index, 'delivered_quantity', e.target.value)}
                            className="w-full p-1 border rounded"
                            min="0"
                          />
                        </td>
                        {state.deliveryType === 'Multiple' && state.numberOfSplitDNs && (
                          <>
                            <td className="border p-2">{item.remaining_quantity}</td>
                            <td className="border p-2">
                              <InputField
                                type="number"
                                value={item.assigned_quantity}
                                onChange={(e) => handleAssignedQuantityChange(item.id, e.target.value)}
                                className="w-full p-1 border rounded"
                                min="0"
                                max={item.remaining_quantity}
                              />
                              {item.error && <p className="text-red-500 text-xs">{item.error}</p>}
                            </td>
                          </>
                        )}
                        {state.deliveryType === 'Single' && (
                          <>
                            <td className="border p-2">
                              <Button
                                onClick={() => toggleAdditionalInfo(index)}
                                className="text-indigo-600 hover:text-indigo-800"
                              >
                                {item.showAdditionalInfo ? 'Hide Components' : 'Show Components'}
                              </Button>
                            </td>
                            <td className="border p-2">
                              <Button
                                onClick={() => addNewItem(index)}
                                className="text-green-600 hover:text-green-800"
                              >
                                Add Item
                              </Button>
                            </td>
                          </>
                        )}
                      </tr>
                      {state.deliveryType === 'Single' && item.showAdditionalInfo && (
                        <tr>
                          <td colSpan="8" className="border p-2">
                            <div className="pl-8">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Components for {item.name}</h4>
                              {item.components.length > 0 ? (
                                <table className="w-full border-collapse">
                                  <thead>
                                    <tr className="bg-gray-100">
                                      <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Component Name</th>
                                      <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Component Value</th>
                                      <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {item.components.map((comp, compIndex) => (
                                      <tr key={compIndex} className="border">
                                        <td className="border p-2">
                                          <InputField
                                            type="text"
                                            value={comp.component}
                                            onChange={(e) => handleComponentChange(index, compIndex, 'component', e.target.value)}
                                            placeholder="e.g., Make"
                                            className="w-full p-1 border rounded"
                                          />
                                        </td>
                                        <td className="border p-2">
                                          <InputField
                                            type="text"
                                            value={comp.value}
                                            onChange={(e) => handleComponentChange(index, compIndex, 'value', e.target.value)}
                                            placeholder="e.g., BrandX"
                                            className="w-full p-1 border rounded"
                                          />
                                        </td>
                                        <td className="border p-2">
                                          <Button
                                            onClick={() => removeComponent(index, compIndex)}
                                            className="text-red-600 hover:text-red-800"
                                          >
                                            Remove
                                          </Button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : (
                                <p className="text-gray-500 text-sm">No components added yet.</p>
                              )}
                              <Button
                                onClick={() => addComponent(index)}
                                className="mt-2 bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-1 rounded"
                              >
                                + Add Component
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No items available for this Work Order.</p>
          )}
        </div>
        {state.deliveryType === 'Multiple' && state.numberOfSplitDNs && (
          <div>
            <Button
              onClick={handleGenerateSplitDN}
              disabled={isGenerateDisabled()}
              className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded"
            >
              Generate Split Delivery Note
            </Button>
            {state.createdSplitDNs.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-black mb-2">Generated Split Delivery Notes</h3>
                {state.createdSplitDNs.map((dn, dnIndex) => (
                  <div key={dnIndex} className="mb-4 p-4 border rounded">
                    <div className="flex justify-between items-center">
                      <h4 className="text-md font-medium">Split Delivery Note {dnIndex + 1}</h4>
                      <Button
                        onClick={() => deleteSplitDN(dnIndex)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </Button>
                    </div>
                    <table className="w-full border-collapse mt-2">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border p-2 text-left text-sm font-medium text-gray-700">Description of Item</th>
                          <th className="border p-2 text-left text-sm font-medium text-gray-700">Range</th>
                          <th className="border p-2 text-left text-sm font-medium text-gray-700">Quantity</th>
                          <th className="border p-2 text-left text-sm font-medium text-gray-700">Unit</th>
                          <th className="border p-2 text-left text-sm font-medium text-gray-700">Components</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dn.items.map((item) => (
                          <React.Fragment key={item.id}>
                            <tr className="border">
                              <td className="border p-2">{item.name}</td>
                              <td className="border p-2">
                                <InputField
                                  type="text"
                                  value={item.range}
                                  onChange={(e) => handleSplitDNItemChange(dnIndex, item.id, 'range', e.target.value)}
                                  className="w-full p-1 border rounded"
                                />
                              </td>
                              <td className="border p-2">
                                <InputField
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => handleSplitDNItemChange(dnIndex, item.id, 'quantity', e.target.value)}
                                  className="w-full p-1 border rounded"
                                  min="0"
                                />
                                {item.error && <p className="text-red-500 text-xs">{item.error}</p>}
                              </td>
                              <td className="border p-2">
                                <select
                                  value={item.uom}
                                  onChange={(e) => handleSplitDNItemChange(dnIndex, item.id, 'uom', e.target.value)}
                                  className="w-full p-1 border rounded"
                                >
                                  <option value="">Select Unit</option>
                                  {state.units.map((unit) => (
                                    <option key={unit.id} value={unit.id}>
                                      {unit.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="border p-2">
                                <Button
                                  onClick={() => toggleSplitDNAdditionalInfo(dnIndex, item.id)}
                                  className="text-indigo-600 hover:text-indigo-800"
                                >
                                  {item.showAdditionalInfo ? 'Hide Components' : 'Show Components'}
                                </Button>
                              </td>
                            </tr>
                            {item.showAdditionalInfo && (
                              <tr>
                                <td colSpan="5" className="border p-2">
                                  <div className="pl-8">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Components for {item.name}</h4>
                                    {item.components.length > 0 ? (
                                      <table className="w-full border-collapse">
                                        <thead>
                                          <tr className="bg-gray-100">
                                            <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Component Name</th>
                                            <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Component Value</th>
                                            <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Actions</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {item.components.map((comp, compIndex) => (
                                            <tr key={compIndex} className="border">
                                              <td className="border p-2">
                                                <InputField
                                                  type="text"
                                                  value={comp.component}
                                                  onChange={(e) => handleSplitDNComponentChange(dnIndex, item.id, compIndex, 'component', e.target.value)}
                                                  placeholder="e.g., Make"
                                                  className="w-full p-1 border rounded"
                                                />
                                              </td>
                                              <td className="border p-2">
                                                <InputField
                                                  type="text"
                                                  value={comp.value}
                                                  onChange={(e) => handleSplitDNComponentChange(dnIndex, item.id, compIndex, 'value', e.target.value)}
                                                  placeholder="e.g., BrandX"
                                                  className="w-full p-1 border rounded"
                                                />
                                              </td>
                                              <td className="border p-2">
                                                <Button
                                                  onClick={() => removeSplitDNComponent(dnIndex, item.id, compIndex)}
                                                  className="text-red-600 hover:text-red-800"
                                                >
                                                  Remove
                                                </Button>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    ) : (
                                      <p className="text-gray-500 text-sm">No components added yet.</p>
                                    )}
                                    <Button
                                      onClick={() => addSplitDNComponent(dnIndex, item.id)}
                                      className="mt-2 bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-1 rounded"
                                    >
                                      + Add Component
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="flex justify-end">
          <Button
            onClick={handleSubmitDelivery}
            disabled={state.isSubmitting || isSubmitDisabled() || !hasPermission('delivery', 'create')}
            className={`px-4 py-2 rounded ${
              state.isSubmitting || isSubmitDisabled() || !hasPermission('delivery', 'create')
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {state.isSubmitting ? 'Submitting...' : 'Submit Delivery'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InitiateDelivery;