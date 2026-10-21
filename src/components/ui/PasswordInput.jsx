import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Reusable, Accessible Password Input with Show/Hide Toggle
 * Never displays passwords by default.
 * Provides accessible labels and keyboard accessibility.
 */
export const PasswordInput = React.forwardRef(function PasswordInput(
  {
    value,
    onChange,
    placeholder = '••••••••••••',
    required = false,
    className = '',
    iconClassName = '',
    buttonClassName = '',
    name = 'password',
    id,
    autoComplete = 'current-password',
    disabled = false,
    ...rest
  },
  ref
) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative w-full">
      <input
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        name={name}
        id={id}
        autoComplete={autoComplete}
        disabled={disabled}
        className={`w-full pr-10 ${className}`}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        disabled={disabled}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        title={showPassword ? 'Hide password' : 'Show password'}
        className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer rounded-md focus:outline-none focus:ring-1 focus:ring-[#722F37] ${buttonClassName}`}
        tabIndex={0}
      >
        {showPassword ? (
          <EyeOff className={`w-4 h-4 stroke-[1.75] ${iconClassName}`} aria-hidden="true" />
        ) : (
          <Eye className={`w-4 h-4 stroke-[1.75] ${iconClassName}`} aria-hidden="true" />
        )}
      </button>
    </div>
  );
});
