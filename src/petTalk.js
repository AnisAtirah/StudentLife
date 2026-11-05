import { useCallback, useEffect, useRef, useState } from "react";

/*
 * What the pet (or your character) says in its speech bubble.
 * {name} = the pet's name, {user} = your first name.
 */

export const MOTIVATION = [
  "Hwaiting! 💪",
  "Aja aja hwaiting, {user}!",
  "Fighting! You've got this! 🔥",
  "Semangat! 🔥",
  "Jom, sikit lagi! Almost there!",
  "Boleh! One page at a time.",
  "Small steps every day = big results.",
  "Future you will say thank you! 💌",
  "Focus mode ON 🎧",
  "Your Dean's List era starts now ✨",
  "Don't stop until you're proud.",
  "{name} believes in you! 🐾",
  "Progress, not perfection.",
  "Every expert was once a beginner.",
  "You're doing better than you think.",
  "The exam won't know what hit it! 😤",
  "Breathe. Focus. Conquer.",
  "Study now, shine later ⭐",
  "Brain gains loading… 🧠",
  "You + focus = unstoppable.",
  "Distractions? Never heard of them.",
  "Phone face-down, dreams face-up! 📱⬇️",
  "Consistency beats motivation. Keep showing up!",
  "One hard thing at a time. You can do this.",
  "Hard work today, easy exam tomorrow. 📚",
  "Proud of you for starting! 🌱",
];

export const STUDY_TIPS = [
  "Close your notes and explain it out loud. If you can teach it, you know it!",
  "Phone in another room = 2x the focus.",
  "Write questions while you read, then answer them later.",
  "Start with the hardest topic while your brain is fresh.",
  "Past year papers are gold. Practise under exam timing!",
  "Mix topics in one session. It helps you remember longer.",
];

export const BREAK_TIPS = [
  "Look at something 20 feet (6 m) away for 20 seconds. Your eyes will thank you! 👀",
  "Drink some water! 💧 Even a little dehydration makes focusing harder.",
  "Stand up and stretch your arms up high. 🙆",
  "Roll your shoulders back 5 times. Bye bye study hunch!",
  "Try box breathing: in 4, hold 4, out 4, hold 4. 🫁",
  "Walk around for a minute. Moving helps your brain reset.",
  "Grab a healthy snack: fruit or nuts! 🍎",
  "Try not to scroll social media. Let your eyes and brain rest. 📵",
  "Quick: say one thing you just learned. That locks it in!",
  "Tidy one thing on your desk. Clean desk, clear mind ✨",
];

export const LONG_BREAK_TIPS = [
  "Long break! Eat a proper meal, your brain runs on fuel. 🍛",
  "A 15–20 minute power nap can recharge you. Set an alarm! 😴",
  "Go outside for some sunlight and fresh air. 🌤️",
  "Message a friend or call family. Social breaks are real breaks!",
  "Do a few stretches or a short walk. Your back will thank you.",
  "Refill your water bottle and maybe make a drink. ☕",
  "Rest your eyes away from screens for a while. 🌿",
  "You've done a full round! Look at how far you've come. 🏆",
];

export const FUN_FACTS = [
  "Octopuses have three hearts and blue blood! 🐙",
  "A day on Venus is longer than a year on Venus. 🪐",
  "Botanically, bananas are berries, but strawberries aren't! 🍌",
  "Sharks existed before trees did. 🦈",
  "Wombats make cube-shaped poop. Yes, really! 🟫",
  "Sea otters sometimes hold hands while they sleep so they don't drift apart. 🦦",
  "The Eiffel Tower can grow about 15 cm taller in summer because metal expands in heat.",
  "Your brain uses about 20% of your body's energy, so studying is a workout! 🧠",
  "Butterflies taste with their feet. 🦋",
  "A group of flamingos is called a \"flamboyance\". 🦩",
  "Koalas can sleep up to 20 hours a day. Goals? 🐨",
  "In 1947, engineers found a real moth stuck in a computer and taped it into the logbook as a \"bug\". 🐛",
  "The Python programming language is named after Monty Python, not the snake. 🐍",
  "Sunlight takes about 8 minutes to reach Earth. ☀️",
  "Rafflesia, one of the world's biggest flowers, grows in Malaysian rainforests. 🌺",
  "The Petronas Twin Towers were the tallest buildings in the world from 1998 to 2004. 🏙️",
  "Mount Kinabalu is about 4,095 m tall, the highest peak in Malaysia. ⛰️",
  "Cats sleep around 12–16 hours a day. 🐱",
  "Turtles have been around for over 200 million years, since the time of the dinosaurs! 🐢",
  "Every dog's nose print is unique, like a fingerprint. 🐶",
  "Honey found in ancient Egyptian tombs was reportedly still edible after thousands of years. 🍯",
  "Your brain keeps working on problems while you rest. Breaks help you learn! 💤",
];

