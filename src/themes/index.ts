/**
 * Registry kho giao diện (CLAUDE.md Mục 11). Resolve theme KEY -> module.
 * Theme mới chỉ cần thêm vào đây + bật trong Control Plane là tenant Pro dùng được.
 */
import type { ThemeModule } from './types';
import { defaultTheme } from './default';
import { auroraTheme } from './aurora';
import { minimalTheme } from './minimal';
import { sunsetTheme } from './sunset';

const registry: Record<string, ThemeModule> = {
  default: defaultTheme,
  'theme-a': auroraTheme,
  'theme-b': minimalTheme,
  'theme-c': sunsetTheme,
};

/** Lấy module theme theo key; không có -> theme mặc định. */
export function getTheme(key: string | null | undefined): ThemeModule {
  if (key && registry[key]) return registry[key]!;
  return defaultTheme;
}

export { registry as themeRegistry };
export type { ThemeModule } from './types';
