import { fromEvent, interval, merge } from "rxjs";
import { map, scan, startWith, switchMap } from "rxjs/operators";
import { component, html, observe, Rune } from "../core";

import './carousel.scss';

const autoChange$ = interval(3000).pipe(
    map(() => 1),
);

export const carousel = (...childs: Rune[]) => component((ctx) => {
    if (!childs || childs.length === 0) {
        throw new Error("Childs required");
    }

    const currentComponent$ = ctx.rendered$.pipe(
        map((): [HTMLElement, HTMLElement] => {
            const element = ctx.getElement();
            const prevButton = element.querySelector('.carousel__prev') as HTMLElement;
            const nextButton = element.querySelector('.carousel__next') as HTMLElement;

            return [prevButton, nextButton];
        }),
        switchMap(([prevBtn, nextBtn]) => {
            const prevClick$ = fromEvent(prevBtn, 'click').pipe(
                map(() => -1)
            );

            const nextClick$ = fromEvent(nextBtn, 'click').pipe(
                map(() => 1)
            );

            const auto$ = merge(prevClick$, nextClick$).pipe(
                startWith(0),
                switchMap(() => autoChange$)
            )

            return merge(auto$, prevClick$, nextClick$)
        }),
        scan((acc, value) => (acc + value + childs.length) % childs.length, 0),
        startWith(0),
        map(index => childs[index])
    );

    const view = observe(currentComponent$);

    return html`
        <div class="carousel">
            <button class="carousel__prev">Previous</button>
            ${view}
            <button class="carousel__next">Next</button>
        </div>
    `;
}, {
    name: "carousel",
    class: "carousel-container"
});
