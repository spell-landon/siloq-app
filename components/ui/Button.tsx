import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { COLORS } from '@/lib/theme';

export interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'default' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'default',
  loading = false,
  disabled,
  style,
  children,
  ...props
}: ButtonProps) {
  const buttonStyles: ViewStyle[] = [styles.base];
  const textStyles: TextStyle[] = [styles.textBase];

  // Variant styles
  if (variant === 'primary') {
    buttonStyles.push(styles.primaryButton);
    textStyles.push(styles.primaryText);
  } else if (variant === 'secondary') {
    buttonStyles.push(styles.secondaryButton);
    textStyles.push(styles.secondaryText);
  } else if (variant === 'outline') {
    buttonStyles.push(styles.outlineButton);
    textStyles.push(styles.outlineText);
  } else if (variant === 'ghost') {
    buttonStyles.push(styles.ghostButton);
    textStyles.push(styles.ghostText);
  } else if (variant === 'destructive') {
    buttonStyles.push(styles.destructiveButton);
    textStyles.push(styles.destructiveText);
  }

  // Size styles
  if (size === 'sm') {
    buttonStyles.push(styles.smButton);
    textStyles.push(styles.smText);
  } else if (size === 'default') {
    buttonStyles.push(styles.defaultButton);
    textStyles.push(styles.defaultText);
  } else if (size === 'lg') {
    buttonStyles.push(styles.lgButton);
    textStyles.push(styles.lgText);
  }

  if (disabled || loading) {
    buttonStyles.push(styles.disabled);
  }

  return (
    <TouchableOpacity
      style={[buttonStyles, style]}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'destructive' ? COLORS.white : COLORS.primary[600]}
          size="small"
        />
      ) : (
        <Text style={textStyles}>{children}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  primaryButton: {
    backgroundColor: COLORS.accent[400],
  },
  secondaryButton: {
    backgroundColor: COLORS.gray[100],
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },
  destructiveButton: {
    backgroundColor: COLORS.error,
  },
  smButton: {
    height: 36,
    paddingHorizontal: 12,
  },
  defaultButton: {
    height: 48,
    paddingHorizontal: 24,
  },
  lgButton: {
    height: 56,
    paddingHorizontal: 32,
  },
  disabled: {
    opacity: 0.5,
  },
  textBase: {
    fontWeight: '600',
  },
  primaryText: {
    color: COLORS.white,
  },
  secondaryText: {
    color: COLORS.gray[900],
  },
  outlineText: {
    color: COLORS.gray[900],
  },
  ghostText: {
    color: COLORS.gray[900],
  },
  destructiveText: {
    color: COLORS.white,
  },
  smText: {
    fontSize: 14,
  },
  defaultText: {
    fontSize: 16,
  },
  lgText: {
    fontSize: 18,
  },
});
