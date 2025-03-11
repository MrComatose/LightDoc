import { fromEvent, switchMap } from "rxjs";
import { Component, component } from "../core";

type ButtonType =
    | 'is-primary'
    | 'is-link'
    | 'is-info'
    | 'is-success'
    | 'is-warning'
    | 'is-danger'
    | 'is-light'
    | 'is-dark'
    | 'is-black'
    | 'is-white'
    | 'is-text'
    | 'is-outlined'
    | 'is-inverted';

export const btn = (label: string | Component, onClick: () => void, type: ButtonType = 'is-primary') =>
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
            class: `button ${type} fade-in` // Додаємо тип кнопки як клас
        }
    )