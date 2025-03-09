import { map, Observable } from "rxjs";
import { component, loop } from "../../core";
import { TableColumn } from "./table";


export interface TableRowProps<TData> {
    data: TData;
    columns$: Observable<TableColumn<TData>[]>;
    id?: string;
}

export const tableRow = <TData>(props: TableRowProps<TData>) => {
    const mapToTd = (c: TableColumn<TData>) => component(() => c.value(props.data), { name: 'td' });
    const data = props.columns$.pipe(
        map(columns => columns.map(mapToTd))
    );

    return loop(data, { name: "tr", class: "fade-in", id: props.id });
};