export const printLabel = (carton: any, article: any, order: any) => {
  const qrPayload = encodeURIComponent(JSON.stringify(carton.qr_payload || { id: carton.id }));
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrPayload}`;

  const dateStr = new Date(carton.created_at || Date.now()).toLocaleString();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Impression Etiquette</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            width: 100mm;
            height: 100mm; /* Adaptable to thermal printer size */
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
          }
          .label-container {
            border: 2px solid #000;
            padding: 15px;
            width: 90%;
            height: 90%;
            box-sizing: border-box;
          }
          h1 { margin: 0 0 10px 0; font-size: 24px; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 5px; }
          .detail { font-size: 18px; font-weight: bold; margin: 5px 0; text-align: left; }
          .qr-code { margin-top: 15px; }
          img { width: 120px; height: 120px; }
        </style>
      </head>
      <body>
        <div class="label-container">
          <h1>FactoryFlow TN</h1>
          <div class="detail">CARTON: ${carton.carton_number || 'N/A'}</div>
          <div class="detail">OF: ${order?.of_number || 'N/A'}</div>
          <div class="detail">ARTICLE: ${article?.reference || 'N/A'}</div>
          <div class="detail">QTE: ${carton.quantity || (carton.good_quantity || 0)}</div>
          <div class="detail" style="font-size: 12px; margin-top: 10px;">DATE: ${dateStr}</div>
          <div class="qr-code">
            <img src="${qrUrl}" alt="QR Code" />
          </div>
        </div>
        <script>
          // Wait for the image to load before printing
          window.onload = () => {
            setTimeout(() => {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            }, 500);
          };
        </script>
      </body>
    </html>
  `;

  // Create an iframe to print silently
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(htmlContent);
    doc.close();
  }

  // Cleanup iframe after a few seconds
  setTimeout(() => {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  }, 5000);
};

export const printAllLabels = (items: {carton: any, article: any, order: any}[]) => {
  if (items.length === 0) return;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Impression Etiquettes</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
          }
          .page {
            width: 100mm;
            height: 100mm; /* Adaptable to thermal printer size */
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            page-break-after: always;
            box-sizing: border-box;
          }
          .label-container {
            border: 2px solid #000;
            padding: 15px;
            width: 90%;
            height: 90%;
            box-sizing: border-box;
          }
          h1 { margin: 0 0 10px 0; font-size: 24px; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 5px; }
          .detail { font-size: 18px; font-weight: bold; margin: 5px 0; text-align: left; }
          .qr-code { margin-top: 15px; }
          img { width: 120px; height: 120px; }
        </style>
      </head>
      <body>
        ${items.map(({carton, article, order}) => {
          const qrPayload = encodeURIComponent(JSON.stringify(carton.qr_payload || { id: carton.id }));
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrPayload}`;
          const dateStr = new Date(carton.created_at || Date.now()).toLocaleString();
          
          return `
            <div class="page">
              <div class="label-container">
                <h1>FactoryFlow TN</h1>
                <div class="detail">CARTON: ${carton.carton_number || 'N/A'}</div>
                <div class="detail">OF: ${order?.of_number || 'N/A'}</div>
                <div class="detail">ARTICLE: ${article?.reference || 'N/A'}</div>
                <div class="detail">QTE: ${carton.quantity || (carton.good_quantity || 0)}</div>
                <div class="detail" style="font-size: 12px; margin-top: 10px;">DATE: ${dateStr}</div>
                <div class="qr-code">
                  <img src="${qrUrl}" alt="QR Code" />
                </div>
              </div>
            </div>
          `;
        }).join('')}
        <script>
          // Wait for the images to load before printing
          window.onload = () => {
            setTimeout(() => {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            }, 1500); // give it slightly more time to load all QR codes
          };
        </script>
      </body>
    </html>
  `;

  // Create an iframe to print silently
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(htmlContent);
    doc.close();
  }

  // Cleanup iframe after a few seconds
  setTimeout(() => {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  }, 10000);
};

export const printLotLabel = (lotNumber: string, totalQuantity: number, article: any, order: any, dateStr: string, sessionStart: string, sessionEnd: string | null, sessionArticle: string) => {
  const qrPayload = encodeURIComponent(JSON.stringify({ 
    is_lot: true, 
    lot_number: lotNumber, 
    qty: totalQuantity, 
    start: sessionStart, 
    end: sessionEnd, 
    article: sessionArticle 
  }));
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrPayload}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Impression Etiquette Globale Lot</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            width: 100mm;
            height: 100mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
          }
          .label-container {
            border: 3px solid #000;
            padding: 15px;
            width: 90%;
            height: 90%;
            box-sizing: border-box;
            background-color: #f9f9f9;
          }
          h1 { margin: 0 0 10px 0; font-size: 26px; text-transform: uppercase; border-bottom: 3px solid #000; padding-bottom: 5px; }
          .detail { font-size: 20px; font-weight: bold; margin: 6px 0; text-align: left; }
          .highlight { background-color: #e0e0e0; padding: 2px 5px; border-radius: 4px; }
          .qr-code { margin-top: 15px; }
          img { width: 130px; height: 130px; }
        </style>
      </head>
      <body>
        <div class="label-container">
          <h1>LOT MASTER</h1>
          <div class="detail highlight">LOT: ${lotNumber || 'N/A'}</div>
          <div class="detail">OF: ${order?.of_number || 'N/A'}</div>
          <div class="detail">ARTICLE: ${article?.reference || 'N/A'}</div>
          <div class="detail highlight">QTE TOTALE: ${totalQuantity}</div>
          <div class="detail" style="font-size: 14px; margin-top: 10px;">DATE: ${new Date(dateStr).toLocaleString()}</div>
          <div class="qr-code">
            <img src="${qrUrl}" alt="QR Code" />
          </div>
        </div>
        <script>
          window.onload = () => {
            setTimeout(() => {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            }, 500);
          };
        </script>
      </body>
    </html>
  `;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(htmlContent);
    doc.close();
  }

  setTimeout(() => {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  }, 5000);
};
