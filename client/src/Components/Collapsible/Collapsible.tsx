import React from 'react';
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleUp, faAngleDown } from '@fortawesome/free-solid-svg-icons';

interface CollapsibleProps {
  title: string;
  children: React.ReactNode;
}

const Collapsible: React.FC<CollapsibleProps> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleCollapsible = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="border rounded-md shadow-md">
      <div className="flex items-center justify-between cursor-pointer" onClick={toggleCollapsible}>
        <h3 className="text-lg py-2 pl-3">{title}</h3>
        {isOpen ? <FontAwesomeIcon icon={faAngleUp} /> : <FontAwesomeIcon icon={faAngleDown} />}
      </div>
      {isOpen && <div className="p-3">{children}</div>}
    </div>
  );
};

export default Collapsible;
