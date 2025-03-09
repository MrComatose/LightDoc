import { map, Observable } from "rxjs";
import { component, html, loop, Rune } from "../../core";
import { tableRow } from "./table-row";

import "./table.scss"

export interface TableColumn<TData> {
    label: string;
    value: (value: TData) => Rune;
};
export interface TableProps<TData> {
    data$: Observable<TData[]>;
    columns$: Observable<TableColumn<TData>[]>;
    idGetter: (d: TData) => string;
};
export const table = <TData>(props: TableProps<TData>) => component(() => {
    const labels = props.columns$.pipe(map(x => x.map(c => component(() => c.label, { name: 'th' }))));

    const rows = props.data$.pipe(
        map((rows) => rows.map(row => tableRow({ data: row, columns$: props.columns$, id: props.idGetter(row) })))
    );

    return html`<thead>${loop(labels, { name: "tr" })}</thead> ${loop(rows, { name: "tbody" })}`;
}, {
    name: 'table',
    class: "table"
});