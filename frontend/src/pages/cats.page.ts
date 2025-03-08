import { finalize, from, interval, map, of, shareReplay, timeInterval } from "rxjs";
import { card, progressBar, table, TableColumn } from "../components";
import { bind, component, loop, observe } from "../core";
import { Breed, Cat, getCats } from "../services";

import './cats.scss';

const catCard = (cat: Cat) => card({
    ...cat,
    image: cat.url,
    name: cat.breeds[0].name,
    description: cat.breeds[0].description
});
const loading = bind<boolean>(true);
const loader = loading.asObservable().pipe(map(x => x ? progressBar : ""));

const catsData$ = from(getCats(12)).pipe(shareReplay(1));

const catCards$ = catsData$.pipe(
    map(data => data.map(catCard)),
    finalize(() => {
        loading.value = false;
    }),
);

const catCards = loop(catCards$, { name: 'cats', class: "cats-page__container" });

const breedsColumns = bind<TableColumn<Breed>[]>([
    {
        label: 'adaptability',
        value: x => x.adaptability
    },
    // {
    //     label: 'affection_level',
    //     value: x => x.affection_level
    // },
    // {
    //     label: 'alt_names',
    //     value: x => x.alt_names
    // },
    // {
    //     label: 'cfa_url',
    //     value: x => x.cfa_url
    // },
    // {
    //     label: 'child_friendly',
    //     value: x => x.child_friendly
    // },
    // {
    //     label: 'country_code',
    //     value: x => x.country_code
    // },
    // {
    //     label: 'country_codes',
    //     value: x => x.country_codes
    // },
    {
        label: 'description',
        value: x => x.description
    },
    {
        label: 'dog_friendly',
        value: x => x.dog_friendly
    },
    {
        label: 'energy_level',
        value: x => x.energy_level
    },
    {
        label: 'experimental',
        value: x => x.experimental
    },
]);
const catsTableColumns = bind<TableColumn<Cat>[]>([
    {
        label: "Cat ID",
        value: c => c.id
    },
    {
        label: "Height",
        value: c => c.breeds.toString()
    },
    {
        label: "URL",
        value: c => c.url
    },
    {
        label: "Breeds",
        value: c => table({
            data$: of(c.breeds),
            columns$: breedsColumns.asObservable()
        })
    }
]);

export const catsPage = component.html`<div class="cats-page"> 
                    ${observe(loader)}
                    ${table({
    data$: catsData$,
    columns$: catsTableColumns.asObservable()
})}
            </div>`;