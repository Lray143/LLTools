const { upsertEmployee } = require('./db.cjs')
const crypto = require('crypto')

const data = [
  { no: "1049", surname: "PILI", first: "TRISHA KARLA", middle: "LIM", pos: "General Manager - DL", note: "" },
  { no: "1028", surname: "ABARQUEZ", first: "RODOLFO", middle: "TIONGSON", pos: "Driver's Assistant", note: "" },
  { no: "1029", surname: "ADOPTANTE", first: "LITO", middle: "VARGAS", pos: "Driver", note: "" },
  { no: "1004", surname: "ARELLANO", first: "CASMELYN", middle: "CABAÑERO", pos: "Accounts Payable", note: "A" },
  { no: "1032", surname: "ARELLANO", first: "DAVID ISRAEL", middle: "BALDOMERO", pos: "Sales Agent", note: "" },
  { no: "1075", surname: "BACUS", first: "DOMINGO JR", middle: "PALENCIA", pos: "Sales Agent", note: "" },
  { no: "1088", surname: "BALEN", first: "JOEWE", middle: "HITAAS", pos: "Warehouse Staff - Packer", note: "" },
  { no: "1078", surname: "BALENTON", first: "PAUL CHRISTIAN", middle: "MAQUERAS", pos: "Sales Agent - Manila Area", note: "S Local" },
  { no: "1094", surname: "BALIOLA", first: "MICHAEL", middle: "SUMANAL", pos: "HR Employee Engagement Specialist", note: "HR" },
  { no: "1097", surname: "BASA", first: "JOVITA", middle: "ROSARIO", pos: "Sales/Promo Coordinator", note: "" },
  { no: "1137", surname: "BENITEZ", first: "BRYAN", middle: "GAMBA", pos: "Driver's Assistant", note: "" },
  { no: "1118", surname: "BIGLANG AWA", first: "CHERRYLYN", middle: "BERAQUIT", pos: "Accounts Receivable Staff", note: "A" },
  { no: "1142", surname: "BOLITO", first: "MARK", middle: "GACUS", pos: "HR Generalist - Main", note: "HR" },
  { no: "1083", surname: "BUNGALEO", first: "MEDY JONNA", middle: "CATAPAS", pos: "Sales/Promo Coordinator", note: "" },
  { no: "1119", surname: "BURGOS", first: "VANESSA", middle: "RAMOS", pos: "Cashier/AR Staff", note: "A" },
  { no: "1034", surname: "CABASE", first: "RENANTE", middle: "LUCERO", pos: "Driver's Assistant", note: "" },
  { no: "1016", surname: "CABERTE", first: "ROY", middle: "BARAN", pos: "Sales Agent", note: "" },
  { no: "1035", surname: "CAÑIZARES", first: "JOMAR", middle: "FLORENCIOS", pos: "General Manager - Driver", note: "ADMIN" },
  { no: "1079", surname: "CEBU", first: "MARK ANTHONY", middle: "LACASA", pos: "Warehouse Staff - Assistant Forklift Operator", note: "Warehouse" },
  { no: "1141", surname: "CHAVEZ", first: "KRISTINE", middle: "ESPERIDA", pos: "Company Nurse", note: "" },
  { no: "1051", surname: "CLEMENTE", first: "AICKER", middle: "DAPITAN", pos: "Utility Personnel", note: "ADMIN" },
  { no: "1140", surname: "COSTADO", first: "CHRISTINE JOY", middle: "MENIL", pos: "Sales Staff", note: "Local" },
  { no: "1018", surname: "DELFINO", first: "LOLITA", middle: "CHUA", pos: "Sales Staff", note: "Local" },
  { no: "1107", surname: "DELOS SANTOS", first: "ANTONY", middle: "RAGA", pos: "Sales/Promo Coordinator", note: "" },
  { no: "1108", surname: "DIEGO", first: "MARICELLE", middle: "ABIOG", pos: "Sales/Promo Coordinator", note: "" },
  { no: "1017", surname: "ELEMINO", first: "EDWIN", middle: "COMETA", pos: "Field Sales OIC", note: "" },
  { no: "1116", surname: "FAJARDO", first: "MA. AGATHA", middle: "DIALOGO", pos: "Sales Staff", note: "LOCAL" },
  { no: "1025", surname: "FERNANDEZ", first: "BIENVENIDO", middle: "CAÑAS", pos: "Driver", note: "" },
  { no: "1036", surname: "FLORENOSOS", first: "PACIANO", middle: "ROMEO", pos: "Driver's Assistant", note: "" },
  { no: "1143", surname: "FLORES", first: "LENNOX CRIS", middle: "—", pos: "Sales Staff", note: "" },
  { no: "1109", surname: "FORONDA", first: "JOCELYN", middle: "RODAS", pos: "Sales/Promo Coordinator", note: "" },
  { no: "1130", surname: "GABALONZO", first: "LEO MARK", middle: "SUVA", pos: "Driver's Assistant", note: "SL" },
  { no: "1127", surname: "GAN", first: "JOHN YUSOF", middle: "—", pos: "Driver/ Driver's Assistant", note: "SL" },
  { no: "1125", surname: "GARCIA", first: "JOFFER", middle: "LAZARO", pos: "Accounts Receivable Staff", note: "A" },
  { no: "1110", surname: "GARCIA", first: "RUFINA MARIVIC", middle: "ALBO", pos: "Sales/Promo Coordinator", note: "SL" },
  { no: "1134", surname: "GARFERIO", first: "APRIL", middle: "MONTOYA", pos: "Warehouse Packer", note: "" },
  { no: "1066", surname: "GATURIAN", first: "RUEL", middle: "ESPEDILLA", pos: "Driver", note: "" },
  { no: "1081", surname: "GERONIMO", first: "MA. JENOVAEE", middle: "MORILLA", pos: "Sales Agent - Manila Area", note: "SL" },
  { no: "1121", surname: "GLORIA", first: "GRACE", middle: "DAYON", pos: "Sales Staff", note: "LOCAL" },
  { no: "1038", surname: "GONZAGA", first: "MARIETTA", middle: "RESERVA", pos: "Warehouse Supervisor", note: "" },
  { no: "1124", surname: "GUERRERO", first: "KRIZIA", middle: "ALBAÑA", pos: "Junior Accounting Supervisor", note: "A" },
  { no: "1040", surname: "HOYLE", first: "ARNOLD", middle: "CRENCIA", pos: "Driver - Whiteplains", note: "ADMIN" },
  { no: "1069", surname: "HOYLE", first: "JONATHAN", middle: "GODIANO", pos: "Driver - Delivery/Whiteplains", note: "ADMIN" },
  { no: "1019", surname: "HOYLE", first: "RENATO", middle: "BAYRON", pos: "Driver", note: "" },
  { no: "1020", surname: "HOYLE", first: "ROLANDO", middle: "BAYRON", pos: "Driver", note: "" },
  { no: "1021", surname: "IBAÑEZ", first: "RODRIGO", middle: "SAJETARIOS", pos: "Driver", note: "" },
  { no: "1132", surname: "JAYSON", first: "JOHNREY", middle: "LAO", pos: "Sales/Promo Coordinator", note: "" },
  { no: "1022", surname: "KEMPIS", first: "ROWENA", middle: "ATIENZA", pos: "Key Accounts Specialist", note: "SL" },
  { no: "1131", surname: "LAPUT", first: "JOMEL", middle: "SAMSON", pos: "Driver", note: "SL" },
  { no: "1041", surname: "LEGASPI", first: "LOLITO", middle: "BOOC", pos: "Sales Agent", note: "" },
  { no: "1139", surname: "LIM III", first: "ALEXANDER", middle: "PLAZA", pos: "Quality Assurance Officer", note: "" },
  { no: "1111", surname: "LLARINAS", first: "CHERIE GIL", middle: "GAMAZON", pos: "Sales/Promo Coordinator", note: "" },
  { no: "1074", surname: "LLOREN", first: "SERNAN", middle: "BASILISCO", pos: "Driver's Assistant", note: "" },
  { no: "1138", surname: "MALLANAO", first: "MARJUN", middle: "SUMAYAN", pos: "Inventory Staff", note: "A" },
  { no: "1115", surname: "MANGOMPIT", first: "REGELINE MAE", middle: "LABORTE", pos: "Accounts Receivable Staff", note: "A" },
  { no: "1091", surname: "MANLAPAZ", first: "MARK", middle: "DOJO", pos: "Sales Agent", note: "" },
  { no: "1089", surname: "MARTINEZ", first: "RONALD", middle: "GARCIA", pos: "Driver", note: "" },
  { no: "1133", surname: "MATALANG", first: "JHIMEN", middle: "CASTRO", pos: "HR Promo Coordinator - Luzon", note: "HR" },
  { no: "1095", surname: "MAUYAO", first: "JUNAFEL", middle: "SECRETO", pos: "Executive Secretary/Liason Personnel GM/OM", note: "ADMIN" },
  { no: "1136", surname: "MERCADO", first: "EMMANUEL LOIS", middle: "BILO", pos: "Driver's Assistant", note: "" },
  { no: "1082", surname: "NADONZA", first: "ANTONETTE", middle: "BANDIVAS", pos: "Sales/Promo Coordinator", note: "" },
  { no: "1123", surname: "NATIVIDAD", first: "MARY MEDIATRIX", middle: "FETALINO", pos: "Accounts Payable Staff", note: "A" },
  { no: "1042", surname: "NAVAJA", first: "MARLOU", middle: "BALBUENA", pos: "Driver's Assistant", note: "" },
  { no: "1007", surname: "OMEGA", first: "RUBILYN", middle: "ABELLANOSA", pos: "Senior Accounting Supervisor", note: "A" },
  { no: "1113", surname: "ORDOÑO", first: "AURORA GRACE", middle: "QUILATON", pos: "Sales/Promo Coordinator", note: "" },
  { no: "1064", surname: "PADRE", first: "ALEJO", middle: "AGAO", pos: "Mechanic Officer In Charge", note: "ADMIN" },
  { no: "1117", surname: "PAJOYO", first: "JOE XAVIER", middle: "ARAGON", pos: "Driver", note: "" },
  { no: "1056", surname: "PALA", first: "SHEENA MAE", middle: "TAGBACAOLA", pos: "Warehouse Inventory Staff", note: "" },
  { no: "1055", surname: "PANGAN", first: "EDWARD JOHN", middle: "GABALONZO", pos: "I.T Staff/Marketing Specialist", note: "ADMIN" },
  { no: "1003", surname: "PANGAN", first: "IZYL", middle: "LLEVAREZ", pos: "HR Supervisor", note: "HR" },
  { no: "1023", surname: "PANTORILLA", first: "RENATO", middle: "CAYTOR", pos: "Driver's Assistant", note: "" },
  { no: "1024", surname: "PEDEGLORIA", first: "ALBERTO", middle: "LUCILA", pos: "Sales Agent", note: "" },
  { no: "1026", surname: "PERAAN", first: "DARIEL", middle: "PALAPAR", pos: "Key Accounts Specialist", note: "" },
  { no: "1135", surname: "PEREZ", first: "CLARISSE AMY", middle: "TORCEDO", pos: "Accounts Receivable Staff", note: "A" },
  { no: "1144", surname: "SALIPOT", first: "ALION", middle: "YTAC", pos: "Warehouse Staff - Packer", note: "" },
  { no: "1129", surname: "SALVADOR", first: "MC JETBROS AVANT", middle: "VISITACION", pos: "Inventory Staff", note: "A" },
  { no: "1009", surname: "SANTIAGO", first: "JANET", middle: "POLINAR", pos: "Sales - OIC", note: "S LOCAL" },
  { no: "1114", surname: "SARDON", first: "ARMIE", middle: "SEVILLO", pos: "Sales/Promo Coordinator", note: "" },
  { no: "1122", surname: "TACAISAN", first: "RONALD", middle: "GREGORIO", pos: "Driver", note: "" },
  { no: "1045", surname: "TORRES", first: "PAUL GENESIS", middle: "TOBIAS", pos: "Warehouse Staff - Forklift Operator", note: "" },
  { no: "1011", surname: "VAILOCES", first: "ROSE ANN", middle: "SERRANO", pos: "Secretary/Liason Personnel DL", note: "ADMIN" },
  { no: "1048", surname: "VILLANUEVA", first: "BRIAN", middle: "SAPASAP", pos: "Driver's Assistant", note: "" },
  { no: "1060", surname: "ZAFRA", first: "KENNETH", middle: "ISAIAS", pos: "Accounts Receivable Officer", note: "A" }
];

