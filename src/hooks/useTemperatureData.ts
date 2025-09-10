import { useState, useEffect, useCallback } from 'react';
import { supabase, TemperatureReading, DeviceWithLatestReading } from '../lib/supabase';


export function useTemperatureData() {
  const [devices, setDevices] = useState<DeviceWithLatestReading[]>([]);
  const [historicalData, setHistoricalData] = useState<Record<string, TemperatureReading[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDevicesWithLatestReadings = useCallback(async () => {
    try {
      setError(null);
      
      // Fetch all active devices
      const { data: devicesData, error: devicesError } = await supabase
        .from('devices')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (devicesError) {
        throw new Error(`Failed to fetch devices: ${devicesError.message}`);
      }

      if (!devicesData || devicesData.length === 0) {
        setDevices([]);
        setHistoricalData({});
        return;
      }

      // For each device, get the latest valid temperature reading
      const devicesWithReadings: DeviceWithLatestReading[] = [];
      const historicalDataMap: Record<string, TemperatureReading[]> = {};

      for (const device of devicesData) {
        // Get latest valid reading
        const { data: latestReading } = await supabase
          .from('temperature_readings')
          .select('*')
          .eq('device_id', device.id)
          .gte('temperature', -20) // Filter out error readings
          .order('timestamp', { ascending: false })
          .limit(1)
          .single();

        // Get historical data (last 24 hours of valid readings)
        const { data: historicalReadings } = await supabase
          .from('temperature_readings')
          .select('*')
          .eq('device_id', device.id)
          .gte('temperature', -20) // Filter out error readings
          .gte('timestamp', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
          .order('timestamp', { ascending: false })
          .limit(1000);

        devicesWithReadings.push({
          ...device,
          latest_reading: latestReading || undefined,
        });

        // Reverse to get chronological order for chart (oldest to newest)
        historicalDataMap[device.id] = (historicalReadings || []).reverse();
      }

      setDevices(devicesWithReadings);
      setHistoricalData(historicalDataMap);
    } catch (err) {
      console.error('Error fetching temperature data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch temperature data');
    }
  }, []);

  const refreshData = useCallback(async () => {
    setLoading(true);
    await fetchDevicesWithLatestReadings();
    setLoading(false);
  }, [fetchDevicesWithLatestReadings]);

  const downloadData = useCallback(async (days: number) => {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const { data: readings, error: readingsError } = await supabase
        .from('temperature_readings')
        .select(`
          *,
          devices!inner(name, particle_id)
        `)
        .gte('temperature', -20) // Filter out error readings
        .gte('timestamp', startDate.toISOString())
        .order('timestamp', { ascending: false });

      if (readingsError) {
        throw new Error(`Failed to fetch readings: ${readingsError.message}`);
      }

      if (!readings || readings.length === 0) {
        alert('No valid temperature data found for the selected period.');
        return;
      }

      // Convert to CSV
      const csvHeaders = ['Device Name', 'Particle ID', 'Temperature (°C)', 'Timestamp'];
      const csvRows = readings.map(reading => {
        const readingWithDevice = reading as TemperatureReading & {
          devices: { name: string; particle_id: string };
        };
        return [
          readingWithDevice.devices.name,
          readingWithDevice.devices.particle_id,
          reading.temperature.toString(),
          new Date(reading.timestamp).toLocaleString()
        ];
      });

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.join(','))
      ].join('\n');

      // Download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `temperature-data-${days}days-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading data:', err);
      alert('Failed to download data. Please try again.');
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Fallback: Poll for updates every 30 seconds if realtime fails
  useEffect(() => {
    const pollInterval = setInterval(() => {
      fetchDevicesWithLatestReadings();
    }, 30000); // 30 seconds

    return () => clearInterval(pollInterval);
  }, [fetchDevicesWithLatestReadings]);

  // Set up real-time subscription for new temperature readings
  useEffect(() => {
    const subscription = supabase
      .channel('temperature_readings')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'temperature_readings',
          filter: 'temperature.gte.-20' // Only listen for valid readings
        },
        (payload) => {
          // Refresh data when new valid readings are inserted
          console.log('Real-time update received:', payload);
          // Force complete data refresh to update both cards AND historical chart data
          refreshData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchDevicesWithLatestReadings]);

  return {
    devices,
    historicalData,
    loading,
    error,
    refreshData,
    downloadData,
  };
}