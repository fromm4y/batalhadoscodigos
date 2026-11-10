/** Fachada do museu à noite em SVG: substitui a imagem `capa-entrada` enquanto ela não existe. */
export function MuseumFacade({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 600"
      preserveAspectRatio="xMidYMax slice"
      className={className}
      aria-hidden
    >
      <defs>
        <radialGradient id="mf-moon" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFF4C2" />
          <stop offset="0.6" stopColor="#FFF4C2" stopOpacity="0.9" />
          <stop offset="1" stopColor="#FFF4C2" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="mf-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#05060A" />
          <stop offset="1" stopColor="#17203a" />
        </linearGradient>
        <linearGradient id="mf-window" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF4C2" stopOpacity="0.9" />
          <stop offset="1" stopColor="#D4A537" stopOpacity="0.5" />
        </linearGradient>
      </defs>
      <rect width="1200" height="600" fill="url(#mf-sky)" />
      {/* estrelas */}
      {Array.from({ length: 40 }, (_, i) => (
        <circle
          key={i}
          cx={(i * 197) % 1200}
          cy={(i * 71) % 260}
          r={i % 4 === 0 ? 1.8 : 1}
          fill="#EDE3CC"
          opacity={0.6}
        />
      ))}
      <circle cx="960" cy="110" r="90" fill="url(#mf-moon)" />
      <circle cx="960" cy="110" r="52" fill="#FFF4C2" />
      {/* prédio */}
      <g stroke="#0A0A0A" strokeWidth="5">
        <rect x="250" y="250" width="700" height="300" fill="#1c2233" />
        <polygon points="220,255 600,110 980,255" fill="#252B3A" />
        <polygon points="300,240 600,135 900,240" fill="#171B26" />
        <rect x="230" y="240" width="740" height="22" fill="#2c3346" />
        {/* colunas */}
        {[300, 400, 500, 650, 750, 850].map((x) => (
          <g key={x}>
            <rect x={x} y="275" width="44" height="245" fill="#2c3346" />
            <rect x={x - 8} y="262" width="60" height="16" fill="#323a50" />
            <rect x={x - 8} y="515" width="60" height="16" fill="#323a50" />
          </g>
        ))}
        {/* porta com luz */}
        <rect x="560" y="360" width="80" height="170" fill="url(#mf-window)" />
        <rect x="200" y="540" width="800" height="30" fill="#252B3A" />
      </g>
      {/* placa */}
      <text
        x="600"
        y="232"
        textAnchor="middle"
        fontFamily="Bebas Neue"
        fontSize="30"
        letterSpacing="6"
        fill="#D4A537"
      >
        MUSEU NACIONAL DA TECNOLOGIA
      </text>
      <rect x="0" y="568" width="1200" height="40" fill="#05060A" />
    </svg>
  );
}
