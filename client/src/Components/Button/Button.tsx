import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const Button = ({ children, ...rest }: ButtonProps) => {
  return (
    <button className="px-3 py-2 font-medium text-white bg-zinc-800 hover:bg-zinc-700 rounded-md" {...rest}>
      {children}
    </button>
  );
};

export default Button;