export const IDLE = [
  "Ready when you are! Press Start 🍅",
  "Let's study together? 📖",
  "I made coffee for us ☕",
  "Pet me for good luck! 🐾",
  "One pomodoro is just 25 minutes. Jom!",
];

export const CHEERS_FOCUS_DONE = [
  "Daebak! You did it! 🎉",
  "Hebat! Session complete! Take a breather 😌",
  "Yay! One more 🍅 in the bag!",
  "So proud of you! Break time ☕",
  "Level up your brain: done! ✨",
];

export const CHEERS_BREAK_DONE = [
  "Break's over. Hwaiting! 💪",
  "Recharged? Let's go again! 🔥",
  "Jom sambung! Back to work 📚",
];

const INTERVALS = { focus: 180000, short: 45000, long: 60000, idle: 60000 };
const HOLD_MS = 12000; // keep a cheer on screen this long before normal lines resume

function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/*
 * The pet's current line. It changes on a timer that depends on the Pomodoro mode,
 * avoids repeats (shuffled "bags"), and can be told to cheer when a session ends.
 */
export function usePetTalk({ mode, running, petName, userName, extraIdle = [] }) {
  const bags = useRef({});
  const holdUntil = useRef(0);
  const category = running ? mode : "idle"; // focus | short | long | idle

  const fill = useCallback(text => text
    .replace(/\{name\}/g, petName || "Your buddy")
    .replace(/\{user\}/g, userName || "friend"), [petName, userName]);

  // Draw the next line from a shuffled bag so nothing repeats until all are used
  const draw = useCallback((key, list) => {
    if (!bags.current[key]?.length) bags.current[key] = shuffle(list);
    return bags.current[key].pop();
  }, []);

  const make = useCallback(cat => {
    const r = Math.random();
    if (cat === "focus") {
      return r < 0.8
        ? { kind: "motivation", text: fill(draw("motivation", MOTIVATION)) }
        : { kind: "tip", text: draw("studyTips", STUDY_TIPS) };
    }
    if (cat === "short") {
      return r < 0.5
        ? { kind: "fact", text: draw("facts", FUN_FACTS) }
        : { kind: "tip", text: draw("breakTips", BREAK_TIPS) };
    }
    if (cat === "long") {
      return r < 0.5
        ? { kind: "fact", text: draw("facts", FUN_FACTS) }
        : { kind: "tip", text: draw("longTips", LONG_BREAK_TIPS) };
    }
    const idleLines = [...IDLE, ...extraIdle];
    return r < 0.6
      ? { kind: "idle", text: fill(draw(`idle-${idleLines.length}`, idleLines)) }
      : { kind: "motivation", text: fill(draw("motivation", MOTIVATION)) };
  }, [draw, fill, extraIdle]);

  const [line, setLine] = useState(() => make(category));
  const makeRef = useRef(make);
  makeRef.current = make;

  useEffect(() => {
    if (Date.now() >= holdUntil.current) setLine(makeRef.current(category));
    const id = setInterval(() => {
      if (Date.now() >= holdUntil.current) setLine(makeRef.current(category));
    }, INTERVALS[category]);
    return () => clearInterval(id);
  }, [category]);

  return {
    line,
    /* New line right now (e.g. when you pet it) */
    next: () => {
      holdUntil.current = 0;
      setLine(makeRef.current(category));
    },
    /* Celebrate the end of a session; stays up for a few seconds */
    cheer: finishedMode => {
      const list = finishedMode === "focus" ? CHEERS_FOCUS_DONE : CHEERS_BREAK_DONE;
      holdUntil.current = Date.now() + HOLD_MS;
      setLine({ kind: "cheer", text: fill(draw(`cheer-${finishedMode}`, list)) });
    },
  };
}

export const TALK_LABELS = { fact: "🤓 Fun fact", tip: "💡 Tip" };
