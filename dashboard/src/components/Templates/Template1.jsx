const Template1 = ({ data }) => {
  return (
    <html>
      <head>
        <title>RFQ {data.series_number || data.id}</title>
      </head>
      <body style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
        <h1>RFQ Details</h1>
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Company Details</h2>
          <p><strong>RFQ Number:</strong> {data.series_number || 'N/A'}</p>
          <p><strong>Company Name:</strong> {data.company_name || 'N/A'}</p>
          <p><strong>Company Address:</strong> {data.company_address || 'N/A'}</p>
          <p><strong>Company Phone:</strong> {data.company_phone || 'N/A'}</p>
          <p><strong>Company Email:</strong> {data.company_email || 'N/A'}</p>
          <p><strong>Channel:</strong> {data.channelName || 'N/A'}</p>
        </div>
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Contact Details</h2>
          <p><strong>Contact Name:</strong> {data.point_of_contact_name || 'N/A'}</p>
          <p><strong>Contact Email:</strong> {data.point_of_contact_email || 'N/A'}</p>
          <p><strong>Contact Phone:</strong> {data.point_of_contact_phone || 'N/A'}</p>
        </div>
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Assignment & Status</h2>
          <p><strong>Assigned Sales Person:</strong> {data.salesPersonName || 'N/A'}</p>
          <p><strong>Due Date:</strong> {data.due_date_for_quotation ? new Date(data.due_date_for_quotation).toLocaleDateString() : 'N/A'}</p>
          <p><strong>Status:</strong> {data.rfq_status || 'N/A'}</p>
          <p><strong>Created:</strong> {new Date(data.created_at).toLocaleDateString()}</p>
        </div>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Items</h2>
          <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f2f2f2' }}>
                <th style={{ padding: '8px', textAlign: 'left' }}>Item</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Quantity</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Unit</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Unit Price</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Total Price</th>
              </tr>
            </thead>
            <tbody>
              {data.items && data.items.length > 0 ? (
                data.items.map((item) => (
                  <tr key={item.id}>
                    <td style={{ padding: '8px' }}>{item.name || 'N/A'}</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>{item.quantity || 'N/A'}</td>
                    <td style={{ padding: '8px', textAlign: 'left' }}>{item.unit || 'N/A'}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>${item.unit_price ? Number(item.unit_price).toFixed(2) : 'N/A'}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>${item.quantity && item.unit_price ? Number(item.quantity * item.unit_price).toFixed(2) : '0.00'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ padding: '8px', textAlign: 'center' }}>No items added.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </body>
    </html>
  );
};

export default Template1;
