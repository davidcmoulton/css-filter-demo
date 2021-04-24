(function (window) {
  const doc = window.document;
  const image = doc.querySelector('#sampleImage');
  const imageWrapper = doc.querySelector('.image-wrapper');

  // DATA

  const filters = {
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
    if (type) {
      button.setAttribute('type', type);
    }
    button.innerHTML = text;
    return button;
  }

  const buildForm = () => {
    const oldform = doc.querySelector('form.filters-grid');
    if (oldform) {
      oldform.parentElement.removeChild(oldform);
    }
    const form = document.createElement('form');
    form.classList.add('filters-grid')
    const filterNames = Object.keys(filters);
    filterNames.forEach((name) => {
      form.innerHTML += buildFilterTemplate(name, filters[name].min, filters[name].max, filters[name].step, filters[name].initial);
    });
    form.innerHTML += '<div class="controls" id="controls"></div>'
    const controls = form.querySelector('#controls');
    controls.appendChild(buildButton('reset', 'Reset', 'reset'));
    controls.appendChild(buildButton('copy', 'Copy to clipboard'));

    form.querySelectorAll('input')
        .forEach((input) => input.addEventListener('input', update));
    form.querySelector('#reset').addEventListener('click', reset);
    form.querySelector('#copy').addEventListener('click', copyToClipboard);

    doc.querySelector('#filters').insertBefore(form, doc.querySelector('#filtersRider'));
  };

  // FILTER BEHAVIOUR

  const setFilter = (name, unit = '') => {
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

  const isNonDefaultFilterApplied = () => {
    const appliedFilters = image.style.filter;
    let nonDefaultApplied = false;
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

  const update = () => {
    image.style.filter = '';
    const userFilterList = doc.querySelectorAll('.filter');
    userFilterList.forEach((userFilter) => {
      const name = userFilter.getAttribute('id').substring(7);
      setFilter(name, filters[name].unit);
    });
    const copyButton = doc.querySelector('#copy');
    if (isNonDefaultFilterApplied()) {
      imageWrapper.classList.add('active');
      copyButton.innerHTML = 'Copy to clipboard'
      copyButton.removeAttribute('disabled');
      doc.querySelector('#copy').classList.remove('hidden')
      printFilters(image);
    } else {
      imageWrapper.classList.remove('active');
      copyButton.classList.add('hidden');
      clearPrintedFilters();
    }
  };

  const reset = () => {
    const form = doc.querySelector('form');
    form.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => checkbox.checked = false);
    buildForm();
    update();
  };

  const copyToClipboard = (e) => {
    e.preventDefault();
    navigator.clipboard.writeText(`filter: ${image.style.filter};`);
    const copyButton = doc.querySelector('#copy');
    copyButton.innerHTML = 'Copied!'
    copyButton.setAttribute('disabled', 'disabled');
  };

  const printFilters = (image) => {
    doc.querySelector('#filtersOutput').innerHTML = `filter: ${image.style.filter};`;
  };

  const clearPrintedFilters = (image) => {
    doc.querySelector('#filtersOutput').innerHTML = '';
  };

  // DRAG IMAGE

  const processImageFile = (file) => {
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      image.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const setupImageSelection = () => {
    doc.querySelector('#filePicker').addEventListener('change', (e) => {
      processImageFile(e.target.files[0]);
  });
  };

  const setupImageDropZone = () => {
    const handleFileDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      processImageFile(e.dataTransfer.files[0]);
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

  window.addEventListener('DOMContentLoaded', () => {
    buildForm();
    setupImageSelection();
    setupImageDropZone();
    update();
  });

})(window);
