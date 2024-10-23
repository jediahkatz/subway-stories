const lineColors = {
    'A': '#0039a6', 'C': '#0039a6', 'E': '#0039a6',
    'B': '#ff6319', 'D': '#ff6319', 'F': '#ff6319', 'M': '#ff6319',
    'G': '#6cbe45',
    'J': '#996633', 'Z': '#996633',
    'L': '#a7a9ac',
    'N': '#fccc0a', 'Q': '#fccc0a', 'R': '#fccc0a', 'W': '#fccc0a',
    '1': '#ee352e', '2': '#ee352e', '3': '#ee352e',
    '4': '#00933c', '5': '#00933c', '6': '#00933c',
    '7': '#b933ad',
    'S': '#808183',
}

export const subwayLines = Object.keys(lineColors);

export const splitNameAndLines = (nameAndLines) => {
    const containsLines = nameAndLines.includes('(');
    if (!containsLines) {
      return { name: nameAndLines, lines: [] };
    }
    const name = nameAndLines.slice(0, nameAndLines.lastIndexOf('(')).trim();
    const lines = nameAndLines.slice(nameAndLines.lastIndexOf('(') + 1, nameAndLines.lastIndexOf(')')).split(' ') || [];
    return { name, lines };
}
  
export const SubwayLineSymbol = ({ line }) => {
    const getLineColor = (line) => {
        return lineColors[line] || '#000000'; // Default to black if color not found
    };

    const getLineTextColor = (line) => 
        ['N', 'Q', 'R', 'W'].includes(line) 
            ? '#000000' 
            : '#ffffff';

    return (
    <span className="subway-line-symbol"
        style={{
            backgroundColor: getLineColor(line),
            color: getLineTextColor(line),
        }}
    >
        {line}
    </span>
    );
};