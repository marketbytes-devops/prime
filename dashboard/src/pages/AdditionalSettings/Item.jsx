import { useState, useEffect } from 'react';
import apiClient from '../../helpers/apiClient';
import InputField from '../../components/InputField';

const Item = () => {
  const [state, setState] = useState({
    items: [],
    name: '',
    searchTerm: '',
    sortBy: 'name',
    error: null,
    currentPage: 1,
    itemsPerPage: 20,
  });

  useEffect(() => {
    apiClient.get('items/')
      .then(response => setState(prev => ({ ...prev, items: response.data, error: null })))
      .catch(err => setState(prev => ({ ...prev, error: err })));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!state.name.trim()) {
      setState(prev => ({ ...prev, error: 'Item name is required.' }));
      return;
    }
    try {
      await apiClient.post('items/', { name: state.name });
      setState(prev => ({ ...prev, name: '', error: null, currentPage: 1 }));
      apiClient.get('items/')
        .then(response => setState(prev => ({ ...prev, items: response.data, error: null })))
        .catch(err => setState(prev => ({ ...prev, error: err })));
    } catch (err) {
      setState(prev => ({ ...prev, error: err }));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await apiClient.delete(`items/${id}/`);
        apiClient.get('items/')
          .then(response => setState(prev => ({ ...prev, items: response.data, error: null, currentPage: 1 })))
          .catch(err => setState(prev => ({ ...prev, error: err })));
      } catch (err) {
        setState(prev => ({ ...prev, error: err }));
      }
    }
  };

  const filteredItems = state.items
    .filter(item => item.name.toLowerCase().includes(state.searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (state.sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (state.sortBy === 'created_at') {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      return 0;
    });

  const totalPages = Math.ceil(filteredItems.length / state.itemsPerPage);
  const startIndex = (state.currentPage - 1) * state.itemsPerPage;
  const endIndex = startIndex + state.itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, endIndex);

  const pageGroupSize = 3;
  const currentGroup = Math.floor((state.currentPage - 1) / pageGroupSize);
  const startPage = currentGroup * pageGroupSize + 1;
  const endPage = Math.min(startPage + pageGroupSize - 1, totalPages);
  const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  const handlePageChange = (page) => {
    setState(prev => ({ ...prev, currentPage: page }));
  };

  const handleNext = () => {
    if (state.currentPage < totalPages) {
      setState(prev => ({ ...prev, currentPage: prev.currentPage + 1 }));
    }
  };

  const handlePrev = () => {
    if (state.currentPage > 1) {
      setState(prev => ({ ...prev, currentPage: prev.currentPage - 1 }));
    }
  };

  return (
    <div className="mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Item Management</h1>
      <form onSubmit={handleCreate} className="mb-6">
        <div className="mb-4">
          <label htmlFor="itemName" className="block text-sm font-medium text-gray-700 mb-1">
            Item Name
          </label>
          <InputField
            type="text"
            placeholder="Enter item name"
            value={state.name}
            onChange={(e) => setState(prev => ({ ...prev, name: e.target.value }))}
            maxLength={255}
            title="Item name must be 255 characters or less"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
        >
          Add Item
        </button>
      </form>
      <div className="mb-6 flex gap-4">
        <div className="flex-1">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search Items
          </label>
          <InputField
            type="text"
            placeholder="Search by name..."
            value={state.searchTerm}
            onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
          />
        </div>
        <div>
          <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
            Sort By
          </label>
          <select
            id="sort"
            value={state.sortBy}
            onChange={(e) => setState(prev => ({ ...prev, sortBy: e.target.value }))}
            className="p-2 border rounded focus:outline-indigo-500"
          >
            <option value="name">Name</option>
            <option value="created_at">Creation Date</option>
          </select>
        </div>
      </div>
      <div className="grid gap-4">
        {currentItems.length === 0 ? (
          <p className="text-gray-500">No items found.</p>
        ) : (
          currentItems.map(item => (
            <div
              key={item.id}
              className="flex justify-between items-center p-4 border rounded bg-gray-50"
            >
              <div>
                <h3 className="text-lg font-medium">{item.name}</h3>
                <p className="text-sm text-gray-500">
                  Created: {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleDelete(item.id)}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            onClick={handlePrev}
            disabled={state.currentPage === 1}
            className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:bg-gray-300"
          >
            Prev
          </button>
          {pageNumbers.map(page => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1 rounded ${
                state.currentPage === page
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={handleNext}
            disabled={state.currentPage === totalPages}
            className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:bg-gray-300"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Item;