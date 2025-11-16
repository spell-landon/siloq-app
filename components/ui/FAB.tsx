import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '@/lib/utils';

export interface FABProps extends TouchableOpacityProps {
  icon?: keyof typeof Ionicons.glyphMap;
  size?: 'default' | 'lg';
}

export function FAB({
  icon = 'add',
  size = 'default',
  className,
  ...props
}: FABProps) {
  const sizeStyles = {
    default: 'w-14 h-14',
    lg: 'w-16 h-16',
  };

  const iconSize = size === 'default' ? 24 : 28;

  return (
    <TouchableOpacity
      className={cn(
        'bg-accent rounded-full items-center justify-center shadow-lg active:opacity-80',
        sizeStyles[size],
        className
      )}
      {...props}
    >
      <Ionicons name={icon} size={iconSize} color="#FFFFFF" />
    </TouchableOpacity>
  );
}
