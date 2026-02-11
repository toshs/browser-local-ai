import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import './LanguageSelector.css';

interface Language {
    code: string;
    name: string;
}

interface LanguageSelectorProps {
    value: string;
    onChange: (value: string) => void;
    options: Language[];
    placeholder?: string;
    suffix?: string;
    className?: string;
}

export const LanguageSelector = ({
    value,
    onChange,
    options,
    placeholder = 'Select',
    suffix,
    className = ''
}: LanguageSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const selectedOption = options.find(opt => opt.code === value);

    // Quick look up for filtering
    const filteredOptions = options.filter(opt =>
        opt.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search input when opening
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    const handleSelect = (code: string) => {
        onChange(code);
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <div className={`custom-select-container ${className}`} ref={containerRef}>
            <button
                className={`custom-select-trigger ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                type="button"
            >
                <span className="language-selected-value text-ellipsis">
                    {selectedOption ? (
                        <>
                            {selectedOption.name}
                            {suffix && <span className="selector-suffix"> ({suffix})</span>}
                        </>
                    ) : placeholder}
                </span>
                <ChevronDown size={14} className={`dropdown-arrow ${isOpen ? 'rotated' : ''}`} />
            </button>

            {isOpen && (
                <div className="custom-select-dropdown">
                    <div className="select-search-container">
                        <Search size={14} className="search-icon" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            className="select-search-input"
                            placeholder="Search language..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <div className="select-options-list">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(option => (
                                <button
                                    key={option.code}
                                    className={`select-option ${value === option.code ? 'selected' : ''}`}
                                    onClick={() => handleSelect(option.code)}
                                    type="button"
                                >
                                    <span>{option.name}</span>
                                    {value === option.code && <Check size={14} className="check-icon" />}
                                </button>
                            ))
                        ) : (
                            <div className="no-options">No languages found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
