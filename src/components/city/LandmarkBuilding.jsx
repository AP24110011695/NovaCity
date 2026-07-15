import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { useBuildingSelection } from './BuildingManager';
import { Html } from '@react-three/drei';

const LandmarkShape = ({ id, color }) => {
  const meshRef = useRef();
  
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    if (id === 'landmark-research') {
      meshRef.current.rotation.y = t * 0.5;
    } else if (id === 'landmark-innovation') {
      meshRef.current.rotation.y = t * 0.2;
    }
  });

  if (id === 'landmark-innovation') {
    return (
      <group>
        <mesh ref={meshRef} position={[0, 15, 0]}>
          <cylinderGeometry args={[2, 4, 30, 6]} />
          <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 15, 0]}>
          <cylinderGeometry args={[4.2, 4.2, 30, 3]} />
          <meshBasicMaterial color={color} wireframe transparent opacity={0.3} />
        </mesh>
      </group>
    );
  }

  if (id === 'landmark-research') {
    return (
      <group>
        <mesh ref={meshRef} position={[0, 12, 0]}>
          <icosahedronGeometry args={[6, 2]} />
          <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0, 12, 0]}>
          <cylinderGeometry args={[7, 7, 24, 6]} />
          <meshBasicMaterial color={color} wireframe transparent opacity={0.4} />
        </mesh>
      </group>
    );
  }

  if (id === 'landmark-academy') {
    return (
      <mesh position={[0, 20, 0]}>
        <cylinderGeometry args={[1.5, 3, 40, 16]} />
        <meshStandardMaterial color="#111" metalness={0.7} roughness={0.3} />
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[3.2, 3.2, 40, 16]} />
          <meshBasicMaterial color={color} wireframe transparent opacity={0.2} />
        </mesh>
      </mesh>
    );
  }

  if (id === 'landmark-corporate') {
    return (
      <mesh position={[0, 18, 0]}>
        <boxGeometry args={[6, 36, 6]} />
        <meshStandardMaterial color="#0a0a0a" metalness={0.8} roughness={0.2} />
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[6.2, 36.2, 6.2]} />
          <meshBasicMaterial color={color} wireframe transparent opacity={0.3} />
        </mesh>
      </mesh>
    );
  }

  return null;
};

export const LandmarkBuilding = ({ landmark }) => {
  const { activeBuildingId, hoveredBuildingId, selectBuilding, setHoveredBuilding } = useBuildingSelection();
  
  const groupRef = useRef();
  const scanlineRef = useRef();
  
  const isHovered = hoveredBuildingId === landmark.id;
  const isSelected = activeBuildingId === landmark.id;
  const isActive = isHovered || isSelected;

  useEffect(() => {
    if (isActive) {
      document.body.style.cursor = 'crosshair';
    } else if (hoveredBuildingId === null) {
      document.body.style.cursor = 'auto'; // Will be overridden by district hover if needed
    }
    return () => { document.body.style.cursor = 'auto'; };
  }, [isActive, hoveredBuildingId]);

  useEffect(() => {
    if (!groupRef.current) return;
    const scale = isActive ? 1.05 : 1.0;
    gsap.to(groupRef.current.scale, {
      x: scale,
      y: scale,
      z: scale,
      duration: 0.5,
      ease: 'back.out(1.5)'
    });
  }, [isActive]);

  useFrame(({ clock }) => {
    if (scanlineRef.current && isActive) {
      const t = clock.getElapsedTime();
      // Animate scanline up and down
      scanlineRef.current.position.y = 15 + Math.sin(t * 3) * 15;
      scanlineRef.current.material.opacity = 0.6 + Math.sin(t * 10) * 0.4;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Invisible hitbox for the landmark building */}
      <mesh
        visible={false}
        position={[0, 20, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredBuilding(landmark.id);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHoveredBuilding(null);
        }}
        onClick={(e) => {
          e.stopPropagation();
          selectBuilding(isSelected ? null : landmark.id);
        }}
      >
        <cylinderGeometry args={[8, 8, 40, 16]} />
      </mesh>

      {/* Geometry for the building */}
      <LandmarkShape id={landmark.id} color={landmark.accentColor} />

      {/* Holographic Outline / Emissive Pulse */}
      {isActive && (
        <mesh position={[0, 20, 0]}>
          <cylinderGeometry args={[9, 9, 42, 16]} />
          <meshBasicMaterial 
            color={landmark.accentColor} 
            transparent 
            opacity={0.15} 
            wireframe 
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Animated Scan Line */}
      {isActive && (
        <mesh ref={scanlineRef} position={[0, 0, 0]}>
          <cylinderGeometry args={[9.2, 9.2, 0.5, 16]} />
          <meshBasicMaterial 
            color={landmark.accentColor} 
            transparent 
            opacity={0.8} 
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Floating Title */}
      {(isHovered || isSelected) && (
        <Html
          position={[0, 45, 0]}
          center
          zIndexRange={[110, 0]}
          distanceFactor={150}
        >
          <div 
            className="flex flex-col items-center justify-center pointer-events-none"
            style={{ textShadow: `0 0 10px ${landmark.accentColor}` }}
          >
            <div className="px-4 py-2 text-center">
              <h4 className="text-lg font-bold tracking-[0.2em] uppercase m-0 text-white">
                {landmark.displayName}
              </h4>
              <p className="text-xs text-white/75 mt-1 uppercase tracking-widest font-medium">
                {isSelected ? 'PORTFOLIO OPEN' : 'CLICK TO EXPLORE'}
              </p>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};
