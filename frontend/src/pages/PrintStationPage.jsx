import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";
import { Printer, Wifi, WifiOff, Check, RefreshCw, Smartphone, Settings, AlertCircle, ExternalLink } from "lucide-react";

const POLLING_INTERVAL = 3000;
const CHEF_ICON = "https://customer-assets.emergentagent.com/job_red-brick-pizza/artifacts/845efg67_kopf.png";

// RawBT WebSocket Configuration
const RAWBT_WS_URL = "ws://127.0.0.1:40213/";

// ESC/POS Commands
const ESC = 0x1B;
const GS = 0x1D;
const COMMANDS = {
  INIT: [ESC, 0x40], // Initialize printer
  ALIGN_CENTER: [ESC, 0x61, 0x01],
  ALIGN_LEFT: [ESC, 0x61, 0x00],
  ALIGN_RIGHT: [ESC, 0x61, 0x02],
  BOLD_ON: [ESC, 0x45, 0x01],
  BOLD_OFF: [ESC, 0x45, 0x00],
  DOUBLE_HEIGHT: [GS, 0x21, 0x10],
  DOUBLE_WIDTH: [GS, 0x21, 0x20],
  DOUBLE_SIZE: [GS, 0x21, 0x30],
  NORMAL_SIZE: [GS, 0x21, 0x00],
  UNDERLINE_ON: [ESC, 0x2D, 0x01],
  UNDERLINE_OFF: [ESC, 0x2D, 0x00],
  CUT: [GS, 0x56, 0x00], // Full cut
  PARTIAL_CUT: [GS, 0x56, 0x01],
  FEED_LINES: (n) => [ESC, 0x64, n],
  LINE_SPACING: (n) => [ESC, 0x33, n],
};

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
  
  // RawBT WebSocket state
  const [rawbtConnected, setRawbtConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const wsRef = useRef(null);
  const pollingRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

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
    } catch (e) {
      console.error("Failed to fetch settings:", e);
    }
  };

  // Connect to Bluetooth printer
  const connectBluetooth = async () => {
    if (!navigator.bluetooth) {
      toast.error("Bluetooth wird nicht unterstützt");
      return;
    }

    setIsConnecting(true);
    
    try {
      // Request Bluetooth device - filter for serial port profile
      const device = await navigator.bluetooth.requestDevice({
        // Accept all devices and filter manually, as printer might not advertise standard services
        acceptAllDevices: true,
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb', // Epson specific
          '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Common serial
          '0000ff00-0000-1000-8000-00805f9b34fb', // Generic
          '0000ffe0-0000-1000-8000-00805f9b34fb', // HM-10 style
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // RN4870
        ]
      });

      toast.info(`Verbinde mit ${device.name}...`);
      
      device.addEventListener('gattserverdisconnected', () => {
        setBluetoothConnected(false);
        setCharacteristic(null);
        toast.error("Bluetooth getrennt");
      });

      const server = await device.gatt.connect();
      
      // Try to find a writable characteristic
      const services = await server.getPrimaryServices();
      let writeChar = null;
      
      for (const service of services) {
        try {
          const characteristics = await service.getCharacteristics();
          for (const char of characteristics) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              writeChar = char;
              break;
            }
          }
          if (writeChar) break;
        } catch (e) {
          continue;
        }
      }

      if (!writeChar) {
        throw new Error("Keine Schreib-Charakteristik gefunden");
      }

      setBluetoothDevice(device);
      setCharacteristic(writeChar);
      setBluetoothConnected(true);
      toast.success(`✅ ${device.name} verbunden!`);
      
    } catch (error) {
      console.error("Bluetooth error:", error);
      if (error.name !== 'NotFoundError') {
        toast.error(`Bluetooth Fehler: ${error.message}`);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect Bluetooth
  const disconnectBluetooth = () => {
    if (bluetoothDevice && bluetoothDevice.gatt.connected) {
      bluetoothDevice.gatt.disconnect();
    }
    setBluetoothDevice(null);
    setCharacteristic(null);
    setBluetoothConnected(false);
    toast.info("Bluetooth getrennt");
  };

  // Send data to printer
  const sendToPrinter = async (data) => {
    if (!characteristic) {
      throw new Error("Drucker nicht verbunden");
    }

    const uint8Array = new Uint8Array(data);
    const chunkSize = 100; // Send in chunks to avoid buffer overflow
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      if (characteristic.properties.writeWithoutResponse) {
        await characteristic.writeValueWithoutResponse(chunk);
      } else {
        await characteristic.writeValue(chunk);
      }
      // Small delay between chunks
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  };

  // Build ESC/POS receipt
  const buildReceipt = (order, settings) => {
    const encoder = new TextEncoder();
    let data = [];
    
    const addText = (text) => {
      data.push(...encoder.encode(text));
    };
    
    const addCommand = (cmd) => {
      if (Array.isArray(cmd)) {
        data.push(...cmd);
      } else {
        data.push(cmd);
      }
    };
    
    const addLine = () => {
      addText("\n");
    };

    const t = settings?.receipt_template || {};
    const h = t.header || {};
    const o = t.order_info || {};
    const items = t.items || {};
    const n = t.notes || {};
    const tot = t.totals || {};
    const f = t.footer || {};

    // Initialize
    addCommand(COMMANDS.INIT);
    
    // Header
    if (h.show_restaurant_name !== false) {
      addCommand(COMMANDS.ALIGN_CENTER);
      addCommand(COMMANDS.BOLD_ON);
      addCommand(h.restaurant_name_size === 'large' ? COMMANDS.DOUBLE_SIZE : COMMANDS.DOUBLE_HEIGHT);
      addText(settings?.restaurant_name || "Little Eat Italy");
      addLine();
      addCommand(COMMANDS.NORMAL_SIZE);
      addCommand(COMMANDS.BOLD_OFF);
    }
    
    if (h.show_address !== false) {
      addCommand(COMMANDS.ALIGN_CENTER);
      addText(settings?.restaurant_address || "");
      addLine();
    }
    
    if (h.show_phone !== false) {
      addText(`Tel: ${settings?.restaurant_phone || ""}`);
      addLine();
    }
    
    if (h.show_separator !== false) {
      addText("--------------------------------");
      addLine();
    }

    // Order number
    if (o.show_order_number !== false) {
      addCommand(COMMANDS.ALIGN_CENTER);
      addCommand(COMMANDS.BOLD_ON);
      addCommand(COMMANDS.DOUBLE_SIZE);
      addText(`#${order.order_number}`);
      addLine();
      addCommand(COMMANDS.NORMAL_SIZE);
      addCommand(COMMANDS.BOLD_OFF);
    }

    // Date/Time
    if (o.show_date_time !== false) {
      addCommand(COMMANDS.ALIGN_CENTER);
      addText(new Date(order.created_at).toLocaleString('de-DE'));
      addLine();
    }

    // Customer
    addCommand(COMMANDS.ALIGN_LEFT);
    if (o.show_customer_name !== false) {
      addCommand(o.customer_name_bold ? COMMANDS.BOLD_ON : COMMANDS.BOLD_OFF);
      addText(`Kunde: ${order.customer_name || ""}`);
      addLine();
      addCommand(COMMANDS.BOLD_OFF);
    }

    if (o.show_customer_phone !== false && order.customer_phone) {
      addText(`Tel: ${order.customer_phone}`);
      addLine();
    }

    // Pickup time - highlighted
    if (o.show_pickup_time !== false) {
      addLine();
      addCommand(COMMANDS.ALIGN_CENTER);
      addCommand(COMMANDS.BOLD_ON);
      addCommand(COMMANDS.DOUBLE_SIZE);
      addText("================");
      addLine();
      addText(`ABHOLUNG: ${order.confirmed_pickup_time || order.pickup_time || "N/A"}`);
      addLine();
      addText("================");
      addLine();
      addCommand(COMMANDS.NORMAL_SIZE);
      addCommand(COMMANDS.BOLD_OFF);
    }

    addCommand(COMMANDS.ALIGN_LEFT);
    addText("--------------------------------");
    addLine();

    // Items
    for (const item of (order.items || [])) {
      addCommand(items.item_name_bold ? COMMANDS.BOLD_ON : COMMANDS.BOLD_OFF);
      
      let itemLine = "";
      if (items.show_quantity !== false) itemLine += `${item.quantity}x `;
      itemLine += item.item_name || "";
      if (items.show_size !== false && item.size_name) itemLine += ` (${item.size_name})`;
      
      addText(itemLine);
      
      if (items.show_item_price !== false) {
        const price = `${(item.total_price || 0).toFixed(2)}E`;
        const spaces = Math.max(1, 32 - itemLine.length - price.length);
        addText(" ".repeat(spaces) + price);
      }
      addLine();
      addCommand(COMMANDS.BOLD_OFF);

      // Options
      if (items.show_options !== false && item.options?.length > 0) {
        const opts = item.options.map(opt => opt.option_name || opt.name || opt).join(', ');
        addText(`  + ${opts}`);
        addLine();
      }
    }

    addText("--------------------------------");
    addLine();

    // Notes
    if (n.show_notes !== false && order.notes) {
      addCommand(n.notes_bold ? COMMANDS.BOLD_ON : COMMANDS.BOLD_OFF);
      if (n.notes_box) {
        addText("================================");
        addLine();
      }
      addText(`* ${order.notes}`);
      addLine();
      if (n.notes_box) {
        addText("================================");
        addLine();
      }
      addCommand(COMMANDS.BOLD_OFF);
    }

    // Total
    if (tot.show_total !== false) {
      addCommand(COMMANDS.BOLD_ON);
      addCommand(tot.total_size === 'large' ? COMMANDS.DOUBLE_HEIGHT : COMMANDS.NORMAL_SIZE);
      const totalLine = "GESAMT:";
      const totalPrice = `${(order.total || 0).toFixed(2)}E`;
      const spaces = Math.max(1, 32 - totalLine.length - totalPrice.length);
      addText(totalLine + " ".repeat(spaces) + totalPrice);
      addLine();
      addCommand(COMMANDS.NORMAL_SIZE);
      addCommand(COMMANDS.BOLD_OFF);
    }

    if (tot.show_payment_method !== false && order.payment_method) {
      addText(`Zahlung: ${order.payment_method}`);
      addLine();
    }

    addText("--------------------------------");
    addLine();

    // Footer
    if (f.show_thank_you !== false) {
      addCommand(COMMANDS.ALIGN_CENTER);
      addText(f.thank_you_text || "Vielen Dank!");
      addLine();
    }

    if (f.show_custom_text && f.custom_text) {
      addText(f.custom_text);
      addLine();
    }

    // Feed and cut
    addCommand(COMMANDS.FEED_LINES(4));
    addCommand(COMMANDS.PARTIAL_CUT);

    return data;
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
      
      if (jobs.length > 0 && !isPrinting && bluetoothConnected) {
        // New print job! Process it
        const job = jobs[0];
        await processPrintJob(job);
      }
      
      setPrintQueue(jobs);
    } catch (e) {
      setIsConnected(false);
      console.error("Failed to fetch print queue:", e);
    }
  }, [isAuthenticated, isPrinting, bluetoothConnected]);

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
      // Build and send receipt
      const receiptData = buildReceipt(job.order_data, settings);
      await sendToPrinter(receiptData);
      
      // Mark job as complete
      const token = localStorage.getItem("print_station_token");
      await axios.put(`${API}/print-queue/${job.id}/complete`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPrintedCount(prev => prev + 1);
      setLastPrintTime(new Date());
      toast.success(`✅ Bon #${job.order_number} gedruckt!`);
      
    } catch (error) {
      console.error("Print error:", error);
      toast.error(`Druckfehler: ${error.message}`);
    } finally {
      setIsPrinting(false);
    }
  };

  // Manual print test
  const testPrint = async () => {
    if (!bluetoothConnected) {
      toast.error("Drucker nicht verbunden");
      return;
    }
    
    setIsPrinting(true);
    try {
      const testOrder = {
        order_number: "TEST",
        customer_name: "Test Kunde",
        customer_phone: "0000",
        pickup_time: "JETZT",
        created_at: new Date().toISOString(),
        items: [{ quantity: 1, item_name: "Test Pizza", total_price: 10.00 }],
        total: 10.00,
        notes: "Das ist ein Testdruck!",
        payment_method: "Test"
      };
      
      const receiptData = buildReceipt(testOrder, settings);
      await sendToPrinter(receiptData);
      toast.success("✅ Testdruck erfolgreich!");
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

  // Print Station Dashboard
  return (
    <div className="min-h-screen bg-black text-white p-4">
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
        <div className={`flex items-center gap-2 px-3 py-1 ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          <span className="font-mono text-xs">{isConnected ? 'ONLINE' : 'OFFLINE'}</span>
        </div>
      </div>

      {/* Bluetooth Connection */}
      <div className={`p-4 mb-4 border ${bluetoothConnected ? 'bg-blue-500/10 border-blue-500' : 'bg-neutral-900 border-neutral-700'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {bluetoothConnected ? (
              <Bluetooth className="w-6 h-6 text-blue-400" />
            ) : (
              <BluetoothOff className="w-6 h-6 text-neutral-500" />
            )}
            <div>
              <p className="font-anton text-sm">
                {bluetoothConnected ? bluetoothDevice?.name : 'DRUCKER VERBINDEN'}
              </p>
              <p className="font-mono text-xs text-neutral-400">
                {bluetoothConnected ? 'Verbunden via Bluetooth' : 'Tippen um zu verbinden'}
              </p>
            </div>
          </div>
          
          {bluetoothConnected ? (
            <button
              onClick={disconnectBluetooth}
              className="bg-red-600 hover:bg-red-500 text-white font-mono text-xs px-3 py-2"
            >
              Trennen
            </button>
          ) : (
            <button
              onClick={connectBluetooth}
              disabled={isConnecting}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-700 text-white font-mono text-xs px-3 py-2"
            >
              {isConnecting ? '...' : 'Verbinden'}
            </button>
          )}
        </div>
      </div>

      {/* Status Card */}
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
        !bluetoothConnected ? 'bg-yellow-500/10 border-yellow-500' :
        isPrinting ? 'bg-blue-500/20 border-blue-500' : 
        printQueue.length > 0 ? 'bg-yellow-500/10 border-yellow-500' :
        'bg-green-500/10 border-green-500'
      }`}>
        {!bluetoothConnected ? (
          <>
            <BluetoothOff className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
            <p className="font-anton text-xl text-yellow-400">DRUCKER VERBINDEN</p>
            <p className="font-mono text-sm text-neutral-400 mt-2">
              Bitte oben auf "Verbinden" tippen
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
          </>
        ) : (
          <>
            <Check className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="font-anton text-xl text-green-500">BEREIT</p>
            <p className="font-mono text-sm text-neutral-400 mt-2">Warte auf Bestellungen...</p>
          </>
        )}
      </div>

      {/* Test Print Button */}
      {bluetoothConnected && (
        <button
          onClick={testPrint}
          disabled={isPrinting}
          className="w-full mt-4 bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-900 text-white font-mono py-3 flex items-center justify-center gap-2"
        >
          <Settings className="w-4 h-4" />
          Testdruck
        </button>
      )}

      {/* Instructions */}
      <div className="mt-4 p-4 bg-neutral-900/50 border border-neutral-800">
        <p className="font-mono text-xs text-neutral-500 text-center">
          {bluetoothConnected 
            ? "✅ Drucker verbunden. Bons werden automatisch gedruckt."
            : "Bluetooth-Drucker verbinden um automatisch zu drucken."}
        </p>
      </div>
    </div>
  );
};

export default PrintStationPage;
