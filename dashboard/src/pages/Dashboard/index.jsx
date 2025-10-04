import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import apiClient from '../../helpers/apiClient';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const [counts, setCounts] = useState({
    rfqs: 0,
    quotations: 0,
    purchaseOrders: 0,
    workOrders: 0,
    deliveryNotes: 0,
    closedWorkOrders: 0,
    overdueWorkOrders: 0,
    invoices: 0,
  });
  const [loading, setLoading] = useState(true);
  const chartRef = useRef(null);

  const chartData = {
    labels: ['RFQs', 'Quotations', 'Purchase Orders', 'Work Orders', 'Delivery Notes', 'Invoices'], 
    datasets: [
      {
        label: 'Counts',
        data: [
          counts.rfqs,
          counts.quotations,
          counts.purchaseOrders,
          counts.workOrders,
          counts.deliveryNotes,
          counts.invoices, 
        ],
        backgroundColor: [
          'rgba(79, 70, 229, 0.2)', 
          'rgba(16, 185, 129, 0.2)', 
          'rgba(59, 130, 246, 0.2)', 
          'rgba(147, 51, 234, 0.2)',
          'rgba(245, 158, 11, 0.2)', 
          'rgba(236, 72, 153, 0.2)', 
        ],
        borderColor: [
          'rgba(79, 70, 229, 1)', 
          'rgba(16, 185, 129, 1)', 
          'rgba(59, 130, 246, 1)', 
          'rgba(147, 51, 234, 1)',
          'rgba(245, 158, 11, 1)', 
          'rgba(236, 72, 153, 1)', 
        ],
        borderWidth: 1,
      },
    ],
  };

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        setLoading(true);
        const [
          rfqsRes,
          quotationsRes,
          poRes,
          woRes,
          dnRes,
          closedWoRes,
          invoicesRes,
        ] = await Promise.all([
          apiClient.get('/rfqs/'),
          apiClient.get('/quotations/'),
          apiClient.get('/purchase-orders/'),
          apiClient.get('/work-orders/'),
          apiClient.get('/delivery-notes/'),
          apiClient.get('/work-orders/?status=Completed'),
          apiClient.get('/invoices/?status=processed'),
        ]);
        console.log('Invoices Response:', invoicesRes.data); 
        setCounts({
          rfqs: rfqsRes.data?.length || 0,
          quotations: quotationsRes.data?.length || 0,
          purchaseOrders: poRes.data?.length || 0,
          workOrders: woRes.data?.length || 0,
          deliveryNotes: dnRes.data?.length || 0,
          closedWorkOrders: closedWoRes.data?.length || 0,
          overdueWorkOrders: woRes.data?.filter(wo => wo.isOverdue)?.length || 0,
          invoices: invoicesRes.data?.filter(invoice => invoice.invoice_status === 'processed')?.length || 0,
        });
      } catch (err) {
        console.error('Error fetching counts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCounts();
  }, []);

  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-2 text-black">
        Welcome back!
      </h2>
      <p className="text-gray-600 mb-6">
        Monitor your RFQs, Quotations, Purchase Orders, Work Orders, Delivery Notes, and Invoices below.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link to="/view-rfq" className="block">
          <div className="bg-white shadow-md rounded-lg p-6 flex items-center space-x-4 hover:shadow-lg transition-shadow">
            <div className="p-3 bg-indigo-100 rounded-full">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-700">Total RFQs</h3>
              <p className="text-2xl font-bold text-indigo-600">
                {loading ? 'Loading...' : counts.rfqs}
              </p>
            </div>
          </div>
        </Link>

        <Link to="/view-quotation" className="block">
          <div className="bg-white shadow-md rounded-lg p-6 flex items-center space-x-4 hover:shadow-lg transition-shadow">
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-700">Total Quotations</h3>
              <p className="text-2xl font-bold text-green-600">
                {loading ? 'Loading...' : counts.quotations}
              </p>
            </div>
          </div>
        </Link>

        <Link to="/job-execution/initiate-work-order/list-all-purchase-orders" className="block">
          <div className="bg-white shadow-md rounded-lg p-6 flex items-center space-x-4 hover:shadow-lg transition-shadow">
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-700">Total Purchase Orders</h3>
              <p className="text-2xl font-bold text-blue-600">
                {loading ? 'Loading...' : counts.purchaseOrders}
              </p>
            </div>
          </div>
        </Link>

        <Link to="/job-execution/processing-work-orders/list-all-processing-work-orders" className="block">
          <div className="bg-white shadow-md rounded-lg p-6 flex items-center space-x-4 hover:shadow-lg transition-shadow">
            <div className="p-3 bg-purple-100 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-700">Total Work Orders</h3>
              <p className="text-2xl font-bold text-purple-600">
                {loading ? 'Loading...' : counts.workOrders}
              </p>
            </div>
          </div>
        </Link>

        <Link to="/job-execution/processing-work-orders/delivery" className="block">
          <div className="bg-white shadow-md rounded-lg p-6 flex items-center space-x-4 hover:shadow-lg transition-shadow">
            <div className="p-3 bg-yellow-100 rounded-full">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-700">Total Delivery Notes</h3>
              <p className="text-2xl font-bold text-yellow-600">
                {loading ? 'Loading...' : counts.deliveryNotes}
              </p>
            </div>
          </div>
        </Link>

        <Link to="/post-job-phase/processed-invoices" className="block">
          <div className="bg-white shadow-md rounded-lg p-6 flex items-center space-x-4 hover:shadow-lg transition-shadow">
            <div className="p-3 bg-pink-100 rounded-full">
              <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-700">Total Invoices</h3>
              <p className="text-2xl font-bold text-pink-600">
                {loading ? 'Loading...' : counts.invoices}
              </p>
            </div>
          </div>
        </Link>
      </div>

      {counts.overdueWorkOrders > 0 && (
        <div className="mt-4 p-4 bg-red-50 rounded-lg">
          <p className="text-red-600 font-medium">
            {counts.overdueWorkOrders} Overdue Work Orders
          </p>
        </div>
      )}

      <div className="mt-8 bg-white shadow-md rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Overview</h3>
        <Bar ref={chartRef} data={chartData} options={{ responsive: true }} />
      </div>
    </div>
  );
};

export default Dashboard;