import React from 'react';

const SVG = ({
    defaultColors = {},
    color = "#404040",
    strokeColor = "#404040",
    width = 8,
    height = 13,
}) => {
    // Use default colors if none hex color is set
    color = color.startsWith('#') ? color : defaultColors[color];
    return (    
        <svg xmlns="http://www.w3.org/2000/svg" 
            width={width} 
            height={height} 
            viewBox="0 0 8 13">
        <path 
            fill={color} 
            fillRule="evenodd" 
            stroke={strokeColor} 
            stroke-width="1.2" 
            d="M31.7844412,150.044544 L27.2584106,154.774419 C26.9698826,155.075194 26.5029853,155.075194 26.2153385,154.774419 C25.9282205,154.473645 25.9282205,153.985738 26.2153385,153.685148 L30.2201855,149.499908 L26.2160435,145.315405 C25.9282205,145.01463 25.9282205,144.526908 26.2160435,144.226133 C26.5036903,143.924622 26.9705876,143.924622 27.2584106,144.226133 L31.7844412,148.956009 C31.9284408,149.106304 32,149.30283 32,149.499908 C32,149.696986 31.9284408,149.894985 31.7844412,150.044544 Z" transform="matrix(-1 0 0 1 33 -143)"/>
        </svg>
    )
};

export default SVG;