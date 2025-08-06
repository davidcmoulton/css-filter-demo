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

export const buildElement: BuildElement = (name, attributes, classes): HTMLElement => {
  const element = document.createElement(name);
  setElementAttributes(element, attributes);
  classes?.forEach((className: string) => {element.classList.add(className)});
  return element;
}

export const buildButton = (id: string, text: string, type: 'button' | 'reset'): HTMLButtonElement => {
  const button = buildElement('button', { id, type }, ['button']) as HTMLButtonElement;
  button.innerHTML = text;
  return button;
}
