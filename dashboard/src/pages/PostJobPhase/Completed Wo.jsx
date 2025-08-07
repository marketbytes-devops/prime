import React from 'react';

const CompletedWO = () => {
  return (
    <div>
      <h1>Completed WO</h1>
      <table>
        <thead>
          <tr>
            <th>Sl:No</th>
            <th>Created At</th>
            <th>WO Number</th>
            <th>Assigned To</th>
            <th>View Documents</th>
            <th>Invoice Status</th>
          </tr>
        </thead>
        <tbody>
          {/* Add your table rows here */}
        </tbody>
      </table>
    </div>
  );
};

export default CompletedWO;
