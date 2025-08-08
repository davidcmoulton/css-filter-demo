import { Config } from './config.js';
import * as render from './render.js';
import * as magnitude from './magnitude.js';

type KeyDownHandler = (filter: HTMLFieldSetElement) => (e: KeyboardEvent) => void;

const buildUserFilterLabel = (filterName: string): HTMLLabelElement => {
  const userFilterLabel = render.buildElement('label', { for: filterName }, ['filter__label']) as HTMLLabelElement;
  userFilterLabel.appendChild(document.createTextNode(`${filterName}(`));
  userFilterLabel.appendChild(render.buildElement('output', { id: `magnitudeReporter_${filterName}` }));
  userFilterLabel.appendChild(document.createTextNode(')'));
  return userFilterLabel;
};

const buildDragHandle = (filter: HTMLElement): HTMLButtonElement => {
  const dragHandle = render.buildElement('button', { type: 'button' }, ['filter__drag_handle']) as HTMLButtonElement;
  dragHandle.addEventListener('mousedown', () => { filter.setAttribute('draggable', 'true') });
  dragHandle.addEventListener('mouseup', () => { filter.removeAttribute('draggable') });
  dragHandle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" data-filter-move-icon><path d="M0 0h24v24H0z" fill="none"/><path d="M10 9h4V6h3l-5-5-5 5h3v3zm-1 1H6V7l-5 5 5 5v-3h3v-4zm14 2l-5-5v3h-3v4h3v3l5-5zm-9 3h-4v3H7l5 5 5-5h-3v-3z"/></svg>';
  return dragHandle;
};

type BuildUserFilterWrapper = (filterName: string, handleInput: render.EventListenerCallback, keyDownHandler: KeyDownHandler, filter: HTMLFieldSetElement) =>  HTMLElement;
const buildUserFilterWrapper: BuildUserFilterWrapper = (filterName, handleInput, keyDownHandler, filter) => {
  const userFilterWrapper = render.buildElement('div', {}, ['filter__toggle']);
  userFilterWrapper.addEventListener('keydown', keyDownHandler(filter), true);

  const userFilterToggle = render.buildElement('input', { id: filterName, type: 'checkbox', name: 'filters', value: 'on' }, ['visually-hidden']);
  userFilterToggle.addEventListener('input', handleInput)
  userFilterWrapper.appendChild(userFilterToggle);

  const userFilterLabel = buildUserFilterLabel(filterName);
  userFilterWrapper.appendChild(userFilterLabel);

  const dragHandle = buildDragHandle(filter);
  userFilterWrapper.appendChild(dragHandle);

  return userFilterWrapper;
};

export const build = (
  filterName: string,
  handleInput: render.EventListenerCallback,
  keyDownHandler: KeyDownHandler,
  updateHandler: render.EventListenerCallback,
  availableFilters: Config['availableFilters']
): HTMLFieldSetElement => {

  const potentialFilterConstraints = availableFilters[filterName];
  if (potentialFilterConstraints === undefined) {
    throw new Error(`Missing configuration for "${filterName}" filter.`);
  }
  const filterConstraints = potentialFilterConstraints;

  const filter = render.buildElement('fieldset', { id: `filter_${filterName}` }, ['filter']) as HTMLFieldSetElement;

  const userFilterWrapper = buildUserFilterWrapper(filterName, handleInput, keyDownHandler, filter);
  filter.appendChild(userFilterWrapper);

  const magitudeComponent = magnitude.buildComponent(filterName, filterConstraints, updateHandler);
  filter.appendChild(magitudeComponent);

  return filter;
};