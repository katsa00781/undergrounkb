export const sets = [
    {value: "1", label: "1"},
    {value: "2", label: "2"},
    {value: "3", label: "3"},
    {value: "4", label: "4"},
    {value: "5", label: "5"},
    {value: "6", label: "6"},
    {value: "7", label: "7"},
    {value: "8", label: "8"},
    {value: "9", label: "9"},
    {value: "10", label: "10"},
];

export const Ismetlesek = [
    {value: "1", label: "1"},
    {value: "2", label: "2"},
    {value: "3", label: "3"},
    {value: "4", label: "4"},
    {value: "5", label: "5"},
    {value: "6", label: "6"},
    {value: "7", label: "7"},
    {value: "8", label: "8"},
    {value: "9", label: "9"},
    {value: "10", label: "10"},
    {value: "11", label: "11"},
    {value: "12", label: "12"},
    {value: "13", label: "13"},
    {value: "14", label: "14"},
    {value: "15", label: "15"}
];
export const time = [
   { value: "20",label: "20 sec"},
   { value: "25", label: "25 sec"},
    { value: "30", label: "30 sec"},
    { value: "35", label: "35 sec"},
    { value: "40", label: "40 sec"},
    { value: "45", label: "45 sec"},
    { value: "50", label: "50 sec"},
    { value: "55", label: "55 sec"},
    { value: "60", label: "60 sec"},
    {value: "120", label: "120 sec"},
    {value: "150", label: "150 sec"},
    {value: "180", label: "180 sec"},
];

export const weights = [
   { value: "12" , label: "12 kg"},
    { value: "16" , label: "16 kg"},
    { value: "20" , label: "20 kg"},
    { value: "24" , label: "24 kg"},
    { value: "28" , label: "28 kg"},
    { value: "32" , label: "32 kg"},
    { value: "36" , label: "36 kg"},
    { value: "40" , label: "40 kg"},
    { value: "44" , label: "44 kg"},
    { value: "48" , label: "48 kg"},
];

export const clients = [
    { value: "Kácsor Zsolt", label: "Kácsor Zsolt" , imgsrc: "/images/user.jpg", lastDate: "2025.04.19"},
    { value: "Wilk Péter", label: "Wilk Péter", imgsrc: "/images/user2.png", lastDate: "2025.04.19"},
    { value: "Furdújné Rodenbücher Rita", label: "Furdújné Rodenbücher Rita", imgsrc: "/images/user3.png", lastDate: "2025.04.19"},
];

// ...existing code...

export const fmsData = [
    {
      id: "1",
      name: "Kácsor Zsolt",
      imageUrl: "/images/user.jpg",
      lastAssessment: "2025-04-19",
      assessments: {
        deepSquat: { score: 2, pain: false },
        hurdleStep: { score: 2, pain: false },
        inlineLunge: { score: 3, pain: false },
        shoulderMobility: { score: 2, pain: true },
        activeStraightLegRaise: { score: 2, pain: false },
        trunkStabilityPushUp: { score: 3, pain: false },
        rotaryStability: { score: 2, pain: false }
      },
      totalScore: 16,
      notes: "Váll mobilításnál enyhe fájdalom"
    },
    {
      id: "2",
      name: "Wilk Péter",
      imageUrl: "/images/user2.png",
      lastAssessment: "2025-04-19",
      assessments: {
        deepSquat: { score: 3, pain: false },
        hurdleStep: { score: 2, pain: false },
        inlineLunge: { score: 2, pain: false },
        shoulderMobility: { score: 3, pain: false },
        activeStraightLegRaise: { score: 2, pain: false },
        trunkStabilityPushUp: { score: 3, pain: false },
        rotaryStability: { score: 2, pain: true }
      },
      totalScore: 17,
      notes: "Rotációs stabilitásnál enyhe deréktáji fájdalom"
    },
    {
      id: "3",
      name: "Furdújné Rodenbücher Rita",
      imageUrl: "/images/user3.png",
      lastAssessment: "2025-04-19",
      assessments: {
        deepSquat: { score: 2, pain: false },
        hurdleStep: { score: 2, pain: false },
        inlineLunge: { score: 2, pain: false },
        shoulderMobility: { score: 2, pain: false },
        activeStraightLegRaise: { score: 3, pain: false },
        trunkStabilityPushUp: { score: 2, pain: false },
        rotaryStability: { score: 2, pain: false }
      },
      totalScore: 15,
      notes: "Nincs fájdalom egyik gyakorlatnál sem"
    }
  ];
  
  // ...existing code...