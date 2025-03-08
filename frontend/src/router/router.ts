import { Subject, distinctUntilChanged, fromEvent, map, merge, shareReplay, startWith } from "rxjs";


export class Route {
    public readonly path: string;
    readonly segments: string[];

    constructor(path: string) {
        this.path = path;
        this.segments = this.parsePath(path);
    }

    private parsePath(path: string): string[] {
        return path.split('/')
            .filter(segment => segment);
    }


    // Method to compare two routes
    public equals(other: Route): boolean {
        return this.path === other.path;
    }
}

const changes$ = new Subject<void>();

const route$ = merge(
    fromEvent(window, 'popstate'),
    changes$,
).pipe(
    map(() => new Route(window.location.pathname)),
    startWith(new Route(window.location.pathname)),
    distinctUntilChanged((prev, curr) => prev.equals(curr)),
    shareReplay(1),
);

export const router = {
    navigateTo(route: string) {
        window.history.pushState({}, '', route);

        changes$.next();
    },
    route$
};