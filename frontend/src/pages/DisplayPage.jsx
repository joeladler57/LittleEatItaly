import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { API } from "../App";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { toast } from "sonner";
import {
  Users, Clock, Check, X, Ban, LogOut, RefreshCw, Edit3, Save, Printer
} from "lucide-react";

const CHEF_ICON = "https://customer-assets.emergentagent.com/job_red-brick-pizza/artifacts/845efg67_kopf.png";
const POLLING_INTERVAL = 30000; // 30 Sekunden

const DisplayPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [reservations, setReservations] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteValue, setEditingNoteValue] = useState("");
  const [isPrinting, setIsPrinting] = useState(false);
  const pollingRef = useRef(null);

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem("staff_token");
    if (token) {
      verifyToken(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      await axios.get(`${API}/staff/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsAuthenticated(true);
      fetchReservations();
    } catch (e) {
      localStorage.removeItem("staff_token");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    setPinError("");
    
    try {
      const response = await axios.post(`${API}/staff/login`, { pin });
      localStorage.setItem("staff_token", response.data.access_token);
      setIsAuthenticated(true);
      setPin("");
      fetchReservations();
      toast.success("Angemeldet!");
    } catch (error) {
      setPinError("Falscher PIN");
      setPin("");
    }
  };

  const handleLogout = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    localStorage.removeItem("staff_token");
    setIsAuthenticated(false);
    setReservations([]);
  }, []);

  const fetchReservations = useCallback(async () => {
    const token = localStorage.getItem("staff_token");
    if (!token) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.get(`${API}/staff/reservations?date=${today}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Sort by time
      const sorted = response.data.sort((a, b) => {
        return a.time.localeCompare(b.time);
      });
      
      setReservations(sorted);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Failed to fetch reservations:", error);
      if (error.response?.status === 401) {
        // Token expired - logout
        if (pollingRef.current) clearInterval(pollingRef.current);
        localStorage.removeItem("staff_token");
        setIsAuthenticated(false);
        setReservations([]);
      }
    }
  }, []);

  // Start polling when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchReservations();
      pollingRef.current = setInterval(fetchReservations, POLLING_INTERVAL);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isAuthenticated, fetchReservations]);

  const updateReservationStatus = async (id, status) => {
    const token = localStorage.getItem("staff_token");
    if (!token) return;

    try {
      await axios.put(
        `${API}/staff/reservations/${id}/status?status=${status}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const statusMessages = {
        completed: "Als angekommen markiert",
        cancelled: "Als abgesagt markiert",
        no_show: "Als nicht erschienen markiert"
      };
      
      toast.success(statusMessages[status] || "Status aktualisiert");
      fetchReservations();
    } catch (error) {
      toast.error("Fehler beim Aktualisieren");
    }
  };

  const updateStaffNote = async (id, note) => {
    const token = localStorage.getItem("staff_token");
    if (!token) return;

    try {
      await axios.put(
        `${API}/staff/reservations/${id}/note?note=${encodeURIComponent(note)}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success("Tischnotiz gespeichert");
      setEditingNoteId(null);
      setEditingNoteValue("");
      fetchReservations();
    } catch (error) {
      toast.error("Fehler beim Speichern");
    }
  };

  const startEditingNote = (reservation) => {
    setEditingNoteId(reservation.id);
    setEditingNoteValue(reservation.staff_note || "");
  };

  const cancelEditingNote = () => {
    setEditingNoteId(null);
    setEditingNoteValue("");
  };

  const printReservationList = async () => {
    const token = localStorage.getItem("staff_token");
    if (!token) return;

    setIsPrinting(true);
    try {
      const response = await axios.post(
        `${API}/printer/reservations`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(response.data.message || "Liste wird gedruckt...");
    } catch (error) {
      const message = error.response?.data?.detail || "Druckfehler";
      toast.error(message);
    } finally {
      setIsPrinting(false);
    }
  };

  // PIN Input Component
  const PinInput = () => (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <img src={CHEF_ICON} alt="Chef" className="w-20 h-20 mx-auto mb-4 opacity-80" />
          <h1 className="font-anton text-3xl text-white tracking-wider">DISPLAY</h1>
          <p className="text-zinc-400 mt-2">PIN eingeben zum Anmelden</p>
        </div>

        <form onSubmit={handlePinSubmit}>
          <div className="flex justify-center gap-3 mb-6">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-14 h-16 border-2 rounded-lg flex items-center justify-center text-2xl font-bold
                  ${pin.length > i ? 'border-red-500 bg-red-500/10 text-white' : 'border-zinc-700 bg-zinc-800/50 text-zinc-600'}`}
              >
                {pin[i] ? '•' : ''}
              </div>
            ))}
          </div>

          {pinError && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-500 text-center mb-4"
            >
              {pinError}
            </motion.p>
          )}

          <div className="grid grid-cols-3 gap-3 mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((num, i) => (
              <Button
                key={i}
                type="button"
                variant="ghost"
                className={`h-16 text-2xl font-bold rounded-xl
                  ${num === null ? 'invisible' : ''}
                  ${num === 'del' ? 'text-zinc-400' : 'text-white'}
                  bg-zinc-800/50 hover:bg-zinc-700 active:bg-red-500/20`}
                onClick={() => {
                  if (num === 'del') {
                    setPin(p => p.slice(0, -1));
                  } else if (num !== null && pin.length < 4) {
                    setPin(p => p + num);
                  }
                }}
                disabled={num === null}
              >
                {num === 'del' ? '←' : num}
              </Button>
            ))}
          </div>

          <Button
            type="submit"
            disabled={pin.length !== 4}
            className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-xl disabled:opacity-50"
          >
            ANMELDEN
          </Button>
        </form>
      </motion.div>
    </div>
  );

  // Get status color and label
  const getStatusInfo = (status) => {
    switch (status) {
      case 'completed':
        return { color: 'bg-green-500', label: 'Angekommen', textColor: 'text-green-400' };
      case 'cancelled':
        return { color: 'bg-yellow-500', label: 'Abgesagt', textColor: 'text-yellow-400' };
      case 'no_show':
        return { color: 'bg-red-500', label: 'Nicht erschienen', textColor: 'text-red-400' };
      case 'confirmed':
        return { color: 'bg-blue-500', label: 'Bestätigt', textColor: 'text-blue-400' };
      case 'pending':
      default:
        return { color: 'bg-zinc-500', label: 'Ausstehend', textColor: 'text-zinc-400' };
    }
  };

  // Main Display
  const ReservationDisplay = () => {
    const today = new Date();
    const dateStr = today.toLocaleDateString('de-DE', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    });

    // Filter active reservations (not completed/cancelled/no_show)
    const activeReservations = reservations.filter(r => 
      !['completed', 'cancelled', 'no_show'].includes(r.status)
    );
    const completedReservations = reservations.filter(r => 
      ['completed', 'cancelled', 'no_show'].includes(r.status)
    );

    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black flex flex-col">
        {/* Header */}
        <div className="bg-zinc-900/80 backdrop-blur-sm border-b border-zinc-800 p-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-anton text-2xl text-white tracking-wider">RESERVIERUNGEN</h1>
              <p className="text-zinc-400 text-sm">{dateStr}</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Print Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={printReservationList}
                disabled={isPrinting || activeReservations.length === 0}
                className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                title="Liste drucken"
              >
                <Printer className={`w-4 h-4 ${isPrinting ? 'animate-pulse' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchReservations}
                className="text-zinc-400 hover:text-white"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                <span className="text-xs">
                  {lastUpdate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-zinc-400 hover:text-red-400"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Stats Bar */}
          <div className="flex gap-4 mt-3">
            <div className="flex items-center gap-2 bg-zinc-800/50 px-3 py-1.5 rounded-lg">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-white font-bold">{activeReservations.length}</span>
              <span className="text-zinc-400 text-sm">Offen</span>
            </div>
            <div className="flex items-center gap-2 bg-zinc-800/50 px-3 py-1.5 rounded-lg">
              <Check className="w-4 h-4 text-green-400" />
              <span className="text-white font-bold">{completedReservations.filter(r => r.status === 'completed').length}</span>
              <span className="text-zinc-400 text-sm">Angekommen</span>
            </div>
          </div>
        </div>

        {/* Reservations List */}
        <div className="flex-1 p-4 overflow-y-auto">
          {reservations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
              <Clock className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg">Keine Reservierungen für heute</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {/* Active Reservations */}
                {activeReservations.map((reservation) => (
                  <ReservationCard 
                    key={reservation.id} 
                    reservation={reservation}
                    onStatusChange={updateReservationStatus}
                    onNoteEdit={startEditingNote}
                    onNoteSave={updateStaffNote}
                    onNoteCancel={cancelEditingNote}
                    isEditing={editingNoteId === reservation.id}
                    editValue={editingNoteId === reservation.id ? editingNoteValue : ""}
                    setEditValue={setEditingNoteValue}
                  />
                ))}
                
                {/* Divider if there are completed ones */}
                {completedReservations.length > 0 && activeReservations.length > 0 && (
                  <div className="border-t border-zinc-700 my-4 pt-2">
                    <p className="text-zinc-500 text-sm text-center">Abgeschlossen</p>
                  </div>
                )}
                
                {/* Completed Reservations (dimmed) */}
                {completedReservations.map((reservation) => (
                  <ReservationCard 
                    key={reservation.id} 
                    reservation={reservation}
                    onStatusChange={updateReservationStatus}
                    onNoteEdit={startEditingNote}
                    onNoteSave={updateStaffNote}
                    onNoteCancel={cancelEditingNote}
                    isEditing={editingNoteId === reservation.id}
                    editValue={editingNoteId === reservation.id ? editingNoteValue : ""}
                    setEditValue={setEditingNoteValue}
                    dimmed
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-zinc-900/80 backdrop-blur-sm border-t border-zinc-800 p-3 text-center">
          <p className="text-zinc-500 text-xs">
            Automatische Aktualisierung alle 30 Sekunden
          </p>
        </div>
      </div>
    );
  };

  // Reservation Card Component
  const ReservationCard = ({ 
    reservation, 
    onStatusChange, 
    onNoteEdit,
    onNoteSave,
    onNoteCancel,
    isEditing,
    editValue,
    setEditValue,
    dimmed = false 
  }) => {
    const statusInfo = getStatusInfo(reservation.status);
    const isCompleted = ['completed', 'cancelled', 'no_show'].includes(reservation.status);
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: dimmed ? 0.5 : 1, y: 0 }}
        exit={{ opacity: 0, x: -100 }}
        className={`bg-zinc-800/50 rounded-xl border border-zinc-700/50 overflow-hidden
          ${dimmed ? 'opacity-50' : ''}`}
      >
        <div className="flex items-center">
          {/* Time Column */}
          <div className="bg-zinc-900/50 px-4 py-4 flex flex-col items-center justify-center min-w-[80px] border-r border-zinc-700/50">
            <Clock className="w-4 h-4 text-zinc-500 mb-1" />
            <span className="text-2xl font-bold text-white">{reservation.time}</span>
            <span className="text-xs text-zinc-500">Uhr</span>
          </div>
          
          {/* Info Column */}
          <div className="flex-1 px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white">{reservation.customer_name}</span>
                {isCompleted && (
                  <span className={`text-xs px-2 py-0.5 rounded ${statusInfo.color} text-white`}>
                    {statusInfo.label}
                  </span>
                )}
              </div>
              {/* Guest Count - Bold in Frame */}
              <div className="flex items-center gap-2 bg-zinc-700/80 border border-zinc-600 rounded-lg px-3 py-1.5">
                <Users className="w-5 h-5 text-white" />
                <span className="text-xl font-bold text-white">{reservation.guests}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-zinc-400">
              {reservation.notes && reservation.notes !== '[Telefonisch]' && (
                <span className="text-xs text-zinc-500 truncate max-w-[150px]">
                  {reservation.notes.replace('[Telefonisch] ', '')}
                </span>
              )}
            </div>
            
            {/* Staff Note (Table Number) */}
            <div className="mt-2">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    placeholder="Tisch Nr. / Notiz..."
                    className="h-8 text-sm bg-zinc-700 border-zinc-600 text-white w-32"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onNoteSave(reservation.id, editValue);
                      } else if (e.key === 'Escape') {
                        onNoteCancel();
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => onNoteSave(reservation.id, editValue)}
                    className="h-8 w-8 p-0 bg-green-600 hover:bg-green-500"
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={onNoteCancel}
                    variant="ghost"
                    className="h-8 w-8 p-0 text-zinc-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div 
                  className="flex items-center gap-2 cursor-pointer group"
                  onClick={() => !isCompleted && onNoteEdit(reservation)}
                >
                  {reservation.staff_note ? (
                    <span className="text-sm bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded border border-blue-600/30">
                      Tisch: {reservation.staff_note}
                    </span>
                  ) : !isCompleted && (
                    <span className="text-xs text-zinc-500 flex items-center gap-1 group-hover:text-zinc-300">
                      <Edit3 className="w-3 h-3" />
                      Tischnotiz hinzufügen
                    </span>
                  )}
                  {reservation.staff_note && !isCompleted && (
                    <Edit3 className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300" />
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          {!isCompleted && (
            <div className="flex gap-2 px-3">
              {/* Green Check - Arrived */}
              <Button
                size="sm"
                onClick={() => onStatusChange(reservation.id, 'completed')}
                className="h-12 w-12 rounded-xl bg-green-600 hover:bg-green-500 text-white p-0"
                title="Angekommen"
              >
                <Check className="w-6 h-6" />
              </Button>
              
              {/* Yellow Button - Cancelled */}
              <Button
                size="sm"
                onClick={() => onStatusChange(reservation.id, 'cancelled')}
                className="h-12 w-12 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-white p-0"
                title="Abgesagt"
              >
                <Ban className="w-6 h-6" />
              </Button>
              
              {/* Red X - No Show */}
              <Button
                size="sm"
                onClick={() => onStatusChange(reservation.id, 'no_show')}
                className="h-12 w-12 rounded-xl bg-red-600 hover:bg-red-500 text-white p-0"
                title="Nicht erschienen"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw className="w-8 h-8 text-red-500" />
        </motion.div>
      </div>
    );
  }

  return isAuthenticated ? <ReservationDisplay /> : <PinInput />;
};

export default DisplayPage;
