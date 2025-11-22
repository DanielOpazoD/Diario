
import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { endOfMonth, eachDayOfInterval, format, isSameDay, isWithinInterval, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Filter, Clock, TrendingUp } from 'lucide-react';
import Button from './Button';
import useAppStore from '../stores/useAppStore';
import { PatientTypeConfig } from '../types';

interface StatsProps {
  currentDate: Date;
}

const Stats: React.FC<StatsProps> = ({ currentDate }) => {
  const records = useAppStore(state => state.records);
  const patientTypes = useAppStore(state => state.patientTypes);

  const typeConfigByLabel = useMemo(() => {
    return patientTypes.reduce<Record<string, PatientTypeConfig>>((acc, type) => {
      acc[type.label.toLowerCase()] = type;
      return acc;
    }, {});
  }, [patientTypes]);
  
  const [startDate, setStartDate] = useState(format(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(currentDate), 'yyyy-MM-dd'));

  // Determine which types are actually relevant (either configured or exist in records)
  const relevantTypes = useMemo(() => {
     return patientTypes.map(t => t.label);
  }, [patientTypes]);

  const COLORS = ['#ef4444', '#3b82f6', '#9333ea', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#6b7280'];

  const monthlyData = useMemo(() => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });

    return days.map(day => {
      const dayRecords = records.filter(r => isSameDay(new Date(r.date + 'T00:00:00'), day));
      
      const dayStats: any = {
        date: format(day, 'd', { locale: es }),
        total: dayRecords.length,
      };

      relevantTypes.forEach(type => {
         dayStats[type] = dayRecords.filter(r => r.type === type).length;
      });

      return dayStats;
    });
  }, [records, currentDate, relevantTypes]);

  const trendData = useMemo(() => {
    const end = new Date();
    const start = addDays(end, -6);
    const days = eachDayOfInterval({ start, end });

    return days.map(day => {
        const count = records.filter(r => isSameDay(new Date(r.date + 'T00:00:00'), day)).length;
        return {
            day: format(day, 'EEE', { locale: es }),
            dateFull: format(day, 'd MMM'),
            count
        };
    });
  }, [records]);

  const typeDistribution = useMemo(() => {
    const monthRecords = records.filter(r => {
      const d = new Date(r.date + 'T00:00:00');
      return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });

    return relevantTypes.map(type => ({
       name: type,
       value: monthRecords.filter(r => r.type === type).length
    })).filter(d => d.value > 0);
  }, [records, currentDate, relevantTypes]);

  const monthTotal = useMemo(
    () => typeDistribution.reduce((acc, curr) => acc + curr.value, 0),
    [typeDistribution]
  );

  const reportData = useMemo(() => {
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');

    const rangeRecords = records.filter(r => {
       const rDate = new Date(r.date + 'T00:00:00');
       return isWithinInterval(rDate, { start, end });
    });

    const hoursByType: Record<string, number> = {};
    relevantTypes.forEach(t => hoursByType[t] = 0);

    rangeRecords.forEach(r => {
       const config = typeConfigByLabel[r.type.toLowerCase()];

       // REGLA DE NEGOCIO:
       // Policlínico = 30 min fijo por paciente
       if (config?.id === 'policlinico') {
          hoursByType[r.type] += 30;
       }
       // Turno = Diferencia entre entrada y salida
       else if (config?.id === 'turno') {
          if (r.entryTime && r.exitTime) {
            const [startH, startM] = r.entryTime.split(':').map(Number);
            const [endH, endM] = r.exitTime.split(':').map(Number);
            let diffMins = (endH * 60 + endM) - (startH * 60 + startM);
            if (diffMins < 0) diffMins += 24 * 60; // Cruzó medianoche
            hoursByType[r.type] += diffMins;
          }
       }
       // Hospitalizado = NO SUMA TIEMPO (0)
       else if (config?.id === 'hospitalizado') {
          // hoursByType[r.type] += 0;
       }
       // Otros (Extra) = Asumimos 0 o cálculo genérico si hay horas?
       // Por ahora solo los especificados suman.
    });

    const formattedHours: Record<string, string> = {};
    // Filter out Hospitalized from the visual hours report as requested
    Object.keys(hoursByType).forEach(k => {
       const config = typeConfigByLabel[k.toLowerCase()];
       if (config?.id !== 'hospitalizado') {
          formattedHours[k] = (hoursByType[k] / 60).toFixed(1);
       }
    });

    return {
       count: rangeRecords.length,
       hours: formattedHours
    };

  }, [records, startDate, endDate, relevantTypes]);

  const resetToCurrentMonth = () => {
    setStartDate(format(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), 'yyyy-MM-dd'));
    setEndDate(format(endOfMonth(currentDate), 'yyyy-MM-dd'));
  };

  const setLastSevenDays = () => {
    setEndDate(format(new Date(), 'yyyy-MM-dd'));
    setStartDate(format(addDays(new Date(), -6), 'yyyy-MM-dd'));
  };

  return (
    <div className="space-y-6 md:space-y-10 animate-fade-in pb-20 pt-2 max-w-6xl mx-auto">
      <div className="rounded-panel border border-gray-200/70 dark:border-gray-800/60 bg-white/90 dark:bg-gray-900/70 shadow-elevated backdrop-blur-sm p-panel">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Contexto</p>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">Estadísticas del mes</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{records.length} registros totales • {monthTotal} en el mes actual</p>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="secondary" className="rounded-pill px-4" onClick={resetToCurrentMonth}>
              Mes actual
            </Button>
            <Button className="rounded-pill px-4" onClick={setLastSevenDays}>
              Últimos 7 días
            </Button>
          </div>
        </div>
      </div>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
         <div className="bg-white/95 dark:bg-gray-800/90 p-panel rounded-card shadow-card border border-gray-100 dark:border-gray-700 flex items-center justify-between relative overflow-hidden group">
            <div className="relative z-10">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pacientes (Mes Actual)</p>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                    {typeDistribution.reduce((acc, curr) => acc + curr.value, 0)}
                </h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6" />
            </div>
         </div>

         <div className="md:col-span-2 bg-white/95 dark:bg-gray-800/90 p-panel rounded-card shadow-card border border-gray-100 dark:border-gray-700">
             <div className="flex items-center justify-between mb-4">
                 <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tendencia Semanal</h3>
                 <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">Últimos 7 días</span>
             </div>
             <div className="h-24 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                        <Tooltip 
                           contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#f3f4f6', fontSize: '12px' }} 
                           labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
                        />
                        <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                    </LineChart>
                 </ResponsiveContainer>
             </div>
         </div>
      </div>

      <div className="bg-white/95 dark:bg-gray-800/90 rounded-panel shadow-elevated border border-gray-100 dark:border-gray-700/50 overflow-hidden">
         <div className="p-panel bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border-b border-gray-100 dark:border-gray-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               <div>
                 <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                   <Filter className="w-5 h-5 text-blue-500" />
                   Calculadora de Horas
                 </h2>
                 <p className="text-sm text-gray-500 dark:text-gray-400">Reporte por rango de fechas.</p>
               </div>
               <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-2 bg-white/90 dark:bg-gray-900/90 p-2 rounded-card border border-gray-200 dark:border-gray-700 shadow-soft">
                  <div className="w-full sm:w-auto px-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Desde</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-sm font-medium text-gray-800 dark:text-white outline-none w-full sm:w-32" />
                  </div>
                  <div className="hidden sm:block w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
                  <div className="w-full sm:w-auto px-2 border-t border-gray-100 dark:border-gray-800 sm:border-t-0 pt-2 sm:pt-0 mt-2 sm:mt-0">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Hasta</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-sm font-medium text-gray-800 dark:text-white outline-none w-full sm:w-32" />
                  </div>
               </div>
            </div>
         </div>
         <div className="p-panel md:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
               {/* Main Total Card */}
               <div className="p-5 rounded-card bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-soft">
                  <div className="flex justify-between items-start mb-2">
                     <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Pacientes</span>
                     <Filter className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex items-baseline gap-1">
                     <span className="text-3xl font-bold text-gray-900 dark:text-white">{reportData.count}</span>
                     <span className="text-sm font-medium text-gray-500">fichas</span>
                  </div>
               </div>

               {/* Dynamic Cards for Hours */}
               {Object.entries(reportData.hours).map(([type, hours], idx) => {
                  const color = COLORS[idx % COLORS.length]; 
                  return (
                    <div key={type} className="p-5 rounded-card bg-opacity-10 border border-opacity-20 transition-all hover:bg-opacity-20 shadow-soft" style={{ backgroundColor: `${color}10`, borderColor: `${color}30` }}>
                        <div className="flex justify-between items-start mb-2">
                           <span className="text-xs font-bold uppercase tracking-wide truncate" style={{ color: color }}>{type}</span>
                           <Clock className="w-4 h-4" style={{ color: color }} />
                        </div>
                        <div className="flex items-baseline gap-1">
                           <span className="text-3xl font-bold text-gray-800 dark:text-gray-100">{hours}</span>
                           <span className="text-sm font-medium opacity-70">hrs</span>
                        </div>
                    </div>
                  );
               })}
            </div>
         </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Bar Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Flujo Mensual</h3>
              <span className="text-sm font-medium text-gray-500 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full capitalize">
                {format(currentDate, 'MMMM yyyy', { locale: es })}
              </span>
            </div>
            <div className="h-64 md:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" className="dark:stroke-gray-700/50" />
                  <XAxis dataKey="date" stroke="#9ca3af" tick={{fill: '#9ca3af', fontSize: 12}} tickLine={false} axisLine={false} dy={10} />
                  <YAxis allowDecimals={false} stroke="#9ca3af" tick={{fill: '#9ca3af', fontSize: 12}} tickLine={false} axisLine={false} dx={-10} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '12px', color: '#f3f4f6', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} itemStyle={{ color: '#f3f4f6' }} cursor={{fill: 'transparent'}} />
                  <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                  
                  {relevantTypes.map((type, idx) => (
                    <Bar 
                      key={type} 
                      dataKey={type} 
                      stackId="a" 
                      fill={COLORS[idx % COLORS.length]} 
                      name={type} 
                      radius={[0, 0, 0, 0]} 
                      maxBarSize={40} 
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">Distribución por Tipo</h3>
          <div className="h-64 md:h-72 w-full flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={typeDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                  {typeDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '12px', color: '#f3f4f6' }} />
                <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;
