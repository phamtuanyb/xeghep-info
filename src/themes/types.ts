/**
 * Hợp đồng theme (CLAUDE.md Mục 11). Mọi theme NHẬN CÙNG dữ liệu (đã tách khỏi giao
 * diện) và chỉ khác cách render. Đổi theme KHÔNG đụng dữ liệu.
 */
import type { ReactNode } from 'react';
import type { ResolvedTenant } from '@/lib/tenant-resolver';
import type { HomeContentData } from '@/lib/home-content';

export type ThemeShellProps = {
  tenant: ResolvedTenant;
  showPoweredBy: boolean;
  children: ReactNode;
};

export type HomeRoute = {
  id: string;
  fromName: string;
  toName: string;
  slug: string;
  priceFrom: number;
  icon: string | null;
  distanceKm?: number | null;
  durationText?: string | null;
};

export type HomeDriver = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  carType: string | null;
  rating: number;
  tripCount: number;
};

export type ThemeHomeProps = {
  tenant: ResolvedTenant;
  content: HomeContentData;
  routes: HomeRoute[];
  drivers: HomeDriver[];
};

export type ThemeModule = {
  key: string;
  name: string;
  Shell: (props: ThemeShellProps) => ReactNode;
  Home: (props: ThemeHomeProps) => ReactNode;
};
