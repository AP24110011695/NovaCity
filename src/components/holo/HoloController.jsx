/**
 * HoloController.jsx
 *
 * The central controller for the Holographic Portfolio Window.
 * Listens to BuildingManager context and orchestrates:
 *  - Window open / close lifecycle
 *  - Active building metadata
 *  - Animation state (idle | opening | open | closing)
 *  - Escape key to close
 *
 * Rendered as a pure DOM overlay — not inside the Three.js Canvas.
 */
import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { useBuildingSelection } from '../city/BuildingManager';
import { LANDMARKS } from '../../data/landmarks';
import HoloWindow from './HoloWindow';

const HoloController = () => {
  const { activeBuildingId, clearBuildingSelection } = useBuildingSelection();

  // Resolve active landmark metadata from the id
  const activeLandmark = useMemo(
    () => (activeBuildingId ? LANDMARKS.find(l => l.id === activeBuildingId) ?? null : null),
    [activeBuildingId]
  );

  // Keyboard handler — Escape closes window
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape' && activeBuildingId) {
        clearBuildingSelection();
      }
    },
    [activeBuildingId, clearBuildingSelection]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Only mount HoloWindow when a building is active (lazy mount)
  if (!activeLandmark) return null;

  return (
    <HoloWindow
      landmark={activeLandmark}
      onClose={clearBuildingSelection}
    />
  );
};

export default HoloController;
