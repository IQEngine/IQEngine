import * as React from 'react';
import { useParams } from 'react-router-dom';
import OverviewPage from './overview.mdx';
import PluginsPage from './plugins.mdx';
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
              <TableItem href="/docs/plugins">Plugins</TableItem>
              <TableItem href="#">Backend</TableItem>
              <TableItem href="#">Admin Page</TableItem>

              <TableHeader>Developer Docs</TableHeader>
              <TableItem href="#">New Dev Guide</TableItem>
              <TableItem href="#">Repo Organization</TableItem>
              <TableItem href="#">Code Styling Guidelines</TableItem>
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
