import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DeviceWithLatestReading, TemperatureReading } from '../lib/supabase';
import { format, parseISO } from 'date-fns';

interface TemperatureChartProps {
  devices: DeviceWithLatestReading[];
  historicalData: Record<string, TemperatureReading[]>;
}

const DEVICE_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
];

export function TemperatureChart({ devices, historicalData }: TemperatureChartProps) {
  // Combine all data points and sort by timestamp
  const allDataPoints = React.useMemo(() => {
    const timestamps = new Set<string>();
    const deviceDataMap: Record<string, Record<string, number>> = {};

    // Collect all timestamps and organize data by device
    devices.forEach((device) => {
      const readings = historicalData[device.id] || [];
      deviceDataMap[device.id] = {};
      
      readings.forEach(reading => {
        const timestamp = reading.timestamp;
        timestamps.add(timestamp);
        deviceDataMap[device.id][timestamp] = reading.temperature;
      });
    });

    // Create chart data
    return Array.from(timestamps)
      .sort()
      .map(timestamp => {
        const dataPoint: Record<string, string | number> = {
          timestamp,
          formattedTime: format(parseISO(timestamp), 'MMM dd HH:mm'),
        };

        devices.forEach(device => {
          const temp = deviceDataMap[device.id][timestamp];
          if (temp !== undefined) {
            dataPoint[device.name] = Number(temp.toFixed(1));
          }
        });

        return dataPoint;
      });
  }, [devices, historicalData]);

  const formatTooltipLabel = (label: string) => {
    try {
      return format(parseISO(label), 'MMM dd, yyyy HH:mm');
    } catch {
      return label;
    }
  };

  if (allDataPoints.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Temperature History</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          No historical data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Temperature History</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={allDataPoints}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="formattedTime" 
              stroke="#6b7280"
              fontSize={12}
              tick={{ fill: '#6b7280' }}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tick={{ fill: '#6b7280' }}
              label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              labelFormatter={formatTooltipLabel}
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value: number) => [`${value}°C`, '']}
            />
            <Legend />
            {devices.map((device, index) => (
              <Line
                key={device.id}
                type="monotone"
                dataKey={device.name}
                stroke={DEVICE_COLORS[index % DEVICE_COLORS.length]}
                strokeWidth={2}
                dot={{ fill: DEVICE_COLORS[index % DEVICE_COLORS.length], strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, stroke: DEVICE_COLORS[index % DEVICE_COLORS.length], strokeWidth: 2 }}
                connectNulls={true}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}