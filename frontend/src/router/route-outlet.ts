import { distinctUntilChanged, map, of, takeUntil } from "rxjs";
import { typingMarkdown } from "../components/typing";
import { Rune, component, observe } from "../core";


import { ConfiguredRoute, RouteConfig, RouteTree } from "./route-tree";
import { Route, router } from "./router";

let currentRoute: string;

export const defaultNotFound = typingMarkdown(of("## ", "404"))

export const routeOutlet = (paths: RouteConfig[], notFound?: Rune) => component((ctx) => {
    const parentRouteSnapshot = currentRoute;

    const tree = new RouteTree(paths.map(x => new ConfiguredRoute(x)));

    const view$ = router.route$.pipe(
        takeUntil(ctx.detached$),
        map(r => {
            if (parentRouteSnapshot) {
                return new Route(r.path.slice(parentRouteSnapshot.length));
            }

            return r;
        }),
        map(r => tree.find(r)),
        map((result) => {
            if (!result) {
                return notFound ?? defaultNotFound;
            }

            const [route, params] = result;

            currentRoute = parentRouteSnapshot ? parentRouteSnapshot + route.path : route.path;
            return route.view(params);
        }),
        distinctUntilChanged()
    );

    return `${observe(view$)}`;
});

