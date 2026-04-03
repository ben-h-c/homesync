import { useParams } from 'react-router-dom';

export default function ForecastReport() {
  const { subId } = useParams();
  return (
    <h1 className="text-2xl font-bold">
      Forecast Report{subId ? ` — Subdivision #${subId}` : ''}
    </h1>
  );
}
