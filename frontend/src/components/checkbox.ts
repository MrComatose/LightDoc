import { fromEvent, takeUntil } from 'rxjs';
import { Binding, component } from '../core';

export const checkbox = (label: string, binding: Binding<boolean>) => component.html`
<div class="checkbox">
    <input type="checkbox" class="checkbox__input" id="checkbox_${label}" />
    <label class="checkbox__label" for="checkbox_${label}">${label}</label>
</div>
`.afterViewInit(component => {
    const inputElement = component.getElem().querySelector('input') as HTMLInputElement;
    const labelElement = component.getElem().querySelector('label') as HTMLLabelElement;

    if (!inputElement || !labelElement) {
        throw new Error("Failed to init checkbox.");
    }

    // Sync the initial value
    binding.asObservable().pipe(
        takeUntil(component.detached$)
    ).subscribe(checked => {
        inputElement.checked = checked;

        if (checked) {
            labelElement.classList.add('active');
        } else {
            labelElement.classList.remove('active');
        }
    });

    // Handle user input
    fromEvent<MouseEvent>(inputElement, 'click').subscribe(() => {
        binding.value = inputElement.checked;
    });
});
