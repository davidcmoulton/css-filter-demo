import { config, Config } from './config.js';
import * as render from './render.js';

(function (window, config: Config) {

// RENDERING

  const buildUserFilter = (
    name: string,
    min: number,
    max: number,
    step: number,
    value: number,
    image: HTMLImageElement,
    filters: Config['availableFilters'],
    canvas: HTMLCanvasElement,
    keyCode: Config['keyCode']
  ): HTMLFieldSetElement => {

    const filter = render.buildElement('fieldset', { id: `filter_${name}` }, ['filter']) as HTMLFieldSetElement;

    const userFilterWrapper = render.buildElement('div', {}, ['filter__toggle']);
    const userFilterLabel = render.buildElement('label', { for: name }, ['filter__label']);
    const userFilterToggle = render.buildElement('input', { id: name, type: 'checkbox', name: 'filters', value: 'on' }, ['visually-hidden']);
    userFilterToggle.addEventListener('input', () => { update(image, filters, canvas); })

    userFilterWrapper.addEventListener('keydown', (e: KeyboardEvent) => {
      console.log(e.keyCode);
      console.log(e.target);
      const eventTarget = e.target as HTMLElement;
      const releventFilter = eventTarget.closest('.filter') as HTMLFieldSetElement;
      switch (e.keyCode) {
        case keyCode.enter:
          toggleFilter(filter);
          break;
        case keyCode.up:
          e.preventDefault();
          e.stopPropagation();
          promoteFilter(releventFilter);
          break;
        case keyCode.down:
          e.preventDefault();
          e.stopPropagation();
          demoteFilter(releventFilter);
          break;
        case keyCode.left:
        case keyCode.right:
          e.preventDefault();
          e.stopPropagation();
          const slider = filter.querySelector('input[type="range"]') as HTMLInputElement;
          slider.focus();
          break;
        default:
          break;
      }
    }, true);

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

  const addFormToDom = (form: HTMLFormElement) => {
    const filtersElement = document.querySelector('#filters');
    if (filtersElement !== null) {
      filtersElement.insertBefore(form, document.querySelector('#filtersRider'));
    }
  }

  const buildFiltersForm = (
    image: HTMLImageElement,
    filters: Config['availableFilters'],
    canvas: HTMLCanvasElement,
    keyCode: Config['keyCode']
  ): HTMLFormElement => {

    render.deleteOldForm();

    const form = render.buildElement('form', {}, ['filters-grid']) as HTMLFormElement;

    Object.keys(filters).forEach((name) => {
      const filter = filters[name];
      if (filter !== undefined) {
        form.appendChild(
          buildUserFilter(
            name,
            filter.min,
            filter.max,
            filter.step,
            filter.initial,
            image,
            filters,
            canvas,
            keyCode
          )
        );
      }
    });

    const resetFormAction = (e: Event) => { reset(image, filters, canvas, config.keyCode) };
    const copyToClipboardAction = (e: Event) => { copyToClipboard(image)(e) };
    form.appendChild(render.buildControls(resetFormAction, copyToClipboardAction));

    addFormToDom(form);

    return form;
  };

  // FILTER BEHAVIOUR

  const setFilter = (filters: Config['availableFilters'], image: HTMLImageElement, name: string, unit: string = '') => {
    const magnitudeElement = document.querySelector(`#magnitude_${name}`) as HTMLInputElement;
    const filterElement = magnitudeElement?.closest('.filter') as HTMLElement;
    const magnitudeReporter = document.querySelector(`#magnitudeReporter_${name}`) as HTMLOutputElement;
    const filterToggle = document.querySelector(`#${name}`) as HTMLInputElement;
    if (filterToggle?.checked) {
      turnOnFilter(filterElement)
      const magnitude = `${magnitudeElement?.value}${unit}`;
      image.style.filter += `${name}(${magnitude}`;
      if (magnitudeReporter !== null) {
        magnitudeReporter.innerHTML = magnitude;
      }
    } else {
      turnOffFilter(filterElement)
      const filterData = filters[name];
      magnitudeElement.value = filterData?.initial.toString() ?? '0';
      magnitudeReporter.innerHTML = `${filterData?.initial}${filterData?.unit}`;
    }
  };

  const isNonDefaultFilterApplied = (image: HTMLImageElement, filters: Config['availableFilters']): boolean => {
    const appliedFilters = image.style.filter;
    let nonDefaultApplied = false;

    // TODO: relate userFilters to where they're built?
    const userFilters = document.querySelectorAll('.filter');
    userFilters?.forEach((userFilter) => {
      const name = userFilter?.getAttribute('id')?.substring(7);
      if (name !== undefined) {
        const filter = filters[name];
        const startingValue = `${name}(${filter?.initial}${filter?.unit})`
        if (appliedFilters.includes(name) && !appliedFilters.includes(startingValue)) {
          nonDefaultApplied = true;
        }
      }
    });
    return nonDefaultApplied;
  };

  const hide = (...elements: Array<Element>): void => {
    elements.forEach((element) => {
      element.classList.add('hidden');
    });
  }

  const show = (...elements: Array<Element>): void => {
    elements.forEach((element) => {
      element.classList.remove('hidden');
    });
  }

  const toggleFilter = (filter: HTMLElement): void => {
    if (filter.classList.contains('active')) {
      turnOffFilter(filter);
    } else {
      turnOnFilter(filter);
    }
  };

  const promoteFilter = (filter: HTMLFieldSetElement): void => {
    const parentElement = filter.parentElement;
    if (parentElement !== null) {
      const insertionPoint = filter.previousElementSibling;
      if (insertionPoint) {
        parentElement.insertBefore(filter, filter.previousElementSibling);
        const currentDragHandle = filter.querySelector('.filter__drag_handle') as HTMLElement;
        currentDragHandle?.focus();
      }
    }
  };

  const demoteFilter = (filter: HTMLFieldSetElement): void => {
    const parentElement = filter.parentElement;
    if (parentElement !== null) {
      const insertionPoint = filter.nextElementSibling?.nextElementSibling;
      if (insertionPoint) {
        parentElement.insertBefore(filter, insertionPoint);
        const currentDragHandle = filter.querySelector('.filter__drag_handle') as HTMLElement;
        currentDragHandle?.focus();
      }
    }
  };

  const turnOnFilter = (filter: HTMLElement): void => {
    activate(filter);
    const filterCheckbox = filter.querySelector('[name="filters"]') as HTMLInputElement;
    filterCheckbox.checked = true;

    const slider = filter.querySelector('input[type="range"]') as HTMLInputElement;
    const justTurnedOn = slider?.hasAttribute('disabled');
    if (justTurnedOn) {
      const dragHandle = filter.querySelector('.filter__drag_handle') as HTMLElement;
      dragHandle?.focus();
    }
    slider?.removeAttribute('disabled');
  };

  const turnOffFilter = (filter: HTMLElement): void => {
    deactivate(filter);
    const filterCheckbox = filter.querySelector('[name="filters"]') as HTMLInputElement;
    filterCheckbox.checked = false;

    const slider = filter.querySelector('input[type="range"]') as HTMLInputElement;
    slider?.setAttribute('disabled', 'disabled');
    slider?.blur();
  };

  const activate = (element: HTMLElement) => {
    element.classList.add('active');
  }

  const deactivate = (element: HTMLElement) => {
    element.classList.remove('active');
  }

  const resetCopyButton = (button: HTMLButtonElement) => {
    button.innerHTML = 'Copy filters to clipboard'
    button.removeAttribute('disabled');
  };

  const update = (image: HTMLImageElement, filters: Config['availableFilters'], canvas: HTMLCanvasElement): void => {

    image.style.filter = '';

    const userFilterList = document.querySelectorAll('.filter');

    userFilterList.forEach((userFilter) => {
      const name = userFilter?.getAttribute('id')?.substring(7) ?? '';
      setFilter(filters, image, name, filters[name]?.unit);
    });

    const imageWrapper = document.querySelector('.image-wrapper') as HTMLImageElement;
    const summary = document.querySelector('#summary') as HTMLElement;
    const controls = document.querySelector('#controls') as HTMLImageElement;

    if (isNonDefaultFilterApplied(image, filters)) {
      activate(imageWrapper);
      show(summary, controls);
      const copyButton = document.querySelector('#copy') as HTMLButtonElement;
      resetCopyButton(copyButton);
      printFilters(image);
    } else {
      deactivate(imageWrapper);
      hide(summary, controls);
      clearPrintedFilters();
    }

    updateCanvas(image, canvas);
    updateImageForDownload(image, canvas);
  };

  const reset = (
    image: HTMLImageElement,
    filters: Config['availableFilters'],
    canvas: HTMLCanvasElement,
    keyCode: Config['keyCode']
  ) => {
    const form = document.querySelector('form');
    if (form !== null) {
      const checkboxes: NodeListOf<HTMLInputElement> = form.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach((checkbox) => { checkbox.checked = false; });
      buildFiltersForm(image, filters, canvas, keyCode);
      update(image, filters, canvas);
    }
  };

  const copyToClipboard = (image: HTMLImageElement) => (e: Event) => {
    navigator.clipboard.writeText(`filter: ${image.style.filter};`);
    const elementTarget = e.target as HTMLElement;
    elementTarget.innerHTML = 'Copied!'
    elementTarget.setAttribute('disabled', 'disabled');
  };

  const printFilters = (image: HTMLImageElement): void => {
    const filtersOutput = document.querySelector('#filtersOutput');
    if (filtersOutput !== null) {
      filtersOutput.innerHTML = `filter: ${image.style.filter};`;
    }
  };

  const clearPrintedFilters = (): void => {
    const filtersOutput = document.querySelector('#filtersOutput');
    if (filtersOutput !== null) {
      filtersOutput.innerHTML = '';
    }
  };

  // DRAG IMAGE

  const processImageFile = (file: Blob, image: HTMLImageElement) => {
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const result = e?.target?.result?.toString() ?? '';
      image.src = result;
    };
    reader.readAsDataURL(file);
  };

  const setupImageSelection = (image: HTMLImageElement) => {
    const filePicker = document.querySelector('#filePicker');
    filePicker?.addEventListener('change', (e: Event) => {
      const eventTarget = e.target as HTMLInputElement;
      const files = eventTarget.files as FileList;
      if (files[0] !== undefined) {
        processImageFile(files[0], image);
      }
    });
  };

  const setupImageDropZone = (image: HTMLImageElement): void => {
    const handleFileDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const filesDropped = e.dataTransfer?.files as FileList;
      if (filesDropped[0]) {
        processImageFile(filesDropped[0], image);
      }
    };

    const handDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const dataTransfer = e.dataTransfer as DataTransfer;
      dataTransfer.dropEffect = 'copy';
    };

    const dropZone = document.querySelector('#imageDropZone') as HTMLElement;
    dropZone?.addEventListener('dragover', handDragOver);
    dropZone?.addEventListener('drop', handleFileDrop, false);
  };

  const insertImageIntoDom = (image: HTMLImageElement): void => {
    const imageDropZone = document.querySelector('#imageDropZone');
    if (imageDropZone !== null) {
      imageDropZone.appendChild(image);
    }
  }

  const sizeCanvasToImage = (image: HTMLImageElement, canvas: HTMLCanvasElement): void => {
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;
  }

  const copyImageToCanvas = (image:HTMLImageElement, context: CanvasRenderingContext2D) => {
    context.drawImage(image, 0, 0);
  };

  const applyFilterToCanvas = (context: CanvasRenderingContext2D, filterToApply: string): void => {
    context.filter = filterToApply;
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

    const context = canvas.getContext('2d') as CanvasRenderingContext2D;
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

  const convertFiltersToFileNameComponent = (filtersToApply: string): string => (
    filtersToApply.replaceAll('(', '_').replaceAll(')','').replaceAll(' ', '__').replace(';','')
  );

  // DRAG AND DROP FILTERS
  // See https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/Drag_operations
  const setupFiltersDropZones = (
    form: HTMLFormElement,
    image: HTMLImageElement,
    filters: Config['availableFilters'],
    canvas: HTMLCanvasElement
  ): void => {

    let draggedElement: HTMLElement | null = null;

    const clearDraggedOverClassesFromElement = (element: HTMLElement): void => {
      element.classList.remove('is-dragged-over', 'moves-up', 'moves-down');
    };

    const clearDraggedOverClassesFromAllFilters = (): void => {
      const filerElements = form.querySelectorAll('.filter') as NodeListOf<HTMLElement>;
      filerElements.forEach((filterElement) => {
        clearDraggedOverClassesFromElement(filterElement);
      });
    };

    const prohibitAllFilterDrags = (): void => {
      const filerElements = form.querySelectorAll('[draggable]') as NodeListOf<HTMLElement>;
      filerElements.forEach((draggable) => {
        draggable.removeAttribute('draggable');
      });
    };

    const handleFilterDragStart = (e: DragEvent): void => {
      const filter = e.currentTarget as HTMLElement;
      const dataTransfer = e.dataTransfer;
      if (dataTransfer !== null) {
        dataTransfer.setData('text/plain', filter.getAttribute('id') ?? '');
        dataTransfer.effectAllowed = 'move';
      }
      draggedElement = filter;

      filter.classList.add('drag-origin');
    };

    const handleDragOver = (e: DragEvent): void => {
      e.preventDefault();
    }

    const handleDragEnter = (e: DragEvent): void => {
      const currentTargetElement = e.currentTarget as HTMLElement;
      const dataTransfer = e.dataTransfer;
      if (dataTransfer !== null) {
        dataTransfer.dropEffect = 'move';
        const targetPositionComparedToDragged = draggedElement?.compareDocumentPosition(currentTargetElement);
        if (targetPositionComparedToDragged !== undefined) {
          if (Node.DOCUMENT_POSITION_FOLLOWING) {
            currentTargetElement.classList.add('is-dragged-over', 'moves-up');
          } else if (Node.DOCUMENT_POSITION_PRECEDING) {
            currentTargetElement.classList.add('is-dragged-over', 'moves-down');
          }
        }
      }
    };

    const handleDragEnd = (e: DragEvent) => {
      const element = e.currentTarget as HTMLElement;
      element.classList.remove('drag-origin');
      draggedElement = null;
      clearDraggedOverClassesFromAllFilters();
      prohibitAllFilterDrags();
    };

    const handleDrop = (filter: HTMLElement) => (e: DragEvent) => {
      e.preventDefault();
      const currentTargetElement = e.currentTarget as HTMLElement;
      const dropped = document.getElementById(e.dataTransfer?.getData('text/plain') ?? '');
      if (dropped !== null) {
        filter.parentElement?.insertBefore(currentTargetElement, dropped);
        dropped.classList.remove('move-up', 'move-down', 'is-dragged-over');
        update(image, filters, canvas);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      const targetNode = e.target as Node;
      if (targetNode.nodeType === document.ELEMENT_NODE) {
        const currentTargetElement = e.currentTarget as HTMLElement;
        clearDraggedOverClassesFromElement(currentTargetElement);
      }
    };

    const filterElements = form.querySelectorAll('.filter') as NodeListOf<HTMLElement>;
    filterElements.forEach((filter: HTMLElement) => {

      filter.addEventListener('dragstart', handleFilterDragStart);

      filter.addEventListener('dragover', handleDragOver);

      filter.addEventListener('dragenter', handleDragEnter);

      filter.addEventListener('dragleave', handleDragLeave);

      filter.addEventListener('dragend', handleDragEnd);

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
