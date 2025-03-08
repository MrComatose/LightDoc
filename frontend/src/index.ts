import { catchError, from, fromEvent, of, switchMap } from 'rxjs';
import { landing } from './layout';
import { routing } from './routing';
import { store } from './store';
import './styles/index.scss';

const production = false;

store.theme$.subscribe(theme => {
    document.documentElement.setAttribute('data-theme', theme)
});

const main = async () => {
    landing(routing).bind(document.body);
}

const documentLoad$ = fromEvent(window, 'load');

documentLoad$.pipe(switchMap(() => from(main())), catchError(err => {
    console.log(err);

    if (!production) {
        throw err;
    }

    return of(err);
})).subscribe();