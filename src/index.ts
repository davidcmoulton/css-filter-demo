import { config, Config, AvailableFilterNames as FilterName } from './config.js';
import * as render from './render.js';

(function (window, config: Config) {

    // Keyboard interaction
    const handleKeyUp = (e, keyCode: Config['keyCode']) => {
      const filter = e.target.closest('.filter');
      switch (e.keyCode) {
        case keyCode.enter:
          toggleFilter(filter);
        break;
        default:
          e.preventDefault();
          e.stopPropagation();  
        break;
      }
    };

// RENDERING

  const buildUserFilter = (name: FilterName, min, max, step, value, image: HTMLImageElement, filters, canvas: HTMLCanvasElement, keyCode: Config['keyCode']) => {
    
    const filter = render.buildElement('fieldset', { id: `filter_${name}` }, ['filter']);

    const userFilterWrapper = render.buildElement('div', {}, ['filter__toggle']);
    const userFilterLabel = render.buildElement('label', { for: name }, ['filter__label']);
    const userFilterToggle = render.buildElement('input', { id: name, type: 'checkbox', name: 'filters', value: 'on' }, ['visually-hidden']);
    userFilterToggle.addEventListener('input', () => { update(image, filters, canvas); })

    userFilterWrapper.addEventListener('keydown', (e) => {
      console.log(e.keyCode);
      console.log(e.target);
      if (e.keyCode === keyCode.up) {
        e.preventDefault();
        e.stopPropagation();
        promoteFilter(e.target.closest('.filter'));
      } else if (e.keyCode === keyCode.down) {
        e.preventDefault();
        e.stopPropagation();
        demoteFilter(e.target.closest('.filter'));
      }
    }, true);
    userFilterWrapper.addEventListener('keyup', (e) => handleKeyUp(e, keyCode));

    const dragHandle = render.buildElement('button', { type: 'button' }, ['filter__drag_handle']);
    dragHandle.addEventListener('mousedown', () => { filter.setAttribute('draggable', 'true') });
    dragHandle.addEventListener('mouseup', () => { filter.removeAttribute('draggable') });
    dragHandle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" data-filter-move-icon><path d="M0 0h24v24H0z" fill="none"/><path d="M10 9h4V6h3l-5-5-5 5h3v3zm-1 1H6V7l-5 5 5 5v-3h3v-4zm14 2l-5-5v3h-3v4h3v3l5-5zm-9 3h-4v3H7l5 5 5-5h-3v-3z"/></svg>';

    const magnitudeWrapper = render.buildElement('div', {}, ['filter__slider']);
    const magnitudeLabel = render.buildElement('label', { for: `magnitude_${name}`}, ['visually-hidden']);
    const magnitude = render.buildElement('input', { disabled: 'disabled', type: 'range', id: `magnitude_${name}`, value, min, max, step });
    magnitudeLabel.innerHTML = 'Magnitude:';
    magnitude.addEventListener('input', (e) => { update(image, filters, canvas); });

    filter.appendChild(userFilterWrapper);
    userFilterWrapper.appendChild(userFilterToggle);
    userFilterWrapper.appendChild(userFilterLabel);
    userFilterWrapper.appendChild(dragHandle);
    userFilterLabel.appendChild(document.createTextNode(`${name}(`));
    userFilterLabel.appendChild(render.buildElement('output', { id: `magnitudeReporter_${name}` }));
    userFilterLabel.appendChild(document.createTextNode(')'));

    filter.appendChild(magnitudeWrapper);
    magnitudeWrapper.appendChild(magnitudeLabel);
    magnitudeWrapper.appendChild(magnitude);

    return filter;
  };

  type BuildButton = (id: string, text: string, type: 'button' | 'reset') => HTMLButtonElement;

  const buildButton: BuildButton = (id, text, type) => {
    const button = render.buildElement('button', { id, type }, ['button']) as HTMLButtonElement;
    button.innerHTML = text;
    return button;
  }

  const deleteOldForm = () => {
    const oldform: HTMLFormElement | null = document.querySelector('form.filters-grid');
    oldform?.parentElement?.removeChild(oldform);
  };

  const buildControls = (image, filters, canvas) => {
    const controls = render.buildElement('div', { id: 'controls' }, ['controls']);
    const resetButton = buildButton('reset', 'Reset', 'reset');
    resetButton.addEventListener('click', () => { reset(image, filters, canvas); });
    
    const copyButton = buildButton('copy', 'Copy to clipboard', 'button');
    copyButton.addEventListener('click', (e) => { copyToClipboard(e, image); });

    controls.appendChild(resetButton);
    controls.appendChild(copyButton);

    return controls
  };

  const addFormToDom = (form) => {
    document.querySelector('#filters').insertBefore(form, document.querySelector('#filtersRider'));
  }

  const buildFiltersForm = (image, filters, canvas, keyCode) => {
    
    deleteOldForm();
    
    const form = render.buildElement('form', {}, ['filters-grid']);

    Object.keys(filters).forEach((name) => {
      const filter = filters[name];
      form.appendChild(buildUserFilter(name, filter.min, filter.max, filter.step, filter.initial, image, filters, canvas, keyCode));
    });
    
    form.appendChild(buildControls(image, filters, canvas));
    
    addFormToDom(form);
    
    return form;
  };

  // FILTER BEHAVIOUR

  const setFilter = (filters, image, name, unit = '') => {
    const magnitudeElement = document.querySelector(`#magnitude_${name}`);
    const magnitudeReporter = document.querySelector(`#magnitudeReporter_${name}`);
    const filterElement = magnitudeElement.closest('.filter');
    if (document.querySelector(`#${name}`).checked) {
      turnOnFilter(filterElement)
      const magnitude = `${magnitudeElement.value}${unit}`;
      image.style.filter += `${name}(${magnitude}`;
      magnitudeReporter.innerHTML = magnitude;
    } else {
      turnOffFilter(filterElement)
      const filterData = filters[name];
      magnitudeElement.value = filterData.initial;
      magnitudeReporter.innerHTML = `${filterData.initial}${filterData.unit}`;
    }
  };

  const isNonDefaultFilterApplied = (image, filters) => {
    const appliedFilters = image.style.filter;
    let nonDefaultApplied = false;
    // TODO: relate userFilters to where they're built?
    const userFilters = document.querySelectorAll('.filter');
    userFilters?.forEach((userFilter) => {
      const name = userFilter.getAttribute('id').substring(7);
      const filter = filters[name];
      const startingValue = `${name}(${filter.initial}${filter.unit})`
      if (appliedFilters.includes(name) && !appliedFilters.includes(startingValue)) {
        nonDefaultApplied = true;
      }
    });
    return nonDefaultApplied;
  };

  const hide = (...elements) => {
    elements.forEach((element) => {
      element.classList.add('hidden');
    });
  }

  const show = (...elements) => {
    elements.forEach((element) => {
      element.classList.remove('hidden');
    });
  }

  const toggleFilter = (filter) => {
    if (filter.classList.contains('active')) {
      turnOffFilter(filter);
    } else {
      turnOnFilter(filter);
    }
  };

  // const calculatePositionWithinSiblings = (element) => {
  //   let evaluated = element;
  //   let siblingPosition = 1;
  //   while(evaluated.previousElementSibling) {
  //     evaluated = evaluated.previousElementSibling;
  //     siblingPosition += 1;
  //   }
  //   return siblingPosition;
  // };

  const promoteFilter = (filter) => {
    // const siblingPosition = calculatePositionWithinSiblings(filter);
    filter.parentElement.insertBefore(filter, filter.previousElementSibling);
  };

  const demoteFilter = (filter) => {
    filter.parentElement.insertBefore(filter, filter.nextElementSibling);
  };

  const turnOnFilter = (filter) => {
    activate(filter);
    filter.querySelector('[name="filters"]').checked = true;

    const slider = filter.querySelector('input[type="range"]');
    slider.removeAttribute('disabled');
    slider.focus();
  };

  const turnOffFilter = (filter) => {
    deactivate(filter);
    filter.querySelector('[name="filters"]').checked = false;

    const slider = filter.querySelector('input[type="range"]');
    slider.setAttribute('disabled', 'disabled');
    slider.blur();
  };

  const activate = (element) => {
    element.classList.add('active');
  }

  const deactivate = (element) => {
    element.classList.remove('active');
  }

  const resetCopyButton = (button) => {
    button.innerHTML = 'Copy filters to clipboard'
    button.removeAttribute('disabled');
  };

  const update = (image, filters, canvas) => {
    
    image.style.filter = '';
    
    const userFilterList = document.querySelectorAll('.filter');
    
    userFilterList.forEach((userFilter) => {
      const name = userFilter.getAttribute('id').substring(7);
      setFilter(filters, image, name, filters[name].unit);
    });

    const imageWrapper = document.querySelector('.image-wrapper');
    const summary = document.querySelector('#summary');
    const controls = document.querySelector('#controls');
    
    if (isNonDefaultFilterApplied(image, filters)) {
      activate(imageWrapper);
      show(summary, controls);
      resetCopyButton(document.querySelector('#copy'));
      printFilters(image);
    } else {
      deactivate(imageWrapper);
      hide(summary, controls);
      clearPrintedFilters();
    }

    updateCanvas(image, canvas);
    updateImageForDownload(image, canvas);
  };

  const reset = (image, filters, canvas, keyCode) => {
    const form = document.querySelector('form');
    form.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => { checkbox.checked = false; });
    buildFiltersForm(image, filters, canvas, keyCode);
    update(image, filters);
  };

  const copyToClipboard = (e, image) => {
    navigator.clipboard.writeText(`filter: ${image.style.filter};`);
    e.target.innerHTML = 'Copied!'
    e.target.setAttribute('disabled', 'disabled');
  };

  const printFilters = (image) => {
    document.querySelector('#filtersOutput').innerHTML = `filter: ${image.style.filter};`;
  };

  const clearPrintedFilters = () => {
    document.querySelector('#filtersOutput').innerHTML = '';
  };

  // DRAG IMAGE

  const processImageFile = (file, image) => {
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      image.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const setupImageSelection = (image) => {
    document.querySelector('#filePicker').addEventListener('change', (e) => {
      processImageFile(e.target.files[0], image);
    });
  };

  const setupImageDropZone = (image) => {
    const handleFileDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      processImageFile(e.dataTransfer.files[0], image);
    };

    const handDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'copy';
    };

    const dropZone = document.querySelector('#imageDropZone');
    dropZone.addEventListener('dragover', handDragOver);
    dropZone.addEventListener('drop', handleFileDrop, false);
  };

  const insertImageIntoDom = (image) => {
    document.querySelector('#imageDropZone').appendChild(image);
  }
  
  const sizeCanvasToImage = (image, canvas) => {
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;
  }

  const copyImageToCanvas = (image, context) => {
    context.drawImage(image, 0, 0);
  };

  const applyFilterToCanvas = (context, filter) => {
    context.filter = filter;
  }

  const buildCanvas = (): HTMLCanvasElement => {
    const canvas = render.buildElement('canvas', { id: 'canvas' }, ['visually-hidden']) as HTMLCanvasElement;
    const body = document.querySelector('body');
    if (body !== null) {
      body.appendChild(canvas);
    }
    return canvas;
  }

  const updateCanvas = (image: HTMLImageElement, canvas: HTMLCanvasElement): HTMLCanvasElement => {
    sizeCanvasToImage(image, canvas);

    const context = canvas.getContext('2d');
    applyFilterToCanvas(context, image.style.filter);
    copyImageToCanvas(image, context);
    return canvas;
  };

  const updateImageForDownload = (image: HTMLImageElement, canvas: HTMLCanvasElement): void => {
    const downloader = document.querySelector('#imageDownload') as HTMLAnchorElement;
    if (downloader !== null) {
      downloader.setAttribute('download', `image--${convertFiltersToFileNameComponent(image.style.filter)}`)
      downloader.href = canvas.toDataURL();
    }
  };

  const createDefaultImageElement = (): HTMLImageElement => {
    return render.buildElement('img', { id: 'sampleImage', alt: 'Sample image to which the filters are applied' }) as HTMLImageElement;
  }

  const convertFiltersToFileNameComponent = (filters) => (
    filters.replaceAll('(', '_').replaceAll(')','').replaceAll(' ', '__').replace(';','')
  );

  // DRAG AND DROP FILTERS
  // See https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/Drag_operations
  const setupFiltersDropZones = (form, image, filters, canvas) => {

    let draggedElement = null;

    const clearDraggedOverClassesFromElement = (element) => {
      element.classList.remove('is-dragged-over', 'moves-up', 'moves-down');
    };

    const clearDraggedOverClassesFromAllFilters = () => {
      [...form.querySelectorAll('.filter')].forEach((filterElement) => {
        clearDraggedOverClassesFromElement(filterElement);
      });
    };

    const prohibitAllFilterDrags = () => {
      [...form.querySelectorAll('[draggable]')].forEach((draggable) => {
        draggable.removeAttribute('draggable');
      });
    };

    const handleFilterDragStart = (e) => {
      const filter = e.currentTarget;      
      e.dataTransfer.setData('text/plain', filter.getAttribute('id'));
      e.dataTransfer.effectAllowed = 'move';
      draggedElement = filter;
      
      filter.classList.add('drag-origin');
    };

    const handleDragOver = (e) => {
      e.preventDefault();
    }

    const handleDragEnter = (e) => {
      e.dataTransfer.dropEffect = 'move';

      const targetPositionComparedToDragged = draggedElement.compareDocumentPosition(e.currentTarget)
      if (targetPositionComparedToDragged & Node.DOCUMENT_POSITION_FOLLOWING) {
        e.currentTarget.classList.add('is-dragged-over', 'moves-up');
      } else if (targetPositionComparedToDragged & Node.DOCUMENT_POSITION_PRECEDING) {
        e.currentTarget.classList.add('is-dragged-over', 'moves-down');
      }
    };

    const handleDragEnd = (filter) => (e) => {
      const element = e.currentTarget;
      element.classList.remove('drag-origin');
      draggedElement = null;
      clearDraggedOverClassesFromAllFilters();
      prohibitAllFilterDrags();
    };

    const handleDrop = (filter) => (e) => {
      e.preventDefault();
      const dropped = document.getElementById(e.dataTransfer.getData('text/plain'));
      filter.parentElement.insertBefore(e.currentTarget, dropped);
      dropped.classList.remove('move-up', 'move-down', 'is-dragged-over');
      update(image, filters, canvas);
    };

    const handleDragLeave = (filter) => (e) => {
      if (e.target.nodeType === document.ELEMENT_NODE) {
        clearDraggedOverClassesFromElement(e.currentTarget);
        }
    };

    [...form.querySelectorAll('.filter')].forEach((filter) => {
      
      filter.addEventListener('dragstart', handleFilterDragStart);

      filter.addEventListener('dragover', handleDragOver);
      
      filter.addEventListener('dragenter', handleDragEnter);

      filter.addEventListener('dragleave', handleDragLeave(filter));
      
      filter.addEventListener('dragend', handleDragEnd(filter));

      filter.addEventListener('drop', handleDrop(filter));
    });

  };

  window.addEventListener('DOMContentLoaded', () => {

    const image = createDefaultImageElement();
    
    image.addEventListener('load', () => {

      insertImageIntoDom(image);

      setupImageSelection(image);
      setupImageDropZone(image);

      const canvas = buildCanvas();      
      const form = buildFiltersForm(image, config.availableFilters, canvas, config.keyCode)
      setupFiltersDropZones(form, image, config.availableFilters, canvas);

      update(image, config.availableFilters, canvas);
    });
    
    image.src = config.defaultImagePath;

  });

})(window, config);
