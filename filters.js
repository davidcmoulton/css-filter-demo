(function (window) {
  const doc = window.document;
  const image = doc.querySelector('#sampleImage');
  const imageWrapper = doc.querySelector('.image-wrapper');

  const filters = [
    {
      name: 'blur',
      min: 0,
      max: 10,
      step: 0.5,
      unit: 'px',
      initial: 0,
    },
    {
      name: 'brightness',
      min: 0,
      max: 200,
      step: 1,
      unit: '%',
      initial: 100,
    },
    {
      name: 'contrast',
      min: 0,
      max: 200,
      step: 1,
      unit: '%',
      initial: 100,
    },
    {
      name: 'grayscale',
      min: 0,
      max: 100,
      step: 1,
      unit: '%',
      initial: 0,
    },
    {
      name: 'hue-rotate',
      min: 0,
      max: 360,
      step: 1,
      unit: 'deg',
      initial: 0,
    },
    {
      name: 'invert',
      min: 0,
      max: 100,
      step: 1,
      unit: '%',
      initial: 0,
    },
    {
      name: 'opacity',
      min: 0,
      max: 100,
      step: 1,
      unit: '%',
      initial: 100,
    },
    {
      name: 'saturate',
      min: 0,
      max: 200,
      step: 1,
      unit: '%',
      initial: 100,
    },
    {
      name: 'sepia',
      min: 0,
      max: 100,
      step: 1,
      unit: '%',
      initial: 0,
    },
  ];

  const buildFilterTemplate = (name, min, max, step, initial) => `
    <fieldset class="filter" draggable="true" id="filter_${name}" data-filter-drop-zone>
    <div class="filter__toggle">
      <input type="checkbox" class="visually-hidden" name="filters" id="${name}" value="on" />
      <label class="filter__label" for="${name}">${name}(<output id="magnitudeReporter_${name}"></output>)</label>
      <div class="filter__drag_handle">
        <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" data-filter-move-icon><path d="M0 0h24v24H0z" fill="none"/><path d="M10 9h4V6h3l-5-5-5 5h3v3zm-1 1H6V7l-5 5 5 5v-3h3v-4zm14 2l-5-5v3h-3v4h3v3l5-5zm-9 3h-4v3H7l5 5 5-5h-3v-3z"/></svg>
      </div>
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
      const filterData = filters.find((filter) => filter.name === name);
      magnitudeElement.value = filterData.initial;
      magnitudeElement.setAttribute('disabled', 'disabled');
      magnitudeElement.closest('.filter').classList.remove('active');
      magnitudeReporter.innerHTML = `${filterData.initial}${filterData.unit}`;
    }
  };

  const isNonDefaultFilterApplied = () => {
    const appliedFilters = image.style.filter;
    let nonDefaultApplied = false;
    filters.forEach((filter) => {
      const startingValue = `${filter.name}(${filter.initial}${filter.unit})`
      if (appliedFilters.includes(filter.name) && !appliedFilters.includes(startingValue)) {
        nonDefaultApplied = true;
      }
    });
    return nonDefaultApplied;
  };

  const update = () => {
    image.style.filter = '';
    filters.forEach((filter) => {
      setFilter(filter.name, filter.unit);
    });
    const copyButton = doc.querySelector('#copy');
    if (isNonDefaultFilterApplied()) {
      imageWrapper.classList.add('active');
      copyButton.innerHTML = 'Copy to clipboard'
      copyButton.removeAttribute('disabled');
      doc.querySelector('#copy').classList.remove('hidden')
    } else {
      imageWrapper.classList.remove('active');
      copyButton.classList.add('hidden');
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

  const scaleupFilter = (e) => {
    e.target.closest('.filter').classList.add('scale');
  };

  const undoFilterScaleup = (e) => {
    e.target.closest('.filter').classList.remove('scale');
  };

  const buildForm = () => {
    const oldform = doc.querySelector('form.filters-grid');
    if (oldform) {
      oldform.parentElement.removeChild(oldform);
    }
    const form = document.createElement('form');
    form.classList.add('filters-grid')
    filters.forEach((filter) => {
      form.innerHTML += buildFilterTemplate(filter.name, filter.min, filter.max, filter.step, filter.initial);
    });
    form.innerHTML += '<div class="controls" id="controls"></div>'
    const controls = form.querySelector('#controls');
    controls.appendChild(buildButton('reset', 'Reset', 'reset'));
    controls.appendChild(buildButton('copy', 'Copy to clipboard'));

    form.querySelectorAll('input')
        .forEach((input) => input.addEventListener('change', update));
    form.querySelector('#reset').addEventListener('click', reset);
    form.querySelector('#copy').addEventListener('click', copyToClipboard);
    form.querySelectorAll('[data-filter-move-icon]').forEach((icon) => {
      icon.addEventListener('mouseenter', scaleupFilter);
      icon.addEventListener('mouseleave', undoFilterScaleup);
    });

    doc.querySelector('#filters').insertBefore(form, doc.querySelector('#filtersRider'));
    setupDragDropFilters();
  };

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

  const setupDragDropFilters = () => {
    const draggableFilters = doc.querySelectorAll('.filter[draggable="true"]');
    draggableFilters.forEach((draggableFilter) => {
      draggableFilter.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', e.target.id);
        e.dataTransfer.dropEffect = 'move';
      });
    });
    const dropZones = doc.querySelectorAll('[data-filter-drop-zone]');
    dropZones.forEach((dropZone) => {
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      });
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const data = e.dataTransfer.getData('text/plain');
        dropZone.parentElement.insertBefore(doc.getElementById(data), dropZone.nextElementSibling);
        update();
      });

    });
  };

  window.addEventListener('DOMContentLoaded', () => {
    buildForm();
    setupImageSelection();
    setupImageDropZone();
    // setupDragDropFilters();
    update();
  });

})(window);
