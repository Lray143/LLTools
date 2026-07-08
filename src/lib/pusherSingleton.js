// src/lib/pusherSingleton.js
// ─────────────────────────────────────────────────────────────────────────────
// A single shared Pusher connection for the entire app.
// Modules bind/unbind their own handlers but never disconnect.
// ─────────────────────────────────────────────────────────────────────────────
import Pusher from 'pusher-js'

let _pusher = null
let _channel = null

export function getPusherChannel() {
  if (!import.meta.env.VITE_PUSHER_KEY) return null

  if (!_pusher) {
    _pusher = new Pusher(import.meta.env.VITE_PUSHER_KEY, {
      cluster: import.meta.env.VITE_PUSHER_CLUSTER,
    })
    _channel = _pusher.subscribe('lltools-updates')
  }

  return _channel
}
