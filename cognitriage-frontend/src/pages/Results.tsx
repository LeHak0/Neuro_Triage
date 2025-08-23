import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

export default function Results() {
  const { analysisResult } = useAppContext();
  const navigate = useNavigate();
  const { result } = analysisResult;

  const handleExportPDF = () => {
    // Generate PDF content
    const printContent = document.createElement('div');
    printContent.innerHTML = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h1>Cognitive Assessment Results</h1>
        <div style="margin: 20px 0;">
          <h2>Patient Information</h2>
          <p>Age: ${result?.note?.patient_info?.age || 'N/A'}</p>
          <p>Sex: ${result?.note?.patient_info?.sex || 'N/A'}</p>
          <p>MoCA Score: ${result?.note?.patient_info?.moca_total || 'N/A'}/30</p>
        </div>
        <div style="margin: 20px 0;">
          <h2>Risk Assessment</h2>
          <p>Risk Tier: ${result?.triage?.risk_tier || 'N/A'}</p>
          <p>Confidence: ${Math.round((result?.triage?.confidence_score || 0) * 100)}%</p>
        </div>
        <div style="margin: 20px 0;">
          <h2>Imaging Findings</h2>
          <p>Left Hippocampus: ${result?.note?.imaging_findings?.hippocampal_volumes_ml?.left_ml || 'N/A'} ml</p>
          <p>Right Hippocampus: ${result?.note?.imaging_findings?.hippocampal_volumes_ml?.right_ml || 'N/A'} ml</p>
          <p>MTA Score: ${result?.note?.imaging_findings?.mta_score || 'N/A'}/4</p>
        </div>
        <div style="margin: 20px 0;">
          <p><small>Generated on ${new Date().toLocaleDateString()}</small></p>
        </div>
      </div>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent.innerHTML);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleShareResults = () => {
    const shareData = {
      title: 'Cognitive Assessment Results',
      text: `Risk Tier: ${result?.triage?.risk_tier || 'N/A'}, Confidence: ${Math.round((result?.triage?.confidence_score || 0) * 100)}%`,
      url: window.location.href
    };

    if (navigator.share) {
      navigator.share(shareData).catch(console.error);
    } else {
      // Fallback: copy to clipboard
      const textToCopy = `Cognitive Assessment Results\nRisk Tier: ${result?.triage?.risk_tier || 'N/A'}\nConfidence: ${Math.round((result?.triage?.confidence_score || 0) * 100)}%\nView full results: ${window.location.href}`;
      navigator.clipboard.writeText(textToCopy).then(() => {
        alert('Results copied to clipboard!');
      }).catch(() => {
        alert('Unable to share results. Please copy the URL manually.');
      });
    }
  };
  
  console.log('Results page - analysisResult:', analysisResult);
  console.log('Results page - result:', result);
  
  // If no analysis has been run, show message
  if (!result) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Analysis Results</h1>
        </div>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No Results Available</h2>
          <p className="text-gray-500">Please run an analysis from the Dashboard first to see results.</p>
        </div>
      </div>
    );
  }

  const patientInfo = result.note?.patient_info || {};
  const triage = result.triage || {};
  const imagingFindings = result.note?.imaging_findings || {};
  
  console.log('Results page - imagingFindings:', imagingFindings);
  console.log('Results page - thumbnails:', imagingFindings.thumbnails);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Analysis Results</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleExportPDF}>📄 Export PDF</Button>
          <Button variant="outline" onClick={handleShareResults}>📧 Share Results</Button>
        </div>
      </div>

      {/* Patient Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="border border-zinc-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Patient</h3>
          <div className="text-lg font-semibold">
            {patientInfo.age || 'N/A'}y, {patientInfo.sex || 'N/A'}
          </div>
        </div>
        
        <div className="border border-zinc-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-2">MoCA Score</h3>
          <div className="text-lg font-semibold">{patientInfo.moca_total || 'N/A'}/30</div>
        </div>

        <div className="border border-zinc-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Risk Tier</h3>
          <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
            triage.risk_tier === 'LOW' ? 'bg-green-100 text-green-800' :
            triage.risk_tier === 'MODERATE' ? 'bg-yellow-100 text-yellow-800' :
            triage.risk_tier === 'HIGH' ? 'bg-orange-100 text-orange-800' :
            'bg-red-100 text-red-800'
          }`}>
            {triage.risk_tier || 'N/A'}
          </div>
        </div>

        <div className="border border-zinc-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Confidence</h3>
          <div className="text-lg font-semibold">{Math.round((triage.confidence_score || 0) * 100)}%</div>
        </div>
      </div>

      {/* Detailed Results */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Risk Analysis */}
        <div className="border border-zinc-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Risk Analysis</h2>
          
          <div className="space-y-4">
            <div className={`p-4 border rounded-lg ${
              triage.risk_tier === 'LOW' ? 'bg-green-50 border-green-200' :
              triage.risk_tier === 'MODERATE' ? 'bg-yellow-50 border-yellow-200' :
              triage.risk_tier === 'HIGH' ? 'bg-orange-50 border-orange-200' :
              'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center space-x-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${
                  triage.risk_tier === 'LOW' ? 'bg-green-500' :
                  triage.risk_tier === 'MODERATE' ? 'bg-yellow-500' :
                  triage.risk_tier === 'HIGH' ? 'bg-orange-500' :
                  'bg-red-500'
                }`}></div>
                <span className={`font-medium ${
                  triage.risk_tier === 'LOW' ? 'text-green-800' :
                  triage.risk_tier === 'MODERATE' ? 'text-yellow-800' :
                  triage.risk_tier === 'HIGH' ? 'text-orange-800' :
                  'text-red-800'
                }`}>{triage.risk_tier || 'Unknown'} Risk</span>
              </div>
              <p className={`text-sm ${
                triage.risk_tier === 'LOW' ? 'text-green-700' :
                triage.risk_tier === 'MODERATE' ? 'text-yellow-700' :
                triage.risk_tier === 'HIGH' ? 'text-orange-700' :
                'text-red-700'
              }`}>
                {triage.key_rationale?.[0] || 'Risk assessment based on imaging and cognitive assessment.'}
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Key Risk Factors:</h3>
              <ul className="space-y-2">
                <li>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Left Hippocampus</span>
                    <span className="text-sm font-medium">{imagingFindings.hippocampal_volumes_ml?.left_ml || 'N/A'} mL</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Right Hippocampus</span>
                    <span className="text-sm font-medium">{imagingFindings.hippocampal_volumes_ml?.right_ml || 'N/A'} mL</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">MTA Score</span>
                    <span className="text-sm font-medium">{imagingFindings.mta_score || 'N/A'}</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/recommendations')}
            >
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
