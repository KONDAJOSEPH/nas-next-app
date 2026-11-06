// All settings in one place.
export const CURRENCY = 'SSP';
export const FEE_RATE = 0.05;      // 5% fee, added on top of the amount
export const COMM_RATE = 0.3;      // agent keeps 30% of each fee as commission
export const LOW_FLOAT = 50000;    // warn below this float
export const OPEN_FLOAT = 500000;  // starting float
export const OPEN_COMM = 15000;    // starting commission
export const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// DEMO ONLY. Replace with a real login against your ASP.NET server.
export const USERS = {
  admin: { p: 'admin123', name: 'Admin', role: 'Super Admin' },
  agent: { p: 'agent123', name: 'Agent', role: 'Agent' },
};

// [code used inside receipt IDs, display name]
export const PLACES = [
  ['Abassiya', 'Abassiya'], ['AbuJubayhah', 'Abu Jubayhah'], ['AbuKershola', 'Abu Kershola'],
  ['AlBuram', 'Al Buram'], ['AlLeri', 'Al Leri'], ['AlQuoz', 'Al Quoz'], ['AtTadamon', 'At Tadamon'],
  ['Delami', 'Delami'], ['Dilling', 'Dilling'], ['Ghadeer', 'Ghadeer'], ['Habila', 'Habila'],
  ['Heiban', 'Heiban'], ['Kadugli', 'Kadugli'], ['Kalogi', 'Kalogi'], ['Kauda', 'Kauda'],
  ['Rashad', 'Rashad'], ['ReifAshargi', 'Reif Ashargi'], ['Talodi', 'Talodi'], ['UmmDurein', 'Umm Durein'],
];

// The horizontal header menu. Add a page here to add a menu item.
export const NAV = [
  ['/', 'Overview'], ['/register/', 'Register'], ['/customers/', 'Customers'], ['/send/', 'Send Money'],
  ['/transfers/', 'Transfers'], ['/cashout/', 'Cash Out'], ['/float/', 'My Float'], ['/cases/', 'Cases'],
  ['/sync/', 'Sync'], ['/notifications/', 'Alerts'], ['/offline/', 'Offline'], ['/qr-print/', 'QR Print'], ['/reports/', 'Reports'],
];
