import { from, startWith } from "rxjs";
import { Component, observe, ReactiveBinding, Rune } from "../core";
import { progressBar, unexpectedError } from "../components";


export const load = <TType extends Rune>(load: Promise<TType>): ReactiveBinding<Component | TType> => observe(from(load).pipe(startWith(progressBar)));

export const loadHtml = (url: string, init?: RequestInit) => load(
    fetch(url, init).then(async x => await x.text()).catch((err) => unexpectedError(err))
);