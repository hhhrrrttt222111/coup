import { Box, Typography, Paper, IconButton, Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useCoupTheme } from '../theme/ThemeProvider';
import CharacterAvatar from '../components/Cards/CharacterAvatars';
import type { CardType } from '../types';

interface CharacterInfo {
  name: CardType;
  power: string;
  action: string;
  counteraction: string;
  description: string;
  color: string;
  accent: string;
}

const CHARACTERS: CharacterInfo[] = [
  {
    name: 'Duke',
    power: 'Tax',
    action: 'Take 3 coins from the treasury.',
    counteraction: 'Blocks Foreign Aid.',
    description:
      'The Duke is a powerful noble who controls the flow of money. Claim Duke to take 3 coins, or block anyone attempting foreign aid.',
    color: '#4a2060',
    accent: '#8b5cf6',
  },
  {
    name: 'Assassin',
    power: 'Assassinate',
    action: 'Pay 3 coins to force another player to lose an influence.',
    counteraction: 'None.',
    description:
      'The Assassin is a deadly hired killer. Pay 3 coins to eliminate one of an opponent\'s influences. Can be blocked by the Contessa.',
    color: '#1a1a2e',
    accent: '#6b7280',
  },
  {
    name: 'Contessa',
    power: 'Block Assassination',
    action: 'No special action.',
    counteraction: 'Blocks Assassination attempts.',
    description:
      'The Contessa is a powerful political figure with immunity from assassins. She has no offensive ability, but she can block assassination attempts against you.',
    color: '#5c1018',
    accent: '#ef4444',
  },
  {
    name: 'Captain',
    power: 'Steal',
    action: 'Take 2 coins from another player.',
    counteraction: 'Blocks Stealing.',
    description:
      'The Captain is a cunning military officer. Steal 2 coins from another player, or block other players from stealing from you.',
    color: '#1a3a4a',
    accent: '#3b82f6',
  },
  {
    name: 'Ambassador',
    power: 'Exchange',
    action: 'Draw 2 cards from the Court deck, choose which to keep.',
    counteraction: 'Blocks Stealing.',
    description:
      'The Ambassador is a diplomatic envoy with connections to the Court. Exchange cards with the deck to improve your hand, or block stealing attempts.',
    color: '#1a3a2a',
    accent: '#22c55e',
  },
];

interface RuleSection {
  title: string;
  content: string[];
}

const RULES: RuleSection[] = [
  {
    title: 'Overview',
    content: [
      'In the corrupt city-state of Coup, you are a powerful family head competing for dominance. Your goal is to eliminate the influence of all rival families and be the last player standing.',
      'Each player starts with 2 coins and 2 influence cards (face-down). You don\'t need to have a card to claim its power — bluffing is the heart of the game!',
    ],
  },
  {
    title: 'On Your Turn',
    content: [
      'You must take exactly one action on your turn. Some actions can be challenged by other players, and some can be blocked.',
    ],
  },
  {
    title: 'General Actions (Cannot be challenged)',
    content: [
      'Income — Take 1 coin from the treasury.',
      'Foreign Aid — Take 2 coins from the treasury. Can be blocked by the Duke.',
      'Coup — Pay 7 coins to force a player to lose an influence. This cannot be blocked or challenged. If you have 10+ coins, you must coup.',
    ],
  },
  {
    title: 'Character Actions (Can be challenged)',
    content: [
      'Tax (Duke) — Take 3 coins from the treasury.',
      'Assassinate (Assassin) — Pay 3 coins, target player loses an influence. Can be blocked by Contessa.',
      'Steal (Captain) — Take 2 coins from another player. Can be blocked by Captain or Ambassador.',
      'Exchange (Ambassador) — Draw 2 cards from the Court deck, choose which to keep and return the rest.',
    ],
  },
  {
    title: 'Challenging',
    content: [
      'Any player can challenge an action or counteraction. When you challenge, you are declaring that you don\'t believe the player has the card they claim.',
      'If the challenge succeeds (they were bluffing): The challenged player loses an influence.',
      'If the challenge fails (they had the card): The challenger loses an influence. The challenged player shuffles their revealed card back into the deck and draws a new one.',
    ],
  },
  {
    title: 'Losing Influence',
    content: [
      'When you lose an influence, you must reveal one of your face-down cards. It remains face-up for the rest of the game.',
      'When you lose both influences, you are eliminated from the game.',
      'The last player with influence remaining wins!',
    ],
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 200, damping: 22 } },
};

