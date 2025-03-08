import { formControl } from "./components";
import { bind, component } from "./core";
import { routeOutlet, RouteConfig } from "./router";
import { load, loadHtml } from "./util";

// const childHomeRoutes: RouteConfig[] = [
//     {
//         path: '/form',
//         view: () => formControl("test", bind<string>(""))
//     },
//     {
//         path: '',
//         view: () => load(import("./pages/gpt").then(x => x.gptPage))
//     }

// ]

const config: RouteConfig[] = [
    // {
    //     path: '/cats-page',
    //     view: () => load(import("./pages/cats.page").then(x => x.catsPage))
    // },
    {
        path: '/sign-in',
        view: () => load(import("./pages/sign-in").then(x => x.signinPage))
    },
    // {
    //     path: '/:testVar/test',
    //     view: ({ testVar }) => component(() => `<div>${testVar}  ${loadHtml("https://www.twitch.tv/usachman")} </div>`)
    // },
    // {
    //     path: '/home',
    //     view: () => routeOutlet(childHomeRoutes),
    //     hasChildren: true
    // },
    // {
    //     path: '',
    //     view: () => routeOutlet(childHomeRoutes),
    //     hasChildren: true
    // },
];
export const routing = routeOutlet(config);