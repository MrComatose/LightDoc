import { BehaviorSubject, Observable, map, takeUntil } from "rxjs";
import { Component, Rune } from "./component";

export class ReactiveBindingComponent<TType extends Rune> extends Component {
    /**
     *
     */
    constructor(private readonly source$: Observable<TType>) {
        super();
    }

    currentValue!: TType;

    public compile(): Rune {
        return `${this.currentValue}`;
    }

    public bind(element: HTMLElement): void {
        super.bind(element, false);
        this.source$.pipe(takeUntil(this.unsubscribe$)).subscribe(v => {
            this.currentValue = v;
            this.draw();
        });
    }

    public mapTo(mutator: (value: TType) => Rune) {
        return new ReactiveBindingComponent(this.source$.pipe(map(mutator)));
    }
}


export let currentScope: Binding<Rune>[] | undefined;

export const resetScope = () => currentScope = undefined;
export const initScope = () => currentScope = [];

export interface BindingProps<TType> {
    name?: string;
    getValue(): TType;
    setValue(v: TType): void;
    subscribe: (sub: () => void) => void;
}
export class Binding<TType extends Rune> {
    /**
     *
     */
    constructor(protected readonly props: BindingProps<TType>) {
    }

    private addToScope() {
        if (!currentScope || currentScope.includes(this)) {
            return;
        }

        currentScope.push(this);
    }

    public get value(): TType {
        this.addToScope();

        return this.props.getValue();
    }

    public set value(v: TType) {
        this.props.setValue(v);
    }

    public asObservable() {
        return new Observable<TType>(sub => this.props.subscribe(() => sub.next(this.value)));
    }


    public toString(): string {
        return (new ReactiveBindingComponent<TType>(this.asObservable())).toString();
    }

    /**
    * 
    * @param selector 
    * @param reducer for two way binding
    * @returns 
    */
    public map<TMappingType extends Rune>(selector: (x: TType) => TMappingType, reducer: (state: TType, newValue: TMappingType) => TType, name?: string) {
        const next = new Binding({
            getValue: () => {
                return selector(this.value);
            },
            setValue: (v) => {
                this.value = reducer(this.value, v)
            },
            subscribe: this.props.subscribe,
            name
        });

        return next;
    }

    public select<TMappingType extends Rune>(selector: (x: TType) => TMappingType) {
        return observe(this.asObservable().pipe(map(selector)));
    }
}


export const observe = <TType extends Rune>(source: Observable<TType>) => new ReactiveBindingComponent(source);


export const bind = <TType extends Rune>(initValue: TType, name?: string) => {
    const source$ = new BehaviorSubject(initValue);

    return new Binding({
        getValue() {
            return source$.value;
        },
        setValue(v) {
            source$.next(v);
        },
        subscribe: source$.subscribe.bind(source$),
        name
    });
};
