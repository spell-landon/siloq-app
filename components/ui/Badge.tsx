import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

export interface BadgeProps extends ViewProps {
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'secondary';
  children: React.ReactNode;
}

export function Badge({
  variant = 'default',
  className,
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-yellow-500',
    destructive: 'bg-destructive',
    secondary: 'bg-muted',
  };

  const textVariantStyles = {
    default: 'text-primary-foreground',
    success: 'text-success-foreground',
    warning: 'text-white',
    destructive: 'text-destructive-foreground',
    secondary: 'text-muted-foreground',
  };

  return (
    <View
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      <Text className={cn('text-xs font-semibold', textVariantStyles[variant])}>
        {children}
      </Text>
    </View>
  );
}
