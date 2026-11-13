import { avatarColor, cn, initials } from '@/utils/format';

export default function Avatar({
  name,
  src,
  size = 36,
  className,
}: {
  name: string;
  src?: string;
  size?: number;
  className?: string;
}) {
  const color = avatarColor(name);
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('inline-block shrink-0 rounded-full object-cover', className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white', className)}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(11, size * 0.38),
        background: `linear-gradient(135deg, ${color}, ${color}99)`,
        boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.18)`,
      }}
    >
      {initials(name)}
    </span>
  );
}
