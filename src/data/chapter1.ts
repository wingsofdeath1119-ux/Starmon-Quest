export type EncounterGroup = { rarity: string; entries: { name: string; chance?: number }[] };
export type Weather = 'NONE' | 'RAIN' | 'INSCENTED';
export type Quest = {
  id: string; title: string; rounds: [number, number]; locations: [string, string];
  thugs: { name: string; round: number }[]; challengers: { name: string; round: number }[];
  trainers: { job: string; names: string[] }[];
  encounters: Record<'DAY' | 'NIGHT' | 'RAIN' | 'INSCENTED', EncounterGroup[]>;
};

const groups = (common: EncounterGroup['entries'], uncommon: EncounterGroup['entries'], rare: EncounterGroup['entries'], ultraRare: EncounterGroup['entries']): EncounterGroup[] => [
  { rarity: 'Common', entries: common }, { rarity: 'Uncommon', entries: uncommon },
  { rarity: 'Rare', entries: rare }, { rarity: 'Ultra Rare', entries: ultraRare },
];

export const chapter1Quests: Quest[] = [
  {
    id: 'q1_starville', title: 'Starville', rounds: [1, 6], locations: ['Starville', 'Dirt Path'],
    thugs: [{ name: 'Damien', round: 5 }, { name: 'Jax', round: 5 }], challengers: [],
    trainers: [
      { job: 'Schoolkid', names: ['Timmy', 'Leo', 'Lily', 'Chloe'] },
      { job: 'Bug Collector', names: ['Jimmy', 'Billy', 'Sammy', 'Toby'] },
      { job: 'Highschooler', names: ['Ben', 'Joey', 'Mandy', 'Joseline'] },
    ],
    encounters: {
      DAY: groups([{ name: 'Lumibug', chance: 30 }, { name: 'Oribird', chance: 70 }], [{ name: 'Chubbud' }], [{ name: 'Durihog', chance: 30 }, { name: 'Voltchick', chance: 70 }], [{ name: 'Gintiny' }]),
      NIGHT: groups([{ name: 'Lumibug', chance: 70 }, { name: 'Oribird', chance: 30 }], [{ name: 'Chubbud' }], [{ name: 'Durihog', chance: 70 }, { name: 'Voltchick', chance: 30 }], [{ name: 'Gintiny' }]),
      RAIN: [], INSCENTED: [],
    },
  },
  {
    id: 'q2_amber_park', title: 'Amber Park', rounds: [7, 12], locations: ['Amber Park', 'Greenland Trail'],
    thugs: [{ name: 'Brutus', round: 10 }, { name: 'Rex', round: 10 }], challengers: [{ name: 'Vance', round: 12 }],
    trainers: [
      { job: 'Highschooler', names: ['Molly', 'Alice', 'Brad', 'Kevin'] },
      { job: 'Bird Watcher', names: ['Enzo', 'Otis', 'Walter', 'Flynn'] },
      { job: 'Old Man', names: ['Edward', 'Arthur', 'Henry', 'George'] },
    ],
    encounters: {
      DAY: groups([{ name: 'Lumibug', chance: 30 }, { name: 'Oribird', chance: 70 }], [{ name: 'Chubbud' }], [{ name: 'Durihog', chance: 70 }, { name: 'Lizap', chance: 30 }], [{ name: 'Cottontail' }]),
      NIGHT: groups([{ name: 'Lumibug', chance: 50 }, { name: 'Chompy', chance: 50 }], [{ name: 'Castlepod' }], [{ name: 'Durihog', chance: 70 }, { name: 'Lizap', chance: 30 }], [{ name: 'Cottontail' }]),
      RAIN: groups([{ name: 'Lumibug', chance: 50 }, { name: 'Chompy', chance: 50 }], [{ name: 'Castlepod' }], [{ name: 'Lizap' }], [{ name: 'Cottontail' }]), INSCENTED: [],
    },
  },
  {
    id: 'q3_countryside_farm', title: 'Countryside Farm', rounds: [13, 18], locations: ['Countryside Farm', 'Old Wagon Road'],
    thugs: [{ name: 'Boomer', round: 15 }, { name: 'Kane', round: 15 }], challengers: [],
    trainers: [
      { job: 'Farmer', names: ['Joe', 'Cletus', 'Jeb', 'Luke'] },
      { job: 'Housekeeper', names: ['Casper', 'Martha', 'Clara', 'Beatrice'] },
      { job: 'Old Man', names: ['Karu', 'Magnus', 'Bobby', 'Viktor'] },
    ],
    encounters: {
      DAY: groups([{ name: 'Lumibug', chance: 30 }, { name: 'Oribird', chance: 70 }], [{ name: 'Chubbud' }], [{ name: 'Durihog', chance: 30 }, { name: 'Voltchick', chance: 70 }], [{ name: 'Gintiny' }]),
      NIGHT: groups([{ name: 'Lumibug', chance: 70 }, { name: 'Oribird', chance: 30 }], [{ name: 'Chubbud' }], [{ name: 'Durihog', chance: 70 }, { name: 'Voltchick', chance: 30 }], [{ name: 'Gintiny' }]), RAIN: [], INSCENTED: [],
    },
  },
  {
    id: 'q4_outer_forest', title: 'Outer Forest', rounds: [19, 24], locations: ['Outer Forest', 'Woodland Track'],
    thugs: [{ name: 'Fang', round: 20 }, { name: 'Razor', round: 20 }], challengers: [{ name: 'Maya', round: 24 }],
    trainers: [
      { job: 'Hiker', names: ['Walker', 'Gary', 'Bruce', 'Logan'] },
      { job: 'Camper', names: ['Scout', 'Nate', 'Wendy', 'Daisy'] },
      { job: 'Ranger', names: ['Jack', 'Clint', 'Wyatt', 'Forest'] },
    ],
    encounters: {
      DAY: groups([{ name: 'Lumibug', chance: 33 }, { name: 'Chompy', chance: 33 }, { name: 'Oribird', chance: 34 }], [{ name: 'Chubbud', chance: 50 }, { name: 'Castlepod', chance: 50 }], [{ name: 'Durihog', chance: 30 }, { name: 'Voltchick', chance: 70 }], [{ name: 'Gintiny' }]),
      NIGHT: groups([{ name: 'Lumibug', chance: 33 }, { name: 'Chompy', chance: 33 }, { name: 'Oribird', chance: 34 }], [{ name: 'Chubbud', chance: 50 }, { name: 'Castlepod', chance: 50 }], [{ name: 'Durihog', chance: 70 }, { name: 'Lizap', chance: 30 }], [{ name: 'Gintiny' }]), RAIN: [], INSCENTED: [],
    },
  },
  {
    id: 'q5_deep_canopy', title: 'Deep Canopy', rounds: [25, 30], locations: ['Deep Canopy', 'Mystic Canopy Trail'],
    thugs: [{ name: 'Malakor', round: 25 }], challengers: [{ name: 'Forest Warden Silas', round: 30 }],
    trainers: [
      { job: 'Ranger', names: ['Steve', 'Ben', 'Rowan'] },
      { job: 'Explorer', names: ['Cam', 'Dave', 'Misa'] },
      { job: 'Hiker', names: ['Joe', 'Lily', 'Konsa'] },
    ],
    encounters: {
      DAY: groups([{ name: 'Lumibug', chance: 25 }, { name: 'Chompy', chance: 25 }, { name: 'Oribird', chance: 25 }, { name: 'Lumicoon', chance: 12 }, { name: 'Canori', chance: 13 }], [{ name: 'Florabud', chance: 20 }, { name: 'Volcanant', chance: 20 }, { name: 'Castlepod', chance: 30 }, { name: 'Chubbud', chance: 30 }], [{ name: 'Durihog', chance: 30 }, { name: 'Voltchick', chance: 70 }], [{ name: 'Gintiny', chance: 50 }, { name: 'Cottontail', chance: 50 }]),
      NIGHT: groups([{ name: 'Lumibug', chance: 25 }, { name: 'Chompy', chance: 25 }, { name: 'Oribird', chance: 25 }, { name: 'Lumicoon', chance: 12 }, { name: 'Canori', chance: 13 }], [{ name: 'Volcanant', chance: 20 }, { name: 'Snailfort', chance: 20 }, { name: 'Firant', chance: 30 }, { name: 'Castlepod', chance: 30 }], [{ name: 'Durihog', chance: 70 }, { name: 'Lizap', chance: 30 }], [{ name: 'Gintiny', chance: 50 }, { name: 'Cottontail', chance: 50 }]),
      RAIN: [],
      INSCENTED: [
        ...groups([{ name: 'Canori', chance: 34 }, { name: 'Lumicoon', chance: 33 }, { name: 'Snapjaw', chance: 33 }], [{ name: 'Chubbud', chance: 50 }, { name: 'Castlepod', chance: 50 }], [{ name: 'Duribrute', chance: 34 }, { name: 'Voltkawk', chance: 33 }, { name: 'Geckolt', chance: 33 }], [{ name: 'Gintiny', chance: 50 }, { name: 'Cottontail', chance: 50 }]),
        { rarity: 'Legendary', entries: [{ name: 'Cervalor' }] },
      ],
    },
  },
];

export function getRoundLocation(quest: Quest, round: number): string {
  const midpoint = (quest.rounds[0] + quest.rounds[1]) / 2;
  return round <= midpoint ? quest.locations[0] : quest.locations[1];
}

