import * as React from 'react';
import { useParams } from 'react-router-dom';
import OverviewPage from './overview.mdx';
import PluginsPage from './plugins.mdx';
import Frontend from './frontend.mdx';
import Backend from './backend.mdx';
import AdminPage from './admin-page.mdx';
import CodingStyle from './coding-style.mdx';
import NewDevGuide from './new-developer-guide.mdx';
import InstallWithDocker from './install-with-docker.mdx';
import ConfigFeatureFlags from './config-feature-flags.mdx';
import ReadingSpectrograms from './reading-spectrograms.mdx';
import RecordFromSDR from './record-from-sdr.mdx';
import { Link } from 'react-router-dom';

export const DocsPages = () => {
  let { page } = useParams();

  let currentPage;
  switch (page) {
    case 'overview':
      currentPage = <OverviewPage />;
      break;
    case 'plugins':
      currentPage = <PluginsPage />;
      break;
    case 'frontend':
      currentPage = <Frontend />;
      break;
    case 'backend':
      currentPage = <Backend />;
      break;
    case 'admin-page':
      currentPage = <AdminPage />;
      break;
    case 'coding-style':
      currentPage = <CodingStyle />;
      break;
    case 'new-developer-guide':
      currentPage = <NewDevGuide />;
      break;
    case 'config-feature-flags':
      currentPage = <ConfigFeatureFlags />;
      break;
    case 'reading-spectrograms':
      currentPage = <ReadingSpectrograms />;
      break;
    case 'install-with-docker':
      currentPage = <InstallWithDocker />;
      break;
    case 'record-from-sdr':
      currentPage = <RecordFromSDR />;
      break;
    default:
      currentPage = <OverviewPage />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 mx-auto px-2 w-full">
        <div className="md:flex md:space-x-4">
          <nav>
            <div className="flex flex-col w-48 mb-8 sticky top-0">
              <TableHeader>User Docs</TableHeader>
              <TableItem href="/docs">Overview</TableItem>
              <TableItem href="/docs/install-with-docker">Install with Docker</TableItem>
              <TableItem href="/docs/config-feature-flags">Config & Feature Flags</TableItem>
              <TableItem href="/docs/frontend">Frontend</TableItem>
              <TableItem href="/docs/backend">Backend</TableItem>
              <TableItem href="/docs/plugins">Plugins</TableItem>
              <TableItem href="/docs/admin-page">Admin Page</TableItem>
              <TableItem href="/docs/record-from-sdr">Record Using an SDR</TableItem>
              <TableItem href="/docs/reading-spectrograms">Reading Spectrograms</TableItem>
              <TableHeader>Developer Docs</TableHeader>
              <TableItem href="/docs/new-developer-guide">New Dev Guide</TableItem>
              <TableItem href="/docs/coding-style">Code Styling Guidelines</TableItem>
            </div>
          </nav>

          <main className="col-span-4 w-1/2 flex-1">{currentPage}</main>
        </div>
      </div>
    </div>
  );
};

const TableItem: React.FC<{
  href: string;
  children?: React.ReactNode;
}> = ({ children, href }) => (
  <Link to={href}>
    <a className="rounded px-3 py-1.5 duration-200 relative block text-primary hover:text-secondary">{children}</a>
  </Link>
);

const TableHeader: React.FC<{
  children?: React.ReactNode;
}> = ({ children }) => <span className="px-3 mt-3 mb-1 text-sm font-semibold tracking-wide uppercase">{children}</span>;
