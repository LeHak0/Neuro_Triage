import { useState } from 'react';

interface BrainSlice {
  axial?: string;
  coronal?: string;
  sagittal?: string;
  axial_heatmap?: string;
  coronal_heatmap?: string;
  sagittal_heatmap?: string;
}

interface HeatmapCoordinate {
  x: number;
  y: number;
  intensity: number;
  region: string;
}

interface HeatmapData {
  axial: HeatmapCoordinate[];
  coronal: HeatmapCoordinate[];
  sagittal: HeatmapCoordinate[];
}

interface AbnormalityRegion {
  name: string;
  coordinates: number[];
  abnormality_score: number;
  description: string;
  severity: string;
  color: string;
}

interface BrainVisualizationProps {
  slices: BrainSlice;
  volumes: any;
  qualityMetrics: any;
  heatmapData?: HeatmapData;
  abnormalityRegions?: Record<string, AbnormalityRegion>;
}

export default function BrainVisualization({ 
  slices, 
  volumes, 
  qualityMetrics, 
  heatmapData,
  abnormalityRegions 
}: BrainVisualizationProps) {
  const [activeView, setActiveView] = useState<'axial' | 'coronal' | 'sagittal'>('axial');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);

  // Check if we have any actual brain slice images (non-empty base64 strings)
  const hasSliceImages = !!slices && Object.values(slices).some(
    (slice) => typeof slice === 'string' && slice.trim().length > 0
  );

  console.log('BrainVisualization props:', { slices, volumes, qualityMetrics, heatmapData, abnormalityRegions });
  console.log('BrainVisualization - slices type:', typeof slices);
  console.log('BrainVisualization - slices value:', slices);
  console.log('Active view:', activeView);
  console.log('Current slice data:', slices && slices[activeView] ? 'Present' : 'Missing');
  console.log('Slices object keys:', Object.keys(slices || {}));
  console.log('hasSliceImages:', hasSliceImages);
  console.log('Quality Metrics Debug:', qualityMetrics);
  console.log('Quality Metrics SNR:', qualityMetrics?.snr);
  console.log('Quality Metrics Score:', qualityMetrics?.quality_score);
  
  // More detailed slice debugging
  if (slices) {
    Object.keys(slices).forEach(view => {
      const viewKey = view as keyof BrainSlice;
      const sliceData = slices[viewKey];
      console.log(`${view} slice:`, sliceData ? `Length: ${sliceData.length}, Preview: ${sliceData.substring(0, 30)}...` : 'Empty');
    });
  }
  
  console.log('BrainVisualization volumes:', volumes);

  const handleRegionClick = (regionKey: string) => {
    setSelectedRegion(selectedRegion === regionKey ? null : regionKey);
  };

  // Safety checks for data structure
  if (!volumes) {
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden p-8 text-center">
        <div className="text-4xl mb-4">🧠</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Brain Imaging Analysis</h3>
        <p className="text-sm text-zinc-600">No volume data available.</p>
      </div>
    );
  }

  const views = [
    { key: 'axial' as const, label: 'Axial', description: 'Top-down view' },
    { key: 'coronal' as const, label: 'Coronal', description: 'Front-back view' },
    { key: 'sagittal' as const, label: 'Sagittal', description: 'Side view' }
  ];

  const VolumeCard = ({ title, value, unit, percentile, color }: {
    title: string;
    value: number;
    unit: string;
    percentile?: number;
    color: string;
  }) => (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-700">{title}</h4>
        <div className={`w-3 h-3 rounded-full ${color}`}></div>
      </div>
      <div className="space-y-1">
        <div className="text-2xl font-bold text-gray-900">
          {value.toFixed(1)} <span className="text-sm font-normal text-gray-500">{unit}</span>
        </div>
        {percentile && (
          <div className="text-xs text-gray-500">
            {percentile}th percentile for age
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
        <h3 className="text-xl font-semibold text-white">Brain Imaging Analysis</h3>
        <p className="text-blue-100 text-sm">Interactive neuroimaging visualization</p>
      </div>

      <div className="p-6">
        {/* View Selection */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {views.map((view) => (
              <button
                key={view.key}
                onClick={() => setActiveView(view.key)}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  activeView === view.key
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="text-center">
                  <div>{view.label}</div>
                  <div className="text-xs opacity-75">{view.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Brain Image Viewer */}
          <div className="lg:col-span-2">
            <div className="relative bg-black rounded-lg overflow-hidden aspect-square">
              {slices && slices[activeView] ? (
                <div className="relative w-full h-full">
                  <img 
                    src={`data:image/png;base64,${slices[activeView]}`}
                    alt={`Brain ${activeView} view`}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      console.error('Image failed to load:', e);
                      console.log('Image src length:', slices[activeView]?.length);
                    }}
                  />
                  
                  {/* Heatmap Overlay */}
                  {showHeatmap && slices && slices[`${activeView}_heatmap`] && (
                    <img 
                      src={`data:image/png;base64,${slices[`${activeView}_heatmap`]}`}
                      alt={`Heatmap ${activeView} view`}
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  )}
                  
                  {/* Interactive Region Overlays */}
                  {abnormalityRegions && Object.entries(abnormalityRegions).map(([regionKey, region]) => (
                    <div
                      key={regionKey}
                      className="absolute cursor-pointer hover:opacity-75 transition-opacity"
                      style={{
                        left: `${region.coordinates[0]}%`,
                        top: `${region.coordinates[1]}%`,
                        width: '20px',
                        height: '20px',
                        backgroundColor: region.color,
                        borderRadius: '50%',
                        border: '2px solid white',
                        transform: 'translate(-50%, -50%)',
                        boxShadow: selectedRegion === regionKey ? '0 0 10px rgba(255,255,255,0.8)' : 'none'
                      }}
                      onClick={() => handleRegionClick(regionKey)}
                      title={`${region.name} - ${region.severity} (${region.abnormality_score.toFixed(2)})`}
                    />
                  ))}
                  
                  {/* Interactive Heatmap Points */}
                  {heatmapData && heatmapData[activeView] && heatmapData[activeView].map((coordinate, index) => (
                    <div
                      key={`heatmap-${index}`}
                      className="absolute cursor-pointer hover:scale-110 transition-transform"
                      style={{
                        left: `${coordinate.x}%`,
                        top: `${coordinate.y}%`,
                        width: '12px',
                        height: '12px',
                        backgroundColor: `rgba(255, 0, 0, ${coordinate.intensity})`,
                        borderRadius: '50%',
                        border: '1px solid rgba(255,255,255,0.8)',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 10
                      }}
                      title={`${coordinate.region} - Intensity: ${coordinate.intensity.toFixed(2)}`}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🧠</div>
                    <div className="text-white mb-2">
                      {slices ? 'Loading brain slice...' : 'No brain data'}
                    </div>
                    <div className="text-sm text-gray-300">
                      Active view: {activeView}
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      Available views: {slices ? Object.keys(slices).join(', ') : 'none'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Heatmap Controls */}
            <div className="mt-4 flex justify-between items-center">
              <div className="flex space-x-2">
                <div className="bg-gray-100 rounded-lg px-4 py-2 text-sm text-gray-600">
                  <span className="font-medium">Slice:</span> Central
                </div>
                <div className="bg-gray-100 rounded-lg px-4 py-2 text-sm text-gray-600">
                  <span className="font-medium">Contrast:</span> T1-weighted
                </div>
              </div>
              
              <button
                onClick={() => setShowHeatmap(!showHeatmap)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showHeatmap 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {showHeatmap ? 'Hide Heatmap' : 'Show Heatmap'}
              </button>
            </div>
          </div>

          {/* Volume Metrics */}
          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Volume Analysis</h4>
              <div className="space-y-3">
                {volumes?.hippocampal_volumes_ml && (
                  <>
                    <VolumeCard
                      title="Left Hippocampus"
                      value={volumes.hippocampal_volumes_ml.left_ml || 0}
                      unit="ml"
                      color="bg-blue-500"
                    />
                    <VolumeCard
                      title="Right Hippocampus"
                      value={volumes.hippocampal_volumes_ml.right_ml || 0}
                      unit="ml"
                      color="bg-green-500"
                    />
                    <VolumeCard
                      title="Asymmetry"
                      value={volumes.hippocampal_volumes_ml.asymmetry_ml || 0}
                      unit="ml"
                      color="bg-yellow-500"
                    />
                  </>
                )}
                
                {volumes?.brain_volumes && (
                  <VolumeCard
                    title="Total Brain"
                    value={volumes.brain_volumes.total_brain_ml || 0}
                    unit="ml"
                    color="bg-purple-500"
                  />
                )}
              </div>
            </div>

            {/* Processing Pipeline Status */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
              <h5 className="font-medium text-gray-900 mb-2">Processing Status</h5>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span>NIFTI file loaded</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span>Brain segmentation</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span>Volume extraction</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span>Quality assessment</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
