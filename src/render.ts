const setAttribute = (name: string, value: string, element: HTMLElement): HTMLElement => {
  if (value !== undefined && value !== null) {
    element.setAttribute(name, value);
  }
  return element;
}

const setElementAttributes = (element: HTMLElement, attributes: { [index: string]: string | number }): HTMLElement => {
  Object.keys(attributes).forEach((attribute) => {
    setAttribute(attribute, attributes[attribute]?.toString() ?? '', element);
  });
  return element;
};

type BuildElement = (
  name: string,
  attributes: { [index: string]: string | number },
  classes?: Array<string>
) => HTMLElement;

type BuildFieldsetElement = (
  attributes: { [index: string]: string | number },
  classes?: Array<string>
) => HTMLFieldSetElement;

export const buildElement: BuildElement = (name, attributes, classes): HTMLElement => {
  const element = document.createElement(name);
  setElementAttributes(element, attributes);
  classes?.forEach((className: string) => {element.classList.add(className)});
  return element;
}

export type EventListenerCallback = (e: Event) => void;

export const buildButton = (id: string, text: string, type: 'button' | 'reset', callback: EventListenerCallback): HTMLButtonElement => {
  const button = buildElement('button', { id, type }, ['button']) as HTMLButtonElement;
  button.innerHTML = text;
  if (callback !== undefined) {
    button.addEventListener('click', callback);
  }
  return button;
}

export const buildFieldsetElement: BuildFieldsetElement = (attributes, classes): HTMLFieldSetElement => {
  const fieldset = buildElement('fieldset', attributes, classes) as HTMLFieldSetElement;
  setElementAttributes(fieldset, attributes);
  classes?.forEach((className: string) => {fieldset.classList.add(className)});
  return fieldset;
}

export const buildControls = (
  resetFormAction: EventListenerCallback,
  copyToClipboardAction: EventListenerCallback,
): HTMLElement => {
  const controls = buildElement('div', { id: 'controls' }, ['controls']);

  const resetButton = buildButton('reset', 'Reset', 'reset', resetFormAction) as HTMLButtonElement;
  controls.appendChild(resetButton);

  const copyButton = buildButton('copy', 'Copy to clipboard', 'button', copyToClipboardAction);
  controls.appendChild(copyButton);

  return controls
};

export const deleteOldForm = () => {
    const oldform = document.querySelector('form.filters-grid');
    oldform?.parentElement?.removeChild(oldform);
  };