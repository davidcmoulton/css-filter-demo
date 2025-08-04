type DefaultImagePath = string;

type KeyCode = { [index: string]: number };

type Unit = 'px' | '%' | 'deg';

type FilterProperties = {
  min: number,
  max: number,
  step: number,
  unit: Unit,
  initial: number,
};

type AvailableFilters = { [index: string]: FilterProperties };

export type Config = {
  defaultImagePath: DefaultImagePath,
  keyCode: KeyCode,
  availableFilters: AvailableFilters
};

export const config: Config = {
  defaultImagePath: './images/chopper.jpeg',
  keyCode: {
    enter: 13,
    up: 38,
    down: 40
  },
  availableFilters: {
    blur: {
      min: 0,
      max: 10,
      step: 0.5,
      unit: 'px',
      initial: 0,
    },
    brightness: {
      min: 0,
      max: 200,
      step: 1,
      unit: '%',
      initial: 100,
    },
    contrast: {
      min: 0,
      max: 200,
      step: 1,
      unit: '%',
      initial: 100,
    },
    grayscale: {
      min: 0,
      max: 100,
      step: 1,
      unit: '%',
      initial: 0,
    },
    'hue-rotate': {
      min: 0,
      max: 360,
      step: 1,
      unit: 'deg',
      initial: 0,
    },
    invert: {
      min: 0,
      max: 100,
      step: 1,
      unit: '%',
      initial: 0,
    },
    opacity: {
      min: 0,
      max: 100,
      step: 1,
      unit: '%',
      initial: 100,
    },
    saturate: {
      min: 0,
      max: 200,
      step: 1,
      unit: '%',
      initial: 100,
    },
    sepia: {
      min: 0,
      max: 100,
      step: 1,
      unit: '%',
      initial: 0,
    },
  }
};