import { memo, useMemo } from 'react'

import { DroneTraffic } from './DroneTraffic'
import { HolographicBillboards } from './HolographicBillboards'
import { BuildingWindows } from './BuildingWindows'
import { AtmosphericFog } from './AtmosphericFog'
import { FloatingParticles } from './FloatingParticles'
import { Searchlights } from './Searchlights'
import { EnvironmentBreathing } from './EnvironmentBreathing'

const LivingCity = memo(function LivingCity({
  buildingData = [],
  fogGroundY = 0,
  fogRadius = 220,
  fogDensity = 0.18,
  particleAlpha = 0.22,
}) {
  const buildingPositions = useMemo(
    () =>
      buildingData.map((b) => ({
        x: b.x,
        y: b.y + b.h * 0.5,
        z: b.z,
      })),
    [buildingData]
  )

  return (
    <group name="living-city">

      <EnvironmentBreathing />

      <AtmosphericFog
        radius={fogRadius}
        groundY={fogGroundY}
        density={fogDensity}
      />

      <FloatingParticles
        maxAlpha={particleAlpha}
        size={1.8}
      />

      <BuildingWindows
        buildingData={buildingData}
      />

      <HolographicBillboards
        buildingPositions={buildingPositions}
      />

      <DroneTraffic />

      <Searchlights />

    </group>
  )
})

export default LivingCity 