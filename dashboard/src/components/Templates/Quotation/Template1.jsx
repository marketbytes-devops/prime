import React from 'react';
import logo from '../../../assets/images/img-logo.webp';

const Template1 = ({ data }) => {
  const {
    series_number,
    company_name,
    company_address,
    company_phone,
    company_email,
    channelName,
    point_of_contact_name,
    point_of_contact_email,
    point_of_contact_phone,
    assigned_sales_person,
    due_date_for_quotation,
    created_at,
    items,
    quotation_status,
    not_approved_reason_remark,
    next_followup_date,
    remarks,
    purchase_orders,
    subtotal,
    vat_applicable,
    vat_amount,
    grand_total,
    terms,               
  } = data;

  // Format date as "24 Aug 2025"
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).replace(/ /g, ' ');
  };

  return (
    <div
      className="relative"
      style={{
        fontFamily: 'Arial, sans-serif',
        padding: '20px',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Print‑specific background logo */}
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
        @media print {
          @page { margin: 1cm; }
          .background-container::before {
            content: '';
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background-image: url(${logo});
            background-position: center;
            background-repeat: no-repeat;
            background-size: contain;
            opacity: 0.2;
            z-index: 0;
          }
          .content { padding-bottom: 20px; }
        }
      `}</style>

      <div className="content background-container">
        {/* Header – Logo + Quote # */}
        <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <img src={logo} alt="Prime Logo" style={{ position: 'relative', left: '-10px' }} />
          </div>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Quote</h1>
            <p style={{ fontSize: '14px' }}>#{series_number || 'N/A'}</p>
          </div>
        </div>

        {/* Company address */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>Prime Innovation Company</h2>
          <p>Prince Nayef Bin Abdul Aziz St.</p>
          <p>Ras Tanura Ash Sharqiyah 32817</p>
          <p>Saudi Arabia</p>
          <p>TRN 311699230500003</p>
          <p>danny@primearabiagroup.com</p>
        </div>

        {/* Bill‑to + Quote date */}
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'end', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>Bill To</h2>
            <p>{company_name || 'N/A'}</p>
            <p>{company_address || 'N/A'}</p>
            <p>Phone: {company_phone || 'N/A'}</p>
            <p>Email: {company_email || 'N/A'}</p>
          </div>
          <div>
            <p><strong>Quote Date: {formatDate(created_at)}</strong></p>
          </div>
        </div>

        {/* Items table */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>Subject:</h2>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>CALIBRATION INSTRUMENT & EQUIPMENT</h3>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <thead>
              <tr style={{ backgroundColor: '#403c3c' }}>
                <th style={{ borderTop: '1px solid #ddd', borderBottom: '1px solid #ddd', padding: '8px', textAlign: 'left', color: '#fff' }}>#</th>
                <th style={{ borderTop: '1px solid #ddd', borderBottom: '1px solid #ddd', padding: '8px', textAlign: 'left', color: '#fff' }}>Item & Description</th>
                <th style={{ borderTop: '1px solid #ddd', borderBottom: '1px solid #ddd', padding: '8px', textAlign: 'left', color: '#fff' }}>Qty</th>
                <th style={{ borderTop: '1px solid #ddd', borderBottom: '1px solid #ddd', padding: '8px', textAlign: 'left', color: '#fff' }}>Unit</th>
                <th style={{ borderTop: '1px solid #ddd', borderBottom: '1px solid #ddd', padding: '8px', textAlign: 'left', color: '#fff' }}>Amount</th>
                <th style={{ borderTop: '1px solid #ddd', borderBottom: '1px solid #ddd', padding: '8px', textAlign: 'left', color: '#fff' }}>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {items && items.length > 0 ? (
                items.map((item, index) => (
                  <tr key={index}>
                    <td style={{ borderTop: '1px solid #ddd', borderBottom: '1px solid #ddd', padding: '8px', backgroundColor: '#fff', color: '#000' }}>{index + 1}</td>
                    <td style={{ borderTop: '1px solid #ddd', borderBottom: '1px solid #ddd', padding: '8px', backgroundColor: '#fff', color: '#000' }}>{item.name}</td>
                    <td style={{ borderTop: '1px solid #ddd', borderBottom: '1px solid #ddd', padding: '8px', backgroundColor: '#fff', color: '#000' }}>{item.quantity}</td>
                    <td style={{ borderTop: '1px solid #ddd', borderBottom: '1px solid #ddd', padding: '8px', backgroundColor: '#fff', color: '#000' }}>{item.unit}</td>
                    <td style={{ borderTop: '1px solid #ddd', borderBottom: '1px solid #ddd', padding: '8px', backgroundColor: '#fff', color: '#000' }}>
                      {item.unit_price ? Number(item.unit_price).toFixed(2) : 'N/A'}
                    </td>
                    <td style={{ borderTop: '1px solid #ddd', borderBottom: '1px solid #ddd', padding: '8px', backgroundColor: '#fff', color: '#000' }}>
                      {item.quantity && item.unit_price ? (item.quantity * item.unit_price).toFixed(2) : '0.00'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', backgroundColor: '#fff', color: '#000' }}>
                    No items added.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="5" style={{ borderTop: '1px solid #ddd', borderBottom: '1px solid #ddd', padding: '8px', textAlign: 'right', backgroundColor: '#f8f4f4', color: '#000' }}>
                  <strong>Grand Total</strong>
                </td>
                <td style={{ borderTop: '1px solid #ddd', borderBottom: '1px solid #ddd', padding: '8px', backgroundColor: '#f8f4f4', color: '#000' }}>
                  SAR {grand_total ? Number(grand_total).toFixed(2) : '0.00'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ---------- DYNAMIC TERMS & CONDITIONS ---------- */}
        <div style={{ marginTop: '20px' }}>
          <p><strong>Notes</strong></p>
          <p>Looking forward for your business.</p>
          {terms?.content ? (
            <div
              dangerouslySetInnerHTML={{ __html: terms.content }}
              style={{ fontSize: '14px' }}
            />
          ) : (
            <p style={{ fontStyle: 'italic', color: '#666' }}>
              No custom terms defined.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Template1;