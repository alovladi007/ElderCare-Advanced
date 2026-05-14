import React from 'react';

const Container = ({
  children,
  size = 'default',
  padding = true,
  className = '',
  ...props
}) => {
  const sizes = {
    sm: 'max-w-3xl',
    default: 'max-w-7xl',
    lg: 'max-w-screen-xl',
    xl: 'max-w-screen-2xl',
    full: 'max-w-full',
  };

  const paddingStyles = padding ? 'px-4 sm:px-6 lg:px-8' : '';

  const containerClasses = `mx-auto ${sizes[size]} ${paddingStyles} ${className}`;

  return (
    <div className={containerClasses} {...props}>
      {children}
    </div>
  );
};

export default Container;
