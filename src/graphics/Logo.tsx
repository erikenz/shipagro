// Shown on the login screen. Colors follow the admin theme through CSS variables.
export default function Logo() {
  return (
    <svg
      width="220"
      height="48"
      viewBox="0 0 220 48"
      role="img"
      aria-label="ShipAgro"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="48" height="48" rx="10" fill="var(--shipagro-accent)" />
      <path
        d="M24 38V14M24 20c-4-1-7-4-7-8 4 0 7 3 7 7m0 6c-4-1-7-4-7-8 4 0 7 3 7 7m0-6c4-1 7-4 7-8-4 0-7 3-7 7m0 6c4-1 7-4 7-8-4 0-7 3-7 7"
        fill="none"
        stroke="var(--shipagro-accent-contrast)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x="60"
        y="33"
        fontFamily="inherit"
        fontSize="28"
        fontWeight="700"
        letterSpacing="-0.5"
        fill="var(--theme-text)"
      >
        Ship<tspan fill="var(--shipagro-accent)">Agro</tspan>
      </text>
    </svg>
  )
}
