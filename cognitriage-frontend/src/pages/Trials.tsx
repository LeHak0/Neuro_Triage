import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import LoadingSpinner from '../components/LoadingSpinner';

interface Trial {
  nct_id: string;
  title: string;
  summary: string;
  status: string;
  locations: string[];
  url: string;
  match_reason: string;
}

export default function Trials() {
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const searchTrials = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/trials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          risk_tier: 'MODERATE',
          imaging_findings: {},
          moca_score: 24,
          age: 70,
          sex: 'F'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setTrials(data.trials || []);
      }
    } catch (error) {
      console.error('Error fetching trials:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Clinical Trials & Research</h1>
        <Button onClick={searchTrials} disabled={loading}>
          {loading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
          Search Trials
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="border border-zinc-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Search Filters</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Condition</label>
                <select className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm">
                  <option>Mild Cognitive Impairment</option>
                  <option>Alzheimer's Disease</option>
                  <option>Dementia</option>
                  <option>Memory Disorders</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Study Phase</label>
                <select className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm">
                  <option>All Phases</option>
                  <option>Phase I</option>
                  <option>Phase II</option>
                  <option>Phase III</option>
                  <option>Phase IV</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Location</label>
                <input
                  type="text"
                  placeholder="City, State, or Country"
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Age Range</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <input
                    type="number"
                    placeholder="Min"
                    className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border border-zinc-200 rounded-lg p-4 mt-4">
            <h3 className="text-lg font-semibold mb-3">PubMed Research</h3>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                📚 Latest Publications
              </Button>
              <Button variant="outline" className="w-full justify-start">
                🔬 Clinical Guidelines
              </Button>
              <Button variant="outline" className="w-full justify-start">
                📊 Meta-Analyses
              </Button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
              <span className="ml-3 text-gray-600">Searching clinical trials...</span>
            </div>
          ) : trials.length > 0 ? (
            <div className="space-y-4">
              {trials.map((trial, i) => (
                <div key={i} className="border border-zinc-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{trial.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">NCT ID: {trial.nct_id}</p>
                    </div>
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      {trial.status}
                    </span>
                  </div>

                  <p className="text-gray-700 mb-4">{trial.summary}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Locations</h4>
                      <p className="text-sm text-gray-600">
                        {Array.isArray(trial.locations) ? trial.locations.join(', ') : 'Multiple locations available'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Match Reason</h4>
                      <p className="text-sm text-gray-600">{trial.match_reason}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        📋 Save Trial
                      </Button>
                      <Button variant="outline" size="sm">
                        📧 Contact Site
                      </Button>
                    </div>
                    <a
                      href={trial.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View on ClinicalTrials.gov →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-zinc-200 rounded-lg p-8 text-center">
              <div className="text-4xl mb-4">🔬</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Clinical Trials</h3>
              <p className="text-sm text-gray-600 mb-4">
                Search for relevant clinical trials based on patient risk profile and imaging findings.
              </p>
              <Button onClick={searchTrials}>
                Start Trial Search
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
