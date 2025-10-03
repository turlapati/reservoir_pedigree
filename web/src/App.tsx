import { useState, useMemo } from 'react';
import ReservoirGraph from '@components/ReservoirGraph';
import { getAllReservoirs, parseReservoirConfig } from '@data/reservoirDataParser';

function App() {
  const reservoirs = useMemo(() => getAllReservoirs(), []);
  const [selectedReservoirId, setSelectedReservoirId] = useState<number>(
    reservoirs[0]?.reservoir_id || 101
  );

  const graphData = useMemo(() => {
    const reservoir = reservoirs.find((r) => r.reservoir_id === selectedReservoirId);
    return reservoir ? parseReservoirConfig(reservoir) : { nodes: [], links: [] };
  }, [selectedReservoirId, reservoirs]);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header with dropdown */}
      <div
        style={{
          padding: '16px 24px',
          background: 'white',
          borderBottom: '1px solid #e0e0e0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label
            htmlFor="reservoir-select"
            style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#333',
            }}
          >
            Select Reservoir:
          </label>
          <select
            id="reservoir-select"
            value={selectedReservoirId}
            onChange={(e) => setSelectedReservoirId(Number(e.target.value))}
            style={{
              padding: '8px 12px',
              fontSize: '14px',
              border: '1px solid #ccc',
              borderRadius: '6px',
              background: 'white',
              cursor: 'pointer',
              minWidth: '300px',
              outline: 'none',
            }}
          >
            {reservoirs.map((reservoir) => (
              <option key={reservoir.reservoir_id} value={reservoir.reservoir_id}>
                {reservoir.reservoir_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Graph container */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <ReservoirGraph data={graphData} />
      </div>
    </div>
  );
}

export default App;
