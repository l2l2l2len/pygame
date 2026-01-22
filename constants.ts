
import { Chapter, PlayerState } from './types';

export const STORAGE_KEY = 'pymancer_v2_core_data';

export const INITIAL_PLAYER_STATE: PlayerState = {
  hp: 100,
  maxHp: 100,
  mana: 50,
  maxMana: 50,
  xp: 0,
  level: 1,
  currentChapterId: 1,
  inventory: ['Novice Wand'],
  unlockedChapters: [1],
  completedChapters: [],
};

export const CHAPTERS: Chapter[] = [
  {
    id: 1,
    title: "The Sealed Gates",
    difficulty: "Beginner",
    story: "The ancient library of Pythonia is sealed by a logical gate. To enter, you must define the entry 'status' as 'authorized'.",
    task: "Complete the code to set the status variable to the string 'authorized'.",
    hint: "Use quotes for strings: status = 'authorized'",
    starterCode: "# Define entry status\nstatus = ???\n\nif status == 'authorized':\n    print('The gate glows blue and swings open.')",
    tokens: ["'locked'", "'authorized'", "True", "False"],
    visual: "🏛️",
    reward: { xp: 50, mana: 5 },
    validate: (code, output) => output.includes("swings open"),
  },
  {
    id: 2,
    title: "The Mana Well",
    difficulty: "Beginner",
    story: "The well is dry. It requires a specific amount of mana to activate. Set the 'mana_level' to exactly 100.",
    task: "Assign the integer 100 to the variable mana_level.",
    hint: "Numbers don't need quotes: mana_level = 100",
    starterCode: "mana_level = ???\n\nif mana_level == 100:\n    print('Pure arcane water gushes forth!')",
    tokens: ["50", "100", "'100'", "0"],
    visual: "⛲",
    reward: { xp: 50, mana: 10, item: "Mana Crystal" },
    validate: (code, output) => output.includes("water gushes forth"),
  },
  {
    id: 3,
    title: "The Gargoyle Orbs",
    difficulty: "Intermediate",
    story: "Two stone gargoyles guard the hall. Only if both 'left_orb' and 'right_orb' are set to True will the path clear.",
    task: "Use Boolean values to activate both orbs.",
    hint: "In Python, booleans are True and False (Case Sensitive).",
    starterCode: "left_orb = ???\nright_orb = ???\n\nif left_orb and right_orb:\n    print('The path is clear.')",
    tokens: ["True", "False", "'True'", "1"],
    visual: "🕯️",
    reward: { xp: 100, hp: 20 },
    validate: (code, output) => output.includes("path is clear"),
  },
  {
    id: 4,
    title: "Brewing Clarity",
    difficulty: "Intermediate",
    story: "Your potion is almost complete. You must append 'Moonlight' to the 'ingredients' list.",
    task: "Use the .append() method to add 'Moonlight' to the ingredients.",
    hint: "Methods are called with dots: list.append('item')",
    starterCode: "ingredients = ['Sage', 'Water']\ningredients.???('Moonlight')\n\nif 'Moonlight' in ingredients:\n    print('The brew sparkles with silver light.')",
    tokens: ["push", "append", "add", "insert"],
    visual: "🧪",
    reward: { xp: 150, item: "Silver Cauldron" },
    validate: (code, output) => output.includes("sparkles with silver light"),
  },
  {
    id: 5,
    title: "The Hydra's Trial",
    difficulty: "Advanced",
    story: "The Hydra has multiple heads. You must strike each one in sequence using a loop.",
    task: "Use a for loop to iterate through the heads and print 'Strike!'.",
    hint: "The syntax is: for item in list:",
    starterCode: "heads = ['Alpha', 'Beta', 'Gamma']\n??? head in heads:\n    print('Strike!')",
    tokens: ["while", "for", "if", "each"],
    visual: "🐍",
    reward: { xp: 300, hp: 40, item: "Hydra Fang" },
    validate: (code, output) => (output.match(/Strike!/g) || []).length >= 3,
  },
  {
    id: 6,
    title: "The Oracle's Count",
    difficulty: "Advanced",
    story: "The Oracle demands to know how many souls reside in the Hall. You must calculate the length of the 'souls' list.",
    task: "Use the len() function to get the count of souls.",
    hint: "len(list_name) returns the number of items.",
    starterCode: "souls = ['Merlin', 'Arthur', 'Gwen']\ncount = ???(souls)\n\nif count == 3:\n    print('The Oracle nods in approval.')",
    tokens: ["size", "count", "len", "length"],
    visual: "🧿",
    reward: { xp: 200, mana: 20 },
    validate: (code, output) => output.includes("approval"),
  }
];

export const STATIC_CONTENT = {
    about: {
        title: "About the Chronicles",
        content: `PyMancer: The Code Chronicles is more than just a game; it's a revolutionary way to master Python. 
        Developed by veterans in both software engineering and game design, our mission is to turn the intimidating 
        world of syntax and logic into an epic adventure. Every challenge you solve is a real-world programming 
        pattern, meticulously wrapped in a fantasy narrative that keeps you engaged and motivated.`
    },
    docs: {
        title: "Master's Guide",
        content: `Welcome to the library of Pythonia. Here is how you progress:
        
        1. Tokens: In each chapter, parts of the code are missing (marked by ???). Click them to see available magic tokens.
        2. Logic: Choose the token that satisfies the story's requirement.
        3. Casting: Hit 'Cast Spell' to run your code through our arcane interpreter.
        4. Merlin: If you are truly lost, use 'Seek Merlin's Hint' to receive AI-powered guidance.
        
        Concepts Covered: Variables, Data Types (String, Integer, Boolean), Lists, List Methods, Loops, and Functions.`
    },
    contact: {
        title: "Contact the Scribes",
        content: `Do you have ideas for new chapters? Found a bug in the dungeon? Reach out to us:
        
        Email: archmage@pymancer.io
        Discord: PyMancer Community
        Twitter: @PyMancerGame`
    }
};
