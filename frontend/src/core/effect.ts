import { combineLatest, debounceTime, distinctUntilChanged, NEVER, takeUntil } from "rxjs";
import { Binding, currentScope, initScope, resetScope } from "./binding";
import { currentComponent, Rune } from "./component";

export const effect = (fn: () => void) => {
    initScope();
    fn();
    const scope = currentScope;
    resetScope();

    if (!scope) {
        return;
    }

    return combineLatest(scope.map(x => x.asObservable().pipe(distinctUntilChanged())))
        .pipe(takeUntil(currentComponent?.detached$ ?? NEVER), debounceTime(16))
        .subscribe(fn);
}

export const useEffect = (fn: () => void, bindings: Binding<Rune>[] | undefined) => {
    fn();

    if (!bindings) {
        return
    }

    return combineLatest(bindings.map(x => x.asObservable().pipe(distinctUntilChanged())))
        .pipe(debounceTime(16), takeUntil(currentComponent?.detached$ ?? NEVER))
        .subscribe(fn);
}