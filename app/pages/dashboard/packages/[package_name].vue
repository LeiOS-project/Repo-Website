<script lang="ts" setup>
import type { NavigationMenuItem } from '@nuxt/ui';
import type { GetDevPackagesResponses } from '~/api-client';

const toast = useToast();
const route = useRoute();

const package_name = route.params.package_name as string;

const title = `${package_name} | Packages`;

type Package = GetDevPackagesResponses["200"]["data"][number];

definePageMeta({
    layout: 'dashboard'
});

useSeoMeta({
    title: `${title} | LeiOS Hub`,
    description: `Manage the package ${package_name} on LeiOS Hub`
});

const { data: result, refresh, pending, error } = await useAsyncData(
    `dev-package:${package_name}`,
    async () => {
        const res = await useAPI((api) => api.getDevPackagesPackageName({
            path: {
                packageName: package_name
            }
        }));
        return res;
    }
)

const data = computed(() => result.value?.data);

provide('package_data', data);
provide('package_refresh', refresh);
provide('package_pending', pending);

const pathBreadcrumbItems = [
    { label: 'Packages', to: '/dashboard/packages' },
    { label: package_name }
];

const links = [[
    {
        label: 'General',
        icon: 'i-lucide-info',
        to: `/dashboard/packages/${package_name}`,
        exact: true
    },
    {
        label: 'Releases',
        icon: 'i-lucide-file-text',
        to: `/dashboard/packages/${package_name}/releases`,
    },
    {
        label: 'Stable Promotion Requests',
        icon: 'i-lucide-git-pull-request',
        to: `/dashboard/packages/${package_name}/stable-promotion-requests`,
    }
]] satisfies NavigationMenuItem[][]

</script>

<template>
    <UDashboardPanel>
        <template #header>
            <DashboardPageHeader
                icon="i-lucide-rocket"
                :breadcrumb-items="pathBreadcrumbItems"
            />

            <UDashboardToolbar>
				<!-- NOTE: The `-mx-1` class is used to align with the `DashboardSidebarCollapse` button here. -->
				<UNavigationMenu :items="links" highlight class="-mx-1 flex-1" />
			</UDashboardToolbar>

        </template>

        <template #body>
			<div class="flex flex-col gap-4 sm:gap-6 lg:gap-12 w-full">
				<NuxtPage v-if="result?.success" />
                <UError v-else-if="error" :error="error" />
			</div>
		</template>

    </UDashboardPanel>
</template>