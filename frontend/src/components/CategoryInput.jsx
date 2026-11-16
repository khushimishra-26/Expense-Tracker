import { useId, useState } from "react";

// A text box with a dropdown of suggestions: pick one, or type your own category.
// We draw the list ourselves instead of using <datalist>, because the browser's
// built-in list is drawn by the browser and CSS can't style or align it.
export default function CategoryInput({ label, value, onChange, options, placeholder, required, maxLength }) {
  const id = useId();
  const listId = `${id}-list`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1); // which suggestion is highlighted

  // Show every suggestion when the box is empty or already holds one;
  // otherwise only the suggestions that contain what has been typed.
  const typed = value.trim().toLowerCase();
  const showAll = typed === "" || options.some((o) => o.toLowerCase() === typed);
  const matches = showAll ? options : options.filter((o) => o.toLowerCase().includes(typed));
  const isOpen = open && matches.length > 0;

  function choose(option) {
    onChange(option);
    setOpen(false);
    setActive(-1);
  }

  function handleKeyDown(e) {
    if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Enter" && isOpen && active >= 0) {
      e.preventDefault(); // pick the suggestion instead of submitting the form
      choose(matches[active]);
    } else if ((e.key === "ArrowDown" || e.key === "ArrowUp") && matches.length > 0) {
      e.preventDefault();
      setOpen(true);
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((i) => (i + step + matches.length) % matches.length);
    }
  }

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="combo">
        <input
          id={id}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={isOpen ? listId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={isOpen && active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          required={required}
          maxLength={maxLength}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={handleKeyDown}
        />
        {isOpen && (
          <ul id={listId} role="listbox" className="combo-list">
            {matches.map((option, i) => (
              <li
                key={option}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                // mousedown (not click) so the input keeps focus and doesn't close the list first
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(option);
                }}
              >
                {option}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
