import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';
import { ShieldAlert, TrendingUp, Compass } from 'lucide-react';

interface OrbProps {
  mode: 'gyro' | 'risk' | 'capacity';
}

const GyroscopeRings: React.FC<{ mode: OrbProps['mode'] }> = ({ mode }) => {
  const ring1Ref = useRef<THREE.Group>(null);
  const ring2Ref = useRef<THREE.Group>(null);
  const ring3Ref = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = t * 0.25;
      ring1Ref.current.rotation.y = t * 0.18;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y = -t * 0.3;
      ring2Ref.current.rotation.z = t * 0.22;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.z = -t * 0.15;
      ring3Ref.current.rotation.x = t * 0.28;
    }
    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.4;
      coreRef.current.rotation.x = Math.sin(t * 0.5) * 0.1;
    }
  });

  return (
    <group>
      {/* Central Refractive Glass Holographic Core */}
      <Float speed={2} rotationIntensity={0.6} floatIntensity={0.8}>
        <mesh ref={coreRef} scale={mode === 'risk' ? 1.15 : 1}>
          <icosahedronGeometry args={[1.2, 2]} />
          <meshPhysicalMaterial
            color={mode === 'risk' ? '#F59E0B' : mode === 'capacity' ? '#10B981' : '#00F2FE'}
            roughness={0.12}
            metalness={0.1}
            transmission={0.88}
            thickness={1.4}
            ior={1.45}
            transparent
            opacity={0.92}
            emissive={mode === 'risk' ? '#B45309' : mode === 'capacity' ? '#047857' : '#0284C7'}
            emissiveIntensity={0.35}
            clearcoat={1}
            clearcoatRoughness={0.1}
          />
        </mesh>
      </Float>

      {/* Internal Luminous Plasma Center */}
      <mesh scale={0.65}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color={mode === 'risk' ? '#EF4444' : mode === 'capacity' ? '#10B981' : '#38BDF8'}
          wireframe
          transparent
          opacity={0.35}
        />
      </mesh>

      {/* Outer Titanium Clinical Ring 1 (Capacity Ring) */}
      <group ref={ring1Ref}>
        <mesh>
          <torusGeometry args={[2.0, 0.045, 16, 100]} />
          <meshStandardMaterial
            color="#E2E8F0"
            metalness={0.92}
            roughness={0.18}
            emissive="#10B981"
            emissiveIntensity={mode === 'capacity' ? 0.6 : 0.15}
          />
        </mesh>
        {/* Floating Spatial Node on Ring 1 */}
        <group position={[2.0, 0, 0]}>
          <mesh>
            <sphereGeometry args={[0.09, 16, 16]} />
            <meshStandardMaterial color="#10B981" emissive="#10B981" emissiveIntensity={0.8} />
          </mesh>
          <Html distanceFactor={10} position={[0.2, 0.2, 0]} transform>
            <div className="px-2.5 py-1 rounded-full vision-dock text-[10px] font-mono text-emerald-400 font-bold whitespace-nowrap shadow-xl border border-emerald-500/30 backdrop-blur-md flex items-center gap-1.5 pointer-events-none select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              94% Recovered Flow
            </div>
          </Html>
        </group>
      </group>

      {/* Titanium Clinical Ring 2 (Risk Prediction Orbit) */}
      <group ref={ring2Ref}>
        <mesh>
          <torusGeometry args={[2.4, 0.04, 16, 100]} />
          <meshStandardMaterial
            color="#CBD5E1"
            metalness={0.95}
            roughness={0.15}
            emissive="#F59E0B"
            emissiveIntensity={mode === 'risk' ? 0.7 : 0.2}
          />
        </mesh>
        {/* Floating Spatial Node on Ring 2 */}
        <group position={[-2.4, 0, 0]}>
          <mesh>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color="#F59E0B" emissive="#F59E0B" emissiveIntensity={0.9} />
          </mesh>
          <Html distanceFactor={10} position={[-0.2, 0.2, 0]} transform>
            <div className="px-2.5 py-1 rounded-full vision-dock text-[10px] font-mono text-amber-400 font-bold whitespace-nowrap shadow-xl border border-amber-500/30 backdrop-blur-md flex items-center gap-1.5 pointer-events-none select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              87% Miss Risk (10:30 AM)
            </div>
          </Html>
        </group>
      </group>

      {/* Titanium Clinical Ring 3 (Temporal Timeline Orbit) */}
      <group ref={ring3Ref}>
        <mesh>
          <torusGeometry args={[2.8, 0.035, 16, 100]} />
          <meshStandardMaterial
            color="#94A3B8"
            metalness={0.9}
            roughness={0.2}
            emissive="#00F2FE"
            emissiveIntensity={0.25}
          />
        </mesh>
        {/* Floating Spatial Node on Ring 3 */}
        <group position={[0, 2.8, 0]}>
          <mesh>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color="#00F2FE" emissive="#00F2FE" emissiveIntensity={0.9} />
          </mesh>
          <Html distanceFactor={10} position={[0.2, 0, 0]} transform>
            <div className="px-2.5 py-1 rounded-full vision-dock text-[10px] font-mono text-cyan-400 font-bold whitespace-nowrap shadow-xl border border-cyan-500/30 backdrop-blur-md flex items-center gap-1.5 pointer-events-none select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              Real-Time AI Telemetry
            </div>
          </Html>
        </group>
      </group>
    </group>
  );
};

