import { useState, useEffect } from 'react';
import apiClient from '../../helpers/apiClient';
import InputField from '../../components/InputField';

const Team = () => {
  const [state, setState] = useState({
    members: [],
    technicians: [],
    memberType: 'team',
    name: '',
    designation: '',
    email: '',
    searchTerm: '',
    sortBy: 'name',
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
    const perm = permissions.find((p) => p.page === 'team'); // Use 'team' for both teams and technicians
    return perm && perm[`can_${action}`];
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const teamResponse = await apiClient.get('teams/');
        const techResponse = await apiClient.get('technicians/');
        setState(prev => ({ ...prev, members: teamResponse.data, technicians: techResponse.data, error: null }));
      } catch (err) {
        setState(prev => ({ ...prev, error: err }));
      }
    };
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!hasPermission('team', 'add')) {
      setState(prev => ({ ...prev, error: `You do not have permission to add a ${state.memberType === 'team' ? 'team member' : 'technician'}.` }));
      return;
    }
    if (!state.name.trim() || !state.email.trim()) {
      setState(prev => ({ ...prev, error: 'Name and email are required.' }));
      return;
    }
    try {
      const url = state.memberType === 'team' ? 'teams/' : 'technicians/';
      await apiClient.post(url, { name: state.name, designation: state.designation, email: state.email });
      setState(prev => ({ ...prev, name: '', designation: '', email: '', error: null, currentPage: 1 }));
      const teamResponse = await apiClient.get('teams/');
      const techResponse = await apiClient.get('technicians/');
      setState(prev => ({ ...prev, members: teamResponse.data, technicians: techResponse.data, error: null }));
    } catch (err) {
      setState(prev => ({ ...prev, error: err }));
    }
  };

  const handleDelete = async (id, type) => {
    if (!hasPermission('team', 'delete')) {
      setState(prev => ({ ...prev, error: `You do not have permission to delete a ${type === 'team' ? 'team member' : 'technician'}.` }));
      return;
    }
    if (window.confirm(`Are you sure you want to delete this ${type === 'team' ? 'team member' : 'technician'}?`)) {
      try {
        const url = type === 'team' ? `teams/${id}/` : `technicians/${id}/`;
        await apiClient.delete(url);
        const teamResponse = await apiClient.get('teams/');
        const techResponse = await apiClient.get('technicians/');
        setState(prev => ({ ...prev, members: teamResponse.data, technicians: techResponse.data, error: null, currentPage: 1 }));
      } catch (err) {
        setState(prev => ({ ...prev, error: err }));
      }
    }
  };

  const getFilteredItems = () => {
    const items = state.memberType === 'team' ? state.members : state.technicians;
    return items
      .filter(member => member.name.toLowerCase().includes(state.searchTerm.toLowerCase()))
      .sort((a, b) => {
        if (state.sortBy === 'name') {
          return a.name.localeCompare(b.name);
        } else if (state.sortBy === 'designation') {
          return a.designation ? a.designation.localeCompare(b.designation || '') : -1;
        } else if (state.sortBy === 'created_at') {
          return new Date(b.created_at) - new Date(a.created_at);
        }
        return 0;
      });
  };

  const filteredItems = getFilteredItems();
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
      <h1 className="text-2xl font-bold mb-4">Team Management</h1>
      {state.error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
          {state.error.message || 'An error occurred.'}
        </div>
      )}
      <form onSubmit={handleCreate} className="mb-6">
        <div className="grid gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Member Type
            </label>
            <div className="flex items-center space-x-4">
              <div className='flex items-center justify-center space-x-1'>
                <input
                  type="radio"
                  value="team"
                  checked={state.memberType === 'team'}
                  onChange={() => setState(prev => ({ ...prev, memberType: 'team' }))}
                /> <span>Team Member</span>
              </div>

              <div className='flex items-center justify-center space-x-1'>
                <input
                  type="radio"
                  value="technician"
                  checked={state.memberType === 'technician'}
                  onChange={() => setState(prev => ({ ...prev, memberType: 'technician' }))}
                /> <span>Technician</span></div>
            </div>
          </div>
          <div>
            <label htmlFor="memberName" className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <InputField
              type="text"
              placeholder="Enter member name"
              value={state.name}
              onChange={(e) => setState(prev => ({ ...prev, name: e.target.value }))}
              maxLength={100}
              title="Name must be 100 characters or less"
            />
          </div>
          <div>
            <label htmlFor="designation" className="block text-sm font-medium text-gray-700 mb-1">
              Designation
            </label>
            <InputField
              type="text"
              placeholder="Enter designation"
              value={state.designation}
              onChange={(e) => setState(prev => ({ ...prev, designation: e.target.value }))}
              maxLength={100}
              title="Designation must be 100 characters or less"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <InputField
              type="email"
              placeholder="Enter email"
              value={state.email}
              onChange={(e) => setState(prev => ({ ...prev, email: e.target.value }))}
              title="Enter a valid email address"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={!hasPermission('team', 'add')}
          className={`px-4 py-2 rounded ${hasPermission('team', 'add')
            ? 'bg-indigo-500 text-white hover:bg-indigo-600'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
        >
          Add {state.memberType === 'team' ? 'Member' : 'Technician'}
        </button>
      </form>
      <div className="mb-6 flex gap-4">
        <div className="flex-1">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search Members
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
            <option value="designation">Designation</option>
            <option value="created_at">Creation Date</option>
          </select>
        </div>
      </div>
      <div className="grid gap-4">
        {currentItems.length === 0 ? (
          <p className="text-gray-500">No {state.memberType === 'team' ? 'team members' : 'technicians'} found.</p>
        ) : (
          currentItems.map(member => (
            <div
              key={member.id}
              className="flex justify-between items-center p-4 border rounded bg-gray-50"
            >
              <div>
                <h3 className="text-lg font-medium">{member.name}</h3>
                <p className="text-sm text-gray-500">{member.designation || 'No designation'}</p>
                <p className="text-sm text-gray-500">{member.email}</p>
                <p className="text-sm text-gray-500">
                  Created: {new Date(member.created_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleDelete(member.id, state.memberType)}
                disabled={!hasPermission('team', 'delete')}
                className={`px-3 py-1 rounded ${hasPermission('team', 'delete')
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
              className={`px-3 py-1 rounded ${state.currentPage === page
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

export default Team;