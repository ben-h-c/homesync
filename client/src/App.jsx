import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MapView from './pages/MapView';
import SubdivisionList from './pages/SubdivisionList';
import SubdivisionDetail from './pages/SubdivisionDetail';
import PropertyList from './pages/PropertyList';
import PropertyDetail from './pages/PropertyDetail';
import ContactList from './pages/ContactList';
import ContactDetail from './pages/ContactDetail';
import ContactForm from './pages/ContactForm';
import Pipeline from './pages/Pipeline';
import ProjectList from './pages/ProjectList';
import ProjectDetail from './pages/ProjectDetail';
import ProjectForm from './pages/ProjectForm';
import ContractorList from './pages/ContractorList';
import EmailCompose from './pages/EmailCompose';
import EmailTemplates from './pages/EmailTemplates';
import EmailSent from './pages/EmailSent';
import ForecastReport from './pages/ForecastReport';
import Import from './pages/Import';
import Settings from './pages/Settings';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/subdivisions" element={<SubdivisionList />} />
          <Route path="/subdivisions/:id" element={<SubdivisionDetail />} />
          <Route path="/properties" element={<PropertyList />} />
          <Route path="/properties/:id" element={<PropertyDetail />} />
          <Route path="/contacts" element={<ContactList />} />
          <Route path="/contacts/new" element={<ContactForm />} />
          <Route path="/contacts/:id" element={<ContactDetail />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/projects" element={<ProjectList />} />
          <Route path="/projects/new" element={<ProjectForm />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/contractors" element={<ContractorList />} />
          <Route path="/email/compose" element={<EmailCompose />} />
          <Route path="/email/templates" element={<EmailTemplates />} />
          <Route path="/email/sent" element={<EmailSent />} />
          <Route path="/reports/forecast" element={<ForecastReport />} />
          <Route path="/reports/forecast/:subId" element={<ForecastReport />} />
          <Route path="/import" element={<Import />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
