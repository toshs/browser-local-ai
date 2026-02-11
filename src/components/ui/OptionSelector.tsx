import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import './OptionSelector.css';

export interface Option {
    value: string;
    label: string;
    description?: string;
}

interface OptionSelectorProps {
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    label?: string;
    className?: string;
}

export const OptionSelector = ({ value, onChange, options, label, className = '' }: OptionSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value) || options[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (val: string) => {
        onChange(val);
        setIsOpen(false);
    };

    return (
        <div className={`option-selector-container ${className}`} ref={containerRef}>
            {label && <label className="selector-label">{label}</label>}

            <div className="selector-trigger" onClick={() => setIsOpen(!isOpen)}>
                <div className="selected-value">
                    <span className="main-label">{selectedOption.label}</span>
                </div>
                <ChevronDown size={14} className={`dropdown-icon ${isOpen ? 'open' : ''}`} />
            </div>

            {isOpen && (
                <div className="selector-dropdown">
                    {options.map((option) => (
                        <div
                            key={option.value}
                            className={`selector-option ${option.value === value ? 'selected' : ''}`}
                            onClick={() => handleSelect(option.value)}
                        >
                            <div className="option-content">
                                <span className="option-label">{option.label}</span>
                                {option.description && (
                                    <span className="option-description">{option.description}</span>
                                )}
                            </div>
                            {option.value === value && <Check size={14} className="check-icon" />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
