import { ReplaySubject, Subject, auditTime, distinctUntilChanged, take, takeUntil } from 'rxjs';
import { ulid } from 'ulid';

export let currentComponent: Component | null = null;

export const insideComponentScope = () => !!currentComponent;

export interface OnBinded extends Component {
    onBinded(): Promise<void>;
}

export function isOnBinded(component: Component): component is OnBinded {
    return typeof (component as any)['onBinded'] === 'function';

}

export abstract class Component {
    /**
     *
     */
    constructor(init: Partial<Component> = {}) {
        this.id = init.id ?? ulid();
        this.name = init.name ?? this.constructor.name;
        this.class = init.class ?? "";
        this.nativeProps = init.nativeProps ?? {};
    }

    id: string;
    name: string;
    class: string;
    nativeProps: Record<string, any>;

    public rendered$ = new Subject<Component>();

    private viewChanges$ = new ReplaySubject<string>();
    private container!: ChildNode | HTMLElement | null;
    private elem!: ChildNode | HTMLElement | null;

    protected unsubscribe$ = new Subject<void>();
    protected children: Component[] = [];
    protected parent?: Component;

    public get detached$() {
        return this.unsubscribe$.asObservable();
    }

    /**
     * 
     * @param keepEmptyElement return component placeholder to container instead offully removing component element
     * @returns 
     */
    public detach(keepEmptyElement = true) {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
        this.viewChanges$.complete();
        this.rendered$.complete();
        this.unsubscribe$ = new Subject<void>();
        this.viewChanges$ = new ReplaySubject<string>();
        this.rendered$ = new Subject<Component>();

        this.children.forEach(c => c.detach(false));

        if (!this.elem?.isConnected) {
            return
        }

        if (keepEmptyElement && this.container?.isConnected) {
            const emptyElem = this.emptyElement();
            this.container.replaceChild(emptyElem, this.elem);

            if (this.parent?.getElem() === this.elem) {
                this.parent.setElem(emptyElem)
            }

            return;
        }

        this.elem.remove();
    }

    public abstract compile(): Rune;

    public draw() {
        currentComponent = this;
        this.children.forEach(c => c.detach());
        this.children = [];
        const html = this.compile()?.toString()?.trim() ?? "";
        currentComponent = null;

        this.viewChanges$.next(html);
    }

    private emptyElement() {
        const elem = document.createElement(this.name);
        elem.normalize();
        elem.className = this.class;
        elem.id = this.id;

        Object.entries(this.nativeProps).forEach(([key, value]) => {
            (elem as any)[key] = value;
        });

        return elem;
    }

    private createNewElement(view: string): ChildNode {
        const newElem = this.emptyElement();

        newElem.innerHTML = view;

        if (view == null) {
            return newElem;
        }

        const oneChild = newElem.children.length === 1 || newElem.childNodes.length === 1
        const child = newElem.firstElementChild || newElem.firstChild;
        if (oneChild && child && this.name === this.constructor.name) {
            return child;
        }

        return newElem
    }

    private ensureContainerExist(element?: HTMLElement) {
        if (element) {
            this.container = element;
            return;
        }

        const el = document.getElementById(this.id) || this.container;

        if (!el) {
            throw new Error(`Element ${this.name} with id = ${this.id} not found`);
        }

        this.container = el.parentElement ?? el;
    }

    public bind(element?: HTMLElement, draw = true, sync = false) {
        this.detach();
        this.ensureContainerExist(element);

        let view$ = this.viewChanges$.asObservable();

        if (!sync) {
            view$ = view$.pipe(auditTime(16)) // 60fps,
        }

        view$.subscribe((view) => {
            this.bindEventHandler(view)
        });

        if (draw) {
            this.draw();
        }
    }

    private bindEventHandler(view: string) {
        const newContent = this.createNewElement(view);

        const el = document.getElementById(this.id) || this.elem;

        if (el && el.isConnected) {
            this.container?.replaceChild(newContent, el);
        } else {
            el?.remove();
            this.container?.appendChild(newContent);
        }

        this.elem = newContent;

        if (isOnBinded(this)) {
            this.onBinded();
        }

        // replace child and parent components
        if (this.parent && !this.parent.getElem().isConnected) {
            this.parent.setElem(this.elem);
        }

        this.rendered$.next(this)
    }

    public isConnectedTo(container: HTMLElement) {
        return this.container === container && this.elem && this.elem.isConnected;
    }

    public getElem() {
        if (!this.elem) {
            throw new Error(`Element ${this.name} not found`);
        }

        return this.elem as HTMLElement;
    }

    public setElem(elem: HTMLElement | ChildNode | null) {
        this.elem = elem;
        if (this.parent && !this.parent.getElem().isConnected) {
            this.parent.setElem(this.elem);
        }
    }

    public toString() {
        if (!currentComponent) {
            throw new Error(`Unable to automatically bind component ${this.name}, please use bind method to attach component to dom.`);
        }

        this.container = null;
        this.parent = currentComponent;
        this.parent.children.push(this);
        this.parent.rendered$.pipe(
            takeUntil(this.unsubscribe$), // when parent component not detached bit this component is detached
            take(1))
            .subscribe(
                () => {
                    this.bind();
                }
            );

        return this.emptyElement().outerHTML;
    }

    public onDetached(sub: () => void) {
        this.detached$.pipe(take(1)).subscribe(sub)
    }
}

export declare type Rune = string | { toString(): string } | undefined | void;