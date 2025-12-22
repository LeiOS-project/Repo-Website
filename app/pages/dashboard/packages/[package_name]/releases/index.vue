<script lang="ts" setup>
import type { NavigationMenuItem } from '@nuxt/ui';
import type { GetDevPackagesPackageNameReleasesResponses, GetDevPackagesPackageNameResponses } from '~/api-client';

const toast = useToast();

type DevPackage = GetDevPackagesPackageNameResponses[200]['data']
type Release = GetDevPackagesPackageNameReleasesResponses[200]['data'][number]

const pkg = inject<Ref<DevPackage>>('package_data') as Ref<DevPackage>;

const package_releases = await useAPIAsyncData(
    `dev/package/${pkg.value.name}/releases`,
    async () => {
        const res = await useAPI((api) => api.getDevPackagesPackageName({
            path: {
                packageName: pkg.value.name
            }
        }));
        return res;
    }
);


</script>

<template>
    <DashboardPageBody>

        <!-- <DashboardDataTable

        ></DashboardDataTable> -->

    </DashboardPageBody>
</template>