import React from 'react';

interface BrandLogoProps {
  className?: string;
  darkMode?: boolean;
  showText?: boolean;
}

export function BrandLogo({ className = 'h-10', darkMode = false, showText = true }: BrandLogoProps) {
  // Brand colors
  const blueColor = '#1a3a6e'; // Deep Blue
  const tealColor = '#0f9b8e'; // Teal
  const greenColor = '#14a381'; // Green-Teal
  const textColor = darkMode ? '#ffffff' : '#111111';
  const subtextColor = darkMode ? '#94a3b8' : '#334155';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={showText ? "0 0 460 190" : "0 0 140 190"}
      className={className}
      fill="none"
    >
      {/* S-Shape Molecular / Network Graph */}
      <g>
        {/* Network connection lines */}
        {/* Top Curve */}
        <line x1="95" y1="45" x2="70" y2="30" stroke={blueColor} strokeWidth="2.5" />
        <line x1="70" y1="30" x2="40" y2="45" stroke={blueColor} strokeWidth="2.5" />
        <line x1="40" y1="45" x2="25" y2="75" stroke={blueColor} strokeWidth="2.5" />
        
        {/* Mid section transition */}
        <line x1="25" y1="75" x2="60" y2="90" stroke={tealColor} strokeWidth="2.5" />
        <line x1="60" y1="90" x2="95" y2="105" stroke={tealColor} strokeWidth="2.5" />
        
        {/* Bottom Curve */}
        <line x1="95" y1="105" x2="110" y2="135" stroke={tealColor} strokeWidth="2.5" />
        <line x1="110" y1="135" x2="85" y2="170" stroke={tealColor} strokeWidth="2.5" />
        <line x1="85" y1="170" x2="55" y2="180" stroke={blueColor} strokeWidth="2.5" />
        <line x1="55" y1="180" x2="25" y2="165" stroke={blueColor} strokeWidth="2.5" />

        {/* Inner track stabilizer connections */}
        <line x1="70" y1="30" x2="70" y2="55" stroke={tealColor} strokeWidth="1.5" strokeDasharray="2 2" />
        <line x1="95" y1="45" x2="70" y2="55" stroke={tealColor} strokeWidth="1.5" />
        <line x1="40" y1="45" x2="45" y2="105" stroke={tealColor} strokeWidth="1.5" />
        <line x1="25" y1="75" x2="45" y2="105" stroke={tealColor} strokeWidth="1.5" />
        <line x1="60" y1="90" x2="70" y2="55" stroke={tealColor} strokeWidth="1.5" />
        
        <line x1="60" y1="90" x2="45" y2="105" stroke={tealColor} strokeWidth="1.5" />
        <line x1="95" y1="105" x2="85" y2="135" stroke={greenColor} strokeWidth="1.5" />
        <line x1="110" y1="135" x2="85" y2="135" stroke={greenColor} strokeWidth="1.5" />
        <line x1="85" y1="170" x2="55" y2="150" stroke={greenColor} strokeWidth="1.5" />
        <line x1="55" y1="180" x2="55" y2="150" stroke={blueColor} strokeWidth="1.5" strokeDasharray="2 2" />
        <line x1="25" y1="165" x2="55" y2="150" stroke={blueColor} strokeWidth="1.5" />
        <line x1="25" y1="165" x2="45" y2="105" stroke={tealColor} strokeWidth="1.5" />

        {/* Outer track node circles */}
        <circle cx="95" cy="45" r="7" fill={tealColor} />
        <circle cx="70" cy="30" r="8" fill={blueColor} />
        <circle cx="40" cy="45" r="7" fill={blueColor} />
        <circle cx="25" cy="75" r="8" fill={blueColor} />
        <circle cx="60" cy="90" r="7" fill={tealColor} />
        <circle cx="95" cy="105" r="7" fill={tealColor} />
        <circle cx="110" cy="135" r="8" fill={greenColor} />
        <circle cx="85" cy="170" r="7" fill={tealColor} />
        <circle cx="55" cy="180" r="8" fill={blueColor} />
        <circle cx="25" cy="165" r="7" fill={blueColor} />

        {/* Inner track helper node circles */}
        <circle cx="70" cy="55" r="5" fill={tealColor} opacity="0.8" />
        <circle cx="45" cy="105" r="5" fill={tealColor} opacity="0.8" />
        <circle cx="85" cy="135" r="5" fill={greenColor} opacity="0.8" />
        <circle cx="55" cy="150" r="5" fill={greenColor} opacity="0.8" />
      </g>

      {/* Brand Text Content */}
      {showText && (
        <g>
          {/* "ync" part */}
          <text
            x="130"
            y="110"
            fontFamily="Inter, system-ui, sans-serif"
            fontWeight="700"
            fontSize="68"
            fill={darkMode ? '#38bdf8' : blueColor}
            letterSpacing="-2"
          >
            ync
          </text>

          {/* "AI" part */}
          <text
            x="255"
            y="110"
            fontFamily="Inter, system-ui, sans-serif"
            fontWeight="900"
            fontSize="78"
            fill={tealColor}
            letterSpacing="-1"
          >
            AI
          </text>

          {/* High-tech circuit star/cog above the AI word */}
          <g>
            <circle cx="355" cy="42" r="8" fill="none" stroke={tealColor} strokeWidth="2.5" />
            <circle cx="355" cy="42" r="3" fill={tealColor} />
            
            {/* Cardinal lines and terminal nodes */}
            <line x1="355" y1="34" x2="355" y2="18" stroke={tealColor} strokeWidth="2" />
            <circle cx="355" cy="18" r="3.5" fill={tealColor} />

            <line x1="355" y1="50" x2="355" y2="66" stroke={tealColor} strokeWidth="2" />
            <circle cx="355" cy="66" r="3.5" fill={tealColor} />

            <line x1="347" y1="42" x2="331" y2="42" stroke={tealColor} strokeWidth="2" />
            <circle cx="331" cy="42" r="3.5" fill={tealColor} />

            <line x1="363" y1="42" x2="379" y2="42" stroke={tealColor} strokeWidth="2" />
            <circle cx="379" cy="42" r="3.5" fill={tealColor} />

            {/* Diagonal lines and terminal nodes */}
            <line x1="349" y1="36" x2="338" y2="25" stroke={blueColor} strokeWidth="1.5" />
            <circle cx="338" cy="25" r="2.5" fill={blueColor} />

            <line x1="361" y1="36" x2="372" y2="25" stroke={blueColor} strokeWidth="1.5" />
            <circle cx="372" cy="25" r="2.5" fill={blueColor} />

            <line x1="349" y1="48" x2="338" y2="59" stroke={blueColor} strokeWidth="1.5" />
            <circle cx="338" cy="59" r="2.5" fill={blueColor} />

            <line x1="361" y1="48" x2="372" y2="59" stroke={blueColor} strokeWidth="1.5" />
            <circle cx="372" cy="59" r="2.5" fill={blueColor} />
          </g>

          {/* "Consultancy Pvt. Ltd." subtext */}
          <text
            x="132"
            y="158"
            fontFamily="Inter, system-ui, sans-serif"
            fontWeight="600"
            fontSize="26"
            fill={textColor}
            letterSpacing="0.2"
          >
            Consultancy Pvt. Ltd.
          </text>
        </g>
      )}
    </svg>
  );
}

