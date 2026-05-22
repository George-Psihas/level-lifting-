import type { RewardKey, Hairstyle } from "@/lib/game";
import lv1 from "@/assets/levels/lv1.png";
import lv2 from "@/assets/levels/lv2.png";
import lv3 from "@/assets/levels/lv3.png";
import lv4 from "@/assets/levels/lv4.png";
import lv5 from "@/assets/levels/lv5.png";
import lv6 from "@/assets/levels/lv6.png";
import lv7 from "@/assets/levels/lv7.png";
import lv8 from "@/assets/levels/lv8.png";
import lv9 from "@/assets/levels/lv9.png";
import lv10 from "@/assets/levels/lv10.png";
import lv11 from "@/assets/levels/lv11.png";
import lv12 from "@/assets/levels/lv12.png";
import lv13 from "@/assets/levels/lv13.png";
import lv14 from "@/assets/levels/lv14.png";
import lv15 from "@/assets/levels/lv15.png";
import lv16 from "@/assets/levels/lv16.png";
import lv17 from "@/assets/levels/lv17.png";
import lv18 from "@/assets/levels/lv18.png";
import lv19 from "@/assets/levels/lv19.png";
import lv20 from "@/assets/levels/lv20.png";

// Outfit (full body) overlays
import outfitCompression from "@/assets/gear/outfit-compression.png";
import outfitSleeveless from "@/assets/gear/outfit-sleeveless.png";
import outfitTshirt from "@/assets/gear/outfit-tshirt.png";
import outfitHoodie from "@/assets/gear/outfit-hoodie.png";
import outfitTrackset from "@/assets/gear/outfit-trackset.png";
import outfitStringer from "@/assets/gear/outfit-stringer.png";

// Hat overlays
import hatCap from "@/assets/gear/hat-cap.png";
import hatSnapback from "@/assets/gear/hat-snapback.png";
import hatBeanie from "@/assets/gear/hat-beanie.png";
import hatBucket from "@/assets/gear/hat-bucket.png";
import hatVisor from "@/assets/gear/hat-visor.png";

// Sunglasses overlays
import glassSquare from "@/assets/gear/glass-square.png";
import glassWrap from "@/assets/gear/glass-wrap.png";
import glassAviator from "@/assets/gear/glass-aviator.png";
import glassSport from "@/assets/gear/glass-sport.png";
import glassMirrored from "@/assets/gear/glass-mirrored.png";

const MALE_LEVEL_ART = [
  lv1, lv2, lv3, lv4, lv5, lv6, lv7, lv8, lv9, lv10,
  lv11, lv12, lv13, lv14, lv15, lv16, lv17, lv18, lv19, lv20,
];

const OUTFIT_ART: Partial<Record<RewardKey, string>> = {
  "outfit-compression": outfitCompression,
  "outfit-sleeveless": outfitSleeveless,
  "outfit-tshirt": outfitTshirt,
  "outfit-hoodie": outfitHoodie,
  "outfit-trackset": outfitTrackset,
  "outfit-stringer": outfitStringer,
};

const HAT_ART: Partial<Record<RewardKey, string>> = {
  "hat-cap": hatCap,
  "hat-snapback": hatSnapback,
  "hat-beanie": hatBeanie,
  "hat-bucket": hatBucket,
  "hat-visor": hatVisor,
};

const GLASS_ART: Partial<Record<RewardKey, string>> = {
  "glass-square": glassSquare,
  "glass-wrap": glassWrap,
  "glass-aviator": glassAviator,
  "glass-sport": glassSport,
  "glass-mirrored": glassMirrored,
};

const ACCENT_COLOR: Partial<Record<RewardKey, string>> = {
  "accent-grey":   "oklch(0.78 0.01 250)",
  "accent-orange": "oklch(0.74 0.21 45)",
  "accent-yellow": "oklch(0.88 0.18 95)",
  "accent-purple": "oklch(0.65 0.24 300)",
  "accent-red":    "oklch(0.62 0.24 25)",
  "accent-blue":   "oklch(0.70 0.22 245)",
  "accent-white":  "oklch(0.97 0.04 235)",
};


export type AvatarStyle = "male" | "female";

interface Props {
  level: number;
  equipped: Partial<Record<string, RewardKey>>;
  size?: number;
  animate?: boolean;
  style?: AvatarStyle;
  hairstyle?: Hairstyle | null;
}

// Canvas layout (matches the level art crop):
// viewBox 260x380. Character body is at x=47, y=0, w=166, h=380.
// Head center x≈130, head top y≈0, eye line y≈38, chin y≈55, head width ≈39.
const VB_W = 260;
const VB_H = 380;
const HEAD_CX = 130;
const HEAD_TOP_Y = 2;
const EYE_Y = 38;

