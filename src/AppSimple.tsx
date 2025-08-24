import { useState } from 'react';
import VTKTest from './components/VTKTest';
import './App.css';

function AppSimple() {
  const [viewMode, setViewMode] = useState<'2D' | 'MPR' | '3D'>('3D');

  return (
    <div className="app">
      <header className="app-header">
        <h1>Medical Image Viewer - Simple Test</h1>
        <p>Testing VTK.js with React 18</p>
      </header>

      <main className="app-main">
        <div className="viewer-section">
          <div className="viewer-container" style={{ height: '600px' }}>
            {viewMode === '3D' && <VTKTest />}
            {viewMode === '2D' && <div>2D View (not implemented)</div>}
            {viewMode === 'MPR' && <div>MPR View (not implemented)</div>}
          </div>
          <div className="controls-sidebar">
            <div style={{ padding: '20px' }}>
              <h3>View Mode</h3>
              <button 
                onClick={() => setViewMode('2D')}
                style={{ 
                  margin: '5px', 
                  padding: '10px', 
                  backgroundColor: viewMode === '2D' ? '#007acc' : '#f0f0f0',
                  color: viewMode === '2D' ? 'white' : 'black',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                2D
              </button>
              <button 
                onClick={() => setViewMode('MPR')}
                style={{ 
                  margin: '5px', 
                  padding: '10px', 
                  backgroundColor: viewMode === 'MPR' ? '#007acc' : '#f0f0f0',
                  color: viewMode === 'MPR' ? 'white' : 'black',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                MPR
              </button>
              <button 
                onClick={() => setViewMode('3D')}
                style={{ 
                  margin: '5px', 
                  padding: '10px', 
                  backgroundColor: viewMode === '3D' ? '#007acc' : '#f0f0f0',
                  color: viewMode === '3D' ? 'white' : 'black',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                3D
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>React 18 + VTK.js Test</p>
      </footer>
    </div>
  );
}

export default AppSimple;
