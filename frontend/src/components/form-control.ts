import { fromEvent, startWith, takeUntil } from 'rxjs';
import { Binding, component } from '../core';

export const formControl = (label: string, binding: Binding<string>, opt?: { type: string }) => component.html`
<div class="form-control">
    <input type=${opt?.type ?? 'text'} name="${label}" class="form-control__input" />
    <label class="form-control__label" for="${label}">${label}</label>
</div>
`.afterViewInit(component => {
    const inputElement = component.getElem().querySelector('input');
    const labelElement = component.getElem().querySelector('label');

    if (!inputElement || !labelElement) {
        throw new Error("Failed to init form control.");
    }

    binding.asObservable().pipe(
        takeUntil(component.detached$)
    ).subscribe(c => inputElement.value = c);

    fromEvent<InputEvent>(inputElement, 'input').pipe(startWith(inputElement.value)).subscribe(() => {
        binding.value = inputElement.value;

        if (inputElement.value) {
            labelElement.classList.add('active');
        } else {
            labelElement.classList.remove('active');
        }
    });

    fromEvent<FocusEvent>(inputElement, 'focus').subscribe(() => {
        labelElement.classList.add('active');
    });

    fromEvent<FocusEvent>(inputElement, 'blur').subscribe(() => {
        if (!inputElement.value) {
            labelElement.classList.remove('active');
        }
    });
});


