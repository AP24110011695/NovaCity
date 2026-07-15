import { memo, useMemo } from 'react'

import { DroneController } from './DroneController'
import EnvironmentBreathing from './EnvironmentBreathing'
import { DistrictInteraction } from './DistrictInteraction'
import { DISTRICTS } from '../../data/districts'

const LivingCity = memo(function LivingCity() {
  return (
    <group name="living-city">
      {/* Environmental lighting pulses */}
      <EnvironmentBreathing />

      {/* Surrounding Skyline: Procedural districts with interaction */}
      {DISTRICTS.map((district) => (
        <DistrictInteraction key={district.id} district={district} />
      ))}

      {/* Airborne traffic: Taxis, Cargo, Police */}
      <DroneController numPaths={6} vehiclesPerPath={8} />
    </group>
  )
})

export default LivingCity