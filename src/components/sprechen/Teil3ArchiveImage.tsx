interface Props {
  imageIndex: number;
  alt: string;
  className?: string;
}

const ORIGINAL_CARD_VERSION = '20260914-2';

export function Teil3ArchiveImage({ imageIndex, alt, className = '' }: Props) {
  const safeIndex = Math.max(0, Math.min(49, Math.floor(imageIndex)));
  const cardNumber = safeIndex + 1;
  const hasOriginal = cardNumber <= 48;

  return (
    <div
      className={`relative aspect-square overflow-hidden bg-white ${className}`.trim()}
      data-teil3-image={cardNumber}
    >
      {hasOriginal ? (
        <img
          src={`/sprechen/teil3-originals/CARD (${cardNumber}).png?v=${ORIGINAL_CARD_VERSION}`}
          alt={alt}
          draggable={false}
          loading="eager"
          decoding="async"
          className="h-full w-full select-none object-contain"
        />
      ) : null}
    </div>
  );
}
