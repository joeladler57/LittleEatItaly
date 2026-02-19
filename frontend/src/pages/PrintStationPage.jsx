import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { API } from "../App";
import { toast } from "sonner";
import { Printer, Wifi, WifiOff, Check, RefreshCw, Settings, CheckCircle, XCircle, Volume2, VolumeX } from "lucide-react";

const POLLING_INTERVAL = 3000;
const CHEF_ICON = "https://customer-assets.emergentagent.com/job_red-brick-pizza/artifacts/845efg67_kopf.png";

const PrintStationPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [settings, setSettings] = useState(null);
  const [printerStatus, setPrinterStatus] = useState(null);
  const [printHistory, setPrintHistory] = useState([]);
  const [printedCount, setPrintedCount] = useState(0);
  const [lastPrintTime, setLastPrintTime] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [testPrinting, setTestPrinting] = useState(false);
  
  const pollingRef = useRef(null);
  const audioRef = useRef(null);

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem("print_station_token");
    if (token) {
      verifyToken(token);
    }
  }, []);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleRg1TYyh1K5WARlQoMfbqGIlPnOLrdKvYCAzVIS11bZnJDNYeaXGs3Y0QlhuobSqd0xPW2mEm56Sd1NVYnCAjI2EeWVhZ3B4fnyAgoGEhIKBgYOEhYWEhIOCgoKCgoKBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgX5+");
  }, []);

  const playNotificationSound = () => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log("Audio play failed:", e));
    }
  };

  const verifyToken = async (token) => {
    try {
      await axios.get(`${API}/staff/data`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsAuthenticated(true);
      fetchSettings();
      fetchPrinterStatus();
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
      fetchPrinterStatus();
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

  const fetchPrinterStatus = async () => {
    try {
      const token = localStorage.getItem("print_station_token");
      const response = await axios.get(`${API}/printer/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPrinterStatus(response.data);
      setIsConnected(true);
    } catch (e) {
      setIsConnected(false);
      console.error("Failed to fetch printer status:", e);
    }
  };

  const fetchPrintHistory = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const token = localStorage.getItem("print_station_token");
      const response = await axios.get(`${API}/print-queue`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setIsConnected(true);
      
      // Count completed prints today
      const today = new Date().toDateString();
      const todayPrints = response.data.filter(job => 
        job.status === "completed" && 
        new Date(job.printed_at).toDateString() === today
      );
      
      const newCount = todayPrints.length;
      if (newCount > printedCount && printedCount > 0) {
        playNotificationSound();
        const lastJob = todayPrints[0];
        if (lastJob) {
          setLastPrintTime(new Date(lastJob.printed_at));
        }
      }
      setPrintedCount(newCount);
      
      // Get recent print history (last 10)
      const completedJobs = response.data
        .filter(j => j.status === "completed")
        .slice(0, 10);
      setPrintHistory(completedJobs);
      
    } catch (e) {
      setIsConnected(false);
      console.error("Failed to fetch print history:", e);
    }
  }, [isAuthenticated, printedCount, soundEnabled]);

  // Start polling when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchPrintHistory();
      fetchPrinterStatus();
      pollingRef.current = setInterval(() => {
        fetchPrintHistory();
        fetchPrinterStatus();
      }, POLLING_INTERVAL);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isAuthenticated, fetchPrintHistory]);

  // Test print
  const sendTestPrint = async () => {
    setTestPrinting(true);
    try {
      const token = localStorage.getItem("print_station_token");
      await axios.post(`${API}/printer/test`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("✅ Testdruck gesendet!");
      playNotificationSound();
      fetchPrinterStatus();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Druckfehler");
    } finally {
      setTestPrinting(false);
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 ${soundEnabled ? 'text-green-400' : 'text-neutral-500'}`}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <div className={`flex items-center gap-2 px-3 py-1 ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span className="font-mono text-xs">{isConnected ? 'ONLINE' : 'OFFLINE'}</span>
          </div>
        </div>
      </div>

      {/* Printer Status */}
      <div className={`p-4 mb-4 border ${printerStatus?.connected ? 'bg-green-500/10 border-green-500' : 'bg-red-500/10 border-red-500'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {printerStatus?.connected ? (
              <CheckCircle className="w-6 h-6 text-green-400" />
            ) : (
              <XCircle className="w-6 h-6 text-red-400" />
            )}
            <div>
              <p className="font-anton text-sm">
                {printerStatus?.connected ? 'DRUCKER VERBUNDEN' : 'DRUCKER OFFLINE'}
              </p>
              <p className="font-mono text-xs text-neutral-400">
                {printerStatus?.ip ? `${printerStatus.ip}:${printerStatus.port}` : 'Nicht konfiguriert'}
              </p>
            </div>
          </div>
          
          <button
            onClick={fetchPrinterStatus}
            className="bg-neutral-700 hover:bg-neutral-600 text-white font-mono text-xs px-3 py-2"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 mb-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="font-mono text-xs text-neutral-400 mb-1">HEUTE GEDRUCKT</p>
            <p className="font-anton text-4xl text-green-400">{printedCount}</p>
          </div>
          <div>
            <p className="font-mono text-xs text-neutral-400 mb-1">STATUS</p>
            <p className={`font-anton text-lg ${printerStatus?.connected ? 'text-green-400' : 'text-red-400'}`}>
              {printerStatus?.connected ? 'BEREIT' : 'OFFLINE'}
            </p>
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
        !printerStatus?.enabled ? 'bg-yellow-500/10 border-yellow-500' :
        printerStatus?.connected ? 'bg-green-500/10 border-green-500' :
        'bg-red-500/10 border-red-500'
      }`}>
        {!printerStatus?.enabled ? (
          <>
            <Printer className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
            <p className="font-anton text-xl text-yellow-400">DRUCKER DEAKTIVIERT</p>
            <p className="font-mono text-sm text-neutral-400 mt-2">
              Bitte in Admin → Drucker aktivieren
            </p>
          </>
        ) : printerStatus?.connected ? (
          <>
            <Check className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="font-anton text-xl text-green-500">BEREIT</p>
            <p className="font-mono text-sm text-neutral-400 mt-2">
              Bons werden automatisch gedruckt
            </p>
          </>
        ) : (
          <>
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="font-anton text-xl text-red-400">NICHT ERREICHBAR</p>
            <p className="font-mono text-sm text-neutral-400 mt-2">
              Drucker-Verbindung prüfen
            </p>
          </>
        )}
      </div>

      {/* Test Print Button */}
      {printerStatus?.connected && (
        <button
          onClick={sendTestPrint}
          disabled={testPrinting}
          className="w-full mt-4 bg-green-600 hover:bg-green-500 disabled:bg-neutral-700 text-white font-anton py-3 flex items-center justify-center gap-2"
        >
          {testPrinting ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Printer className="w-5 h-5" />
          )}
          TESTDRUCK
        </button>
      )}

      {/* Recent Print History */}
      {printHistory.length > 0 && (
        <div className="mt-4">
          <p className="font-mono text-xs text-neutral-400 mb-2">LETZTE DRUCKE:</p>
          <div className="space-y-2 max-h-48 overflow-auto">
            {printHistory.map((job) => (
              <div key={job.id} className="bg-neutral-900 border border-neutral-800 p-3 flex items-center justify-between">
                <div>
                  <p className="font-anton text-lg text-white">#{job.order_number}</p>
                  <p className="font-mono text-xs text-neutral-400">
                    {new Date(job.printed_at).toLocaleTimeString('de-DE')}
                  </p>
                </div>
                <Check className="w-5 h-5 text-green-500" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-4 p-4 bg-neutral-900/50 border border-neutral-800">
        <p className="font-mono text-xs text-neutral-500 text-center">
          Bons werden automatisch gedruckt wenn Bestellungen angenommen werden.
          <br />Diese Seite zeigt den Drucker-Status in Echtzeit.
        </p>
      </div>
    </div>
  );
};

export default PrintStationPage;
