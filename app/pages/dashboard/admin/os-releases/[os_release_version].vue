<script lang="ts" setup>
import type { NavigationMenuItem } from '@nuxt/ui';
import type { GetAdminOsReleasesResponses } from '~/api-client';

const toast = useToast();
const route = useRoute();

const os_release_version = route.params.os_release_version as string;

const title = `Release ${os_release_version} | OS Releases`;

type OSRelease = GetAdminOsReleasesResponses["200"]["data"][number];

definePageMeta({
    layout: 'dashboard'
});

useSeoMeta({
    title: `${title} | LeiOS Hub`,
    description: 'Manage OS Releases on LeiOS Hub'
});

const { data, refresh, pending, error } = await useAsyncData(
    `os-release:${os_release_version}`,
    async () => {
        const res = await useAPI((api) => api.getAdminOsReleasesVersion({
            path: {
                version: os_release_version
            }
        }));
        if (!res.success) {
            toast.add({ title: res.message || 'Failed to load OS Release', description: res.message, color: 'error' });

            createError({
                statusCode: res.code || 500,
                statusMessage: res.message || 'Failed to load OS Release'
            });

            return null;
        }
        return res.data;
    }
)

provide('os_release_data', data);
provide('os_release_refresh', refresh);
provide('os_release_pending', pending);
provide('os_release_error', error);

const pathBreadcrumbItems = [
    { label: 'OS Releases', to: '/dashboard/admin/os-releases' },
    { label: os_release_version },
];

const links = [[
    {
        label: 'General',
        icon: 'i-lucide-info',
        to: `/dashboard/admin/os-releases/${os_release_version}`,
        exact: true
    },
    {
        label: 'Logs',
        icon: 'i-lucide-file-text',
        to: `/dashboard/admin/os-releases/${os_release_version}/logs`
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
			<div class="flex flex-col gap-4 sm:gap-6 lg:gap-12 w-full lg:max-w-3xl mx-auto">
				<NuxtPage />
			</div>
		</template>

    </UDashboardPanel>
</template>