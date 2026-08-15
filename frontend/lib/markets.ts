export type Call = {
  side: "Buy Yes" | "Buy No";
  contract: string;
  price: string;
  why: string;
};

export type AgentRun = {
  id: string;
  at: string;
  insight: string;
  edge: "yes" | "none" | "fading";
};

export type Market = {
  id: string;
  question: string;
  category: string;
  favorite: string;
  favoriteOdds: number;
  longshot: string;
  longshotOdds: number;
  volume: string;
  volumeSeries: number[];
  oddsSeries: number[];
  suggested: boolean;
  call: Call | null;
  runs: AgentRun[];
};

export const MARKETS: Market[] = [
  {
    id: "netflix-us-show",
    question: "What will be the top US Netflix show this week?",
    category: "Culture",
    favorite: "Walter Boys",
    favoriteOdds: 94,
    longshot: "Tires",
    longshotOdds: 6,
    volume: "$37,229",
    volumeSeries: [12, 14, 11, 18, 22, 19, 28, 31, 27, 37],
    oddsSeries: [72, 74, 71, 78, 81, 84, 88, 90, 91, 94],
    suggested: true,
    call: {
      side: "Buy Yes",
      contract: "Tires: Season 3",
      price: "6.0¢",
      why: "Odds treat Walter Boys as a lock. Chatter has already rotated to Tires.",
    },
    runs: [
      {
        id: "r1",
        at: "Today, 11:40",
        insight:
          "Correlator: market 94% Walter Boys vs rising Tires chatter. Flagged divergence.",
        edge: "yes",
      },
      {
        id: "r2",
        at: "Today, 10:12",
        insight:
          "Chatter Scout: Tires clips accelerating. Market Watcher: no odds move yet.",
        edge: "yes",
      },
      {
        id: "r3",
        at: "Yesterday, 8:04",
        insight: "All three aligned on Walter Boys. No call.",
        edge: "none",
      },
    ],
  },
  {
    id: "fed-september",
    question: "Fed decision in September?",
    category: "Finance",
    favorite: "No cut",
    favoriteOdds: 61,
    longshot: "25 bps cut",
    longshotOdds: 32,
    volume: "$1.2M",
    volumeSeries: [40, 42, 55, 48, 62, 70, 68, 81, 90, 88],
    oddsSeries: [48, 50, 52, 55, 54, 58, 59, 60, 61, 61],
    suggested: true,
    call: {
      side: "Buy Yes",
      contract: "No cut",
      price: "61¢",
      why: "Speeches this week match the no-cut price. Chatter is not ahead of the market.",
    },
    runs: [
      {
        id: "r1",
        at: "Today, 9:02",
        insight: "News and odds moved together after the speaker. Aligned.",
        edge: "none",
      },
      {
        id: "r2",
        at: "Yesterday, 16:20",
        insight: "Odds jumped 6 pts with no matching headline. Later walked back.",
        edge: "fading",
      },
    ],
  },
  {
    id: "spiderman-gross",
    question: "Spider-Man domestic gross by August 31?",
    category: "Culture",
    favorite: "Over $180M",
    favoriteOdds: 71,
    longshot: "Under $180M",
    longshotOdds: 29,
    volume: "$108k",
    volumeSeries: [8, 9, 12, 10, 14, 18, 16, 20, 22, 21],
    oddsSeries: [55, 58, 60, 64, 66, 68, 69, 70, 71, 71],
    suggested: false,
    call: null,
    runs: [
      {
        id: "r1",
        at: "Today, 8:30",
        insight: "Box office chatter and odds both grinding up. No gap.",
        edge: "none",
      },
    ],
  },
  {
    id: "bitcoin-aug-15",
    question: "Bitcoin above $70k on August 15?",
    category: "Crypto",
    favorite: "No",
    favoriteOdds: 58,
    longshot: "Yes",
    longshotOdds: 42,
    volume: "$818k",
    volumeSeries: [90, 70, 85, 110, 95, 130, 120, 140, 125, 150],
    oddsSeries: [51, 53, 49, 55, 57, 54, 56, 59, 58, 58],
    suggested: false,
    call: null,
    runs: [
      {
        id: "r1",
        at: "Today, 7:15",
        insight: "CT noise is the market. Correlator: no clean edge.",
        edge: "none",
      },
    ],
  },
];

export function getMarket(id: string) {
  return MARKETS.find((m) => m.id === id);
}

export function suggestedMarkets() {
  return MARKETS.filter((m) => m.suggested && m.call);
}
