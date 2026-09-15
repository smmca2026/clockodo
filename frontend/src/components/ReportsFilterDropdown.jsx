import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown } from 'lucide-react';

/**
 * Clockify-style Filter Dropdown Component
 * Features:
 * - Search bar with magnifying glass
 * - SHOW Active / All / Inactive status toggle
 * - Select all checkbox
 * - Grouped sections (e.g. GROUPS, USERS, NO CLIENT, etc.)
 * - Without [Entity] option
 * - Custom cyan Clockify checkbox
 * - Clockify cyan scrollbar & diagonal resize grip
 */
export default function ReportsFilterDropdown({
  label,
  displayLabel,
  isOpen,
  onToggle,
  onClose,
  searchPlaceholder = 'Search...',
  hasSearch = true,
  hasShowActive = true,
  isFilterToggleDropdown = false,
  withoutItemLabel = null,
  withoutItemValue = 'without',
  groups = [], // [{ title: 'GROUPS', items: [{ id: '...', name: '...' }] }]
  items = [],  // flat [{ id: '...', name: '...' }] if groups not used
  selectedValues = [], // array of selected ids/values
  onSelectionChange,
  alignRight = false
}) {
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterStatus, setActiveFilterStatus] = useState('Active'); // 'Active' | 'All' | 'Inactive'
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        if (isOpen) onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => {
        if (searchInputRef.current) searchInputRef.current.focus();
      }, 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Reset search when closed
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setShowStatusMenu(false);
    }
  }, [isOpen]);

  // Normalize data into groups
  const normalizedGroups = useMemo(() => {
    let sourceGroups = groups;
    if ((!groups || groups.length === 0) && items && items.length > 0) {
      sourceGroups = [{ title: '', items }];
    }

    if (!searchQuery.trim()) {
      return sourceGroups;
    }

    const q = searchQuery.toLowerCase().trim();
    return sourceGroups
      .map(group => ({
        ...group,
        items: group.items.filter(item => {
          const nameMatch = (item.name || '').toLowerCase().includes(q);
          const subMatch = (item.subtitle || '').toLowerCase().includes(q);
          return nameMatch || subMatch;
        })
      }))
      .filter(group => group.items.length > 0);
  }, [groups, items, searchQuery]);

  // Collect all selectable item IDs (excluding 'without' item for select all)
  const allItemIds = useMemo(() => {
    const ids = [];
    const sourceGroups = groups.length > 0 ? groups : [{ items }];
    sourceGroups.forEach(g => {
      (g.items || []).forEach(i => {
        ids.push(i.id || i.name);
      });
    });
    return ids;
  }, [groups, items]);

  const isAllSelected = allItemIds.length > 0 && allItemIds.every(id => selectedValues.includes(id));
  const isSomeSelected = allItemIds.some(id => selectedValues.includes(id)) && !isAllSelected;

  const handleToggleItem = (itemId) => {
    if (selectedValues.includes(itemId)) {
      onSelectionChange(selectedValues.filter(id => id !== itemId));
    } else {
      onSelectionChange([...selectedValues, itemId]);
    }
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      // Deselect all
      onSelectionChange([]);
    } else {
      // Select all items
      onSelectionChange([...allItemIds]);
    }
  };

  const isWithoutSelected = withoutItemLabel && selectedValues.includes(withoutItemValue);

  // Compute trigger button label
  const buttonLabel = useMemo(() => {
    if (displayLabel) return displayLabel;
    if (isFilterToggleDropdown) return label;

    if (!selectedValues || selectedValues.length === 0) {
      return label;
    }

    if (selectedValues.length === 1) {
      const singleId = selectedValues[0];
      if (singleId === withoutItemValue && withoutItemLabel) {
        return withoutItemLabel;
      }
      // Find item name
      for (const g of groups) {
        const found = g.items?.find(i => (i.id || i.name) === singleId);
        if (found) return found.name;
      }
      const foundFlat = items.find(i => (i.id || i.name) === singleId);
      if (foundFlat) return foundFlat.name;
      return `${label}: ${singleId}`;
    }

    return `${label} (${selectedValues.length})`;
  }, [displayLabel, isFilterToggleDropdown, label, selectedValues, withoutItemValue, withoutItemLabel, groups, items]);

  const hasActiveSelection = !isFilterToggleDropdown && selectedValues.length > 0;

  return (
    <div className="clockify-filter-dropdown-container" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        className={`clockify-filter-pill-btn ${hasActiveSelection ? 'is-active' : ''} ${isOpen ? 'is-open' : ''}`}
        onClick={onToggle}
        title={`Filter by ${label}`}
      >
        <span className="clockify-filter-pill-text">{buttonLabel}</span>
        <ChevronDown size={11} className={`clockify-filter-pill-chevron ${isOpen ? 'rotated' : ''}`} />
      </button>

      {/* Floating Popover */}
      {isOpen && (
        <div className={`clockify-filter-menu-popover ${alignRight ? 'align-right' : ''}`}>
          {/* 1. Optional Search Input */}
          {hasSearch && (
            <div className="clockify-filter-search-row">
              <Search size={13} className="clockify-filter-search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                className="clockify-filter-search-input"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}

          {/* 2. Subheader Bar with SHOW & Active dropdown */}
          {hasShowActive && (
            <div className="clockify-filter-subheader-row">
              <span className="clockify-filter-show-label">SHOW</span>
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="clockify-filter-active-toggle"
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                >
                  <span>{activeFilterStatus}</span>
                  <ChevronDown size={10} />
                </button>

                {showStatusMenu && (
                  <div className="clockify-status-mini-menu">
                    {['Active', 'All', 'Inactive'].map(st => (
                      <button
                        key={st}
                        type="button"
                        className={`clockify-status-mini-item ${activeFilterStatus === st ? 'selected' : ''}`}
                        onClick={() => {
                          setActiveFilterStatus(st);
                          setShowStatusMenu(false);
                        }}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. Items List Container with Cyan Scrollbar */}
          <div className="clockify-filter-scroll-list">
            {/* Case A: FILTER Toggle Dropdown */}
            {isFilterToggleDropdown ? (
              items.map(item => {
                const isChecked = selectedValues.includes(item.id || item.name);
                return (
                  <div
                    key={item.id || item.name}
                    className="clockify-filter-menu-item"
                    onClick={() => handleToggleItem(item.id || item.name)}
                  >
                    <span className={`clockify-custom-checkbox ${isChecked ? 'checked' : ''}`}>
                      {isChecked && (
                        <svg viewBox="0 0 24 24" width="11" height="11" stroke="white" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </span>
                    <span className="clockify-filter-item-name">{item.name}</span>
                  </div>
                );
              })
            ) : (
              /* Case B: Standard Entity Dropdown */
              <>
                {/* Select All Row */}
                {allItemIds.length > 0 && !searchQuery && (
                  <div
                    className="clockify-filter-menu-item select-all-row"
                    onClick={handleSelectAll}
                  >
                    <span className={`clockify-custom-checkbox ${isAllSelected ? 'checked' : isSomeSelected ? 'indeterminate' : ''}`}>
                      {isAllSelected && (
                        <svg viewBox="0 0 24 24" width="11" height="11" stroke="white" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                      {isSomeSelected && !isAllSelected && (
                        <span className="clockify-checkbox-indeterminate-bar" />
                      )}
                    </span>
                    <span className="clockify-filter-item-name">Select all</span>
                  </div>
                )}

                {/* Without [Entity] Row (e.g. Without Client, Without Project, Without group) */}
                {withoutItemLabel && !searchQuery && (
                  <div
                    className="clockify-filter-menu-item without-entity-row"
                    onClick={() => handleToggleItem(withoutItemValue)}
                  >
                    <span className={`clockify-custom-checkbox ${isWithoutSelected ? 'checked' : ''}`}>
                      {isWithoutSelected && (
                        <svg viewBox="0 0 24 24" width="11" height="11" stroke="white" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </span>
                    <span className="clockify-filter-item-name">{withoutItemLabel}</span>
                  </div>
                )}

                {/* Grouped Items List */}
                {normalizedGroups.length === 0 ? (
                  <div className="clockify-filter-empty-msg">
                    No results found for "{searchQuery}"
                  </div>
                ) : (
                  normalizedGroups.map((group, gIdx) => (
                    <div key={group.title || gIdx} className="clockify-filter-group-wrapper">
                      {group.title && (
                        <div className="clockify-filter-group-header">
                          {group.title}
                        </div>
                      )}
                      {group.items.map(item => {
                        const itemId = item.id || item.name;
                        const isChecked = selectedValues.includes(itemId);
                        return (
                          <div
                            key={itemId}
                            className={`clockify-filter-menu-item ${isChecked ? 'is-selected' : ''}`}
                            onClick={() => handleToggleItem(itemId)}
                          >
                            <span className={`clockify-custom-checkbox ${isChecked ? 'checked' : ''}`}>
                              {isChecked && (
                                <svg viewBox="0 0 24 24" width="11" height="11" stroke="white" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              )}
                            </span>
                            <div className="clockify-filter-item-content">
                              {item.color && (
                                <span className="clockify-filter-item-bullet" style={{ backgroundColor: item.color }} />
                              )}
                              <span className="clockify-filter-item-name" title={item.name}>
                                {item.name}
                              </span>
                              {item.subtitle && (
                                <span className="clockify-filter-item-sub">{item.subtitle}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </>
            )}
          </div>

          {/* 4. Clockify Resize Handle at Bottom Right Corner */}
          <div className="clockify-filter-resize-grip" title="Resize handle">
            <svg width="10" height="10" viewBox="0 0 10 10">
              <line x1="8" y1="2" x2="2" y2="8" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="9" y1="5" x2="5" y2="9" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="9" y1="8" x2="8" y2="9" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
