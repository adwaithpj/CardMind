import { getMasteryStrokeColor } from "@/lib/utils";

interface MasteryRingProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}

export function MasteryRing({
  percent,
  size = 52,
  strokeWidth = 4,
  showLabel = true,
}: MasteryRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;
  const color = getMasteryStrokeColor(percent);

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="mastery-ring">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold" style={{ color }}>
            {percent}%
          </span>
        </div>
      )}
    </div>
  );
}
