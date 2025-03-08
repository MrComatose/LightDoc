import { BehaviorSubject, fromEvent } from "rxjs";

export class Store {
    constructor() {
        fromEvent<MediaQueryListEvent>(window
            .matchMedia('(prefers-color-scheme: dark)'), "change").subscribe(({ matches: isDark }) => {
                const value = isDark ? 'dark' : 'light';
                this.setTheme(value)
            })
    }

    private _theme$ = new BehaviorSubject<string>(localStorage.getItem("theme") ?? (window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'));

    public theme$ = this._theme$.asObservable();

    public getTheme() {
        return this._theme$.value;
    }

    public setTheme(theme: 'dark' | 'light') {
        this._theme$.next(theme);
        localStorage.setItem("theme", theme);
    }
}

export const store = new Store();