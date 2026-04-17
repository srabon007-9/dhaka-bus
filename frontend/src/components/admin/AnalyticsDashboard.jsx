import { useMemo } from 'react';
import { motion } from 'framer-motion';

export default function AnalyticsDashboard({ trips, buses, routes }) {
  // Calculate top-level stats
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let totalTickets = 0;
    let totalOccupancy = 0;
    let validTripsCount = 0;

    trips.forEach((trip) => {
      totalTickets += trip.booked_seats || 0;
      totalRevenue += (trip.booked_seats || 0) * (trip.fare || 0);
      if (trip.occupancy_percentage !== undefined) {
        totalOccupancy += Number(trip.occupancy_percentage);
        validTripsCount += 1;
      }
    });

    const avgOccupancy = validTripsCount > 0 ? (totalOccupancy / validTripsCount).toFixed(1) : 0;

    return {
      revenue: totalRevenue,
      tickets: totalTickets,
      occupancy: avgOccupancy,
      activeBuses: buses.length,
      activeRoutes: routes.length,
    };
  }, [trips, buses, routes]);

  // Calculate route performance for horizontal bar chart
  const routePerformance = useMemo(() => {
    const routeStats = {};
    trips.forEach((trip) => {
      if (!routeStats[trip.route_name]) {
        routeStats[trip.route_name] = { name: trip.route_name, revenue: 0, tickets: 0 };
      }
      routeStats[trip.route_name].revenue += (trip.booked_seats || 0) * (trip.fare || 0);
      routeStats[trip.route_name].tickets += (trip.booked_seats || 0);
    });

    return Object.values(routeStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5); // Top 5 routes
  }, [trips]);

  // Mock timeline data for revenue chart (last 7 days)
  const timelineData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        value: Math.floor(Math.random() * 5000) + 1000 + (i * 500), // Mock trend
      };
    });
  }, []);

  const maxTimelineValue = Math.max(...timelineData.map(d => d.value));
  const maxRouteRevenue = Math.max(...routePerformance.map(r => r.revenue), 1);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Analytics Dashboard</h2>
        <p className="text-slate-400 text-sm mt-1">Real-time performance and revenue metrics</p>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Revenue" 
          value={`৳${stats.revenue.toLocaleString()}`} 
          trend="+12.5%" 
          trendUp={true} 
          icon="💰" 
          delay={0.1}
        />
        <StatCard 
          title="Tickets Sold" 
          value={stats.tickets.toLocaleString()} 
          trend="+5.2%" 
          trendUp={true} 
          icon="🎫" 
          delay={0.2}
        />
        <StatCard 
          title="Avg. Occupancy" 
          value={`${stats.occupancy}%`} 
          trend="-2.1%" 
          trendUp={false} 
          icon="👥" 
          delay={0.3}
        />
        <StatCard 
          title="Active Fleet" 
          value={`${stats.activeBuses} Buses`} 
          subtext={`across ${stats.activeRoutes} routes`}
          icon="🚌" 
          delay={0.4}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Revenue Trend Chart (Vertical Bars) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-md shadow-xl"
        >
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white">Revenue Trend</h3>
            <p className="text-sm text-slate-400">Past 7 days performance</p>
          </div>
          
          <div className="h-48 flex items-end justify-between gap-2 mt-4">
            {timelineData.map((data, i) => {
              const heightPercent = `${(data.value / maxTimelineValue) * 100}%`;
              return (
                <div key={i} className="flex flex-col items-center flex-1 group">
                  <div className="w-full relative flex justify-center h-full items-end">
                    {/* Tooltip */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs py-1 px-2 rounded-md pointer-events-none whitespace-nowrap z-10 shadow-lg border border-slate-700">
                      ৳{data.value.toLocaleString()}
                    </div>
                    {/* Bar */}
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: heightPercent }}
                      transition={{ duration: 0.8, delay: 0.6 + (i * 0.05), type: 'spring' }}
                      className="w-full max-w-[2rem] bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-sm opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                  <span className="text-xs text-slate-400 mt-2">{data.day}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Top Routes Chart (Horizontal Bars) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-md shadow-xl"
        >
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white">Top Performing Routes</h3>
            <p className="text-sm text-slate-400">By total revenue generated</p>
          </div>

          <div className="space-y-4">
            {routePerformance.length > 0 ? routePerformance.map((route, i) => {
              const widthPercent = `${(route.revenue / maxRouteRevenue) * 100}%`;
              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-200 font-medium truncate pr-4">{route.name}</span>
                    <span className="text-cyan-400 font-bold shrink-0">৳{route.revenue.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: widthPercent }}
                      transition={{ duration: 0.8, delay: 0.7 + (i * 0.1), ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                    />
                  </div>
                </div>
              );
            }) : (
              <div className="flex items-center justify-center h-32 text-slate-500 italic text-sm">
                No trip data available yet.
              </div>
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
}

function StatCard({ title, value, trend, trendUp, icon, delay, subtext }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-md shadow-lg group hover:border-cyan-500/30 transition-colors"
    >
      <div className="absolute -right-4 -top-4 text-6xl opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
        {icon}
      </div>
      
      <p className="text-sm font-medium text-slate-400">{title}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
      </div>
      
      <div className="mt-3 flex items-center gap-2 text-sm">
        {trend && (
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${trendUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
        {subtext ? (
          <span className="text-slate-500 text-xs">{subtext}</span>
        ) : trend ? (
          <span className="text-slate-500 text-xs">vs last week</span>
        ) : null}
      </div>
    </motion.div>
  );
}
