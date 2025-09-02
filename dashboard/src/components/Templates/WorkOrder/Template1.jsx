import logo from "../../../assets/images/img-logo.webp";

const Template1 = ({ data }) => {
  const { wo_number, wo_type, date_received, expected_completion_date, onsite_or_lab, site_location, remarks, items } = data;
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not Provided';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace(/ /g, ' ');
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <img src={logo} alt="Company Logo" style={{ maxWidth: '150px' }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Work Order</h1>
          <p style={{ fontSize: '14px' }}>#{wo_number || 'Not Provided'}</p>
        </div>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>Work Order Details</h2>
        <p><strong>Work Order Number:</strong> {wo_number || 'Not Provided'}</p>
        <p><strong>Work Order Type:</strong> {wo_type || 'Not Provided'}</p>
        <p><strong>Date Received:</strong> {formatDate(date_received)}</p>
        <p><strong>Expected Completion Date:</strong> {formatDate(expected_completion_date)}</p>
        <p><strong>Onsite or Lab:</strong> {onsite_or_lab || 'Not Provided'}</p>
        <p><strong>Site Location:</strong> {site_location || 'Not Provided'}</p>
        <p><strong>Remarks:</strong> {remarks || 'Not Provided'}</p>
      </div>
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>Device Under Test Details</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Item</th>
              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Quantity</th>
              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Unit</th>
              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Range</th>
              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Assigned To</th>
              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Certificate UUT Label</th>
              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Certificate Number</th>
              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Calibration Date</th>
              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Calibration Due Date</th>
              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>UUC Serial Number</th>
              <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Certificate</th>
            </tr>
          </thead>
          <tbody>
            {items && items.length > 0 ? (
              items.map((item) => (
                <tr key={item.id}>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.name || 'Not Provided'}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{item.quantity || 'Not Provided'}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.unit || 'Not Provided'}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.range || 'Not Provided'}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.assigned_to_name || 'Not Provided'}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.certificate_uut_label || 'Not Provided'}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.certificate_number || 'Not Provided'}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{formatDate(item.calibration_date)}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{formatDate(item.calibration_due_date)}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.uuc_serial_number || 'Not Provided'}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    {item.certificate_file ? (
                      <a href={item.certificate_file} target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc', textDecoration: 'underline' }}>
                        View Certificate
                      </a>
                    ) : 'Not Provided'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="11" style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>No items available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Template1;