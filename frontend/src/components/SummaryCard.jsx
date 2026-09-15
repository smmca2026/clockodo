import React from 'react';

export default function SummaryCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  progressPercent,
  subtitle,
  highlightColor = '#10b981'
}) {
  return (
    <div className="summary-card">
      <div className="summary-card-top">
        <span className="summary-card-title">{title}</span>
        {Icon && (
          <div className="summary-card-icon-box" style={{ color: highlightColor }}>
            <Icon size={18} />
          </div>
        )}
      </div>

      <div className="summary-card-value">{value}</div>

      <div className="summary-card-footer">
        {trend && (
          <span className={`summary-trend ${trend.startsWith('+') ? 'positive' : 'neutral'}`}>
            {trend}
          </span>
        )}
        <span className="summary-context">{trendLabel || subtitle}</span>
      </div>

      {typeof progressPercent === 'number' && (
        <div className="summary-progress-bg">
          <div 
            className="summary-progress-fill" 
            style={{ width: `${Math.min(100, progressPercent)}%` }}
          />
        </div>
      )}
    </div>
  );
}
