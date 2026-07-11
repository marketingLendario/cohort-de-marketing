// Lendár[IA] DS — primitivos React (porte fiel do _ds_bundle.js → módulos TS).
// 22/22 primitivos portados (STORY-AL-ADS-0c.2). O estilo vive em tokens/components.css.

// core
export { Badge } from './badge';
export type { BadgeProps, BadgeVariant, BadgeSize } from './badge';
export { Button } from './button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './button';
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';
export type { DivProps, HeadingProps, ParagraphProps } from './card';
export { Icon } from './icon';
export type { IconProps, IconSize } from './icon';

// brand
export { BookCard } from './book-card';
export type { BookCardProps, BookStatus } from './book-card';
export { Milestone } from './milestone';
export type { MilestoneProps } from './milestone';
export { SectionHeader } from './section-header';
export type { SectionHeaderProps } from './section-header';

// display
export { Alert } from './alert';
export type { AlertProps, AlertVariant } from './alert';
export { Avatar } from './avatar';
export type { AvatarProps, AvatarSize } from './avatar';
export { Progress } from './progress';
export type { ProgressProps } from './progress';
export { StatChip } from './stat-chip';
export type { StatChipProps } from './stat-chip';
export { Tabs } from './tabs';
export type { TabsProps, TabItem } from './tabs';

// forms
export { Input } from './input';
export type { InputProps } from './input';
export { Textarea } from './textarea';
export type { TextareaProps } from './textarea';
export { Label } from './label';
export type { LabelProps } from './label';
export { Switch } from './switch';
export type { SwitchProps } from './switch';
export { Checkbox } from './checkbox';
export type { CheckboxProps } from './checkbox';
