import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, RoundedBox, Line } from '@react-three/drei';
import * as THREE from 'three';

export type RecoveryStage = 'AT_RISK' | 'MATCHING' | 'OFFERED' | 'RECOVERED';

interface ConvergenceSceneProps {
  stage: RecoveryStage;
  appointmentTime: string;
  doctorName: string;
  candidateName: string;
}

const ConvergenceScene: React.FC<ConvergenceSceneProps> = ({
  stage,
  appointmentTime,
  doctorName,
  candidateName,
}) => {
  const slotRef = useRef<THREE.Group>(null);
  const candidateRef = useRef<THREE.Group>(null);
  const bridgeRef = useRef<THREE.Group>(null);

  // Positions based on stage
  // AT_RISK / MATCHING / OFFERED: separated [-1.8, 0, 0] and [1.8, 0, 0]
  // RECOVERED: smoothly converge to [0, 0, 0]
  const isRecovered = stage === 'RECOVERED';
  const isMatching = stage === 'MATCHING' || stage === 'OFFERED';

  const targetSlotX = isRecovered ? -0.4 : -1.8;
  const targetCandidateX = isRecovered ? 0.4 : 1.8;
  const targetScale = isRecovered ? 0.95 : 1.0;

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    if (slotRef.current) {
      slotRef.current.position.x = THREE.MathUtils.damp(
        slotRef.current.position.x,
        targetSlotX,
        3.5,
        delta
      );
      // If at risk, slight anxious jitter/float
      const jitter = !isRecovered ? Math.sin(t * 4) * 0.05 : 0;
      slotRef.current.position.y = THREE.MathUtils.damp(
        slotRef.current.position.y,
        jitter,
        4,
        delta
      );
      slotRef.current.scale.setScalar(
        THREE.MathUtils.damp(slotRef.current.scale.x, targetScale, 3, delta)
      );
    }

    if (candidateRef.current) {
      candidateRef.current.position.x = THREE.MathUtils.damp(
        candidateRef.current.position.x,
        targetCandidateX,
        3.5,
        delta
      );
      const floatY = Math.cos(t * 2) * 0.03;
      candidateRef.current.position.y = THREE.MathUtils.damp(
        candidateRef.current.position.y,
        floatY,
        4,
        delta
      );
      candidateRef.current.scale.setScalar(
        THREE.MathUtils.damp(candidateRef.current.scale.x, targetScale, 3, delta)
      );
    }

    if (bridgeRef.current) {
      bridgeRef.current.rotation.z += delta * 0.5;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* AT-RISK SLOT TILE (Left) */}
      <group ref={slotRef} position={[-1.8, 0, 0]}>
        <RoundedBox args={[2.2, 1.4, 0.12]} radius={0.06} smoothness={4}>
          <meshPhysicalMaterial
            color={isRecovered ? '#F4F3EF' : '#FAF9F6'}
            roughness={0.2}
            transmission={0.3}
            thickness={0.6}
            transparent
            opacity={0.95}
          />
        </RoundedBox>
        {/* Rim Indicator */}
        <mesh position={[0, 0, -0.07]}>
          <planeGeometry args={[2.24, 1.44]} />
          <meshBasicMaterial color={isRecovered ? '#718477' : '#B96F63'} transparent opacity={0.8} />
        </mesh>

        <Text position={[-0.85, 0.42, 0.08]} fontSize={0.11} color="#71808A" anchorX="left">
          {isRecovered ? 'RECOVERED SLOT' : 'AT-RISK SLOT'}
        </Text>
        <Text position={[-0.85, 0.16, 0.08]} fontSize={0.18} color="#20211F" anchorX="left">
          {appointmentTime}
        </Text>
        <Text position={[-0.85, -0.12, 0.08]} fontSize={0.11} color="#71808A" anchorX="left">
          {doctorName}
        </Text>
        <Text
          position={[0.85, 0.42, 0.08]}
          fontSize={0.11}
          color={isRecovered ? '#40584B' : '#B96F63'}
          anchorX="right"
        >
          {isRecovered ? 'SAVED' : '87% RISK'}
        </Text>
      </group>

      {/* RECOVERED MERGE CONNECTOR / LOCK */}
      {isRecovered ? (
        <group position={[0, 0, 0.12]}>
          <RoundedBox args={[1.2, 0.36, 0.04]} radius={0.06}>
            <meshBasicMaterial color="#40584B" />
          </RoundedBox>
          <Text position={[0, 0, 0.03]} fontSize={0.12} color="#FFFFFF" anchorX="center" anchorY="middle">
            ✓ BACKFILLED & CONFIRMED
          </Text>
        </group>
      ) : isMatching ? (
        /* Dynamic Convergence Lines */
        <group ref={bridgeRef} position={[0, 0, 0]}>
          <mesh>
            <ringGeometry args={[0.3, 0.35, 32]} />
            <meshBasicMaterial color="#B18A52" transparent opacity={0.6} />
          </mesh>
        </group>
      ) : null}

      {/* WAITLIST CANDIDATE TILE (Right) */}
      <group ref={candidateRef} position={[1.8, 0, 0]}>
        <RoundedBox args={[2.2, 1.4, 0.12]} radius={0.06} smoothness={4}>
          <meshPhysicalMaterial
            color={isRecovered ? '#F4F3EF' : '#FFFFFF'}
            roughness={0.2}
            transmission={0.3}
            thickness={0.6}
            transparent
            opacity={0.95}
          />
        </RoundedBox>
        {/* Rim Indicator */}
        <mesh position={[0, 0, -0.07]}>
          <planeGeometry args={[2.24, 1.44]} />
          <meshBasicMaterial color={isRecovered ? '#718477' : '#71808A'} transparent opacity={0.6} />
        </mesh>

        <Text position={[-0.85, 0.42, 0.08]} fontSize={0.11} color="#71808A" anchorX="left">
          {isRecovered ? 'NEW PATIENT' : 'WAITLIST MATCH'}
        </Text>
        <Text position={[-0.85, 0.16, 0.08]} fontSize={0.18} color="#20211F" anchorX="left">
          {candidateName}
        </Text>
        <Text position={[-0.85, -0.12, 0.08]} fontSize={0.11} color="#71808A" anchorX="left">
          Available 10:00 - 12:00
        </Text>
        <Text position={[0.85, 0.42, 0.08]} fontSize={0.11} color="#40584B" anchorX="right">
          Ready
        </Text>
      </group>
    </group>
  );
};

