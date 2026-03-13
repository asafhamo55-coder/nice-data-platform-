"use client";

import { useCallback } from "react";

interface ScoreSliderProps {
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

export function ScoreSlider({ value, onChange }: ScoreSliderProps) {
  const [min, max] = value;

  const handleMin = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = Number(e.target.value);
      onChange([Math.min(v, max - 1), max]);
    },
    [max, onChange]
  );

  const handleMax = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = Number(e.target.value);
      onChange([min, Math.max(v, min + 1)]);
    },
    [min, onChange]
  );

  const leftPct = min;
  const widthPct = max - min;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-navy-500">Score Range</span>
        <span className="text-xs font-semibold text-blue">
          {min} – {max}
        </span>
      </div>
      <div className="relative h-5">
        {/* Track */}
        <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-navy-100" />
        {/* Active range */}
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue to-accent"
          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
        />
        {/* Min thumb */}
        <input
          type="range"
          min={0}
          max={100}
          value={min}
          onChange={handleMin}
          className="pointer-events-none absolute top-0 h-5 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer"
        />
        {/* Max thumb */}
        <input
          type="range"
          min={0}
          max={100}
          value={max}
          onChange={handleMax}
          className="pointer-events-none absolute top-0 h-5 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-accent [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer"
        />
      </div>
      <div className="flex justify-between text-[10px] text-navy-300">
        <span>0</span>
        <span>25</span>
        <span>50</span>
        <span>75</span>
        <span>100</span>
      </div>
    </div>
  );
}
