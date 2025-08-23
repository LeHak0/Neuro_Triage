import { Button } from "@/components/ui/button";
import { useAppContext } from '../context/AppContext';

export default function Recommendations() {
  const { analysisResult } = useAppContext();
  const { treatment_recommendations, result } = analysisResult;
  
  // If no analysis has been run, show message
  if (!result || !treatment_recommendations) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Treatment Recommendations</h1>
        </div>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔬</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No Analysis Available</h2>
          <p className="text-gray-500">Please run an analysis from the Dashboard first to see treatment recommendations.</p>
        </div>
      </div>
    );
  }

  const riskTier = result.triage?.risk_tier || 'UNKNOWN';

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
                riskTier === 'LOW' ? 'bg-green-100 text-green-800' :
                riskTier === 'MODERATE' ? 'bg-yellow-100 text-yellow-800' :
                riskTier === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                'bg-red-100 text-red-800'
              }`}>
                {riskTier}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Priority Score</span>
              <span className="text-sm font-medium">
                {treatment_recommendations.priority_score ? Math.round(treatment_recommendations.priority_score * 100) : 'N/A'}%
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Based on imaging findings and cognitive assessment, the following recommendations are prioritized for optimal patient care.
            </div>
          </div>
        </div>

        {/* Medical Management */}
        <div className="border border-zinc-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Medical Management</h2>
          <div className="space-y-3">
            {treatment_recommendations.medical_management?.map((item: any, i: number) => (
              <div key={i} className="flex items-start space-x-3">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  item.priority === 'high' ? 'bg-red-600' :
                  item.priority === 'moderate' ? 'bg-orange-600' : 'bg-blue-600'
                }`}></div>
                <div className="flex-1">
                  <span className="text-sm text-gray-700 block">{item.intervention}</span>
                  {item.rationale && (
                    <span className="text-xs text-gray-500">{item.rationale}</span>
                  )}
                </div>
              </div>
            )) || <div className="text-sm text-gray-500">No specific medical interventions recommended</div>}
          </div>
        </div>

        {/* Referrals */}
        <div className="border border-zinc-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Referrals</h2>
          <div className="space-y-3">
            {treatment_recommendations.referrals?.map((referral: any, i: number) => (
              <div key={i} className="flex items-start space-x-3">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  referral.priority === 'urgent' ? 'bg-red-600' :
                  referral.priority === 'high' ? 'bg-orange-600' : 'bg-blue-600'
                }`}></div>
                <div className="flex-1">
                  <span className="text-sm text-gray-700 block">{referral.specialist}</span>
                  {referral.rationale && (
                    <span className="text-xs text-gray-500">{referral.rationale}</span>
                  )}
                  {referral.timeframe && (
                    <span className="text-xs text-blue-600 block">Timeline: {referral.timeframe}</span>
                  )}
                </div>
              </div>
            )) || <div className="text-sm text-gray-500">No specialist referrals needed at this time</div>}
          </div>
        </div>
      </div>

      {/* Lifestyle Interventions */}
      <div className="border border-zinc-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Lifestyle Interventions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {treatment_recommendations.lifestyle_interventions?.map((item: any, i: number) => (
            <div key={i} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                item.priority === 'high' ? 'bg-green-700' : 'bg-green-600'
              }`}></div>
              <div className="flex-1">
                <span className="text-sm text-gray-700 block">{item.intervention}</span>
                {item.evidence_level && (
                  <span className="text-xs text-green-600">Evidence: Level {item.evidence_level}</span>
                )}
              </div>
            </div>
          )) || <div className="text-sm text-gray-500 col-span-full text-center py-4">No specific lifestyle interventions recommended</div>}
        </div>
      </div>

      {/* Monitoring Schedule */}
      {treatment_recommendations.monitoring_schedule?.length > 0 && (
        <div className="border border-zinc-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Monitoring Schedule</h2>
          <div className="space-y-3">
            {treatment_recommendations.monitoring_schedule.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-700">{item.assessment}</span>
                  <span className="text-xs text-gray-500 block">Priority: {item.priority}</span>
                </div>
                <span className="text-sm text-blue-600 font-medium">Every {item.frequency}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clinical Trials */}
      {treatment_recommendations.clinical_trials?.length > 0 && (
        <div className="border border-zinc-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Clinical Trial Opportunities</h2>
          <div className="space-y-3">
            {treatment_recommendations.clinical_trials.map((trial: any, i: number) => (
              <div key={i} className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
                <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <span className="text-sm text-gray-700 block">{trial.consideration}</span>
                  {trial.rationale && (
                    <span className="text-xs text-gray-500">{trial.rationale}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confidence Scores */}
      {treatment_recommendations.confidence_scores && (
        <div className="border border-zinc-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Recommendation Confidence</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(treatment_recommendations.confidence_scores).map(([category, score]: [string, any]) => (
              <div key={category} className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(score * 100)}%
                </div>
                <div className="text-xs text-gray-500 capitalize">
                  {category.replace('_', ' ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
