import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, RoundedBox, Float } from '@react-three/drei';
import * as THREE from 'three';

export interface Appointment3DItem {
  id: number;
  time: string;
  patientName: string;
  doctorName: string;
  department: string;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  riskProbability: number;
  status: string;
}

interface TileProps {
  item: Appointment3DItem;
  index: number;
  isSelected?: boolean;
  onSelect?: (item: Appointment3DItem) => void;
}

const AppointmentTile: React.FC<TileProps> = ({ item, index, isSelected, onSelect }) => {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  // Layout spacing along X and Z depth
  const posX = (index - 2) * 2.8;
  const isHigh = item.riskLevel === 'HIGH';
  const isMedium = item.riskLevel === 'MEDIUM';

  // Physical elevation based on risk
  const targetElevationY = isHigh ? 0.45 : isMedium ? 0.15 : -0.1;
  const targetZ = isHigh ? 0.6 : isMedium ? 0.2 : 0;

  // Colors: Porcelain body with Muted Coral / Amber / Sage rim
  const edgeColor = isHigh ? '#B96F63' : isMedium ? '#B18A52' : '#718477';
  const glowColor = isHigh ? '#B96F63' : isMedium ? '#B18A52' : '#40584B';

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const hoverOffset = hovered ? 0.2 : 0;
    meshRef.current.position.y = THREE.MathUtils.damp(
      meshRef.current.position.y,
      targetElevationY + hoverOffset,
      4,
      delta
    );
    meshRef.current.position.z = THREE.MathUtils.damp(
      meshRef.current.position.z,
      targetZ + (hovered ? 0.3 : 0),
      4,
      delta
    );
    // Subtle tilt for high risk attention
    const targetRotX = isHigh ? 0.08 : 0;
    meshRef.current.rotation.x = THREE.MathUtils.damp(meshRef.current.rotation.x, targetRotX, 4, delta);
  });

  const pct = Math.round(item.riskProbability * 100);

  return (
    <group
      ref={meshRef}
      position={[posX, targetElevationY, targetZ]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(item);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      {/* Physical Frosted Ceramic/Glass Slab */}
      <RoundedBox args={[2.4, 1.5, 0.12]} radius={0.06} smoothness={4}>
        <meshPhysicalMaterial
          color={hovered || isSelected ? '#FFFFFF' : '#FAF9F6'}
          roughness={0.25}
          metalness={0.05}
          transmission={0.4}
          thickness={0.8}
          transparent
          opacity={0.92}
          clearcoat={0.3}
          clearcoatRoughness={0.15}
        />
      </RoundedBox>

      {/* Subtle indicator ring on edge */}
      <mesh position={[0, 0, -0.07]}>
        <planeGeometry args={[2.44, 1.54]} />
        <meshBasicMaterial color={edgeColor} transparent opacity={hovered ? 0.8 : isHigh ? 0.6 : 0.25} />
      </mesh>

      {/* Text: Time */}
      <Text
        position={[-0.95, 0.45, 0.08]}
        fontSize={0.13}
        color="#71808A"
        anchorX="left"
        anchorY="middle"
        font="https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyeMZhrib2Bg-4.ttf"
      >
        {item.time}
      </Text>

      {/* Text: Patient Name */}
      <Text
        position={[-0.95, 0.16, 0.08]}
        fontSize={0.18}
        color="#20211F"
        anchorX="left"
        anchorY="middle"
        font="https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyeMZhrib2Bg-4.ttf"
      >
        {item.patientName}
      </Text>

      {/* Text: Doctor & Department */}
      <Text
        position={[-0.95, -0.14, 0.08]}
        fontSize={0.11}
        color="#71808A"
        anchorX="left"
        anchorY="middle"
      >
        {`${item.doctorName} · ${item.department}`}
      </Text>

      {/* Risk Badge on Card */}
      <group position={[0.65, 0.45, 0.08]}>
        <RoundedBox args={[0.7, 0.26, 0.02]} radius={0.04} smoothness={2}>
          <meshBasicMaterial color={edgeColor} />
        </RoundedBox>
        <Text
          position={[0, 0, 0.02]}
          fontSize={0.11}
          color="#FFFFFF"
          anchorX="center"
          anchorY="middle"
        >
          {`${pct}% RISK`}
        </Text>
      </group>

      {/* Status indicator bottom right */}
      <Text
        position={[0.95, -0.48, 0.08]}
        fontSize={0.10}
        color={item.status === 'Confirmed' ? '#40584B' : '#B18A52'}
        anchorX="right"
        anchorY="middle"
      >
        {item.status || 'Unconfirmed'}
      </Text>
    </group>
  );
};

