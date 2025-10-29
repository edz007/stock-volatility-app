import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import AnalysisPage from './pages/AnalysisPage';
import ModelsGuide from './pages/ModelsGuide';
import './styles/App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Header />
        <Routes>
          <Route path="/" element={<AnalysisPage />} />
          <Route path="/learn" element={<ModelsGuide />} />
        </Routes>
      </div>
    </Router>
  );
}

function Header() {
  const location = useLocation();
  
  return (
    <header className="app-header">
      <h1>📊 Stock Volatility Analysis</h1>
      <p>Analyze stock volatility using GARCH models</p>
      <nav className="app-nav">
        <Link 
          to="/" 
          className={location.pathname === '/' ? 'active' : ''}
        >
          Analyze
        </Link>
        <Link 
          to="/learn" 
          className={location.pathname === '/learn' ? 'active' : ''}
        >
          Learn
        </Link>
      </nav>
    </header>
  );
}

export default App;
