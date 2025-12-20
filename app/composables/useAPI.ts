import * as apiClient from "@/api-client";
import type { KeysOf } from "~/api-client/client/types.gen";

type UseAPIModes = "normal" | "lazyRequest" | "asyncData" | "lazyAsyncData" | "lazyAsyncDataRequest";

namespace UseAPIReturnTypes {

    export type NormalReturn<TReturn> = TReturn | {
        readonly success: false;
        readonly code: 500;
        readonly message: string;
        readonly data: null;
    };

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
        protected readonly handler: (api: typeof apiClient) => TReturn,
        protected readonly disableAuthRedirect: boolean
    ) {}

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
        handler: (api: typeof apiClient) => TReturn,
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
        return await this.refreshFunction();
    }
}

export async function useAPI<TReturn>(handler: (api: typeof apiClient) => TReturn, mode?: "normal", disableAuthRedirect?: boolean): Promise<UseAPIReturnTypes.NormalReturn<TReturn>>;
export async function useAPI<TReturn>(handler: (api: typeof apiClient) => TReturn, mode: "lazyRequest", disableAuthRedirect?: boolean): Promise<UseAPIReturnTypes.LazyRequestReturn<TReturn>>;
export async function useAPI<TReturn>(handler: (api: typeof apiClient) => TReturn, mode: "asyncData", disableAuthRedirect?: boolean): Promise<UseAPIReturnTypes.AsyncDataReturn<TReturn>>;
export async function useAPI<TReturn>(handler: (api: typeof apiClient) => TReturn, mode: "lazyAsyncData", disableAuthRedirect?: boolean): Promise<UseAPIReturnTypes.LazyAsyncDataReturn<TReturn>>;
export async function useAPI<TReturn>(handler: (api: typeof apiClient) => TReturn, mode: "lazyAsyncDataRequest", disableAuthRedirect?: boolean): Promise<UseAPIReturnTypes.LazyAsyncDataRequestReturn<TReturn>>;
export async function useAPI<TReturn>(handler: (api: typeof apiClient) => TReturn, mode: string, disableAuthRedirect?: boolean): Promise<UseAPIReturnTypes.UnionReturn<TReturn>>;
export async function useAPI<TReturn>(handler: (api: typeof apiClient) => TReturn, mode: string = "normal", disableAuthRedirect = false): Promise<UseAPIReturnTypes.UnionReturn<TReturn>> {

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

    try {
        if (import.meta.server) {

            const { data } = await useAsyncData(async (nuxtApp) => {

                const sessionToken = useCookie("session_token");

                sessionToken.value ? updateAPIClient(sessionToken.value) : updateAPIClient(null);

                return handler(apiClient);
            });

            return data.value as TReturn ?? {
                success: false,
                code: 500,
                message: "Failed to process API request on server.",
                data: null
            } as const

        } else if (import.meta.client) {

            const sessionToken = useCookie("session_token");

            if (sessionToken.value) {
                updateAPIClient(sessionToken.value);
            } else {
                updateAPIClient(null);
                if (!disableAuthRedirect) {
                    navigateTo('/auth/login?url=' + encodeURIComponent(useRoute().fullPath));
                }
            }

            return handler(apiClient);

        } else {
            throw new Error("Unknown environment");
        }

    } catch (error) {
        return {
            success: false,
            code: 500,
            message: (error as Error).message ?? "An unknown error occurred.",
            data: null
        } as const;
    }
}