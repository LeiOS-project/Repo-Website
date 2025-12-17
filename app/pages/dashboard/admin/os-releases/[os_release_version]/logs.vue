<script lang="ts" setup>
import type { NavigationMenuItem } from '@nuxt/ui';
import type { GetAdminOsReleasesResponses } from '~/api-client';

const toast = useToast();
const route = useRoute();

const os_release_version = route.params.os_release_version as string;

const title = `Logs | Release ${os_release_version} | OS Releases`;

type OSRelease = GetAdminOsReleasesResponses["200"]["data"][number];

useSeoMeta({
    title: `${title} | LeiOS Hub`,
    description: 'Manage OS Releases on LeiOS Hub'
});

const os_release = inject<Ref<OSRelease>>('os_release_data');
const os_release_refresh = inject<() => Promise<void>>('os_release_refresh');
const os_release_pending = inject<Ref<boolean>>('os_release_pending');

</script>

<template>
    
</template>