export const Apple3DSpatialCapacityOrb: React.FC = () => {
  const [mode, setMode] = useState<'gyro' | 'risk' | 'capacity'>('gyro');
  const [isInteracting, setIsInteracting] = useState(false);

  return (
    <div className="relative w-full h-[460px] sm:h-[520px] rounded-[36px] overflow-hidden vision-glass select-none border border-white/15 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.9)]">
      {/* Atmospheric Ambient Glows behind WebGL Scene */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-gradient-to-tr from-cyan-500/20 via-indigo-500/20 to-emerald-500/20 rounded-full blur-[90px] pointer-events-none" />

      {/* Top Controls Overlay in VisionOS Glass Dock */}
      <div className="absolute top-5 left-6 right-6 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pointer-events-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-mono tracking-widest text-white/70 uppercase font-bold">
            Interactive 3D Spatial Gyroscope Core
          </span>
        </div>

        {/* 3D Mode Presets */}
        <div className="flex items-center gap-1.5 p-1 rounded-full vision-dock self-start sm:self-auto border border-white/10">
          <button
            onClick={() => setMode('gyro')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              mode === 'gyro'
                ? 'bg-white text-stone-900 shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>360° Gyro</span>
          </button>
          <button
            onClick={() => setMode('risk')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              mode === 'risk'
                ? 'bg-amber-500 text-stone-950 shadow-md font-bold'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Risk Orbit</span>
          </button>
          <button
            onClick={() => setMode('capacity')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              mode === 'capacity'
                ? 'bg-emerald-500 text-stone-950 shadow-md font-bold'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Capacity Flow</span>
          </button>
        </div>
      </div>

      {/* Interactive WebGL 3D Canvas */}
      <Canvas
        camera={{ position: [0, 1.2, 6.8], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        onPointerDown={() => setIsInteracting(true)}
        onPointerUp={() => setIsInteracting(false)}
        className="cursor-grab active:cursor-grabbing w-full h-full"
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[6, 8, 5]} intensity={2.2} color="#FFFFFF" />
        <pointLight position={[-6, -4, -3]} intensity={1.5} color="#00F2FE" />
        <pointLight position={[5, -4, 4]} intensity={1.5} color="#10B981" />

        <GyroscopeRings mode={mode} />

        {/* 360-degree Smooth Inertia Orbit Controls */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={!isInteracting}
          autoRotateSpeed={0.8}
          dampingFactor={0.06}
          rotateSpeed={0.9}
        />
      </Canvas>

      {/* Bottom Floating Spatial Bar with Interaction Hint */}
      <div className="absolute bottom-4 left-6 right-6 z-20 flex items-center justify-between pointer-events-none text-xs text-white/50 font-mono">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md bg-white/10 text-white/80 border border-white/15">
            DRAG TO ROTATE 360°
          </span>
          <span className="hidden sm:inline">Physics-based inertial rotation</span>
        </div>
        <div className="flex items-center gap-2 text-white/70">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Clinical Operations Core · Online</span>
        </div>
      </div>
    </div>
  );
};
