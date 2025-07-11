"use client";
import React from "react";
import { motion } from "framer-motion";

interface RippleRingsProps {
  children: React.ReactNode;
  color?: string;
  duration?: number;
  size?: number;
}

export default function RippleRings({ children, color = "border border-gray-300  -z-0", duration = 2.5, size = 100 }: RippleRingsProps) {
  const rings = [0, 1, 2, 3, 4, 5];

  return (
    <div className="relative inline-flex items-center justify-center ">
      {rings.map((ring) => (
        <motion.div
          key={ring}
          className={`absolute rounded-full ${color} opacity-20  `}
          style={{
            width: size,
            height: size,
          }}
          initial={{
            scale: 0.1,
            opacity: 0.9,
          }}
          animate={{
            scale: [0.1, 0.4, 0.8, 1.6, 2.4],
            opacity: [0, 0.9, 0.5, 0.4, 0.2, 0],
          }}
          transition={{
            duration: duration,
            repeat: Infinity,
            delay: ring * 0.5,
            ease: "linear",
          }}
        />
      ))}
      <div className="relative ">{children}</div>
    </div>
  );
}
