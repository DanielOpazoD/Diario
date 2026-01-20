
import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Filter, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@core/ui';
import { useStatsData } from '@features/stats/hooks/useStatsData';

interface StatsProps {
  currentDate: Date;
}

const Stats: React.FC<StatsProps> = ({ currentDate }) => {
  const {
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    chartTypes,
    monthlyData,
    trendData,
    typeDistribution,
    monthTotal,
    reportData,
    compactStats,
    resetToCurrentMonth,
    setLastSevenDays,
    totalRecords,
  } = useStatsData(currentDate);

  const COLORS = ['#ef4444', '#3b82f6', '#9333ea', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#6b7280'];

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in pb-14 pt-1.5 max-w-6xl mx-auto">
      <div className={`rounded-panel border border-gray-200/70 dark:border-gray-800/60 bg-white/85 dark:bg-gray-900/65 shadow-md backdrop-blur-sm ${compactStats ? 'px-3 py-2.5' : 'px-4 py-3'}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Contexto</p>
            <h2 className={`font-bold text-gray-900 dark:text-white leading-tight ${compactStats ? 'text-lg' : 'text-xl'}`}>Estadísticas del mes</h2>
            <p className={`text-gray-600 dark:text-gray-300 ${compactStats ? 'text-[13px]' : 'text-sm'}`}>{totalRecords} registros totales • {monthTotal} en el mes actual</p>
          </div>
          <div className="flex flex-wrap gap-1.5 justify-end text-xs">
            <Button variant="secondary" size="sm" className="rounded-pill px-3" onClick={resetToCurrentMonth}>
              Mes actual
            </Button>
            <Button size="sm" className="rounded-pill px-3" onClick={setLastSevenDays}>
              Últimos 7 días
            </Button>
          </div>
        </div>
      </div>
      {/* KPI Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5 ${compactStats ? 'text-sm' : ''}`}>
        <div className={`bg-white/95 dark:bg-gray-800/90 rounded-card shadow-card border border-gray-100 dark:border-gray-700 flex items-center justify-between relative overflow-hidden group ${compactStats ? 'p-4' : 'p-panel'}`}>
          <div className="relative z-10 space-y-0.5">
            <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400">Pacientes (Mes Actual)</p>
            <h3 className={`${compactStats ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900 dark:text-white mt-0.5`}>
              {typeDistribution.reduce((acc, curr) => acc + curr.value, 0)}
            </h3>
          </div>
          <div className={`bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform ${compactStats ? 'w-10 h-10' : 'w-12 h-12'}`}>
            <TrendingUp className={`${compactStats ? 'w-5 h-5' : 'w-6 h-6'}`} />
          </div>
        </div>

        <div className={`md:col-span-2 bg-white/95 dark:bg-gray-800/90 rounded-card shadow-card border border-gray-100 dark:border-gray-700 ${compactStats ? 'p-4' : 'p-panel'}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`${compactStats ? 'text-base' : 'text-lg'} font-bold text-gray-900 dark:text-white`}>Tendencia Semanal</h3>
            <span className="text-[11px] bg-green-100 text-green-800 px-2 py-1 rounded-full font-semibold">Últimos 7 días</span>
          </div>
          <div className={`${compactStats ? 'h-20' : 'h-24'} w-full`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#f3f4f6', fontSize: '12px' }}
                  labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
                />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={compactStats ? 2.5 : 3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className={`bg-white/95 dark:bg-gray-800/90 rounded-panel shadow-elevated border border-gray-100 dark:border-gray-700/50 overflow-hidden ${compactStats ? 'text-[13px]' : ''}`}>
        <div className={`bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border-b border-gray-100 dark:border-gray-700 ${compactStats ? 'p-4' : 'p-panel'}`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-0.5">
              <h2 className={`${compactStats ? 'text-base' : 'text-lg'} font-bold text-gray-900 dark:text-white flex items-center gap-2`}>
                <Filter className={`text-blue-500 ${compactStats ? 'w-4 h-4' : 'w-5 h-5'}`} />
                Calculadora de Horas
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Reporte por rango de fechas.</p>
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
        <div className={`${compactStats ? 'p-4 md:p-6' : 'p-panel md:p-8'}`}>
          <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-5`}>
            {/* Main Total Card */}
            <div className="p-4 rounded-card bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-soft">
              <div className="flex justify-between items-start mb-1.5">
                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Pacientes</span>
                <Filter className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{reportData.count}</span>
                <span className="text-xs font-medium text-gray-500">fichas</span>
              </div>
            </div>

            {/* Dynamic Cards for Hours */}
            {Object.entries(reportData.hours).map(([type, hours], idx) => {
              const color = COLORS[idx % COLORS.length];
              return (
                <div key={type} className="p-4 rounded-card bg-opacity-10 border border-opacity-20 transition-all hover:bg-opacity-20 shadow-soft" style={{ backgroundColor: `${color}10`, borderColor: `${color}30` }}>
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wide truncate" style={{ color: color }}>{type}</span>
                    <Clock className="w-4 h-4" style={{ color: color }} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">{hours}</span>
                    <span className="text-xs font-medium opacity-70">hrs</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 lg:grid-cols-2 ${compactStats ? 'gap-4 md:gap-5' : 'gap-6 md:gap-8'}`}>
        {/* Bar Chart */}
        <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 ${compactStats ? 'p-5' : 'p-6 md:p-8'}`}>
          <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center ${compactStats ? 'mb-4' : 'mb-6'} gap-2`}>
            <h3 className={`${compactStats ? 'text-lg' : 'text-xl'} font-bold text-gray-800 dark:text-gray-100`}>Flujo Mensual</h3>
            <span className="text-xs font-semibold text-gray-600 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full capitalize">
              {format(currentDate, 'MMMM yyyy', { locale: es })}
            </span>
          </div>
          <div className={`${compactStats ? 'h-56 md:h-64' : 'h-64 md:h-72'} w-full`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" className="dark:stroke-gray-700/50" />
                <XAxis dataKey="date" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} tickLine={false} axisLine={false} dy={10} />
                <YAxis allowDecimals={false} stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '12px', color: '#f3f4f6', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} itemStyle={{ color: '#f3f4f6' }} cursor={{ fill: 'transparent' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />

                {chartTypes.map(({ id, label }, idx) => (
                  <Bar
                    key={id}
                    dataKey={label}
                    stackId="a"
                    fill={COLORS[idx % COLORS.length]}
                    name={label}
                    radius={[0, 0, 0, 0]}
                    maxBarSize={40}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 ${compactStats ? 'p-5' : 'p-6 md:p-8'}`}>
          <h3 className={`${compactStats ? 'text-lg' : 'text-xl'} font-bold text-gray-800 dark:text-gray-100 ${compactStats ? 'mb-4' : 'mb-6'}`}>Distribución por Tipo</h3>
          <div className={`${compactStats ? 'h-56 md:h-64' : 'h-64 md:h-72'} w-full flex justify-center`}>
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
