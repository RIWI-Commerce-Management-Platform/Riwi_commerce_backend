/**
 * Demo data for the defense (HU-42): 20 fictitious clients in Barranquilla
 * and its metropolitan area, 3 advisors and 4 routes. Names and NITs are
 * made up; addresses and coordinates are approximate real neighborhoods.
 */

export interface DemoClient {
  nit: string;
  businessName: string;
  commercialName: string;
  address: string;
  neighborhood: string;
  municipality: string;
  zone: string;
  latitude: number;
  longitude: number;
  contact: { name: string; position: string; mobile: string };
}

export const DEMO_ZONES = {
  north: 'Barranquilla Norte',
  south: 'Barranquilla Sur',
  soledad: 'Soledad',
  malambo: 'Malambo',
  galapa: 'Galapa',
} as const;

export const DEMO_ADMIN = {
  name: 'Demo Admin',
  email: 'admin@demo.comercial360.co',
};

export const DEMO_DIRECTOR = {
  name: 'Diana Rojas',
  email: 'director@demo.comercial360.co',
  zone: DEMO_ZONES.north,
};

export const DEMO_ADVISORS = [
  {
    name: 'Laura Martinez',
    email: 'laura.martinez@demo.comercial360.co',
    phone: '+573001112233',
    documentNumber: '1044556677',
    zone: DEMO_ZONES.north,
    weeklyVisitGoal: 12,
  },
  {
    name: 'Andres Pacheco',
    email: 'andres.pacheco@demo.comercial360.co',
    phone: '+573004445566',
    documentNumber: '1044889900',
    zone: DEMO_ZONES.south,
    weeklyVisitGoal: 10,
  },
  {
    name: 'Camila Herrera',
    email: 'camila.herrera@demo.comercial360.co',
    phone: '+573007778899',
    documentNumber: '1045112233',
    zone: DEMO_ZONES.soledad,
    weeklyVisitGoal: 10,
  },
];

const client = (
  n: number,
  name: string,
  address: string,
  neighborhood: string,
  municipality: string,
  zone: string,
  latitude: number,
  longitude: number,
  contactName: string,
): DemoClient => ({
  nit: `9001234${String(n).padStart(2, '0')}-${n % 10}`,
  businessName: `${name} S.A.S.`,
  commercialName: name,
  address,
  neighborhood,
  municipality,
  zone,
  latitude,
  longitude,
  contact: {
    name: contactName,
    position: 'Purchasing manager',
    mobile: `+57300${String(1000000 + n * 7919).slice(0, 7)}`,
  },
});

