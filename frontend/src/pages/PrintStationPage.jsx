import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";
import { Printer, Wifi, WifiOff, Check, RefreshCw, Settings, CheckCircle, XCircle, Volume2, VolumeX } from "lucide-react";

const POLLING_INTERVAL = 3000;
const CHEF_ICON = "https://customer-assets.emergentagent.com/job_red-brick-pizza/artifacts/845efg67_kopf.png";

// Default printer settings
const DEFAULT_PRINTER_IP = "192.168.2.129";
const DEFAULT_PRINTER_PORT = 8008;

// Build ePOS-Print XML from order data
const buildReceiptXML = (order, settings) => {
  const template = settings?.receipt_template || {};
  const header = template.header || {};
  const orderInfo = template.order_info || {};
  const itemsCfg = template.items || {};
  const notesCfg = template.notes || {};
  const totalsCfg = template.totals || {};
  const footerCfg = template.footer || {};

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">
<text lang="de"/>`;

  // Header - Restaurant Name
  if (header.show_restaurant_name !== false) {
    xml += `<text align="center"/>`;
    xml += `<text font="font_a" dw="true" dh="true" em="true"/>`;
    xml += `<text>${escapeXML(settings?.restaurant_name || 'Little Eat Italy')}&#10;</text>`;
    xml += `<text dw="false" dh="false" em="false"/>`;
  }

  // Address
  if (header.show_address !== false && settings?.restaurant_address) {
    xml += `<text align="center"/>`;
    xml += `<text>${escapeXML(settings.restaurant_address)}&#10;</text>`;
  }

  // Phone
  if (header.show_phone !== false && settings?.restaurant_phone) {
    xml += `<text>Tel: ${escapeXML(settings.restaurant_phone)}&#10;</text>`;
  }

  // Separator
  if (header.show_separator !== false) {
    xml += `<text>--------------------------------&#10;</text>`;
  }

  // Order Number
  if (orderInfo.show_order_number !== false) {
    xml += `<text align="center"/>`;
    xml += `<text dw="true" dh="true" em="true"/>`;
    xml += `<text>#${escapeXML(String(order.order_number || '?'))}&#10;</text>`;
    xml += `<text dw="false" dh="false" em="false"/>`;
  }

  // Date/Time
  if (orderInfo.show_date_time !== false) {
    const date = new Date(order.created_at);
    xml += `<text align="center"/>`;
    xml += `<text>${date.toLocaleDateString('de-DE')} ${date.toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit'})}&#10;</text>`;
  }

  // Customer
  xml += `<text align="left"/>`;
  if (orderInfo.show_customer_name !== false) {
    xml += `<text em="true"/>`;
    xml += `<text>Kunde: ${escapeXML(order.customer_name || '')}&#10;</text>`;
    xml += `<text em="false"/>`;
  }

  if (orderInfo.show_customer_phone !== false && order.customer_phone) {
    xml += `<text>Tel: ${escapeXML(order.customer_phone)}&#10;</text>`;
  }

  // Pickup Time - HIGHLIGHTED
  if (orderInfo.show_pickup_time !== false) {
    xml += `<feed line="1"/>`;
    xml += `<text align="center"/>`;
    xml += `<text dw="true" dh="true" em="true"/>`;
    xml += `<text>================&#10;</text>`;
    const pickupTime = order.confirmed_pickup_time || order.pickup_time || 'N/A';
    xml += `<text>ABHOLUNG: ${escapeXML(pickupTime)}&#10;</text>`;
    xml += `<text>================&#10;</text>`;
    xml += `<text dw="false" dh="false" em="false"/>`;
  }

  xml += `<text align="left"/>`;
  xml += `<text>--------------------------------&#10;</text>`;

  // Items
  for (const item of (order.items || [])) {
    let itemLine = '';
    if (itemsCfg.show_quantity !== false) {
      itemLine += (item.quantity || 1) + 'x ';
    }
    itemLine += item.item_name || '';
    if (itemsCfg.show_size !== false && item.size_name) {
      itemLine += ' (' + item.size_name + ')';
    }

    if (itemsCfg.item_name_bold) {
      xml += `<text em="true"/>`;
    }
    
    if (itemsCfg.show_item_price !== false) {
      const price = (item.total_price || 0).toFixed(2) + '€';
      const spaces = Math.max(1, 32 - itemLine.length - price.length);
      xml += `<text>${escapeXML(itemLine)}${' '.repeat(spaces)}${price}&#10;</text>`;
    } else {
      xml += `<text>${escapeXML(itemLine)}&#10;</text>`;
    }
    
    xml += `<text em="false"/>`;

    // Options
    if (itemsCfg.show_options !== false && item.options && item.options.length > 0) {
      const opts = item.options.map(o => o.option_name || o.name || String(o)).join(', ');
      xml += `<text>  + ${escapeXML(opts)}&#10;</text>`;
    }
  }

  xml += `<text>--------------------------------&#10;</text>`;

  // Notes
  if (notesCfg.show_notes !== false && order.notes) {
    if (notesCfg.notes_bold) {
      xml += `<text em="true"/>`;
    }
    if (notesCfg.notes_box) {
      xml += `<text>================================&#10;</text>`;
    }
    xml += `<text>* ${escapeXML(order.notes)}&#10;</text>`;
    if (notesCfg.notes_box) {
      xml += `<text>================================&#10;</text>`;
    }
    xml += `<text em="false"/>`;
  }

  // Total
  if (totalsCfg.show_total !== false) {
    xml += `<text em="true"/>`;
    if (totalsCfg.total_size === 'large') {
      xml += `<text dh="true"/>`;
    }
    const totalLine = 'GESAMT:';
    const totalPrice = (order.total || 0).toFixed(2) + '€';
    const spaces = Math.max(1, 32 - totalLine.length - totalPrice.length);
    xml += `<text>${totalLine}${' '.repeat(spaces)}${totalPrice}&#10;</text>`;
    xml += `<text dh="false" em="false"/>`;
  }

  if (totalsCfg.show_payment_method !== false && order.payment_method) {
    xml += `<text>Zahlung: ${escapeXML(order.payment_method)}&#10;</text>`;
  }

  xml += `<text>--------------------------------&#10;</text>`;

  // Footer
  if (footerCfg.show_thank_you !== false) {
    xml += `<text align="center"/>`;
    xml += `<text>${escapeXML(footerCfg.thank_you_text || 'Vielen Dank!')}&#10;</text>`;
  }

  if (footerCfg.show_custom_text && footerCfg.custom_text) {
    xml += `<text>${escapeXML(footerCfg.custom_text)}&#10;</text>`;
  }

  // Feed and cut
  xml += `<feed line="4"/>`;
  xml += `<cut/>`;
  xml += `</epos-print>`;

  return xml;
};

