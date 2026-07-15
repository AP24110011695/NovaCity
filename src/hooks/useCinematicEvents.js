import { useEffect } from 'react'

const eventTarget = new EventTarget()

export const triggerCinematicEvent = (eventName, detail = null) => {
  eventTarget.dispatchEvent(new CustomEvent(eventName, { detail }))
}

export const useCinematicEvents = (events) => {
  useEffect(() => {
    const handlers = []

    if (events.onAtmosphereEnter) {
      const handler = (e) => events.onAtmosphereEnter(e.detail)
      eventTarget.addEventListener('onAtmosphereEnter', handler)
      handlers.push({ name: 'onAtmosphereEnter', handler })
    }

    if (events.onLandingStarted) {
      const handler = (e) => events.onLandingStarted(e.detail)
      eventTarget.addEventListener('onLandingStarted', handler)
      handlers.push({ name: 'onLandingStarted', handler })
    }

    if (events.onLandingFinished) {
      const handler = (e) => events.onLandingFinished(e.detail)
      eventTarget.addEventListener('onLandingFinished', handler)
      handlers.push({ name: 'onLandingFinished', handler })
    }

    return () => {
      handlers.forEach(({ name, handler }) => {
        eventTarget.removeEventListener(name, handler)
      })
    }
  }, [events])
}
