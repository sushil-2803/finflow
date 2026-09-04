import { lightColors, darkColors, getShadow } from './colors';
import { useTheme, ThemeProvider } from '../store/ThemeContext';

export { lightColors, darkColors, getShadow, useTheme, ThemeProvider };

// Default static colors fallback (for static usages if any)
export const colors = lightColors;

export const shadow = getShadow(false);

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };
