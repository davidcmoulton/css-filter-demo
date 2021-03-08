(function (window) {
  const doc = window.document;
  const image = doc.querySelector('img');
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

  const buildTemplate = (name, min, max, step, initial) => `
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
      const initialMagnitude = `${filterData.initial}${filterData.unit}`;
      magnitudeReporter.innerHTML = initialMagnitude;
      magnitudeElement.setAttribute('disabled', 'disabled');
      magnitudeElement.closest('.filter').classList.remove('active');

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
    if (isNonDefaultFilterApplied()) {
      imageWrapper.classList.add('active');
    } else {
      imageWrapper.classList.remove('active');
    }
  };

  const reset = () => {
    const form = doc.querySelector('form');
    form.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => checkbox.checked = false);
    update();
  }

  const buildForm = () => {
    const form = document.createElement('form');
    form.classList.add('grid')
    filters.forEach((filter) => {
      form.innerHTML += buildTemplate(filter.name, filter.min, filter.max, filter.step, filter.initial);
    });
    form.innerHTML += '<div class="controls"><button id="reset" type="reset">Reset</button></div>'
    form.querySelectorAll('input')
        .forEach((input) => input.addEventListener('change', update));
    form.querySelector('#reset').addEventListener('click', reset);
    doc.querySelector('main').insertBefore(form, doc.querySelector('script'));
  };

  buildForm();
  update();

})(window);
