import React from 'react';
import Container from './Container';

const Section = ({
  children,
  title,
  subtitle,
  centered = false,
  background = 'white',
  padding = 'normal',
  containerSize = 'default',
  className = '',
  ...props
}) => {
  const backgrounds = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    gradient: 'neural-bg text-white',
    blue: 'bg-blue-600 text-white',
    dark: 'bg-gray-900 text-white',
  };

  const paddings = {
    none: '',
    sm: 'py-8',
    normal: 'py-12 md:py-16',
    lg: 'py-16 md:py-24',
    xl: 'py-24 md:py-32',
  };

  const sectionClasses = `${backgrounds[background]} ${paddings[padding]} ${className}`;
  const textAlign = centered ? 'text-center' : '';

  return (
    <section className={sectionClasses} {...props}>
      <Container size={containerSize}>
        {(title || subtitle) && (
          <div className={`mb-12 ${textAlign}`}>
            {title && (
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </Container>
    </section>
  );
};

export default Section;
