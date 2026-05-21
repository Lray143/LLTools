export const EMPLOYEES = [
  "Ana Santos", "Rico Dela Cruz", "Gina Flores",
  "Ben Castillo", "Lita Mendoza", "Jun Ramos",
]

export const RECENT_VISITS = [
  { date: "May 15", month: "May", employee: "Rico D.", fullName: "Rico Dela Cruz", complaint: "Headache", disposition: "Back to work", bp: "118/76", temp: "36.5", treatment: "Advised rest and hydration. Paracetamol 500mg given for pain relief. Monitored for 30 minutes before returning to workstation.", time: "09:15 AM" },
  { date: "May 14", month: "May", employee: "Ana S.", fullName: "Ana Santos", complaint: "Stomach pain", disposition: "Sent home", bp: "110/70", temp: "37.1", treatment: "Patient reported sharp abdominal pain. Antacid administered. Advised to rest at home and consult a physician if pain persists beyond 24 hours.", time: "02:30 PM" },
  { date: "May 13", month: "May", employee: "Jun R.", fullName: "Jun Ramos", complaint: "Wound care", disposition: "Back to work", bp: "122/80", temp: "36.8", treatment: "Laceration on left forearm cleaned with antiseptic solution. Wound dressed with sterile gauze. Tetanus status verified. Follow-up dressing scheduled.", time: "10:45 AM" },
  { date: "May 12", month: "May", employee: "Lita M.", fullName: "Lita Mendoza", complaint: "BP monitoring", disposition: "Monitoring", bp: "148/95", temp: "36.6", treatment: "Elevated BP noted. Patient advised to sit and rest. BP re-checked after 15 minutes — remained elevated. Referred to company physician for further evaluation.", time: "08:00 AM" },
  { date: "May 10", month: "May", employee: "Gina F.", fullName: "Gina Flores", complaint: "Fever", disposition: "Referred", bp: "115/75", temp: "38.9", treatment: "High-grade fever recorded. Paracetamol 500mg given. Patient monitored for one hour with no improvement. Referred to nearest hospital for further workup.", time: "11:20 AM" },
  { date: "Apr 28", month: "Apr", employee: "Ben C.", fullName: "Ben Castillo", complaint: "Back pain", disposition: "Back to work", bp: "120/78", temp: "36.4", treatment: "Muscle strain on lower back. Applied hot compress. Advised stretching exercises and proper posture. Ibuprofen 400mg given.", time: "03:00 PM" },
  { date: "Apr 22", month: "Apr", employee: "Rico D.", fullName: "Rico Dela Cruz", complaint: "Eye strain", disposition: "Back to work", bp: "116/74", temp: "36.3", treatment: "Complaints of eye fatigue from prolonged screen use. Advised 20-20-20 rule. Artificial tears eye drops applied. Recommended ergonomic screen setup.", time: "01:15 PM" },
  { date: "Apr 15", month: "Apr", employee: "Ana S.", fullName: "Ana Santos", complaint: "Dizziness", disposition: "Sent home", bp: "100/65", temp: "36.7", treatment: "Patient felt lightheaded. Low BP noted. Given ORS and crackers. Rested for 45 minutes. Condition did not fully resolve; sent home for rest.", time: "10:00 AM" },
  { date: "Mar 30", month: "Mar", employee: "Gina F.", fullName: "Gina Flores", complaint: "Allergic reaction", disposition: "Monitoring", bp: "112/72", temp: "37.0", treatment: "Skin rash noted on forearms. Antihistamine given. Monitored for 1 hour. Advised to avoid triggering substance and report to dermatologist.", time: "02:00 PM" },
  { date: "Mar 18", month: "Mar", employee: "Ben C.", fullName: "Ben Castillo", complaint: "Chest tightness", disposition: "Referred", bp: "135/88", temp: "36.9", treatment: "Patient complained of tightness in chest. ECG done on-site; results borderline. Immediately referred to nearest hospital for further cardiac evaluation.", time: "08:45 AM" },
  { date: "Feb 25", month: "Feb", employee: "Lita M.", fullName: "Lita Mendoza", complaint: "Migraine", disposition: "Sent home", bp: "130/85", temp: "36.5", treatment: "Severe migraine reported, sensitivity to light. Darkened room provided. Paracetamol given. No improvement after 45 min; sent home to rest.", time: "10:30 AM" },
  { date: "Feb 12", month: "Feb", employee: "Jun R.", fullName: "Jun Ramos", complaint: "Sprained ankle", disposition: "Back to work", bp: "118/76", temp: "36.4", treatment: "Grade 1 ankle sprain. RICE method applied (rest, ice, compression, elevation). Elastic bandage wrapped. Light duty work advised for 3 days.", time: "03:45 PM" },
  { date: "Jan 20", month: "Jan", employee: "Rico D.", fullName: "Rico Dela Cruz", complaint: "Cough & colds", disposition: "Back to work", bp: "116/74", temp: "37.3", treatment: "Upper respiratory symptoms. No fever. Cetirizine given for rhinitis. Advised to wear mask, increase fluid intake, and monitor temperature.", time: "09:00 AM" },
  { date: "Jan 08", month: "Jan", employee: "Ana S.", fullName: "Ana Santos", complaint: "Nausea", disposition: "Sent home", bp: "108/68", temp: "36.8", treatment: "Patient complained of persistent nausea and vomiting. Oral rehydration solution given. No improvement after rest period. Sent home with advice to consult doctor.", time: "11:00 AM" },
]

export const DISP_CLASS = {
  "Back to work": "text-green-600",
  "Sent home":    "text-blue-600",
  "Monitoring":   "text-orange-500",
  "Referred":     "text-red-500",
}

export const ALL_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]