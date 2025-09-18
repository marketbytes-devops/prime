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
          uom: item.unit || '',
          remaining_quantity: item.quantity || 0,
          assigned_quantity: '',
          components: [],
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
    const totalQuantity = state.deliveryItems.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);

    if (value && value < 1) {
      toast.error('Number of split delivery notes must be at least 1.');
      return;
    }
    if (value && value > totalQuantity) {
      toast.error(`Number of split delivery notes cannot exceed total item quantity (${totalQuantity}).`);
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
          ? { ...item, components: [...item.components, { component: '', value: '' }] }
          : item
      ),
    }));
  };

  const removeComponent = (itemIndex, compIndex) => {
    setState((prev) => ({
      ...prev,
      deliveryItems: prev.deliveryItems.map((item, i) =>
        i === itemIndex
          ? { ...item, components: item.components.filter((_, ci) => ci !== compIndex) }
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
                  [field]:
                    field === 'quantity' || field === 'delivered_quantity' ? parseInt(value) || '' : value,
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
              ? { ...item, components: [...item.components, { component: '', value: '' }] }
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
              ? { ...item, components: item.components.filter((_, ci) => ci !== compIndex) }
              : item
          ),
        };
      });
      return { ...prev, createdSplitDNs: updatedSplitDNs };
    });
  };

  const toggleAdditionalInfo = (itemId) => {
    setState((prev) => ({
      ...prev,
      deliveryItems: prev.deliveryItems.map((item) =>
        item.id === itemId ? { ...item, showAdditionalInfo: !item.showAdditionalInfo } : item
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
                item.id === itemId ? { ...item, showAdditionalInfo: !item.showAdditionalInfo } : item
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
          id: Date.now() + Math.random(),
          item: prev.itemsList[0]?.id || '',
          name: prev.itemsList[0]?.name || 'N/A',
          range: '',
          quantity: '',
          delivered_quantity: '',
          uom: prev.units[0]?.id || '',
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
    const selectedItems = state.deliveryItems.filter((item) => state.selectedItemIds.includes(item.id));
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
          ? { ...item, remaining_quantity: item.remaining_quantity - (item.assigned_quantity || 0) }
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
      return (
        !state.deliveryItems.every((item) => item.remaining_quantity === 0) ||
        !state.createdSplitDNs.every((dn) =>
          dn.items.every((item) => item.item && item.uom && item.quantity && !isNaN(item.quantity) && item.quantity > 0)
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
        components: [...item.components],
        showAdditionalInfo: false,
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
      if (state.deliveryType === 'Single') {
        const payload = {
          delivery_type: state.deliveryType,
          items: state.deliveryItems.map((item) => ({
            item: item.item,
            range: item.range || null,
            quantity: parseInt(item.quantity) || null,
            delivered_quantity: parseInt(item.delivered_quantity) || null,
            uom: item.uom || null,
            components: item.components,
          })),
        };
        const response = await apiClient.post(`/work-orders/${state.selectedWorkOrder.id}/initiate-delivery/`, payload);
        toast.success(`Delivery initiated successfully as ${state.deliveryType} Delivery Note (${response.data.dn_number}).`);
      } else if (state.deliveryType === 'Multiple') {
        for (const dn of state.createdSplitDNs) {
          const payload = {
            delivery_type: state.deliveryType,
            items: dn.items.map((item) => ({
              item: item.item,
              range: item.range || null,
              quantity: parseInt(item.quantity) || null,
              delivered_quantity: parseInt(item.delivered_quantity) || null,
              uom: item.uom || null,
              components: item.components,
            })),
          };
          const response = await apiClient.post(`/work-orders/${state.selectedWorkOrder.id}/initiate-delivery/`, payload);
          toast.success(`Delivery initiated successfully as ${state.deliveryType} Delivery Note (${response.data.dn_number}).`);
        }
      }

      navigate('/job-execution/processing-work-orders/pending-deliveries');
    } catch (error) {
      console.error('Error initiating delivery:', error);
      toast.error('Failed to initiate delivery.');
      setState((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  const getUnitName = (unitId) => {
    const unit = state.units.find((u) => u.id === unitId);
    return unit ? unit.name : 'N/A';
  };

  const remainingItems = state.deliveryItems.filter((item) => !state.usedItemIds.includes(item.id));
  const totalQuantity = state.deliveryItems.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);

  if (state.isLoading || isLoadingPermissions) {
    return <div className="text-center p-4">Loading...</div>;
  }

  return (
    <div className="mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        Initiate Delivery for Work Order - {state.selectedWorkOrder?.wo_number || 'N/A'}
      </h1>
      <div className="bg-white p-4 space-y-4 rounded-md shadow w-full">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Type</label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="Single"
                checked={state.deliveryType === 'Single'}
                onChange={handleDeliveryTypeChange}
                className="mr-2"
                disabled={!hasPermission('delivery', 'edit')}
              />
              Single DN
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="Multiple"
                checked={state.deliveryType === 'Multiple'}
                onChange={handleDeliveryTypeChange}
                className="mr-2"
                disabled={!hasPermission('delivery', 'edit')}
              />
              Multiple DN
            </label>
          </div>
        </div>
        {state.deliveryType === 'Multiple' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Split Delivery Notes</label>
            <InputField
              type="number"
              value={state.numberOfSplitDNs}
              onChange={handleNumberOfSplitDNsChange}
              className="w-full"
              min="1"
              max={totalQuantity}
              disabled={!hasPermission('delivery', 'edit')}
            />
            <p className="text-sm text-gray-500 mt-1">Total item quantity: {totalQuantity}</p>
          </div>
        )}
        {state.deliveryType === 'Multiple' && state.numberOfSplitDNs && (
          <h2 className="text-lg font-semibold mb-2">
            Creating Split Delivery Note {state.createdSplitDNs.length + 1} of {state.numberOfSplitDNs}
          </h2>
        )}
        <h2 className="text-lg font-semibold mb-2">Items</h2>
        {state.deliveryItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  {state.deliveryType === 'Multiple' && state.numberOfSplitDNs && (
                    <th className="border p-2 text-left text-sm font-medium text-gray-700">Select</th>
                  )}
                  <th className="border p-2 text-left text-sm font-medium text-gray-700">SL</th>
                  <th className="border p-2 text-left text-sm font-medium text-gray-700">Description of Item</th>
                  <th className="border p-2 text-left text-sm font-medium text-gray-700">Range</th>
                  <th className="border p-2 text-left text-sm font-medium text-gray-700">Quantity</th>
                  <th className="border p-2 text-left text-sm font-medium text-gray-700">Unit</th>
                  <th className="border p-2 text-left text-sm font-medium text-gray-700">Delivered Quantity</th>
                  {state.deliveryType === 'Multiple' && state.numberOfSplitDNs && (
                    <>
                      <th className="border p-2 text-left text-sm font-medium text-gray-700">Remaining Quantity</th>
                      <th className="border p-2 text-left text-sm font-medium text-gray-700">Assigned Quantity</th>
                    </>
                  )}
                  <th className="border p-2 text-left text-sm font-medium text-gray-700">Additional Info</th>
                  <th className="border p-2 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {remainingItems.map((item, index) => (
                  <React.Fragment key={`item-${item.id}`}>
                    <tr className="border hover:bg-gray-50">
                      {state.deliveryType === 'Multiple' && state.numberOfSplitDNs && (
                        <td className="border p-2">
                          <input
                            type="checkbox"
                            checked={state.selectedItemIds.includes(item.id)}
                            onChange={() => handleItemSelection(item.id)}
                            disabled={state.usedItemIds.includes(item.id) || !hasPermission('delivery', 'edit')}
                          />
                        </td>
                      )}
                      <td className="border p-2">{index + 1}</td>
                      <td className="border p-2">
                        <select
                          value={item.item}
                          onChange={(e) => {
                            const selectedItem = state.itemsList.find((i) => i.id === parseInt(e.target.value));
                            const itemIndex = state.deliveryItems.findIndex((di) => di.id === item.id);
                            handleItemChange(itemIndex, 'item', parseInt(e.target.value));
                            handleItemChange(itemIndex, 'name', selectedItem?.name || 'N/A');
                            handleItemChange(itemIndex, 'uom', selectedItem?.uom || '');
                          }}
                          className="w-full p-2 border rounded focus:outline-indigo-500"
                          disabled={!hasPermission('delivery', 'edit')}
                        >
                          <option value="">Select Item</option>
                          {state.itemsList.map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="border p-2">
                        <InputField
                          value={item.range}
                          onChange={(e) => {
                            const itemIndex = state.deliveryItems.findIndex((di) => di.id === item.id);
                            handleItemChange(itemIndex, 'range', e.target.value);
                          }}
                          className="w-full"
                          disabled={!hasPermission('delivery', 'edit')}
                        />
                      </td>
                      <td className="border p-2">
                        <InputField
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const itemIndex = state.deliveryItems.findIndex((di) => di.id === item.id);
                            handleItemChange(itemIndex, 'quantity', e.target.value);
                          }}
                          className="w-full"
                          min="0"
                          disabled={!hasPermission('delivery', 'edit')}
                        />
                      </td>
                      <td className="border p-2">
                        <select
                          value={item.uom}
                          onChange={(e) => {
                            const itemIndex = state.deliveryItems.findIndex((di) => di.id === item.id);
                            handleItemChange(itemIndex, 'uom', e.target.value);
                          }}
                          className="w-full p-2 border rounded focus:outline-indigo-500"
                          disabled={!hasPermission('delivery', 'edit')}
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
                          onChange={(e) => {
                            const itemIndex = state.deliveryItems.findIndex((di) => di.id === item.id);
                            handleItemChange(itemIndex, 'delivered_quantity', e.target.value);
                          }}
                          className="w-full"
                          min="0"
                          disabled={!hasPermission('delivery', 'edit')}
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
                              className="w-full"
                              min="0"
                              max={item.remaining_quantity}
                              disabled={!hasPermission('delivery', 'edit')}
                            />
                            {item.error && <p className="text-red-500 text-xs">{item.error}</p>}
                          </td>
                        </>
                      )}
                      <td className="border p-2">
                        <button
                          onClick={() => toggleAdditionalInfo(item.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                          disabled={!hasPermission('delivery', 'edit')}
                        >
                          {item.showAdditionalInfo ? 'Hide Components' : 'Show Components'}
                        </button>
                      </td>
                      <td className="border p-2">
                        <button
                          onClick={() => addNewItem(index)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                          disabled={!hasPermission('delivery', 'edit')}
                        >
                          Add Item
                        </button>
                      </td>
                    </tr>
                    {item.showAdditionalInfo && (
                      <tr key={`components-${item.id}`}>
                        <td
                          colSpan={state.deliveryType === 'Multiple' && state.numberOfSplitDNs ? 10 : 8}
                          className="border p-2"
                        >
                          <h3 className="text-md font-semibold">Components for {item.name}</h3>
                          {item.components.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse bg-gray-50 mt-2">
                                <thead>
                                  <tr className="bg-gray-100">
                                    <th className="border p-2 text-left text-sm font-medium text-gray-700">
                                      Component Name
                                    </th>
                                    <th className="border p-2 text-left text-sm font-medium text-gray-700">
                                      Component Value
                                    </th>
                                    <th className="border p-2 text-left text-sm font-medium text-gray-700">
                                      Actions
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {item.components.map((comp, compIndex) => (
                                    <tr key={compIndex} className="border hover:bg-gray-100">
                                      <td className="border p-2">
                                        <InputField
                                          value={comp.component}
                                          onChange={(e) => {
                                            const itemIndex = state.deliveryItems.findIndex((di) => di.id === item.id);
                                            handleComponentChange(itemIndex, compIndex, 'component', e.target.value);
                                          }}
                                          placeholder="e.g., Make"
                                          className="w-full"
                                          disabled={!hasPermission('delivery', 'edit')}
                                        />
                                      </td>
                                      <td className="border p-2">
                                        <InputField
                                          value={comp.value}
                                          onChange={(e) => {
                                            const itemIndex = state.deliveryItems.findIndex((di) => di.id === item.id);
                                            handleComponentChange(itemIndex, compIndex, 'value', e.target.value);
                                          }}
                                          placeholder="e.g., BrandX"
                                          className="w-full"
                                          disabled={!hasPermission('delivery', 'edit')}
                                        />
                                      </td>
                                      <td className="border p-2">
                                        <button
                                          onClick={() => {
                                            const itemIndex = state.deliveryItems.findIndex((di) => di.id === item.id);
                                            removeComponent(itemIndex, compIndex);
                                          }}
                                          className="text-red-600 hover:text-red-800 text-sm"
                                          disabled={!hasPermission('delivery', 'edit')}
                                        >
                                          Remove
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-gray-500">No components added yet.</p>
                          )}
                          <Button
                            onClick={() => {
                              const itemIndex = state.deliveryItems.findIndex((di) => di.id === item.id);
                              addComponent(itemIndex);
                            }}
                            className="mt-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                            disabled={!hasPermission('delivery', 'edit')}
                          >
                            + Add Component
                          </Button>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No items available for this Work Order.</p>
        )}
        {state.deliveryType === 'Multiple' && state.numberOfSplitDNs && (
          <div className="mt-6">
            <Button
              onClick={handleGenerateSplitDN}
              disabled={isGenerateDisabled() || !hasPermission('delivery', 'edit')}
              className={`px-3 py-1 rounded-md text-sm ${
                isGenerateDisabled() || !hasPermission('delivery', 'edit')
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Generate Split Delivery Note
            </Button>
            {state.createdSplitDNs.length > 0 && (
              <div className="mt-6 space-y-4">
                <h2 className="text-lg font-semibold">Generated Split Delivery Notes</h2>
                {state.createdSplitDNs.map((dn, dnIndex) => (
                  <div key={dnIndex} className="p-4 bg-white rounded-md shadow">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-md font-semibold">Split Delivery Note {dnIndex + 1}</h3>
                      <button
                        onClick={() => deleteSplitDN(dnIndex)}
                        className="text-red-600 hover:text-red-800 text-sm"
                        disabled={!hasPermission('delivery', 'edit')}
                      >
                        Delete
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border p-2 text-left text-sm font-medium text-gray-700">Description of Item</th>
                            <th className="border p-2 text-left text-sm font-medium text-gray-700">Range</th>
                            <th className="border p-2 text-left text-sm font-medium text-gray-700">Quantity</th>
                            <th className="border p-2 text-left text-sm font-medium text-gray-700">Unit</th>
                            <th className="border p-2 text-left text-sm font-medium text-gray-700">Additional Info</th>
                            <th className="border p-2 text-left text-sm font-medium text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dn.items.map((item, itemIndex) => (
                            <React.Fragment key={`split-item-${dnIndex}-${item.id}`}>
                              <tr className="border hover:bg-gray-50">
                                <td className="border p-2">{item.name}</td>
                                <td className="border p-2">
                                  <InputField
                                    value={item.range}
                                    onChange={(e) =>
                                      handleSplitDNItemChange(dnIndex, item.id, 'range', e.target.value)
                                    }
                                    className="w-full"
                                    disabled={!hasPermission('delivery', 'edit')}
                                  />
                                </td>
                                <td className="border p-2">
                                  <InputField
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) =>
                                      handleSplitDNItemChange(dnIndex, item.id, 'quantity', e.target.value)
                                    }
                                    className="w-full"
                                    min="0"
                                    disabled={!hasPermission('delivery', 'edit')}
                                  />
                                  {item.error && <p className="text-red-500 text-xs">{item.error}</p>}
                                </td>
                                <td className="border p-2">
                                  <select
                                    value={item.uom}
                                    onChange={(e) =>
                                      handleSplitDNItemChange(dnIndex, item.id, 'uom', e.target.value)
                                    }
                                    className="w-full p-2 border rounded focus:outline-indigo-500"
                                    disabled={!hasPermission('delivery', 'edit')}
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
                                  <button
                                    onClick={() => toggleSplitDNAdditionalInfo(dnIndex, item.id)}
                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                    disabled={!hasPermission('delivery', 'edit')}
                                  >
                                    {item.showAdditionalInfo ? 'Hide Components' : 'Show Components'}
                                  </button>
                                </td>
                                <td className="border p-2">
                                  <button
                                    onClick={() => addSplitDNComponent(dnIndex, item.id)}
                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                    disabled={!hasPermission('delivery', 'edit')}
                                  >
                                    Add Component
                                  </button>
                                </td>
                              </tr>
                              {item.showAdditionalInfo && (
                                <tr key={`split-components-${dnIndex}-${item.id}`}>
                                  <td colSpan="6" className="border p-2">
                                    <h3 className="text-md font-semibold">Components for {item.name}</h3>
                                    {item.components.length > 0 ? (
                                      <div className="overflow-x-auto">
                                        <table className="w-full border-collapse bg-gray-50 mt-2">
                                          <thead>
                                            <tr className="bg-gray-100">
                                              <th className="border p-2 text-left text-sm font-medium text-gray-700">
                                                Component Name
                                              </th>
                                              <th className="border p-2 text-left text-sm font-medium text-gray-700">
                                                Component Value
                                              </th>
                                              <th className="border p-2 text-left text-sm font-medium text-gray-700">
                                                Actions
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {item.components.map((comp, compIndex) => (
                                              <tr key={compIndex} className="border hover:bg-gray-100">
                                                <td className="border p-2">
                                                  <InputField
                                                    value={comp.component}
                                                    onChange={(e) =>
                                                      handleSplitDNComponentChange(
                                                        dnIndex,
                                                        item.id,
                                                        compIndex,
                                                        'component',
                                                        e.target.value
                                                      )
                                                    }
                                                    placeholder="e.g., Make"
                                                    className="w-full"
                                                    disabled={!hasPermission('delivery', 'edit')}
                                                  />
                                                </td>
                                                <td className="border p-2">
                                                  <InputField
                                                    value={comp.value}
                                                    onChange={(e) =>
                                                      handleSplitDNComponentChange(
                                                        dnIndex,
                                                        item.id,
                                                        compIndex,
                                                        'value',
                                                        e.target.value
                                                      )
                                                    }
                                                    placeholder="e.g., BrandX"
                                                    className="w-full"
                                                    disabled={!hasPermission('delivery', 'edit')}
                                                  />
                                                </td>
                                                <td className="border p-2">
                                                  <button
                                                    onClick={() => removeSplitDNComponent(dnIndex, item.id, compIndex)}
                                                    className="text-red-600 hover:text-red-800 text-sm"
                                                    disabled={!hasPermission('delivery', 'edit')}
                                                  >
                                                    Remove
                                                  </button>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    ) : (
                                      <p className="text-gray-500">No components added yet.</p>
                                    )}
                                    <Button
                                      onClick={() => addSplitDNComponent(dnIndex, item.id)}
                                      className="mt-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                                      disabled={!hasPermission('delivery', 'edit')}
                                    >
                                      + Add Component
                                    </Button>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <Button
            onClick={() => navigate('/job-execution/processing-work-orders/pending-deliveries')}
            className="px-3 py-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmitDelivery}
            disabled={isSubmitDisabled() || state.isSubmitting || !hasPermission('delivery', 'edit')}
            className={`px-3 py-1 rounded-md text-sm ${
              isSubmitDisabled() || state.isSubmitting || !hasPermission('delivery', 'edit')
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
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