"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchSkills, TECH_SKILLS, MAX_SKILLS } from "@/lib/skills";

interface SkillsInputProps {
  value: string[];
  onChange: (skills: string[]) => void;
  placeholder?: string;
  maxSkills?: number;
  className?: string;
}

export function SkillsInput({
  value,
  onChange,
  placeholder = "Type to search skills...",
  maxSkills = MAX_SKILLS,
  className,
}: SkillsInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isAtLimit = value.length >= maxSkills;

  useEffect(() => {
    if (inputValue.trim()) {
      const results = searchSkills(inputValue).filter(
        (skill) => !value.includes(skill)
      );
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setHighlightedIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [inputValue, value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function addSkill(skill: string) {
    const normalizedSkill = skill.trim();
    if (!normalizedSkill || value.includes(normalizedSkill) || isAtLimit) return;

    onChange([...value, normalizedSkill]);
    setInputValue("");
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  }

  function removeSkill(skill: string) {
    onChange(value.filter((s) => s !== skill));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        addSkill(suggestions[highlightedIndex]);
      } else if (inputValue.trim() && !isAtLimit) {
        // Allow custom skills not in the list
        addSkill(inputValue);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      // Remove last skill when backspace on empty input
      removeSkill(value[value.length - 1]);
    }
  }

  return (
    <div ref={containerRef} className={cn("space-y-2", className)}>
      <div className="relative">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
          placeholder={isAtLimit ? `Maximum ${maxSkills} skills reached` : placeholder}
          disabled={isAtLimit}
          className={cn(isAtLimit && "bg-muted")}
        />

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
            {suggestions.map((skill, index) => (
              <button
                key={skill}
                type="button"
                onClick={() => addSkill(skill)}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-accent transition-colors",
                  index === highlightedIndex && "bg-accent"
                )}
              >
                <span>{skill}</span>
                {index === highlightedIndex && (
                  <Check className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Skills Chips */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((skill) => (
            <Badge
              key={skill}
              variant="secondary"
              className="gap-1 pr-1 text-sm font-normal"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="ml-1 p-0.5 rounded-full hover:bg-muted-foreground/20 transition-colors"
                aria-label={`Remove ${skill}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Skill Count */}
      <p className="text-xs text-muted-foreground">
        {value.length} of {maxSkills} skills selected
        {value.length === 0 && " - Start typing to search skills"}
      </p>
    </div>
  );
}
