import { marked } from "marked";
import { Observable, map, scan, takeUntil } from "rxjs";
import { Component, component, loop, observe } from "../core";

export const typingMarkdown = (source$: Observable<string>) => component((ctx) => {
    const htmlFull$ = source$.pipe(
        scan((acc, value) => {
            acc.fullText += value
            acc.htmlText = marked(acc.fullText) as string;

            return acc;
        }, {
            fullText: '',
            htmlText: ''
        }),
        map(x => x.htmlText),
    );

    return observe(htmlFull$);
}, { name: "p", class: "markdown" });

export const typing = (source$: Observable<string>) => component((ctx) => {
    const state$ = source$.pipe(
        takeUntil(ctx.detached$),
        scan((acc, value) => {
            acc.fullText += value
            acc.tokens.push(component(() => `<span class="fade-in">${value}</span>`));

            return acc;
        }, {
            tokens: [] as Component[],
            fullText: ''
        }),
    )

    const tokens$ = state$.pipe(map(x => x.tokens));


    return loop(tokens$, { name: "p" });
});