interface RecoveryConvergence3DProps {
  stage: RecoveryStage;
  appointmentTime?: string;
  doctorName?: string;
  candidateName?: string;
  onFindReplacement?: () => void;
  onOfferSlot?: () => void;
  onAcceptSlot?: () => void;
  isProcessing?: boolean;
}

export const RecoveryConvergence3D: React.FC<RecoveryConvergence3DProps> = ({
  stage,
  appointmentTime = '10:30 AM',
  doctorName = 'Dr. Sharma',
  candidateName = 'Priya Kapoor',
  onFindReplacement,
  onOfferSlot,
  onAcceptSlot,
  isProcessing = false,
}) => {
  return (
    <div className="w-full flex flex-col items-center">
      {/* 3D Canvas Box */}
      <div className="w-full h-[260px] md:h-[320px] rounded-2xl bg-stone-100/50 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-800 relative overflow-hidden select-none">
        <Canvas
          camera={{ position: [0, 0, 4.4], fov: 42 }}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={1.8} />
          <directionalLight position={[4, 6, 4]} intensity={2.0} color="#FFFFFF" />
          <directionalLight position={[-4, -3, 2]} intensity={0.7} color="#E8E6DF" />
          <ConvergenceScene
            stage={stage}
            appointmentTime={appointmentTime}
            doctorName={doctorName}
            candidateName={candidateName}
          />
        </Canvas>

        {/* Dynamic Status Tag */}
        <div className="absolute top-3 left-4 flex items-center gap-2 text-xs font-mono">
          <span
            className={`w-2 h-2 rounded-full ${
              stage === 'RECOVERED'
                ? 'bg-sage-500'
                : stage === 'OFFERED'
                ? 'bg-amber-500 animate-pulse'
                : 'bg-coral-500 animate-pulse'
            }`}
          />
          <span className="text-graphite-900 dark:text-stone-100 font-semibold tracking-wide uppercase text-[10px]">
            {stage === 'RECOVERED'
              ? 'CAPACITY RECOVERED & BACKFILLED'
              : stage === 'OFFERED'
              ? 'WAITLIST OFFER DISPATCHED'
              : stage === 'MATCHING'
              ? 'MATCHING CANDIDATES...'
              : 'AT-RISK CAPACITY DETECTED'}
          </span>
        </div>
      </div>

      {/* Functional Interactive Controls directly connected to Real Backend */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
        {stage === 'AT_RISK' && (
          <button
            disabled={isProcessing}
            onClick={onFindReplacement}
            className="px-5 py-2.5 rounded-full bg-graphite-900 text-porcelain-50 hover:bg-charcoal-800 text-xs font-semibold shadow-spatial-card transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            <span>Find Waitlist Replacement</span>
            <span className="text-[10px] bg-porcelain-100/20 px-1.5 py-0.5 rounded">AI Match</span>
          </button>
        )}

        {stage === 'MATCHING' && (
          <button
            disabled={isProcessing}
            onClick={onOfferSlot}
            className="px-5 py-2.5 rounded-full bg-amber-500 text-white hover:bg-amber-600 text-xs font-semibold shadow-spatial-card transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            <span>Offer 10:30 Slot to {candidateName}</span>
          </button>
        )}

        {stage === 'OFFERED' && (
          <button
            disabled={isProcessing}
            onClick={onAcceptSlot}
            className="px-5 py-2.5 rounded-full bg-eucalyptus-500 text-white hover:bg-eucalyptus-600 text-xs font-semibold shadow-spatial-card transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            <span>Accept & Lock Slot (Backfill)</span>
          </button>
        )}

        {stage === 'RECOVERED' && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sage-100 dark:bg-sage-600/20 border border-sage-500/30 text-eucalyptus-500 dark:text-sage-100 text-xs font-semibold">
            <span>✓ ₹2,500 Clinic Revenue Protected</span>
          </div>
        )}
      </div>
    </div>
  );
};
