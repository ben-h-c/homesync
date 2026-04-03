import { useParams } from 'react-router-dom';

export default function PropertyDetail() {
  const { id } = useParams();
  return <h1 className="text-2xl font-bold">Property Detail — #{id}</h1>;
}
