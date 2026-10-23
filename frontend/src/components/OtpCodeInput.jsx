import { useRef } from 'react'

const OTP_LENGTH = 6

export default function OtpCodeInput({ value, onChange, disabled = false }) {
  const inputRefs = useRef([])
  const digits = value.padEnd(OTP_LENGTH, ' ').slice(0, OTP_LENGTH).split('')

  const commitDigits = (nextDigits) => {
    onChange(nextDigits.join('').replace(/\s/g, '').slice(0, OTP_LENGTH))
  }

  const handleChange = (index, event) => {
    const enteredDigits = event.target.value.replace(/\D/g, '')
    if (!enteredDigits) {
      const nextDigits = [...digits]
      nextDigits[index] = ' '
      commitDigits(nextDigits)
      return
    }

    const nextDigits = [...digits]
    enteredDigits.slice(0, OTP_LENGTH - index).split('').forEach((digit, offset) => {
      nextDigits[index + offset] = digit
    })
    commitDigits(nextDigits)
    inputRefs.current[Math.min(index + enteredDigits.length, OTP_LENGTH - 1)]?.focus()
  }

  const handleKeyDown = (index, event) => {
    if (event.key !== 'Backspace' || digits[index] !== ' ' || index === 0) return
    event.preventDefault()
    const nextDigits = [...digits]
    nextDigits[index - 1] = ' '
    commitDigits(nextDigits)
    inputRefs.current[index - 1]?.focus()
  }

  const handlePaste = (event) => {
    const pastedDigits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pastedDigits) return
    event.preventDefault()
    onChange(pastedDigits)
    inputRefs.current[Math.min(pastedDigits.length, OTP_LENGTH) - 1]?.focus()
  }

  return (
    <div className="otp-inputs" onPaste={handlePaste}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => { inputRefs.current[index] = element }}
          className="otp-input"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          aria-label={index === 0 ? 'Mã xác thực email' : `Chữ số OTP ${index + 1}`}
          value={digit.trim()}
          onChange={(event) => handleChange(index, event)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          maxLength={index === 0 ? OTP_LENGTH : 1}
          disabled={disabled}
          autoFocus={index === 0}
        />
      ))}
    </div>
  )
}
