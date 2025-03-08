import { from, interval, map, scan, startWith, switchMap, takeUntil } from "rxjs";
import { component, observe, Rune } from "../core";


export const progressBar = component((c) => {
    const progress$ = interval(50).pipe(
        map(() => Math.random() * 10),
        scan((acc, value) => (acc >= 100 ? 100 : acc + value), 0),
        startWith(0)
    );

    c.rendered$
        .pipe(switchMap(() => progress$), takeUntil(c.detached$))
        .subscribe((p) => {
            const element = c.getElement() as HTMLElement;
            const firstChild = element.firstElementChild as HTMLElement;

            if (firstChild && firstChild.style) {
                firstChild.style.width = p + '%';
            }
        })

    return `<div class="progress-bar">
                <div class="progress-bar__fill" style="width: 0%;"></div>
            </div>`
});