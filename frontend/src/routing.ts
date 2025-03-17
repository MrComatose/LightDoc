import { component, observe, Rune } from "./core";
import { redirect, RouteConfig, routeOutlet, router } from "./router";
import { isAuthenticated } from "./services";
import { load } from "./util";

const withAuth = (child: Rune) => observe(isAuthenticated).mapTo(isAuth => isAuth ? child : redirect('/sign-in'));
const docsPage = withAuth(load(import("./pages/documents.page").then(x => x.documentsPage)))

const signInPage = load(import("./pages/sign-in").then(x => x.signinPage))
const config: RouteConfig[] = [
    {
        path: '/sign-in',
        view: () => signInPage
    },
    {
        path: '/documents',
        view: () => docsPage,
        hasChildren: true
    },
    {
        path: '',
        view: () => redirect('/documents')
    },
];
export const routing = routeOutlet(config);