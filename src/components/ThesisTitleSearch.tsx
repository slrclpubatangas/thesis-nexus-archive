
import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ThesisTitleSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (title: string) => void;
  placeholder?: string;
  required?: boolean;
}

interface ThesisTitle {
  id: number;
  thesis_title: string;
  authors: string[];
  department: string;
  publication_year: number;
}

const ThesisTitleSearch: React.FC<ThesisTitleSearchProps> = ({
  value,
  onChange,
  onSelect,
  placeholder = "Type to search existing thesis titles...",
  required = false
}) => {
  const [suggestions, setSuggestions] = useState<ThesisTitle[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const searchTheses = async () => {
      if (!value || value.length < 2) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('thesis_data')
          .select('id, thesis_title, authors, department, publication_year')
          .ilike('thesis_title', `%${value}%`)
          .eq('is_deleted', false)
          .order('thesis_title')
          .limit(10);

        if (error) {
          console.error('Error searching theses:', error);
          setSuggestions([]);
        } else {
          setSuggestions(data || []);
          setIsOpen(true);
          setHighlightedIndex(-1);
        }
      } catch (error) {
        console.error('Error searching theses:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchTheses, 300);
    return () => clearTimeout(debounceTimer);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  const handleSelectSuggestion = (thesis: ThesisTitle) => {
    onChange(thesis.thesis_title);
    setIsOpen(false);
    setHighlightedIndex(-1);
    if (onSelect) {
      onSelect(thesis.thesis_title);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  return (
    <div ref={searchRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className="input-field pl-10"
          required={required}
        />
        {isLoading && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
          </div>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((thesis, index) => (
            <div
              key={thesis.id}
              className={`px-4 py-3 cursor-pointer transition-colors ${
                index === highlightedIndex
                  ? 'bg-red-50 border-l-4 border-red-500'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => handleSelectSuggestion(thesis)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <div className="font-medium text-gray-900 text-sm leading-tight">
                {thesis.thesis_title}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                <span className="font-medium">{thesis.department}</span>
                {thesis.authors && thesis.authors.length > 0 && (
                  <>
                    {' • '}
                    <span>{thesis.authors.join(', ')}</span>
                  </>
                )}
                {' • '}
                <span>{thesis.publication_year}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {isOpen && !isLoading && suggestions.length === 0 && value.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="px-4 py-3 text-gray-500 text-sm">
            No matching thesis titles found
          </div>
        </div>
      )}
    </div>
  );
};

export default ThesisTitleSearch;
