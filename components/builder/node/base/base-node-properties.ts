import { NodeProperties } from "../../node-registry";

export const baseProperties = {
  // id: {
  //   type: 'id' as const,
  //   label: 'Node ID',
  //   value: ''
  // },
  // color: {
  //   type: 'color' as const,
  //   label: 'Color',
  //   value: ''
  // },
};

export type BaseNodeProperties = typeof baseProperties;

const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

export const generateReadableId = () => {
  const adjectives = ['RED', 'BLUE', 'GREEN', 'FAST', 'SLOW', 'BIG', 'SMALL'];
  const nouns = ['CAR', 'TREE', 'ROCK', 'STAR', 'MOON', 'SUN', 'BIRD'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj}_${noun}`;
};

export const generateBaseProperties = () => ({
  // id: generateReadableId(),
  // color: getRandomColor(),
});


