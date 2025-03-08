import { from, startWith } from "rxjs";
import { Component, observe, ReactiveBindingComponent, Rune } from "../core";
import { progressBar, unexpectedError } from "../components";


export const load = <TType extends Rune>(load: Promise<TType>): ReactiveBindingComponent<Component | TType> => observe(from(load).pipe(startWith(progressBar)));

export const loadHtml = (url: string, init?: RequestInit) => load(
    fetch(url, init).then(async x => await x.text()).catch((err) => unexpectedError(err))
);