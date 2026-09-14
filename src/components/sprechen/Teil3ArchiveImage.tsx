interface Props {
  imageIndex: number;
  alt: string;
  className?: string;
}

const SPRITE_COLUMNS = 10;
const SPRITE_ROWS = 5;

export function Teil3ArchiveImage({ imageIndex, alt, className = '' }: Props) {
  const safeIndex = Math.max(0, Math.min(49, Math.floor(imageIndex)));
  const column = safeIndex % SPRITE_COLUMNS;
  const row = Math.floor(safeIndex / SPRITE_COLUMNS);

  return (
    <div
      className={`relative aspect-square overflow-hidden bg-white ${className}`.trim()}
      role="img"
      aria-label={alt}
      data-teil3-image={safeIndex + 1}
    >
      <img
        src="/sprechen/teil3-requests-user.avif?v=1"
        alt=""
        aria-hidden="true"
        draggable={false}
        loading="eager"
        decoding="async"
        className="pointer-events-none absolute max-w-none select-none"
        style={{
          width: `${SPRITE_COLUMNS * 100}%`,
          height: `${SPRITE_ROWS * 100}%`,
          left: `${-column * 100}%`,
          top: `${-row * 100}%`,
        }}
      />
    </div>
  );
}
