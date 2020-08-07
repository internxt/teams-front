import React from 'react';

const SVG = ({
    defaultColors = {},
    width = 25,
    height = 20,
}) => {
    return (    
        <svg xmlns="http://www.w3.org/2000/svg" 
            width={width} 
            height={height} 
            viewBox="0 0 25 20">
            <g fill="none" 
                fillRule="evenodd" 
                transform="translate(.668 .59)">
                <path fill="#4385F4" d="M22.6031441,1.89051292 C23.2684476,1.89051292 23.8083136,2.43972803 23.8083136,3.11721921 L23.8083136,10.6532106 L23.8083136,18.2917325 C23.8083136,18.6867478 23.4936339,19.0073191 23.105457,19.0073191 L0.702856593,19.0073191 C0.31523485,19.0073191 1.13686838e-12,18.6869401 1.13686838e-12,18.2917325 L1.13686838e-12,10.6532106 L1.13686838e-12,3.11721921 C1.13686838e-12,3.08998796 0.000870274954,3.06296541 0.0025840371,3.03617874 C0.000870258117,3.00941113 1.13686838e-12,2.98240929 1.13686838e-12,2.95520049 L1.13686838e-12,1.2263487 C1.13686838e-12,0.548812867 0.539641695,0 1.20532346,0 L6.73078106,0 C7.21437178,0 7.63110366,0.289411867 7.82315374,0.70719206 C7.82358501,0.703814887 8.02667835,1.06584246 8.11602335,1.18728016 C8.21809724,1.32601897 8.20943063,1.34768694 8.38795699,1.52102729 C8.58477558,1.71212851 8.63312625,1.73238101 8.72372626,1.77798022 C8.76029854,1.79638714 8.83415777,1.83881733 8.95120827,1.85881441 C9.06608717,1.87844049 9.20420647,1.88698686 9.28398193,1.89051292 L22.6031441,1.89051292 Z"/>
                <path fill="#F7F7F9" d="M12.5258081,9.93181818 L12.5258081,7.10329865 C12.5258081,6.83164668 12.3161586,6.62121212 12.0575428,6.62121212 L11.138398,6.62121212 C10.8687226,6.62121212 10.6701328,6.83704961 10.6701328,7.10329865 L10.6701328,9.93181818 L7.89558823,9.93181818 C7.62912003,9.93181818 7.42270108,10.1455461 7.42270108,10.4091929 L7.42270108,11.3462184 C7.42270108,11.62114 7.63441987,11.8235931 7.89558823,11.8235931 L10.6701328,11.8235931 L10.6701328,14.6521126 C10.6701328,14.9237646 10.8797823,15.1341991 11.138398,15.1341991 L12.0575428,15.1341991 C12.3272183,15.1341991 12.5258081,14.9183616 12.5258081,14.6521126 L12.5258081,11.8235931 L15.3003526,11.8235931 C15.5668208,11.8235931 15.7732398,11.6098651 15.7732398,11.3462184 L15.7732398,10.4091929 C15.7732398,10.1342712 15.561521,9.93181818 15.3003526,9.93181818 L12.5258081,9.93181818 L12.5258081,9.93181818 L12.5258081,9.93181818 L12.5258081,9.93181818 Z"/>
            </g>
        </svg>
    )
};

export default SVG;