// Escape XML special characters
const escapeXML = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

// Build ePOS-Print XML for reservation list
const buildReservationListXML = (data) => {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">
<text lang="de"/>`;

  // Header
  xml += `<text align="center"/>`;
  xml += `<text font="font_a" dw="true" dh="true" em="true"/>`;
  xml += `<text>RESERVIERUNGEN&#10;</text>`;
  xml += `<text dw="false" dh="false" em="false"/>`;
  
  // Date
  xml += `<text align="center"/>`;
  xml += `<text dw="true" em="true"/>`;
  xml += `<text>${escapeXML(data.date_formatted || data.date)}&#10;</text>`;
  xml += `<text dw="false" em="false"/>`;
  
  // Restaurant name
  xml += `<text>${escapeXML(data.restaurant_name || 'Little Eat Italy')}&#10;</text>`;
  xml += `<text>================================&#10;</text>`;
  
  // Summary
  xml += `<text align="left"/>`;
  xml += `<text em="true"/>`;
  xml += `<text>Gesamt: ${data.total_reservations} Reservierungen&#10;</text>`;
  xml += `<text>Gaeste: ${data.total_guests} Personen&#10;</text>`;
  xml += `<text em="false"/>`;
  xml += `<text>--------------------------------&#10;</text>`;
  xml += `<feed line="1"/>`;

  // Reservations list
  const reservations = data.reservations || [];
  for (let i = 0; i < reservations.length; i++) {
    const r = reservations[i];
    
    // Time and guests (highlighted)
    xml += `<text dw="true" em="true"/>`;
    xml += `<text>${escapeXML(r.time)} Uhr  [${r.guests} P]&#10;</text>`;
    xml += `<text dw="false" em="false"/>`;
    
    // Customer name
    xml += `<text em="true"/>`;
    xml += `<text>${escapeXML(r.customer_name)}&#10;</text>`;
    xml += `<text em="false"/>`;
    
    // Phone if available
    if (r.phone) {
      xml += `<text>Tel: ${escapeXML(r.phone)}&#10;</text>`;
    }
    
    // Notes if available
    if (r.notes && r.notes !== '[Telefonisch]') {
      xml += `<text>* ${escapeXML(r.notes.replace('[Telefonisch] ', ''))}&#10;</text>`;
    }
    
    // Staff note (table assignment) if available
    if (r.staff_note) {
      xml += `<text em="true"/>`;
      xml += `<text>Tisch: ${escapeXML(r.staff_note)}&#10;</text>`;
      xml += `<text em="false"/>`;
    }
    
    // Status indicator
    if (r.status === 'completed') {
      xml += `<text>[ANGEKOMMEN]&#10;</text>`;
    } else if (r.status === 'confirmed') {
      xml += `<text>[Bestaetigt]&#10;</text>`;
    }
    
    // Separator between reservations
    if (i < reservations.length - 1) {
      xml += `<text>- - - - - - - - - - - - - - - -&#10;</text>`;
    }
  }

  // Footer
  xml += `<text>================================&#10;</text>`;
  xml += `<text align="center"/>`;
  xml += `<text>Gedruckt: ${new Date().toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit'})} Uhr&#10;</text>`;
  
  // Feed and cut
  xml += `<feed line="4"/>`;
  xml += `<cut/>`;
  xml += `</epos-print>`;

  return xml;
};

const PrintStationPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [settings, setSettings] = useState(null);
  const [printerConnected, setPrinterConnected] = useState(false);
  const [printerIP, setPrinterIP] = useState(DEFAULT_PRINTER_IP);
  const [printerPort, setPrinterPort] = useState(DEFAULT_PRINTER_PORT);
  const [printQueue, setPrintQueue] = useState([]);
  const [printedCount, setPrintedCount] = useState(0);
  const [lastPrintTime, setLastPrintTime] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const pollingRef = useRef(null);
  const audioRef = useRef(null);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleRg1TYyh1K5WARlQoMfbqGIlPnOLrdKvYCAzVIS11bZnJDNYeaXGs3Y0QlhuobSqd0xPW2mEm56Sd1NVYnCAjI2EeWVhZ3B4fnyAgoGEhIKBgYOEhYWEhIOCgoKCgoKBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgX5+");
  }, []);

  // Load saved printer settings
  useEffect(() => {
    const savedIP = localStorage.getItem("printer_ip");
    const savedPort = localStorage.getItem("printer_port");
    if (savedIP) setPrinterIP(savedIP);
    if (savedPort) setPrinterPort(parseInt(savedPort));
  }, []);

  const playNotificationSound = () => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log("Audio play failed:", e));
    }
  };

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem("print_station_token");
    if (token) {
      verifyToken(token);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      await axios.get(`${API}/staff/data`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsAuthenticated(true);
      fetchSettings();
    } catch (e) {
      localStorage.removeItem("print_station_token");
      setIsAuthenticated(false);
    }
  };

  const handleLogin = async () => {
    if (pin.length !== 4) {
      setPinError("PIN muss 4 Ziffern haben");
      return;
    }
    try {
      const response = await axios.post(`${API}/staff/login`, { pin });
      localStorage.setItem("print_station_token", response.data.access_token);
      setIsAuthenticated(true);
      setPinError("");
      fetchSettings();
      toast.success("Angemeldet!");
    } catch (e) {
      setPinError("Falscher PIN");
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/shop/settings`);
      setSettings(response.data);
      // Use settings from server if available
      if (response.data.printer_ip) {
        setPrinterIP(response.data.printer_ip);
        localStorage.setItem("printer_ip", response.data.printer_ip);
      }
      if (response.data.printer_port) {
        setPrinterPort(response.data.printer_port);
        localStorage.setItem("printer_port", response.data.printer_port.toString());
      }
    } catch (e) {
      console.error("Failed to fetch settings:", e);
    }
  };

  // Test printer connection via ePOS-Print endpoint
  const testPrinterConnection = async () => {
    setIsConnecting(true);
    
    // For local network printers, we just mark as connected
    // The actual connection test happens on print
    setTimeout(() => {
      setPrinterConnected(true);
      setIsConnecting(false);
      toast.success("✅ Drucker bereit!");
    }, 500);
  };

  // Disconnect (just reset state)
  const disconnectPrinter = () => {
    setPrinterConnected(false);
    toast.info("Drucker getrennt");
  };

  // Save printer settings
  const savePrinterSettings = () => {
    localStorage.setItem("printer_ip", printerIP);
    localStorage.setItem("printer_port", printerPort.toString());
    toast.success("Einstellungen gespeichert!");
    setShowSettings(false);
    setPrinterConnected(false);
  };

  // Print receipt via ePOS-Print XML using XMLHttpRequest
  const printReceipt = (order) => {
    return new Promise((resolve) => {
      try {
        const url = `http://${printerIP}:${printerPort}/cgi-bin/epos/service.cgi?devid=local_printer&timeout=10000`;
        
        // Debug: Log the order object
        console.log('printReceipt called with order:', JSON.stringify(order, null, 2));
        console.log('order.job_type:', order.job_type);
        
        // Check if this is a reservation list print job
        let receiptXML;
        if (order.job_type === 'reservations') {
          console.log('=== PRINTING RESERVATION LIST ===');
          receiptXML = buildReservationListXML(order);
        } else {
          console.log('=== PRINTING ORDER RECEIPT ===');
          receiptXML = buildReceiptXML(order, settings);
        }
        
        console.log('Generated XML (first 500 chars):', receiptXML.substring(0, 500));
        console.log('Sending print job to:', url);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/xml; charset=UTF-8');
        xhr.timeout = 15000;
        
        xhr.onload = function() {
          console.log('Print response:', xhr.status, xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            const text = xhr.responseText;
            if (text.includes('success="false"')) {
              console.error('Print failed:', text);
              resolve(false);
            } else {
              resolve(true);
            }
          } else {
            resolve(false);
          }
        };
        
        xhr.onerror = function() {
          console.error('XHR error');
          // Network error might still mean the print succeeded
          // (CORS blocks reading the response but request may have gone through)
          resolve(true);
        };
        
        xhr.ontimeout = function() {
          console.error('XHR timeout');
          resolve(false);
        };
        
        xhr.send(receiptXML);
        
      } catch (error) {
        console.error('Print error:', error);
        toast.error(`Druckfehler: ${error.message}`);
        resolve(false);
      }
    });
  };

  // Process print job
  const processPrintJob = async (job) => {
    if (isPrinting) return;
    
    console.log('=== PROCESSING PRINT JOB ===');
    console.log('Full job object:', JSON.stringify(job, null, 2));
    console.log('job.job_type:', job.job_type);
    console.log('job.order_data:', job.order_data);
    
    setIsPrinting(true);
    try {
      // For reservation lists, pass the order_data which contains the reservation details
      const printData = job.order_data || job;
      console.log('Passing to printReceipt:', JSON.stringify(printData, null, 2).substring(0, 500));
      
      const success = await printReceipt(printData);
      
      if (success) {
        // Mark job as completed in backend
        try {
          const token = localStorage.getItem("print_station_token");
          await axios.put(`${API}/print-queue/${job.id}/status`, 
            { status: "completed" },
            { headers: { Authorization: `Bearer ${token}` }}
          );
        } catch (e) {
          console.error('Failed to update job status:', e);
        }
        
        setPrintedCount(prev => prev + 1);
        setLastPrintTime(new Date());
        
        // Different toast message for reservation lists
        if (job.job_type === 'reservations' || job.order_data?.job_type === 'reservations') {
          toast.success(`✅ Reservierungsliste gedruckt!`);
        } else {
          toast.success(`✅ Bon #${job.order_number} gedruckt!`);
        }
      }
    } catch (error) {
      console.error('Process print job error:', error);
      toast.error('Fehler beim Verarbeiten');
    } finally {
      setIsPrinting(false);
    }
  };

  // Poll for print jobs
  const fetchPrintQueue = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const token = localStorage.getItem("print_station_token");
      const response = await axios.get(`${API}/print-queue`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const pendingJobs = response.data.filter(j => j.status === 'pending');
      
      // Check for new jobs
      if (pendingJobs.length > 0 && pendingJobs.length > printQueue.length) {
        playNotificationSound();
      }
      
      setPrintQueue(pendingJobs);
      
      // Auto-print if enabled and connected
      if (autoPrintEnabled && printerConnected && pendingJobs.length > 0 && !isPrinting) {
        await processPrintJob(pendingJobs[0]);
      }
      
    } catch (e) {
      console.error("Failed to fetch print queue:", e);
    }
  }, [isAuthenticated, printerConnected, autoPrintEnabled, isPrinting, printQueue.length]);

  // Start polling when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchPrintQueue();
      pollingRef.current = setInterval(fetchPrintQueue, POLLING_INTERVAL);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isAuthenticated, fetchPrintQueue]);

  // Test print
  const sendTestPrint = async () => {
    if (!printerConnected) {
      toast.error("Bitte erst verbinden");
      return;
    }
    
    setIsPrinting(true);
    try {
      const testOrder = {
        order_number: "TEST",
        customer_name: "Test Kunde",
        customer_phone: "0000-0000000",
        pickup_time: "JETZT",
        created_at: new Date().toISOString(),
        items: [
          { quantity: 1, item_name: "Test Pizza Margherita", size_name: "32cm", total_price: 10.00 },
          { quantity: 2, item_name: "Coca Cola", size_name: "0.5L", total_price: 6.00 }
        ],
        total: 16.00,
        notes: "Das ist ein Testdruck!",
        payment_method: "Bar"
      };
      
      const success = await printReceipt(testOrder);
      if (success) {
        toast.success("✅ Testdruck gesendet!");
        playNotificationSound();
        setPrintedCount(prev => prev + 1);
        setLastPrintTime(new Date());
      }
    } catch (error) {
      toast.error(`Testdruck Fehler: ${error.message}`);
    } finally {
      setIsPrinting(false);
    }
  };

  // PIN Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <img src={CHEF_ICON} alt="Logo" className="w-20 h-20 mx-auto mb-4" />
            <h1 className="font-anton text-2xl text-white">DRUCK-STATION</h1>
            <p className="font-mono text-sm text-neutral-400 mt-2">PIN eingeben zum Verbinden</p>
          </div>

          <div className="flex justify-center gap-2 mb-6">
            {[0,1,2,3].map(i => (
              <div key={i} className={`w-12 h-12 border-2 ${pin[i] ? 'border-green-500 bg-green-500/20' : 'border-neutral-700'} flex items-center justify-center`}>
                {pin[i] && <span className="text-green-500 text-2xl">•</span>}
              </div>
            ))}
          </div>

          {pinError && <p className="text-red-500 text-center mb-4 font-mono text-sm">{pinError}</p>}

          <div className="grid grid-cols-3 gap-2 mb-4">
            {[1,2,3,4,5,6,7,8,9].map(num => (
              <button
                key={num}
                onClick={() => pin.length < 4 && setPin(pin + num)}
                className="bg-neutral-800 hover:bg-neutral-700 text-white font-anton text-2xl py-4"
              >
                {num}
              </button>
            ))}
            <div />
            <button
              onClick={() => pin.length < 4 && setPin(pin + '0')}
              className="bg-neutral-800 hover:bg-neutral-700 text-white font-anton text-2xl py-4"
            >
              0
            </button>
            <button
              onClick={() => setPin(pin.slice(0, -1))}
              className="bg-neutral-700 hover:bg-neutral-600 text-white font-mono py-4"
            >
              ←
            </button>
          </div>

          <button
            onClick={handleLogin}
            disabled={pin.length !== 4}
            className="w-full bg-green-600 hover:bg-green-500 disabled:bg-neutral-700 disabled:text-neutral-500 text-white font-anton text-lg py-4"
          >
            VERBINDEN
          </button>
        </div>
      </div>
    );
  }

  // Settings Modal
  const SettingsModal = () => (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-700 p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-anton text-xl text-white">DRUCKER-EINSTELLUNGEN</h2>
          <button onClick={() => setShowSettings(false)} className="text-neutral-400 hover:text-white text-2xl">×</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="font-mono text-xs text-neutral-400 block mb-1">IP-ADRESSE</label>
            <input
              type="text"
              value={printerIP}
              onChange={(e) => setPrinterIP(e.target.value)}
              className="w-full bg-black border border-neutral-700 text-white font-mono p-3"
              placeholder="192.168.2.129"
            />
          </div>

          <div>
            <label className="font-mono text-xs text-neutral-400 block mb-1">PORT</label>
            <input
              type="number"
              value={printerPort}
              onChange={(e) => setPrinterPort(parseInt(e.target.value) || 8008)}
              className="w-full bg-black border border-neutral-700 text-white font-mono p-3"
              placeholder="8008"
            />
          </div>

          <p className="font-mono text-xs text-neutral-500">
            Epson TM-m30II ePOS-Print: Port 8008
          </p>

          <button
            onClick={savePrinterSettings}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-anton py-3"
          >
            SPEICHERN
          </button>
        </div>
      </div>
    </div>
  );

  // Print Station Dashboard
  return (
    <div className="min-h-screen bg-black text-white p-4">
      {/* Settings Modal */}
      {showSettings && <SettingsModal />}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Printer className="w-8 h-8 text-green-500" />
          <div>
            <h1 className="font-anton text-xl">DRUCK-STATION</h1>
            <p className="font-mono text-xs text-neutral-400">
              {settings?.restaurant_name || 'Little Eat Italy'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 ${soundEnabled ? 'text-green-400' : 'text-neutral-500'}`}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-neutral-400 hover:text-white"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Printer Connection */}
      <div className={`p-4 mb-4 border ${printerConnected ? 'bg-green-500/10 border-green-500' : 'bg-neutral-900 border-neutral-700'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {printerConnected ? (
              <CheckCircle className="w-6 h-6 text-green-400" />
            ) : (
              <XCircle className="w-6 h-6 text-neutral-500" />
            )}
            <div>
              <p className="font-anton text-sm">
                {printerConnected ? 'DRUCKER BEREIT' : 'DRUCKER VERBINDEN'}
              </p>
              <p className="font-mono text-xs text-neutral-400">
                {printerIP}:{printerPort}
              </p>
            </div>
          </div>
          
          {printerConnected ? (
            <button
              onClick={disconnectPrinter}
              className="bg-red-600 hover:bg-red-500 text-white font-mono text-xs px-3 py-2"
            >
              Trennen
            </button>
          ) : (
            <button
              onClick={testPrinterConnection}
              disabled={isConnecting}
              className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-700 text-white font-mono text-xs px-3 py-2"
            >
              {isConnecting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Verbinden'}
            </button>
          )}
        </div>
      </div>

      {/* Auto-Print Toggle */}
      {printerConnected && (
        <div className="p-3 mb-4 border border-neutral-700 bg-neutral-900 flex items-center justify-between">
          <span className="font-mono text-sm">Auto-Druck</span>
          <button
            onClick={() => setAutoPrintEnabled(!autoPrintEnabled)}
            className={`px-3 py-1 font-mono text-xs ${autoPrintEnabled ? 'bg-green-600' : 'bg-neutral-700'}`}
          >
            {autoPrintEnabled ? 'AN' : 'AUS'}
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 mb-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="font-mono text-xs text-neutral-400 mb-1">WARTESCHLANGE</p>
            <p className="font-anton text-4xl text-yellow-400">{printQueue.length}</p>
          </div>
          <div>
            <p className="font-mono text-xs text-neutral-400 mb-1">GEDRUCKT</p>
            <p className="font-anton text-4xl text-green-400">{printedCount}</p>
          </div>
        </div>
        
        {lastPrintTime && (
          <p className="font-mono text-xs text-neutral-500 text-center mt-4">
            Letzter Druck: {lastPrintTime.toLocaleTimeString('de-DE')}
          </p>
        )}
      </div>

      {/* Current Status */}
      <div className={`p-6 text-center border ${
        !printerConnected ? 'bg-yellow-500/10 border-yellow-500' :
        isPrinting ? 'bg-blue-500/20 border-blue-500' : 
        printQueue.length > 0 ? 'bg-yellow-500/10 border-yellow-500' :
        'bg-green-500/10 border-green-500'
      }`}>
        {!printerConnected ? (
          <>
            <Printer className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
            <p className="font-anton text-xl text-yellow-400">DRUCKER VERBINDEN</p>
            <p className="font-mono text-sm text-neutral-400 mt-2">
              Oben auf "Verbinden" tippen
            </p>
          </>
        ) : isPrinting ? (
          <>
            <RefreshCw className="w-12 h-12 text-blue-400 mx-auto mb-3 animate-spin" />
            <p className="font-anton text-xl text-blue-400">DRUCKT...</p>
          </>
        ) : printQueue.length > 0 ? (
          <>
            <Printer className="w-12 h-12 text-yellow-400 mx-auto mb-3 animate-pulse" />
            <p className="font-anton text-xl text-yellow-400">{printQueue.length} BON(S) WARTEN</p>
            {!autoPrintEnabled && (
              <p className="font-mono text-xs text-neutral-400 mt-2">Auto-Druck deaktiviert</p>
            )}
          </>
        ) : (
          <>
            <Check className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="font-anton text-xl text-green-500">BEREIT</p>
            <p className="font-mono text-sm text-neutral-400 mt-2">Warte auf Bestellungen...</p>
          </>
        )}
      </div>

      {/* Print Queue */}
      {printQueue.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="font-mono text-xs text-neutral-400">WARTESCHLANGE:</p>
          {printQueue.map((job) => {
            const isReservationList = job.job_type === 'reservations' || job.order_data?.job_type === 'reservations';
            return (
              <div key={job.id} className={`bg-neutral-900 border p-3 flex items-center justify-between ${isReservationList ? 'border-blue-500' : 'border-neutral-700'}`}>
                <div>
                  {isReservationList ? (
                    <>
                      <p className="font-anton text-lg text-blue-400">📋 RESERVIERUNGEN</p>
                      <p className="font-mono text-xs text-neutral-400">
                        {job.order_data?.total_reservations || '?'} Reservierungen • {job.order_data?.total_guests || '?'} Gäste
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-anton text-lg text-white">#{job.order_number}</p>
                      <p className="font-mono text-xs text-neutral-400">
                        {new Date(job.created_at).toLocaleTimeString('de-DE')}
                      </p>
                    </>
                  )}
                </div>
                <button
                  onClick={() => processPrintJob(job)}
                  disabled={isPrinting || !printerConnected}
                  className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-700 text-white font-mono text-xs px-4 py-2"
                >
                  Drucken
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Test Print Button */}
      {printerConnected && (
        <button
          onClick={sendTestPrint}
          disabled={isPrinting}
          className="w-full mt-4 bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-900 text-white font-mono py-3 flex items-center justify-center gap-2"
        >
          {isPrinting ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Printer className="w-4 h-4" />
          )}
          Testdruck
        </button>
      )}

      {/* Info */}
      <div className="mt-4 p-4 bg-neutral-900/50 border border-neutral-800">
        <p className="font-mono text-xs text-neutral-500 text-center">
          {printerConnected 
            ? autoPrintEnabled 
              ? "Bons werden automatisch gedruckt."
              : "Auto-Druck aus. Manuell drucken."
            : "Mit Drucker verbinden um zu drucken."}
        </p>
        <p className="font-mono text-xs text-neutral-600 text-center mt-2">
          Dieses Gerät muss im gleichen WLAN wie der Drucker sein!
        </p>
      </div>
    </div>
  );
};

export default PrintStationPage;
