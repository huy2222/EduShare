import React from 'react'

export default function FormField({
  id,
  label,
  type = 'text',
  placeholder,
  icon,
  helperText,
  action,
  trailingAction,
  autoComplete,
  className = '',
  value,
  onChange,
  required = false,
  minLength,
  maxLength,
  disabled = false,
}) {
  return (
    <div className={`form-field ${className}`.trim()}>
      <div className="form-field__label-row">
        <label htmlFor={id}>{label}</label>
        {action}
      </div>

      <div className="form-field__control">
        <img className="form-field__icon" src={icon} alt="" aria-hidden="true" />
        <input
          id={id}
          name={id}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          required={required}
          minLength={minLength}
          maxLength={maxLength}
          disabled={disabled}
        />
        {trailingAction}
      </div>

      {helperText ? <p className="form-field__helper">{helperText}</p> : null}
    </div>
  )
}
