/**
 * The world's hard rules as they are written in the contract source (contracts/commonwealth.py). The contract does not expose these
 * through a view, so they are copied here, and a test (lib.test.ts) reads the contract source and fails if any of them drifts.
 * The per-citizen common land is NOT here: that one the contract does expose, so the app reads it live from the world.
 */
export const RULES = {
  upkeepGrain: 2,
  starveAfterEpochs: 2,
  farmCost: { wood: 5, stone: 3 },
  maxFarms: 2,
  farmScore: 6,
  maxGainPerAction: 10,
  maxActionsPerBatch: 6,
  maxActionChars: 300,
  maxOpenOffers: 3,
  maxCitizens: 24,
} as const;
