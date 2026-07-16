import React, { useRef, useEffect, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { useDistrictSelection } from './SelectionManager';
import { CityDistrict } from './CityDistrict';
import { DistrictLabel } from './DistrictLabel';
import { LandmarkBuilding } from './LandmarkBuilding';
import { LANDMARKS } from '../../data/landmarks';

export const DistrictInteraction = memo(({ district }) => {
  const { activeDistrictId, hoveredDistrictId, selectDistrict, setHovered } = useDistrictSelection();
  
  const groupRef = useRef();
  const outlineRef = useRef();
  
  const landmark = LANDMARKS.find(l => l.districtId === district.id);

  const isHovered = hoveredDistrictId === district.id;
  const isSelected = activeDistrictId === district.id;
  const isActive = isHovered || isSelected;

  useEffect(() => {
    if (isActive) {
      document.body.style.cursor = 'pointer';
    } else {
      document.body.style.cursor = 'auto';
    }
    return () => { document.body.style.cursor = 'auto'; };
  }, [isActive]);

  useEffect(() => {
    if (!groupRef.current) return;
    
    // Subtle scale animation on hover/select
    const scale = isActive ? 1.02 : 1.0;
    gsap.to(groupRef.current.scale, {
      x: scale,
      y: scale,
      z: scale,
      duration: 0.6,
      ease: 'power2.out'
    });
  }, [isActive]);

  useFrame(({ clock }) => {
    if (outlineRef.current && isActive) {
      outlineRef.current.rotation.y += 0.005;
      outlineRef.current.material.opacity = 0.5 + Math.sin(clock.getElapsedTime() * 2) * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={[district.center.x, 0, district.center.z]}>
      {/* Invisible hitbox for the entire district */}
      <mesh
        visible={false}
        position={[0, 25, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(district.id);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(null);
        }}
        onClick={(e) => {
          e.stopPropagation();
          selectDistrict(isSelected ? null : district.id);
        }}
      >
        <cylinderGeometry args={[district.radius, district.radius, 50, 16]} />
      </mesh>

      {/* Holographic Outline */}
      {isActive && (
        <mesh ref={outlineRef} position={[0, 2, 0]}>
          <cylinderGeometry args={[district.radius + 2, district.radius + 2, 4, 32]} />
          <meshBasicMaterial 
            color={district.color} 
            transparent 
            opacity={0.5} 
            wireframe 
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* District Label */}
      <DistrictLabel 
        district={district} 
        hovered={isHovered} 
        selected={isSelected} 
        onClick={() => selectDistrict(isSelected ? null : district.id)}
      />

      {/* Landmark Building positioned at the center of the district */}
      {landmark && <LandmarkBuilding landmark={landmark} />}

      {/* CityDistrict is positioned at 0,0 locally since we moved the group */}
      <CityDistrict 
        seed={district.seed} 
        center={{ x: 0, z: 0 }} 
        radius={district.radius} 
        count={district.count} 
        hovered={isHovered}
        selected={isSelected}
        color={district.color}
      />
    </group>
  );
});
