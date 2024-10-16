import { useEffect, useRef, useState } from "react";

const SearchableDropdown = ({
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

  const getDisplayValue = () => {
    if (query !== "") return query;
    if (selectedVal) return selectedVal[label];
    return "";
  };

  const getPlaceholder = () => {
    if (query !== "" || !selectedVal) return "";
    return selectedVal[label];
  };

  const filter = (options) => {
    if (!query) return options;
    return options.filter(
      (option) => option[label].toLowerCase().indexOf(query.toLowerCase()) > -1
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      setQuery("");
    }
  };

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
          />
        </div>
        <div className={`arrow ${isOpen ? "open" : ""}`}></div>
      </div>

      <div className={`options ${isOpen ? "open" : ""}`}>
        {filter(options).map((option, index) => {
          return (
            <div
              onClick={() => selectOption(option)}
              className={`option ${
                option[label] === selectedVal ? "selected" : ""
              }`}
              key={`${id}-${index}`}
            >
              {option[label]}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SearchableDropdown;
