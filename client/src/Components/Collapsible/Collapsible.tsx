import React from 'react';
import { useState } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/solid';

interface CollapsibleProps {
  title: string;
  children: React.ReactNode;
}

export const Collapsible = ({ title, children, ...rest }: CollapsibleProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleCollapsible = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="outline outline-1 outline-iqengine-green rounded-md" {...rest}>
      <div className="flex items-center justify-between cursor-pointer" onClick={toggleCollapsible}>
        <h3 className="text-lg py-2 pl-3">{title}</h3>
        {isOpen ? <ChevronUpIcon className="h-6 w-6" /> : <ChevronDownIcon className="h-6 w-6" />}
      </div>
      {isOpen && <div className="p-3">{children}</div>}
    </div>
  );
};

export default Collapsible;
