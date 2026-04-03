import { useState, useEffect } from 'react';
import { fetchAPI } from '../api/client';

export default function Dashboard() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAPI('/health')
      .then(setHealth)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-3">Backend Connection</h2>
        {health ? (
          <div className="flex items-center gap-2 text-success">
            <span className="w-2.5 h-2.5 bg-success rounded-full" />
            Connected — {health.message} (v{health.version})
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-danger">
            <span className="w-2.5 h-2.5 bg-danger rounded-full" />
            Disconnected — {error}
          </div>
        ) : (
          <div className="text-gray-500">Checking...</div>
        )}
      </div>
    </div>
  );
}
