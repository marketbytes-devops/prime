import { useState, useEffect } from 'react';
import apiClient from '../../helpers/apiClient';
import InputField from '../../components/InputField';

const Series = () => {
  const [state, setState] = useState({
    series: [],
    series_name: '',
    prefix: '',
    searchTerm: '',
    sortBy: 'series_name',
    error: null,
    currentPage: 1,
    itemsPerPage: 20,
  });

  useEffect(() => {
    apiClient.get('series/')
      .then(response => setState(prev => ({ ...prev, series: response.data, error: null })))
      .catch(err => setState(prev => ({ ...prev, error: err })));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!state.series_name.trim() || !state.prefix.trim()) {
      setState(prev => ({ ...prev, error: 'Series name and prefix are required.' }));
      return;
    }
    try {
      await apiClient.post('series/', { series_name: state.series_name, prefix: state.prefix });
      setState(prev => ({ ...prev, series_name: '', prefix: '', error: null, currentPage: 1 }));
      apiClient.get('series/')
        .then(response => setState(prev => ({ ...prev, series: response.data, error: null })))
        .catch(err => setState(prev => ({ ...prev, error: err })));
    } catch (err) {
      setState(prev => ({ ...prev, error: err }));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this series?')) {
      try {
        await apiClient.delete(`series/${id}/`);
        apiClient.get('series/')
          .then(response => setState(prev => ({ ...prev, series: response.data, error: null, currentPage: 1 })))
          .catch(err => setState(prev => ({ ...prev, error: err })));
      } catch (err) {
        setState(prev => ({ ...prev, error: err }));
      }
    }
  };

  const filteredSeries = state.series
    .filter(series => series.series_name.toLowerCase().includes(state.searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (state.sortBy === 'series_name') {
        return a.series_name.localeCompare(b.series_name);
      } else if (state.sortBy === 'prefix') {
        return a.prefix.localeCompare(b.prefix);
      } else if (state.sortBy === 'created_at') {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      return 0;
    });

  const totalPages = Math.ceil(filteredSeries.length / state.itemsPerPage);
  const startIndex = (state.currentPage - 1) * state.itemsPerPage;
  const endIndex = startIndex + state.itemsPerPage;
  const currentSeries = filteredSeries.slice(startIndex, endIndex);

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
      <h1 className="text-2xl font-bold mb-4">Series Management</h1>
      <form onSubmit={handleCreate} className="mb-6">
        <div className="grid gap-4 mb-4">
          <div>
            <label htmlFor="seriesName" className="block text-sm font-medium text-gray-700 mb-1">
              Series Name
            </label>
            <InputField
              type="text"
              placeholder="Enter series name"
              value={state.series_name}
              onChange={(e) => setState(prev => ({ ...prev, series_name: e.target.value }))}
              maxLength={100}
              title="Series name must be 100 characters or less"
            />
          </div>
          <div>
            <label htmlFor="prefix" className="block text-sm font-medium text-gray-700 mb-1">
              Prefix
            </label>
            <InputField
              type="text"
              placeholder="Enter prefix"
              value={state.prefix}
              onChange={(e) => setState(prev => ({ ...prev, prefix: e.target.value }))}
              maxLength={50}
              title="Prefix must be 50 characters or less"
            />
          </div>
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
        >
          Add Series
        </button>
      </form>
      <div className="mb-6 flex gap-4">
        <div className="flex-1">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search Series
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
            <option value="series_name">Name</option>
            <option value="prefix">Prefix</option>
            <option value="created_at">Creation Date</option>
          </select>
        </div>
      </div>
      <div className="grid gap-4">
        {currentSeries.length === 0 ? (
          <p className="text-gray-500">No series found.</p>
        ) : (
          currentSeries.map(series => (
            <div
              key={series.id}
              className="flex justify-between items-center p-4 border rounded bg-gray-50"
            >
              <div>
                <h3 className="text-lg font-medium">{series.series_name}</h3>
                <p className="text-sm text-gray-500">Prefix: {series.prefix}</p>
                <p className="text-sm text-gray-500">
                  Created: {new Date(series.created_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleDelete(series.id)}
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

export default Series;