import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";
import { Printer, Wifi, WifiOff, Check, RefreshCw, Volume2 } from "lucide-react";

const POLLING_INTERVAL = 3000; // Check every 3 seconds
const CHEF_ICON = "https://customer-assets.emergentagent.com/job_red-brick-pizza/artifacts/845efg67_kopf.png";

const PrintStationPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [settings, setSettings] = useState(null);
  const [printQueue, setPrintQueue] = useState([]);
  const [printedCount, setPrintedCount] = useState(0);
  const [lastPrintTime, setLastPrintTime] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const pollingRef = useRef(null);
  const printFrameRef = useRef(null);

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
      toast.success("Druck-Station verbunden!");
    } catch (e) {
      setPinError("Falscher PIN");
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/shop/settings`);
      setSettings(response.data);
    } catch (e) {
      console.error("Failed to fetch settings:", e);
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
      
      setIsConnected(true);
      const jobs = response.data;
      
      if (jobs.length > 0 && !isPrinting) {
        // New print job! Process it
        const job = jobs[0];
        await processPrintJob(job);
      }
      
      setPrintQueue(jobs);
    } catch (e) {
      setIsConnected(false);
      console.error("Failed to fetch print queue:", e);
    }
  }, [isAuthenticated, isPrinting]);

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

  // Process a print job
  const processPrintJob = async (job) => {
    setIsPrinting(true);
    
    try {
      // Build receipt HTML
      const receiptHtml = buildReceiptHtml(job.order_data, settings);
      
      // Create invisible iframe for printing
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.top = '-10000px';
      iframe.style.left = '-10000px';
      document.body.appendChild(iframe);
      
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Bon #${job.order_number}</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            @media print { html, body { width: 80mm; margin: 0; padding: 0; } }
            * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 12px; 
              line-height: 1.3;
              width: 80mm; 
              margin: 0 auto; 
              padding: 5mm;
              background: white;
              color: black;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .large { font-size: 16px; }
            .xlarge { font-size: 22px; font-weight: bold; }
            .separator { border: none; border-top: 1px dashed #000; margin: 8px 0; }
            .item-row { display: flex; justify-content: space-between; padding: 3px 0; }
            .highlight { background: #000; color: #fff; padding: 10px; text-align: center; margin: 10px 0; font-size: 18px; font-weight: bold; }
            .notes-box { border: 2px solid #000; padding: 8px; margin: 10px 0; font-weight: bold; }
            .total-row { font-size: 18px; font-weight: bold; border-top: 2px solid #000; padding-top: 8px; margin-top: 8px; }
          </style>
        </head>
        <body>${receiptHtml}</body>
        </html>
      `);
      doc.close();
      
      // Wait for content to load, then print
      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        
        // Mark job as complete after a delay
        setTimeout(async () => {
          try {
            const token = localStorage.getItem("print_station_token");
            await axios.put(`${API}/print-queue/${job.id}/complete`, {}, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            setPrintedCount(prev => prev + 1);
            setLastPrintTime(new Date());
            
            // Play success sound
            playPrintSound();
            
            // Remove iframe
            document.body.removeChild(iframe);
          } catch (e) {
            console.error("Failed to mark job complete:", e);
          }
          setIsPrinting(false);
        }, 2000);
      }, 500);
      
    } catch (error) {
      console.error("Print error:", error);
      toast.error("Druckfehler");
      setIsPrinting(false);
    }
  };

  // Play sound when print job completes
  const playPrintSound = () => {
    const audio = new Audio('/notification.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {});
  };

  // Build receipt HTML
  const buildReceiptHtml = (order, settings) => {
    const t = settings?.receipt_template || {};
    const h = t.header || {};
    const o = t.order_info || {};
    const i = t.items || {};
    const n = t.notes || {};
    const tot = t.totals || {};
    const f = t.footer || {};

    let html = '';
    
    // Header
    if (h.show_restaurant_name !== false) {
      const sizeClass = h.restaurant_name_size === 'large' ? 'xlarge' : h.restaurant_name_size === 'medium' ? 'large' : '';
      html += `<div class="center ${h.restaurant_name_bold !== false ? 'bold' : ''} ${sizeClass}">${settings?.restaurant_name || 'Little Eat Italy'}</div>`;
    }
    if (h.show_address !== false) html += `<div class="center">${settings?.restaurant_address || ''}</div>`;
    if (h.show_phone !== false) html += `<div class="center">Tel: ${settings?.restaurant_phone || ''}</div>`;
    if (h.show_separator !== false) html += '<hr class="separator">';

    // Order Info
    if (o.show_order_number !== false) {
      const sizeClass = o.order_number_size === 'large' ? 'xlarge' : 'large';
      html += `<div class="center ${o.order_number_bold !== false ? 'bold' : ''} ${sizeClass}">#${order.order_number}</div>`;
    }
    if (o.show_date_time !== false) {
      html += `<div class="center">${new Date(order.created_at).toLocaleString('de-DE')}</div>`;
    }
    if (o.show_customer_name !== false) {
      html += `<div class="${o.customer_name_bold ? 'bold' : ''}">Kunde: ${order.customer_name || ''}</div>`;
    }
    if (o.show_customer_phone !== false && order.customer_phone) {
      html += `<div>Tel: ${order.customer_phone}</div>`;
    }
    if (o.show_pickup_time !== false) {
      const pickupTime = order.confirmed_pickup_time || order.pickup_time || 'N/A';
      html += `<div class="highlight">ABHOLUNG: ${pickupTime}</div>`;
    }
    if (o.show_separator !== false) html += '<hr class="separator">';

    // Items
    for (const item of (order.items || [])) {
      let itemName = '';
      if (i.show_quantity !== false) itemName += `${item.quantity}x `;
      itemName += item.item_name || '';
      if (i.show_size !== false && item.size_name) itemName += ` (${item.size_name})`;
      
      html += `<div class="item-row"><span class="${i.item_name_bold ? 'bold' : ''}">${itemName}</span>`;
      if (i.show_item_price !== false) {
        html += `<span>${(item.total_price || 0).toFixed(2)}€</span>`;
      }
      html += '</div>';
      
      if (i.show_options !== false && item.options?.length > 0) {
        const opts = item.options.map(opt => opt.option_name || opt.name || opt).join(', ');
        html += `<div style="margin-left: 15px; font-size: 10px;">+ ${opts}</div>`;
      }
    }
    if (i.show_separator !== false) html += '<hr class="separator">';

    // Notes
    if (n.show_notes !== false && order.notes) {
      html += `<div class="${n.notes_box ? 'notes-box' : ''} ${n.notes_bold ? 'bold' : ''}">📝 ${order.notes}</div>`;
    }

    // Totals
    if (tot.show_total !== false) {
      html += `<div class="item-row total-row"><span>GESAMT:</span><span>${(order.total || 0).toFixed(2)}€</span></div>`;
    }
    if (tot.show_payment_method !== false && order.payment_method) {
      html += `<div>Zahlung: ${order.payment_method}</div>`;
    }
    if (tot.show_separator !== false) html += '<hr class="separator">';

    // Footer
    if (f.show_thank_you !== false) {
      html += `<div class="center">${f.thank_you_text || 'Vielen Dank für Ihre Bestellung!'}</div>`;
    }
    if (f.show_custom_text && f.custom_text) {
      html += `<div class="center">${f.custom_text}</div>`;
    }

    return html;
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

  // Print Station Dashboard
  return (
    <div className="min-h-screen bg-black text-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Printer className="w-8 h-8 text-green-500" />
          <div>
            <h1 className="font-anton text-xl">DRUCK-STATION</h1>
            <p className="font-mono text-xs text-neutral-400">
              {settings?.restaurant_name || 'Little Eat Italy'}
            </p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          <span className="font-mono text-xs">{isConnected ? 'VERBUNDEN' : 'OFFLINE'}</span>
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 mb-6">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="font-mono text-xs text-neutral-400 mb-1">WARTESCHLANGE</p>
            <p className="font-anton text-4xl text-yellow-400">{printQueue.length}</p>
          </div>
          <div>
            <p className="font-mono text-xs text-neutral-400 mb-1">GEDRUCKT HEUTE</p>
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
      <div className={`p-6 text-center ${isPrinting ? 'bg-blue-500/20 border border-blue-500' : 'bg-neutral-900 border border-neutral-800'}`}>
        {isPrinting ? (
          <>
            <RefreshCw className="w-12 h-12 text-blue-400 mx-auto mb-3 animate-spin" />
            <p className="font-anton text-xl text-blue-400">DRUCKT...</p>
          </>
        ) : printQueue.length > 0 ? (
          <>
            <Printer className="w-12 h-12 text-yellow-400 mx-auto mb-3 animate-pulse" />
            <p className="font-anton text-xl text-yellow-400">{printQueue.length} BON(S) WARTEN</p>
          </>
        ) : (
          <>
            <Check className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="font-anton text-xl text-green-500">BEREIT</p>
            <p className="font-mono text-sm text-neutral-400 mt-2">Warte auf neue Bestellungen...</p>
          </>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-neutral-900/50 border border-neutral-800">
        <p className="font-mono text-xs text-neutral-500 text-center">
          Diese Seite offen lassen. Bons werden automatisch gedruckt wenn Bestellungen bestätigt werden.
        </p>
      </div>

      {/* Hidden print frame */}
      <iframe ref={printFrameRef} style={{ display: 'none' }} title="print-frame" />
    </div>
  );
};

export default PrintStationPage;
