import React, { useState, useRef } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';

interface AppleVision3DCardProps {
  children: React.ReactNode;
  className?: string;
  depth?: number; // max tilt angle in degrees
  translateDepth?: number; // translateZ in px
  onClick?: () => void;
  isSelected?: boolean;
  glowColor?: string;
}

export const AppleVision3DCard: React.FC<AppleVision3DCardProps> = ({
  children,
  className = '',
  depth = 12,
  translateDepth = 30,
  onClick,
  isSelected = false,
  glowColor = 'rgba(255, 255, 255, 0.25)',
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Motion values for smooth cursor tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs with Apple-like damping
  const springConfig = { damping: 26, stiffness: 280 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [depth, -depth]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-depth, depth]), springConfig);
  const zPosition = useSpring(isHovered || isSelected ? translateDepth : 0, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const normalizedX = (currentX / width) - 0.5;
    const normalizedY = (currentY / height) - 0.5;

    mouseX.set(normalizedX);
    mouseY.set(normalizedY);

    // Direct CSS variable updates for instantaneous 60fps specular glare
    cardRef.current.style.setProperty('--mouse-x', `${(currentX / width) * 100}%`);
    cardRef.current.style.setProperty('--mouse-y', `${(currentY / height) * 100}%`);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
    if (cardRef.current) {
      cardRef.current.style.setProperty('--mouse-x', '50%');
      cardRef.current.style.setProperty('--mouse-y', '50%');
    }
  };

  return (
    <div className="perspective-1400 preserve-3d">
      <motion.div
        ref={cardRef}
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          z: zPosition,
          transformStyle: 'preserve-3d',
        }}
        className={`relative transition-all duration-300 cursor-pointer vision-glass-card rounded-[28px] select-none ${className} ${
          isSelected ? 'ring-2 ring-white/60 shadow-[0_30px_90px_rgba(0,0,0,0.9)]' : ''
        }`}
      >
        {/* Dynamic Specular Glare Sheen - Follows mouse in real time across glass face */}
        <div
          className="absolute inset-0 pointer-events-none rounded-[inherit] z-20 overflow-hidden transition-opacity duration-300"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(circle 280px at var(--mouse-x, 50%) var(--mouse-y, 50%), ${glowColor} 0%, rgba(255, 255, 255, 0.04) 40%, transparent 80%)`,
          }}
        />

        {/* Ambient Top Edge Highlight */}
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none z-20" />

        {/* Inner Content with Preserve-3D */}
        <div className="relative z-10" style={{ transformStyle: 'preserve-3d' }}>
          {children}
        </div>
      </motion.div>
    </div>
  );
};
