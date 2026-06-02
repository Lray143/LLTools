// ── Outlet color palette (matches employee card style) ────────────
export const OUTLET_COLORS = [
  'bg-red-500',     'bg-orange-500',  'bg-amber-500',   'bg-yellow-500',
  'bg-lime-600',    'bg-green-500',   'bg-emerald-500', 'bg-teal-500',
  'bg-cyan-600',    'bg-sky-500',     'bg-blue-500',    'bg-indigo-500',
  'bg-violet-500',  'bg-purple-500',  'bg-fuchsia-500', 'bg-pink-500',
  'bg-rose-500',
]

export const getOutletColor = (name = '') => {
  let hash = 0
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return OUTLET_COLORS[Math.abs(hash) % OUTLET_COLORS.length]
}

// Standard PH region short-names — used as datalist suggestions in the modal
export const PH_REGION_SUGGESTIONS = [
  'NCR', 'CAR',
  'Region I', 'Region II', 'Region III',
  'Region IV-A', 'Region IV-B',
  'Region V', 'Region VI', 'Region VII', 'Region VIII',
  'Region IX', 'Region X', 'Region XI', 'Region XII', 'Region XIII',
  'BARMM',
]

export const DISCOUNT_PRESETS = [
  { name: 'Senior Citizen', value: 20 },
  { name: 'PWD',            value: 20 },
  { name: 'Employee',       value: 15 },
  { name: 'VIP',            value: 10 },
]