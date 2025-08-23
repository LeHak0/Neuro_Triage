import React from 'react';
import BrainVisualization from '../components/BrainVisualization';

export default function BrainView() {
  // This will eventually get data from context or props
  const mockData = {
    slices: {},
    volumes: null,
    qualityMetrics: null
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Brain Visualization</h1>
        <div className="text-sm text-gray-500">
          Interactive 3D brain analysis and slice viewing
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <BrainVisualization
          slices={mockData.slices}
          volumes={mockData.volumes}
          qualityMetrics={mockData.qualityMetrics}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="border border-zinc-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Volume Analysis</h3>
          <p className="text-sm text-zinc-600">
            Detailed hippocampal and brain volume measurements will appear here after processing.
          </p>
        </div>

        <div className="border border-zinc-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Quality Metrics</h3>
          <p className="text-sm text-zinc-600">
            Image quality assessment and signal-to-noise ratio analysis.
          </p>
        </div>

        <div className="border border-zinc-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Comparison</h3>
          <p className="text-sm text-zinc-600">
            Age-matched normative comparisons and percentile rankings.
          </p>
        </div>
      </div>
    </div>
  );
}
