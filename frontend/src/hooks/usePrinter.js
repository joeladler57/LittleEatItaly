import { useState, useCallback } from 'react';
import axios from 'axios';
import { API } from '../App';
import { toast } from 'sonner';

/**
 * Hook for Epson TM-30III printing via ePOS SDK
 * The printer must be on the same network as the device running the browser
 */
export const usePrinter = () => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [printerStatus, setPrinterStatus] = useState('unknown'); // unknown, connected, disconnected, error

  /**
   * Print an order receipt using Epson ePOS SDK
   * @param {Object} order - The order object to print
   * @param {Object} settings - Shop settings including printer config and template
   */
  const printOrder = useCallback(async (order, settings) => {
    if (!settings?.printer_enabled || !settings?.printer_ip) {
      console.log('Printer not configured');
      return { success: false, error: 'Drucker nicht konfiguriert' };
    }

    setIsPrinting(true);
    
    try {
      const printerUrl = `http://${settings.printer_ip}:${settings.printer_port || 8008}/cgi-bin/epos/service.cgi?devid=${settings.printer_device_id || 'local_printer'}&timeout=10000`;
      const template = settings.receipt_template || {};
      
      // Build ESC/POS XML for Epson ePOS
      const receiptXml = buildReceiptXml(order, settings, template);
      
      // Create SOAP envelope
      const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
  <s:Body>
    <epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">
      ${receiptXml}
    </epos-print>
  </s:Body>
</s:Envelope>`;

      // Send to printer
      const response = await fetch(printerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': '""'
        },
        body: soapEnvelope,
        mode: 'cors'
      });

      if (response.ok) {
        setPrinterStatus('connected');
        toast.success('🖨️ Bon gedruckt!');
        return { success: true };
      } else {
        throw new Error(`Printer error: ${response.status}`);
      }
    } catch (error) {
      console.error('Print error:', error);
      setPrinterStatus('error');
      
      // Show error and try fallback
      toast.error("Direktdruck fehlgeschlagen - öffne Browser-Dialog...");
      
      // If direct printing fails, try fallback approach
      return await printFallback(order, settings);
    } finally {
      setIsPrinting(false);
    }
  }, []);

  /**
   * Fallback: Open print dialog with formatted receipt
   */
  const printFallback = async (order, settings) => {
    try {
      const template = settings?.receipt_template || {};
      const receiptHtml = buildReceiptHtml(order, settings, template);
      
      // Open print window
      const printWindow = window.open('', '_blank', 'width=400,height=600');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Bon #${order.order_number}</title>
          <style>
            @page { margin: 0; size: 80mm auto; }
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 12px; 
              width: 80mm; 
              margin: 0 auto; 
              padding: 10px;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .large { font-size: 18px; }
            .xlarge { font-size: 24px; }
            .separator { border-top: 1px dashed #000; margin: 8px 0; }
            .item-row { display: flex; justify-content: space-between; padding: 2px 0; }
            .highlight { background: #000; color: #fff; padding: 8px; text-align: center; margin: 8px 0; }
            .notes-box { border: 2px solid #000; padding: 8px; margin: 8px 0; }
          </style>
        </head>
        <body>
          ${receiptHtml}
          <script>
            window.onload = function() { 
              window.print(); 
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
      
      toast.success('🖨️ Druckdialog geöffnet');
      return { success: true, fallback: true };
    } catch (error) {
      toast.error('Drucken fehlgeschlagen');
      return { success: false, error: error.message };
    }
  };

  /**
   * Test printer connection
   */
  const testPrinter = useCallback(async (settings) => {
    if (!settings?.printer_ip) {
      toast.error('Keine Drucker-IP konfiguriert');
      return false;
    }

    setIsPrinting(true);
    try {
      const testOrder = {
        order_number: 'TEST',
        customer_name: 'Test Kunde',
        customer_phone: '0000 0000000',
        pickup_time: 'JETZT',
        created_at: new Date().toISOString(),
        items: [{ quantity: 1, item_name: 'Test Artikel', total_price: 0.00 }],
        total: 0.00,
        notes: 'Dies ist ein Testdruck',
        payment_method: 'Test'
      };

      return await printOrder(testOrder, settings);
    } finally {
      setIsPrinting(false);
    }
  }, [printOrder]);

  return {
    printOrder,
    testPrinter,
    isPrinting,
    printerStatus
  };
};

/**
 * Build ESC/POS XML for Epson ePOS printer
 */
function buildReceiptXml(order, settings, template) {
  const h = template.header || {};
  const o = template.order_info || {};
  const i = template.items || {};
  const n = template.notes || {};
  const t = template.totals || {};
  const f = template.footer || {};

  let xml = '';

  // Initialize
  xml += '<text lang="de"/>';

  // Header
  if (h.show_restaurant_name) {
    xml += `<text align="center" ${h.restaurant_name_bold ? 'em="true"' : ''} ${getSizeAttr(h.restaurant_name_size)}/>`;
    xml += `<text>${escapeXml(settings?.restaurant_name || 'Restaurant')}&#10;</text>`;
  }
  if (h.show_address) {
    xml += '<text align="center" width="1" height="1"/>';
    xml += `<text>${escapeXml(settings?.restaurant_address || '')}&#10;</text>`;
  }
  if (h.show_phone) {
    xml += `<text>Tel: ${escapeXml(settings?.restaurant_phone || '')}&#10;</text>`;
  }
  if (h.show_separator) {
    xml += '<text>--------------------------------&#10;</text>';
  }

  // Order Number
  if (o.show_order_number) {
    xml += '<feed unit="20"/>';
    xml += `<text align="center" ${o.order_number_bold ? 'em="true"' : ''} ${getSizeAttr(o.order_number_size)}/>`;
    xml += `<text>#${order.order_number}&#10;</text>`;
  }

  // Date/Time
  if (o.show_date_time) {
    xml += '<text align="center" width="1" height="1"/>';
    xml += `<text>${new Date(order.created_at).toLocaleString('de-DE')}&#10;</text>`;
  }

  // Customer
  if (o.show_customer_name) {
    xml += '<feed unit="10"/>';
    xml += `<text ${o.customer_name_bold ? 'em="true"' : ''}/>`;
    xml += `<text>Kunde: ${escapeXml(order.customer_name)}&#10;</text>`;
  }
  if (o.show_customer_phone) {
    xml += '<text em="false"/>';
    xml += `<text>Tel: ${escapeXml(order.customer_phone)}&#10;</text>`;
  }

  // Pickup Time (highlighted)
  if (o.show_pickup_time) {
    xml += '<feed unit="10"/>';
    xml += '<text reverse="true" align="center"/>';
    xml += `<text ${o.pickup_time_bold ? 'em="true"' : ''} ${getSizeAttr(o.pickup_time_size)}/>`;
    xml += `<text> ABHOLUNG: ${escapeXml(order.pickup_time || order.confirmed_pickup_time || 'N/A')} </text>`;
    xml += '<text reverse="false"/>&#10;';
  }

  if (o.show_separator) {
    xml += '<text align="left" em="false" width="1" height="1"/>';
    xml += '<text>--------------------------------&#10;</text>';
  }

  // Items
  xml += '<feed unit="10"/>';
  for (const item of (order.items || [])) {
    xml += `<text ${i.item_name_bold ? 'em="true"' : 'em="false"'}/>`;
    let itemLine = '';
    if (i.show_quantity) itemLine += `${item.quantity}x `;
    itemLine += item.item_name;
    if (i.show_size && item.size_name) itemLine += ` (${item.size_name})`;
    
    if (i.show_item_price) {
      const price = `${item.total_price.toFixed(2)}€`;
      const padding = 32 - itemLine.length - price.length;
      itemLine += ' '.repeat(Math.max(1, padding)) + price;
    }
    xml += `<text>${escapeXml(itemLine)}&#10;</text>`;
    
    // Options
    if (i.show_options && item.options && item.options.length > 0) {
      xml += '<text em="false"/>';
      xml += `<text>  + ${escapeXml(item.options.join(', '))}&#10;</text>`;
    }
  }

  if (i.show_separator) {
    xml += '<text>--------------------------------&#10;</text>';
  }

  // Notes
  if (n.show_notes && order.notes) {
    xml += '<feed unit="10"/>';
    if (n.notes_box) {
      xml += '<text>================================&#10;</text>';
    }
    xml += `<text ${n.notes_bold ? 'em="true"' : 'em="false"'}/>`;
    xml += `<text>* ${escapeXml(order.notes)}&#10;</text>`;
    if (n.notes_box) {
      xml += '<text>================================&#10;</text>';
    }
  }

  // Total
  if (t.show_total) {
    xml += '<feed unit="10"/>';
    xml += `<text ${t.total_bold ? 'em="true"' : ''} ${getSizeAttr(t.total_size)}/>`;
    const totalLine = `GESAMT: ${order.total.toFixed(2)}€`;
    xml += `<text align="right"/><text>${escapeXml(totalLine)}&#10;</text>`;
  }

  if (t.show_payment_method) {
    xml += '<text em="false" width="1" height="1"/>';
    xml += `<text>Zahlung: ${escapeXml(order.payment_method || 'Bar')}&#10;</text>`;
  }

  if (t.show_separator) {
    xml += '<text>--------------------------------&#10;</text>';
  }

  // Footer
  if (f.show_thank_you) {
    xml += '<feed unit="10"/>';
    xml += '<text align="center"/>';
    xml += `<text>${escapeXml(f.thank_you_text || 'Vielen Dank!')}&#10;</text>`;
  }
  if (f.show_custom_text && f.custom_text) {
    xml += `<text>${escapeXml(f.custom_text)}&#10;</text>`;
  }

  // Cut
  xml += '<feed unit="30"/>';
  xml += '<cut type="feed"/>';

  return xml;
}

/**
 * Build HTML receipt for fallback printing
 */
function buildReceiptHtml(order, settings, template) {
  const h = template.header || {};
  const o = template.order_info || {};
  const i = template.items || {};
  const n = template.notes || {};
  const t = template.totals || {};
  const f = template.footer || {};

  let html = '';

  // Header
  if (h.show_restaurant_name) {
    html += `<div class="center ${h.restaurant_name_bold ? 'bold' : ''} ${getSizeClass(h.restaurant_name_size)}">${escapeHtml(settings?.restaurant_name || 'Restaurant')}</div>`;
  }
  if (h.show_address) {
    html += `<div class="center">${escapeHtml(settings?.restaurant_address || '')}</div>`;
  }
  if (h.show_phone) {
    html += `<div class="center">Tel: ${escapeHtml(settings?.restaurant_phone || '')}</div>`;
  }
  if (h.show_separator) {
    html += '<div class="separator"></div>';
  }

  // Order Number
  if (o.show_order_number) {
    html += `<div class="center ${o.order_number_bold ? 'bold' : ''} ${getSizeClass(o.order_number_size)}">#${order.order_number}</div>`;
  }

  // Date/Time
  if (o.show_date_time) {
    html += `<div class="center">${new Date(order.created_at).toLocaleString('de-DE')}</div>`;
  }

  // Customer
  if (o.show_customer_name) {
    html += `<div class="${o.customer_name_bold ? 'bold' : ''}">Kunde: ${escapeHtml(order.customer_name)}</div>`;
  }
  if (o.show_customer_phone) {
    html += `<div>Tel: ${escapeHtml(order.customer_phone)}</div>`;
  }

  // Pickup Time
  if (o.show_pickup_time) {
    html += `<div class="highlight ${o.pickup_time_bold ? 'bold' : ''} ${getSizeClass(o.pickup_time_size)}">ABHOLUNG: ${escapeHtml(order.pickup_time || order.confirmed_pickup_time || 'N/A')}</div>`;
  }

  if (o.show_separator) {
    html += '<div class="separator"></div>';
  }

  // Items
  for (const item of (order.items || [])) {
    let itemName = '';
    if (i.show_quantity) itemName += `${item.quantity}x `;
    itemName += item.item_name;
    if (i.show_size && item.size_name) itemName += ` (${item.size_name})`;

    html += `<div class="item-row"><span class="${i.item_name_bold ? 'bold' : ''}">${escapeHtml(itemName)}</span>`;
    if (i.show_item_price) {
      html += `<span>${item.total_price.toFixed(2)}€</span>`;
    }
    html += '</div>';

    if (i.show_options && item.options && item.options.length > 0) {
      html += `<div style="margin-left: 20px; font-size: 10px;">+ ${escapeHtml(item.options.join(', '))}</div>`;
    }
  }

  if (i.show_separator) {
    html += '<div class="separator"></div>';
  }

  // Notes
  if (n.show_notes && order.notes) {
    html += `<div class="${n.notes_box ? 'notes-box' : ''} ${n.notes_bold ? 'bold' : ''}">📝 ${escapeHtml(order.notes)}</div>`;
  }

  // Total
  if (t.show_total) {
    html += `<div class="item-row ${t.total_bold ? 'bold' : ''} ${getSizeClass(t.total_size)}"><span>GESAMT:</span><span>${order.total.toFixed(2)}€</span></div>`;
  }

  if (t.show_payment_method) {
    html += `<div>Zahlung: ${escapeHtml(order.payment_method || 'Bar')}</div>`;
  }

  if (t.show_separator) {
    html += '<div class="separator"></div>';
  }

  // Footer
  if (f.show_thank_you) {
    html += `<div class="center">${escapeHtml(f.thank_you_text || 'Vielen Dank!')}</div>`;
  }
  if (f.show_custom_text && f.custom_text) {
    html += `<div class="center">${escapeHtml(f.custom_text)}</div>`;
  }

  return html;
}

function getSizeAttr(size) {
  switch (size) {
    case 'large': return 'width="2" height="2"';
    case 'medium': return 'width="1" height="2"';
    default: return 'width="1" height="1"';
  }
}

function getSizeClass(size) {
  switch (size) {
    case 'large': return 'xlarge';
    case 'medium': return 'large';
    default: return '';
  }
}

function escapeXml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export default usePrinter;
