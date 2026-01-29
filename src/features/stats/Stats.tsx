
import React, { Suspense, lazy, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Filter, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@core/ui';
import { useStatsData } from '@features/stats/hooks/useStatsData';

interface StatsProps {
  currentDate: Date;
}

const StatsCharts = lazy(() => import('./StatsCharts'));

const Stats: React.FC<StatsProps> = ({ currentDate }) => {
  const [showCharts, setShowCharts] = useState(false);
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
  const monthLabel = format(currentDate, 'MMMM yyyy', { locale: es });
  const trendPoints = useMemo(() => {
    if (trendData.length === 0) return ['0,100', '100,100'];
    const counts = trendData.map(item => item.count);
    const max = Math.max(...counts, 1);
    const min = Math.min(...counts);
    const range = Math.max(max - min, 1);
    return counts.map((value, index) => {
      const x = counts.length === 1 ? 50 : (index / (counts.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    });
  }, [trendData]);

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
          <div className={`${compactStats ? 'h-20' : 'h-24'} w-full rounded-xl bg-gradient-to-br from-blue-50 to-white dark:from-slate-900 dark:to-slate-800 border border-blue-100/60 dark:border-slate-700/60`}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="trend-fill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              <polyline
                fill="none"
                stroke="#2563eb"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={trendPoints.join(' ')}
              />
              <polygon
                fill="url(#trend-fill)"
                points={`0,100 ${trendPoints.join(' ')} 100,100`}
              />
            </svg>
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

      {showCharts ? (
        <Suspense fallback={<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          <div className="h-64 md:h-72 rounded-2xl bg-gray-100 dark:bg-gray-800/70 animate-pulse" />
          <div className="h-64 md:h-72 rounded-2xl bg-gray-100 dark:bg-gray-800/70 animate-pulse" />
        </div>}>
          <StatsCharts
            variant="charts"
            monthlyData={monthlyData}
            typeDistribution={typeDistribution}
            chartTypes={chartTypes}
            monthLabel={monthLabel}
            compactStats={compactStats}
            colors={COLORS}
          />
        </Suspense>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700/60 bg-gray-50/80 dark:bg-gray-900/40 p-6 md:p-8 text-center space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">Los gráficos avanzados se cargan bajo demanda para acelerar la pantalla.</p>
          <Button size="sm" className="rounded-pill px-4" onClick={() => setShowCharts(true)}>
            Mostrar gráficos
          </Button>
        </div>
      )}
    </div>
  );
};

export default Stats;
