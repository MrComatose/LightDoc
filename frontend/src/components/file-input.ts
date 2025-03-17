import { fromEvent, startWith } from 'rxjs';
import { bind, Binding, component } from '../core';


const error = bind<string>("");
error.select(e => e ? component.html`<p class="file-error" style="color: red; display: none;">${e}</p>` : undefined)

const validateFile = (file: File | null, allowedExtensions?: string[]): string => {
  if (file && allowedExtensions) {
    const isValid = allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    return isValid ? "" : `Invalid file type. Allowed: ${allowedExtensions.join(", ")}`;
  }
  return ""; // Reset error
};

export const fileInput = (label: string, binding: Binding<File | undefined>, opt?: { allowedExtensions?: string[] }) => component.html`
<div class="file">
  <label class="file-label">
    <input class="file-input" type="file" name="resume" accept="${opt?.allowedExtensions?.join(",") || ""}" />
    <span class="file-cta">
      <span class="file-icon">
        <i class="fas fa-upload"></i>
      </span>
      <span class="file-label"> ${label}</span>
    </span>
  </label>
  ${error}
</div>
`.afterViewInit(component => {
  const inputElement = component.getElem().querySelector('input[type="file"]') as HTMLInputElement;
  const fileLabel = component.getElem().querySelector('.file-label');

  if (!inputElement || !fileLabel) {
    throw new Error("Failed to init file control.");
  }

  fromEvent<InputEvent>(inputElement, 'input').pipe(startWith(inputElement.files ? inputElement.files[0] : null)).subscribe(() => {
    const file = inputElement.files ? inputElement.files[0] : null;
    error.value = validateFile(file, opt?.allowedExtensions);
    binding.value = file ?? undefined;
  });
});