export const DEMO_CLIENTS: DemoClient[] = [
  client(
    1,
    'Autoservicio El Prado',
    'Carrera 54 # 64-120',
    'El Prado',
    'Barranquilla',
    DEMO_ZONES.north,
    10.9925,
    -74.793,
    'Mario Diaz',
  ),
  client(
    2,
    'Distribuidora Alto Prado',
    'Calle 76 # 57-30',
    'Alto Prado',
    'Barranquilla',
    DEMO_ZONES.north,
    11.0035,
    -74.809,
    'Paola Gil',
  ),
  client(
    3,
    'Mercados Riomar',
    'Carrera 51B # 94-20',
    'Riomar',
    'Barranquilla',
    DEMO_ZONES.north,
    11.017,
    -74.815,
    'Jorge Lara',
  ),
  client(
    4,
    'Minimercado Villa Country',
    'Calle 79 # 61-15',
    'Villa Country',
    'Barranquilla',
    DEMO_ZONES.north,
    11.001,
    -74.816,
    'Sandra Paez',
  ),
  client(
    5,
    'Tienda Buenavista',
    'Calle 98 # 52-40',
    'Buenavista',
    'Barranquilla',
    DEMO_ZONES.north,
    11.011,
    -74.827,
    'Luis Ortega',
  ),
  client(
    6,
    'Surtidora Altos del Prado',
    'Carrera 58 # 79-10',
    'Altos del Prado',
    'Barranquilla',
    DEMO_ZONES.north,
    11.004,
    -74.812,
    'Nora Vega',
  ),
  client(
    7,
    'Comercializadora Centro',
    'Calle 34 # 41-25',
    'Centro',
    'Barranquilla',
    DEMO_ZONES.south,
    10.98,
    -74.78,
    'Hector Mejia',
  ),
  client(
    8,
    'Abarrotes Rebolo',
    'Carrera 21 # 17-40',
    'Rebolo',
    'Barranquilla',
    DEMO_ZONES.south,
    10.965,
    -74.773,
    'Luz Romero',
  ),
  client(
    9,
    'Supertienda Carrizal',
    'Calle 47 # 2C-15',
    'Carrizal',
    'Barranquilla',
    DEMO_ZONES.south,
    10.948,
    -74.823,
    'Oscar Pinto',
  ),
  client(
    10,
    'Granero Las Nieves',
    'Carrera 21 # 26-60',
    'Las Nieves',
    'Barranquilla',
    DEMO_ZONES.south,
    10.958,
    -74.781,
    'Elena Cruz',
  ),
  client(
    11,
    'Mercado Simon Bolivar',
    'Calle 17 # 8-30',
    'Simon Bolivar',
    'Barranquilla',
    DEMO_ZONES.south,
    10.951,
    -74.793,
    'Ramiro Sosa',
  ),
  client(
    12,
    'Autoservicio Soledad Centro',
    'Calle 18 # 20-45',
    'Centro',
    'Soledad',
    DEMO_ZONES.soledad,
    10.918,
    -74.765,
    'Adriana Ruiz',
  ),
  client(
    13,
    'Distribuidora Hipodromo',
    'Calle 30 # 32-10',
    'Hipodromo',
    'Soledad',
    DEMO_ZONES.soledad,
    10.904,
    -74.788,
    'Fabian Mora',
  ),
  client(
    14,
    'Tienda Soledad 2000',
    'Carrera 21 # 54-20',
    'Soledad 2000',
    'Soledad',
    DEMO_ZONES.soledad,
    10.905,
    -74.772,
    'Gloria Navas',
  ),
  client(
    15,
    'Minimarket Los Robles',
    'Calle 63 # 13-05',
    'Los Robles',
    'Soledad',
    DEMO_ZONES.soledad,
    10.926,
    -74.77,
    'Ivan Castro',
  ),
  client(
    16,
    'Supermercado Malambo',
    'Calle 11 # 15-30',
    'Centro',
    'Malambo',
    DEMO_ZONES.malambo,
    10.859,
    -74.775,
    'Julia Reyes',
  ),
  client(
    17,
    'Tienda Caracoli',
    'Carrera 7 # 22-14',
    'Caracoli',
    'Malambo',
    DEMO_ZONES.malambo,
    10.87,
    -74.762,
    'Kevin Arias',
  ),
  client(
    18,
    'Granero El Concord',
    'Calle 4 # 9-50',
    'El Concord',
    'Malambo',
    DEMO_ZONES.malambo,
    10.853,
    -74.784,
    'Marta Leon',
  ),
  client(
    19,
    'Autoservicio Galapa',
    'Calle 13 # 18-20',
    'Centro',
    'Galapa',
    DEMO_ZONES.galapa,
    10.898,
    -74.886,
    'Nestor Duarte',
  ),
  client(
    20,
    'Surtidora Mundo Feliz',
    'Carrera 17 # 4-35',
    'Mundo Feliz',
    'Galapa',
    DEMO_ZONES.galapa,
    10.905,
    -74.88,
    'Olga Pardo',
  ),
];

/** Each route: zone, advisor (index in DEMO_ADVISORS) and day of the week. */
export const DEMO_ROUTES = [
  {
    name: 'North weekly route',
    zone: DEMO_ZONES.north,
    advisor: 0,
    dayOfWeek: 'MONDAY',
  },
  {
    name: 'South weekly route',
    zone: DEMO_ZONES.south,
    advisor: 1,
    dayOfWeek: 'TUESDAY',
  },
  {
    name: 'Soledad weekly route',
    zone: DEMO_ZONES.soledad,
    advisor: 2,
    dayOfWeek: 'WEDNESDAY',
  },
  {
    name: 'Malambo weekly route',
    zone: DEMO_ZONES.malambo,
    advisor: 2,
    dayOfWeek: 'THURSDAY',
  },
] as const;

export const DEMO_PRODUCTS = [
  { productName: 'Rice 500 g (box x 24)', unitPrice: 62000 },
  { productName: 'Sunflower oil 1 L (box x 12)', unitPrice: 98000 },
  { productName: 'Laundry detergent 1 kg (box x 10)', unitPrice: 85000 },
  { productName: 'Orange juice 1 L (box x 12)', unitPrice: 54000 },
];
