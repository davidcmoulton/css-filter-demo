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
    <fieldset class="filter">
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
    update();
  };

  const copyToClipboard = (e) => {
    e.preventDefault();
    navigator.clipboard.writeText(`filter: ${image.style.filter};`);
    const copyButton = doc.querySelector('#copy');
    copyButton.innerHTML = 'Copied!'
    copyButton.setAttribute('disabled', 'disabled');
  };

  const buildForm = () => {
    const form = document.createElement('form');
    form.classList.add('grid')
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
    doc.querySelector('main').insertBefore(form, doc.querySelector('script'));
  };

  const setupImageSelection = () => {
    const filePicker = doc.querySelector('#filePicker');

    const pickFile = (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        image.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    filePicker.addEventListener('change', pickFile);
  };

  const setupDropZone = () => {

    const interceptDefaults = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const file = e.dataTransfer.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          image.src = e.target.result;
        }
        reader.readAsDataURL(file);
      }

      // if the image was dragged from a browser, determine its url
      const transferItems = e.dataTransfer.items || [];
      [].forEach.call(transferItems, (item) => {
        const regex = /^.*src="([^"]+)".*$/;
        let regexResult;
        if (item.type === 'text/html') {
          item.getAsString(function (item) {
            // Expecting string of the format:
            // <meta http-equiv="Content-Type" content="text/html;charset=UTF-8"><img src="[URL]" alt="some_text">
            regexResult = regex.exec(item);
            if (regexResult) {
              image.src = regexResult[1];
            }
          });
        }
      });
    };

    const dropZone = doc.querySelector('#dropZone');
    dropZone.addEventListener('dragenter', interceptDefaults, false);
    dropZone.addEventListener('dragover', function (e) {
      interceptDefaults(e);
      e.dataTransfer.dropEffect = 'copy';
    }, false);
    dropZone.addEventListener('drop', handleDrop, false);
  };

  buildForm();
  setupImageSelection();
  setupDropZone();
  update();

})(window);
