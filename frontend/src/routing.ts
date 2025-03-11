import { RouteConfig, routeOutlet, router } from "./router";
import { load } from "./util";


const docsPage = load(import("./pages/documents.page").then(x => x.documentsPage))
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
        view: () => {
            router.navigateTo('documents');
        },

    },
];
export const routing = routeOutlet(config);