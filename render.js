  export const buildElement = (name, attributes, ...classes) => {
    const element = document.createElement(name);
    Object.keys(attributes).forEach((attr) => { element.setAttribute(attr, attributes[attr]); });
    classes.forEach((cls) => {element.classList.add(cls)});
    return element;
  }