// Fictional customers used to demonstrate targeting. No real personal data.
export const PERSONAS = [
  {
    id: 'staff-gb',
    label: 'Aisha Patel',
    description: 'Northwind employee, UK (internal dogfooding)',
    user: { key: 'usr-staff-001', name: 'Aisha Patel', email: 'aisha.patel@northwind.example', country: 'GB', isEmployee: true, customerType: 'retail' },
  },
  {
    id: 'beta-gb',
    label: 'Tom Hughes',
    description: 'Retail customer, UK, opted into the beta programme',
    user: { key: 'usr-beta-042', name: 'Tom Hughes', email: 'tom.hughes@example.co.uk', country: 'GB', isEmployee: false, customerType: 'retail' },
  },
  {
    id: 'retail-de',
    label: 'Lena Schmidt',
    description: 'Retail customer, Germany (feature not yet approved in DE)',
    user: { key: 'usr-retail-317', name: 'Lena Schmidt', email: 'lena.schmidt@example.de', country: 'DE', isEmployee: false, customerType: 'retail' },
  },
  {
    id: 'business-fr',
    label: 'Atelier Moreau SARL',
    description: 'Business customer, France',
    user: { key: 'usr-biz-908', name: 'Atelier Moreau SARL', email: 'finance@atelier-moreau.example.fr', country: 'FR', isEmployee: false, customerType: 'business' },
  },
];

// Name and email are marked private: they help us debug locally but are never sent to LaunchDarkly.
// Targeting only uses non-identifying attributes (country, isEmployee, customerType) and the opaque key.
export function buildContext(user) {
  return {
    kind: 'user',
    ...user,
    _meta: { privateAttributes: ['name', 'email'] },
  };
}

export function syntheticUkCustomer(i) {
  return buildContext({
    key: `usr-synthetic-${Date.now().toString(36)}-${i}`,
    name: `Synthetic customer ${i}`,
    email: `synthetic-${i}@example.invalid`,
    country: 'GB',
    isEmployee: false,
    customerType: i % 5 === 0 ? 'business' : 'retail',
  });
}
