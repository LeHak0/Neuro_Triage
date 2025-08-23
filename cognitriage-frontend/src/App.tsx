import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import BrainView from './pages/BrainView';
import Results from './pages/Results';
import Trials from './pages/Trials';
import Recommendations from './pages/Recommendations';
import "./index.css"


export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-gray-900">AI-Powered Cognitive Decline Screening</h1>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">Status: Ready</div>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </header>
          
          <main className="flex-1 p-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/brain" element={<BrainView />} />
              <Route path="/results" element={<Results />} />
              <Route path="/trials" element={<Trials />} />
              <Route path="/recommendations" element={<Recommendations />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  )
}
