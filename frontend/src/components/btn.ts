import { fromEvent, switchMap } from "rxjs";
import { Component, component } from "../core";

export const btn = (label: string | Component, onClick: () => void) =>
    component(
        (ctx) => {
            ctx.rendered$.pipe(switchMap(ctx => {
                const btnElement = ctx.getElem();

                return fromEvent(btnElement, 'click')
            })).subscribe(onClick);

            return label
        },
        {
            name: "button",
            class: "btn fade-in"
        }
    )