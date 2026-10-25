import { ComercioResumen, Promocion, Rubro } from '@/types/promociones';

const DIA = 24 * 60 * 60 * 1000;
const ahora = Date.now();
const isoEnDias = (dias: number) => new Date(ahora + dias * DIA).toISOString();

export const RUBROS_MOCK: Rubro[] = [
  { id: 'rub-gastronomia', nombre: 'Gastronomía', icono: 'restaurant-outline', color: '#C45B35', orden: 1 },
  { id: 'rub-indumentaria', nombre: 'Indumentaria', icono: 'shirt-outline', color: '#9B4D96', orden: 2 },
  { id: 'rub-hogar', nombre: 'Hogar', icono: 'home-outline', color: '#267D73', orden: 3 },
  { id: 'rub-ferreteria', nombre: 'Ferretería y construcción', icono: 'hammer-outline', color: '#7A5C3E', orden: 4 },
  { id: 'rub-salud', nombre: 'Salud y farmacia', icono: 'medkit-outline', color: '#2B6CB0', orden: 5 },
  { id: 'rub-tecnologia', nombre: 'Tecnología', icono: 'laptop-outline', color: '#4254A6', orden: 6 },
];

export const COMERCIOS_MOCK: ComercioResumen[] = [
  { id: 'com-118', nombre: 'Ferretería El Tornillo', rubroId: 'rub-ferreteria', direccion: '9 de Julio 855' },
  { id: 'com-205', nombre: 'Panadería La Unión', rubroId: 'rub-gastronomia', direccion: 'Urquiza 620' },
  { id: 'com-311', nombre: 'Tienda Jacarandá', rubroId: 'rub-indumentaria', direccion: 'San Martín 945' },
  { id: 'com-404', nombre: 'Farmacia Plaza', rubroId: 'rub-salud', direccion: 'Galarza 1102' },
  { id: 'com-522', nombre: 'Tecno Centro', rubroId: 'rub-tecnologia', direccion: 'Rocamora 740' },
];

// Las fechas son relativas para que siempre existan casos vigentes, próximos,
// por vencer y vencidos durante la demostración del proyecto.
export const PROMOCIONES_MOCK: Promocion[] = [
  {
    id: 'pro-441', comercioId: 'com-118', titulo: '15% en pinturas',
    detalle: 'No acumulable con otras promociones. Hasta agotar stock.',
    descuento: 15, desde: isoEnDias(-5), hasta: isoEnDias(10), imagenUrl: null,
    soloApp: true, usos: 27, activa: true,
  },
  {
    id: 'pro-442', comercioId: 'com-205', titulo: '2 x 1 en facturas',
    detalle: 'Válido de 8 a 11. Máximo dos promociones por persona.',
    descuento: null, desde: isoEnDias(-2), hasta: isoEnDias(2), imagenUrl: null,
    soloApp: false, usos: 58, activa: true,
  },
  {
    id: 'pro-443', comercioId: 'com-311', titulo: '20% en temporada',
    detalle: 'En prendas seleccionadas y abonando por transferencia.',
    descuento: 20, desde: isoEnDias(5), hasta: isoEnDias(20), imagenUrl: null,
    soloApp: true, usos: 0, activa: true,
  },
  {
    id: 'pro-444', comercioId: 'com-404', titulo: '10% en cuidado personal',
    detalle: 'Excepto medicamentos. No acumulable.',
    descuento: 10, desde: isoEnDias(-8), hasta: isoEnDias(1), imagenUrl: null,
    soloApp: false, usos: 19, activa: true,
  },
  {
    id: 'pro-445', comercioId: 'com-522', titulo: 'Accesorio de regalo',
    detalle: 'Con la compra de un teléfono seleccionado.',
    descuento: null, desde: isoEnDias(-1), hasta: isoEnDias(15), imagenUrl: null,
    soloApp: true, usos: 7, activa: true,
  },
  {
    id: 'pro-vencida', comercioId: 'com-118', titulo: 'Promo vencida de prueba',
    detalle: 'Este registro existe para probar que la pantalla no lo muestre.',
    descuento: 30, desde: isoEnDias(-12), hasta: isoEnDias(-1), imagenUrl: null,
    soloApp: false, usos: 40, activa: true,
  },
];

