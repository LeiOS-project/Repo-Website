import * as baseAPIClient from "@/api-client/sdk.gen";

type APIClient = typeof baseAPIClient;

type UseAPIModes = "normal" | "lazyRequest" | "asyncData" | "lazyAsyncData" | "lazyAsyncDataRequest";

namespace UseAPIReturnTypes {

    export type NormalReturn<TReturn> = TReturn;

    export type LazyRequestReturn<TReturn> = LazyRequestWrapper<TReturn>;

    export type AsyncDataReturn<TReturn> = {
        data: Ref<NormalReturn<TReturn>>;
        loading: Ref<boolean>;
        refresh: () => Promise<void>;
    }

    export type LazyAsyncDataReturn<TReturn> = {
        data: Ref<NormalReturn<TReturn>>;
        loading: Ref<boolean>;
        refresh: () => Promise<void>;
    }

    export type LazyAsyncDataRequestReturn<TReturn> = LazyAsyncDataRequestWrapper<TReturn>;

    export type UnionReturn<TReturn> = NormalReturn<TReturn> | LazyRequestReturn<TReturn> | AsyncDataReturn<TReturn> | LazyAsyncDataReturn<TReturn> | LazyAsyncDataRequestReturn<TReturn>;

}

class LazyRequestWrapper<TReturn> {

    readonly loading = ref(false);

    constructor(
        protected readonly handler: (api: APIClient) => Promise<TReturn> | TReturn,
        protected readonly disableAuthRedirect: boolean
    ) { }

    async execute(): Promise<UseAPIReturnTypes.NormalReturn<TReturn>> {
        this.loading.value = true;

        const result = await useAPI(this.handler, "normal", this.disableAuthRedirect);

        this.loading.value = false;
        return result;
    }

}

class LazyAsyncDataRequestWrapper<TReturn> {

    readonly data: Ref<UseAPIReturnTypes.NormalReturn<TReturn>>;
    readonly loading: Ref<boolean>;

    protected readonly refreshFunction: () => Promise<void>;

    constructor(
        handler: (api: APIClient) => Promise<TReturn> | TReturn,
        disableAuthRedirect: boolean
    ) {
        const { data, refresh, pending } = useLazyAsyncData<UseAPIReturnTypes.NormalReturn<TReturn>>(async () => {
            return await useAPI(handler, "normal", disableAuthRedirect);
        }, {
            immediate: false
        });
        this.data = data as Ref<UseAPIReturnTypes.NormalReturn<TReturn>>;
        this.loading = pending;
        this.refreshFunction = refresh;
    }

    async fetchData() {
        await this.refreshFunction();
        return this.data.value;
    }
}

async function createAPIClient(handle: (original: Function, args: unknown[]) => Promise<any>) {
    return new Proxy({}, {
        get(_, prop: keyof APIClient) {
            const original = (baseAPIClient as APIClient)[prop] as Function;
            if (typeof original !== 'function') {
                return original;
            }
            return async (...args: unknown[]) => {
                try {
                    return await handle(original, args);
                } catch (error) {
                    return {
                        success: false,
                        code: 500,
                        message: (error as Error).message ?? "An unknown error occurred.",
                        data: null
                    } as const;
                }
            }
        }
    }) as APIClient;
}

async function createRuntimeAPIClient(
  disableAuthRedirect: boolean
): Promise<APIClient> {
    let apiClient: APIClient;

    if (import.meta.server) {
        apiClient = await createAPIClient(async (original, args) => {

            const { data } = await useAsyncData(async (nuxtApp) => {

                const sessionToken = useCookie("session_token");

                sessionToken.value ? updateAPIClient(sessionToken.value) : updateAPIClient(null);

                return await original.apply(null, args);
            });

            return data.value ?? {
                success: false,
                code: 500,
                message: "Failed to process API request on server.",
                data: null
            } as const;
        });

    } else if (import.meta.client) {

        apiClient = await createAPIClient(async (original, args) => {

            const sessionToken = useCookie("session_token");

            if (sessionToken.value) {
                updateAPIClient(sessionToken.value);
            } else {
                updateAPIClient(null);
                if (!disableAuthRedirect) {
                    navigateTo('/auth/login?url=' + encodeURIComponent(useRoute().fullPath));
                }
            }

            return await (original as Function).apply(null, args);
        });
    } else {
        apiClient = await createAPIClient(async (original, args) => {
            return {
                success: false,
                code: 500,
                message: "API requests cannot be made in this environment.",
                data: null
            } as const;
        });
    }

    return apiClient;
}

export async function useAPI<TReturn>(handler: (api: APIClient) => Promise<TReturn> | TReturn, mode?: "normal", disableAuthRedirect?: boolean): Promise<UseAPIReturnTypes.NormalReturn<TReturn>>;
export async function useAPI<TReturn>(handler: (api: APIClient) => Promise<TReturn> | TReturn, mode: "lazyRequest", disableAuthRedirect?: boolean): Promise<UseAPIReturnTypes.LazyRequestReturn<TReturn>>;
export async function useAPI<TReturn>(handler: (api: APIClient) => Promise<TReturn> | TReturn, mode: "asyncData", disableAuthRedirect?: boolean): Promise<UseAPIReturnTypes.AsyncDataReturn<TReturn>>;
export async function useAPI<TReturn>(handler: (api: APIClient) => Promise<TReturn> | TReturn, mode: "lazyAsyncData", disableAuthRedirect?: boolean): Promise<UseAPIReturnTypes.LazyAsyncDataReturn<TReturn>>;
export async function useAPI<TReturn>(handler: (api: APIClient) => Promise<TReturn> | TReturn, mode: "lazyAsyncDataRequest", disableAuthRedirect?: boolean): Promise<UseAPIReturnTypes.LazyAsyncDataRequestReturn<TReturn>>;
export async function useAPI<TReturn>(handler: (api: APIClient) => Promise<TReturn> | TReturn, mode: string, disableAuthRedirect?: boolean): Promise<UseAPIReturnTypes.UnionReturn<TReturn>>;
export async function useAPI<TReturn>(handler: (api: APIClient) => Promise<TReturn> | TReturn, mode: string = "normal", disableAuthRedirect = false): Promise<UseAPIReturnTypes.UnionReturn<TReturn>> {

    switch (mode as UseAPIModes) {
        case "normal": {
            // continues to the main implementation
            break;
        }
        case "lazyRequest": {
            return new LazyRequestWrapper(handler, disableAuthRedirect);
        }
        case "asyncData": {

            const { data, pending: loading, refresh } = await useAsyncData(async () => {
                return await useAPI(handler, "normal", disableAuthRedirect);
            });

            return { data, loading, refresh } as UseAPIReturnTypes.AsyncDataReturn<TReturn>;
        }
        case "lazyAsyncData": {

            const { data, pending: loading, refresh } = await useLazyAsyncData(async () => {
                return await useAPI(handler, "normal", disableAuthRedirect);
            });

            return { data, loading, refresh } as UseAPIReturnTypes.LazyAsyncDataReturn<TReturn>;
        }
        case "lazyAsyncDataRequest": {
            return new LazyAsyncDataRequestWrapper(handler, disableAuthRedirect);
        }
    }

    const apiClient = await createRuntimeAPIClient(disableAuthRedirect);
    return handler(apiClient);
}