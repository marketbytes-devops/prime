import React from 'react';

const Template1 = ({ data }) => {
  const calculateTotal = (items) => {
    return items.reduce((acc, item) => acc + (item.quantity * item.unit_price || 0), 0).toFixed(2);
  };

  const grandTotal = calculateTotal(data.items || []);

  return (
    <html lang="en">
      <head>
        <title>Quotation {data.series_number || 'QU-PI-GOPC-240825'}</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />
        <style>
          {`
            @page {
              size: A4 portrait;
              margin: 1.2cm 1.7cm 2.2cm 1.7cm;
            }
            .page-break { page-break-after: always; }
            .header { text-align: center; margin-bottom: 1.5rem; }
            .arabic { font-family: 'Traditional Arabic', sans-serif; direction: rtl; }
            .table-details { border-collapse: collapse; width: 100%; }
            .table-details td { padding: 0.5rem; border-bottom: 1px solid #e5e7eb; }
            .item-table { border-collapse: collapse; width: 100%; }
            .item-table th, .item-table td { border: 1px solid #000; padding: 0.5rem; }
            .item-table th { background-color: #000; color: #fff; }
            .terms { margin-top: 1rem; font-size: 0.75rem; line-height: 1.25rem; }
            .signature { text-align: right; margin-top: 2rem; }
            .footer-row { display: flex; justify-content: space-between; margin-top: 1rem; }
            .bank-details { line-height: 1.5; margin-bottom: 1rem; }
            .contact-details { display: flex; justify-content: space-between; margin-top: 1rem; font-size: 0.65rem; line-height: 1.2; }
          `}
        </style>
      </head>
      <body className="font-sans text-sm leading-relaxed">
        {/* Page 1 */}
        <div className="mb-10">
          <div className="header">
            <div className="text-xl font-bold mb-2">Prime Innovation Contracting Company</div>
            <div className="text-lg mb-4 arabic">شركة ابتكار الرئيسية للمقاوﻻت</div>
          </div>

          <div className="text-center text-lg font-bold underline mb-6">Quote</div>

          <div className="text-sm mb-4">
            <strong>Quote Date:</strong> {data.created_at ? new Date(data.created_at).toLocaleDateString('en-GB') : '24 Aug 2025'}
          </div>

          <div className="mb-4">
            <strong>Prime Innovation Contracting Company</strong><br />
            2099, Prince Nayef Bin Abdul Aziz St.<br />
            Ras Tanura Ash Sharqiyah 32817<br />
            Saudi Arabia<br />
            TRN 311699230500003<br />
            danny@primearabiagroup.com
          </div>

          <div className="mb-4">
            <strong>Bill To</strong><br />
            {data.company_name || 'Gulf Oil Performance Industrial Company'}<br />
            {data.company_address || '4798, Road 130, Al Jubail, 35729 Ash Sharqiyah, Saudi Arabia'}<br />
            TRN {data.company_trn || '311630077200003'}<br />
            CRN {data.company_crn || '2055025786'}
          </div>

          <div className="text-center text-lg font-bold mb-6">Quote # {data.series_number || 'QU-PI-GOPC-240825'}</div>

          <div className="text-center text-lg font-bold underline mb-6">Subject: {data.subject || 'CALIBRATION INSTRUMENT & EQUIPMENT'}</div>

          <table className="w-full item-table mb-6">
            <thead>
              <tr className="font-bold">
                <th className="p-2.5 text-left">#</th>
                <th className="p-2.5 text-left">Item & Description</th>
                <th className="p-2.5 text-left">Qty</th>
                <th className="p-2.5 text-left">Rate</th>
                <th className="p-2.5 text-left">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.items && data.items.length > 0 ? (
                data.items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="p-2.5 text-left">{index + 1}</td>
                    <td className="p-2.5 text-left">{item.name || 'N/A'}</td>
                    <td className="p-2.5 text-left">{item.quantity || 'N/A'}</td>
                    <td className="p-2.5 text-left">{item.unit_price ? `SAR${Number(item.unit_price).toFixed(2)}` : 'N/A'}</td>
                    <td className="p-2.5 text-left">{item.quantity && item.unit_price ? `SAR${Number(item.quantity * item.unit_price).toFixed(2)}` : '0.00'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-2.5 text-center">No items available.</td>
                </tr>
              )}
              <tr className="font-bold">
                <td colSpan="4" className="p-2.5 text-left">Sub Total</td>
                <td className="p-2.5 text-left">{`SAR${grandTotal}`}</td>
              </tr>
              <tr className="font-bold">
                <td colSpan="4" className="p-2.5 text-left">Total</td>
                <td className="p-2.5 text-left">{`SAR${grandTotal}`}</td>
              </tr>
            </tbody>
          </table>

          <div className="terms">
            <strong>Notes</strong><br />
            Looking forward for your business.<br />
            <strong>Terms & Conditions</strong><br />
            Calibration Service General Terms and Conditions<br />
            • Following the calibration of each instrument, a comprehensive calibration report will be generated. Prime Innovation adheres to the fundamental principle governing the utilization of its accreditation logo. The accreditation logo serves as an assurance to the market that Prime Innovation complies with the applicable accreditation requirements. It is essential to note that the accreditation logo and the company logo of Prime Innovation are exclusively reserved for the sole use of Prime Innovation. Customers are expressly prohibited from utilizing these logos for profit, such as in advertisements on documents or commercial papers.
          </div>
        </div>
        <div className="page-break"></div>

        {/* Page 2 */}
        <div className="mb-10">
          <div className="terms">
            • Customers are required to communicate their tolerance limits to Prime Innovation through email, facilitated by the assigned Prime Innovation Sales representative. In instances where no tolerance limit is communicated to Prime Innovation, the manufacturer’s tolerance limit will be implemented. In cases where customers fail to provide the tolerance limit before calibration and subsequently wish to re-calibrate with their specified tolerance, Prime Innovation will apply the same amount as originally quoted.<br />
            • If a unit is identified as defective and requires repair, such matters fall outside the scope of Prime Innovation's services. In such cases, you will be advised to reach out to the manufacturer or your respective vendor for necessary repairs. Following the completion of repairs, you are then encouraged to resubmit the unit to Prime Innovation for calibration.<br />
            • Prime Innovation is committed to employing calibration methods that are suitable for the specific calibration tasks undertaken. Whenever feasible, Prime Innovation will utilize methods outlined in the instrument's service manual. Alternatively, international, regional, or national standards will be referenced when appropriate. In some cases, Prime Innovation may also employ methods developed in-house. The method used for calibration will be clearly indicated on the test report. Nonstandard methods will only be employed with your explicit agreement. If the proposed method from your end is deemed inappropriate or outdated, Prime Innovation will promptly inform you of this determination.<br />
            • Normal turnaround time for Prime Innovation calibration services varies, depending on the type of Service requested and fluctuations in workload. However, 2-3 working days is normal for calibration services.<br />
            • Prime Innovation have free pick-up and delivery service from customer premises following to the availability of prime innovation sales team.<br />
            • Customers purchase order or written approval is required to start calibration.<br />
            • Prime Innovation will invoice completed and delivered instruments irrespective of total number of instruments in the PO. Hence customer is liable to accept the submitted partial invoices and proceed with payment.<br />
            • If the UUC (unit under Calibration) was found to be out of tolerance during calibration, and it will result to the rejection of the UUC, then 100% quoted rate for calibration shall be charged.<br />
            • Customer should provide written request in advance if conformity statement to a specification or standard (PASS/FAIL) is required and choose what decision rules to be applied.<br />
            • PAYMENT: Payment to be made after 30 days<br />
            • CONFIDENTIALITY: Unless the customer had made the information publicly available, or with agreement with the customer, all calibration results and documents created during the calibration of customer's equipment are considered proprietary information and treated as confidential. When required by law or by contractual agreement to release confidential information, Prime Innovation will inform the customer representative unless otherwise prohibited by law. Information about the customer obtained from sources other than the customer (e.g. complainant, regulators) is confidential between the customer and the laboratory. The provider (source) of this information is confidential to PRIME INNOVATION and do not share with the customer, unless agreed by the source.<br />
            • VAT is excluded from our quotation and will be charged at 15% extra.
          </div>
        </div>
      </body>
    </html>
  );
};

export default Template1;