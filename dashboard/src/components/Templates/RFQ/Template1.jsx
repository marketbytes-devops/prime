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
            .page-footer { 
              position: running(footer);
              bottom: 0;
              width: 100%;
            }
            .page-footer-first {
              position: absolute;
              bottom: -0.5cm;
              left: 10px;
              width: 100%;
              text-align: center;
            }
            @page {
              @bottom-center {
                content: element(footer);
              }
            }
          `}
        </style>
      </head>
      <body className="font-sans leading-relaxed text-sm">
        {/* Page 1 */}
        <div>
          <div className="text-center mb-6">
            <div className="text-xl font-bold mb-2">Prime Innovation Contracting Co.</div>
            <div className="text-lg mb-4">شركة ابتكار الرئيسية للمقاوﻻت</div>
          </div>

          <div className="mb-5">Quotation Submitted To:</div>

          <div className="text-center text-lg font-bold underline mb-6">QUOTATION FOR CALIBRATION SERVICES</div>

          <div className="w-full mb-6">
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <td className="p-2 align-top">Quote No:</td>
                  <td className="p-2 align-top">{data.series_number || 'QUO-PRIME-000001'}</td>
                </tr>
                <tr>
                  <td className="p-2 align-top">Date:</td>
                  <td className="p-2 align-top">{data.created_at ? new Date(data.created_at).toLocaleDateString() : '31/07/2025'}</td>
                </tr>
                <tr>
                  <td className="p-2 align-top">Company:</td>
                  <td className="p-2 align-top">{data.company_name || 'Test 2'}</td>
                </tr>
                <tr>
                  <td className="p-2 align-top">Customer Ref:</td>
                  <td className="p-2 align-top">{data.customer_ref || 'Request for Quotation by Email'}</td>
                </tr>
                <tr>
                  <td className="p-2 align-top">Address:</td>
                  <td className="p-2 align-top">{data.company_address || 'Test 2'}</td>
                </tr>
                <tr>
                  <td className="p-2 align-top">Tel:</td>
                  <td className="p-2 align-top">{data.company_phone || '0987654321'}</td>
                </tr>
                <tr>
                  <td className="p-2 align-top">Attention:</td>
                  <td className="p-2 align-top">{data.point_of_contact_name || 'Test 2'}</td>
                </tr>
                <tr>
                  <td className="p-2 align-top">Email Id:</td>
                  <td className="p-2 align-top">{data.company_email || 'test2@gmail.com'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 text-sm leading-relaxed py-3">
            <strong>Our Bank Account Details are as follows:</strong><br />
            Bank Name: Saudi National Bank<br />
            Account Name: Prime Innovation Contracting Company<br />
            Account Number: 95400006193408<br />
            IBAN: SA3210000095400006193408<br />
            Bank Address: The Saudi National Bank tower, King fahd Road 3208,Al Aqeeq District Unit No :778 Riyadh 13519-6676 Saudi Arabia<br />
            Company Address: Bldg No. 2099, Al Fayha Dist. 7453, Ras Tannurah-32817 City: Rastanura<br />
            Please ensure that all payments are made to the above‐mentioned account details.
          </div>

          <div className="page-footer-first text-sm">
            <div className="text-left text-xs leading-relaxed">
              Ph: +966 50 584 7698<br />
              Info@primearabiagroup.com<br />
              Bldg No. 2099, Al Fayha Dist.7453, Ras Tannurah-32817<br />
              www.primearabiagroup.com<br />
              CR No: 2050172178
            </div>
            <div className="flex justify-between gap-5 px-0 py-2.5">
              <div>PRM-QAF-QR-00</div>
              <div>ISSUE DATE 12-NOV-2023</div>
              <div>REV NO:00</div>
            </div>
          </div>
        </div>

        {/* Page 2 - Table */}
        <div className="break-before-page">
          <div className="text-center mb-6">
            <div className="text-xl font-bold mb-2">Prime Innovation Contracting Co.</div>
            <div className="text-lg mb-4">شركة ابتكار الرئيسية للمقاوﻻت</div>
          </div>

          <div className="text-center text-lg font-bold underline mb-6">CALIBRATION INSTRUMENT & EQUIPMENT</div>

          <table className="w-full border-collapse mb-6">
            <thead>
              <tr className="bg-gray-100 font-bold">
                <th className="border border-gray-800 p-2.5 text-left">Sl. No.</th>
                <th className="border border-gray-800 p-2.5 text-left">Description</th>
                <th className="border border-gray-800 p-2.5 text-left">Unit</th>
                <th className="border border-gray-800 p-2.5 text-left">Qty</th>
                <th className="border border-gray-800 p-2.5 text-left">Unit price (SAR)</th>
                <th className="border border-gray-800 p-2.5 text-left">Total Price (SAR)</th>
              </tr>
            </thead>
            <tbody>
              {data.items && data.items.length > 0 ? (
                data.items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="border border-gray-800 p-2.5">{index + 1}</td>
                    <td className="border border-gray-800 p-2.5">{item.name || 'N/A'}</td>
                    <td className="border border-gray-800 p-2.5">{item.unit || 'Nos'}</td>
                    <td className="border border-gray-800 p-2.5">{item.quantity || 'N/A'}</td>
                    <td className="border border-gray-800 p-2.5">{item.unit_price ? Number(item.unit_price).toFixed(2) : 'N/A'}</td>
                    <td className="border border-gray-800 p-2.5">{item.quantity && item.unit_price ? Number(item.quantity * item.unit_price).toFixed(2) : '0.00'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="border border-gray-800 p-2.5 text-center">No items available.</td>
                </tr>
              )}
              <tr className="font-bold">
                <td colSpan="5" className="border border-gray-800 p-2.5">Grand Total (SAR)</td>
                <td className="border border-gray-800 p-2.5">{grandTotal}</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-6 text-sm leading-relaxed">
            <strong>Terms & Conditions</strong><br />
            Calibration Service General Terms and Conditions
            <ul className="list-disc pl-6 mt-2.5">
              <li>Following the calibration of each instrument, a comprehensive calibration report will be generated. Prime Innovation adheres to the fundamental principle governing the utilization of its accreditation logo. The accreditation logo serves as an assurance to the market that Prime Innovation complies with the applicable accreditation requirements. It is essential to note that the accreditation logo and the company logo of Prime Innovation are exclusively reserved for the sole use of Prime Innovation. Customers are expressly prohibited from utilizing these logos for profit, such as in advertisements on documents or commercial papers</li>
              <li>Customers are required to communicate their tolerance limits to Prime Innovation through email, facilitated by the assigned Prime Innovation Sales representative. In instances where no tolerance limit is communicated to Prime Innovation, the manufacturer’s tolerance limit will be implemented. In cases where customers fail to provide the tolerance limit before calibration and subsequently wish to re-calibrate with their specified tolerance, Prime Innovation will apply the same amount as originally quoted.</li>
              <li>If a unit is identified as defective and requires repair, such matters fall outside the scope of Prime Innovation's services. In such cases, you will be advised to reach out to the manufacturer or your respective vendor for necessary repairs. Following the completion of repairs, you are then encouraged to resubmit the unit to Prime Innovation for calibration.</li>
              <li>Prime Innovation is committed to employing calibration methods that are suitable for the specific calibration tasks undertaken. Whenever feasible, Prime Innovation will utilize methods outlined in the instrument's service manual. Alternatively, international, regional, or national standards will be referenced when appropriate. In some cases, Prime Innovation may also employ methods developed in-house. The method used for calibration will be clearly indicated on the test report. Nonstandard methods will only be employed with your</li>
            </ul>
          </div>
        </div>

        {/* Page 3 - Remaining Terms */}
        <div className="break-before-page">
          <div className="text-center mb-6">
            <div className="text-xl font-bold mb-2">Prime Innovation Contracting Co.</div>
            <div className="text-lg mb-4">شركة ابتكار الرئيسية للمقاوﻻت</div>
          </div>

          <div className="mt-6 text-sm leading-relaxed">
            <ul className="list-disc pl-6">
              <li>explicit agreement. If the proposed method from your end is deemed inappropriate or outdated, Prime Innovation will promptly inform you of this determination.</li>
              <li>Normal turnaround time for Prime Innovation calibration services varies, depending on the type of Service requested and fluctuations in workload. However, 2-3 working days is normal for calibration services.</li>
              <li>Prime Innovation have free pick-up and delivery service from customer premises following to the availability of prime innovation sales team.</li>
              <li>Customers purchase order or written approval is required to start calibration.</li>
              <li>Prime Innovation will invoice completed and delivered instruments irrespective of total number of instruments in the PO. Hence customer is liable to accept the submitted partial invoices and proceed with payment.</li>
              <li>If the UUC (unit under Calibration) was found to be out of tolerance during calibration, and it will result to the rejection of the UUC, then 100% quoted rate for calibration shall be charged.</li>
              <li>Customer should provide written request in advance if conformity statement to a specification or standard (PASS/FAIL) is required and choose what decision rules to be applied.</li>
              <li>PAYMENT: Payment to be made after 30 days</li>
              <li>CONFIDENTIALITY: Unless the customer had made the information publicly available, or with agreement with the customer, all calibration results and documents created during the calibration of customer's equipment are considered proprietary information and treated as confidential. When required by by law or by contractual agreement to release confidential information, Prime Innovation will inform the customer representative unless otherwise prohibited by law . Information about the customer obtained from sources other than the customer (e.g. complainant, regulators) is confidential between the customer and the laboratory. The provider (source) of this information is confidential to PRIME INNOVATION and do not share with the customer, unless agreed by the source.</li>
              <li>VAT is excluded from our quotation and will be charged at 15% extra.</li>
            </ul>
          </div>

          <div className="mt-8 text-right text-sm leading-relaxed">
            For Prime Innovation Contracting Co<br /><br /><br />
            Hari Krishnan M<br />
            Head ‐ Engineering and QA/QC
          </div>
        </div>
      </body>
    </html>
  );
};

export default Template1;