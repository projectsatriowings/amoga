import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, RotateCcw, ExternalLink, PackageCheck } from 'lucide-react';

/**
 * ReturnPolicyNoticeCard
 * 
 * Shared, highly prominent Returns & Refunds Protection card used across all 4 Amoga storefronts:
 * 1. Wellness Tea (/tea)
 * 2. Heritage Sarees (/sarees)
 * 3. Silver Jewellery (/jewellery)
 * 4. Wholesome Pantry (/food)
 * 
 * Designed with Amoga's signature burgundy & warm gold aesthetic, prominent contrast,
 * clear typography, and a distinct "View Return Policy" link.
 */
export function ReturnPolicyNoticeCard({
  compact = false,
  showAcknowledgement = false,
  returnPolicyAcknowledged = false,
  onAcknowledgeChange,
  className = '',
}) {
  return (
    <div
      role="region"
      aria-label="Returns & Refunds Protection"
      className={`rounded-2xl border-2 border-l-4 p-4 sm:p-5 shadow-sm transition-all ${className}`}
      style={{
        backgroundColor: 'var(--collection-card-bg)',
        borderColor: 'var(--collection-border)',
        borderLeftColor: 'var(--collection-accent)',
        color: 'var(--collection-text)',
      }}
    >
      {/* Header with prominent shield icon & badge */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs"
            style={{
              backgroundColor: 'var(--collection-section-bg)',
              borderColor: 'var(--collection-border)',
              color: 'var(--collection-accent)',
            }}
          >
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3
              className="font-serif font-bold text-sm sm:text-base leading-tight flex items-center gap-1.5"
              style={{ color: 'var(--collection-heading)' }}
            >
              <span>Returns & Refunds Protection</span>
            </h3>
            <span
              className="text-[10px] font-mono block"
              style={{ color: 'var(--collection-text-muted)' }}
            >
              Consumer Safety Assured
            </span>
          </div>
        </div>

        <span
          className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0"
          style={{
            backgroundColor: 'var(--collection-section-bg)',
            borderColor: 'var(--collection-border)',
            color: 'var(--collection-accent)',
          }}
        >
          <PackageCheck className="w-3 h-3" />
          <span>Protected</span>
        </span>
      </div>

      {/* Clear explanatory text */}
      <div className="space-y-1.5 text-xs leading-relaxed" style={{ color: 'var(--collection-text)' }}>
        <p className="font-medium">
          Returns or replacements can be requested for <strong>damaged</strong> or <strong>incorrectly delivered</strong> products.
        </p>
        <p className="text-[11px]" style={{ color: 'var(--collection-text-muted)' }}>
          Provide photos or an unboxing video (if available) under <em>My Orders</em> within the reporting window.
        </p>
      </div>

      {/* Action Row: Distinct View Return Policy CTA */}
      <div
        className="mt-3 pt-2.5 border-t flex flex-wrap items-center justify-between gap-2"
        style={{ borderColor: 'var(--collection-border)' }}
      >
        <span className="text-[10px] font-mono" style={{ color: 'var(--collection-text-muted)' }}>
          Statutory consumer rights apply
        </span>

        <Link
          to="/returns-policy"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all focus:outline-none"
          style={{
            backgroundColor: 'var(--collection-button-bg)',
            color: 'var(--collection-button-text)',
            borderColor: 'var(--collection-border)',
          }}
          title="Opens the full Return Policy in a new tab"
        >
          <span>View Return Policy</span>
          <ExternalLink className="w-3 h-3 shrink-0" />
        </Link>
      </div>

      {/* Optional Acknowledgement Checkbox (used on final Order Review page) */}
      {showAcknowledgement && (
        <label
          className="flex items-start gap-2.5 pt-3 mt-2.5 border-t cursor-pointer select-none group"
          style={{ borderColor: 'var(--collection-border)' }}
        >
          <input
            type="checkbox"
            checked={returnPolicyAcknowledged}
            onChange={(e) => onAcknowledgeChange && onAcknowledgeChange(e.target.checked)}
            className="mt-0.5 rounded cursor-pointer w-4 h-4 shrink-0 transition-all"
            style={{ accentColor: 'var(--collection-accent)' }}
          />
          <span
            className="text-xs font-medium leading-snug transition-colors"
            style={{ color: 'var(--collection-heading)' }}
          >
            I acknowledge the return and replacement terms for damaged or incorrect deliveries.
          </span>
        </label>
      )}
    </div>
  );
}

