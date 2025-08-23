import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  className?: string;
}

const navigationItems = [
  {
    name: 'Main',
    href: '/',
    icon: '🏠',
    description: 'Upload & Analysis'
  },
  {
    name: 'Brain',
    href: '/brain',
    icon: '🧠',
    description: 'Brain Visualization'
  },
  {
    name: 'Results',
    href: '/results',
    icon: '📊',
    description: 'Analysis Results'
  },
  {
    name: 'Trials & Research',
    href: '/trials',
    icon: '🔬',
    description: 'Clinical Trials & PubMed'
  },
  {
    name: 'Recommendations',
    href: '/recommendations',
    icon: '💊',
    description: 'Treatment Plans'
  }
];

export default function Sidebar({ className = '' }: SidebarProps) {
  const location = useLocation();

  return (
    <div className={`flex flex-col w-64 bg-white border-r border-gray-200 ${className}`}>
      {/* Logo/Header */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="text-2xl">🧠</div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">CogniTriage</h1>
            <p className="text-xs text-gray-500">AI-Powered Screening</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.href;
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="text-lg mr-3" aria-hidden="true">
                {item.icon}
              </span>
              <div className="flex-1">
                <div className="font-medium">{item.name}</div>
                <div className={`text-xs ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                  {item.description}
                </div>
              </div>
              {isActive && (
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Status/Info Panel */}
      <div className="px-4 py-4 border-t border-gray-200">
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs font-medium text-gray-700">System Status</span>
          </div>
          <div className="text-xs text-gray-600">
            Backend: Connected<br />
            Processing: Ready
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          <div>Version 1.0.0</div>
          <div className="mt-1">
            <a href="#" className="hover:text-gray-700">Help</a> • 
            <a href="#" className="hover:text-gray-700 ml-1">Support</a>
          </div>
        </div>
      </div>
    </div>
  );
}
