import React from 'react';
import { getBrandColor, getBusinessAwareColor } from '../utils/brandColors';

interface BrandButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  businessColor?: string; // Override with business-specific color
}

export const BrandButton: React.FC<BrandButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  className = '',
  type = 'button',
  businessColor,
}) => {
  const getVariantStyles = () => {
    const baseStyles = 'font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    };

    const variantStyles = {
      primary: {
        backgroundColor: getBusinessAwareColor('infoBlue', businessColor),
        color: '#ffffff',
        borderColor: 'transparent',
        hoverBg: '#1e60cc', // darker blue
        ring: getBusinessAwareColor('infoBlue', businessColor),
      },
      secondary: {
        backgroundColor: getBusinessAwareColor('infoBlue', businessColor),
        color: '#ffffff',
        borderColor: 'transparent',
        hoverBg: '#1e60cc', // darker blue
        ring: getBusinessAwareColor('infoBlue', businessColor),
      },
      accent: {
        backgroundColor: getBusinessAwareColor('accentRed', businessColor),
        color: '#ffffff',
        borderColor: 'transparent',
        hoverBg: '#d63912', // darker red
        ring: getBusinessAwareColor('accentRed', businessColor),
      },
      outline: {
        backgroundColor: 'transparent',
        color: getBusinessAwareColor('infoBlue', businessColor),
        borderColor: getBusinessAwareColor('infoBlue', businessColor),
        hoverBg: getBrandColor('neutralLight'),
        ring: getBusinessAwareColor('infoBlue', businessColor),
      },
      ghost: {
        backgroundColor: 'transparent',
        color: getBusinessAwareColor('neutralDark', businessColor),
        borderColor: 'transparent',
        hoverBg: getBrandColor('neutralLight'),
        ring: getBusinessAwareColor('infoBlue', businessColor),
      },
    };

    const styles = variantStyles[variant];
    
    return {
      className: `${baseStyles} ${sizeStyles[size]} border ${className}`,
      style: {
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        borderColor: styles.borderColor,
        focusRingColor: styles.ring,
      },
      hoverStyle: {
        backgroundColor: styles.hoverBg,
      }
    };
  };

  const buttonStyles = getVariantStyles();

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={buttonStyles.className}
      style={buttonStyles.style}
      onMouseEnter={(e) => {
        if (!disabled) {
          (e.target as HTMLButtonElement).style.backgroundColor = buttonStyles.hoverStyle.backgroundColor;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          (e.target as HTMLButtonElement).style.backgroundColor = buttonStyles.style.backgroundColor;
        }
      }}
    >
      {children}
    </button>
  );
};

export default BrandButton;
