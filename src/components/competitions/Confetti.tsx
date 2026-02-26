"use client";

import { useEffect, useState, useMemo } from "react";

interface ConfettiProps {
  duration?: number; // Duration in milliseconds
  particleCount?: number;
}

interface Particle {
  id: number;
  x: number;
  color: string;
  delay: number;
  rotation: number;
  size: number;
  drift: number;
}

const colors = [
  "#FFD700", // Gold
  "#FFA500", // Orange
  "#FF6B6B", // Coral
  "#4ECDC4", // Teal
  "#45B7D1", // Sky Blue
  "#96CEB4", // Sage
  "#FFEAA7", // Light Yellow
  "#DDA0DD", // Plum
  "#98D8C8", // Mint
  "#F7DC6F", // Soft Yellow
];

export function Confetti({ duration = 20000, particleCount = 100 }: ConfettiProps) {
  const [isVisible, setIsVisible] = useState(true);

  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 3,
      rotation: Math.random() * 360,
      size: Math.random() * 8 + 4,
      drift: (Math.random() - 0.5) * 100,
    }));
  }, [particleCount]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  if (!isVisible) return null;

  return (
    <div className="confetti-container">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="confetti-piece"
          style={{
            left: `${particle.x}%`,
            backgroundColor: particle.color,
            width: `${particle.size}px`,
            height: `${particle.size * 0.6}px`,
            animationDelay: `${particle.delay}s`,
            transform: `rotate(${particle.rotation}deg)`,
            "--drift": `${particle.drift}px`,
          } as React.CSSProperties}
        />
      ))}
      <style jsx>{`
        .confetti-container {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 50;
          border-radius: inherit;
        }

        .confetti-piece {
          position: absolute;
          top: -20px;
          border-radius: 2px;
          animation: confetti-fall 4s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
        }

        @keyframes confetti-fall {
          0% {
            transform: translateY(-20px) translateX(0) rotate(0deg);
            opacity: 1;
          }
          25% {
            opacity: 1;
          }
          100% {
            transform: translateY(400px) translateX(var(--drift)) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

export function WinnerCelebration({ duration = 20000 }: { duration?: number }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  if (!isVisible) return null;

  return (
    <>
      <Confetti duration={duration} particleCount={80} />
      {/* Sparkle effects */}
      <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden rounded-[inherit]">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="sparkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
      <style jsx>{`
        .sparkle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: white;
          border-radius: 50%;
          animation: sparkle 1.5s ease-in-out infinite;
          box-shadow: 0 0 6px 2px rgba(255, 215, 0, 0.8),
                      0 0 12px 4px rgba(255, 165, 0, 0.4);
        }

        @keyframes sparkle {
          0%, 100% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
