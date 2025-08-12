const Template2 = ({ data }) => {
  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="text-xl font-bold mb-2">Work Order Details</h2>
        <p><strong>WO Number:</strong> {data.wo_number || 'N/A'}</p>
        <p><strong>Status:</strong> {data.status || 'N/A'}</p>
        <p><strong>Created At:</strong> {data.created_at ? new Date(data.created_at).toLocaleDateString() : 'N/A'}</p>
        <p><strong>Date Received:</strong> {data.date_received ? new Date(data.date_received).toLocaleDateString() : 'N/A'}</p>
        <p><strong>Expected Completion:</strong> {data.expected_completion_date ? new Date(data.expected_completion_date).toLocaleDateString() : 'N/A'}</p>
        <p><strong>Onsite/Lab:</strong> {data.onsite_or_lab || 'N/A'}</p>
        <p><strong>Range:</strong> {data.range || 'N/A'}</p>
        <p><strong>Serial Number:</strong> {data.serial_number || 'N/A'}</p>
        <p><strong>Site Location:</strong> {data.site_location || 'N/A'}</p>
        <p><strong>Remarks:</strong> {data.remarks || 'N/A'}</p>
      </div>
      <div>
        <h2 className="text-xl font-bold mb-2">Items</h2>
        {data.items && data.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Item</th>
                  <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Quantity</th>
                  <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Unit</th>
                  <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Assigned To</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item.id} className="border">
                    <td className="border p-2 whitespace-nowrap">{item.name || 'N/A'}</td>
                    <td className="border p-2 whitespace-nowrap">{item.quantity || 'N/A'}</td>
                    <td className="border p-2 whitespace-nowrap">{item.unit || 'N/A'}</td>
                    <td className="border p-2 whitespace-nowrap">{item.assigned_to || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No items available.</p>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold mb-2">Purchase Order Details</h2>
        <p><strong>PO ID:</strong> {data.purchase_order?.id || 'N/A'}</p>
        <p><strong>Client PO Number:</strong> {data.purchase_order?.client_po_number || 'N/A'}</p>
        <p><strong>Order Type:</strong> {data.purchase_order?.order_type || 'N/A'}</p>
        <p><strong>Created:</strong> {data.purchase_order?.created_at ? new Date(data.purchase_order.created_at).toLocaleDateString() : 'N/A'}</p>
        <p><strong>PO File:</strong> {data.purchase_order?.po_file ? (
          <a href={data.purchase_order.po_file} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            {data.purchase_order.po_file.split('/').pop() || 'View File'}
          </a>
        ) : 'N/A'}</p>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-2">Device Under Test Details</h2>
        {data.purchase_order?.items && data.purchase_order.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Item</th>
                  <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Quantity</th>
                  <th className="border p-2 text-left text-sm font-medium text-gray-700 whitespace-nowrap">Unit</th>
                </tr>
              </thead>
              <tbody>
                {data.purchase_order.items.map((item) => (
                  <tr key={item.id} className="border">
                    <td className="border p-2 whitespace-nowrap">{item.name || 'N/A'}</td>
                    <td className="border p-2 whitespace-nowrap">{item.quantity || 'N/A'}</td>
                    <td className="border p-2 whitespace-nowrap">{item.unit || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No items available.</p>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold mb-2">Delivery Note Details</h2>
        <p><strong>DN Number:</strong> {data.delivery_note?.dn_number || 'N/A'}</p>
        <p><strong>WO Number:</strong> {data.delivery_note?.wo_number || 'N/A'}</p>
        <p><strong>Created At:</strong> {data.delivery_note?.created_at ? new Date(data.delivery_note.created_at).toLocaleDateString() : 'N/A'}</p>
        <p><strong>Delivery Status:</strong> {data.delivery_note?.delivery_status || 'N/A'}</p>
        <p><strong>Signed Delivery Note:</strong> {data.delivery_note?.signed_delivery_note ? (
          <a href={data.delivery_note.signed_delivery_note} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            View File
          </a>
        ) : 'N/A'}</p>
      </div>
    </div>
  );
};

export default Template2;
