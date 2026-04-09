import React, { useState, useRef, useEffect, useCallback } from 'react';

function formatSuggestion(feature) {
  const p = feature.properties;
  const parts = [];
  if (p.name && p.name !== p.street) parts.push(p.name);
  if (p.street) parts.push(p.street);
  if (p.city) parts.push(p.city);
  if (p.state) parts.push(p.state);
  if (p.country) parts.push(p.country);
  return parts.filter(Boolean).join(', ');
}

export default function PlaceAutocomplete({
  value,
  onChange,
  placeholder = 'Enter address',
  className = '',
  icon = null,
  required = false,
  name,
  id,
  'aria-label': ariaLabel,
}) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  const fetchSuggestions = useCallback(async (q) => {
    if (!q || q.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=en`
      );
      if (!res.ok) throw new Error('network');
      const data = await res.json();
      const items = (data.features || [])
        .map((f) => ({ label: formatSuggestion(f), id: f.properties.osm_id }))
        .filter((f) => f.label.length > 0);
      setSuggestions(items);
      setOpen(items.length > 0);
      setActiveIndex(-1);
    } catch {
      setSuggestions([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    onChange(q);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(q), 300);
  };

  const selectSuggestion = (label) => {
    setQuery(label);
    onChange(label);
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIndex].label);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  const listId = `${id || name || 'place'}-listbox`;

  return (
    <div ref={containerRef} className="relative w-full">
      {icon && (
        <span className="absolute left-3 top-3 z-10 pointer-events-none text-[#1a365d]">
          {icon}
        </span>
      )}
      <input
        ref={inputRef}
        type="text"
        name={name}
        id={id}
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => query.length >= 3 && suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        className={className}
        required={required}
        autoComplete="off"
        aria-label={ariaLabel || placeholder}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined}
        role="combobox"
      />
      {loading && (
        <span className="absolute right-3 top-3 z-10">
          <svg className="animate-spin h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        </span>
      )}
      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
        >
          {suggestions.map((s, i) => (
            <li
              key={s.id ?? i}
              id={`${listId}-option-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={(e) => {
                e.preventDefault();
                selectSuggestion(s.label);
              }}
              onMouseEnter={() => setActiveIndex(i)}
              className={`px-4 py-2.5 cursor-pointer text-sm leading-snug border-b border-gray-100 last:border-0 transition-colors ${
                i === activeIndex
                  ? 'bg-[#1a365d] text-white'
                  : 'text-gray-700 hover:bg-blue-50'
              }`}
            >
              {s.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
