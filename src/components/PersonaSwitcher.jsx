export default function PersonaSwitcher({ personas, current, onChange, disabled }) {
  return (
    <label className="persona">
      <span>Signed in as</span>
      <select
        value={current.id}
        disabled={disabled}
        onChange={(e) => onChange(personas.find((p) => p.id === e.target.value))}
      >
        {personas.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label} ({p.user.country}{p.user.isEmployee ? ', staff' : ''})
          </option>
        ))}
      </select>
      <small>{current.description}</small>
    </label>
  );
}
