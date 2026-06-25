function formatHeading(aircraft) {
  const heading = aircraft.track ?? aircraft.true_heading ?? aircraft.nav_heading;
  if (heading == null || Number.isNaN(heading)) return '—';
  return `${Math.round(heading)}°`;
}

function formatAltitude(alt) {
  if (alt == null || alt === 'ground') return 'Ground';
  if (typeof alt === 'number') return `${Math.round(alt).toLocaleString()} ft`;
  return String(alt);
}

function formatSpeed(gs) {
  if (gs == null) return '—';
  return `${Math.round(gs)} kts`;
}

function formatRoute(aircraft) {
  const origin = aircraft.from ?? aircraft.origin ?? aircraft.dep;
  const dest = aircraft.to ?? aircraft.destination ?? aircraft.arr;

  if (origin && dest) return `${origin} → ${dest}`;
  if (origin || dest) return origin ?? dest;
  return null;
}

export default function FlightCard({ aircraft, position }) {
  if (!aircraft || !position) return null;

  const callsign = (aircraft.flight ?? aircraft.r ?? 'Unknown').trim();
  const type = aircraft.t ?? 'Unknown';
  const route = formatRoute(aircraft);

  const cardStyle = {
    left: `${position.x}px`,
    top: `${position.y}px`,
  };

  return (
    <div className="flight-card" style={cardStyle}>
      <div className="flight-card-header">
        <span className="flight-callsign">{callsign}</span>
        <span className="flight-type">{type}</span>
      </div>

      <div className="flight-card-grid">
        <div>
          <span className="flight-label">Alt</span>
          <span>{formatAltitude(aircraft.alt_baro ?? aircraft.alt_geom)}</span>
        </div>
        <div>
          <span className="flight-label">Speed</span>
          <span>{formatSpeed(aircraft.gs)}</span>
        </div>
        <div>
          <span className="flight-label">Hdg</span>
          <span>{formatHeading(aircraft)}</span>
        </div>
      </div>

      {route && <div className="flight-route">{route}</div>}
    </div>
  );
}
