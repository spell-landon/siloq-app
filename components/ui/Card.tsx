import React from 'react';
import { View, ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

export interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <View
      className={cn(
        'bg-white rounded-lg p-4 shadow-sm border border-border',
        className
      )}
      {...props}
    >
      {children}
    </View>
  );
}

export function CardHeader({ className, children, ...props }: ViewProps) {
  return (
    <View className={cn('mb-3', className)} {...props}>
      {children}
    </View>
  );
}

export function CardContent({ className, children, ...props }: ViewProps) {
  return (
    <View className={cn('', className)} {...props}>
      {children}
    </View>
  );
}

export function CardFooter({ className, children, ...props }: ViewProps) {
  return (
    <View className={cn('mt-3 pt-3 border-t border-border', className)} {...props}>
      {children}
    </View>
  );
}
