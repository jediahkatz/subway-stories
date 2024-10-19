import { useEffect, useRef, useState, useMemo, useCallback } from "react";

const SearchableStationDropdown = ({
  options,
  label,
  id,
  selectedVal,
  handleChange
}) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const optionsWithLines = useMemo(() => options.map(option => {
    const containsLines = option[label].includes('(');
    if (!containsLines) {
      return { ...option, name: option[label], lines: [] };
    }
    const name = option[label].slice(0, option[label].lastIndexOf('(')).trim();
    const lines = option[label].slice(option[label].lastIndexOf('(') + 1, option[label].lastIndexOf(')')).split(' ') || [];
    return { ...option, name, lines };
  }), [options]);

  useEffect(() => {
    document.addEventListener("click", toggle);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("click", toggle);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const selectOption = (option) => {
    setQuery("");
    handleChange(option);
    setIsOpen(false);
  };

  function toggle(e) {
    if (dropdownRef.current && dropdownRef.current.contains(e.target)) {
      return;
    }
    setIsOpen(e && (e.target === inputRef.current || e.target.classList.contains('arrow')));
    setQuery("");
  }
  
  const getPlaceholder = () => {
    if (query !== "" || !selectedVal) return "";
    return selectedVal[label];
  };

  const filter = useCallback((options) => {
    if (!query) return options;
    // If query only contains line characters, return options that include those lines
    const queryWithNoSpaces = query.replace(/\s/g, '');
    const queryCharSet = new Set(queryWithNoSpaces);
    const linesSet = new Set(Object.keys(lineColors));
    const allCharsAreLines = queryCharSet.isSubsetOf(linesSet);
    if (allCharsAreLines) {
      return optionsWithLines.filter(
        (option) => queryCharSet.isSubsetOf(new Set(option.lines))
      );
    }
    return optionsWithLines.filter(
      (option) => option.name.toLowerCase().indexOf(query.toLowerCase()) > -1
    );
  }, [query, optionsWithLines]);

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      setQuery("");
    }
  };

  const renderOptionContent = useCallback((option) => {
    const name = option.name;
    const lines = option.lines;

    return (
      <>
        {name}
        {lines.map((line, index) => (
          <SubwayLineSymbol key={index} line={line} />
        ))}
      </>
    );
  }, [label]);

  const renderedOptions = useMemo(() => {
    return filter(optionsWithLines).map((option, index) => {
        return (
        <div
            onClick={() => selectOption(option)}
            className={`option ${
            option[label] === selectedVal ? "selected" : ""
            }`}
            key={`${id}-${index}`}
        >
            {renderOptionContent(option)}
        </div>
        );
    });
  }, [options, selectedVal, id, renderOptionContent, filter]);
  
  return (
    <div className="dropdown" ref={dropdownRef}>
      <div className="control" onClick={() => setIsOpen(!isOpen)}>
        <div className="selected-value">
          <input
            ref={inputRef}
            type="text"
            value={isOpen ? query : getPlaceholder()}
            placeholder={getPlaceholder()}
            name="searchTerm"
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onClick={() => setIsOpen(true)}
            className={isOpen && query === "" ? "placeholder" : ""}
            autoComplete="off"
          />
        </div>
        <div className={`arrow ${isOpen ? "open" : ""}`}></div>
      </div>
      <div className={`options ${isOpen ? "open" : ""}`}>
        {renderedOptions}
      </div>
    </div>
  );
};

const SearchableStringDropdown = ({
  options,
  id,
  selectedVal,
  handleChange
}) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    document.addEventListener("click", toggle);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("click", toggle);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const selectOption = (option) => {
    setQuery("");
    handleChange(option);
    setIsOpen(false);
  };

  function toggle(e) {
    if (dropdownRef.current && dropdownRef.current.contains(e.target)) {
      return;
    }
    setIsOpen(e && (e.target === inputRef.current || e.target.classList.contains('arrow')));
    setQuery("");
  }
  
  const getPlaceholder = () => {
    if (query !== "" || !selectedVal) return "";
    return selectedVal;
  };

  const filter = useCallback((options) => {
    if (!query) return options;
    return options.filter(
      (option) => option.toLowerCase().indexOf(query.toLowerCase()) > -1
    );
  }, [query]);
  
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      setQuery("");
    }
  };
  
  const renderedOptions = useMemo(() => {
    return filter(options).map((option, index) => {
        return (
        <div
            onClick={() => selectOption(option)}
            className={`option ${
            option === selectedVal ? "selected" : ""
            }`}
            key={`${id}-${index}`}
        >
            {option}
        </div>
        );
    });
  }, [options, selectedVal, id, filter]);

  return (
    <div className="dropdown" ref={dropdownRef}>
      <div className="control" onClick={() => setIsOpen(!isOpen)}>
        <div className="selected-value">
          <input
            ref={inputRef}
            type="text"
            value={isOpen ? query : getPlaceholder()}
            placeholder={getPlaceholder()}
            name="searchTerm"
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onClick={() => setIsOpen(true)}
            className={isOpen && query === "" ? "placeholder" : ""}
            autoComplete="off"
          />
        </div>
        <div className={`arrow ${isOpen ? "open" : ""}`}></div>
      </div>
      <div className={`options ${isOpen ? "open" : ""}`}>
        {renderedOptions}
      </div>
    </div>
  );
};

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

const SubwayLineSymbol = ({ line }) => {
    const getLineColor = (line) => {
      return lineColors[line] || '#000000'; // Default to black if color not found
    };
  
    const getLineTextColor = (line) => 
      ['N', 'Q', 'R', 'W'].includes(line) 
        ? '#000000' 
        : '#ffffff';
  
    return (
      <span
        style={{
          display: 'inline-block',
          width: '1.5em',
          height: '1.5em',
          borderRadius: '50%',
          backgroundColor: getLineColor(line),
          color: getLineTextColor(line),
          textAlign: 'center',
          fontWeight: 'bold',
          marginLeft: '0.5em',
          fontSize: '0.8em',
          lineHeight: '1.5em',
        }}
      >
        {line}
      </span>
    );
  };
  

export { SearchableStationDropdown, SearchableStringDropdown };
