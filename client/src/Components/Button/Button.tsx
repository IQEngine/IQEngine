import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className: string;
}

const Button: React.FC<ButtonProps> = ({ children, className = '', ...rest }) => {
  return (
    <button className="px-3 py-2 font-medium text-white bg-zinc-800 hover:bg-zinc-700 rounded-md" {...rest}>
      {children}
    </button>
  );
};

export default Button;
