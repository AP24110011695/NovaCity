import { memo, useMemo } from 'react'

import DroneTraffic from './DroneTraffic'
import { HolographicBillboards } from './HolographicBillboards'
import { BuildingWindows } from './BuildingWindows'
import { AtmosphericFog } from './AtmosphericFog'
import { FloatingParticles } from './FloatingParticles'
import Searchlights from './Searchlights'
import EnvironmentBreathing from './EnvironmentBreathing'

const LivingCity = memo(function LivingCity({
  buildingData = [],
  fogGroundY = 0,
  fogRadius = 220,
  fogDensity = 0.18,
  particleAlpha = 0.22,
}) {
  const buildingPositions = useMemo(
    () =>
      buildingData.map((building) => ({
        x: building.x,
        y: building.y + building.h * 0.5,
        z: building.z,
      })),
    [buildingData]
  )

  return (
    <group name="living-city">
      {/* Environmental lighting */}
      <EnvironmentBreathing />

      {/* Atmosphere */}
      <AtmosphericFog
        radius={fogRadius}
        groundY={fogGroundY}
        density={fogDensity}
      />

      {/* Floating particles */}
      <FloatingParticles
        maxAlpha={particleAlpha}
        size={1.8}
      />

      {/* Animated windows */}
      <BuildingWindows
        buildingData={buildingData}
      />

      {/* Holographic advertisements */}
      <HolographicBillboards
        buildingPositions={buildingPositions}
      />

      {/* Air traffic */}
      <DroneTraffic />

      {/* City searchlights */}
      <Searchlights />
    </group>
  )
})

export default LivingCity