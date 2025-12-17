<script lang="ts" setup>
import type { NavigationMenuItem } from '@nuxt/ui';
import type { GetAdminOsReleasesResponses } from '~/api-client';

const toast = useToast();
const route = useRoute();

const os_release_version = route.params.os_release_version as string;

const title = `Release ${os_release_version} | OS Releases`;

type OSRelease = GetAdminOsReleasesResponses["200"]["data"][number];

useSeoMeta({
    title: `${title} | LeiOS Hub`,
    description: 'Manage OS Releases on LeiOS Hub'
});

const os_release = inject<Ref<OSRelease>>('os_release_data') as Ref<OSRelease>;
const os_release_refresh = inject<() => Promise<void>>('os_release_refresh');
const os_release_pending = inject<Ref<boolean>>('os_release_pending');

function getPublishingStatusColor(status: OSRelease['publishing_status']) {
    switch (status) {
        case 'pending':
            return 'warning'
        case 'paused':
            return 'warning'
        case 'completed':
            return 'success'
        case 'failed':
            return 'error'
        case 'running':
            return 'info'
    }
}

</script>

<template>
    <div class="space-y-6">
		<!-- Header -->
		<div>
			<h2 class="text-xl font-semibold text-white">OS Release {{ os_release?.version }}</h2>
			<p class="text-sm text-slate-400 mt-1">View and manage the details of this OS Release.</p>
		</div>

		<!-- Profile Card -->
		<div class="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
			<div class="px-6 py-4 border-b border-slate-800">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center">
						<UIcon class="w-5 h-5 text-sky-400" name="i-lucide-info" />
					</div>
					<div>
						<h3 class="font-medium text-white">Release Information</h3>
						<p class="text-sm text-slate-400">View and manage the details of this OS Release.</p>
					</div>
				</div>
			</div>
			
			<div class="p-6">
				<UForm id="settings" class="divide-y divide-slate-800">
					<UFormField 
						name="version" 
						label="Version"
						description="The version number of this OS Release."
						required
						class="flex max-sm:flex-col justify-between items-start gap-4 py-4 first:pt-0 last:pb-0"
						:ui='{
							root: "w-full sm:w-auto",
							container: "w-full sm:w-auto",
						}'
					>
						<UInput :model-value="os_release?.version" disabled variant="none" placeholder="Enter version" class="w-full sm:w-96 font-bold px-0 text-white" />
					</UFormField>
                    <UFormField 
                        name="publishing_status" 
                        label="Publishing Status"
                        description="The current publishing status of this OS Release."
                        required
                        class="flex max-sm:flex-col justify-between items-start gap-4 py-4 first:pt-0 last:pb-0"
                        :ui='{
                            root: "w-full sm:w-auto",
                            container: "w-full sm:w-auto",
                        }'
					>
                        <div class="w-full sm:w-96 rounded-md border-0 appearance-none placeholder:text-dimmed focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors py-1.5 text-sm gap-1.5 text-highlighted bg-transparent">
                            <UBadge 
                                :label="os_release.publishing_status.toUpperCase()" 
                                :color="getPublishingStatusColor(os_release.publishing_status)"
                                size="md"
                                class="sm:w-96 max-w-max" 
                            />
                        </div>
					</UFormField>
				</UForm>
			</div>
		</div>

		<!-- Account Info Card -->
		<!-- <div class="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-6">
			<div class="flex items-center gap-4">
				<div class="w-12 h-12 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
					<span class="text-xl font-bold text-white">{{ profile.display_name?.charAt(0) || profile.username?.charAt(0) || '?' }}</span>
				</div>
				<div>
					<p class="font-medium text-white">{{ profile.display_name || profile.username }}</p>
					<p class="text-sm text-slate-400">@{{ profile.username }}</p>
				</div>
				<div class="ml-auto">
					<UBadge 
						:label="userInfo.role" 
						:color="userInfo.role === 'admin' ? 'error' : userInfo.role === 'developer' ? 'primary' : 'neutral'"
						size="sm"
					/>
				</div>
			</div>
		</div> -->
	</div>
</template>
