const availableFilters = {
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
};

(function (window, availableFilters) {
  const doc = window.document;

// RENDERING

  const buildElement = (name, attributes, ...classes) => {
    const element = doc.createElement(name);
    Object.keys(attributes).forEach((attr) => { element.setAttribute(attr, attributes[attr]); });
    classes.forEach((cls) => {element.classList.add(cls)});
    return element;
  }

  const buildUserFilter = (name, min, max, step, value, image, filters, canvas) => {
    
    const filter = buildElement('fieldset', { id: `filter_${name}`, draggable: 'true' }, 'filter');

    const userFilterWrapper = buildElement('div', {}, 'filter__toggle');
    const userFilterLabel = buildElement('label', { for: name }, 'filter__label');
    const userFilterToggle = buildElement('input', { id: name, type: 'checkbox', name: 'filters', value: 'on' }, 'visually-hidden');
    userFilterToggle.addEventListener('input', () => { update(image, filters, canvas); })

    const magnitudeWrapper = buildElement('div', {}, 'filter__slider');
    const magnitudeLabel = buildElement('label', { for: `magnitude_${name}`}, 'visually-hidden');
    const magnitude = buildElement('input', { disabled: 'disabled', type: 'range', id: `magnitude_${name}`, value, min, max, step });
    magnitudeLabel.innerHTML = 'Magnitude:';
    magnitude.addEventListener('input', () => { update(image, filters, canvas); })

    filter.appendChild(userFilterWrapper);
    userFilterWrapper.appendChild(userFilterToggle);
    userFilterWrapper.appendChild(userFilterLabel);
    userFilterLabel.appendChild(doc.createTextNode(`${name}(`));
    userFilterLabel.appendChild(buildElement('output', { id: `magnitudeReporter_${name}` }));
    userFilterLabel.appendChild(doc.createTextNode(')'));

    filter.appendChild(magnitudeWrapper);
    magnitudeWrapper.appendChild(magnitudeLabel);
    magnitudeWrapper.appendChild(magnitude);

    return filter;
  };

  const buildButton = (id, text, type) => {
    const button = buildElement('button', { id, type }, 'button');
    button.innerHTML = text;
    return button;
  }

  const deleteOldForm = () => {
    const oldform = doc.querySelector('form.filters-grid');
    if (oldform) {
      oldform.parentElement.removeChild(oldform);
    }
  };

  const buildControls = (image, filters, canvas) => {
    const controls = buildElement('div', { id: 'controls' }, 'controls');
    const resetButton = buildButton('reset', 'Reset', 'reset');
    resetButton.addEventListener('click', () => { reset(image, filters, canvas); });
    
    const copyButton = buildButton('copy', 'Copy to clipboard', 'button');
    copyButton.addEventListener('click', (e) => { copyToClipboard(e, image); });

    controls.appendChild(resetButton);
    controls.appendChild(copyButton);

    return controls
  };

  const addFormToDom = (form) => {
    doc.querySelector('#filters').insertBefore(form, doc.querySelector('#filtersRider'));
  }

  const buildFiltersForm = (image, filters, canvas) => {
    
    deleteOldForm();
    
    const form = buildElement('form', {}, 'filters-grid');

    Object.keys(filters).forEach((name) => {
      const filter = filters[name];
      form.appendChild(buildUserFilter(name, filter.min, filter.max, filter.step, filter.initial, image, filters, canvas));
    });
    
    form.appendChild(buildControls(image, filters, canvas));
    
    addFormToDom(form);
    
    return form;
  };

  // FILTER BEHAVIOUR

  const setFilter = (filters, image, name, unit = '') => {
    const magnitudeElement = doc.querySelector(`#magnitude_${name}`);
    const magnitudeReporter = doc.querySelector(`#magnitudeReporter_${name}`);
    if (doc.querySelector(`#${name}`).checked) {
      const magnitude = `${magnitudeElement.value}${unit}`;
      magnitudeReporter.innerHTML = magnitude;
      magnitudeElement.removeAttribute('disabled');
      magnitudeElement.closest('.filter').classList.add('active');
      image.style.filter += `${name}(${magnitude}`;
    } else {
      const filterData = filters[name];
      magnitudeElement.value = filterData.initial;
      magnitudeElement.setAttribute('disabled', 'disabled');
      magnitudeElement.closest('.filter').classList.remove('active');
      magnitudeReporter.innerHTML = `${filterData.initial}${filterData.unit}`;
    }
  };

  const isNonDefaultFilterApplied = (image, filters) => {
    const appliedFilters = image.style.filter;
    let nonDefaultApplied = false;
    // TODO: relate userFilters to where they're built?
    const userFilters = doc.querySelectorAll('.filter');
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
    
    const userFilterList = doc.querySelectorAll('.filter');
    
    userFilterList.forEach((userFilter) => {
      const name = userFilter.getAttribute('id').substring(7);
      setFilter(filters, image, name, filters[name].unit);
    });

    const imageWrapper = doc.querySelector('.image-wrapper');
    const summary = doc.querySelector('#summary');
    const controls = doc.querySelector('#controls');
    
    if (isNonDefaultFilterApplied(image, filters)) {
      activate(imageWrapper);
      show(summary, controls);
      resetCopyButton(doc.querySelector('#copy'));
      printFilters(image);
    } else {
      deactivate(imageWrapper);
      hide(summary, controls);
      clearPrintedFilters();
    }

    updateCanvas(image, canvas);
    updateImageForDownload(image, canvas);
  };

  const reset = (image, filters, canvas) => {
    const form = doc.querySelector('form');
    form.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => { checkbox.checked = false; });
    buildFiltersForm(image, filters, canvas);
    update(image, filters);
  };

  const copyToClipboard = (e, image) => {
    navigator.clipboard.writeText(`filter: ${image.style.filter};`);
    e.target.innerHTML = 'Copied!'
    e.target.setAttribute('disabled', 'disabled');
  };

  const printFilters = (image) => {
    doc.querySelector('#filtersOutput').innerHTML = `filter: ${image.style.filter};`;
  };

  const clearPrintedFilters = () => {
    doc.querySelector('#filtersOutput').innerHTML = '';
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
    doc.querySelector('#filePicker').addEventListener('change', (e) => {
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

    const dropZone = doc.querySelector('#imageDropZone');
    dropZone.addEventListener('dragover', handDragOver);
    dropZone.addEventListener('drop', handleFileDrop, false);
  };

  const insertImageIntoDom = (image) => {
    doc.querySelector('#imageDropZone').appendChild(image);
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

  const buildCanvas = () => {
    const canvas = buildElement('canvas', { id: 'canvas' }, 'visually-hidden');
    doc.querySelector('body').appendChild(canvas);
    return canvas;
  }

  const updateCanvas = (image, canvas) => {
    sizeCanvasToImage(image, canvas);

    const context = canvas.getContext('2d');
    applyFilterToCanvas(context, image.style.filter);
    copyImageToCanvas(image, context);
    return canvas;
  };

  const updateImageForDownload = (image, canvas) => {
    const downloader = doc.querySelector('#imageDownload');
    downloader.setAttribute('download', `image--${convertFiltersToFileNameComponent(image.style.filter)}`)
    downloader.href = canvas.toDataURL();
  };

  const createDefaultImageElement = () => {
    return buildElement('img', { id: 'sampleImage', alt: 'Sample image to which the filters are applied' });
  }

  const convertFiltersToFileNameComponent = (filters) => (
    filters.replaceAll('(', '_').replaceAll(')','').replaceAll(' ', '__').replace(';','')
  );

  // DRAG AND DROP FILTERS
  // See https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/Drag_operations
  const setupFiltersDropZone = (form) => {

    // A dragged over element can't know anything about what's dragged over it, so we do this instead. Hacky, but it does the job.
    let positionOfCurrentlyDraggedFilter = -1;

    const clearDraggedOverClasses = (e) => {
      e.currentTarget.classList.remove('is-dragged-over', 'moves-up', 'moves-down');
    };

    const handleFilterDragStart = (e) => {
      e.currentTarget.classList.add('drag-origin');
      // set positionOfCurrentlyDraggedFilter to the sibling position of the dragged over filter
      positionOfCurrentlyDraggedFilter = [...e.currentTarget.parentNode.children].indexOf(e.currentTarget);
      e.dataTransfer.setData('text/html', e.target);
      // e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnter = (e) => {
      // e.dataTransfer.dropEffect = 'move';
      
      // Use the translation of the dragged over element to hint at the repositioning that will occur on drop, to whit:
      //  - visually translate down when the dragged over element would move down in DOM order (occurs when the dragged element currently follows the dragged over element)
      //  - visually translate up when the dragged over element would move up in DOM order (occurs when the dragged element currently precedes the dragged over element)
      if (positionOfCurrentlyDraggedFilter < [...e.currentTarget.parentNode.children].indexOf(e.currentTarget)) {
        e.currentTarget.classList.add('is-dragged-over', 'moves-up');
      } else if(positionOfCurrentlyDraggedFilter > [...e.currentTarget.parentNode.children].indexOf(e.currentTarget)) {
        e.currentTarget.classList.add('is-dragged-over', 'moves-down');
            }
    };

    const handleDragExit = (filter) => (e) => {
      setupDragEnterEvents(filter);
      clearDraggedOverClasses(e);
    };
    
    const handleDragEnd = (filter) => (e) => {
      handleDragExit(e);
      e.currentTarget.classList.remove('drag-origin');
      positionOfCurrentlyDraggedFilter = -1;
    };

    const handleDrop = (filter) => (e) => {
      e.preventDefault();
      const data = e.dataTransfer.getData('text/html');
      filter.parentElement.insertBefore(e.currentTarget);
      console.log(data);

      handleDragEnd(filter)(e);
    };

    const handleDragLeave = (filter) => (e) => {
      if (e.target.nodeType === doc.ELEMENT_NODE) {
        clearDraggedOverClasses(e);
        setupDragEnterEvents(filter);
        }
    };

    const setupDragEnterEvents = (filter) => {
      filter.addEventListener('dragenter', handleDragEnter, { once: true });
    };

    [].forEach.call(form.querySelectorAll('.filter'), (filter) => {
      
      filter.addEventListener('dragstart', handleFilterDragStart);

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
      setupFiltersDropZone(buildFiltersForm(image, availableFilters, canvas));

      update(image, availableFilters, canvas);
    });
    
    image.src = './images/chopper.jpeg';

  });

})(window, availableFilters);
