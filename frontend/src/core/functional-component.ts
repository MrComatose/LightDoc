import { finalize, ReplaySubject, switchMap, takeUntil } from "rxjs";
import { Component, OnBinded, Rune } from "./component";

export class ComponentContext {
    /**
     *
     */
    constructor(private readonly component: Component) {
        if (!component) {
            throw new Error("WTF")
        }

        component.rendered$.pipe(finalize(() => {
            this._rendered$.complete()
        })).subscribe(x => this._rendered$.next(x));

        component.detached$.pipe(finalize(() => {
            this._detached$.next();
            this._detached$.complete()
        })).subscribe(() => this._detached$.next());
    }

    private _rendered$ = new ReplaySubject<Component>(1);
    private _detached$ = new ReplaySubject<void>(1);


    public get rendered$() {
        return this._rendered$.asObservable();
    }

    public get detached$() {
        return this._detached$.asObservable();
    }

    public get getElement() {
        return () => this.component.getElem() as HTMLElement;
    }

}


export interface ComponentOptions {
    id?: string,
    name?: string,
    onBinded?: (ctx: ComponentContext) => Promise<void>,
    class?: string;
    nativeProps?: Record<string, any>
}
export class FunctionalComponent extends Component implements OnBinded {
    constructor(private render: (ctx: ComponentContext) => Rune, private readonly options?: ComponentOptions) {
        super(options);

    }

    private onCompiled$ = new ReplaySubject<ComponentContext>(1);

    async onBinded(): Promise<void> {
        if (this.options?.onBinded) {
            await this.options?.onBinded(new ComponentContext(this));
        }
    }

    public compile(): Rune {
        const ctx = new ComponentContext(this)

        const result = this.render(ctx);
        this.onCompiled$.next(ctx)

        return result;
    }

    public afterViewInit(register: (c: Component) => void) {
        this.onCompiled$
            .pipe(
                switchMap(x => x.rendered$.pipe(takeUntil(this.detached$)))
            )
            .subscribe(register);

        return this;
    }
}

export const html = (strings: TemplateStringsArray, ...values: Rune[]) => strings.reduce((result, str, i) => {
    return result + str + (values[i] !== undefined ? values[i] : '');
}, '');



export const component = (
    render: (ctx: ComponentContext) => Rune,
    options?: ComponentOptions
) => new FunctionalComponent(render, options);

component['html'] = (strings: TemplateStringsArray, ...values: Rune[]) => component(() => html(strings, ...values));



