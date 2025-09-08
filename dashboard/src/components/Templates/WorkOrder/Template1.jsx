import React from 'react';
import logo from '../../../assets/images/img-logo.webp';

const Template1 = ({ data }) => {
  const {
    wo_number,
    date_received,
    expected_completion_date,
    onsite_or_lab,
    site_location,
    remarks,
    items = [],
    rfqDetails = {},
  } = data;

  // Extract company details from RFQ with comprehensive fallbacks
  const company_name = rfqDetails?.company_name || 'Company Name Not Available';
  const company_address = rfqDetails?.company_address || 'Address Not Available';
  const company_phone = rfqDetails?.company_phone || 'Phone Not Available';
  const company_email = rfqDetails?.company_email || 'Email Not Available';

  // Use company name for both DN/Invoice and Certificate
  const company_name_dn = company_name;
  const company_name_certificate = company_name;

  // Contact details from RFQ point of contact
  const contact_person = rfqDetails?.point_of_contact_name || 'Contact Person Not Available';
  const contact_number = rfqDetails?.point_of_contact_phone || 'Contact Phone Not Available';
  const contact_email = rfqDetails?.point_of_contact_email || 'Contact Email Not Available';

  // Sales person from RFQ
  const sales_person = rfqDetails?.assigned_sales_person_name || 'Sales Person Not Available';

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not Provided';
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? 'Not Provided' : date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateSimple = (dateStr) => {
    if (!dateStr) return 'Not Provided';
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? 'Not Provided' : date.toLocaleDateString('en-GB');
  };

  return (
    <div
      className="relative"
      style={{
        fontFamily: 'Arial, sans-serif',
        padding: '20px 20px 20px 20px',
        maxWidth: '800px',
        margin: '0 auto',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
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
          padding: 10px 0px;
          margin-top: 20px;
          text-align: center;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          border: 1px solid #000;
        }
        th, td {
          border: 1px solid #000;
          padding: 8px;
          font-size: 12px;
        }
        th {
          background-color: #403c3c;
          color: #ffffff;
          font-weight: bold;
        }
        tr:nth-child(even) {
          background-color: #f8f8f8;
        }
        .table-container {
          overflow-x: auto;
        }
        @media print {
          @page {
            margin: 20mm 10mm; /* Equal top/bottom margins, smaller side margins */
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
            padding-top: 0;
            padding-bottom: 100px; /* Space for footer */
          }
          .header-container {
            margin-top: 0; /* No extra margin to align with @page margin */
          }
          .footer {
            position: fixed;
            bottom: 0;
            left: 10mm;
            right: 10mm;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 10px;
            padding: 10px 0px;
            margin-bottom: 0;
          }
          .table-container {
            overflow-x: visible;
          }
        }
      `}</style>

      {/* Content Wrapper */}
      <div className="content background-container">
        {/* Header Section */}
        <div className="header-container" style={{ border: '1px solid #000', textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'start', alignItems: 'center', gap: '20px', width: '100%', margin: '0 auto' }}>
            <div style={{ width: '0%' }}>
              <img
                src={logo}
                alt="Company Logo"
                style={{ width: '100px', height: 'auto', margin: '10px' }}
              />
            </div>

            <div style={{ display: 'grid', justifyItems: 'center', alignItems: 'center', gap: '5px', textAlign: 'center', width: '100%' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0' }}>
                Prime Innovation Contracting Co.
              </h2>
              <p style={{ fontSize: '14px', margin: '0px' }}>شركة ابكار الرئية للمقاولات</p>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px 0px', borderTop: '1px solid #000' }}>
            <span style={{ fontSize: '12px' }}>📞 {company_phone}</span>
            <span style={{ fontSize: '12px' }}>📧 info@primearabiagroup.com</span>
          </div>
        </div>

        {/* Work Order Details Table */}
        <div className="table-container">
          <table>
            <tbody>
              <tr>
                <td style={{ fontWeight: 'bold' }}>WORK ORDER#</td>
                <td style={{ fontWeight: 'bold' }}>SALES PERSON</td>
              </tr>
              <tr>
                <td>{wo_number || 'Not Provided'}</td>
                <td>{sales_person}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold' }}>DATE RECEIVED</td>
                <td style={{ fontWeight: 'bold' }}>EXP. DATE OF COMPLETION</td>
              </tr>
              <tr>
                <td>{formatDate(date_received)}</td>
                <td>{formatDate(expected_completion_date)}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold' }}>SITE LOCATION</td>
                <td style={{ fontWeight: 'bold' }}>ONSITE/LAB</td>
              </tr>
              <tr>
                <td>{site_location || 'Not Provided'}</td>
                <td>{onsite_or_lab || 'Not Provided'}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold' }}>COMPANY NAME IN DN AND INVOICE</td>
                <td style={{ fontWeight: 'bold' }}>COMPANY NAME IN CERTIFICATE</td>
              </tr>
              <tr>
                <td>{company_name_dn}</td>
                <td>{company_name_certificate}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold' }} colSpan="2">COMPANY ADDRESS</td>
              </tr>
              <tr>
                <td colSpan="2">{company_address}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold' }}>CONTACT PERSON</td>
                <td style={{ fontWeight: 'bold' }}>CONTACT NUMBER</td>
              </tr>
              <tr>
                <td>{contact_person}</td>
                <td>{contact_number}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold' }}>VALIDITY OF THE CERTIFICATE</td>
                <td>1 Year</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold' }} colSpan="2">REMARKS</td>
              </tr>
              <tr>
                <td colSpan="2">{remarks || 'Not Provided'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Device Under Test Details */}
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
          DEVICE UNDER TEST DETAILS:
        </h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>SL #</th>
                <th>DESCRIPTION</th>
                <th>QTY</th>
                <th>RANGE</th>
                <th>CERT NO.</th>
                <th>COMPLETED BY</th>
              </tr>
            </thead>
            <tbody>
              {items && items.length > 0 ? (
                items.map((item, index) => (
                  <tr key={item.id || index}>
                    <td style={{ textAlign: 'center' }}>{index + 1}</td>
                    <td>{item.name || 'Not Provided'}</td>
                    <td style={{ textAlign: 'center' }}>{item.quantity || 'N/A'}</td>
                    <td>{item.range || 'Not Provided'}</td>
                    <td>{item.certificate_number || 'Not Provided'}</td>
                    <td>{item.assigned_to_name || 'Not Provided'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center' }}>No items available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Approval Checklist */}
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
          APPROVAL CHECKLIST:
        </h3>
        <div className="table-container">
          <table>
            <tbody>
              <tr>
                <th>CERTIFICATE & UUT LABEL</th>
                <th>COMPLETED</th>
                <th>MANAGER APPROVAL</th>
              </tr>
              <tr>
                <td>CERTIFICATE NUMBER</td>
                <td>{items && items.length > 0 && items[0].certificate_number ? 'ISSUED' : 'PENDING'}</td>
                <td>WORK ORDER COMPLETE:</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold' }}>CALIBRATION DATE</td>
                <td>
                  {items && items.length > 0 && items[0].calibration_date
                    ? formatDateSimple(items[0].calibration_date)
                    : formatDateSimple(new Date())}
                </td>
                <td style={{ fontWeight: 'bold' }}>DELIVERY NOTE #</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold' }}>CALIBRATION DUE DATE</td>
                <td>
                  {items && items.length > 0 && items[0].calibration_due_date
                    ? formatDateSimple(items[0].calibration_due_date)
                    : formatDateSimple(new Date(new Date().setFullYear(new Date().getFullYear() + 1)))}
                </td>
                <td style={{ fontWeight: 'bold' }}>MANAGER SIGNATURE</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold' }}>UUC SERIAL NUMBER</td>
                <td>
                  {items && items.length > 0 && items[0].uuc_serial_number
                    ? items[0].uuc_serial_number
                    : 'Not Provided'}
                </td>
                <td>{/* Signature area */}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Spacer to Push Footer to Bottom */}
      <div style={{ flexGrow: 1 }}></div>

      {/* Footer Section */}
      <footer className="footer">
        <div></div>
      </footer>
    </div>
  );
};

export default Template1;