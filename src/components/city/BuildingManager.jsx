import React, { createContext, useContext, useState, useCallback } from 'react';

const BuildingContext = createContext();

export const useBuildingSelection = () => {
  const context = useContext(BuildingContext);
  if (!context) {
    throw new Error('useBuildingSelection must be used within a BuildingProvider');
  }
  return context;
};

export const BuildingProvider = ({ children }) => {
  const [activeBuildingId, setActiveBuildingId] = useState(null);
  const [hoveredBuildingId, setHoveredBuildingId] = useState(null);

  const selectBuilding = useCallback((id) => {
    setActiveBuildingId(id);
  }, []);

  const clearBuildingSelection = useCallback(() => {
    setActiveBuildingId(null);
  }, []);

  const setHoveredBuilding = useCallback((id) => {
    setHoveredBuildingId(id);
  }, []);

  const value = {
    activeBuildingId,
    hoveredBuildingId,
    selectBuilding,
    clearBuildingSelection,
    setHoveredBuilding,
  };

  return (
    <BuildingContext.Provider value={value}>
      {children}
    </BuildingContext.Provider>
  );
};
