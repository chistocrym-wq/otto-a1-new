interface Props {
  imageIndex: number;
  alt: string;
  className?: string;
}

export function Teil3ArchiveImage({ imageIndex, alt, className = '' }: Props) {
  const safeIndex = Math.max(0, Math.min(49, Math.floor(imageIndex)));
  const fileName = String(safeIndex + 1).padStart(3, '0');

  return (
    <div
      className={`relative aspect-square overflow-hidden bg-white ${className}`.trim()}
      data-teil3-image={safeIndex + 1}
    >
      <img
        src={`/sprechen/teil3-cards/${fileName}.webp`}
        alt={alt}
        draggable={false}
        loading="eager"
        decoding="async"
        className="h-full w-full select-none object-contain"
      />
    </div>
  );
}
