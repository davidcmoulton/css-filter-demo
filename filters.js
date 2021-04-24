(function (window) {
  const doc = window.document;

  // DATA

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

// RENDERING

  const buildFilterTemplate = (name, min, max, step, initial) => `
    <fieldset class="filter" id="filter_${name}">
    <div class="filter__toggle">
      <input type="checkbox" class="visually-hidden" name="filters" id="${name}" value="on" />
      <label class="filter__label" for="${name}">${name}(<output id="magnitudeReporter_${name}"></output>)</label>
    </div>
    <div class="filter__slider">
      <label for="magnitude_${name}" class="visually-hidden">Magnitude:</label>
      <input type="range" min="${min}" max="${max}" step="${step}" id="magnitude_${name}" value="${initial}" disabled/>
    </div>
  </fieldset>

`;

  const buildButton = (id, text, type) => {
    const button = document.createElement('button');
    button.setAttribute('id', id);
    button.classList.add('button');
    if (type) {
      button.setAttribute('type', type);
    }
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
    const controls = doc.createElement('div');
    controls.setAttribute('id', 'controls');
    controls.classList.add('controls');

    const resetButton = buildButton('reset', 'Reset', 'reset');
    resetButton.addEventListener('click', () => { reset(image, filters, canvas); });
    controls.appendChild(resetButton);
    
    const copyButton = buildButton('copy', 'Copy to clipboard');
    copyButton.addEventListener('click', (e) => { copyToClipboard(e, image); } );
    controls.appendChild(copyButton);

    return controls
  };

  const buildForm = (image, filters, canvas) => {
    deleteOldForm();
    const form = document.createElement('form');
    form.classList.add('filters-grid')
    const filterNames = Object.keys(filters);
    filterNames.forEach((name) => {
      form.innerHTML += buildFilterTemplate(name, filters[name].min, filters[name].max, filters[name].step, filters[name].initial);
    });
    form.appendChild(buildControls(image, filters, canvas));

    form.querySelectorAll('input')
        .forEach((input) => input.addEventListener('input', () => { update(image, filters, canvas); }));

    doc.querySelector('#filters').insertBefore(form, doc.querySelector('#filtersRider'));
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
    updateImageForDownload(canvas);
  };

  const reset = (image, filters, canvas) => {
    const form = doc.querySelector('form');
    form.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => { checkbox.checked = false; });
    buildForm(image, filters, canvas);
    update(image, filters);
  };

  const copyToClipboard = (e, image) => {
    e.preventDefault();
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
    const canvas = doc.createElement('canvas');
    canvas.setAttribute('id', 'canvas');
    canvas.classList.add('visually-hidden');
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

  const updateImageForDownload = (canvas) => {
    doc.querySelector('#imageDownload').href = canvas.toDataURL();
  };

  const createDefaultImageElement = () => {
    const image = new Image();
    image.setAttribute('id', 'sampleImage');
    image.setAttribute('alt', 'Sample image to which the filters are applied.');
    return image;
  }

  window.addEventListener('DOMContentLoaded', () => {

    const canvas = buildCanvas();
    const image = createDefaultImageElement();
    
    image.addEventListener('load', () => {

      buildForm(image, availableFilters, canvas);
      insertImageIntoDom(image);

      setupImageSelection(image);
      setupImageDropZone(image);

      update(image, availableFilters, canvas);
    });
    
    image.src = './images/chopper.jpeg';

  });

})(window);
