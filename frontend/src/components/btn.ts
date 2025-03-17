import { filter, fromEvent, switchMap, takeUntil } from "rxjs";
import { Binding, Component, component, ReactiveBinding } from "../core";

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
    | 'is-inverted'
    | '';

interface ButtonProps {
    type?: ButtonType;
    disabled?: ReactiveBinding<boolean>;
}

export const btn = (label: string | Component, onClick: () => void, props: ButtonProps = {}) =>
    component(
        () => label,
        {
            name: "button",
            class: `button ${props.type ?? ''} fade-in`
        }
    ).afterViewInit(c => {
        const btnElement = c.getElem();

        if (props.disabled) {
            props.disabled.asObservable()
                .pipe(takeUntil(c.detached$))
                .subscribe((isDisabled) => {
                    if (isDisabled) {
                        btnElement.setAttribute('disabled', 'true');
                    } else {
                        btnElement.removeAttribute('disabled');
                    }
                });
        }

        fromEvent(btnElement, 'click').pipe(filter(() => !props.disabled?.currentValue)).subscribe(onClick);

    });
