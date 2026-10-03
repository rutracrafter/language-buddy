import React from 'react';

interface HandDrawnIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
  washColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
}

/**
 * Hand-Drawn Felt-Tip Ink Quality Icon System:
 * - Soft charcoal stroke (#2B2B2B)
 * - Gentle organic wobble mimicking felt-tip pen on sketchbook paper
 * - Loose, misregistered color fills sitting playfully offset inside the contour
 */

// 1. Hand-drawn Phone Receiver (Call)
export const HandDrawnPhone: React.FC<HandDrawnIconProps> = ({
  size = 24,
  className = '',
  washColor = '#86EFAC', // Soft pastel green
  strokeColor = '#2B2B2B',
  strokeWidth = 2.4,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    {...props}
  >
    {/* Loose misregistered color wash fill */}
    {washColor && (
      <path
        d="M7 6 C10 4.5, 14 7, 13 11 C12.2 13 10.5 13.5 11 16.5 C11.5 19.5 14.5 22.5 17.5 23 C20.5 23.5 21 21.8 23 21 C27 20 29.5 24 28 27 C26.5 29.5 22.5 29.5 18 27 C11.5 23.5 7.5 17 5 12 C3.5 8 4.5 5.5 7 6 Z"
        fill={washColor}
        opacity={0.88}
        transform="translate(-1, 0.5) scale(0.96)"
      />
    )}
    {/* Felt-tip charcoal ink contour with organic wobble */}
    <path
      d="M7.5 5.8 C9.2 4.6, 12.8 6.4, 13.5 9.2 C14.1 11.4, 12.3 12.9, 11.6 14.3 C11.1 15.3, 11.4 16.6, 12.2 17.8 C13.4 19.6, 15.2 21.4, 17.2 22.4 C18.4 23.1, 19.8 23.2, 20.7 22.5 C22.1 21.7, 23.5 20.2, 25.8 20.7 C28.4 21.3, 29.8 24.8, 28.6 27.2 C27.5 29.4, 23.8 29.8, 20.2 28.4 C15.1 26.4, 10.4 21.8, 7.2 17.1 C4.3 12.9, 3.8 8.9, 6.2 6.5 Z"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Subtle felt-tip pen accents */}
    <path
      d="M9 8 C9.8 7.3, 11 8.2, 11.6 9"
      stroke={strokeColor}
      strokeWidth={strokeWidth * 0.8}
      strokeLinecap="round"
    />
    <path
      d="M24 23.5 C24.8 24.2, 25.5 25.5, 25 26.5"
      stroke={strokeColor}
      strokeWidth={strokeWidth * 0.8}
      strokeLinecap="round"
    />
  </svg>
);

