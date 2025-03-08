import { Rune } from "../core/component";
import { Route } from "./router";

export class RouteSegment {
    constructor(public readonly path: string) {
        const trimedPath = path.replace(/^\/+|\/+$/g, '');

        this.isVariable = trimedPath.startsWith(":");

        if (this.isVariable) {
            this.variableName = trimedPath.slice(1);
        }
    }

    public readonly isVariable: boolean;
    public readonly variableName?: string;
}

export declare type RouteParams = Record<string, string>


export interface RouteConfig {
    path: string;
    view: (params: RouteParams) => Rune;
    hasChildren?: boolean;
}
export class ConfiguredRoute {
    public readonly path: string;
    public readonly segments: RouteSegment[];
    public readonly view: (params: RouteParams) => Rune;
    hasChildren: boolean | undefined;

    constructor(init: RouteConfig) {
        this.path = init.path;
        this.segments = this.parsePath(init.path);
        this.view = init.view;
        this.hasChildren = init.hasChildren;
    }

    private parsePath(path: string): RouteSegment[] {
        return path.split('/')
            .filter(segment => segment)
            .map(segment => new RouteSegment(segment));
    }
}

export class RouteTreeNode {
    /**
     *
     */
    constructor(
        public readonly segment: RouteSegment) {

    }

    readonly nodes: Record<string, RouteTreeNode> = {};
    readonly variables: RouteTreeNode[] = [];

    route!: ConfiguredRoute;

    public register(index: number, route: ConfiguredRoute): void {
        const segment = route.segments[index];

        if (!segment) {
            this.addRoute(route);

            return;
        }

        const existRoute = this.nodes[segment.path];
        if (existRoute) {
            return existRoute.register(index + 1, route);
        }

        const newNode = new RouteTreeNode(segment);
        this.nodes[newNode.segment.path] = newNode;

        if (newNode.segment.isVariable) {
            this.variables.push(newNode)
        }

        newNode.register(index + 1, route)
    }

    private addRoute(route: ConfiguredRoute) {
        if (this.route) {
            throw new Error(`Second same route config found for path ${route.path}`);
        }

        this.route = route;
    }
}

export class RouteTree {
    /**
     *
     */
    constructor(routeConfigs: ConfiguredRoute[]) {
        this.root = new RouteTreeNode(new RouteSegment("/"));

        for (const route of routeConfigs) {
            this.root.register(0, route);
        }
    }


    root: RouteTreeNode;

    public find(route: Route): [ConfiguredRoute, RouteParams] | null {
        const result = this.findRoute(this.root, route.segments);

        if (!result) {
            return null;
        }

        const [node, params] = result;

        return [node.route, params];
    }

    private findRoute(node: RouteTreeNode, segments: string[], index = 0): [RouteTreeNode, RouteParams] | null {
        const segment = segments[index];

        if (!segment) {
            return node.route ? [node, {}] : null;
        }

        const childNode = node.nodes[segment];
        if (childNode) {

            return this.findRoute(childNode, segments, index + 1);
        }

        const variables = node.variables;

        for (const varSegment of variables) {
            const res = this.findRoute(varSegment, segments, index + 1);

            if (!res) {
                continue;
            }

            const [newNode, params] = res;

            params[varSegment.segment.variableName as string] = segment;

            return [newNode, params];
        }

        if (node.route?.hasChildren) {
            return [node, {}];
        }

        return null;
    }
}