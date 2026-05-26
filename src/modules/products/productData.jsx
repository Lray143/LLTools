// src/modules/products/productData.js
export const INITIAL_GROUPS = [
  {
    id: 'g-astringents', name: 'ASTRINGENTS',
    rows: [
      { id: 'r-a1', caseBarcode: '14809010740028', itemBarcode: '4809010740021', description: 'Hydroquinone + Tretinoin # 3',     qty: 144, size: '30 ml', price: 48.75  },
      { id: 'r-a2', caseBarcode: '14809010740011', itemBarcode: '4809010740014', description: 'Hydroquinone + Tretinoin # 3',     qty: 144, size: '60 ml', price: 77.75  },
      { id: 'r-a3', caseBarcode: '14809010740042', itemBarcode: '4809010740045', description: 'Hydroquinone + Tretinoin # 2',     qty: 144, size: '30 ml', price: 40.50  },
      { id: 'r-a4', caseBarcode: '14809010740035', itemBarcode: '4809010740038', description: 'Hydroquinone + Tretinoin # 2',     qty: 144, size: '60 ml', price: 73.00  },
      { id: 'r-a5', caseBarcode: '14809010740066', itemBarcode: '4809010740069', description: 'Babyface Astringent Solution Care', qty: 144, size: '30 ml', price: 39.00 },
      { id: 'r-a6', caseBarcode: '14809010740059', itemBarcode: '4809010740052', description: 'Babyface Astringent Solution Care', qty: 144, size: '60 ml', price: 68.25 },
      { id: 'r-a7', caseBarcode: '14806517781387', itemBarcode: '4806517781380', description: 'Babyface Serum',                   qty: 144, size: '30ml',  price: 229.25 },
    ],
  },
  {
    id: 'g-creams', name: 'CREAMS',
    rows: [
      { id: 'r-c1', caseBarcode: '14809010740397', itemBarcode: '4809010740298', description: 'Sunblock Cream',         qty: 12,  size: '6g',   price: 16.25  },
      { id: 'r-c2', caseBarcode: '14809010740403', itemBarcode: '4809010740304', description: 'Sunblock Cream',         qty: 12,  size: '12g',  price: 32.50  },
      { id: 'r-c3', caseBarcode: '14809010740526', itemBarcode: '4809010740489', description: 'Sunblock Cream',         qty: 12,  size: '15g',  price: 35.00  },
      { id: 'r-c4', caseBarcode: '14806517780335', itemBarcode: '4806517780338', description: 'Sunblock Cream',         qty: 120, size: '25ml', price: 56.25  },
      { id: 'r-c5', caseBarcode: '14809010740458', itemBarcode: '4809010740359', description: 'Whitening Cream',        qty: 12,  size: '6g',   price: 31.00  },
      { id: 'r-c6', caseBarcode: '14809010740465', itemBarcode: '4809010740366', description: 'Whitening Cream',        qty: 12,  size: '12g',  price: 61.50  },
      { id: 'r-c7', caseBarcode: '14806517780359', itemBarcode: '4809010740352', description: 'Whitening Cream (tube)', qty: 120, size: '25mL', price: 110.00 },
      { id: 'r-c8', caseBarcode: '14809010740509', itemBarcode: '4809010740302', description: 'Placenta Cream',         qty: 12,  size: '20g',  price: 75.75  },
    ],
  },
  {
    id: 'g-toner', name: 'TONER',
    rows: [
      { id: 'r-t1', caseBarcode: '14809010740271', itemBarcode: '4809010740274', description: 'Clarifying Toner', qty: 96, size: '60 ml',  price: 47.25 },
      { id: 'r-t2', caseBarcode: '14809010740288', itemBarcode: '4809010740281', description: 'Clarifying Toner', qty: 72, size: '120 ml', price: 79.25 },
    ],
  },
  {
    id: 'g-soaps', name: 'SOAPS (Regular & Sachet)',
    rows: [
      { id: 'r-s1',  caseBarcode: '14809010710202', itemBarcode: '4809010740205', description: 'Avocado Soap',                      qty: 96,  size: '135g',  price: 44.50 },
      { id: 'r-s2',  caseBarcode: '14809010740189', itemBarcode: '4809010740182', description: 'Bleaching Soap',                     qty: 96,  size: '135g',  price: 83.50 },
      { id: 'r-s3',  caseBarcode: '14809010740226', itemBarcode: '4809010740229', description: 'Kalamansi Soap',                     qty: 96,  size: '135g',  price: 44.50 },
      { id: 'r-s4',  caseBarcode: '14809010740196', itemBarcode: '4809010740199', description: 'Cucumber Soap',                      qty: 96,  size: '135g',  price: 44.50 },
      { id: 'r-s5',  caseBarcode: '14809010740332', itemBarcode: '4809010740463', description: 'Placenta Soap',                      qty: 96,  size: '150g',  price: 83.50 },
      { id: 'r-s6',  caseBarcode: '14809010740219', itemBarcode: '4809010740212', description: 'Papaya Soap',                        qty: 96,  size: '135g',  price: 52.80 },
      { id: 'r-s7',  caseBarcode: '14806517740851', itemBarcode: '4809010740854', description: 'Papaya Soap w/ Milk',                qty: 96,  size: '135g',  price: 52.80 },
      { id: 'r-s8',  caseBarcode: '14806517780991', itemBarcode: '4806517780994', description: 'RDL Papaya Soap',                    qty: 144, size: '90g',   price: 39.00 },
      { id: 'r-s9',  caseBarcode: '14809010740844', itemBarcode: '4809010740847', description: 'Babyskin Whitening Bath Soap',       qty: 96,  size: '135g',  price: 53.00 },
      { id: 'r-s10', caseBarcode: '14809010740264', itemBarcode: '4809010740267', description: 'Tawas Soap',                         qty: 96,  size: '135g',  price: 83.50 },
      { id: 'r-s11', caseBarcode: '14806517780212', itemBarcode: '4806517780215', description: 'Surewhite Soap',                     qty: 118, size: '90g',   price: 66.75 },
      { id: 'r-s12', caseBarcode: '14809010740561', itemBarcode: '4809010740564', description: 'Whitening Soap',                     qty: 96,  size: '150g',  price: 69.00 },
      { id: 'r-s13', caseBarcode: '14809010740691', itemBarcode: '4809010740694', description: 'Papaya Soap Sachets',                qty: 432, size: '25g',   price: 14.75 },
      { id: 'r-s14', caseBarcode: '14809010740998', itemBarcode: '4809010740991', description: 'Papaya Soap with Milk Sachet',       qty: 432, size: '25g',   price: 14.75 },
      { id: 'r-s15', caseBarcode: '14806517781370', itemBarcode: '4806517781373', description: 'Kojic Soap sachet',                  qty: 432, size: '25g',   price: 17.00 },
      { id: 'r-s16', caseBarcode: '14809010740868', itemBarcode: '4809010740861', description: 'Babyskin Bath Soap Sachet',          qty: 432, size: '25g',   price: 14.75 },
      { id: 'r-s17', caseBarcode: '14806517781974', itemBarcode: '4806517781977', description: 'Papaya Whitening Soap 3x Valuepack', qty: 60,  size: '65gms', price: 78.00 },
    ],
  },
  {
    id: 'g-lotion', name: 'LOTION',
    rows: [
      { id: 'r-l1', caseBarcode: '14806517781383', itemBarcode: '4806517781386', description: 'Kojic Whitening Lotion', qty: 108, size: '50ml',  price: 59.50  },
      { id: 'r-l2', caseBarcode: '14806517781356', itemBarcode: '4806517781389', description: 'Kojic Whitening Lotion', qty: 72,  size: '100ml', price: 116.50 },
    ],
  },
]