// 2. Hand-drawn End Call 'X' / Cross
export const HandDrawnCross: React.FC<HandDrawnIconProps> = ({
  size = 24,
  className = '',
  washColor = '#FCA5A5', // Soft coral red
  strokeColor = '#2B2B2B',
  strokeWidth = 3,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    {...props}
  >
    {/* Loose misregistered wash */}
    {washColor && (
      <ellipse
        cx="16"
        cy="16"
        rx="10"
        ry="9"
        fill={washColor}
        opacity={0.85}
        transform="rotate(-5 16 16)"
      />
    )}
    {/* First wobbly felt-tip stroke */}
    <path
      d="M8.5 7.8 C11.5 11.2, 20.2 20.8, 24.2 24.5 C24.6 24.9, 23.8 24.4, 23.2 23.6"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Second wobbly stroke intersecting */}
    <path
      d="M24 8.2 C20.8 11.8, 12.2 20.5, 8.2 24.2 C7.9 24.5, 8.5 23.9, 9.2 23.1"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// 3. Hand-drawn Microphone (Mic On)
export const HandDrawnMic: React.FC<HandDrawnIconProps> = ({
  size = 24,
  className = '',
  washColor = '#FED7AA', // Peach wash
  strokeColor = '#2B2B2B',
  strokeWidth = 2.4,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    {...props}
  >
    {/* Loose capsule wash fill */}
    {washColor && (
      <rect
        x="12"
        y="4.5"
        width="8"
        height="14"
        rx="4"
        fill={washColor}
        opacity={0.85}
        transform="rotate(2 16 12)"
      />
    )}
    {/* Felt-tip capsule outline */}
    <path
      d="M12 8 C11.8 5.6, 13.8 3.8, 16.2 3.9 C18.5 4, 20.2 5.8, 20 8.2 L19.8 14.2 C19.7 16.5, 17.8 18.2, 15.6 18.1 C13.3 18, 11.9 16.2, 12.1 13.9 Z"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Cradle stand */}
    <path
      d="M8.5 13 C8.2 17.8, 11.5 22.4, 16.1 22.3 C20.8 22.2, 23.9 17.5, 23.5 12.8"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    {/* Stem and base */}
    <path
      d="M16 22.5 L15.9 28"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <path
      d="M11.5 28.2 C13.8 27.8, 18.2 28.2, 20.5 27.9"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </svg>
);

// 4. Hand-drawn Microphone Muted (Mic Off)
export const HandDrawnMicOff: React.FC<HandDrawnIconProps> = ({
  size = 24,
  className = '',
  washColor = '#FECACA',
  strokeColor = '#2B2B2B',
  strokeWidth = 2.4,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    {...props}
  >
    {washColor && (
      <ellipse
        cx="16"
        cy="15"
        rx="9"
        ry="10"
        fill={washColor}
        opacity={0.7}
      />
    )}
    <path
      d="M12.2 7.8 C12.4 5.7, 14 4, 16.2 4 C18.4 4, 20.1 5.7, 20 8 L19.8 13.5"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <path
      d="M12.1 12.8 L12.1 14 C12.1 16.3, 13.7 18.1, 15.9 18.1 C16.9 18.1, 17.8 17.6, 18.5 17"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <path
      d="M8.5 13 C8.2 17.8, 11.5 22.4, 16.1 22.3 C18.2 22.2, 20.1 21.1, 21.5 19.5"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <path
      d="M16 22.5 L15.9 28"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <path
      d="M11.5 28.2 C13.8 27.8, 18.2 28.2, 20.5 27.9"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    {/* Diagonal slash cut through mic */}
    <path
      d="M5.5 5.5 C10.8 11.2, 21.2 21.5, 26.5 26.8"
      stroke={strokeColor}
      strokeWidth={strokeWidth + 0.4}
      strokeLinecap="round"
    />
  </svg>
);

// 5. Hand-drawn Speaker / Audio
export const HandDrawnSpeaker: React.FC<HandDrawnIconProps> = ({
  size = 24,
  className = '',
  washColor = '#BAE6FD', // Sky blue
  strokeColor = '#2B2B2B',
  strokeWidth = 2.4,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    {...props}
  >
    {/* Loose misregistered wash */}
    {washColor && (
      <path
        d="M6 12 L11 12 L17 7 L17 25 L11 20 L6 20 Z"
        fill={washColor}
        opacity={0.85}
        transform="translate(-0.5, 0.5)"
      />
    )}
    {/* Speaker cone and magnet */}
    <path
      d="M6.5 12.2 C6.2 11.9, 10.8 12.1, 11.2 12.1 L17.5 7.2 C18.2 6.6, 18.8 7.2, 18.7 8.2 L18.4 23.9 C18.3 24.9, 17.6 25.3, 16.9 24.7 L11.2 19.8 C10.8 19.8, 6.2 20.1, 5.9 19.8 C5.5 19.4, 5.7 12.8, 6.5 12.2 Z"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Organic sound waves */}
    <path
      d="M22.5 11.5 C24.8 13.2, 25.2 18.5, 22.8 20.8"
      stroke={strokeColor}
      strokeWidth={strokeWidth * 0.9}
      strokeLinecap="round"
    />
    <path
      d="M25.8 8 C29.4 11.2, 29.6 20.8, 25.9 24.2"
      stroke={strokeColor}
      strokeWidth={strokeWidth * 0.9}
      strokeLinecap="round"
    />
  </svg>
);

// 6. Hand-drawn Sparkles / Four-pointed whimsical star
export const HandDrawnSparkle: React.FC<HandDrawnIconProps> = ({
  size = 20,
  className = '',
  washColor = '#FDE68A', // Warm honey yellow
  strokeColor = '#2B2B2B',
  strokeWidth = 2.2,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    {...props}
  >
    {washColor && (
      <path
        d="M14 4 C14.5 9.5, 18.5 13.5, 24 14 C18.5 14.5, 14.5 18.5, 14 24 C13.5 18.5, 9.5 14.5, 4 14 C9.5 13.5, 13.5 9.5, 14 4 Z"
        fill={washColor}
        opacity={0.88}
        transform="translate(1, 1) scale(0.9)"
      />
    )}
    <path
      d="M14 3.5 C14.6 9.2, 18.8 13.3, 24.5 14 C18.8 14.7, 14.6 18.8, 14 24.5 C13.4 18.8, 9.2 14.7, 3.5 14 C9.2 13.3, 13.4 9.2, 14 3.5 Z"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Micro playful ink dots */}
    <circle cx="23" cy="6" r="1.2" fill={strokeColor} />
    <circle cx="5" cy="22" r="1.1" fill={strokeColor} />
  </svg>
);

// 7. Hand-drawn Refresh / Shuffle arrows
export const HandDrawnShuffle: React.FC<HandDrawnIconProps> = ({
  size = 18,
  className = '',
  washColor = '#FED7AA',
  strokeColor = '#2B2B2B',
  strokeWidth = 2.2,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    {...props}
  >
    {washColor && (
      <circle cx="12" cy="12" r="7" fill={washColor} opacity={0.65} />
    )}
    <path
      d="M20 10.5 C19.2 6.5, 15.5 3.8, 11.5 4.5 C7.8 5.2, 4.8 8.6, 4.5 12.5 C4.2 16.5, 7.2 20.2, 11.2 20.5 C14.5 20.8, 18.2 19, 19.8 16"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <path
      d="M20.5 5.5 L20.2 11 L15 10.8"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// 8. Hand-drawn Camera / Polaroid Note icon
export const HandDrawnCameraNote: React.FC<HandDrawnIconProps> = ({
  size = 24,
  className = '',
  washColor = '#DDD6FE', // Soft lilac wash
  strokeColor = '#2B2B2B',
  strokeWidth = 2.4,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    {...props}
  >
    {washColor && (
      <rect
        x="5"
        y="8"
        width="21"
        height="18"
        rx="3"
        fill={washColor}
        opacity={0.8}
        transform="rotate(-2 15 17)"
      />
    )}
    {/* Body of camera / photo card */}
    <path
      d="M6 9.5 C5.8 7.8, 7.2 6.5, 8.8 6.5 L12.5 6.5 L14.2 4.5 C14.8 3.8, 15.8 3.5, 16.8 3.5 L19.2 3.5 C20.2 3.5, 21.2 3.8, 21.8 4.5 L23.5 6.5 L25.5 6.5 C27.2 6.5, 28.5 7.8, 28.3 9.5 L27.8 24.5 C27.6 26.2, 26.2 27.5, 24.5 27.5 L7.8 27.5 C6.1 27.5, 4.8 26.2, 4.9 24.5 Z"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Lens circle */}
    <circle
      cx="16.5"
      cy="16.8"
      r="4.8"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    {/* Flash dot */}
    <circle cx="23.5" cy="10.5" r="1.2" fill={strokeColor} />
  </svg>
);

// 9. Hand-drawn Plus icon
export const HandDrawnPlus: React.FC<HandDrawnIconProps> = ({
  size = 16,
  className = '',
  strokeColor = '#2B2B2B',
  strokeWidth = 2.6,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    {...props}
  >
    <path
      d="M10 4.2 C9.8 8.2, 10.2 11.8, 10.1 15.8"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <path
      d="M4.2 10.1 C8.2 9.9, 11.8 10.2, 15.8 10"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </svg>
);

// 10. Hand-drawn Checkmark
export const HandDrawnCheck: React.FC<HandDrawnIconProps> = ({
  size = 18,
  className = '',
  washColor = '#A7F3D0',
  strokeColor = '#2B2B2B',
  strokeWidth = 2.6,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    {...props}
  >
    {washColor && (
      <ellipse cx="12" cy="13" rx="7" ry="5" fill={washColor} opacity={0.7} />
    )}
    <path
      d="M4.8 12.8 C7.2 14.5, 9.4 16.8, 10.5 18.5 C13.2 14.2, 16.8 9.5, 20.2 6.2"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// 11. Hand-drawn Chevron / Arrow Right
export const HandDrawnChevronRight: React.FC<HandDrawnIconProps> = ({
  size = 18,
  className = '',
  strokeColor = '#2B2B2B',
  strokeWidth = 2.4,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    {...props}
  >
    <path
      d="M9.2 5.5 C12.4 9.1, 15.5 11.5, 16.2 12.2 C15.5 12.9, 12.1 15.6, 8.8 18.5"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// 12. Hand-drawn Arrow Left (Back)
export const HandDrawnArrowLeft: React.FC<HandDrawnIconProps> = ({
  size = 20,
  className = '',
  strokeColor = '#2B2B2B',
  strokeWidth = 2.4,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    {...props}
  >
    <path
      d="M19.5 12.2 L5.5 12"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <path
      d="M11.8 6.2 C9.2 8.5, 6.8 11.2, 5.2 12.1 C6.8 13.1, 9.5 15.8, 11.9 18"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// 13. Hand-drawn Bookmark / Memory Ribbon
export const HandDrawnBookmark: React.FC<HandDrawnIconProps> = ({
  size = 20,
  className = '',
  washColor = '#FBCFE8', // Soft pink wash
  strokeColor = '#2B2B2B',
  strokeWidth = 2.4,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    {...props}
  >
    {washColor && (
      <path
        d="M6 4 L18 4 L18 20 L12 16 L6 20 Z"
        fill={washColor}
        opacity={0.82}
        transform="scale(0.92) translate(1, 1)"
      />
    )}
    <path
      d="M5.8 4.2 C5.6 3.2, 6.5 2.5, 7.5 2.5 L16.5 2.5 C17.5 2.5, 18.3 3.2, 18.2 4.2 L18.1 21.2 C18.1 22.1, 17.1 22.6, 16.4 22.1 L12.2 18.5 C11.9 18.2, 11.4 18.2, 11.1 18.5 L6.8 22.1 C6.1 22.6, 5.2 22.1, 5.2 21.2 Z"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// 14. Hand-drawn Heart
export const HandDrawnHeart: React.FC<HandDrawnIconProps> = ({
  size = 20,
  className = '',
  washColor = '#FCA5A5',
  strokeColor = '#2B2B2B',
  strokeWidth = 2.4,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    {...props}
  >
    {washColor && (
      <path
        d="M12 21 C8 17.5, 3 13, 3 8.5 C3 5.5, 5.5 3, 8.5 3 C10.5 3, 11.5 4, 12 5 C12.5 4, 13.5 3, 15.5 3 C18.5 3, 21 5.5, 21 8.5 C21 13, 16 17.5, 12 21 Z"
        fill={washColor}
        opacity={0.85}
        transform="translate(0.5, 0.5) scale(0.92)"
      />
    )}
    <path
      d="M12 20.8 C8.2 17.4, 3.2 13.1, 3.2 8.6 C3.2 5.5, 5.7 3.2, 8.7 3.2 C10.6 3.2, 11.7 4.2, 12.1 5.1 C12.5 4.2, 13.6 3.2, 15.5 3.2 C18.5 3.2, 21 5.5, 21 8.6 C21 13.1, 16 17.4, 12.2 20.8 Z"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// 15. Hand-drawn Book / Journal (Memories nav)
export const HandDrawnBook: React.FC<HandDrawnIconProps> = ({
  size = 20,
  className = '',
  washColor = '#FED7AA',
  strokeColor = '#2B2B2B',
  strokeWidth = 2.4,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    {...props}
  >
    {washColor && (
      <path
        d="M3 6 C7 5, 11 6, 12 7 C13 6, 17 5, 21 6 L21 19 C17 18, 13 19, 12 20 C11 19, 7 18, 3 19 Z"
        fill={washColor}
        opacity={0.8}
      />
    )}
    <path
      d="M12 7.2 L12 20.5"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <path
      d="M12 7.2 C10.8 6.1, 7.2 5.1, 3.2 6.1 L3.2 19.5 C7.2 18.5, 10.8 19.5, 12 20.5 C13.2 19.5, 16.8 18.5, 20.8 19.5 L20.8 6.1 C16.8 5.1, 13.2 6.1, 12 7.2 Z"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// 16. Hand-drawn Lightbulb / Idea (Topics nav)
export const HandDrawnLightbulb: React.FC<HandDrawnIconProps> = ({
  size = 20,
  className = '',
  washColor = '#FEF08A',
  strokeColor = '#2B2B2B',
  strokeWidth = 2.4,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    {...props}
  >
    {washColor && (
      <circle cx="12" cy="9" r="6" fill={washColor} opacity={0.88} />
    )}
    <path
      d="M8.8 15 C7.2 13.6, 6.2 11.5, 6.2 9.2 C6.2 6, 8.8 3.5, 12 3.5 C15.2 3.5, 17.8 6, 17.8 9.2 C17.8 11.5, 16.8 13.6, 15.2 15 L14.8 18.2 L9.2 18.2 Z"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 21.2 C11.2 21.5, 12.8 21.5, 14 21.2"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </svg>
);

// 17. Hand-drawn Clock (Call duration / log)
export const HandDrawnClock: React.FC<HandDrawnIconProps> = ({
  size = 16,
  className = '',
  washColor = '#E2E8F0',
  strokeColor = '#2B2B2B',
  strokeWidth = 2.2,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    {...props}
  >
    {washColor && <circle cx="10" cy="10" r="7" fill={washColor} opacity={0.7} />}
    <circle
      cx="10"
      cy="10"
      r="8"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <path
      d="M10 6 L9.9 10.2 L13 12"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// 18. Hand-drawn Share icon
export const HandDrawnShare: React.FC<HandDrawnIconProps> = ({
  size = 18,
  className = '',
  washColor = '#BFDBFE',
  strokeColor = '#2B2B2B',
  strokeWidth = 2.4,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    {...props}
  >
    {washColor && (
      <>
        <circle cx="18" cy="6" r="3" fill={washColor} opacity={0.8} />
        <circle cx="6" cy="12" r="3" fill={washColor} opacity={0.8} />
        <circle cx="18" cy="18" r="3" fill={washColor} opacity={0.8} />
      </>
    )}
    <path
      d="M8.5 13.5 L15.5 17"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <path
      d="M15.5 7 L8.5 10.5"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <circle
      cx="18"
      cy="6"
      r="3"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
    />
    <circle
      cx="6"
      cy="12"
      r="3"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
    />
    <circle
      cx="18"
      cy="18"
      r="3"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
    />
  </svg>
);

// 19. Hand-drawn Paper & Pencil Note (FileText)
export const HandDrawnDocument: React.FC<HandDrawnIconProps> = ({
  size = 20,
  className = '',
  washColor = '#FED7AA',
  strokeColor = '#2B2B2B',
  strokeWidth = 2.4,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    {...props}
  >
    {washColor && (
      <rect
        x="4.5"
        y="3"
        width="15"
        height="18"
        rx="2"
        fill={washColor}
        opacity={0.8}
        transform="rotate(-1 12 12)"
      />
    )}
    <path
      d="M5.5 3.5 C5.2 2.8, 6.1 2.2, 7 2.2 L14.5 2.2 L19.2 7 L19.2 20.8 C19.2 21.8, 18.2 22.5, 17.2 22.5 L6.8 22.5 C5.8 22.5, 5 21.8, 5 20.8 Z"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8.5 10.5 L15.5 10.5"
      stroke={strokeColor}
      strokeWidth={strokeWidth * 0.9}
      strokeLinecap="round"
    />
    <path
      d="M8.5 14.5 L13.5 14.5"
      stroke={strokeColor}
      strokeWidth={strokeWidth * 0.9}
      strokeLinecap="round"
    />
  </svg>
);

// 20. Hand-drawn Send paper plane / arrow
export const HandDrawnSend: React.FC<HandDrawnIconProps> = ({
  size = 18,
  className = '',
  washColor = '#FDBA74',
  strokeColor = '#2B2B2B',
  strokeWidth = 2.4,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    {...props}
  >
    {washColor && (
      <path
        d="M3 12 L21 3 L12 21 L10 14 Z"
        fill={washColor}
        opacity={0.85}
        transform="translate(-0.5, 0.5)"
      />
    )}
    <path
      d="M3.2 11.8 L20.8 3.5 L12.2 20.8 L10.1 13.9 Z"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10.1 13.9 L20.5 3.8"
      stroke={strokeColor}
      strokeWidth={strokeWidth * 0.9}
      strokeLinecap="round"
    />
  </svg>
);

// Hand-Drawn Topic Badges (Sun, Sparkle, Cloud, Chili, Palette, Teddy)
export const HandDrawnSun: React.FC<HandDrawnIconProps> = ({
  size = 20,
  className = '',
  washColor = '#FDE047',
  strokeColor = '#2B2B2B',
  strokeWidth = 2.4,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    {...props}
  >
    {washColor && <circle cx="12" cy="12" r="5" fill={washColor} opacity={0.88} />}
    <circle cx="12" cy="12" r="4.8" stroke={strokeColor} strokeWidth={strokeWidth} />
    <path d="M12 2.5 L12 5.5" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
    <path d="M12 18.5 L12 21.5" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
    <path d="M2.5 12 L5.5 12" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
    <path d="M18.5 12 L21.5 12" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
    <path d="M5.5 5.5 L7.5 7.5" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
    <path d="M16.5 16.5 L18.5 18.5" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
  </svg>
);

export const HandDrawnCloud: React.FC<HandDrawnIconProps> = ({
  size = 20,
  className = '',
  washColor = '#CBD5E1',
  strokeColor = '#2B2B2B',
  strokeWidth = 2.4,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    {...props}
  >
    {washColor && (
      <path
        d="M6 18 C3.5 18, 2 16, 2.5 13.5 C3 11, 5 10, 6.5 10.5 C7.5 7.5, 11 6, 14 7.5 C16 6.5, 19 8, 19.5 10.5 C21.5 11, 22.5 13, 21.5 15.5 C20.5 18, 18.5 18, 17 18 Z"
        fill={washColor}
        opacity={0.8}
      />
    )}
    <path
      d="M5.8 17.5 C3.8 17.5, 2.5 15.8, 2.9 13.8 C3.2 11.8, 4.8 10.8, 6.5 11.2 C7.5 8.2, 10.8 6.8, 13.8 8 C15.8 7.2, 18.5 8.5, 19.1 10.8 C21.1 11.2, 22.1 13.1, 21.5 15.2 C20.8 17.5, 18.8 17.5, 17.2 17.5 Z"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const HandDrawnFlame: React.FC<HandDrawnIconProps> = ({
  size = 18,
  className = '',
  washColor = '#F97316',
  strokeColor = '#2B2B2B',
  strokeWidth = 2.2,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    {...props}
  >
    {washColor && (
      <path
        d="M10 2 C10 6, 5 8, 5 12 C5 15.5, 7.5 18, 10 18 C12.5 18, 15 15.5, 15 12 C15 7, 12 5, 10 2 Z"
        fill={washColor}
        opacity={0.85}
        transform="translate(0, 0.5) scale(0.95)"
      />
    )}
    <path
      d="M10 2.2 C10 6.2, 5.2 8.2, 5.2 12.2 C5.2 15.5, 7.5 17.8, 10 17.8 C12.5 17.8, 14.8 15.5, 14.8 12.2 C14.8 7.2, 12.2 5.2, 10 2.2 Z"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 11 C9 12, 8.5 13, 8.5 14 C8.5 15.2, 9.2 16, 10 16 C10.8 16, 11.5 15.2, 11.5 14 C11.5 13, 11 12, 10 11 Z"
      stroke={strokeColor}
      strokeWidth={strokeWidth * 0.9}
      strokeLinecap="round"
    />
  </svg>
);

// Hand-drawn Settings Cog icon
export const HandDrawnSettings: React.FC<HandDrawnIconProps> = ({
  size = 20,
  className = '',
  washColor = '#CBD5E1', // Soft slate wash
  strokeColor = '#2B2B2B',
  strokeWidth = 2.4,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    {...props}
  >
    {washColor && (
      <circle cx="12" cy="12" r="7" fill={washColor} opacity={0.7} />
    )}
    {/* Outer cog outline with wobbly teeth */}
    <path
      d="M10.2 3.5 C10.5 2.8, 13.5 2.8, 13.8 3.5 L14.5 5 C15.5 5.5, 16.5 6.2, 17.2 7 L18.8 6.5 C19.6 6.3, 21.2 8.5, 20.8 9.2 L19.8 10.5 C20.1 11.5, 20.1 12.5, 19.8 13.5 L20.8 14.8 C21.2 15.5, 19.6 17.7, 18.8 17.5 L17.2 17 C16.5 17.8, 15.5 18.5, 14.5 19 L13.8 20.5 C13.5 21.2, 10.5 21.2, 10.2 20.5 L9.5 19 C8.5 18.5, 7.5 17.8, 6.8 17 L5.2 17.5 C4.4 17.7, 2.8 15.5, 3.2 14.8 L4.2 13.5 C3.9 12.5, 3.9 11.5, 4.2 10.5 L3.2 9.2 C2.8 8.5, 4.4 6.3, 5.2 6.5 L6.8 7 C7.5 6.2, 8.5 5.5, 9.5 5 Z"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Inner center hole */}
    <circle
      cx="12"
      cy="12"
      r="3.2"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </svg>
);

// Hand-drawn User Portrait / Photo icon (Me)
export const HandDrawnUser: React.FC<HandDrawnIconProps> = ({
  size = 22,
  className = '',
  washColor = '#FDE047', // Soft warm yellow wash
  strokeColor = '#2B2B2B',
  strokeWidth = 2.4,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    {...props}
  >
    {washColor && (
      <>
        <circle cx="12" cy="7.5" r="4.5" fill={washColor} opacity={0.8} />
        <path
          d="M5 21 C5 16.5, 8 14.5, 12 14.5 C16 14.5, 19 16.5, 19 21 Z"
          fill={washColor}
          opacity={0.8}
        />
      </>
    )}
    {/* Head circle */}
    <circle
      cx="12"
      cy="7.8"
      r="4.2"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    {/* Shoulders / Torso */}
    <path
      d="M4.5 20.8 C4.8 16.2, 8.2 14.5, 12 14.5 C15.8 14.5, 19.2 16.2, 19.5 20.8"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </svg>
);

