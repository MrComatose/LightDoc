import { formControl } from "./components";
import { bind, component } from "./core";
import { routeOutlet, RouteConfig } from "./router";
import { load, loadHtml } from "./util";

const childDocumentsRoutes: RouteConfig[] = [
    {
        path: '/form',
        view: () => formControl("test", bind<string>(""))
    },
    {
        path: '',
        view: () => load(import("./pages/documents.page").then(x => x.documentsPage))
    }

]

const config: RouteConfig[] = [
    {
        path: '/sign-in',
        view: () => load(import("./pages/sign-in").then(x => x.signinPage))
    },
    {
        path: '/documents',
        view: () => routeOutlet(childDocumentsRoutes),
        hasChildren: true
    },
    {
        path: '',
        view: () => routeOutlet(childDocumentsRoutes),
        hasChildren: true
    },
];
export const routing = routeOutlet(config);