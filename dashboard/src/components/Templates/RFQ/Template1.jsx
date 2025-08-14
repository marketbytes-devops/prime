import React from 'react';

const Template1 = ({ data }) => {
  const calculateTotal = (items) => {
    return items.reduce((acc, item) => acc + (item.quantity * item.unit_price || 0), 0).toFixed(2);
  };

  const grandTotal = calculateTotal(data.items || []);

  return (
    <html>
      <head>
        <title>Quotation {data.series_number || data.id}</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />
        <style>
          {`
            @page {
              size: A4 portrait;
              margin: 1.2cm 1.7cm 2.2cm 1.7cm;
            }
            .page-break { page-break-after: always; }
            .header { text-align: center; margin-bottom: 1.5rem; }
            .arabic { font-family: 'Traditional Arabic', sans-serif; }
            .table-details { border: 1px solid #000; border-collapse: collapse; }
            .table-details td { padding: 0.5rem; border-bottom: 1px solid #e5e7eb; }
            .item-table th, .item-table td { border: 1px solid #000; padding: 0.5rem; }
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
            <img src="path/to/your/logo.png" alt="Prime Innovation Logo" className="w-32 mx-auto mb-2" />
            <div className="text-xl font-bold mb-2">Prime Innovation Contracting Co.</div>
            <div className="text-lg mb-4 arabic">شركة ابتكار الرئيسية للمقاوﻻت</div>
          </div>

          <div className="text-center text-lg font-bold underline mb-6">QUOTATION FOR CALIBRATION SERVICES</div>

          <div className="text-center text-sm mb-4"><strong>Quotation Submitted To:</strong></div>

          <table className="w-full mb-6 table-details">
            <tbody>
              <tr>
                <td className="text-left w-1/2">Quote No:</td>
                <td className="text-left w-1/2">{data.series_number || '001-000001'}</td>
              </tr>
              <tr>
                <td className="text-left w-1/2">Date:</td>
                <td className="text-left w-1/2">{data.created_at ? new Date(data.created_at).toLocaleDateString() : '11/08/2025'}</td>
              </tr>
              <tr>
                <td className="text-left w-1/2">Company:</td>
                <td className="text-left w-1/2">{data.company_name || 'marketbytes'}</td>
              </tr>
              <tr>
                <td className="text-left w-1/2">Customer Ref:</td>
                <td className="text-left w-1/2">Request for Quotation by Email</td>
              </tr>
              <tr>
                <td className="text-left w-1/2">Address:</td>
                <td className="text-left w-1/2">{data.company_address || 'ooooooo'}</td>
              </tr>
              <tr>
                <td className="text-left w-1/2">Tel:</td>
                <td className="text-left w-1/2">{data.company_phone || '9947384437'}</td>
              </tr>
              <tr>
                <td className="text-left w-1/2">Attention:</td>
                <td className="text-left w-1/2">{data.point_of_contact_name || 'akash'}</td>
              </tr>
              <tr>
                <td className="text-left w-1/2">Email Id:</td>
                <td className="text-left w-1/2">{data.company_email || 'akshaysambhu07@gmail.com'}</td>
              </tr>
            </tbody>
          </table>

          <div className="text-sm bank-details mb-6">
            <strong>Our Bank Account Details are as follows:</strong><br />
            Bank Name: Saudi National Bank<br />
            Account Name: Prime Innovation Contracting Company<br />
            Account Number: 95400006193408<br />
            IBAN: SA3210000095400006193408<br />
            Bank Address: The Saudi National Bank tower, King fahd Road 3208,Al Aqeeq District Unit No :778 Riyadh 13519-6676 Saudi Arabia<br />
            Company Address: Bldg No. 2099, Al Fayha Dist. 7453, Ras Tannurah-32817 City: Rastanura<br />
            <strong>Please ensure that all payments are made to the above-mentioned account details.</strong>
          </div>

          <div className="footer-row">
            <div>PRM-QAF-QR-00</div>
            <div className="flex-1 text-center">ISSUE DATE 12-NOV-2023</div>
            <div>REV NO:00</div>
          </div>
        </div>
        <div className="page-break"></div>

        {/* Page 2 */}
        <div className="mb-10">
          <div className="header">
            <img src="path/to/your/logo.png" alt="Prime Innovation Logo" className="w-32 mx-auto mb-2" />
            <div className="text-xl font-bold mb-2">Prime Innovation Contracting Co.</div>
            <div className="text-lg mb-4 arabic">شركة ابتكار الرئيسية للمقاوﻻت</div>
          </div>

          <div className="text-center text-lg font-bold underline mb-6">CALIBRATION INSTRUMENT & EQUIPMENT</div>

          <table className="w-full item-table mb-6">
            <thead>
              <tr className="font-bold">
                <th className="p-2.5 text-left">Sl. No.</th>
                <th className="p-2.5 text-left">Description</th>
                <th className="p-2.5 text-left">Unit</th>
                <th className="p-2.5 text-left">Qty</th>
                <th className="p-2.5 text-left">Unit price (SAR)</th>
                <th className="p-2.5 text-left">Total Price (SAR)</th>
              </tr>
            </thead>
            <tbody>
              {data.items && data.items.length > 0 ? (
                data.items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="p-2.5 text-left">{index + 1}</td>
                    <td className="p-2.5 text-left">{item.name || 'N/A'}</td>
                    <td className="p-2.5 text-left">{item.unit || 'Nos'}</td>
                    <td className="p-2.5 text-left">{item.quantity || 'N/A'}</td>
                    <td className="p-2.5 text-left">{item.unit_price ? Number(item.unit_price).toFixed(2) : 'N/A'}</td>
                    <td className="p-2.5 text-left">{item.quantity && item.unit_price ? Number(item.quantity * item.unit_price).toFixed(2) : '0.00'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-2.5 text-center">No items available.</td>
                </tr>
              )}
              <tr className="font-bold">
                <td colSpan="5" className="p-2.5 text-left">Grand Total (SAR)</td>
                <td className="p-2.5 text-left">{grandTotal}</td>
              </tr>
            </tbody>
          </table>

          <div className="terms">
            <strong>Terms & Conditions</strong><br /><strong>
            Calibration Service General Terms and Conditions</strong><br />
            • Following the calibration of each instrument, a comprehensive calibration report will be generated. Prime Innovation adheres to the fundamental principle governing the utilization of its accreditation logo. The accreditation logo serves as an assurance to the market that Prime Innovation complies with the applicable accreditation requirements. It is essential to note that the accreditation logo and the company logo of Prime Innovation are exclusively reserved for the sole use of Prime Innovation. Customers are expressly prohibited from utilizing these logos for profit, such as in advertisements on documents or commercial papers<br />
            • Customers are required to communicate their tolerance limits to Prime Innovation through email, facilitated by the assigned Prime Innovation Sales representative. In instances where no tolerance limit is communicated to Prime Innovation, the manufacturer’s tolerance limit will be implemented. In cases where customers fail to provide the tolerance limit before calibration and subsequently wish to re-calibrate with their specified tolerance, Prime Innovation will apply the same amount as originally quoted.<br />
            • If a unit is identified as defective and requires repair, such matters fall outside the scope of Prime Innovation's services. In such cases, you will be advised to reach out to the manufacturer or your respective vendor for necessary repairs. Following the completion of repairs, you are then encouraged to resubmit the unit to Prime Innovation for calibration.<br />
          </div>
        </div>
        <div className="page-break"></div>

        {/* Page 3 */}
        <div className="mb-10">
          <div className="header">
            <img src="path/to/your/logo.png" alt="Prime Innovation Logo" className="w-32 mx-auto mb-2" />
            <div className="text-xl font-bold mb-2">Prime Innovation Contracting Co.</div>
            <div className="text-lg mb-4 arabic">شركة ابتكار الرئيسية للمقاوﻻت</div>
          </div>

          <div className="terms">
            • Normal turnaround time for Prime Innovation calibration services varies, depending on the type of Service requested and fluctuations in workload. However, 2-3 working days is normal for calibration services.<br />
            • Prime Innovation have free pick-up and delivery service from customer premises following to the availability of prime innovation sales team.<br />
            • Customers purchase order or written approval is required to start calibration.<br />
            • Prime Innovation will invoice completed and delivered instruments irrespective of total number of instruments in the PO. Hence customer is liable to accept the submitted partial invoices and proceed with payment.<br />
            • If the UUC (unit under Calibration) was found to be out of tolerance during calibration, and it will result to the rejection of the UUC, then 100% quoted rate for calibration shall be charged.<br />
            • Customer should provide written request in advance if conformity statement to a specification or standard (PASS/FAIL) is required and choose what decision rules to be applied.<br />
            • PAYMENT: Payment to be made after 30 days<br />
            • CONFIDENTIALITY: Unless the customer had made the information publicly available, or with agreement with the customer, all calibration results and documents created during the calibration of customer's equipment are considered proprietary information and treated as confidential. When required by law or by contractual agreement to release confidential information, Prime Innovation will inform the customer representative unless otherwise prohibited by law . Information about the customer obtained from sources other than the customer (e.g. complainant, regulators) is confidential between the customer and the laboratory. The provider (source) of this information is confidential to PRIME INNOVATION and do not share with the customer, unless agreed by the source.<br />
            • VAT is excluded from our quotation and will be charged at 15% extra.
          </div>

          <div className="signature text-sm">
            For Prime Innovation Contracting Co<br />
            Hari Krishnan M<br />
            Head ‐ Engineering and QA/QC
          </div>

          <div className="contact-details">
            <div>
              Bldg No. 2099, Al Fayha Dist.7453, Ras Tannurah-32817<br />
              www.primearabiagroup.com<br />
              CR No: 2050172178
            </div>
            <div>
              Ph: +966 50 584 7698<br />
              Info@primearabiagroup.com
            </div>
          </div>
        </div>
      </body>
    </html>
  );
};

export default Template1;