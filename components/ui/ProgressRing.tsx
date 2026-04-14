import React from 'react';
import Svg, { Circle } from 'react-native-svg';

type ProgressRingProps = {
  progress: number;
  size?: number;
  strokeWidth?: number;
  trackColor?: string;
  progressColor?: string;
};

export default function ProgressRing({
  progress,
  size = 42,
  strokeWidth = 4,
  trackColor = '#E7EEF8',
  progressColor = '#4F7CFF',
}: ProgressRingProps) {
  const normalizedProgress = Math.max(0, Math.min(progress, 1));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - normalizedProgress);

  return (
    <Svg width={size} height={size}>
      <Circle
        stroke={trackColor}
        fill="none"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
      />

      <Circle
        stroke={progressColor}
        fill="none"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        rotation="-90"
        origin={`${size / 2}, ${size / 2}`}
      />
    </Svg>
  );
}