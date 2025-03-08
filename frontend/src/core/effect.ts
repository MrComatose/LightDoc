import { combineLatest, distinctUntilChanged, skip, throttleTime } from "rxjs";
import { currentScope, initScope, resetScope } from "./binding";

export const effect = (fn: () => void) => {
    initScope();
    fn();
    const scope = currentScope;
    resetScope();

    if (!scope) {
        return;
    }

    return combineLatest(scope.map(x => x.asObservable().pipe(skip(1), distinctUntilChanged())))
        .pipe(throttleTime(0))
        .subscribe(fn);
}