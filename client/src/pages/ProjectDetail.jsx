import { useParams } from 'react-router-dom';

export default function ProjectDetail() {
  const { id } = useParams();
  return <h1 className="text-2xl font-bold">Project Detail — #{id}</h1>;
}
