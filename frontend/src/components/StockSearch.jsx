import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import '../styles/StockSearch.css';

const StockSearch = ({ onStockSelect, maxSelections = 5 }) => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedSymbols, setSelectedSymbols] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Debounced search
  const searchSymbols = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 1) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await api.searchSymbols(searchQuery);
      setSearchResults(response.data || []);
      setShowDropdown(true);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      searchSymbols(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchSymbols]);

  const handleSelectSymbol = (symbol, name) => {
    if (selectedSymbols.some(s => s.symbol === symbol)) {
      return; // Already selected
    }

    if (selectedSymbols.length >= maxSelections) {
      alert(`Maximum ${maxSelections} stocks allowed`);
      return;
    }

    const newSymbol = { symbol, name };
    const updatedSymbols = [...selectedSymbols, newSymbol];
    setSelectedSymbols(updatedSymbols);
    onStockSelect(updatedSymbols);
    
    setQuery('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  const handleRemoveSymbol = (symbol) => {
    const updatedSymbols = selectedSymbols.filter(s => s.symbol !== symbol);
    setSelectedSymbols(updatedSymbols);
    onStockSelect(updatedSymbols);
  };

  return (
    <div className="stock-search">
      <div className="search-input-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search stocks (e.g., AAPL, Tesla, Microsoft)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setShowDropdown(true)}
        />
        {isSearching && <div className="search-spinner">Searching...</div>}
      </div>

      {showDropdown && searchResults.length > 0 && (
        <div className="search-dropdown">
          {searchResults.map((result) => (
            <div
              key={result.symbol}
              className="search-result-item"
              onClick={() => handleSelectSymbol(result.symbol, result.name)}
            >
              <div className="result-symbol">{result.symbol}</div>
              <div className="result-name">{result.name}</div>
              <div className="result-exchange">{result.exchange}</div>
            </div>
          ))}
        </div>
      )}

      {selectedSymbols.length > 0 && (
        <div className="selected-symbols">
          {selectedSymbols.map((stock) => (
            <div key={stock.symbol} className="selected-symbol-chip">
              <span className="chip-symbol">{stock.symbol}</span>
              <span className="chip-name">{stock.name}</span>
              <button
                className="chip-remove"
                onClick={() => handleRemoveSymbol(stock.symbol)}
                aria-label="Remove"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StockSearch;

