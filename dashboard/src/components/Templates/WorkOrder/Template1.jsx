import React from 'react';
import logo from '../../../assets/images/img-logo.webp';

const Template1 = ({ data }) => {
  const { wo_number, wo_type, date_received, expected_completion_date, onsite_or_lab, site_location, remarks, items } = data;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not Provided';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).replace(/ /g, ' ');
  };

  return (
    <div
      className="relative"
      style={{ fontFamily: 'Arial, sans-serif', padding: '20px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      {/* Print-Specific Styles and Background Image */}
      <style jsx>{`
        .background-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: url(${logo});
          background-position: center;
          background-repeat: no-repeat;
          background-size: contain;
          opacity: 0.2;
          z-index: 0;
        }
        .content {
          position: relative;
          z-index: 1;
          flex-grow: 1;
        }
        .footer {
          position: relative;
          z-index: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10px;
          padding: 10px 20px;
          border-top: 1px solid #000;
          margin-top: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #403c3c;
          color: #ffffff;
          font-weight: bold;
        }
        tr:nth-child(even) {
          background-color: #f8f8f8;
        }
        a {
          color: #0066cc;
          text-decoration: underline;
        }
        a:hover {
          color: #0033cc;
        }
        .table-container {
          overflow-x: auto;
        }
        @media print {
          @page {
            margin: 1cm;
          }
          .background-container::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: url(${logo});
            background-position: center;
            background-repeat: no-repeat;
            background-size: contain;
            opacity: 0.2;
            z-index: 0;
          }
          .content {
            padding-bottom: 100px;
          }
          .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 80px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 10px;
            padding: 10px 20px;
            border-top: 1px solid #000;
          }
          .table-container {
            overflow-x: visible;
          }
        }
      `}</style>

      {/* Content Wrapper */}
      <div className="content background-container">
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
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>Work Order Details</h2>
          <p><strong>Work Order Number:</strong> {wo_number || 'Not Provided'}</p>
          <p><strong>Work Order Type:</strong> {wo_type || 'Not Provided'}</p>
          <p><strong>Date Received:</strong> {formatDate(date_received)}</p>
          <p><strong>Expected Completion Date:</strong> {formatDate(expected_completion_date)}</p>
          <p><strong>Onsite or Lab:</strong> {onsite_or_lab || 'Not Provided'}</p>
          <p><strong>Site Location:</strong> {site_location || 'Not Provided'}</p>
          <p><strong>Remarks:</strong> {remarks || 'Not Provided'}</p>
        </div>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>Device Under Test Details</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Unit</th>
                  <th>Range</th>
                  <th>Assigned To</th>
                  <th>Certificate UUT Label</th>
                  <th>Certificate Number</th>
                  <th>Calibration Date</th>
                  <th>Calibration Due Date</th>
                  <th>UUC Serial Number</th>
                  <th>Certificate</th>
                </tr>
              </thead>
              <tbody>
                {items && items.length > 0 ? (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name || 'Not Provided'}</td>
                      <td style={{ textAlign: 'center' }}>{item.quantity || 'Not Provided'}</td>
                      <td>{item.unit || 'Not Provided'}</td>
                      <td>{item.range || 'Not Provided'}</td>
                      <td>{item.assigned_to_name || 'Not Provided'}</td>
                      <td>{item.certificate_uut_label || 'Not Provided'}</td>
                      <td>{item.certificate_number || 'Not Provided'}</td>
                      <td>{formatDate(item.calibration_date)}</td>
                      <td>{formatDate(item.calibration_due_date)}</td>
                      <td>{item.uuc_serial_number || 'Not Provided'}</td>
                      <td>
                        {item.certificate_file ? (
                          <a href={item.certificate_file} target="_blank" rel="noopener noreferrer">
                            View Certificate
                          </a>
                        ) : 'Not Provided'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="11" style={{ textAlign: 'center' }}>No items available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Spacer to Push Footer to Bottom */}
      <div style={{ flexGrow: 1 }}></div>

      {/* Footer Section */}
      <footer className="footer">
        <div>
          <p>Ph: +966 50 584 7698</p>
          <p>Bldg No. 2099, Al Fayha Dist.7453, Ras Tanura-32817</p>
          <p>CR No: 2050172178</p>
        </div>
        <div>
          <p>info@primearabbagroup.com</p>
          <p>www.primearabbagroup.com</p>
        </div>
      </footer>
    </div>
  );
};

export default Template1;