// Happy Bingo business rule: manager cut is permanently fixed at 20%.
// No Settings control can edit it, and storage cannot persist another value.
const FIXED_MANAGER_CUT = '20'
const FIXED_MANAGER_CUT_NUMBER = 20

const originalGetItem = Storage.prototype.getItem
const originalSetItem = Storage.prototype.setItem
const originalRemoveItem = Storage.prototype.removeItem

Storage.prototype.getItem = function (key) {
  if (key === 'happy-bingo-cut') return FIXED_MANAGER_CUT
  return originalGetItem.call(this, key)
}

Storage.prototype.setItem = function (key, value) {
  if (key === 'happy-bingo-cut') return originalSetItem.call(this, key, FIXED_MANAGER_CUT)
  return originalSetItem.call(this, key, value)
}

Storage.prototype.removeItem = function (key) {
  if (key === 'happy-bingo-cut') return originalSetItem.call(this, key, FIXED_MANAGER_CUT)
  return originalRemoveItem.call(this, key)
}

function isManagerCutInput(target) {
  if (!(target instanceof HTMLInputElement)) return false
  const field = target.closest('.settings-field-real')
  const label = field?.querySelector('label')
  return String(label?.textContent || '').trim() === 'Manager Cut (%)'
}

document.addEventListener('focusin', event => {
  if (!isManagerCutInput(event.target)) return
  const input = event.target
  input.readOnly = true
  input.value = FIXED_MANAGER_CUT
}, true)

document.addEventListener('beforeinput', event => {
  if (!isManagerCutInput(event.target)) return
  event.preventDefault()
  event.stopPropagation()
  event.target.value = FIXED_MANAGER_CUT
}, true)

document.addEventListener('keydown', event => {
  if (!isManagerCutInput(event.target)) return
  event.preventDefault()
  event.stopPropagation()
  event.target.value = FIXED_MANAGER_CUT
}, true)

document.addEventListener('paste', event => {
  if (!isManagerCutInput(event.target)) return
  event.preventDefault()
  event.stopPropagation()
  event.target.value = FIXED_MANAGER_CUT
}, true)

document.addEventListener('drop', event => {
  if (!isManagerCutInput(event.target)) return
  event.preventDefault()
  event.stopPropagation()
  event.target.value = FIXED_MANAGER_CUT
}, true)

document.addEventListener('input', event => {
  if (!isManagerCutInput(event.target)) return
  event.preventDefault()
  event.stopPropagation()
  event.target.value = FIXED_MANAGER_CUT
}, true)

document.addEventListener('change', event => {
  if (!isManagerCutInput(event.target)) return
  event.preventDefault()
  event.stopPropagation()
  event.target.value = FIXED_MANAGER_CUT
}, true)

localStorage.setItem('happy-bingo-cut', FIXED_MANAGER_CUT)

export const MANAGER_CUT_PERCENT = FIXED_MANAGER_CUT_NUMBER
