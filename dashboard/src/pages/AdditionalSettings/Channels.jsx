import { useState, useEffect } from 'react';
import apiClient from '../../helpers/apiClient';
import InputField from '../../components/InputField';

const Channels = () => {
  const [state, setState] = useState({
    channels: [],
    channel_name: '',
    searchTerm: '',
    sortBy: 'channel_name',
    error: null,
    currentPage: 1,
    itemsPerPage: 20,
  });
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);

  useEffect(() => {
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
  }, []);

  const hasPermission = (page, action) => {
    if (isSuperadmin) return true;
    const perm = permissions.find((p) => p.page === page);
    return perm && perm[`can_${action}`];
  };

  useEffect(() => {
    apiClient.get('channels/')
      .then(response => setState(prev => ({ ...prev, channels: response.data, error: null })))
      .catch(err => setState(prev => ({ ...prev, error: err })));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!hasPermission('rfq_channel', 'add')) {
      setState(prev => ({ ...prev, error: 'You do not have permission to add a channel.' }));
      return;
    }
    if (!state.channel_name.trim()) {
      setState(prev => ({ ...prev, error: 'Channel name is required.' }));
      return;
    }
    try {
      await apiClient.post('channels/', { channel_name: state.channel_name });
      setState(prev => ({ ...prev, channel_name: '', error: null, currentPage: 1 }));
      apiClient.get('channels/')
        .then(response => setState(prev => ({ ...prev, channels: response.data, error: null })))
        .catch(err => setState(prev => ({ ...prev, error: err })));
    } catch (err) {
      setState(prev => ({ ...prev, error: err }));
    }
  };

  const handleDelete = async (id) => {
    if (!hasPermission('rfq_channel', 'delete')) {
      setState(prev => ({ ...prev, error: 'You do not have permission to delete a channel.' }));
      return;
    }
    if (window.confirm('Are you sure you want to delete this channel?')) {
      try {
        await apiClient.delete(`channels/${id}/`);
        apiClient.get('channels/')
          .then(response => setState(prev => ({ ...prev, channels: response.data, error: null, currentPage: 1 })))
          .catch(err => setState(prev => ({ ...prev, error: err })));
      } catch (err) {
        setState(prev => ({ ...prev, error: err }));
      }
    }
  };

  const filteredChannels = state.channels
    .filter(channel => channel.channel_name.toLowerCase().includes(state.searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (state.sortBy === 'channel_name') {
        return a.channel_name.localeCompare(b.channel_name);
      }
      return 0;
    });

  const totalPages = Math.ceil(filteredChannels.length / state.itemsPerPage);
  const startIndex = (state.currentPage - 1) * state.itemsPerPage;
  const endIndex = startIndex + state.itemsPerPage;
  const currentChannels = filteredChannels.slice(startIndex, endIndex);

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
      <h1 className="text-2xl font-bold mb-4">Channel Management</h1>
      {state.error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
          {state.error.message || 'An error occurred.'}
        </div>
      )}
      <form onSubmit={handleCreate} className="mb-6">
        <div className="mb-4">
          <label htmlFor="channelName" className="block text-sm font-medium text-gray-700 mb-1">
            Channel Name
          </label>
          <InputField
            type="text"
            placeholder="Enter channel name"
            value={state.channel_name}
            onChange={(e) => setState(prev => ({ ...prev, channel_name: e.target.value }))}
            maxLength={100}
            title="Channel name must be 100 characters or less"
          />
        </div>
        <button
          type="submit"
          disabled={!hasPermission('rfq_channel', 'add')}
          className={`px-4 py-2 rounded ${
            hasPermission('rfq_channel', 'add')
              ? 'bg-indigo-500 text-white hover:bg-indigo-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Add Channel
        </button>
      </form>
      <div className="mb-6 flex gap-4">
        <div className="flex-1">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search Channels
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
            <option value="channel_name">Name</option>
          </select>
        </div>
      </div>
      <div className="grid gap-4">
        {currentChannels.length === 0 ? (
          <p className="text-gray-500">No channels found.</p>
        ) : (
          currentChannels.map(channel => (
            <div
              key={channel.id}
              className="flex justify-between items-center p-4 border rounded bg-gray-50"
            >
              <div>
                <h3 className="text-lg font-medium">{channel.channel_name}</h3>
              </div>
              <button
                onClick={() => handleDelete(channel.id)}
                disabled={!hasPermission('rfq_channel', 'delete')}
                className={`px-3 py-1 rounded ${
                  hasPermission('rfq_channel', 'delete')
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
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

export default Channels;