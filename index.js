import { config } from './config.js';
import * as render from './render.js';
(function (window, config) {
    // Keyboard interaction
    const handleKeyUp = (e, keyCode) => {
        const eventTarget = e.target;
        const filter = eventTarget.closest('.filter');
        if (filter !== null) {
            switch (e.keyCode) {
                case keyCode.enter:
                    toggleFilter(filter);
                    break;
                default:
                    e.preventDefault();
                    e.stopPropagation();
                    break;
            }
        }
    };
    // RENDERING
    const buildUserFilter = (name, min, max, step, value, image, filters, canvas, keyCode) => {
        const filter = render.buildElement('fieldset', { id: `filter_${name}` }, ['filter']);
        const userFilterWrapper = render.buildElement('div', {}, ['filter__toggle']);
        const userFilterLabel = render.buildElement('label', { for: name }, ['filter__label']);
        const userFilterToggle = render.buildElement('input', { id: name, type: 'checkbox', name: 'filters', value: 'on' }, ['visually-hidden']);
        userFilterToggle.addEventListener('input', () => { update(image, filters, canvas); });
        userFilterWrapper.addEventListener('keydown', (e) => {
            console.log(e.keyCode);
            console.log(e.target);
            const eventTarget = e.target;
            const releventFilter = eventTarget.closest('.filter');
            switch (e.keyCode) {
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
                    const slider = filter.querySelector('input[type="range"]');
                    slider.focus();
                    break;
                default:
                    break;
            }
        }, true);
        userFilterWrapper.addEventListener('keyup', (e) => handleKeyUp(e, keyCode));
        const dragHandle = render.buildElement('button', { type: 'button' }, ['filter__drag_handle']);
        dragHandle.addEventListener('mousedown', () => { filter.setAttribute('draggable', 'true'); });
        dragHandle.addEventListener('mouseup', () => { filter.removeAttribute('draggable'); });
        dragHandle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" data-filter-move-icon><path d="M0 0h24v24H0z" fill="none"/><path d="M10 9h4V6h3l-5-5-5 5h3v3zm-1 1H6V7l-5 5 5 5v-3h3v-4zm14 2l-5-5v3h-3v4h3v3l5-5zm-9 3h-4v3H7l5 5 5-5h-3v-3z"/></svg>';
        const magnitudeWrapper = render.buildElement('div', {}, ['filter__slider']);
        const magnitudeLabel = render.buildElement('label', { for: `magnitude_${name}` }, ['visually-hidden']);
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
    const buildButton = (id, text, type) => {
        const button = render.buildElement('button', { id, type }, ['button']);
        button.innerHTML = text;
        return button;
    };
    const deleteOldForm = () => {
        const oldform = document.querySelector('form.filters-grid');
        oldform?.parentElement?.removeChild(oldform);
    };
    const buildControls = (image, filters, canvas) => {
        const controls = render.buildElement('div', { id: 'controls' }, ['controls']);
        const resetButton = buildButton('reset', 'Reset', 'reset');
        resetButton.addEventListener('click', () => { reset(image, filters, canvas, config.keyCode); });
        const copyButton = buildButton('copy', 'Copy to clipboard', 'button');
        copyButton.addEventListener('click', (e) => { copyToClipboard(e, image); });
        controls.appendChild(resetButton);
        controls.appendChild(copyButton);
        return controls;
    };
    const addFormToDom = (form) => {
        const filtersElement = document.querySelector('#filters');
        if (filtersElement !== null) {
            filtersElement.insertBefore(form, document.querySelector('#filtersRider'));
        }
    };
    const buildFiltersForm = (image, filters, canvas, keyCode) => {
        deleteOldForm();
        const form = render.buildElement('form', {}, ['filters-grid']);
        Object.keys(filters).forEach((name) => {
            const filter = filters[name];
            if (filter !== undefined) {
                form.appendChild(buildUserFilter(name, filter.min, filter.max, filter.step, filter.initial, image, filters, canvas, keyCode));
            }
        });
        form.appendChild(buildControls(image, filters, canvas));
        addFormToDom(form);
        return form;
    };
    // FILTER BEHAVIOUR
    const setFilter = (filters, image, name, unit = '') => {
        const magnitudeElement = document.querySelector(`#magnitude_${name}`);
        const filterElement = magnitudeElement?.closest('.filter');
        const magnitudeReporter = document.querySelector(`#magnitudeReporter_${name}`);
        const filterToggle = document.querySelector(`#${name}`);
        if (filterToggle?.checked) {
            turnOnFilter(filterElement);
            const magnitude = `${magnitudeElement?.value}${unit}`;
            image.style.filter += `${name}(${magnitude}`;
            if (magnitudeReporter !== null) {
                magnitudeReporter.innerHTML = magnitude;
            }
        }
        else {
            turnOffFilter(filterElement);
            const filterData = filters[name];
            magnitudeElement.value = filterData?.initial.toString() ?? '0';
            magnitudeReporter.innerHTML = `${filterData?.initial}${filterData?.unit}`;
        }
    };
    const isNonDefaultFilterApplied = (image, filters) => {
        const appliedFilters = image.style.filter;
        let nonDefaultApplied = false;
        // TODO: relate userFilters to where they're built?
        const userFilters = document.querySelectorAll('.filter');
        userFilters?.forEach((userFilter) => {
            const name = userFilter?.getAttribute('id')?.substring(7);
            if (name !== undefined) {
                const filter = filters[name];
                const startingValue = `${name}(${filter?.initial}${filter?.unit})`;
                if (appliedFilters.includes(name) && !appliedFilters.includes(startingValue)) {
                    nonDefaultApplied = true;
                }
            }
        });
        return nonDefaultApplied;
    };
    const hide = (...elements) => {
        elements.forEach((element) => {
            element.classList.add('hidden');
        });
    };
    const show = (...elements) => {
        elements.forEach((element) => {
            element.classList.remove('hidden');
        });
    };
    const toggleFilter = (filter) => {
        if (filter.classList.contains('active')) {
            turnOffFilter(filter);
        }
        else {
            turnOnFilter(filter);
        }
    };
    const promoteFilter = (filter) => {
        const parentElement = filter.parentElement;
        if (parentElement !== null) {
            const insertionPoint = filter.previousElementSibling;
            if (insertionPoint) {
                parentElement.insertBefore(filter, filter.previousElementSibling);
                const currentDragHandle = filter.querySelector('.filter__drag_handle');
                currentDragHandle?.focus();
            }
        }
    };
    const demoteFilter = (filter) => {
        const parentElement = filter.parentElement;
        if (parentElement !== null) {
            const insertionPoint = filter.nextElementSibling?.nextElementSibling;
            if (insertionPoint) {
                parentElement.insertBefore(filter, insertionPoint);
                const currentDragHandle = filter.querySelector('.filter__drag_handle');
                currentDragHandle?.focus();
            }
        }
    };
    const turnOnFilter = (filter) => {
        activate(filter);
        const filterCheckbox = filter.querySelector('[name="filters"]');
        filterCheckbox.checked = true;
        const slider = filter.querySelector('input[type="range"]');
        const justTurnedOn = slider?.hasAttribute('disabled');
        if (justTurnedOn) {
            const dragHandle = filter.querySelector('.filter__drag_handle');
            dragHandle?.focus();
        }
        slider?.removeAttribute('disabled');
    };
    const turnOffFilter = (filter) => {
        deactivate(filter);
        const filterCheckbox = filter.querySelector('[name="filters"]');
        filterCheckbox.checked = false;
        const slider = filter.querySelector('input[type="range"]');
        slider?.setAttribute('disabled', 'disabled');
        slider?.blur();
    };
    const activate = (element) => {
        element.classList.add('active');
    };
    const deactivate = (element) => {
        element.classList.remove('active');
    };
    const resetCopyButton = (button) => {
        button.innerHTML = 'Copy filters to clipboard';
        button.removeAttribute('disabled');
    };
    const update = (image, filters, canvas) => {
        image.style.filter = '';
        const userFilterList = document.querySelectorAll('.filter');
        userFilterList.forEach((userFilter) => {
            const name = userFilter?.getAttribute('id')?.substring(7) ?? '';
            setFilter(filters, image, name, filters[name]?.unit);
        });
        const imageWrapper = document.querySelector('.image-wrapper');
        const summary = document.querySelector('#summary');
        const controls = document.querySelector('#controls');
        if (isNonDefaultFilterApplied(image, filters)) {
            activate(imageWrapper);
            show(summary, controls);
            const copyButton = document.querySelector('#copy');
            resetCopyButton(copyButton);
            printFilters(image);
        }
        else {
            deactivate(imageWrapper);
            hide(summary, controls);
            clearPrintedFilters();
        }
        updateCanvas(image, canvas);
        updateImageForDownload(image, canvas);
    };
    const reset = (image, filters, canvas, keyCode) => {
        const form = document.querySelector('form');
        if (form !== null) {
            const checkboxes = form.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach((checkbox) => { checkbox.checked = false; });
            buildFiltersForm(image, filters, canvas, keyCode);
            update(image, filters, canvas);
        }
    };
    const copyToClipboard = (e, image) => {
        navigator.clipboard.writeText(`filter: ${image.style.filter};`);
        const elementTarget = e.target;
        elementTarget.innerHTML = 'Copied!';
        elementTarget.setAttribute('disabled', 'disabled');
    };
    const printFilters = (image) => {
        const filtersOutput = document.querySelector('#filtersOutput');
        if (filtersOutput !== null) {
            filtersOutput.innerHTML = `filter: ${image.style.filter};`;
        }
    };
    const clearPrintedFilters = () => {
        const filtersOutput = document.querySelector('#filtersOutput');
        if (filtersOutput !== null) {
            filtersOutput.innerHTML = '';
        }
    };
    // DRAG IMAGE
    const processImageFile = (file, image) => {
        if (!file) {
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e?.target?.result?.toString() ?? '';
            image.src = result;
        };
        reader.readAsDataURL(file);
    };
    const setupImageSelection = (image) => {
        const filePicker = document.querySelector('#filePicker');
        filePicker?.addEventListener('change', (e) => {
            const eventTarget = e.target;
            const files = eventTarget.files;
            if (files[0] !== undefined) {
                processImageFile(files[0], image);
            }
        });
    };
    const setupImageDropZone = (image) => {
        const handleFileDrop = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const filesDropped = e.dataTransfer?.files;
            if (filesDropped[0]) {
                processImageFile(filesDropped[0], image);
            }
        };
        const handDragOver = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const dataTransfer = e.dataTransfer;
            dataTransfer.dropEffect = 'copy';
        };
        const dropZone = document.querySelector('#imageDropZone');
        dropZone?.addEventListener('dragover', handDragOver);
        dropZone?.addEventListener('drop', handleFileDrop, false);
    };
    const insertImageIntoDom = (image) => {
        const imageDropZone = document.querySelector('#imageDropZone');
        if (imageDropZone !== null) {
            imageDropZone.appendChild(image);
        }
    };
    const sizeCanvasToImage = (image, canvas) => {
        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.height;
    };
    const copyImageToCanvas = (image, context) => {
        context.drawImage(image, 0, 0);
    };
    const applyFilterToCanvas = (context, filterToApply) => {
        context.filter = filterToApply;
    };
    const buildCanvas = () => {
        const canvas = render.buildElement('canvas', { id: 'canvas' }, ['visually-hidden']);
        const body = document.querySelector('body');
        if (body !== null) {
            body.appendChild(canvas);
        }
        return canvas;
    };
    const updateCanvas = (image, canvas) => {
        sizeCanvasToImage(image, canvas);
        const context = canvas.getContext('2d');
        applyFilterToCanvas(context, image.style.filter);
        copyImageToCanvas(image, context);
        return canvas;
    };
    const updateImageForDownload = (image, canvas) => {
        const downloader = document.querySelector('#imageDownload');
        if (downloader !== null) {
            downloader.setAttribute('download', `image--${convertFiltersToFileNameComponent(image.style.filter)}`);
            downloader.href = canvas.toDataURL();
        }
    };
    const createDefaultImageElement = () => {
        return render.buildElement('img', { id: 'sampleImage', alt: 'Sample image to which the filters are applied' });
    };
    const convertFiltersToFileNameComponent = (filtersToApply) => (filtersToApply.replaceAll('(', '_').replaceAll(')', '').replaceAll(' ', '__').replace(';', ''));
    // DRAG AND DROP FILTERS
    // See https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/Drag_operations
    const setupFiltersDropZones = (form, image, filters, canvas) => {
        let draggedElement = null;
        const clearDraggedOverClassesFromElement = (element) => {
            element.classList.remove('is-dragged-over', 'moves-up', 'moves-down');
        };
        const clearDraggedOverClassesFromAllFilters = () => {
            const filerElements = form.querySelectorAll('.filter');
            filerElements.forEach((filterElement) => {
                clearDraggedOverClassesFromElement(filterElement);
            });
        };
        const prohibitAllFilterDrags = () => {
            const filerElements = form.querySelectorAll('[draggable]');
            filerElements.forEach((draggable) => {
                draggable.removeAttribute('draggable');
            });
        };
        const handleFilterDragStart = (e) => {
            const filter = e.currentTarget;
            const dataTransfer = e.dataTransfer;
            if (dataTransfer !== null) {
                dataTransfer.setData('text/plain', filter.getAttribute('id') ?? '');
                dataTransfer.effectAllowed = 'move';
            }
            draggedElement = filter;
            filter.classList.add('drag-origin');
        };
        const handleDragOver = (e) => {
            e.preventDefault();
        };
        const handleDragEnter = (e) => {
            const currentTargetElement = e.currentTarget;
            const dataTransfer = e.dataTransfer;
            if (dataTransfer !== null) {
                dataTransfer.dropEffect = 'move';
                const targetPositionComparedToDragged = draggedElement?.compareDocumentPosition(currentTargetElement);
                if (targetPositionComparedToDragged !== undefined) {
                    if (Node.DOCUMENT_POSITION_FOLLOWING) {
                        currentTargetElement.classList.add('is-dragged-over', 'moves-up');
                    }
                    else if (Node.DOCUMENT_POSITION_PRECEDING) {
                        currentTargetElement.classList.add('is-dragged-over', 'moves-down');
                    }
                }
            }
        };
        const handleDragEnd = (e) => {
            const element = e.currentTarget;
            element.classList.remove('drag-origin');
            draggedElement = null;
            clearDraggedOverClassesFromAllFilters();
            prohibitAllFilterDrags();
        };
        const handleDrop = (filter) => (e) => {
            e.preventDefault();
            const currentTargetElement = e.currentTarget;
            const dropped = document.getElementById(e.dataTransfer?.getData('text/plain') ?? '');
            if (dropped !== null) {
                filter.parentElement?.insertBefore(currentTargetElement, dropped);
                dropped.classList.remove('move-up', 'move-down', 'is-dragged-over');
                update(image, filters, canvas);
            }
        };
        const handleDragLeave = (e) => {
            const targetNode = e.target;
            if (targetNode.nodeType === document.ELEMENT_NODE) {
                const currentTargetElement = e.currentTarget;
                clearDraggedOverClassesFromElement(currentTargetElement);
            }
        };
        const filterElements = form.querySelectorAll('.filter');
        filterElements.forEach((filter) => {
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
            const form = buildFiltersForm(image, config.availableFilters, canvas, config.keyCode);
            setupFiltersDropZones(form, image, config.availableFilters, canvas);
            update(image, config.availableFilters, canvas);
        });
        image.src = config.defaultImagePath;
    });
})(window, config);
//# sourceMappingURL=index.js.map