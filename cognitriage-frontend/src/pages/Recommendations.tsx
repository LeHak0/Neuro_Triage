import { Button } from "@/components/ui/button";

export default function Recommendations() {
  // Mock data - this will come from context/props in real implementation
  const mockRecommendations = {
    riskTier: 'MODERATE',
    primaryRecommendations: [
      'Recommend follow-up cognitive testing in 6–12 months',
      'Lifestyle risk factor modification counseling',
      'Consider neuropsychological evaluation'
    ],
    clinicalActions: [
      'Schedule follow-up MRI in 12 months',
      'Refer to memory clinic if symptoms progress',
      'Monitor for changes in daily functioning'
    ],
    lifestyleInterventions: [
      'Regular aerobic exercise (150 min/week)',
      'Mediterranean diet implementation',
      'Cognitive training programs',
      'Social engagement activities',
      'Sleep hygiene optimization'
    ]
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Treatment Recommendations</h1>
        <div className="flex space-x-2">
          <Button variant="outline">📄 Generate Report</Button>
          <Button>📧 Share with Provider</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Summary */}
        <div className="border border-zinc-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Risk Assessment</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Current Risk Tier</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                mockRecommendations.riskTier === 'LOW' ? 'bg-green-100 text-green-800' :
                mockRecommendations.riskTier === 'MODERATE' ? 'bg-yellow-100 text-yellow-800' :
                mockRecommendations.riskTier === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                'bg-red-100 text-red-800'
              }`}>
                {mockRecommendations.riskTier}
              </span>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium mb-2">Key Indicators</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Hippocampal volume reduction</li>
                <li>• MoCA score below threshold</li>
                <li>• Age-related risk factors</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Primary Recommendations */}
        <div className="lg:col-span-2 border border-zinc-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Primary Clinical Recommendations</h2>
          <div className="space-y-4">
            {mockRecommendations.primaryRecommendations.map((rec, i) => (
              <div key={i} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{rec}</p>
                </div>
                <Button variant="ghost" size="sm">
                  ✓ Mark Done
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clinical Actions */}
        <div className="border border-zinc-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Clinical Actions</h2>
          <div className="space-y-3">
            {mockRecommendations.clinicalActions.map((action, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg">
                <input type="checkbox" className="rounded" />
                <span className="text-sm text-gray-900 flex-1">{action}</span>
                <span className="text-xs text-gray-500">📅 Schedule</span>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <Button className="w-full">
              📋 Create Care Plan
            </Button>
          </div>
        </div>

        {/* Lifestyle Interventions */}
        <div className="border border-zinc-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Lifestyle Interventions</h2>
          <div className="space-y-3">
            {mockRecommendations.lifestyleInterventions.map((intervention, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg">
                <input type="checkbox" className="rounded" />
                <span className="text-sm text-gray-900 flex-1">{intervention}</span>
                <span className="text-xs text-gray-500">ℹ️ Info</span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" className="w-full">
              📚 Patient Education Materials
            </Button>
          </div>
        </div>
      </div>

      {/* Evidence-Based Guidelines */}
      <div className="border border-zinc-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Evidence-Based Guidelines</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-sm mb-2">AAN Guidelines</h3>
            <p className="text-xs text-gray-600 mb-3">
              American Academy of Neurology practice guidelines for mild cognitive impairment.
            </p>
            <Button variant="outline" size="sm" className="w-full">
              📖 View Guidelines
            </Button>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-sm mb-2">NIA-AA Framework</h3>
            <p className="text-xs text-gray-600 mb-3">
              Research framework for biological definition of Alzheimer's disease.
            </p>
            <Button variant="outline" size="sm" className="w-full">
              📖 View Framework
            </Button>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-sm mb-2">Clinical Trials</h3>
            <p className="text-xs text-gray-600 mb-3">
              Current trials for cognitive decline prevention and treatment.
            </p>
            <Button variant="outline" size="sm" className="w-full">
              🔬 Browse Trials
            </Button>
          </div>
        </div>
      </div>

      {/* Disclaimers */}
      <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-yellow-800 mb-2">⚠️ Important Disclaimers</h3>
        <ul className="text-xs text-yellow-700 space-y-1">
          <li>• These recommendations are for clinical decision support only</li>
          <li>• Not for diagnostic use without physician oversight</li>
          <li>• Results require clinical correlation and medical interpretation</li>
          <li>• Individual patient factors must be considered in treatment planning</li>
        </ul>
      </div>
    </div>
  );
}
