  type BuildElement = (name: string, attributes: { [index: string]: string | number }, classes: Array<string>| null) => HTMLElement;

  export const buildElement: BuildElement = (name, attributes, classes) => {
    const element = document.createElement(name);

    Object.keys(attributes).forEach((attr) => {
      const attrValue = attributes[attr]
      if (attrValue !== undefined && attrValue !== null) {
        element.setAttribute(attr, attrValue.toString());
      }
    });

    classes?.forEach((cls: string) => {element.classList.add(cls)});
    return element;
  }