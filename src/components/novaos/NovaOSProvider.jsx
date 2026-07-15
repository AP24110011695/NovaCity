import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useBuildingSelection } from '../city/BuildingManager';
import { useDistrictSelection } from '../city/SelectionManager';
import { createSearchIndex, filterSearchIndex } from '../../data/novaOSSearch';

const NovaOSContext = createContext(null);

export const useNovaOS = () => {
  const context = useContext(NovaOSContext);
  if (!context) throw new Error('useNovaOS must be used within a NovaOSProvider');
  return context;
};

export const NovaOSProvider = ({ children }) => {
  const { activeBuildingId, selectBuilding, clearBuildingSelection } = useBuildingSelection();
  const { activeDistrictId, selectDistrict, clearSelection } = useDistrictSelection();
  const [isCommandOpen, setCommandOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeSection, setActiveSection] = useState(null);
  const searchIndex = useMemo(() => createSearchIndex(), []);
  const results = useMemo(() => filterSearchIndex(searchIndex, query), [query, searchIndex]);

  const closeCommandPalette = useCallback(() => { setCommandOpen(false); setQuery(''); }, []);
  const openCommandPalette = useCallback(() => setCommandOpen(true), []);
  const returnToCity = useCallback(() => { closeCommandPalette(); setActiveSection(null); clearBuildingSelection(); clearSelection(); }, [clearBuildingSelection, clearSelection, closeCommandPalette]);
  const openDestination = useCallback((item) => {
    if (item.action === 'return') { returnToCity(); return; }
    if (item.action === 'download') { window.open(item.url, '_blank', 'noopener'); closeCommandPalette(); return; }
    const { buildingId, districtId, section } = item.destination;
    setActiveSection(section);
    selectDistrict(districtId);
    selectBuilding(buildingId);
    closeCommandPalette();
  }, [closeCommandPalette, returnToCity, selectBuilding, selectDistrict]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openCommandPalette(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openCommandPalette]);

  useEffect(() => {
    if (!activeBuildingId || !activeSection) return undefined;
    const timer = window.setTimeout(() => document.getElementById(`holo-tab-${activeSection}`)?.click(), 90);
    return () => window.clearTimeout(timer);
  }, [activeBuildingId, activeSection]);

  const quickActions = useMemo(() => [
    { id: 'open-projects', icon: '◇', title: 'Open Projects', subtitle: 'Innovation Tower', category: 'Quick Action', destination: { buildingId: 'landmark-innovation', districtId: 'district-commercial', section: 'projects' } },
    { id: 'open-skills', icon: '◌', title: 'Open Skills', subtitle: 'Research Nexus', category: 'Quick Action', destination: { buildingId: 'landmark-research', districtId: 'district-research', section: 'skills' } },
    { id: 'download-resume', icon: '≡', title: 'Download Resume', subtitle: 'Open recruiter dossier', category: 'Quick Action', action: 'download', url: '/resume.html' },
    { id: 'contact', icon: '@', title: 'Contact', subtitle: 'Corporate Hub communication console', category: 'Quick Action', destination: { buildingId: 'landmark-corporate', districtId: 'district-industrial', section: 'contact' } },
    { id: 'return-city', icon: '←', title: 'Return to City', subtitle: 'Clear active selections', category: 'Quick Action', action: 'return' },
  ], []);

  const value = useMemo(() => ({ isCommandOpen, openCommandPalette, closeCommandPalette, query, setQuery, results, quickActions, openDestination, activeBuildingId, activeDistrictId, activeSection, returnToCity }), [activeBuildingId, activeDistrictId, activeSection, closeCommandPalette, isCommandOpen, openCommandPalette, openDestination, query, quickActions, results, returnToCity]);
  return <NovaOSContext.Provider value={value}>{children}</NovaOSContext.Provider>;
};
