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
  
  // Use company name for both DN/Invoice and Certificate (as requested)
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
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header Section */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <img
          src={logo}
          alt="Company Logo"
          style={{ width: '100px', marginBottom: '10px' }}
        />
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '5px 0' }}>
          Prime Innovation Contracting Co.
        </h2>
        <div style={{ borderBottom: '2px solid #000', margin: '10px 0' }}></div>
        <p style={{ fontSize: '14px', margin: '5px 0' }}>شركة ابكار الرئية للمقاولات</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', margin: '10px 0' }}>
          <span>📞 {company_phone}</span>
          <span>📧 info@primearabiagroup.com</span>
        </div>
      </div>

      {/* Work Order Details Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', border: '1px solid #000' }}>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #000', padding: '8px', width: '50%', fontWeight: 'bold' }}>
              WORK ORDER#
            </td>
            <td style={{ border: '1px solid #000', padding: '8px', width: '50%', fontWeight: 'bold' }}>
              SALES PERSON
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '8px' }}>
              {wo_number || 'Not Provided'}
            </td>
            <td style={{ border: '1px solid #000', padding: '8px' }}>
              {sales_person}
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>
              DATE RECEIVED
            </td>
            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>
              EXP. DATE OF COMPLETION
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '8px' }}>
              {formatDate(date_received)}
            </td>
            <td style={{ border: '1px solid #000', padding: '8px' }}>
              {formatDate(expected_completion_date)}
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>
              SITE LOCATION
            </td>
            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>
              ONSITE/LAB
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '8px' }}>
              {site_location || 'Not Provided'}
            </td>
            <td style={{ border: '1px solid #000', padding: '8px' }}>
              {onsite_or_lab || 'Not Provided'}
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>
              COMPANY NAME IN DN AND INVOICE
            </td>
            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>
              COMPANY NAME IN CERTIFICATE
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '8px' }}>
              {company_name_dn}
            </td>
            <td style={{ border: '1px solid #000', padding: '8px' }}>
              {company_name_certificate}
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }} colSpan="2">
              COMPANY ADDRESS
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '8px' }} colSpan="2">
              {company_address}
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>
              CONTACT PERSON
            </td>
            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>
              CONTACT NUMBER
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '8px' }}>
              {contact_person}
            </td>
            <td style={{ border: '1px solid #000', padding: '8px' }}>
              {contact_number}
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>
              VALIDITY OF THE CERTIFICATE
            </td>
            <td style={{ border: '1px solid #000', padding: '8px' }}>
              1 Year
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }} colSpan="2">
              REMARKS
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '8px' }} colSpan="2">
              {remarks || 'Not Provided'}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Device Under Test Details */}
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
        DEVICE UNDER TEST DETAILS:
      </h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', border: '1px solid #000' }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2' }}>
            <th style={{ border: '1px solid #000', padding: '8px', fontSize: '12px' }}>SL #</th>
            <th style={{ border: '1px solid #000', padding: '8px', fontSize: '12px' }}>DESCRIPTION</th>
            <th style={{ border: '1px solid #000', padding: '8px', fontSize: '12px' }}>QTY</th>
            <th style={{ border: '1px solid #000', padding: '8px', fontSize: '12px' }}>RANGE</th>
            <th style={{ border: '1px solid #000', padding: '8px', fontSize: '12px' }}>CERT NO.</th>
            <th style={{ border: '1px solid #000', padding: '8px', fontSize: '12px' }}>COMPLETED BY</th>
          </tr>
        </thead>
        <tbody>
          {items && items.length > 0 ? (
            items.map((item, index) => (
              <tr key={item.id || index}>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontSize: '12px' }}>
                  {index + 1}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', fontSize: '12px' }}>
                  {item.name || 'Not Provided'}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontSize: '12px' }}>
                  {item.quantity || 'N/A'}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', fontSize: '12px' }}>
                  {item.range || 'Not Provided'}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', fontSize: '12px' }}>
                  {item.certificate_number || 'Not Provided'}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', fontSize: '12px' }}>
                  {item.assigned_to_name || 'Not Provided'}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontSize: '12px' }} colSpan="6">
                No items available.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Approval Checklist */}
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
        APPROVAL CHECKLIST:
      </h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', border: '1px solid #000' }}>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold', backgroundColor: '#f2f2f2' }}>
              CERTIFICATE & UUT LABEL
            </td>
            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold', backgroundColor: '#f2f2f2' }}>
              COMPLETED
            </td>
            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold', backgroundColor: '#f2f2f2' }}>
              MANAGER APPROVAL
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '8px' }}>CERTIFICATE NUMBER</td>
            <td style={{ border: '1px solid #000', padding: '8px' }}>
              {items && items.length > 0 && items[0].certificate_number ? 'ISSUED' : 'PENDING'}
            </td>
            <td style={{ border: '1px solid #000', padding: '8px' }}>
              WORK ORDER COMPLETE: YES ☐ NO ☐
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>
              CALIBRATION DATE
            </td>
            <td style={{ border: '1px solid #000', padding: '8px' }}>
              {items && items.length > 0 && items[0].calibration_date 
                ? formatDateSimple(items[0].calibration_date) 
                : formatDateSimple(new Date())}
            </td>
            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>
              DELIVERY NOTE #
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>
              CALIBRATION DUE DATE
            </td>
            <td style={{ border: '1px solid #000', padding: '8px' }}>
              {items && items.length > 0 && items[0].calibration_due_date 
                ? formatDateSimple(items[0].calibration_due_date)
                : formatDateSimple(new Date(new Date().setFullYear(new Date().getFullYear() + 1)))}
            </td>
            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>
              MANAGER SIGNATURE
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>
              UUC SERIAL NUMBER
            </td>
            <td style={{ border: '1px solid #000', padding: '8px' }}>
              {items && items.length > 0 && items[0].uuc_serial_number 
                ? items[0].uuc_serial_number 
                : 'Not Provided'}
            </td>
            <td style={{ border: '1px solid #000', padding: '8px' }}>
              {/* Signature area */}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Footer */}
      <div style={{ 
        textAlign: 'center', 
        fontSize: '12px', 
        marginTop: '30px',
        borderTop: '1px solid #000',
        paddingTop: '10px'
      }}>
        <p>
          <strong>Prime Innovation Contracting Co.</strong> | 
          Phone: {company_phone} | 
          Email: info@primearabiagroup.com
        </p>
        <p>Page 1 of 1</p>
      </div>
    </div>
  );
};

export default Template1;