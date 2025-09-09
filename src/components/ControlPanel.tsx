import React, { useState } from 'react';
import { RefreshCw, Download, Calendar } from 'lucide-react';

interface ControlPanelProps {
  onRefresh: () => void;
  onDownload: (days: number) => void;
  isLoading: boolean;
}

export function ControlPanel({ onRefresh, onDownload, isLoading }: ControlPanelProps) {
  const [downloadDays, setDownloadDays] = useState(7);

  const downloadOptions = [
    { value: 1, label: 'Last 24 hours' },
    { value: 7, label: 'Last 7 days' },
    { value: 30, label: 'Last 30 days' },
    { value: 90, label: 'Last 3 months' },
  ];

  return (
    <div className="bg-white rounded-xl border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Control Panel</h3>
      
      <div className="space-y-4">
        {/* Refresh Data */}
        <div>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>
        </div>

        {/* Download Data */}
        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Download Data
          </label>
          <div className="space-y-3">
            <select
              value={downloadDays}
              onChange={(e) => setDownloadDays(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {downloadOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => onDownload(downloadDays)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Download CSV</span>
            </button>
          </div>
        </div>

        {/* Status Information */}
        <div className="border-t pt-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>Real-time updates enabled</span>
            </div>
            <div className="text-xs text-gray-500">
              Data refreshes automatically when new readings are received
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}