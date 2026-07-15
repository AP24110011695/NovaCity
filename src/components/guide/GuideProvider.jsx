import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useBuildingSelection } from '../city/BuildingManager'
import { useDistrictSelection } from '../city/SelectionManager'
import { useNovaOS } from '../novaos/NovaOSProvider'
import { DISTRICTS } from '../../data/districts'
import { LANDMARKS } from '../../data/landmarks'

const GuideContext = createContext(null)

const DESTINATIONS = Object.freeze({
  projects: { buildingId: 'landmark-innovation', districtId: 'district-commercial', section: 'projects' },
  skills: { buildingId: 'landmark-research', districtId: 'district-research', section: 'skills' },
  resume: { buildingId: 'landmark-corporate', districtId: 'district-industrial', section: 'resume' },
  education: { buildingId: 'landmark-academy', districtId: 'district-residential', section: 'education' },
})

const makeAction = (id, label, destination) => ({ id, label, destination })

function getGuideState({ activeBuildingId, activeDistrictId, activeSection, isCommandOpen }) {
  const district = DISTRICTS.find((item) => item.id === activeDistrictId) ?? null
  const building = LANDMARKS.find((item) => item.id === activeBuildingId) ?? null

  if (isCommandOpen) return {
    dialogue: 'Nova OS is active. Select a command, or I can route you to a landmark.',
    suggestions: [makeAction('projects', 'Explore Projects', DESTINATIONS.projects), makeAction('return', 'Return to City', null)],
  }
  if (building) return {
    dialogue: `${building.displayName} is connected. The ${activeSection ?? building.futureContentType} archive is ready to explore.`,
    suggestions: [makeAction('resume', 'View Résumé', DESTINATIONS.resume), makeAction('return', 'Return to City', null)],
  }
  if (district) return {
    dialogue: `${district.displayName} is in view. Its landmark carries a curated portfolio signal.`,
    suggestions: [makeAction('projects', 'Explore Projects', DESTINATIONS.projects), makeAction('skills', 'Open Skills', DESTINATIONS.skills)],
  }
  return {
    dialogue: 'Welcome to Nova City. I can guide you through the portfolio districts.',
    suggestions: [makeAction('projects', 'Explore Projects', DESTINATIONS.projects), makeAction('skills', 'Open Skills', DESTINATIONS.skills), makeAction('education', 'Learn About Education', DESTINATIONS.education)],
  }
}

export const useGuide = () => {
  const context = useContext(GuideContext)
  if (!context) throw new Error('useGuide must be used within a GuideProvider')
  return context
}

export function GuideProvider({ children }) {
  const novaOS = useNovaOS()
  const { activeBuildingId } = useBuildingSelection()
  const { activeDistrictId } = useDistrictSelection()
  const [isVisible, setVisible] = useState(false)
  const [idleHint, setIdleHint] = useState(null)
  const [completionMessage, setCompletionMessage] = useState(null)
  const completionTimerRef = useRef(null)
  const guideState = useMemo(() => getGuideState({ activeBuildingId, activeDistrictId, activeSection: novaOS.activeSection, isCommandOpen: novaOS.isCommandOpen }), [activeBuildingId, activeDistrictId, novaOS.activeSection, novaOS.isCommandOpen])

  useEffect(() => {
    const timer = window.setTimeout(() => setIdleHint('Tip: each landmark opens a focused portfolio archive.'), 16000)
    return () => window.clearTimeout(timer)
  }, [activeBuildingId, activeDistrictId, novaOS.activeSection])

  useEffect(() => () => window.clearTimeout(completionTimerRef.current), [])

  const selectSuggestion = useCallback((suggestion) => {
    setIdleHint(null)
    setCompletionMessage(`${suggestion.label} route confirmed.`)
    window.clearTimeout(completionTimerRef.current)
    completionTimerRef.current = window.setTimeout(() => setCompletionMessage(null), 2400)
    if (suggestion.id === 'return') novaOS.returnToCity()
    else novaOS.openDestination({ id: `guide-${suggestion.id}`, title: suggestion.label, destination: suggestion.destination })
  }, [novaOS])

  const value = useMemo(() => ({
    isVisible, setVisible, dialogue: completionMessage ?? idleHint ?? guideState.dialogue, suggestions: guideState.suggestions,
    context: { district: activeDistrictId, building: activeBuildingId, section: novaOS.activeSection, isNovaOSOpen: novaOS.isCommandOpen },
    selectSuggestion,
  }), [activeBuildingId, activeDistrictId, completionMessage, guideState, idleHint, isVisible, novaOS.activeSection, novaOS.isCommandOpen, selectSuggestion])

  return <GuideContext.Provider value={value}>{children}</GuideContext.Provider>
}

export default GuideProvider