export function NeonCharacter({ level, equipped, size = 320, animate = true, style = "male" }: Props) {
  const levelIndex = Math.min(MALE_LEVEL_ART.length - 1, Math.max(0, level - 1));
  const outfitKey = equipped.shirt as RewardKey | undefined;
  const hatKey = equipped.head as RewardKey | undefined;
  const eyesKey = equipped.eyes as RewardKey | undefined;
  const accentKey = equipped.aura as RewardKey | undefined;

  const outfitArt = outfitKey ? OUTFIT_ART[outfitKey] : undefined;
  const hatArt = hatKey ? HAT_ART[hatKey] : undefined;
  const glassArt = eyesKey ? GLASS_ART[eyesKey] : undefined;
  const auraColor = accentKey ? ACCENT_COLOR[accentKey] : undefined;
  const isUltraInstinct = accentKey === "accent-white";

  // Base body is always the level art. Outfit is overlaid on top as just the clothing.
  const bodyArt = MALE_LEVEL_ART[levelIndex];

  // Sizes for overlays inside the 260x380 viewBox
  const HAT_W = 86;   // hat width in viewBox units
  const HAT_H = 48;
  const HAT_X = HEAD_CX - HAT_W / 2;
  const HAT_Y = HEAD_TOP_Y - 14;

  const GLASS_W = 50;
  const GLASS_H = 20;
  const GLASS_X = HEAD_CX - GLASS_W / 2;
  const GLASS_Y = EYE_Y - GLASS_H / 2;

  // Outfit overlay covers the full body footprint, aligned with the base body
  const BODY_X = 47;
  const BODY_W = 166;
  const BODY_Y = 0;
  const BODY_H = 380;

  return (
    <div
      className={animate ? "float-slow pulse-glow" : ""}
      style={{ width: "100%", maxWidth: size, aspectRatio: `${VB_W} / ${VB_H}`, position: "relative", overflow: "visible" }}
      aria-label={`Level ${level} character`}
    >
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height="100%" style={{ display: "block", overflow: "visible", shapeRendering: "geometricPrecision", imageRendering: "auto" }}>
        <defs>
          <radialGradient id="floor" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(0.68 0.22 255)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="oklch(0.68 0.22 255)" stopOpacity="0" />
          </radialGradient>
          {auraColor && (
            <>
              <radialGradient id="auraCore" cx="50%" cy="55%" r="55%">
                <stop offset="0%" stopColor={auraColor} stopOpacity="0.9" />
                <stop offset="60%" stopColor={auraColor} stopOpacity="0.35" />
                <stop offset="100%" stopColor={auraColor} stopOpacity="0" />
              </radialGradient>
              <filter id="auraBlur" x="-20%" y="-30%" width="140%" height="150%">
                <feGaussianBlur stdDeviation="2.4" />
              </filter>
              {isUltraInstinct && (
                <>
                  <radialGradient id="uiCore" cx="50%" cy="55%" r="55%">
                    <stop offset="0%"  stopColor="oklch(1 0 0)" stopOpacity="0.95" />
                    <stop offset="55%" stopColor="oklch(0.92 0.09 230)" stopOpacity="0.55" />
                    <stop offset="100%" stopColor="oklch(0.65 0.22 240)" stopOpacity="0" />
                  </radialGradient>
                  <filter id="uiBlur" x="-25%" y="-35%" width="150%" height="160%">
                    <feGaussianBlur stdDeviation="1.6" />
                  </filter>
                </>
              )}
            </>
          )}
        </defs>

        {auraColor && !isUltraInstinct && (
          <g style={{ mixBlendMode: "screen" }} className={animate ? "pulse-glow" : ""}>
            {/* Soft halo behind the body, kept above the LV bar */}
            <ellipse cx={HEAD_CX} cy="170" rx="100" ry="160" fill="url(#auraCore)" opacity="0.7" filter="url(#auraBlur)" />
            {/* Outer jagged super-saiyan flame silhouette */}
            <path
              filter="url(#auraBlur)"
              d="M 130 -40 L 116 6 L 96 -16 L 86 26 L 64 8 L 56 50 L 36 38 L 32 80 L 14 72 L 22 112 L 6 116 L 18 152 L 4 174 L 26 192 L 14 226 L 38 236 L 30 270 L 58 268 L 60 304 L 94 292 L 104 326 L 130 312 L 156 326 L 166 292 L 200 304 L 202 268 L 230 270 L 222 236 L 246 226 L 234 192 L 256 174 L 242 152 L 254 116 L 238 112 L 246 72 L 228 80 L 224 38 L 204 50 L 196 8 L 174 26 L 164 -16 L 144 6 Z"
              fill={auraColor}
              opacity="0.55"
            />
            {/* Inner brighter flame core */}
            <path
              d="M 130 -14 L 118 24 L 100 12 L 92 48 L 74 38 L 70 78 L 54 72 L 56 110 L 42 118 L 56 152 L 44 180 L 64 198 L 60 232 L 86 230 L 92 262 L 118 252 L 130 272 L 142 252 L 168 262 L 174 230 L 200 232 L 196 198 L 216 180 L 204 152 L 218 118 L 204 110 L 206 72 L 190 78 L 186 38 L 168 48 L 160 12 L 142 24 Z"
              fill={auraColor}
              opacity="0.8"
            />
          </g>
        )}

        {/* ── Ultra Instinct aura: taller cocoon, dense spikes, white core w/ cyan-blue edge ── */}
        {isUltraInstinct && (
          <g style={{ mixBlendMode: "screen" }} className={animate ? "pulse-glow" : ""}>
            {/* outer cyan glow */}
            <ellipse cx={HEAD_CX} cy="170" rx="118" ry="190" fill="url(#uiCore)" opacity="0.85" filter="url(#auraBlur)" />
            {/* Outer dense-spike silhouette in cyan/blue */}
            <path
              filter="url(#uiBlur)"
              d="M 130 -60
                 L 122 -10 L 110 -28 L 102 -4 L 88 -26 L 82 12
                 L 64 -10 L 60 28 L 42 8 L 40 48 L 22 32
                 L 26 72 L 8 60 L 14 102 L -2 96 L 8 138
                 L -6 136 L 6 176 L -8 188 L 10 214 L -4 232
                 L 14 250 L 4 280 L 26 282 L 22 312 L 46 308
                 L 44 330 L 70 320 L 80 338 L 104 318 L 116 340
                 L 130 320
                 L 144 340 L 156 318 L 180 338 L 190 320 L 216 330
                 L 214 308 L 238 312 L 234 282 L 256 280 L 246 250
                 L 264 232 L 252 214 L 268 188 L 254 176 L 266 136
                 L 252 138 L 262 96 L 246 102 L 252 60 L 234 72
                 L 238 32 L 220 48 L 218 8 L 200 28 L 196 -10
                 L 178 12 L 172 -26 L 158 -4 L 150 -28 L 138 -10
                 Z"
              fill="oklch(0.78 0.16 230)"
              opacity="0.7"
            />
            {/* Mid layer: brighter cyan */}
            <path
              d="M 130 -28
                 L 116 16 L 96 -8 L 86 30 L 66 14 L 58 52
                 L 38 42 L 36 82 L 18 72 L 22 110 L 8 116
                 L 18 150 L 6 174 L 26 192 L 14 222 L 38 232
                 L 30 268 L 58 264 L 64 300 L 94 288 L 106 320
                 L 130 304
                 L 154 320 L 166 288 L 196 300 L 202 264 L 230 268
                 L 222 232 L 246 222 L 234 192 L 254 174 L 242 150
                 L 252 116 L 238 110 L 242 72 L 224 82 L 222 42
                 L 202 52 L 194 14 L 174 30 L 164 -8 L 144 16 Z"
              fill="oklch(0.88 0.13 220)"
              opacity="0.85"
            />
            {/* Inner white-hot core */}
            <path
              d="M 130 -6
                 L 118 28 L 100 16 L 92 50 L 74 40 L 70 78
                 L 54 72 L 56 108 L 42 116 L 56 150 L 44 178
                 L 64 196 L 60 230 L 86 230 L 92 260 L 118 252
                 L 130 270
                 L 142 252 L 168 260 L 174 230 L 200 230 L 196 196
                 L 216 178 L 204 150 L 218 116 L 204 108 L 206 72
                 L 190 78 L 186 40 L 168 50 L 160 16 L 142 28 Z"
              fill="oklch(0.99 0.02 220)"
              opacity="0.92"
            />
          </g>
        )}


        <ellipse cx={HEAD_CX} cy="352" rx="80" ry="12" fill="url(#floor)" />

        {/* ── Base character body (always the level art) ── */}
        <image
          href={bodyArt}
          x={BODY_X}
          y={BODY_Y}
          width={BODY_W}
          height={BODY_H}
          preserveAspectRatio="xMidYMid meet"
        />

        {/* ── Outfit overlay (just the clothing) ── */}
        {outfitArt && (
          <image
            href={outfitArt}
            x={BODY_X}
            y={BODY_Y}
            width={BODY_W}
            height={BODY_H}
            preserveAspectRatio="xMidYMid meet"
          />
        )}







        {/* ── Sunglasses overlay ── */}
        {glassArt && (
          <image
            href={glassArt}
            x={GLASS_X}
            y={GLASS_Y}
            width={GLASS_W}
            height={GLASS_H}
            preserveAspectRatio="xMidYMid meet"
          />
        )}

        {/* ── Hat overlay (drawn after glasses so brim sits above) ── */}
        {hatArt && (
          <image
            href={hatArt}
            x={HAT_X}
            y={HAT_Y}
            width={HAT_W}
            height={HAT_H}
            preserveAspectRatio="xMidYMid meet"
          />
        )}

        <g transform={`translate(${HEAD_CX}, 365)`}>
          <rect x="-22" y="-7" width="44" height="14" rx="7" fill="oklch(0.12 0.02 255 / 0.9)" stroke={auraColor ?? "oklch(0.68 0.22 255)"} strokeWidth="1" />
          <text x="0" y="3" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9" fill={auraColor ?? "oklch(0.68 0.22 255)"} letterSpacing="1">
            LV {level}
          </text>
        </g>
      </svg>
    </div>
  );
}
