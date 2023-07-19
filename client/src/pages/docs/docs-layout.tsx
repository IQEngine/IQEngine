import * as React from 'react';
import { Link } from 'react-router-dom';

const TableItem: React.FC<{
  href: string;
  children?: React.ReactNode;
}> = ({ children, href }) => (
  <Link to={href}>
    <a className="rounded px-3 py-1.5 transition-colors duration-200 relative block hover:text-toast-500 text-toast-700">
      {children}
    </a>
  </Link>
);

const TableHeader: React.FC<{
  children?: React.ReactNode;
}> = ({ children }) => (
  <span className="px-3 mt-3 mb-1 text-sm font-semibold tracking-wide text-toast-900 uppercase">{children}</span>
);

export function DocsLayout({ meta, children }) {
  return (
    <div className="bg-toast-50 bg-opacity-50 min-h-screen flex flex-col">
      <div className="flex-1 mx-auto px-2 max-w-4xl w-full">
        <header className=" col-start-1 col-end-6 mt-12 mb-16 px-2 flex justify-between items-center">
          <Link to="/">Logo here</Link>
          <a className="flex text-toast-600 underline" href="https://github.com/timolins/react-hot-toast">
            GitHub
          </a>
        </header>

        <div className="md:flex md:space-x-4">
          <nav className="font-medium rounded-lg ">
            <div className="flex flex-col mb-8 sticky top-0">
              <TableHeader>Header Label 1</TableHeader>
              <TableItem href="/docs">Index page</TableItem>
              <TableHeader>Header Label 2</TableHeader>
              <TableItem href="/docs/plugins">Plugins</TableItem>
            </div>
          </nav>

          <main className="col-span-4 w-full prose prose-toast text-toast-900 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
