import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../../App";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { 
  BarChart3, TrendingUp, TrendingDown, Users, ShoppingBag, 
  Calendar, Clock, Euro, Utensils, RefreshCw, ArrowUpRight, ArrowDownRight
} from "lucide-react";

const StatisticsSection = () => {
  const [period, setPeriod] = useState("week");
  const [customRange, setCustomRange] = useState({ from: "", to: "" });
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [topItems, setTopItems] = useState([]);
  const [peakHours, setPeakHours] = useState(null);
  const [ordersByDay, setOrdersByDay] = useState([]);

  const fetchStatistics = async () => {
    setLoading(true);
    const token = localStorage.getItem("admin_token");
    const headers = { Authorization: `Bearer ${token}` };
    
    try {
      const params = period === "custom" 
        ? `?period=custom&start_date=${customRange.from}&end_date=${customRange.to}`
        : `?period=${period}`;
      
      const [overviewRes, comparisonRes, topItemsRes, peakHoursRes, ordersByDayRes] = await Promise.all([
        axios.get(`${API}/statistics/overview${params}`, { headers }),
        axios.get(`${API}/statistics/revenue-comparison`, { headers }),
        axios.get(`${API}/statistics/top-items${params}&limit=10`, { headers }),
        axios.get(`${API}/statistics/peak-hours${params}`, { headers }),
        axios.get(`${API}/statistics/orders-by-day${params}`, { headers })
      ]);
      
      setOverview(overviewRes.data);
      setComparison(comparisonRes.data);
      setTopItems(topItemsRes.data);
      setPeakHours(peakHoursRes.data);
      setOrdersByDay(ordersByDayRes.data);
    } catch (error) {
      toast.error("Fehler beim Laden der Statistiken");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, [period]);

  const handleCustomRangeSubmit = () => {
    if (customRange.from && customRange.to) {
      setPeriod("custom");
      fetchStatistics();
    } else {
      toast.error("Bitte wählen Sie Start- und Enddatum");
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendValue }) => (
    <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-lg">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-zinc-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {subtitle && <p className="text-zinc-500 text-xs mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2 rounded-lg ${trend === 'up' ? 'bg-green-500/20' : trend === 'down' ? 'bg-red-500/20' : 'bg-zinc-800'}`}>
          <Icon className={`w-5 h-5 ${trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-zinc-400'}`} />
        </div>
      </div>
      {trendValue !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-sm ${trendValue >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {trendValue >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          <span>{Math.abs(trendValue)}% vs. Vorwoche</span>
        </div>
      )}
    </div>
  );

  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-pizza-red animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Filter */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-zinc-900/30 border border-zinc-800 rounded-lg">
        <div className="flex gap-2">
          {[
            { id: "today", label: "Heute" },
            { id: "week", label: "Diese Woche" },
            { id: "month", label: "Dieser Monat" },
            { id: "year", label: "Dieses Jahr" }
          ].map((p) => (
            <Button
              key={p.id}
              variant={period === p.id ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod(p.id)}
              className={period === p.id ? "bg-pizza-red hover:bg-pizza-red/90" : "border-zinc-700"}
            >
              {p.label}
            </Button>
          ))}
        </div>
        
        <div className="flex items-center gap-2 ml-auto">
          <Input
            type="date"
            value={customRange.from}
            onChange={(e) => setCustomRange(prev => ({ ...prev, from: e.target.value }))}
            className="w-36 bg-zinc-900 border-zinc-700"
          />
          <span className="text-zinc-500">bis</span>
          <Input
            type="date"
            value={customRange.to}
            onChange={(e) => setCustomRange(prev => ({ ...prev, to: e.target.value }))}
            className="w-36 bg-zinc-900 border-zinc-700"
          />
          <Button size="sm" onClick={handleCustomRangeSubmit} className="bg-zinc-700 hover:bg-zinc-600">
            Anwenden
          </Button>
        </div>
        
        <Button size="sm" variant="ghost" onClick={fetchStatistics} className="text-zinc-400">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {overview && (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard 
              title="Umsatz" 
              value={formatCurrency(overview.orders.revenue)}
              icon={Euro}
              trend={comparison?.week.change_percent >= 0 ? 'up' : 'down'}
              trendValue={comparison?.week.change_percent}
            />
            <StatCard 
              title="Bestellungen" 
              value={overview.orders.total}
              subtitle={`Ø ${formatCurrency(overview.orders.average_value)}`}
              icon={ShoppingBag}
            />
            <StatCard 
              title="Reservierungen" 
              value={overview.reservations.total}
              subtitle={`${overview.reservations.completed} angekommen`}
              icon={Calendar}
            />
            <StatCard 
              title="Gäste" 
              value={overview.reservations.total_guests}
              subtitle={`Ø ${overview.reservations.average_guests} pro Tisch`}
              icon={Users}
            />
          </div>

          {/* Comparison Cards */}
          {comparison && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-lg">
                <h3 className="text-zinc-400 text-sm mb-3">Wochenvergleich</h3>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xl font-bold text-white">{formatCurrency(comparison.week.current)}</p>
                    <p className="text-zinc-500 text-sm">Diese Woche</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg text-zinc-400">{formatCurrency(comparison.week.previous)}</p>
                    <p className="text-zinc-500 text-sm">Letzte Woche</p>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded ${comparison.week.change_percent >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {comparison.week.change_percent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span className="font-bold">{comparison.week.change_percent}%</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-lg">
                <h3 className="text-zinc-400 text-sm mb-3">Monatsvergleich</h3>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xl font-bold text-white">{formatCurrency(comparison.month.current)}</p>
                    <p className="text-zinc-500 text-sm">Dieser Monat</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg text-zinc-400">{formatCurrency(comparison.month.previous)}</p>
                    <p className="text-zinc-500 text-sm">Letzter Monat</p>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded ${comparison.month.change_percent >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {comparison.month.change_percent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span className="font-bold">{comparison.month.change_percent}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* No-Show Rate */}
          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-lg">
            <h3 className="text-zinc-400 text-sm mb-3">Reservierungs-Performance</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-2xl font-bold text-green-400">{overview.reservations.completed}</p>
                <p className="text-zinc-500 text-sm">Erschienen</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-400">{overview.reservations.no_shows}</p>
                <p className="text-zinc-500 text-sm">Nicht erschienen</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-400">{overview.reservations.no_show_rate}%</p>
                <p className="text-zinc-500 text-sm">No-Show-Rate</p>
              </div>
            </div>
          </div>

          {/* Peak Hours */}
          {peakHours && (
            <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-pizza-red" />
                  Stoßzeiten
                </h3>
                <div className="flex gap-4 text-sm">
                  <span className="text-zinc-400">
                    Peak Bestellungen: <span className="text-pizza-red font-bold">{peakHours.peak_order_hour}</span>
                  </span>
                  <span className="text-zinc-400">
                    Peak Reservierungen: <span className="text-blue-400 font-bold">{peakHours.peak_reservation_hour}</span>
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-7 md:grid-cols-14 gap-1">
                {peakHours.hourly_data.map((hour, idx) => {
                  const maxOrders = Math.max(...peakHours.hourly_data.map(h => h.orders), 1);
                  const maxRes = Math.max(...peakHours.hourly_data.map(h => h.reservations), 1);
                  const orderHeight = (hour.orders / maxOrders) * 100;
                  const resHeight = (hour.reservations / maxRes) * 100;
                  
                  return (
                    <div key={idx} className="flex flex-col items-center">
                      <div className="w-full h-16 flex items-end gap-0.5">
                        <div 
                          className="flex-1 bg-pizza-red/80 rounded-t transition-all"
                          style={{ height: `${orderHeight}%`, minHeight: hour.orders > 0 ? '4px' : '0' }}
                          title={`${hour.orders} Bestellungen`}
                        />
                        <div 
                          className="flex-1 bg-blue-500/80 rounded-t transition-all"
                          style={{ height: `${resHeight}%`, minHeight: hour.reservations > 0 ? '4px' : '0' }}
                          title={`${hour.reservations} Reservierungen`}
                        />
                      </div>
                      <span className="text-[10px] text-zinc-500 mt-1">{hour.hour.slice(0, 2)}</span>
                    </div>
                  );
                })}
              </div>
              
              <div className="flex gap-4 mt-3 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-pizza-red rounded"></span>
                  Bestellungen
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-blue-500 rounded"></span>
                  Reservierungen
                </span>
              </div>
            </div>
          )}

          {/* Top Items & Orders by Day */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Items */}
            <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-lg">
              <h3 className="text-white font-bold flex items-center gap-2 mb-4">
                <Utensils className="w-5 h-5 text-pizza-red" />
                Top 10 Gerichte
              </h3>
              
              {topItems.length === 0 ? (
                <p className="text-zinc-500 text-center py-4">Keine Daten verfügbar</p>
              ) : (
                <div className="space-y-2">
                  {topItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx < 3 ? 'bg-pizza-red text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                          {idx + 1}
                        </span>
                        <span className="text-white text-sm">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-zinc-400 text-sm">{item.quantity}x</span>
                        <span className="text-zinc-500 text-xs ml-2">{formatCurrency(item.revenue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Orders by Day */}
            <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-lg">
              <h3 className="text-white font-bold flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-pizza-red" />
                Bestellungen nach Tag
              </h3>
              
              {ordersByDay.length === 0 ? (
                <p className="text-zinc-500 text-center py-4">Keine Daten verfügbar</p>
              ) : (
                <div className="space-y-2">
                  {ordersByDay.slice(-7).map((day, idx) => {
                    const maxRevenue = Math.max(...ordersByDay.map(d => d.revenue), 1);
                    const widthPercent = (day.revenue / maxRevenue) * 100;
                    
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-400">{formatDate(day.date)}</span>
                          <span className="text-white">{day.orders} Bestellungen • {formatCurrency(day.revenue)}</span>
                        </div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-pizza-red to-orange-500 rounded-full transition-all"
                            style={{ width: `${widthPercent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StatisticsSection;
