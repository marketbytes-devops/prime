import React from 'react';
import logo from '../../../assets/images/img-logo.webp';
 
const Template1 = ({ deliveryNote, itemsList, units, quotationDetails }) => {
  if (!deliveryNote) return null;
 
  return (
    <div
      className="p-4 bg-white relative"
      id="delivery-note-template"
      style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
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
          opacity: 0.3;
          z-index: 0;
        }
        .content, .footer {
          position: relative;
          z-index: 1;
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
          }
          .content {
            padding-bottom: 100px;
          }
          .no-border {
            border: none;
          }
          .item-divider {
            border-bottom: 2px solid #000;
          }
        }
      `}</style>
 
      {/* Content Wrapper */}
      <div className="content background-container">
        {/* Header Section */}
        <div className="text-center mb-4" style={{ position:"relative"}}>
          <div>
            <h1 className="font-bold" style={{fontSize:"22px"}}>Prime Innovation Contracting Co.</h1>
            <p className="text-sm">شركائيكار الرئيسية للمقاوالت</p>
          </div>
          <div style={{ position: 'absolute', top: -10, right: 10 }}>
            <img src={logo} alt="Prime" style={{ width: '120px', height: '100px' }} />
          </div>
        </div>
 
        <h2 className="font-bold text-center mb-4" style={{ fontSize: '18px', marginTop: '60px' }}>
          DELIVERY NOTE/JOB COMPLETION
        </h2>
 
        {/* Delivery Note Details Table */}
        <table className="w-full mb-4">
          <tbody>
            <tr>
              <td className="font-bold pr-4">DATE</td>
              <td>{new Date(deliveryNote.created_at).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td className="font-bold pr-4">CUSTOMER</td>
              <td>{quotationDetails?.contact_name || 'N/A'}</td>
            </tr>
            <tr>
              <td className="font-bold pr-4">CONTACT INFORMATION</td>
              <td>
                {quotationDetails ? (
                  <>
                    {quotationDetails.contact_email || 'N/A'}
                  </>
                ) : (
                  'N/A'
                )}
              </td>
            </tr>
            <tr>
              <td className="font-bold pr-4">DELIVERY NOTE</td>
              <td>{deliveryNote.dn_number || 'N/A'}</td>
            </tr>
          </tbody>
        </table>
 
        {/* Items Table */}
        <table className="w-full border-collapse border border-gray-800 mb-4">
          <thead>
            <tr>
              <th className="border border-gray-800 p-2 text-left">SL #</th>
              <th className="border border-gray-800 p-2 text-left">DESCRIPTION OF ITEM</th>
              <th className="border border-gray-800 p-2 text-left">Range</th>
              <th className="border border-gray-800 p-2 text-left">QTY</th>
              <th className="border border-gray-800 p-2 text-left">UOM</th>
              <th className="border border-gray-800 p-2 text-left">DELIVERED QTY</th>
            </tr>
          </thead>
          <tbody>
            {deliveryNote.items &&
              deliveryNote.items.map((item, index) => (
                <React.Fragment key={item.id || index}>
                  <tr className={index < deliveryNote.items.length - 1 ? 'item-divider' : ''}>
                    <td
                      className="border border-gray-800 p-2"
                      rowSpan={item.components ? item.components.length + 1 : 1}
                    >
                      {index + 1}
                    </td>
                    <td className="border border-gray-800 p-2">
                      <div className="font-bold">
                        {itemsList.find((i) => i.id === item.item)?.name || 'N/A'}
                      </div>
                      {item.components &&
                        item.components.map((comp, compIndex) => (
                          <div key={compIndex} className="no-border">
                            <p className="p-2 pl-4 font-normal">{comp.component || 'N/A'} : {comp.value || 'N/A'}</p>
                          </div>
                        ))}
                    </td>
                    <td className="border border-gray-800 p-2">{item.range || 'N/A'}</td>
                    <td className="border border-gray-800 p-2">{item.quantity || 'N/A'}</td>
                    <td className="border border-gray-800 p-2">
                      {units.find((u) => u.id === Number(item.uom))?.name || 'N/A'}
                    </td>
                    <td className="border border-gray-800 p-2">{item.delivered_quantity || 'N/A'}</td>
                  </tr>
                </React.Fragment>
              ))}
          </tbody>
        </table>
 
        {/* Remarks Section */}
        <div className="mb-4">
          <p className="font-bold">REMARKS:</p>
        </div>
 
        {/* Delivered By and Received By Table */}
        <table className="w-full mb-4 border-collapse border border-gray-800">
          <tbody>
            <tr>
              <td className="border border-gray-800 p-2 font-bold w-1/2">DELIVERED BY</td>
              <td className="border border-gray-800 p-2 font-bold w-1/2">RECEIVED BY</td>
            </tr>
            <tr>
              <td className="border border-gray-800 p-2">NAME: {deliveryNote.delivered_by?.name || ''}</td>
              <td className="border border-gray-800 p-2">NAME: </td>
            </tr>
            <tr>
              <td className="border border-gray-800 p-2">SIGNATURE: </td>
              <td className="border border-gray-800 p-2">SIGNATURE: </td>
            </tr>
            <tr>
              <td className="border border-gray-800 p-2">DATE: {new Date().toLocaleDateString()}</td>
              <td className="border border-gray-800 p-2">DATE: {new Date().toLocaleDateString()}</td>
            </tr>
            <tr>
              <td className="border border-gray-800 p-2">ID NO: </td>
              <td className="border border-gray-800 p-2">ID NO: </td>
            </tr>
          </tbody>
        </table>
      </div>
 
      {/* Spacer to Push Footer to Bottom for On-Screen */}
      <div style={{ flexGrow: 1 }}></div>
 
      {/* Footer Section */}
      <footer className="footer flex items-center justify-between text-xs mt-8 pt-4">
        <div>
          <p>Ph: +966 50 584 7698</p>
          <p>Bldg No. 2099, Al Fayha Dist.7453, Ras Tamurah-32817</p>
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