const Test = ({ data }) => `
  <!DOCTYPE html>
  <html>
    <head>
      <title>RFQ ${data.series_number || data.id}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
        }
        h1 {
          color: #2c3e50;
        }
      </style>
    </head>
    <body>
      <h1>RFQ Details</h1>
      <p><strong>Series Number:</strong> ${data.series_number || data.id}</p>
    </body>
  </html>
`;

export default Test;
