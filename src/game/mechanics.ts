import type { EncounterGroup } from '../data/chapter1';

export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Ultra Rare' | 'Legendary';
export type StatName = 'hp' | 'pp' | 'def' | 'mp' | 'md' | 'speed';
export type CombatantStats = { hp: number; pp: number; def: number; mp: number; md: number; speed: number };
export type EvolutionBonus = Partial<Record<StatName, number>>;

const baseMcap: Record<Rarity, number> = { Common: 2, Uncommon: 2.5, Rare: 3, 'Ultra Rare': 3, Legendary: 4 };
const rarityMultipliers = [1, 1.15, 1.3, 1.45, 1.65, 1.8, 2.5];

function milestoneMcap(rarity: Rarity, level: number): number {
  if (level % 10 !== 0) return 0;
  if (rarity === 'Common') return level <= 50 ? 1 : 2;
  if (rarity === 'Uncommon' || rarity === 'Legendary') return rarity === 'Uncommon' ? 2 : 4;
  if (rarity === 'Rare') return level <= 50 ? 2 : 3;
  return level <= 50 ? 3 : 4;
}

export function getStatCap(baseStat: number, rarity: Rarity, level: number, stat: StatName, evolutionBonus = 0): number {
  const boundedLevel = Math.min(100, Math.max(1, Math.floor(level)));
  let milestoneBonus = 0;
  for (let milestone = 10; milestone <= boundedLevel; milestone += 10) milestoneBonus += milestoneMcap(rarity, milestone);
  const hpScale = stat === 'hp' ? 4 : 1;
  return baseStat + hpScale * (baseMcap[rarity] * (boundedLevel - 1) + milestoneBonus) + evolutionBonus;
}

export function getStatPointsForLevel(rarity: Rarity, targetLevel: number): number {
  const level = Math.max(2, Math.floor(targetLevel));
  let points = rarity === 'Ultra Rare' ? 5 : rarity === 'Legendary' ? 5 : 4;
  if (rarity === 'Uncommon' && ((level % 3 === 0 && level < 100) || level === 100)) points += 1;
  if ((rarity === 'Rare' || rarity === 'Legendary') && level % 2 === 0) points += 1;
  if (level % 10 === 0) {
    if (rarity === 'Common') points += level <= 50 ? 2 : 3;
    else if (rarity === 'Uncommon') points += 3;
    else if (rarity === 'Rare') points += level <= 50 ? 3 : 4;
    else if (rarity === 'Ultra Rare') points += level <= 50 ? 4 : 5;
    else points += 6;
  }
  return points;
}

export function getExpToNextLevel(level: number): number {
  const n = Math.max(1, Math.floor(level));
  return Math.round(0.028 * n ** 4 + 1.1 * n ** 3 + 10 * n ** 2 + 30 * n);
}

export function getRarityTier(rarity: Rarity, evolutionStage: 1 | 2 | 3): number {
  const tierOffset: Record<Rarity, number> = { Common: 0, Uncommon: 1, Rare: 2, 'Ultra Rare': 3, Legendary: 7 };
  return rarity === 'Legendary' ? 7 : Math.min(6, tierOffset[rarity] + evolutionStage);
}

export function getExpReward(enemyLevel: number, rarity: Rarity, evolutionStage: 1 | 2 | 3, modifierBoost = 1): number {
  const tier = getRarityTier(rarity, evolutionStage);
  return 20 * enemyLevel * rarityMultipliers[tier - 1] * modifierBoost;
}

export function getPartyExpRewards(exp: number, partySize: number): number[] {
  const size = Math.min(6, Math.max(0, Math.floor(partySize)));
  return Array.from({ length: size }, (_, index) => exp * (index === 0 ? 1 : 0.5));
}

export function calculateDamage(input: {
  movePower: number; category: 'physical' | 'magical'; attacker: CombatantStats; defender: CombatantStats;
  critical?: boolean; elementalMultiplier?: 0.85 | 1 | 1.15;
}): number {
  if (input.movePower <= 0) return 0;
  const attack = input.category === 'physical' ? input.attacker.pp : input.attacker.mp;
  const defense = input.category === 'physical' ? input.defender.def : input.defender.md;
  const base = (1 + input.movePower / 100) * attack * (100 / (100 + defense));
  return base * (input.critical ? 1.5 : 1) * (input.elementalMultiplier ?? 1);
}

export function goesFirst(speedA: number, speedB: number, random = Math.random): 'A' | 'B' {
  if (speedA > speedB) return 'A';
  if (speedB > speedA) return 'B';
  return random() < 0.5 ? 'A' : 'B';
}

export type EncounterOdds = 'normal' | 'rarity_item' | 'rarity_item_hidden_legendary' | 'special_event';
const tierOdds: Record<EncounterOdds, [number, number, number, number, number]> = {
  normal: [60, 25, 12, 3, 0],
  rarity_item: [50, 30, 15, 5, 0],
  rarity_item_hidden_legendary: [50, 30, 15, 4, 1],
  special_event: [45, 27, 18, 7, 3],
};

export function chooseWildEncounter(
  groups: EncounterGroup[], options: { odds: EncounterOdds; hasRarityItem: boolean; random?: () => number },
): { rarity: string; species: string } | null {
  if (options.odds === 'special_event' && !options.hasRarityItem) return null;
  if (options.odds === 'rarity_item' && !options.hasRarityItem) return null;
  if (options.odds === 'rarity_item_hidden_legendary' && !options.hasRarityItem) return null;
  const random = options.random ?? Math.random;
  const distribution = tierOdds[options.odds];
  const available = groups.filter((group) => group.entries.length > 0);
  const order = ['Common', 'Uncommon', 'Rare', 'Ultra Rare', 'Legendary'];
  const buckets = order.map((rarity, index) => ({ rarity, weight: distribution[index], group: available.find((entry) => entry.rarity === rarity) })).filter((entry) => entry.weight > 0 && entry.group);
  const bucket = weightedPick(buckets, (item) => item.weight, random);
  if (!bucket) return null;
  const species = weightedPick(bucket.group!.entries, (entry) => entry.chance, random);
  return species ? { rarity: bucket.rarity, species: species.name } : null;
}

function weightedPick<T>(items: T[], weightOf: (item: T) => number | undefined, random: () => number): T | null {
  if (!items.length) return null;
  const weights = items.map((item) => weightOf(item));
  const total = weights.every((weight) => weight === undefined) ? items.length : weights.reduce<number>((sum, weight) => sum + (weight ?? 0), 0);
  if (total <= 0) return items[Math.min(items.length - 1, Math.floor(random() * items.length))];
  let roll = random() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= weights.every((weight) => weight === undefined) ? 1 : weights[i] ?? 0;
    if (roll < 0) return items[i];
  }
  return items[items.length - 1];
}

