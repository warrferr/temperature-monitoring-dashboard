import React from 'react';
import { useTemperatureData } from './hooks/useTemperatureData';
import { TemperatureCard } from './components/TemperatureCard';
import { TemperatureChart } from './components/TemperatureChart';
import { ControlPanel } from './components/ControlPanel';
import { Thermometer, Activity } from 'lucide-react';

function App() {
  const { devices, historicalData, loading, error, refreshData, downloadData } = useTemperatureData();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading temperature data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Data</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={refreshData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 rounded-lg p-2">
                <Thermometer className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Temperature Monitoring</h1>
                <p className="text-sm text-gray-500">Particle IoT Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-green-500" />
              <span className="text-sm text-gray-600">Real-time Updates</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Temperature Cards */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
              {devices.map((device) => (
                <TemperatureCard key={device.id} device={device} />
              ))}
            </div>

            {/* Temperature Chart */}
            <TemperatureChart devices={devices} historicalData={historicalData} />
          </div>

          {/* Control Panel */}
          <div className="lg:col-span-1">
            <ControlPanel
              onRefresh={refreshData}
              onDownload={downloadData}
              isLoading={loading}
            />
          </div>
        </div>

        {/* Empty State */}
        {devices.length === 0 && (
          <div className="text-center py-12">
            <Thermometer className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Temperature Devices</h3>
            <p className="text-gray-500 mb-4">
              No active temperature monitoring devices found. Make sure your Particle devices are connected and publishing temperature data.
            </p>
            <button
              onClick={refreshData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Data
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;