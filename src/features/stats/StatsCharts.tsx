import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

type ChartType = { id: string; label: string };
type TrendPoint = { day: string; dateFull: string; count: number };
type DistributionPoint = { name: string; value: number };
type MonthlyRow = Record<string, string | number>;

type BaseProps = {
  compactStats: boolean;
  colors: string[];
};

type TrendProps = BaseProps & {
  variant: 'trend';
  trendData: TrendPoint[];
};

type ChartsProps = BaseProps & {
  variant: 'charts';
  monthlyData: MonthlyRow[];
  typeDistribution: DistributionPoint[];
  chartTypes: ChartType[];
  monthLabel: string;
};

type StatsChartsProps = TrendProps | ChartsProps;

const StatsCharts: React.FC<StatsChartsProps> = (props) => {
  if (props.variant === 'trend') {
    const { trendData, compactStats } = props;
    return (
      <div className={`${compactStats ? 'h-20' : 'h-24'} w-full`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData}>
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#f3f4f6', fontSize: '12px' }}
              labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              strokeWidth={compactStats ? 2.5 : 3}
              dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  const { monthlyData, typeDistribution, chartTypes, monthLabel, compactStats, colors } = props;

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 ${compactStats ? 'gap-4 md:gap-5' : 'gap-6 md:gap-8'}`}>
      <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 ${compactStats ? 'p-5' : 'p-6 md:p-8'}`}>
        <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center ${compactStats ? 'mb-4' : 'mb-6'} gap-2`}>
          <h3 className={`${compactStats ? 'text-lg' : 'text-xl'} font-bold text-gray-800 dark:text-gray-100`}>Flujo Mensual</h3>
          <span className="text-xs font-semibold text-gray-600 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full capitalize">
            {monthLabel}
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
                  fill={colors[idx % colors.length]}
                  name={label}
                  radius={[0, 0, 0, 0]}
                  maxBarSize={40}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 ${compactStats ? 'p-5' : 'p-6 md:p-8'}`}>
        <h3 className={`${compactStats ? 'text-lg' : 'text-xl'} font-bold text-gray-800 dark:text-gray-100 ${compactStats ? 'mb-4' : 'mb-6'}`}>Distribución por Tipo</h3>
        <div className={`${compactStats ? 'h-56 md:h-64' : 'h-64 md:h-72'} w-full flex justify-center`}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={typeDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                {typeDistribution.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '12px', color: '#f3f4f6' }} />
              <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default StatsCharts;
