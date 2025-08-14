import React from 'react';

const Template2 = ({ data }) => {
  const calculateTotal = (items) => {
    return items.reduce((acc, item) => acc + (item.quantity * item.unit_price || 0), 0).toFixed(2);
  };

  const grandTotal = calculateTotal(data.items || []);

  return (
    <html>
      <head>
        <title>Work Order - {data.wo_number || 'N/A'}</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />
        <style>
          {`
            @page {
              size: A4 portrait;
              margin: 1.2cm 1.7cm 2.2cm 1.7cm;
            }
            body { font-size: 10pt; line-height: 1.2; }
            .header { text-align: center; margin-bottom: 1rem; }
            .arabic { font-family: 'Traditional Arabic', sans-serif; }
            .table-details { width: 100%; border: 1px solid #000; border-collapse: collapse; font-size: 9pt; }
            .table-details td { padding: 0.3rem; border-bottom: 1px solid #e5e7eb; }
            .item-table { width: 100%; border: 1px solid #000; border-collapse: collapse; font-size: 9pt; }
            .item-table th, .item-table td { padding: 0.3rem; border: 1px solid #000; }
            .terms { margin-top: 1rem; font-size: 8pt; line-height: 1.1; }
            .signature { text-align: right; margin-top: 1rem; font-size: 9pt; }
            .footer-row { display: flex; justify-content: space-between; margin-top: 1rem; font-size: 8pt; }
            .bank-details { line-height: 1.2; margin-bottom: 0.5rem; font-size: 8pt; }
            .contact-details { display: flex; justify-content: space-between; margin-top: 0.5rem; font-size: 8pt; line-height: 1.1; }
          `}
        </style>
      </head>
      <body className="font-sans">
        <div className="mb-4">
          <div className="header">
            <img src="path/to/your/logo.png" alt="Prime Innovation Logo" className="w-24 mx-auto mb-1" />
            <div className="text-lg font-bold mb-1">Prime Innovation Contracting Co.</div>
            <div className="text-base mb-2 arabic">شركة ابتكار الرئيسية للمقاوﻻت</div>
          </div>

          <div className="text-center text-base font-bold underline mb-3">WORK ORDER FOR CALIBRATION SERVICES</div>

          <div className="text-center text-sm mb-2"><strong>Work Order Details</strong></div>

          <table className="table-details mb-2">
            <tbody>
              <tr>
                <td className="text-left w-1/2">WO Number:</td>
                <td className="text-left w-1/2">{data.wo_number || 'N/A'}</td>
              </tr>
              <tr>
                <td className="text-left w-1/2">Status:</td>
                <td className="text-left w-1/2">{data.status || 'N/A'}</td>
              </tr>
              <tr>
                <td className="text-left w-1/2">Manager Approval Status:</td>
                <td className="text-left w-1/2">{data.manager_approval_status || 'N/A'}</td>
              </tr>
              {data.manager_approval_status === 'Declined' && (
                <tr>
                  <td className="text-left w-1/2">Decline Reason:</td>
                  <td className="text-left w-1/2">{data.decline_reason || 'N/A'}</td>
                </tr>
              )}
              <tr>
                <td className="text-left w-1/2">Created At:</td>
                <td className="text-left w-1/2">{data.created_at ? new Date(data.created_at).toLocaleDateString() : 'N/A'}</td>
              </tr>
              <tr>
                <td className="text-left w-1/2">Date Received:</td>
                <td className="text-left w-1/2">{data.date_received ? new Date(data.date_received).toLocaleDateString() : 'N/A'}</td>
              </tr>
              <tr>
                <td className="text-left w-1/2">Expected Completion:</td>
                <td className="text-left w-1/2">{data.expected_completion_date ? new Date(data.expected_completion_date).toLocaleDateString() : 'N/A'}</td>
              </tr>
              <tr>
                <td className="text-left w-1/2">Onsite/Lab:</td>
                <td className="text-left w-1/2">{data.onsite_or_lab || 'N/A'}</td>
              </tr>
              <tr>
                <td className="text-left w-1/2">Range:</td>
                <td className="text-left w-1/2">{data.range || 'N/A'}</td>
              </tr>
              <tr>
                <td className="text-left w-1/2">Serial Number:</td>
                <td className="text-left w-1/2">{data.serial_number || 'N/A'}</td>
              </tr>
              <tr>
                <td className="text-left w-1/2">Site Location:</td>
                <td className="text-left w-1/2">{data.site_location || 'N/A'}</td>
              </tr>
              <tr>
                <td className="text-left w-1/2">Remarks:</td>
                <td className="text-left w-1/2">{data.remarks || 'N/A'}</td>
              </tr>
              <tr>
                <td className="text-left w-1/2">Assigned To:</td>
                <td className="text-left w-1/2">{data.techniciansAssigned || 'N/A'}</td>
              </tr>
            </tbody>
          </table>

          <div className="text-sm bank-details mb-2">
            <strong>Our Bank Account Details are as follows:</strong><br />
            Bank Name: Saudi National Bank<br />
            Account Name: Prime Innovation Contracting Company<br />
            Account Number: 95400006193408<br />
            IBAN: SA3210000095400006193408<br />
            Bank Address: The Saudi National Bank tower, King Fahd Road 3208, Al Aqeeq District Unit No: 778 Riyadh 13519-6676 Saudi Arabia<br />
            Company Address: Bldg No. 2099, Al Fayha Dist. 7453, Ras Tannurah-32817 City: Rastanura<br />
            <strong>Please ensure that all payments are made to the above-mentioned account details.</strong>
          </div>

          <div className="text-center text-base font-bold underline mb-3">CALIBRATION INSTRUMENT & EQUIPMENT</div>

          <table className="item-table mb-2">
            <thead>
              <tr className="font-bold">
                <th className="p-2 text-left">Sl. No.</th>
                <th className="p-2 text-left">Description</th>
                <th className="p-2 text-left">Unit</th>
                <th className="p-2 text-left">Qty</th>
                <th className="p-2 text-left">Unit Price (SAR)</th>
                <th className="p-2 text-left">Total Price (SAR)</th>
                <th className="p-2 text-left">Assigned To</th>
                <th className="p-2 text-left">Certificate UUT Label</th>
                <th className="p-2 text-left">Certificate Number</th>
                <th className="p-2 text-left">Calibration Date</th>
                <th className="p-2 text-left">Calibration Due Date</th>
                <th className="p-2 text-left">UUC Serial Number</th>
                <th className="p-2 text-left">Certificate</th>
              </tr>
            </thead>
            <tbody>
              {data.items && data.items.length > 0 ? (
                data.items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="p-2 text-left">{index + 1}</td>
                    <td className="p-2 text-left">{item.name}</td>
                    <td className="p-2 text-left">{item.unit}</td>
                    <td className="p-2 text-left">{item.quantity}</td>
                    <td className="p-2 text-left">{item.unit_price}</td>
                    <td className="p-2 text-left">{item.quantity && item.unit_price ? Number(item.quantity * item.unit_price).toFixed(2) : '0.00'}</td>
                    <td className="p-2 text-left">{item.assigned_to}</td>
                    <td className="p-2 text-left">{item.certificate_uut_label}</td>
                    <td className="p-2 text-left">{item.certificate_number}</td>
                    <td className="p-2 text-left">{item.calibration_date}</td>
                    <td className="p-2 text-left">{item.calibration_due_date}</td>
                    <td className="p-2 text-left">{item.uuc_serial_number}</td>
                    <td className="p-2 text-left">
                      {item.certificate_file ? (
                        <a href={item.certificate_file} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Certificate</a>
                      ) : 'N/A'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="13" className="p-2 text-center">No items available.</td>
                </tr>
              )}
              <tr className="font-bold">
                <td colSpan="5" className="p-2 text-left">Grand Total (SAR)</td>
                <td colSpan="8" className="p-2 text-left">{grandTotal}</td>
              </tr>
            </tbody>
          </table>

          <div className="terms">
            <strong>Terms & Conditions</strong><br /><strong>
            Calibration Service General Terms and Conditions</strong><br />
            • Following the calibration of each instrument, a comprehensive calibration report will be generated. Prime Innovation adheres to the fundamental principle governing the utilization of its accreditation logo.<br />
            • Customers are required to communicate their tolerance limits to Prime Innovation through email, facilitated by the assigned Prime Innovation Sales representative.<br />
            • If a unit is identified as defective and requires repair, such matters fall outside the scope of Prime Innovation's services.<br />
            • Normal turnaround time for Prime Innovation calibration services varies, depending on the type of Service requested and fluctuations in workload. However, 2-3 working days is normal for calibration services.<br />
            • Prime Innovation have free pick-up and delivery service from customer premises following to the availability of prime innovation sales team.<br />
            • Customers purchase order or written approval is required to start calibration.<br />
            • Prime Innovation will invoice completed and delivered instruments irrespective of total number of instruments in the PO.<br />
            • If the UUC (unit under Calibration) was found to be out of tolerance during calibration, and it will result to the rejection of the UUC, then 100% quoted rate for calibration shall be charged.<br />
            • Customer should provide written request in advance if conformity statement to a specification or standard (PASS/FAIL) is required.<br />
            • PAYMENT: Payment to be made after 30 days<br />
            • VAT is excluded from our quotation and will be charged at 15% extra.
          </div>

          <div className="signature text-sm">
            For Prime Innovation Contracting Co<br />
            Hari Krishnan M<br />
            Head - Engineering and QA/QC
          </div>

          <div className="contact-details">
            <div>
              Bldg No. 2099, Al Fayha Dist. 7453, Ras Tannurah-32817<br />
              www.primearabiagroup.com<br />
              CR No: 2050172178
            </div>
            <div>
              Ph: +966 50 584 7698<br />
              Info@primearabiagroup.com
            </div>
          </div>

          <div className="footer-row">
            <div>PRM-QAF-WO-00</div>
            <div className="flex-1 text-center">ISSUE DATE 13-AUG-2025</div>
            <div>REV NO: 00</div>
          </div>
        </div>
      </body>
    </html>
  );
};

export default Template2;