export default function Rules() {
  const navigate = useNavigate();
  const { colors } = useCoupTheme();

  return (
    <Box
      className="relative min-h-screen px-3 py-4 sm:px-4 sm:py-6"
      sx={{
        bgcolor: colors.charcoal,
        background: `
          radial-gradient(ellipse at 20% 10%, rgba(139,26,43,0.08) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 90%, rgba(74,158,161,0.06) 0%, transparent 50%),
          linear-gradient(180deg, ${colors.charcoal} 0%, #0a1018 100%)
        `,
      }}
    >
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-2xl"
      >
        {/* Header */}
        <motion.div variants={item} className="mb-4 flex items-center gap-3 sm:mb-6">
          <Tooltip title="Back to Home">
            <IconButton
              onClick={() => navigate('/')}
              sx={{ color: colors.textMuted, '&:hover': { color: colors.gold } }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Box>
            <Typography
              variant="h4"
              sx={{
                color: colors.gold,
                fontFamily: '"Cinzel Decorative", serif',
                fontWeight: 700,
                fontSize: { xs: '1.5rem', sm: '2rem' },
              }}
            >
              Rules of Coup
            </Typography>
            <Typography
              sx={{
                color: colors.textMuted,
                fontSize: { xs: '0.7rem', sm: '0.8rem' },
                letterSpacing: 2,
              }}
            >
              Learn the art of deception
            </Typography>
          </Box>
        </motion.div>

        {/* Characters section */}
        <motion.div variants={item} className="mb-6 sm:mb-8">
          <Typography
            sx={{
              color: colors.gold,
              fontFamily: '"Cinzel", serif',
              fontWeight: 700,
              fontSize: { xs: '1rem', sm: '1.2rem' },
              mb: 2,
              letterSpacing: 2,
            }}
          >
            THE CHARACTERS
          </Typography>

          <Box className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {CHARACTERS.map((char, i) => (
              <motion.div
                key={char.name}
                variants={item}
                custom={i}
              >
                <Paper
                  sx={{
                    bgcolor: `${char.color}40`,
                    border: `1px solid ${char.accent}30`,
                    borderRadius: 3,
                    overflow: 'hidden',
                    p: 0,
                    height: '100%',
                  }}
                >
                  <Box className="flex gap-3 p-3 sm:p-4">
                    <Box sx={{ flexShrink: 0 }}>
                      <CharacterAvatar card={char.name} size={56} />
                    </Box>
                    <Box className="min-w-0 flex-1">
                      <Box className="flex items-center gap-2">
                        <Typography
                          sx={{
                            color: char.accent,
                            fontFamily: '"Cinzel", serif',
                            fontWeight: 700,
                            fontSize: { xs: '0.85rem', sm: '0.95rem' },
                          }}
                        >
                          {char.name}
                        </Typography>
                        <Typography
                          sx={{
                            color: colors.teal,
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            bgcolor: `${colors.teal}15`,
                            px: 0.8,
                            py: 0.15,
                            borderRadius: 1,
                          }}
                        >
                          {char.power}
                        </Typography>
                      </Box>
                      <Typography
                        sx={{
                          color: colors.textSecondary,
                          fontSize: { xs: '0.7rem', sm: '0.75rem' },
                          mt: 0.5,
                          lineHeight: 1.5,
                        }}
                      >
                        {char.description}
                      </Typography>
                      <Box className="mt-1.5 flex flex-col gap-0.5">
                        <Typography sx={{ color: colors.gold, fontSize: '0.6rem', fontWeight: 700, letterSpacing: 1 }}>
                          ACTION
                        </Typography>
                        <Typography sx={{ color: colors.textPrimary, fontSize: { xs: '0.65rem', sm: '0.7rem' }, lineHeight: 1.4 }}>
                          {char.action}
                        </Typography>
                        <Typography sx={{ color: colors.crimsonLight, fontSize: '0.6rem', fontWeight: 700, letterSpacing: 1, mt: 0.5 }}>
                          COUNTERACTION
                        </Typography>
                        <Typography sx={{ color: colors.textPrimary, fontSize: { xs: '0.65rem', sm: '0.7rem' }, lineHeight: 1.4 }}>
                          {char.counteraction}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              </motion.div>
            ))}
          </Box>
        </motion.div>

        {/* Rules sections */}
        {RULES.map((section, i) => (
          <motion.div key={section.title} variants={item} className="mb-4 sm:mb-5">
            <Paper
              sx={{
                bgcolor: `${colors.navy}cc`,
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 3,
                p: { xs: 2.5, sm: 3 },
                backdropFilter: 'blur(8px)',
              }}
            >
              <Box className="mb-2 flex items-center gap-2">
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    bgcolor: `${colors.gold}15`,
                    border: `1px solid ${colors.gold}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Typography
                    sx={{
                      color: colors.gold,
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      fontFamily: '"Cinzel", serif',
                    }}
                  >
                    {i + 1}
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    color: colors.gold,
                    fontFamily: '"Cinzel", serif',
                    fontWeight: 700,
                    fontSize: { xs: '0.85rem', sm: '0.95rem' },
                  }}
                >
                  {section.title}
                </Typography>
              </Box>
              <Box className="flex flex-col gap-2">
                {section.content.map((text, j) => (
                  <Typography
                    key={j}
                    sx={{
                      color: colors.textSecondary,
                      fontSize: { xs: '0.75rem', sm: '0.83rem' },
                      lineHeight: 1.7,
                      pl: 1,
                      borderLeft: text.includes('—')
                        ? `2px solid ${colors.gold}30`
                        : 'none',
                    }}
                  >
                    {text}
                  </Typography>
                ))}
              </Box>
            </Paper>
          </motion.div>
        ))}

        {/* Footer */}
        <motion.div variants={item} className="mt-6 pb-8 text-center sm:mt-8">
          <Typography sx={{ color: colors.textMuted, fontSize: '0.7rem', letterSpacing: 2 }}>
            Remember: In Coup, it&apos;s not about what you have — it&apos;s about what others believe you have.
          </Typography>
        </motion.div>
      </motion.div>
    </Box>
  );
}
