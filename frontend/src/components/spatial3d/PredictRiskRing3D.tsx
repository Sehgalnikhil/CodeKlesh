import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Torus } from '@react-three/drei';
import * as THREE from 'three';

interface PredictRiskRing3DProps {
  probability: number; // e.g. 0.87
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  patientName?: string;
  className?: string;
}

const AnimatedRing: React.FC<{ probability: number; riskLevel: string }> = ({
  probability,
  riskLevel,
}) => {
  const ringRef = useRef<THREE.Group>(null);
  const arcMeshRef = useRef<THREE.Mesh>(null);

  const isHigh = riskLevel === 'HIGH';
  const isMedium = riskLevel === 'MEDIUM';
  const color = isHigh ? '#B96F63' : isMedium ? '#B18A52' : '#718477';

  useFrame((state, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.15;
      ringRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.8) * 0.08;
      ringRef.current.rotation.y = Math.cos(state.clock.elapsedTime * 0.8) * 0.08;
    }
  });

  return (
    <group ref={ringRef}>
      {/* Background Track Ring */}
      <Torus args={[1.5, 0.06, 16, 64]} rotation={[0, 0, 0]}>
        <meshStandardMaterial color="#E8E6DF" roughness={0.4} metalness={0.1} transparent opacity={0.6} />
      </Torus>

      {/* Dynamic Colored Active Arc Ring */}
      <Torus
        ref={arcMeshRef}
        args={[1.5, 0.09, 20, 64, Math.PI * 2 * Math.min(0.98, probability)]}
        rotation={[0, 0, -Math.PI / 2]}
      >
        <meshStandardMaterial
          color={color}
          roughness={0.2}
          metalness={0.3}
          emissive={color}
          emissiveIntensity={0.25}
        />
      </Torus>

      {/* Floating Center Core */}
      <mesh position={[0, 0, -0.1]}>
        <circleGeometry args={[1.35, 48]} />
        <meshPhysicalMaterial
          color="#FAF9F6"
          roughness={0.3}
          transmission={0.35}
          thickness={0.5}
          transparent
          opacity={0.9}
        />
      </mesh>
    </group>
  );
};

export const PredictRiskRing3D: React.FC<PredictRiskRing3DProps> = ({
  probability,
  riskLevel,
  patientName = 'Aarav Mehta',
  className = 'w-56 h-56 md:w-64 md:h-64',
}) => {
  const pct = Math.round(probability * 100);
  const isHigh = riskLevel === 'HIGH';
  const isMedium = riskLevel === 'MEDIUM';
  const badgeColor = isHigh ? 'text-coral-500' : isMedium ? 'text-amber-500' : 'text-sage-500';

  return (
    <div className={`relative ${className} flex items-center justify-center select-none`}>
      <Canvas
        camera={{ position: [0, 0, 4.2], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={1.8} />
        <directionalLight position={[4, 5, 4]} intensity={2.0} color="#FFFFFF" />
        <directionalLight position={[-3, -3, -2]} intensity={0.8} color="#E8E6DF" />
        <AnimatedRing probability={probability} riskLevel={riskLevel} />
      </Canvas>

      {/* Center High-Contrast Typographic Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
        <span className="text-4xl md:text-5xl font-extrabold tracking-tight text-graphite-900 leading-none">
          {pct}%
        </span>
        <span className={`text-[10px] uppercase font-bold tracking-widest mt-1.5 ${badgeColor}`}>
          {riskLevel} RISK
        </span>
        <span className="text-[11px] text-steel-500 mt-0.5">
          Missed Appt Probability
        </span>
      </div>
    </div>
  );
};
