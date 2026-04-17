export interface StoryScene {
  id: string;
  text: string;
  visuals: {
    bg: string;
    hero: string;
    item: string;
    effect: string;
  };
}

export interface Character {
  id: string;
  name: string;
  description: string;
  image: number | { color: string; tag: string; isPlaceholder: boolean };
  theme: string;
}

export interface StoryChoice {
  id: string;
  text: string;
  icon: string | number | { color: string; tag: string; isPlaceholder: boolean };
  color: string;
  nextScene: string;
}

export interface StoryProgress {
  currentScene: number;
  totalScenes: number;
  characterId: string;
  choices: string[];
}
