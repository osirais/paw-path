export const rng = (min: number, max: number) => {
  return Math.random() * (max - min) + min;
};
