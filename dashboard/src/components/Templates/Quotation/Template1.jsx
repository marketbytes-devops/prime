import React from 'react';

const Template1 = ({ data }) => {
  const { series_number, company_name, company_address, company_phone, company_email, channelName, point_of_contact_name, point_of_contact_email, point_of_contact_phone, assigned_sales_person, due_date_for_quotation, created_at, items, quotation_status, not_approved_reason_remark, next_followup_date, remarks, purchase_orders } = data;
  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price || 0), 0);

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Quotation</h1>
        <p style={{ fontSize: '14px' }}>#{series_number || 'N/A'}</p>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>Prime Innovation Contracting Company</h2>
          <p>Prince Nayif Bin Abdul Aziz St.</p>
          <p>Ras Tanura Ash Shariyah 32817</p>
          <p>TRN: 1116993003</p>
          <p>danny@primeareagroup.com</p>
        </div>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>Bill To</h2>
          <p>{company_name || 'N/A'}</p>
          <p>{company_address || 'N/A'}</p>
          <p>Phone: {company_phone || 'N/A'}</p>
          <p>Email: {company_email || 'N/A'}</p>
        </div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2' }}>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Item</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Quantity</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Unit</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Unit Price</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Total Price</th>
          </tr>
        </thead>
        <tbody>
          {items && items.length > 0 ? (
            items.map((item, index) => (
              <tr key={index}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.name}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.quantity}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.unit}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>${item.unit_price ? Number(item.unit_price).toFixed(2) : 'N/A'}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>${item.quantity && item.unit_price ? (item.quantity * item.unit_price).toFixed(2) : '0.00'}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>No items added.</td>
            </tr>
          )}
          <tr>
            <td colSpan="4" style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}><strong>Total</strong></td>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>${totalAmount.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
      <div style={{ marginTop: '20px' }}>
        <p><strong>Notes</strong></p>
        <p>Looking forward for your business.</p>
        <p><strong>Terms & Conditions</strong></p>
        <p><strong>Calibration Service General Terms and Conditions</strong></p>
        <p><strong>SAR 350.00</strong></p>
        <ul style={{ paddingLeft: '20px' }}>
          <li style={{ marginBottom: '10px' }}>
            Following the calibration of each instrument, a comprehensive calibration report will be generated. Prime Innovation adheres to the fundamental principle governing the utilization of its accreditation logo. The accreditation logo serves as an assurance to the market that Prime Innovation complies with the applicable accreditation requirements. It is essential to note that the accreditation logo and the company logo of Prime Innovation are exclusively reserved for the sole use of Prime Innovation. Customers are expressly prohibited from utilizing these logos for profit, such as in advertisements on documents or commercial papers.
          </li>
          <li style={{ marginBottom: '10px' }}>
            Customers are required to communicate their tolerance limits to Prime Innovation through email, facilitated by the assigned Prime Innovation Sales representative. In instances where no tolerance limit is communicated to Prime Innovation, the manufacturer’s tolerance limit will be implemented. In cases where customers fail to provide the tolerance limit before calibration and subsequently wish to recalibrate with their specified tolerance, Prime Innovation will apply the same amount as originally quoted.
          </li>
          <li style={{ marginBottom: '10px' }}>
            If a unit is identified as defective and requires repair, such matters fall outside the scope of Prime Innovation's services. In such cases, you will be advised to reach out to the manufacturer or your respective vendor for necessary repairs. Following the completion of repairs, you are then encouraged to resubmit the unit to Prime Innovation for calibration.
          </li>
          <li style={{ marginBottom: '10px' }}>
            Prime Innovation is committed to employing calibration methods that are suitable for the specific calibration tasks undertaken. Whenever feasible, Prime Innovation will utilize methods outlined in the instrument's service manual. Alternatively, international, regional, or national standards will be referenced when appropriate. In some cases, Prime Innovation may also employ methods developed in-house. The method used for calibration will be clearly indicated on the test report. Nonstandard methods will only be employed with your explicit agreement. If the proposed method from your end is deemed inappropriate or outdated, Prime Innovation will promptly inform you of this determination.
          </li>
          <li style={{ marginBottom: '10px' }}>
            Normal turnaround time for Prime Innovation calibration services varies, depending on the type of Service requested and fluctuations in workload. However, 2-3 working days is normal for calibration services.
          </li>
          <li style={{ marginBottom: '10px' }}>
            Prime Innovation have free pick-up and delivery service from customer premises following to the availability of prime innovation sales team.
          </li>
          <li style={{ marginBottom: '10px' }}>
            Customers purchase order or written approval is required to start calibration.
          </li>
          <li style={{ marginBottom: '10px' }}>
            Prime Innovation will invoice completed and delivered instruments irrespective of total number of instruments in the PO. Hence customer is liable to accept the submitted partial invoices and proceed with payment.
          </li>
          <li style={{ marginBottom: '10px' }}>
            If the UUC (unit under Calibration) was found to be out of tolerance during calibration, and it will result to the rejection of the UUC, then 100% quoted rate for calibration shall be charged.
          </li>
          <li style={{ marginBottom: '10px' }}>
            Customer should provide written request in advance if conformity statement to a specification or standard (PASS/FAIL) is required and choose what decision rules to be applied.
          </li>
          <li style={{ marginBottom: '10px' }}>
            PAYMENT: Payment to be made after 30 days.
          </li>
          <li style={{ marginBottom: '10px' }}>
            CONFIDENTIALITY: Unless the customer had made the information publicly available, or with agreement with the customer, all calibration results and documents created during the calibration of customer's equipment are considered proprietary information and treated as confidential. When required by law or by contractual agreement to release confidential information, Prime Innovation will inform the customer representative unless otherwise prohibited by law. Information about the customer obtained from sources other than the customer (e.g. complainant, regulators) is confidential between the customer and the laboratory. The provider (source) of this information is confidential to PRIME INNOVATION and do not share with the customer, unless agreed by the source.
          </li>
          <li style={{ marginBottom: '10px' }}>
            VAT is excluded from our quotation and will be charged at 15% extra.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Template1;