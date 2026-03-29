import type { CardType } from '../../types';

interface AvatarProps {
  size?: number;
  className?: string;
}

function DukeAvatar({ size = 64, className }: AvatarProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      <circle cx="32" cy="32" r="30" fill="#4a2060" stroke="#8b5cf6" strokeWidth="1.5" />
      <path d="M22 16 L32 8 L42 16 L42 20 L22 20 Z" fill="#8b5cf6" opacity="0.8" />
      <circle cx="32" cy="28" r="7" fill="#dfc06e" />
      <path d="M20 42 Q32 36 44 42 L44 52 Q32 48 20 52 Z" fill="#8b5cf6" opacity="0.9" />
      <path d="M26 20 L26 16" stroke="#dfc06e" strokeWidth="1" />
      <path d="M32 20 L32 12" stroke="#dfc06e" strokeWidth="1" />
      <path d="M38 20 L38 16" stroke="#dfc06e" strokeWidth="1" />
      <circle cx="26" cy="15" r="1.5" fill="#dfc06e" />
      <circle cx="32" cy="11" r="1.5" fill="#dfc06e" />
      <circle cx="38" cy="15" r="1.5" fill="#dfc06e" />
      <rect x="28" y="42" width="8" height="3" rx="1" fill="#dfc06e" opacity="0.7" />
    </svg>
  );
}

function AssassinAvatar({ size = 64, className }: AvatarProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      <circle cx="32" cy="32" r="30" fill="#1a1a2e" stroke="#6b7280" strokeWidth="1.5" />
      <circle cx="32" cy="24" r="7" fill="#374151" />
      <path d="M22 18 Q32 12 42 18" stroke="#6b7280" strokeWidth="1.5" fill="none" />
      <path d="M20 40 Q32 34 44 40 L44 52 Q32 48 20 52 Z" fill="#374151" opacity="0.9" />
      <path d="M30 24 L30 22 M34 24 L34 22" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M44 28 L52 20" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M50 18 L54 22 L52 20 L50 18 Z" fill="#9ca3af" />
      <path d="M26 38 L28 44 M38 38 L36 44" stroke="#4b5563" strokeWidth="0.8" />
    </svg>
  );
}

function ContessaAvatar({ size = 64, className }: AvatarProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      <circle cx="32" cy="32" r="30" fill="#5c1018" stroke="#ef4444" strokeWidth="1.5" />
      <circle cx="32" cy="24" r="7" fill="#fbbf24" />
      <path d="M24 20 Q28 14 32 18 Q36 14 40 20" stroke="#fbbf24" strokeWidth="1.5" fill="none" />
      <path d="M20 40 Q32 32 44 40 L44 52 Q32 46 20 52 Z" fill="#dc2626" opacity="0.8" />
      <path d="M28 20 Q32 16 36 20" fill="#dc2626" opacity="0.6" />
      <circle cx="30" cy="23" r="1" fill="#5c1018" />
      <circle cx="34" cy="23" r="1" fill="#5c1018" />
      <path d="M30 27 Q32 29 34 27" stroke="#5c1018" strokeWidth="0.8" fill="none" />
      <path d="M24 14 L26 18 M32 12 L32 16 M40 14 L38 18" stroke="#fbbf24" strokeWidth="1" />
      <circle cx="24" cy="13" r="1.5" fill="#ef4444" />
      <circle cx="32" cy="11" r="1.5" fill="#ef4444" />
      <circle cx="40" cy="13" r="1.5" fill="#ef4444" />
    </svg>
  );
}

function CaptainAvatar({ size = 64, className }: AvatarProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      <circle cx="32" cy="32" r="30" fill="#1a3a4a" stroke="#3b82f6" strokeWidth="1.5" />
      <circle cx="32" cy="26" r="7" fill="#93c5fd" />
      <path d="M22 18 L42 18 L40 22 L24 22 Z" fill="#1e40af" />
      <path d="M28 18 L32 14 L36 18" fill="#3b82f6" />
      <path d="M20 42 Q32 36 44 42 L44 52 Q32 48 20 52 Z" fill="#1e40af" opacity="0.9" />
      <circle cx="32" cy="44" r="2.5" fill="#fbbf24" stroke="#b45309" strokeWidth="0.5" />
      <path d="M30 25 L30 23 M34 25 L34 23" stroke="#1e3a5f" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M16 38 L22 42 M48 38 L42 42" stroke="#3b82f6" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

function AmbassadorAvatar({ size = 64, className }: AvatarProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      <circle cx="32" cy="32" r="30" fill="#1a3a2a" stroke="#22c55e" strokeWidth="1.5" />
      <circle cx="32" cy="24" r="7" fill="#86efac" />
      <path d="M20 40 Q32 34 44 40 L44 52 Q32 46 20 52 Z" fill="#166534" opacity="0.9" />
      <path d="M26 16 Q32 12 38 16 L38 20 L26 20 Z" fill="#166534" />
      <circle cx="30" cy="23" r="1" fill="#14532d" />
      <circle cx="34" cy="23" r="1" fill="#14532d" />
      <path d="M30 27 Q32 28 34 27" stroke="#14532d" strokeWidth="0.8" fill="none" />
      <path d="M12 30 L20 28 L20 32 Z" fill="#22c55e" opacity="0.6" />
      <path d="M52 30 L44 28 L44 32 Z" fill="#22c55e" opacity="0.6" />
      <rect x="28" y="42" width="8" height="4" rx="1" fill="#22c55e" opacity="0.4" />
      <path d="M30 43 L34 43 M30 45 L34 45" stroke="#86efac" strokeWidth="0.5" />
    </svg>
  );
}

const avatarComponents: Record<CardType, React.FC<AvatarProps>> = {
  Duke: DukeAvatar,
  Assassin: AssassinAvatar,
  Contessa: ContessaAvatar,
  Captain: CaptainAvatar,
  Ambassador: AmbassadorAvatar,
};

export default function CharacterAvatar({
  card,
  size = 64,
  className,
}: AvatarProps & { card: CardType }) {
  const AvatarComponent = avatarComponents[card];
  return <AvatarComponent size={size} className={className} />;
}

export { DukeAvatar, AssassinAvatar, ContessaAvatar, CaptainAvatar, AmbassadorAvatar };
