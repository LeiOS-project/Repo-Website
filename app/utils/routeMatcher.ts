type RouteMatch = {
    route: string;
    params: Record<string, string>;
} | null;

export class RouteMatcher {
    static match(path: string, routes: string[]): RouteMatch {
        for (const route of routes) {
            const paramNames: string[] = [];

            const normalizedPath = path.replace(/\/+$/, '') || '/';

            // Convert Nuxt dynamic route to regex
            const regexStr = route
                .replace(/\//g, '\\/') // escape slashes
                .replace(/\[([^\]]+)\]/g, (_, paramName) => {
                    paramNames.push(paramName);
                    return '([^\\/]+)'; // match any segment except slash
                });

            const regex = new RegExp(`^${regexStr}$`);
            const match = normalizedPath.match(regex);

            if (match) {
                const params: Record<string, string> = {};
                paramNames.forEach((name, index) => {
                    (params as any)[name] = match[index + 1];
                });
                return { route, params };
            }
        }
        return null;
    }
}

function assert(expr: boolean, msg: string): asserts expr {
    if (!expr) throw new Error(msg);
    else console.log("Assertion passed");
}

// // Example usage:
// const routes = ["/page/[page_name]", "/page", "/page/[page_name]/edit"];

// const result1 =  RouteMatcher.match("/page", routes);
// assert(result1 !== null, "Expected a match for /page");
// assert(result1.route === "/page", `Expected route to be /page but got ${result1.route}`);
// assert(Object.keys(result1.params).length === 0, `Expected no params but got ${JSON.stringify(result1.params)}`);

// const result2 = RouteMatcher.match("/page/test", routes);
// assert(result2 !== null, "Expected a match for /page/test");
// assert(result2.route === "/page/[page_name]", `Expected route to be /page/[page_name] but got ${result2.route}`);
// assert(result2.params.page_name === "test", `Expected page_name to be test but got ${result2.params.page_name}`);
// // { route: '/page', params: {} }

// const result3 = RouteMatcher.match("/page/test/edit", routes);
// assert(result3 !== null, "Expected a match for /page/test/edit");
// assert(result3.route === "/page/[page_name]/edit", `Expected route to be /page/[page_name]/edit but got ${result3.route}`);
// assert(result3.params.page_name === "test", `Expected page_name to be test but got ${result3.params.page_name}`);
// // { route: '/page/[page_name]/edit', params: { page_name: 'test' } }

// const result4 = RouteMatcher.match("/other", routes);
// assert(result4 === null, "Expected no match for /other");
// // null

// const result5 = RouteMatcher.match("/page/test/", routes);
// assert(result5 !== null, "Expected a match for /page/test/");
// assert(result5.route === "/page/[page_name]", `Expected route to be /page/[page_name] but got ${result5.route}`);
// assert(result5.params.page_name === "test", `Expected page_name to be test but got ${result5.params.page_name}`);
// // null
