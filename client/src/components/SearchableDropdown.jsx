import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { splitNameAndLines, subwayLines, SubwayLineSymbol } from "./SubwayLineSymbol";

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
    const { name, lines } = splitNameAndLines(option[label]);
    return { ...option, name, lines };
  }), [options]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("click", handleOutsideClick);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("click", handleOutsideClick);
    };
  }, []);

  const selectOption = (option) => {
    setQuery("");
    handleChange(option);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen((prevIsOpen) => !prevIsOpen);
    setQuery("");
  };
  
  const getPlaceholder = () => {
    if (query !== "" || !selectedVal) return "";
    return selectedVal[label];
  };

  const filter = useCallback((options) => {
    if (!query) return options;
    // If query only contains line characters, return options that include those lines
    const queryWithNoSpaces = query.replace(/\s/g, '');
    const queryCharSet = new Set(queryWithNoSpaces);
    const linesSet = new Set(subwayLines);
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

  const handleOutsideClick = useCallback((e) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setIsOpen(false);
    }
  }, []);

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
      <div className="control">
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
        <div className="arrow-wrapper" onClick={toggleDropdown}>
          <div className={`arrow ${isOpen ? "open" : ""}`}></div>
        </div>
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
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("click", handleOutsideClick);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("click", handleOutsideClick);
    };
  }, []);

  const selectOption = (option) => {
    setQuery("");
    handleChange(option);
    setIsOpen(false);
  };

  const toggleDropdown = (e) => {
    e.stopPropagation(); // Stop event from bubbling up
    setIsOpen((prevIsOpen) => !prevIsOpen);
    setQuery("");
  };

  const handleInputClick = (e) => {
    e.stopPropagation(); // Stop event from bubbling up
    setIsOpen(true);
  };

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
  
  const handleOutsideClick = useCallback((e) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setIsOpen(false);
    }
  }, []);

  const renderedOptions = useMemo(() => {
    return filter(options).map((option, index) => (
      <div
        onClick={() => selectOption(option)}
        className={`option ${option === selectedVal ? "selected" : ""}`}
        key={`${id}-${index}`}
      >
        {option}
      </div>
    ));
  }, [options, selectedVal, id, filter]);

  return (
    <div className="dropdown" ref={dropdownRef}>
      <div className="control">
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
            onClick={handleInputClick}
            className={isOpen && query === "" ? "placeholder" : ""}
            autoComplete="off"
          />
        </div>
        <div className="arrow-wrapper" onClick={toggleDropdown}>
          <div className={`arrow ${isOpen ? "open" : ""}`}></div>
        </div>
      </div>
      <div className={`options ${isOpen ? "open" : ""}`}>
        {renderedOptions}
      </div>
    </div>
  );
};
  

export { SearchableStationDropdown, SearchableStringDropdown };
