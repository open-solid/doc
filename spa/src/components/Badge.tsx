import { COLOR_CLASSES, type ColorName } from '../constants';

interface BadgeProps {
  label: string;
  color: ColorName;
}

export function Badge({ label, color }: BadgeProps) {
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md tabular-nums ${COLOR_CLASSES[color].badge}`}>
      {label}
    </span>
  );
}
