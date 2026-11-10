import React from 'react';
import { Sparkles, CheckCircle2, Circle } from 'lucide-react';

/**
 * Health Bloom Component
 * Replaces the skeleton body map with a warm, encouraging flower illustration.
 * Petals fill as goals are achieved (medications, readings logged, in range).
 * Safety rule: Strictly motivational, never a clinical diagnosis.
 */
export const HealthBloom = ({ bloomStatus }) => {
  const petalsEarned = bloomStatus?.petals_earned ?? 3;
  const totalPetals = bloomStatus?.total_petals ?? 5;
  const stage = bloomStatus?.bloom_stage ?? 'half_bloom';
  const percentage = bloomStatus?.bloom_percentage ?? 60;
  const motivationalMessage = bloomStatus?.motivational_message ?? 'Your healthy choices help your flower bloom.';

  // 5 Petal rotations around center: 0, 72, 144, 216, 288 degrees
  const petalAngles = [0, 72, 144, 216, 288];

  return (
    <div className="bg-teal-deep/30 backdrop-blur-sm rounded-card p-5 border border-mint/20 text-white flex flex-col md:flex-row items-center gap-6">
      {/* Interactive SVG Flower */}
      <div className="relative w-36 h-36 flex-shrink-0 flex items-center justify-center">
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full transform transition-transform duration-700 hover:scale-105"
          aria-label={`Health Bloom flower: ${petalsEarned} of ${totalPetals} petals bloomed`}
        >
          {/* Stem & Leaves */}
          <path
            d="M 100 120 Q 95 160 100 190"
            stroke="#CBF5EF"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Left leaf */}
          <path
            d="M 98 155 Q 70 145 75 130 Q 95 138 98 155 Z"
            fill="#CBF5EF"
            opacity={petalsEarned >= 2 ? "0.9" : "0.3"}
            className="transition-opacity duration-500"
          />
          {/* Right leaf */}
          <path
            d="M 100 145 Q 128 135 125 120 Q 105 128 100 145 Z"
            fill="#CBF5EF"
            opacity={petalsEarned >= 3 ? "0.9" : "0.3"}
            className="transition-opacity duration-500"
          />

          {/* 5 Petals arranged in a circle */}
          <g transform="translate(100, 95)">
            {petalAngles.map((angle, index) => {
              const isFilled = index < petalsEarned;
              return (
                <g key={index} transform={`rotate(${angle})`}>
                  {/* Petal shape */}
                  <path
                    d="M 0 0 C -18 -25 -22 -55 0 -68 C 22 -55 18 -25 0 0 Z"
                    fill={isFilled ? "#FFCFD2" : "rgba(255, 207, 210, 0.2)"}
                    stroke={isFilled ? "#FFCFD2" : "rgba(255, 207, 210, 0.4)"}
                    strokeWidth="1.5"
                    className="transition-all duration-700 ease-out"
                    style={{
                      transformOrigin: '0 0',
                      transform: isFilled ? 'scale(1)' : 'scale(0.85)',
                      filter: isFilled ? 'drop-shadow(0 2px 4px rgba(255,207,210,0.3))' : 'none'
                    }}
                  />
                  {/* Inner petal vein if filled */}
                  {isFilled && (
                    <line
                      x1="0"
                      y1="-10"
                      x2="0"
                      y2="-50"
                      stroke="#0F4953"
                      strokeWidth="1"
                      strokeLinecap="round"
                      opacity="0.3"
                    />
                  )}
                </g>
              );
            })}

            {/* Glowing Golden-Mint Center */}
            <circle
              cx="0"
              cy="0"
              r="18"
              fill="#CBF5EF"
              stroke="#0F4953"
              strokeWidth="2.5"
            />
            {/* Center Smiley Smile / Spark */}
            <circle cx="-5" cy="-3" r="2" fill="#0F4953" />
            <circle cx="5" cy="-3" r="2" fill="#0F4953" />
            <path
              d="M -6 4 Q 0 10 6 4"
              stroke="#0F4953"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        </svg>

        {/* Small floating badge */}
        <div className="absolute -bottom-1 bg-mint text-teal-dark text-xs font-bold px-2.5 py-0.5 rounded-full shadow-pill">
          {percentage}% Bloom
        </div>
      </div>

      {/* Motivational Info & Progress */}
      <div className="flex-1 text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start gap-2 mb-1.5">
          <span className="text-xs uppercase tracking-wider font-semibold text-mint flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-mint" /> Daily Health Bloom
          </span>
          <span className="text-[11px] bg-white/10 px-2 py-0.5 rounded-full text-white/80">
            {petalsEarned}/{totalPetals} Petals
          </span>
        </div>

        <p className="text-base font-medium text-white mb-3">
          {motivationalMessage}
        </p>

        {/* Goal Checklist Chips */}
        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
          {bloomStatus?.goals_completed?.map((g, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 text-xs bg-mint/20 text-mint font-medium px-2.5 py-1 rounded-full border border-mint/30"
            >
              <CheckCircle2 className="w-3 h-3 text-mint" /> {g}
            </span>
          ))}
          {bloomStatus?.goals_pending?.slice(0, 2).map((g, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 text-xs bg-white/10 text-white/70 px-2.5 py-1 rounded-full"
            >
              <Circle className="w-3 h-3 text-white/50" /> {g}
            </span>
          ))}
        </div>

        {/* Strict Safety Rule Notice */}
        <p className="text-[11px] text-white/60 mt-3 italic">
          * Motivational visual only — not a clinical diagnosis or treatment assessment.
        </p>
      </div>
    </div>
  );
};
