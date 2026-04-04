import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="text-6xl font-bold text-gray-200 mb-2">404</div>
      <h1 className="text-xl font-semibold text-gray-700 mb-2">Page Not Found</h1>
      <p className="text-gray-500 mb-6">The page you're looking for doesn't exist.</p>
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90"
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>
    </div>
  );
}
