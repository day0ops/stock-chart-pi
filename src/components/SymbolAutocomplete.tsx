import { useState, useEffect, useRef, useCallback } from 'react';
import { searchSymbols, validateSymbol, getPopularSymbols } from '../services/symbolSearch';
import type { SymbolInfo } from '../services/symbolSearch';
import type { AssetType } from '../types';

interface SymbolAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (symbol: SymbolInfo) => void;
  type: AssetType;
  placeholder?: string;
}

export function SymbolAutocomplete({
  value,
  onChange,
  onSelect,
  type,
  placeholder = 'Search symbol...',
}: SymbolAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<SymbolInfo[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [validationState, setValidationState] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);

  // Fetch suggestions when input changes
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length === 0) {
      setSuggestions(getPopularSymbols(type));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const results = await searchSymbols(query, type);
      setSuggestions(results);
    } catch {
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [type]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      fetchSuggestions(value);
    }, 150);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, fetchSuggestions]);

  // Validate symbol when user stops typing
  useEffect(() => {
    if (value.length < 2) {
      setValidationState('idle');
      return;
    }

    const validateTimer = setTimeout(async () => {
      setValidationState('validating');
      const result = await validateSymbol(value, type);
      setValidationState(result.valid ? 'valid' : 'invalid');
    }, 500);

    return () => clearTimeout(validateTimer);
  }, [value, type]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        fetchSuggestions(value);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelect = (symbol: SymbolInfo) => {
    onChange(symbol.symbol);
    onSelect(symbol);
    setIsOpen(false);
    setSelectedIndex(-1);
    setValidationState('valid');
  };

  const handleFocus = () => {
    setIsOpen(true);
    if (suggestions.length === 0) {
      fetchSuggestions(value);
    }
  };

  const getValidationIcon = () => {
    switch (validationState) {
      case 'validating':
        return <span className="validation-icon validating">⟳</span>;
      case 'valid':
        return <span className="validation-icon valid">✓</span>;
      case 'invalid':
        return <span className="validation-icon invalid">✗</span>;
      default:
        return null;
    }
  };

  return (
    <div className="symbol-autocomplete" ref={containerRef}>
      <div className={`autocomplete-input-wrapper ${validationState}`}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="autocomplete-input"
          autoComplete="off"
          spellCheck={false}
        />
        {getValidationIcon()}
      </div>

      {isOpen && (
        <div className="autocomplete-dropdown">
          {isLoading ? (
            <div className="autocomplete-loading">
              <span className="loading-spinner small" />
              <span>Searching...</span>
            </div>
          ) : suggestions.length > 0 ? (
            <ul className="autocomplete-list">
              {suggestions.map((symbol, index) => (
                <li
                  key={symbol.symbol}
                  className={`autocomplete-item ${index === selectedIndex ? 'selected' : ''}`}
                  onClick={() => handleSelect(symbol)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <span className="symbol-code">{symbol.symbol}</span>
                  <span className="symbol-name">{symbol.name}</span>
                  {symbol.exchange && (
                    <span className="symbol-exchange">{symbol.exchange}</span>
                  )}
                </li>
              ))}
            </ul>
          ) : value.length > 0 ? (
            <div className="autocomplete-empty">
              No symbols found for "{value}"
            </div>
          ) : (
            <div className="autocomplete-hint">
              Type to search {type === 'crypto' ? 'crypto pairs' : 'stocks'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
