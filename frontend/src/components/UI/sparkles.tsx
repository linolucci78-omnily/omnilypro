"use client"
import React, { useId, useEffect, useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/utils/cn"

interface SparklesProps {
  id?: string
  background?: string
  minSize?: number
  maxSize?: number
  speed?: number
  particleColor?: string
  particleDensity?: number
  className?: string
}

export const SparklesCore: React.FC<SparklesProps> = ({
  id,
  background = "transparent",
  minSize = 1,
  maxSize = 3,
  speed = 2,
  particleColor = "#ef4444",
  particleDensity = 100,
  className,
}) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const generatedId = useId()
  const effectId = id || generatedId

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight })
    }
    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [])

  const particles = Array.from({ length: particleDensity }, (_, i) => ({
    id: i,
    x: Math.random() * (dimensions.width || 1920),
    y: Math.random() * (dimensions.height || 1080),
    size: Math.random() * (maxSize - minSize) + minSize,
    duration: Math.random() * speed + 1,
    delay: Math.random() * 2,
  }))

  return (
    <div className={cn("absolute inset-0", className)} style={{ background }}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particleColor,
            boxShadow: `0 0 ${particle.size * 2}px ${particleColor}`,
          }}
          animate={{
            y: [particle.y, particle.y - 100, particle.y],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}
