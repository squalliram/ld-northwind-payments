// Fictional customers used to demonstrate targeting. No real personal data.
export const PERSONAS = [
  {
    id: 'staff-gb',
    label: 'Aisha Patel',
    description: 'Northwind employee, UK (internal dogfooding)',
    user: { key: 'usr-staff-001', country: 'GB', isEmployee: true, customerType: 'retail' },
  },
  {
    id: 'beta-gb',
    label: 'Tom Hughes',
    description: 'Retail customer, UK, opted into the beta programme',
    user: { key: 'usr-beta-042', country: 'GB', isEmployee: false, customerType: 'retail' },
  },
  {
    id: 'retail-de',
    label: 'Lena Schmidt',
    description: 'Retail customer, Germany (feature not yet approved in DE)',
    user: { key: 'usr-retail-317', country: 'DE', isEmployee: false, customerType: 'retail' },
  },
  {
    id: 'business-fr',
    label: 'Atelier Moreau SARL',
    description: 'Business customer, France',
    user: { key: 'usr-biz-908', country: 'FR', isEmployee: false, customerType: 'business' },
  },
];

// Only attributes that targeting rules use are sent. Private attributes are not enough here: a
// client-side SDK still sends them to LaunchDarkly for evaluation, so PII is left out entirely.
export function buildContext({ key, country, isEmployee, customerType }) {
  return { kind: 'user', key, country, isEmployee, customerType };
}

export function syntheticUkCustomer(i) {
  return buildContext({
    key: `usr-synthetic-${Date.now().toString(36)}-${i}`,
    country: 'GB',
    isEmployee: false,
    customerType: i % 5 === 0 ? 'business' : 'retail',
  });
}
