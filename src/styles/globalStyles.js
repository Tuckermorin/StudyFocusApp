// src/styles/globalStyles.js
import { StyleSheet } from 'react-native';

// Spacing constants following Material Design 8dp grid
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Typography scale following Material Design type system
export const typography = {
  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 28,
    display: 32,
    hero: 40,
  },
  
  // Font weights
  fontWeight: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },
  
  // Letter spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },
};

// Border radius following Material Design
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 9999,
};

// Shadow styles following Material Design elevation
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.20,
    shadowRadius: 2.62,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4.65,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.30,
    shadowRadius: 10.32,
    elevation: 16,
  },
};

// Animation durations following Material Design motion
export const animations = {
  fast: 150,
  normal: 250,
  slow: 350,
  slower: 500,
};

// Create global styles function that accepts theme
export const createGlobalStyles = (theme) => StyleSheet.create({
  // Layout styles
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  safeContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  screenPadding: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  
  centeredContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  spaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  // Card styles following Material Design
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginVertical: spacing.sm,
    ...shadows.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  
  cardHeader: {
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },

// Button styles
button: {
  backgroundColor: theme.colors.primary,
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.lg,
  borderRadius: borderRadius.md,
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'row', // Ensure horizontal layout for icon + text
  ...shadows.sm,
  minHeight: 48, // Material Design minimum touch target
},

buttonSecondary: {
  backgroundColor: theme.colors.surface,
  borderWidth: 2,
  borderColor: theme.colors.primary,
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.lg,
  borderRadius: borderRadius.md,
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'row',
  minHeight: 48,
},

buttonDisabled: {
  backgroundColor: theme.colors.border,
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.lg,
  borderRadius: borderRadius.md,
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'row',
  minHeight: 48,
  ...shadows.none,
},

buttonText: {
  color: '#ffffff',
  fontSize: typography.fontSize.md,
  fontWeight: typography.fontWeight.semibold,
  letterSpacing: typography.letterSpacing.wide,
  textAlign: 'center',
  lineHeight: typography.fontSize.md * 1.2, // Proper line height for centering
},

buttonTextSecondary: {
  color: theme.colors.primary,
  fontSize: typography.fontSize.md,
  fontWeight: typography.fontWeight.semibold,
  letterSpacing: typography.letterSpacing.wide,
  textAlign: 'center',
  lineHeight: typography.fontSize.md * 1.2,
},

buttonTextDisabled: {
  color: theme.colors.textTertiary,
  fontSize: typography.fontSize.md,
  fontWeight: typography.fontWeight.semibold,
  letterSpacing: typography.letterSpacing.wide,
  textAlign: 'center',
  lineHeight: typography.fontSize.md * 1.2,
},
  
  // Input styles
  input: {
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.md,
    color: theme.colors.text,
    minHeight: 48,
  },
  
  inputFocused: {
    borderColor: theme.colors.inputFocus,
    borderWidth: 2,
  },
  
  inputError: {
    borderColor: theme.colors.error,
    borderWidth: 2,
  },
  
  // Text styles
  text: {
    color: theme.colors.text,
    fontSize: typography.fontSize.md,
    lineHeight: typography.fontSize.md * typography.lineHeight.normal,
  },
  
  textSecondary: {
    color: theme.colors.textSecondary,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
  },
  
  textTertiary: {
    color: theme.colors.textTertiary,
    fontSize: typography.fontSize.xs,
    lineHeight: typography.fontSize.xs * typography.lineHeight.normal,
  },
  
  // Heading styles
  heading1: {
    color: theme.colors.text,
    fontSize: typography.fontSize.hero,
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.fontSize.hero * typography.lineHeight.tight,
    marginBottom: spacing.lg,
  },
  
  heading2: {
    color: theme.colors.text,
    fontSize: typography.fontSize.display,
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.fontSize.display * typography.lineHeight.tight,
    marginBottom: spacing.md,
  },
  
  heading3: {
    color: theme.colors.text,
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.fontSize.xxxl * typography.lineHeight.normal,
    marginBottom: spacing.md,
  },
  
  heading4: {
    color: theme.colors.text,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.fontSize.xxl * typography.lineHeight.normal,
    marginBottom: spacing.sm,
  },
  
  heading5: {
    color: theme.colors.text,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.fontSize.xl * typography.lineHeight.normal,
    marginBottom: spacing.sm,
  },
  
  heading6: {
    color: theme.colors.text,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.fontSize.lg * typography.lineHeight.normal,
    marginBottom: spacing.sm,
  },
  
  // List styles
  listItem: {
    backgroundColor: theme.colors.card,
    padding: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...shadows.sm,
  },
  
  listItemPressed: {
    backgroundColor: theme.colors.surface,
    transform: [{ scale: 0.98 }],
  },
  
  // Divider
  divider: {
    height: 1,
    backgroundColor: theme.colors.divider,
    marginVertical: spacing.md,
  },
  
  // Error styles
  errorText: {
    color: theme.colors.error,
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
  },
  
  // Success styles
  successText: {
    color: theme.colors.success,
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
  },
  
  // Loading styles
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  modalContent: {
    backgroundColor: theme.colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    margin: spacing.lg,
    maxWidth: '90%',
    ...shadows.xl,
  },
});