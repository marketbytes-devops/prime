import { useState, useEffect } from 'react';
import apiClient from '../../helpers/apiClient';

const Dashboard = () => {
  const [counts, setCounts] = useState({
    rfqs: 0,
    quotations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        setLoading(true);
        const [rfqsRes, quotationsRes] = await Promise.all([
          apiClient.get('/rfqs/'),
          apiClient.get('/quotations/'),
        ]);
        setCounts({
          rfqs: rfqsRes.data?.length || 0,
          quotations: quotationsRes.data?.length || 0,
        });
      } catch (err) {
        console.error('Error fetching counts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4 text-black">Dashboard</h2>
      <p className="text-gray-600 mb-6">Welcome to the Admin Dashboard. Monitor your RFQs and Quotations below.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white shadow-md rounded-lg p-6 flex items-center space-x-4 hover:shadow-lg transition-shadow">
          <div className="p-3 bg-indigo-100 rounded-full">
            <svg
              className="w-6 h-6 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-700">Total RFQs</h3>
            <p className="text-2xl font-bold text-indigo-600">
              {loading ? 'Loading...' : counts.rfqs}
            </p>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6 flex items-center space-x-4 hover:shadow-lg transition-shadow">
          <div className="p-3 bg-green-100 rounded-full">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-700">Total Quotations</h3>
            <p className="text-2xl font-bold text-green-600">
              {loading ? 'Loading...' : counts.quotations}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;