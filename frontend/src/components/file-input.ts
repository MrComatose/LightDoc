import { fromEvent, startWith, takeUntil } from 'rxjs';
import { Binding, component } from '../core';

export const fileInput = (label: string, binding: Binding<File | undefined>, opt?: { type: string }) => component.html`
<div class="file">
  <label class="file-label">
    <input class="file-input" type="file" name="resume" />
    <span class="file-cta">
      <span class="file-icon">
        <i class="fas fa-upload"></i>
      </span>
      <span class="file-label"> ${label}</span>
    </span>
  </label>
</div>
`.afterViewInit(component => {
    const inputElement = component.getElem().querySelector('input[type="file"]') as HTMLInputElement;
    const fileLabel = component.getElem().querySelector('.file-label');

    if (!inputElement || !fileLabel) {
        throw new Error("Failed to init file control.");
    }

    fromEvent<InputEvent>(inputElement, 'input').pipe(startWith(inputElement.files ? inputElement.files[0] : null)).subscribe(() => {
        // Bind the selected file to the binding
        const file = inputElement.files ? inputElement.files[0] : null;
        binding.value = file ?? undefined;
    });

    fromEvent<FocusEvent>(inputElement, 'focus').subscribe(() => {
        // Optional: Add active class on focus for styling
        fileLabel.classList.add('active');
    });

    fromEvent<FocusEvent>(inputElement, 'blur').subscribe(() => {
        if (!inputElement.files?.length) {
            fileLabel.classList.remove('active');
        }
    });
});