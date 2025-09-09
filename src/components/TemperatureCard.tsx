import React from 'react';
import { DeviceWithLatestReading } from '../lib/supabase';
import { Thermometer, Clock, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TemperatureCardProps {
  device: DeviceWithLatestReading;
}

// Filter function to exclude error readings
const isValidTemperature = (temperature: number): boolean => {
  return temperature >= -20; // Readings below -20°C are considered errors
};

export function TemperatureCard({ device }: TemperatureCardProps) {
  const hasReading = device.latest_reading;
  const temperature = hasReading ? device.latest_reading!.temperature : null;
  const isValid = temperature !== null && isValidTemperature(temperature);

  const getTemperatureColor = (temp: number) => {
    if (temp < 0) return 'text-blue-600';
    if (temp < 15) return 'text-cyan-600';
    if (temp < 25) return 'text-green-600';
    if (temp < 35) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBackgroundColor = (temp: number) => {
    if (temp < 0) return 'bg-blue-50 border-blue-200';
    if (temp < 15) return 'bg-cyan-50 border-cyan-200';
    if (temp < 25) return 'bg-green-50 border-green-200';
    if (temp < 35) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className={`rounded-xl border p-6 ${
      isValid && temperature !== null 
        ? getBackgroundColor(temperature)
        : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`rounded-lg p-2 ${
            isValid && temperature !== null
              ? 'bg-white'
              : 'bg-gray-200'
          }`}>
            {!isValid && temperature !== null ? (
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            ) : (
              <Thermometer className={`h-5 w-5 ${
                isValid && temperature !== null
                  ? getTemperatureColor(temperature)
                  : 'text-gray-500'
              }`} />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{device.name}</h3>
            <p className="text-sm text-gray-500">
              {device.particle_id.substring(0, 8)}...
            </p>
          </div>
        </div>
        <div className={`w-3 h-3 rounded-full ${
          device.is_active ? 'bg-green-400' : 'bg-gray-400'
        }`} />
      </div>

      <div className="space-y-2">
        {!hasReading ? (
          <div className="text-center py-4">
            <p className="text-gray-500">No readings available</p>
          </div>
        ) : !isValid ? (
          <div className="text-center py-4">
            <p className="text-orange-600 font-medium">Invalid reading detected</p>
            <p className="text-sm text-gray-500">
              Reading: {temperature}°C (filtered out)
            </p>
          </div>
        ) : (
          <>
            <div className="text-center">
              <div className={`text-3xl font-bold ${getTemperatureColor(temperature!)}`}>
                {temperature!.toFixed(1)}°C
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Current Temperature
              </div>
            </div>
            
            <div className="flex items-center justify-center space-x-1 text-xs text-gray-500 pt-2">
              <Clock className="h-3 w-3" />
              <span>
                {formatDistanceToNow(new Date(device.latest_reading!.timestamp), { 
                  addSuffix: true 
                })}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}