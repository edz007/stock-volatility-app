import React, { useState, useEffect } from 'react';
import { format, subMonths, subYears } from 'date-fns';
import '../styles/DateRangePicker.css';

const DateRangePicker = ({ onDateChange, defaultRange = '6m' }) => {
  const today = new Date();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(format(today, 'yyyy-MM-dd'));
  const [preset, setPreset] = useState(defaultRange);

  // Preset date ranges
  const presets = {
    '1m': { label: '1 Month', months: 1 },
    '3m': { label: '3 Months', months: 3 },
    '6m': { label: '6 Months', months: 6 },
    '1y': { label: '1 Year', years: 1 },
    '2y': { label: '2 Years', years: 2 },
    '5y': { label: '5 Years', years: 5 },
    'custom': { label: 'Custom', custom: true }
  };

  // Set initial start date based on default range
  useEffect(() => {
    handlePresetChange(defaultRange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePresetChange = (presetKey) => {
    setPreset(presetKey);
    
    if (presetKey === 'custom') {
      return;
    }

    const end = new Date();
    let start;

    const presetConfig = presets[presetKey];
    if (presetConfig.months) {
      start = subMonths(end, presetConfig.months);
    } else if (presetConfig.years) {
      start = subYears(end, presetConfig.years);
    }

    const startStr = format(start, 'yyyy-MM-dd');
    const endStr = format(end, 'yyyy-MM-dd');
    
    setStartDate(startStr);
    setEndDate(endStr);
    onDateChange({ start: startStr, end: endStr });
  };

  const handleCustomDateChange = () => {
    if (startDate && endDate) {
      onDateChange({ start: startDate, end: endDate });
    }
  };

  return (
    <div className="date-range-picker">
      <div className="preset-buttons">
        {Object.entries(presets).map(([key, config]) => (
          <button
            key={key}
            className={`preset-button ${preset === key ? 'active' : ''}`}
            onClick={() => handlePresetChange(key)}
          >
            {config.label}
          </button>
        ))}
      </div>

      <div className="custom-date-inputs">
        <div className="date-input-group">
          <label htmlFor="start-date">Start Date:</label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            max={endDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPreset('custom');
            }}
            onBlur={handleCustomDateChange}
          />
        </div>

        <div className="date-input-group">
          <label htmlFor="end-date">End Date:</label>
          <input
            id="end-date"
            type="date"
            value={endDate}
            min={startDate}
            max={format(today, 'yyyy-MM-dd')}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPreset('custom');
            }}
            onBlur={handleCustomDateChange}
          />
        </div>
      </div>
    </div>
  );
};

export default DateRangePicker;

