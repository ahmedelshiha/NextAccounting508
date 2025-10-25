'use client'
import React from 'react'
import clsx from 'clsx'

type FieldBaseProps = {
  label: string
  containerClassName?: string
  labelHidden?: boolean
  error?: string
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
  error,
  labelHidden = false,
  containerClassName,
  type = 'text',
}: FieldBaseProps & { value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean; type?: string }){
  const inputId = React.useId()
  return (
    <div className={clsx('mb-4', containerClassName)}>
      <label htmlFor={inputId} className={clsx('block text-sm font-medium text-gray-700 mb-1', labelHidden && 'sr-only')}>{label}</label>
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(e)=>onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
      />
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  )
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  disabled = false,
  error,
  labelHidden = false,
  containerClassName,
}: FieldBaseProps & { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; disabled?: boolean }){
  const selectId = React.useId()
  return (
    <div className={clsx('mb-4', containerClassName)}>
      <label htmlFor={selectId} className={clsx('block text-sm font-medium text-gray-700 mb-1', labelHidden && 'sr-only')}>{label}</label>
      <select
        id={selectId}
        value={value}
        onChange={(e)=>onChange(e.target.value)}
        disabled={disabled}
        className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  )
}

export function Toggle({ label, value, onChange, disabled = false }: { label: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean }){
  const id = React.useId()
  const handleClick = () => {
    if (disabled) return
    onChange(!value)
  }

  return (
    <div className="mb-4 flex items-center justify-between">
      <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
      </div>
      <div>
        <button
          id={id}
          type="button"
          onClick={handleClick}
          aria-pressed={value}
          aria-disabled={disabled}
          className={`w-10 h-6 rounded-full transition-colors ${value ? 'bg-blue-600' : 'bg-gray-200'} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <span className={`block w-4 h-4 bg-white rounded-full transform transition-transform ${value ? 'translate-x-4' : 'translate-x-0'}`} />
        </button>
      </div>
    </div>
  )
}

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  disabled = false,
  error,
  labelHidden = false,
  containerClassName,
  step,
}: FieldBaseProps & { value: number; onChange: (v: number) => void; min?: number; max?: number; disabled?: boolean; step?: number }){
  const numberId = React.useId()
  return (
    <div className={clsx('mb-4', containerClassName)}>
      <label htmlFor={numberId} className={clsx('block text-sm font-medium text-gray-700 mb-1', labelHidden && 'sr-only')}>{label}</label>
      <input
        id={numberId}
        type="number"
        value={String(value)}
        onChange={(e)=>onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="block w-40 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
      />
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  )
}
