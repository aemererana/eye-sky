function formatHeading(heading) {
  if (heading == null) return '—';
  return `${Math.round(heading)}°`;
}

export default function StatusHud({ cameraHeading, apiStatus }) {
  const statusClass = apiStatus?.state ? `status-hud-api--${apiStatus.state}` : 'status-hud-api--idle';

  return (
    <div className="status-hud">
      <div className="status-hud-row">
        <span className="status-hud-label">Heading</span>
        <span className="status-hud-value">{formatHeading(cameraHeading)}</span>
      </div>

      <div className={`status-hud-row status-hud-api ${statusClass}`}>
        <span className="status-hud-label">ADS-B</span>
        <span className="status-hud-value">{apiStatus?.message ?? 'Ready'}</span>
      </div>
    </div>
  );
}
