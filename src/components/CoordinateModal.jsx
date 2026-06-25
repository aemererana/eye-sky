import { useState } from 'react';

export default function CoordinateModal({ onStart }) {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(event) {
    event.preventDefault();

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (Number.isNaN(lat) || lat < -90 || lat > 90) {
      setError('Enter a valid latitude between -90 and 90.');
      return;
    }

    if (Number.isNaN(lon) || lon < -180 || lon > 180) {
      setError('Enter a valid longitude between -180 and 180.');
      return;
    }

    setError('');
    onStart(lat, lon);
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h1>Eye Sky</h1>
        <p className="modal-subtitle">Enter your location to scan for nearby aircraft.</p>

        <form onSubmit={handleSubmit}>
          <label>
            Latitude
            <input
              type="text"
              inputMode="decimal"
              placeholder="37.7749"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              autoComplete="off"
            />
          </label>

          <label>
            Longitude
            <input
              type="text"
              inputMode="decimal"
              placeholder="-122.4194"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              autoComplete="off"
            />
          </label>

          {error && <p className="modal-error">{error}</p>}

          <button type="submit">Start</button>
        </form>
      </div>
    </div>
  );
}