async function seed() {
  console.log('Seeding 83 employees...')
  for (const row of data) {
    let dept = null
    const note = row.note.trim().toUpperCase()
    if (note === 'A') dept = 'Accounting'
    else if (note.includes('LOCAL') || note === 'SL' || note === 'S LOCAL') dept = 'Sales'
    else if (note === 'ADMIN') dept = 'Admin'
    else if (note === 'HR') dept = 'Admin'
    else if (note === 'WAREHOUSE') dept = 'Warehouse'

    const middle = row.middle === '—' ? '' : row.middle
    const name = `${row.first} ${middle ? middle + ' ' : ''}${row.surname}`.trim()
    const formattedName = name.replace(/\s+/g, ' ')
    
    try {
      await upsertEmployee({
        id: crypto.randomUUID(),
        employee_no: row.no,
        name: formattedName,
        position: row.pos,
        department: dept
      })
      console.log(`Inserted ${formattedName} as ${row.no} in ${dept || 'None'}`)
    } catch (err) {
      if (err.message && err.message.includes('UNIQUE constraint failed')) {
        console.warn(`Skipped ${formattedName} (ID ${row.no} already exists)`)
      } else {
        throw err
      }
    }
  }
  console.log('Done!')
  require('electron').app.quit()
}

require('electron').app.whenReady().then(() => {
  seed().catch(console.error)
})
