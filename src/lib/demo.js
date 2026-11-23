// Presupuestos de ejemplo para probar la app en modo demo
const m = (description, quantity, unit, unit_price) => ({ kind: 'material', description, quantity, unit, unit_price })
const l = (description, quantity, unit, unit_price) => ({ kind: 'mano_obra', description, quantity, unit, unit_price })

export async function seedDemo(backend) {
  const samples = [
    { client_name: 'Club Regina', client_phone: '298 446-1200', description: 'Pintura de vestuarios', status: 'enviado',
      items: [m('Látex interior 20 L', 6, 'u', 98000), m('Fijador sellador 10 L', 2, 'u', 42000), l('Pintura de vestuarios', 160, 'm²', 3600)] },
    { client_name: 'Ana Pérez', client_phone: '298 455-7788', description: 'Pintura de frente', status: 'aceptado',
      items: [m('Látex exterior 20 L', 3, 'u', 112000), m('Enduido exterior 10 kg', 2, 'u', 21000), l('Preparación y 2 manos', 1, 'global', 162000)] },
    { client_name: 'Jorge Ruiz', client_phone: '299 501-2233', description: 'Reparación de humedad', status: 'borrador',
      items: [m('Membrana líquida 10 kg', 1, 'u', 58500), m('Enduido 4 kg', 2, 'u', 9500), l('Picado, sellado y pintura', 1, 'global', 43000)] },
    { client_name: 'María López', client_phone: '299 455-1234', description: 'Pintura living y comedor', status: 'enviado',
      items: [m('Látex interior 20 L', 2, 'u', 98000), m('Enduido 4 kg', 3, 'u', 9500), m('Lija y rodillos', 1, 'u', 15500), l('Preparación y 2 manos (45 m²)', 1, 'global', 145000)] },
  ]
  for (const s of samples) await backend.saveBudget({ ...s, validity_days: 15 })
}
