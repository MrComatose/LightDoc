import { fromEvent, takeUntil } from "rxjs";
import { Binding, component } from "../core";

export const textarea = (placeholder: string, binding: Binding<string>) =>
    component.html`<textarea placeholder="${placeholder}" class="textarea"></textarea>`
        .afterViewInit(component => {
            const textareaElement = component.getElem() as HTMLTextAreaElement;

            // Output
            fromEvent<InputEvent>(textareaElement, 'input').subscribe((e) => {
                binding.value = textareaElement.value;
            });

            // input
            binding.asObservable().pipe(takeUntil(component.detached$)).subscribe(
                (value) => textareaElement.value = value
            );
        });