// Scene camera parallax controller
const SceneController: React.FC = () => {
  useFrame(({ mouse, camera }) => {
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, mouse.x * 0.8, 0.05);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0.8 + mouse.y * 0.4, 0.05);
    camera.lookAt(0, 0, 0);
  });
  return null;
};

interface ScheduleHero3DProps {
  items?: Appointment3DItem[];
  selectedId?: number;
  onSelectItem?: (item: Appointment3DItem) => void;
  className?: string;
}

const defaultItems: Appointment3DItem[] = [
  {
    id: 101,
    time: '10:00 AM',
    patientName: 'Kavita Sundaram',
    doctorName: 'Dr. Sharma',
    department: 'Cardiology',
    riskLevel: 'LOW',
    riskProbability: 0.12,
    status: 'Confirmed',
  },
  {
    id: 102,
    time: '10:30 AM',
    patientName: 'Aarav Mehta',
    doctorName: 'Dr. Sharma',
    department: 'Cardiology',
    riskLevel: 'HIGH',
    riskProbability: 0.87,
    status: 'Not Confirmed',
  },
  {
    id: 103,
    time: '11:00 AM',
    patientName: 'Priya Kapoor',
    doctorName: 'Dr. Verma',
    department: 'General Medicine',
    riskLevel: 'MEDIUM',
    riskProbability: 0.42,
    status: 'SMS Sent',
  },
  {
    id: 104,
    time: '11:30 AM',
    patientName: 'Rahul Verma',
    doctorName: 'Dr. Joshi',
    department: 'Orthopedics',
    riskLevel: 'LOW',
    riskProbability: 0.09,
    status: 'Confirmed',
  },
  {
    id: 105,
    time: '12:00 PM',
    patientName: 'Sneha Patel',
    doctorName: 'Dr. Sharma',
    department: 'Cardiology',
    riskLevel: 'HIGH',
    riskProbability: 0.79,
    status: 'Not Confirmed',
  },
];

export const ScheduleHero3D: React.FC<ScheduleHero3DProps> = ({
  items = defaultItems,
  selectedId,
  onSelectItem,
  className = 'h-[360px] md:h-[440px] w-full',
}) => {
  return (
    <div className={`relative ${className} overflow-hidden select-none`}>
      <Canvas
        camera={{ position: [0, 0.8, 5.2], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ pointerEvents: 'auto' }}
      >
        <ambientLight intensity={1.6} />
        <directionalLight position={[6, 8, 5]} intensity={1.8} color="#FFFBF5" />
        <directionalLight position={[-6, -4, 2]} intensity={0.6} color="#E8E6DF" />

        <SceneController />

        {/* Subtle ground reflection grid */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]}>
          <planeGeometry args={[20, 12]} />
          <meshStandardMaterial color="#F4F3EF" roughness={0.8} opacity={0.5} transparent />
        </mesh>

        <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.12}>
          <group position={[0, 0, 0]}>
            {items.slice(0, 5).map((item, idx) => (
              <AppointmentTile
                key={item.id || idx}
                item={item}
                index={idx}
                isSelected={selectedId === item.id}
                onSelect={onSelectItem}
              />
            ))}
          </group>
        </Float>
      </Canvas>

      {/* Clean clinical hint overlay */}
      <div className="absolute bottom-3 left-6 right-6 flex items-center justify-between text-[11px] text-steel-500 pointer-events-none">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-coral-500 animate-pulse" />
          High risk nodes are elevated & separated in spatial depth
        </span>
        <span className="hidden sm:inline">Move cursor to navigate perspective · Click tile to inspect</span>
      </div>
    </div>
  );
};
