import './node_modules/cistercian-numerals/dist/cistercian-numerals.js'

const storageKey = 'cistsaver_settings'

function setClocks(now, timeClock, dateClock) {
  timeClock.value = now.getHours() * 100 + now.getMinutes()
  dateClock.value = (now.getMonth() + 1) * 100 + now.getDate()
}

function onFormInput({ target }) {
  const getValue = t => {
    switch (t.getAttribute('type')) {
      case 'checkbox':
        return t.checked
      case 'number':
      case 'range':
        return Number(t.value)
      default:
        return t.value
    }
  }

  const dispatch = () => {
    target.dispatchEvent(new CustomEvent('setting-changed', {
      detail: { name: target.name, value: getValue(target), fromDom: true},
      bubbles: true
    }))
  }

  setTimeout(dispatch, 0)
  
  persistSettings(target.name, getValue(target))
}

function persistSettings(key, value) {
  const newSettings = Object.assign(
    JSON.parse(localStorage.getItem(storageKey) || '{}'),
    { [key]: value },
  )

  localStorage.setItem(storageKey, JSON.stringify(newSettings))
}

function readSettings(form) {
  const settings = JSON.parse(localStorage.getItem(storageKey) || '{}')
  for(let [name, value] of Object.entries(settings)) {
    form.dispatchEvent(new CustomEvent('setting-changed', {
      detail: { name, value, fromDom: false},
      bubbles: true
    }))
  }
}

function setFormValue(event) {
  const detail = event.detail
  const form = event.target

  if (detail.fromDom) {
    return
  }

  const field = form[detail.name]

  if (!field) {
    console.error(`Cannot set value for ${detail.name} on form`)
    return
  }
}

function applySetting({ target, detail }) {
  const value = detail.value

  switch (detail.name) {
    case 'fg-brightness':
      document.body.style.setProperty('--fg-brightness', `${value}%`)
      break;

    case 'bg-brightness':
      document.body.style.setProperty('--bg-brightness',`${value}%`)
      break;

    case 'nosleep':
      if (!('wakeLock' in navigator)) {
        console.error('wakeLock not supported')
      } else if (value) {
        navigator.wakeLock.request('screen')
          .then(lock => { document.body._wakeLock = lock })
          .catch(err => { console.error(err) })
      } else if (document.body._lock) {
        const lock = document.body._lock
        lock.release()
          .then(() => { document.body._wakeLock = null })
          .catch(err => { console.error(err) })
      }
      break;
  }
}

function toggleFullScreen(goFullScreen) {
  if (goFullScreen) {
    document.documentElement.requestFullscreen()
  } else if (document.fullscreenElement) {
    document.exitFullscreen();
  }
}

function toggleFooter() {
  document.querySelector('footer').classList.toggle('hidden')
}

export default function main() {
  const settingsForm = document.getElementById('settings')
  const timeClock = document.createElement('cistercian-number')
  const dateClock = document.createElement('cistercian-number')
  const yearClock = document.createElement('cistercian-number')
  const now = new Date()

  setClocks(now, timeClock, dateClock)
  yearClock.value = now.getFullYear()

  setTimeout(() => {
    setClocks(new Date(), timeClock, dateClock)
    setInterval(
      () => setClocks(new Date(), timeClock, dateClock),
      60000
    )
  }, 1000 * (60 - now.getSeconds()))

  document.querySelector('.time').append(timeClock)
  document.querySelector('.date').append(dateClock)
  document.querySelector('.date').append(yearClock)

  settingsForm.addEventListener('input', onFormInput)
  settingsForm.addEventListener('setting-changed', setFormValue)
  document.body.addEventListener('setting-changed', applySetting)

  timeClock.addEventListener('dblclick', () => { toggleFullScreen(true) })
  timeClock.addEventListener('click', () => { toggleFullScreen(false) })

  dateClock.addEventListener('click', toggleFooter)
  yearClock.addEventListener('click', toggleFooter)
  document.querySelector('.close').addEventListener('click', toggleFooter)

  readSettings(settingsForm)

  if (!('wakeLock' in navigator)) {
    const checkbox = document.getElementById('nosleep')
    const label = document.querySelector('[for="nosleep"]')

    checkbox.checked = false
    checkbox.disabled = true
    label.innerText += '. (No browser support)'
  }
}