import React from 'react';
import { motion } from 'framer-motion';

const Card = ({
  children,
  title,
  subtitle,
  icon: Icon,
  badge,
  footer,
  hoverable = false,
  clickable = false,
  onClick,
  className = '',
  padding = 'normal',
  ...props
}) => {
  const baseStyles = 'bg-white rounded-lg shadow-md overflow-hidden';
  const hoverStyles = hoverable ? 'hover:shadow-xl transition-shadow duration-300' : '';
  const clickableStyles = clickable ? 'cursor-pointer hover:shadow-xl transition-shadow duration-300' : '';

  const paddingStyles = {
    none: '',
    sm: 'p-3',
    normal: 'p-6',
    lg: 'p-8',
  };

  const cardClasses = `${baseStyles} ${hoverStyles} ${clickableStyles} ${className}`;

  const CardWrapper = clickable ? motion.div : 'div';
  const motionProps = clickable ? {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    onClick,
  } : {};

  return (
    <CardWrapper className={cardClasses} {...motionProps} {...props}>
      {(title || subtitle || Icon || badge) && (
        <div className={`border-b border-gray-200 ${paddingStyles[padding]}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              {Icon && (
                <div className="flex-shrink-0">
                  <Icon className="w-8 h-8 text-blue-600" />
                </div>
              )}
              <div>
                {title && (
                  <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                )}
                {subtitle && (
                  <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
                )}
              </div>
            </div>
            {badge && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {badge}
              </span>
            )}
          </div>
        </div>
      )}

      <div className={paddingStyles[padding]}>
        {children}
      </div>

      {footer && (
        <div className={`border-t border-gray-200 bg-gray-50 ${paddingStyles[padding]}`}>
          {footer}
        </div>
      )}
    </CardWrapper>
  );
};

export default Card;
