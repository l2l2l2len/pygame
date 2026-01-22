
import { Chapter, PlayerState } from './types';

export const STORAGE_KEY = 'pymancer_v3_core_data';

export const INITIAL_PLAYER_STATE: PlayerState = {
  hp: 100,
  maxHp: 100,
  mana: 50,
  maxMana: 50,
  xp: 0,
  level: 1,
  currentChapterId: 1,
  inventory: ['Apprentice Cloak'],
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
    starterCode: "# Task: Assign 'authorized' to status\nstatus = ???\n\nif status == 'authorized':\n    print('The gate glows blue and swings open.')",
    tokens: ["'locked'", "'authorized'", "True", "False"],
    visual: "🏛️",
    reward: { xp: 50, mana: 5 },
    validate: (code, output) => output.includes("swings open"),
  },
  {
    id: 2,
    title: "The Mana Well",
    difficulty: "Beginner",
    story: "The well is dry. It requires exactly 100 mana units to overflow. Set the 'mana_level' variable.",
    task: "Assign the integer 100 to the variable mana_level.",
    hint: "Numbers don't need quotes: mana_level = 100",
    starterCode: "# Task: Set mana_level to 100\nmana_level = ???\n\nif mana_level == 100:\n    print('Pure arcane water gushes forth!')",
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
    starterCode: "# Task: Activate both orbs\nleft_orb = ???\nright_orb = ???\n\nif left_orb and right_orb:\n    print('The path is clear.')",
    tokens: ["True", "False", "'True'", "1"],
    visual: "🕯️",
    reward: { xp: 100, hp: 20 },
    validate: (code, output) => output.includes("path is clear"),
  },
  {
    id: 4,
    title: "Brewing Clarity",
    difficulty: "Intermediate",
    story: "Your potion is almost complete. You must append 'Moonlight' to the 'ingredients' list to stabilize the brew.",
    task: "Use the .append() method to add 'Moonlight' to the ingredients.",
    hint: "Methods are called with dots: list.append('item')",
    starterCode: "# Task: Add 'Moonlight' to the list\ningredients = ['Sage', 'Water']\ningredients.???('Moonlight')\n\nif 'Moonlight' in ingredients:\n    print('The brew sparkles with silver light.')",
    tokens: ["push", "append", "add", "insert"],
    visual: "🧪",
    reward: { xp: 150, item: "Silver Cauldron" },
    validate: (code, output) => output.includes("sparkles with silver light"),
  },
  {
    id: 5,
    title: "The Hydra's Trial",
    difficulty: "Advanced",
    story: "The Hydra has multiple heads. You must strike each one in sequence using an automated loop.",
    task: "Use a for loop to iterate through the heads and strike them.",
    hint: "The syntax is: for item in list:",
    starterCode: "# Task: Loop through the heads\nheads = ['Alpha', 'Beta', 'Gamma']\n??? head in heads:\n    print('Strike!')",
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
    starterCode: "# Task: Count the elements\nsouls = ['Merlin', 'Arthur', 'Gwen']\ncount = ???(souls)\n\nif count == 3:\n    print('The Oracle nods in approval.')",
    tokens: ["size", "count", "len", "length"],
    visual: "🧿",
    reward: { xp: 200, mana: 20 },
    validate: (code, output) => output.includes("approval"),
  }
];

export const STATIC_CONTENT = {
    about: {
        title: "About PyMancer",
        content: `PyMancer: The Code Chronicles is a professional educational initiative designed to bridge the gap between abstract programming concepts and engaging gameplay. 
        
        Our platform leverages cognitive science and game design to provide an 'active learning' environment. By placing Python syntax in a high-stakes fantasy context, we trigger the brain's problem-solving pathways more effectively than traditional textbook learning. 
        
        Built by a team of Google-alumni engineers and educators, PyMancer is and will always be free, open-access, and committed to high-quality pedagogy.`
    },
    docs: {
        title: "The Master's Guide",
        content: `Welcome, initiate. To navigate the realm of Pythonia, you must understand the basic laws of logic:
        
        1. Variables: These are containers for magic. Use '=' to store a value.
        2. Strings: Textual spells. Always wrap them in 'single quotes' or "double quotes".
        3. Booleans: The binary truth. 'True' and 'False' govern the logic of the world.
        4. Lists: Arcane collections. Use square brackets [] and append() to grow them.
        5. Control Flow: 'if' statements branch the timeline, and 'for' loops automate repetitive tasks.
        
        How to Play:
        Each chapter provides a code snippet with missing 'tokens' (marked as ???). Click the tokens to select the correct logic. Once the ritual is complete, click 'Execute Ritual' to see your results.`
    },
    contact: {
        title: "Contact the Scribes",
        content: `For inquiries, feedback, or reporting anomalies in the arcane terminal:
        
        Support: scribes@pymancer.app
        Community: Discord (link in footer)
        Partnerships: mage-council@pymancer.app
        
        Our headquarters is located at the Digital Spire in the Cloud-Reach district of Pythonia (conceptually).`
    },
    privacy: {
        title: "Privacy Seal",
        content: `Your privacy is our utmost priority. PyMancer is designed to be a zero-collection platform.
        
        - No Accounts: We do not store email addresses or personal identifiers.
        - Local Storage: Your game progress is stored exclusively in your browser's local storage. We do not sync this to a backend.
        - Cookies: We only use functional cookies essential for site operation.
        - Transparency: If we ever implement optional cloud sync, you will be prompted for explicit consent.`
    },
    terms: {
        title: "The User Oath",
        content: `By entering the realm of Pythonia, you agree to the following Mage's Oath:
        
        1. Non-Malicious Use: You will not use the arcane knowledge gained here for dark magic (hacking/malware).
        2. Open Knowledge: You agree that learning should be accessible to all.
        3. Respect the Terminal: Do not attempt to break the ritual simulator; it is a sensitive piece of digital machinery.
        
        PyMancer is provided "as is" with no warranty of any kind.`
    }
};
