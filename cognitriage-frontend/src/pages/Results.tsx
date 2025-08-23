import { Button } from "@/components/ui/button";

export default function Results() {
  // Mock data - this will come from context/props in real implementation
  const mockResults = {
    patientInfo: {
      age: 72,
      sex: 'M',
      moca_total: 24
    },
    riskTier: 'MODERATE',
    confidence: 0.78,
    imagingFindings: {
      hippocampal_volumes_ml: {
        left_ml: 3.2,
        right_ml: 3.4,
        asymmetry_ml: 0.2
      },
      mta_score: 2,
      percentiles: {
        left_pct: 45,
        right_pct: 52
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Analysis Results</h1>
        <div className="flex space-x-2">
          <Button variant="outline">📄 Export PDF</Button>
          <Button variant="outline">📧 Share Results</Button>
          <Button>🔄 Reprocess</Button>
        </div>
      </div>

      {/* Patient Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="border border-zinc-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Patient</h3>
          <div className="text-lg font-semibold">
            {mockResults.patientInfo.age}y, {mockResults.patientInfo.sex}
          </div>
        </div>
        
        <div className="border border-zinc-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-2">MoCA Score</h3>
          <div className="text-lg font-semibold">{mockResults.patientInfo.moca_total}/30</div>
        </div>

        <div className="border border-zinc-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Risk Tier</h3>
          <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
            mockResults.riskTier === 'LOW' ? 'bg-green-100 text-green-800' :
            mockResults.riskTier === 'MODERATE' ? 'bg-yellow-100 text-yellow-800' :
            mockResults.riskTier === 'HIGH' ? 'bg-orange-100 text-orange-800' :
            'bg-red-100 text-red-800'
          }`}>
            {mockResults.riskTier}
          </div>
        </div>

        <div className="border border-zinc-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Confidence</h3>
          <div className="text-lg font-semibold">{Math.round(mockResults.confidence * 100)}%</div>
        </div>
      </div>

      {/* Detailed Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Imaging Findings */}
        <div className="border border-zinc-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Imaging Findings</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-600">Left Hippocampus</div>
                <div className="text-xl font-bold text-blue-700">
                  {mockResults.imagingFindings.hippocampal_volumes_ml.left_ml} ml
                </div>
                <div className="text-xs text-gray-500">
                  {mockResults.imagingFindings.percentiles.left_pct}th percentile
                </div>
              </div>
              
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-sm text-gray-600">Right Hippocampus</div>
                <div className="text-xl font-bold text-green-700">
                  {mockResults.imagingFindings.hippocampal_volumes_ml.right_ml} ml
                </div>
                <div className="text-xs text-gray-500">
                  {mockResults.imagingFindings.percentiles.right_pct}th percentile
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Asymmetry</div>
                <div className="text-lg font-semibold">
                  {mockResults.imagingFindings.hippocampal_volumes_ml.asymmetry_ml} ml
                </div>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">MTA Score</div>
                <div className="text-lg font-semibold">
                  {mockResults.imagingFindings.mta_score}/4
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" className="w-full">
              🧠 View Brain Visualization
            </Button>
          </div>
        </div>

        {/* Risk Analysis */}
        <div className="border border-zinc-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Risk Analysis</h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="font-medium text-yellow-800">Moderate Risk</span>
              </div>
              <p className="text-sm text-yellow-700">
                Patient shows moderate risk factors for cognitive decline based on imaging and cognitive assessment.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Key Risk Factors:</h3>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm">Reduced hippocampal volume relative to age</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm">MoCA score below optimal threshold</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">Age-related risk factors present</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" className="w-full">
              💊 View Recommendations
            </Button>
          </div>
        </div>
      </div>

      {/* Processing Timeline */}
      <div className="border border-zinc-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Processing Timeline</h2>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">File Upload & QC</div>
              <div className="text-xs text-gray-500">Completed • 2 files processed</div>
            </div>
            <div className="text-xs text-gray-400">00:15</div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">Brain Segmentation</div>
              <div className="text-xs text-gray-500">Completed • Hippocampal volumes extracted</div>
            </div>
            <div className="text-xs text-gray-400">01:23</div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">Risk Stratification</div>
              <div className="text-xs text-gray-500">Completed • Risk tier assigned</div>
            </div>
            <div className="text-xs text-gray-400">01:45</div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">Evidence Synthesis</div>
              <div className="text-xs text-gray-500">Completed • 5 citations found</div>
            </div>
            <div className="text-xs text-gray-400">02:10</div>
          </div>
        </div>
      </div>

      {/* Quality Metrics */}
      <div className="border border-zinc-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Quality Metrics</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Image Quality</div>
            <div className="text-lg font-semibold text-green-700">Good</div>
            <div className="text-xs text-gray-500">SNR: 24.3</div>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Processing Confidence</div>
            <div className="text-lg font-semibold text-blue-700">High</div>
            <div className="text-xs text-gray-500">95% reliability</div>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Data Completeness</div>
            <div className="text-lg font-semibold text-purple-700">Complete</div>
            <div className="text-xs text-gray-500">All metrics available</div>
          </div>
        </div>
      </div>
    </div>
  );
}
