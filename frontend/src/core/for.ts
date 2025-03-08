import { Observable, switchMap, takeUntil } from "rxjs";
import { Component } from "./component";
import { ComponentOptions, component } from "./functional-component";


export const loop = <TComponent extends Component>(args$: Observable<TComponent[]>, options?: ComponentOptions) => component(({ rendered$, detached$, getElement }) => {
    const changes$ = args$.pipe(takeUntil(detached$));

    let lastAddedComopnents: Component[] = []
    rendered$
        .pipe(switchMap(() => changes$))
        .subscribe((args) => {
            const elem = getElement() as HTMLElement;

            const currentComponents = new Set<string>()
            args.forEach((component, index) => {
                const isConnected = component.isConnectedTo(elem);

                if (!isConnected) {
                    component.bind(elem, true, true);
                }

                const componentElem = component.getElem();

                if (elem.children[index] !== componentElem) {
                    elem.insertBefore(componentElem, elem.children[index] || null);
                }

                currentComponents.add(component.id);
            });

            for (const oldGen of lastAddedComopnents) {
                if (currentComponents.has(oldGen.id)) {
                    continue;
                }

                oldGen.detach(false);
            }

            lastAddedComopnents = args
        });
}, options);