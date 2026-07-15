import { memo, useMemo } from 'react'

import { DroneController } from './DroneController'
import { CityDistrict } from './CityDistrict'
import EnvironmentBreathing from './EnvironmentBreathing'

const LivingCity = memo(function LivingCity() {
  return (
    <group name="living-city">
      {/* Environmental lighting pulses */}
      <EnvironmentBreathing />

      {/* Surrounding Skyline: 4 distinct procedural districts */}
      <CityDistrict seed={101} center={{x: 40, z: -40}} radius={80} count={120} />
      <CityDistrict seed={202} center={{x: -50, z: -30}} radius={70} count={140} />
      <CityDistrict seed={303} center={{x: 10, z: -100}} radius={90} count={160} />
      <CityDistrict seed={404} center={{x: -20, z: 20}} radius={50} count={80} />

      {/* Airborne traffic: Taxis, Cargo, Police */}
      <DroneController numPaths={6} vehiclesPerPath={8} />
    </group>
  )
})

export default LivingCity