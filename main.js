import './node_modules/cistercian-numerals/dist/cistercian-numerals.js'

function setClocks(now, timeClock, dateClock) {
  timeClock.value = now.getHours() * 100 + now.getMinutes()
  dateClock.value = (now.getMonth() + 1) * 100 + now.getDate()
}

function onSettingsChanged(evt) {
  switch (evt.target.name) {
    case 'fg-brightness':
      document.body.style.setProperty(
        '--fg-brightness',
        `${evt.target.value}%`
      )
      break;

    case 'bg-brightness':
      document.body.style.setProperty(
        '--bg-brightness',
        `${evt.target.value}%`
      )
      break;

    case 'nosleep':
      if (!('wakeLock' in navigator)) {
        evt.target.setAttribute('disabled', true)
        evt.target.checked = false
        document.querySelector(`label[for="${evt.target.id}"]`).innerText += '. Browser not supported'
        return
      }

      const noSleep = evt.target.checked
      if (noSleep) {
        navigator.wakeLock.request('screen')
          .then(lock => {
            evt.target._lock = lock
          })
          .catch(err => {
            console.error(err)
            evt.target.checked = false
            document.querySelector(`label[for="${evt.target.id}"]`).innerText += '. wakeLock failed ☹'
          })
      } else {
        const lock = evt.target._lock
        if (!lock) {
          console.error('Cannot release the lock: not found')
          return
        }

        lock.release()
      }
      break;
  }
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
    console.log('setting interval')
    setClocks(new Date(), timeClock, dateClock)
    setInterval(
      () => setClocks(new Date(), timeClock, dateClock),
      60000
    )
  }, 1000 * (60 - now.getSeconds()))
  console.log(`timeout in ${1000 * (60 - now.getSeconds())}`)

  document.querySelector('.time').append(timeClock)
  document.querySelector('.date').append(dateClock)
  document.querySelector('.date').append(yearClock)

  settingsForm.addEventListener('input', onSettingsChanged)
  timeClock.addEventListener('click', () => {
    document.querySelector('footer').classList.toggle('hidden')
  })
}