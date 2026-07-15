import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { DISTRICTS } from '../../data/districts';

const SelectionContext = createContext();

export const useDistrictSelection = () => {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error('useDistrictSelection must be used within a SelectionProvider');
  }
  return context;
};

export const SelectionProvider = ({ children }) => {
  const [activeDistrictId, setActiveDistrictId] = useState(null);
  const [hoveredDistrictId, setHoveredDistrictId] = useState(null);

  const selectDistrict = useCallback((id) => {
    setActiveDistrictId(id);
  }, []);

  const clearSelection = useCallback(() => {
    setActiveDistrictId(null);
  }, []);

  const setHovered = useCallback((id) => {
    setHoveredDistrictId(id);
  }, []);

  // Handle global Escape key to clear selection
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        clearSelection();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearSelection]);

  const value = {
    activeDistrictId,
    hoveredDistrictId,
    selectDistrict,
    clearSelection,
    setHovered,
  };

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
};
