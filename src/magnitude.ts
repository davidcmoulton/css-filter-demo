import { Config, FilterConstraints } from "./config";
import * as render from './render.js';

export const buildComponent = (name: string, filterConfig: FilterConstraints, inputHandler: render.EventListenerCallback): HTMLElement => {
    const magnitudeWrapper = render.buildElement('div', {}, ['filter__slider']);

    const magnitudeLabel = render.buildElement('label', { for: `magnitude_${name}`}, ['visually-hidden']);
    magnitudeLabel.innerHTML = 'Magnitude:';
    magnitudeWrapper.appendChild(magnitudeLabel);

    const magnitudeAttributes = {
        disabled: 'disabled',
        type: 'range',
        id: `magnitude_${name}`,
        value: filterConfig.initial,
        min: filterConfig.min,
        max: filterConfig.max,
        step: filterConfig.step
      };

    const magnitude = render.buildElement('input', magnitudeAttributes);
    magnitude.addEventListener('input', inputHandler);
    magnitudeWrapper.appendChild(magnitude);

    return magnitudeWrapper;
  };