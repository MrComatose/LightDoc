import { fromEvent } from "rxjs";
import { switchMap, takeUntil } from 'rxjs/operators';
import { Rune, component } from "../core";
import { router } from "../router";

export interface LinkProps {
    path: string,
    label: Rune
}

export const link = (props: LinkProps, onClick?: () => void) =>
    component(
        (ctx) => {
            const rendered$ = ctx.rendered$;

            rendered$.pipe(
                switchMap((component) => {
                    const linkElement = component.getElem();
                    return fromEvent(linkElement, 'click').pipe(
                        takeUntil(component.detached$)
                    );
                })
            ).subscribe(e => {
                e.preventDefault(); // Prevent the default link behavior
                e.stopPropagation();

                // Navigate to the new route using the router
                router.navigateTo(props.path);

                if (onClick) {
                    onClick();
                }
            });

            return props.label;
        },
        {
            name: "a",
            class: "link",
            nativeProps: {
                "href": props.path
            }
        }
    );
