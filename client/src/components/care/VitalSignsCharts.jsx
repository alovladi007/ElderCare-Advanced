import React, { useState, useEffect, useCallback } from 'react';
import { Heart, Activity, Thermometer, Wind, Droplet, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, Badge, Loading, Alert, Select } from '..';
import careService from '../../services/care.service';

const VitalSignsCharts = ({ elderId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vitalReadings, setVitalReadings] = useState([]);
  const [stats, setStats] = useState({});
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d

  const loadVitalData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        days: timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90,
      };

      const [readings, bloodPressureStats, heartRateStats, temperatureStats] = await Promise.all([
        careService.getVitalReadings(elderId, params),
        careService.getVitalStats(elderId, 'BLOOD_PRESSURE'),
        careService.getVitalStats(elderId, 'HEART_RATE'),
        careService.getVitalStats(elderId, 'TEMPERATURE'),
      ]);

      setVitalReadings(readings);
      setStats({
        bloodPressure: bloodPressureStats,
        heartRate: heartRateStats,
        temperature: temperatureStats,
      });
    } catch (err) {
      setError(err.message || 'Failed to load vital signs');
    } finally {
      setLoading(false);
    }
  }, [elderId, timeRange]);

  useEffect(() => {
    loadVitalData();
  }, [loadVitalData]);

  const getLatestReading = (vitalType) => {
    const filtered = vitalReadings.filter((r) => r.vitalType === vitalType);
    return filtered.length > 0 ? filtered[0] : null;
  };

  const getTrend = (vitalType) => {
    const filtered = vitalReadings.filter((r) => r.vitalType === vitalType);
    if (filtered.length < 2) return null;

    const latest = filtered[0].value;
    const previous = filtered[1].value;
    const change = ((latest - previous) / previous) * 100;

    return {
      direction: change > 0 ? 'up' : 'down',
      percentage: Math.abs(change).toFixed(1),
    };
  };

  const vitalTypes = [
    {
      id: 'BLOOD_PRESSURE',
      label: 'Blood Pressure',
      icon: Activity,
      color: 'red',
      unit: 'mmHg',
      normalRange: '120/80',
    },
    {
      id: 'HEART_RATE',
      label: 'Heart Rate',
      icon: Heart,
      color: 'pink',
      unit: 'bpm',
      normalRange: '60-100',
    },
    {
      id: 'TEMPERATURE',
      label: 'Temperature',
      icon: Thermometer,
      color: 'orange',
      unit: '°F',
      normalRange: '97-99',
    },
    {
      id: 'OXYGEN_SATURATION',
      label: 'Oxygen Saturation',
      icon: Wind,
      color: 'blue',
      unit: '%',
      normalRange: '95-100',
    },
    {
      id: 'BLOOD_GLUCOSE',
      label: 'Blood Glucose',
      icon: Droplet,
      color: 'purple',
      unit: 'mg/dL',
      normalRange: '70-140',
    },
  ];

  if (loading) {
    return <Loading variant="spinner" size="lg" text="Loading vital signs..." />;
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert type="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Header with Filters */}
      <Card padding="normal" className="bg-white/10 backdrop-blur-md border-white/20">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Vital Signs Monitoring</h2>
            <p className="text-gray-400 text-sm">
              Track and analyze health vital signs over time
            </p>
          </div>
          <div className="flex gap-3">
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              options={[
                { value: '7d', label: 'Last 7 Days' },
                { value: '30d', label: 'Last 30 Days' },
                { value: '90d', label: 'Last 90 Days' },
              ]}
              className="mb-0 w-48"
            />
          </div>
        </div>
      </Card>

      {/* Vital Signs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vitalTypes.map((vital) => {
          const Icon = vital.icon;
          const latest = getLatestReading(vital.id);
          const trend = getTrend(vital.id);

          return (
            <Card
              key={vital.id}
              padding="normal"
              className="bg-white/10 backdrop-blur-md border-white/20"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg bg-${vital.color}-500/20`}>
                    <Icon className={`w-6 h-6 text-${vital.color}-400`} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{vital.label}</h3>
                    <p className="text-gray-400 text-xs">Normal: {vital.normalRange}</p>
                  </div>
                </div>
              </div>

              {latest ? (
                <>
                  <div className="mb-3">
                    <p className="text-3xl font-bold text-white">
                      {latest.value} {vital.unit}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {new Date(latest.recordedAt).toLocaleString()}
                    </p>
                  </div>

                  {trend && (
                    <div className="flex items-center gap-2">
                      {trend.direction === 'up' ? (
                        <TrendingUp className="w-4 h-4 text-green-400" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      )}
                      <span
                        className={`text-sm ${
                          trend.direction === 'up' ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {trend.percentage}% vs previous
                      </span>
                    </div>
                  )}

                  {latest.notes && (
                    <p className="text-gray-400 text-sm mt-2">{latest.notes}</p>
                  )}
                </>
              ) : (
                <p className="text-gray-500 text-center py-8">No readings available</p>
              )}
            </Card>
          );
        })}
      </div>

      {/* Recent Readings Table */}
      <Card
        title="Recent Readings"
        padding="normal"
        className="bg-white/10 backdrop-blur-md border-white/20"
      >
        {vitalReadings.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No vital signs recorded yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-gray-300 text-sm font-medium py-3 px-4">
                    Date & Time
                  </th>
                  <th className="text-left text-gray-300 text-sm font-medium py-3 px-4">
                    Vital Type
                  </th>
                  <th className="text-left text-gray-300 text-sm font-medium py-3 px-4">
                    Value
                  </th>
                  <th className="text-left text-gray-300 text-sm font-medium py-3 px-4">
                    Status
                  </th>
                  <th className="text-left text-gray-300 text-sm font-medium py-3 px-4">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody>
                {vitalReadings.slice(0, 10).map((reading) => (
                  <tr key={reading.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 px-4 text-gray-300 text-sm">
                      {new Date(reading.recordedAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-white text-sm">
                      {reading.vitalType.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 text-white font-medium text-sm">
                      {reading.value} {reading.unit}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          reading.isAbnormal
                            ? 'warning'
                            : 'success'
                        }
                      >
                        {reading.isAbnormal ? 'Abnormal' : 'Normal'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-sm">
                      {reading.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Interactive Charts */}
      {vitalReadings.length > 0 && (
        <>
          {/* Heart Rate Chart */}
          <Card
            title="Heart Rate Trends"
            padding="normal"
            className="bg-white/10 backdrop-blur-md border-white/20"
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={vitalReadings
                  .filter((r) => r.vitalType === 'HEART_RATE')
                  .reverse()
                  .slice(0, 20)}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis
                  dataKey="recordedAt"
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  stroke="#9ca3af"
                />
                <YAxis stroke="#9ca3af" domain={[50, 120]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                  }}
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', r: 4 }}
                  name="Heart Rate (bpm)"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Blood Pressure Chart */}
          <Card
            title="Blood Pressure Trends"
            padding="normal"
            className="bg-white/10 backdrop-blur-md border-white/20"
          >
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={vitalReadings
                  .filter((r) => r.vitalType === 'BLOOD_PRESSURE')
                  .reverse()
                  .slice(0, 20)}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis
                  dataKey="recordedAt"
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  stroke="#9ca3af"
                />
                <YAxis stroke="#9ca3af" domain={[80, 160]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                  }}
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  fill="#3b82f680"
                  strokeWidth={2}
                  name="Blood Pressure (mmHg)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Temperature Chart */}
          <Card
            title="Temperature Trends"
            padding="normal"
            className="bg-white/10 backdrop-blur-md border-white/20"
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={vitalReadings
                  .filter((r) => r.vitalType === 'TEMPERATURE')
                  .reverse()
                  .slice(0, 20)}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis
                  dataKey="recordedAt"
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  stroke="#9ca3af"
                />
                <YAxis stroke="#9ca3af" domain={[96, 101]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                  }}
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b', r: 4 }}
                  name="Temperature (°F)"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}

      {/* Statistics Summary */}
      {stats.heartRate && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card
            title="Blood Pressure Stats"
            padding="normal"
            className="bg-white/10 backdrop-blur-md border-white/20"
          >
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Average:</span>
                <span className="text-white font-medium">{stats.bloodPressure?.average || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Min:</span>
                <span className="text-white font-medium">{stats.bloodPressure?.min || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Max:</span>
                <span className="text-white font-medium">{stats.bloodPressure?.max || 'N/A'}</span>
              </div>
            </div>
          </Card>

          <Card
            title="Heart Rate Stats"
            padding="normal"
            className="bg-white/10 backdrop-blur-md border-white/20"
          >
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Average:</span>
                <span className="text-white font-medium">{stats.heartRate?.average || 'N/A'} bpm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Min:</span>
                <span className="text-white font-medium">{stats.heartRate?.min || 'N/A'} bpm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Max:</span>
                <span className="text-white font-medium">{stats.heartRate?.max || 'N/A'} bpm</span>
              </div>
            </div>
          </Card>

          <Card
            title="Temperature Stats"
            padding="normal"
            className="bg-white/10 backdrop-blur-md border-white/20"
          >
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Average:</span>
                <span className="text-white font-medium">{stats.temperature?.average || 'N/A'}°F</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Min:</span>
                <span className="text-white font-medium">{stats.temperature?.min || 'N/A'}°F</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Max:</span>
                <span className="text-white font-medium">{stats.temperature?.max || 'N/A'}°F</span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default VitalSignsCharts;
