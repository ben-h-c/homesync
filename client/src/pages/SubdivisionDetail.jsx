import { useParams } from 'react-router-dom';

export default function SubdivisionDetail() {
  const { id } = useParams();
  return <h1 className="text-2xl font-bold">Subdivision Detail — #{id}</h1>;
}
