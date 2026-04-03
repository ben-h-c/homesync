import { useParams } from 'react-router-dom';

export default function ContactDetail() {
  const { id } = useParams();
  return <h1 className="text-2xl font-bold">Contact Detail — #{id}</h1>;
}
