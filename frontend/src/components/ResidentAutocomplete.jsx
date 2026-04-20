import React, { useState, useEffect, useRef } from 'react';

const ResidentAutocomplete = ({ 
  value, 
  onChange, 
  onSelect,
  onBlur,
  placeholder = "Type to search residents...",
  label = "Name",
  required = false,
  disabled = false
}) => {
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSelected, setHasSelected] = useState(false);
  const wrapperRef = useRef(null);
  const debounceTimeout = useRef(null);

  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search residents with debounce
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Reset "hasSelected" flag when user starts typing something new
    if (searchTerm !== value) {
      setHasSelected(false);
    }

    // 🔥 CHANGED TO 1 LETTER THRESHOLD 🔥
    if (searchTerm.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceTimeout.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`http://localhost:5000/api/residents/search?q=${encodeURIComponent(searchTerm)}`);
        const data = await response.json();
        setSuggestions(data);
        
        // 🔥 CHANGED TO 1 LETTER THRESHOLD 🔥
        if (searchTerm.length >= 1 && !hasSelected) {
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Error searching residents:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [searchTerm, value, hasSelected]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);
    setHasSelected(false); // User is typing new text, not a selected name
  };

  const handleSelectSuggestion = (resident) => {
    const fullName = resident.full_name;
    setSearchTerm(fullName);
    onChange(fullName);
    setShowSuggestions(false);
    setSuggestions([]);
    setHasSelected(true); // MARK THAT A NAME WAS SELECTED
    
    if (onSelect) {
      onSelect(resident);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <input
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onBlur={() => {
          setShowSuggestions(false);
          if (onBlur) {
            onBlur(searchTerm);
          }
        }}
        onFocus={() => {
          // 🔥 CHANGED TO 1 LETTER THRESHOLD 🔥
          if (!hasSelected && suggestions.length > 0 && searchTerm.length >= 1) {
            setShowSuggestions(true);
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      />

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute right-3 top-9 text-gray-400">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((resident) => (
            <div
              key={resident._id}
              onMouseDown={(event) => {
                event.preventDefault();
                handleSelectSuggestion(resident);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleSelectSuggestion(resident);
                }
              }}
              role="option"
              tabIndex={0}
              className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="font-medium text-gray-900">{resident.full_name}</div>
              {resident.address_text && (
                <div className="text-sm text-gray-500 mt-1">{resident.address_text}</div>
              )}
              <div className="text-xs text-gray-400 mt-1">{resident.resident_code}</div>
            </div>
          ))}
        </div>
      )}

      {/* No results message - only shows when actively typing, not after selection */}
      {/* 🔥 CHANGED TO 1 LETTER THRESHOLD 🔥 */}
      {!hasSelected && showSuggestions && !isLoading && searchTerm.length >= 1 && suggestions.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4">
          <p className="text-gray-500 text-sm">No residents found matching "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
};

export default ResidentAutocomplete;