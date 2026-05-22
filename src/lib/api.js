// src/lib/api.js
// Wrapper so React never calls window.electronAPI directly

export const login = (username, password) =>
  window.electronAPI.login({ username, password })