/**
 * Returns the raw SVG string for rendering inside non-React environments or exporting.
 */
export function getLogoSvgString(darkMode = false) {
  const blueColor = '#1a3a6e';
  const tealColor = '#0f9b8e';
  const greenColor = '#14a381';
  const textColor = darkMode ? '#ffffff' : '#111111';
  const yncColor = darkMode ? '#38bdf8' : blueColor;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 190" fill="none">
    <g>
      <line x1="95" y1="45" x2="70" y2="30" stroke="${blueColor}" stroke-width="2.5" />
      <line x1="70" y1="30" x2="40" y2="45" stroke="${blueColor}" stroke-width="2.5" />
      <line x1="40" y1="45" x2="25" y2="75" stroke="${blueColor}" stroke-width="2.5" />
      <line x1="25" y1="75" x2="60" y2="90" stroke="${tealColor}" stroke-width="2.5" />
      <line x1="60" y1="90" x2="95" y2="105" stroke="${tealColor}" stroke-width="2.5" />
      <line x1="95" y1="105" x2="110" y2="135" stroke="${tealColor}" stroke-width="2.5" />
      <line x1="110" y1="135" x2="85" y2="170" stroke="${tealColor}" stroke-width="2.5" />
      <line x1="85" y1="170" x2="55" y2="180" stroke="${blueColor}" stroke-width="2.5" />
      <line x1="55" y1="180" x2="25" y2="165" stroke="${blueColor}" stroke-width="2.5" />

      <line x1="70" y1="30" x2="70" y2="55" stroke="${tealColor}" stroke-width="1.5" stroke-dasharray="2 2" />
      <line x1="95" y1="45" x2="70" y2="55" stroke="${tealColor}" stroke-width="1.5" />
      <line x1="40" y1="45" x2="45" y2="105" stroke="${tealColor}" stroke-width="1.5" />
      <line x1="25" y1="75" x2="45" y2="105" stroke="${tealColor}" stroke-width="1.5" />
      <line x1="60" y1="90" x2="70" y2="55" stroke="${tealColor}" stroke-width="1.5" />
      <line x1="60" y1="90" x2="45" y2="105" stroke="${tealColor}" stroke-width="1.5" />
      <line x1="95" y1="105" x2="85" y2="135" stroke="${greenColor}" stroke-width="1.5" />
      <line x1="110" y1="135" x2="85" y2="135" stroke="${greenColor}" stroke-width="1.5" />
      <line x1="85" y1="170" x2="55" y2="150" stroke="${greenColor}" stroke-width="1.5" />
      <line x1="55" y1="180" x2="55" y2="150" stroke="${blueColor}" stroke-width="1.5" stroke-dasharray="2 2" />
      <line x1="25" y1="165" x2="55" y2="150" stroke="${blueColor}" stroke-width="1.5" />
      <line x1="25" y1="165" x2="45" y2="105" stroke="${tealColor}" stroke-width="1.5" />

      <circle cx="95" cy="45" r="7" fill="${tealColor}" />
      <circle cx="70" cy="30" r="8" fill="${blueColor}" />
      <circle cx="40" cy="45" r="7" fill="${blueColor}" />
      <circle cx="25" cy="75" r="8" fill="${blueColor}" />
      <circle cx="60" cy="90" r="7" fill="${tealColor}" />
      <circle cx="95" cy="105" r="7" fill="${tealColor}" />
      <circle cx="110" cy="135" r="8" fill="${greenColor}" />
      <circle cx="85" cy="170" r="7" fill="${tealColor}" />
      <circle cx="55" cy="180" r="8" fill="${blueColor}" />
      <circle cx="25" cy="165" r="7" fill="${blueColor}" />

      <circle cx="70" cy="55" r="5" fill="${tealColor}" opacity="0.8" />
      <circle cx="45" cy="105" r="5" fill="${tealColor}" opacity="0.8" />
      <circle cx="85" cy="135" r="5" fill="${greenColor}" opacity="0.8" />
      <circle cx="55" cy="150" r="5" fill="${greenColor}" opacity="0.8" />
    </g>

    <g>
      <text x="130" y="110" font-family="Inter, system-ui, sans-serif" font-weight="700" font-size="68" fill="${yncColor}" letter-spacing="-2">ync</text>
      <text x="255" y="110" font-family="Inter, system-ui, sans-serif" font-weight="900" font-size="78" fill="${tealColor}" letter-spacing="-1">AI</text>

      <g>
        <circle cx="355" cy="42" r="8" fill="none" stroke="${tealColor}" stroke-width="2.5" />
        <circle cx="355" cy="42" r="3" fill="${tealColor}" />
        <line x1="355" y1="34" x2="355" y2="18" stroke="${tealColor}" stroke-width="2" />
        <circle cx="355" cy="18" r="3.5" fill="${tealColor}" />
        <line x1="355" y1="50" x2="355" y2="66" stroke="${tealColor}" stroke-width="2" />
        <circle cx="355" cy="66" r="3.5" fill="${tealColor}" />
        <line x1="347" y1="42" x2="331" y2="42" stroke="${tealColor}" stroke-width="2" />
        <circle cx="331" cy="42" r="3.5" fill="${tealColor}" />
        <line x1="363" y1="42" x2="379" y2="42" stroke="${tealColor}" stroke-width="2" />
        <circle cx="379" cy="42" r="3.5" fill="${tealColor}" />

        <line x1="349" y1="36" x2="338" y2="25" stroke="${blueColor}" stroke-width="1.5" />
        <circle cx="338" cy="25" r="2.5" fill="${blueColor}" />
        <line x1="361" y1="36" x2="372" y2="25" stroke="${blueColor}" stroke-width="1.5" />
        <circle cx="372" cy="25" r="2.5" fill="${blueColor}" />
        <line x1="349" y1="48" x2="338" y2="59" stroke="${blueColor}" stroke-width="1.5" />
        <circle cx="338" cy="59" r="2.5" fill="${blueColor}" />
        <line x1="361" y1="48" x2="372" y2="59" stroke="${blueColor}" stroke-width="1.5" />
        <circle cx="372" cy="59" r="2.5" fill="${blueColor}" />
      </g>

      <text x="132" y="158" font-family="Inter, system-ui, sans-serif" font-weight="600" font-size="26" fill="${textColor}" letter-spacing="0.2">Consultancy Pvt. Ltd.</text>
    </g>
  </svg>`;
}
