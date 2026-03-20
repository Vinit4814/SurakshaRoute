import React from 'react';
interface MetricCardProps {
    title: string;
    value: string | number;
    subtitle: string;
    icon: React.ReactNode;
    variant?: 'default' | 'safe' | 'warning' | 'danger';
    glow?: boolean;
}
export declare function MetricCard({ title, value, subtitle, icon, variant, glow }: MetricCardProps): import("react/jsx-runtime").JSX.Element;
export {};
