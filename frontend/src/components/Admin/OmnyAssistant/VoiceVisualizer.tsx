import React, { useEffect, useState } from 'react';

interface VoiceVisualizerProps {
  isListening: boolean;
  audioLevel?: number;
}

const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ isListening, audioLevel = 0 }) => {
  const [bars, setBars] = useState<number[]>([]);

  // Generate random heights for bars when listening (simulating audio)
  useEffect(() => {
    if (!isListening) {
      setBars([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      return;
    }

    const interval = setInterval(() => {
      // Create 10 bars with heights based on audioLevel + random variation
      const newBars = Array.from({ length: 10 }, () => {
        const base = audioLevel || 0.3; // Use audioLevel or default to 30%
        const variation = Math.random() * 0.5; // Random variation 0-50%
        return Math.min(base + variation, 1); // Cap at 100%
      });
      setBars(newBars);
    }, 100); // Update every 100ms for smooth animation

    return () => clearInterval(interval);
  }, [isListening, audioLevel]);

  if (!isListening) return null;

  return (
    <div className="w-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 backdrop-blur-sm py-6 rounded-2xl">
      <div className="flex items-center justify-center gap-1 h-16 px-4">
        {bars.map((height, index) => (
          <div
            key={index}
            className="flex-1 max-w-[8px] bg-gradient-to-t from-blue-400 to-purple-500 rounded-full transition-all duration-100 ease-out"
            style={{
              height: `${height * 100}%`,
              opacity: 0.8 + height * 0.2,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default VoiceVisualizer;
