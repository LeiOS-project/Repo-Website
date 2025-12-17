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

const os_release = inject<Ref<OSRelease>>('os_release_data');
const os_release_refresh = inject<() => Promise<void>>('os_release_refresh');
const os_release_pending = inject<Ref<boolean>>('os_release_pending');
    
console.log(os_release?.value);

</script>

<template>
    <div class="space-y-6">
		<!-- Header -->
		<div>
			<h2 class="text-xl font-semibold text-white">Profile Settings</h2>
			<p class="text-sm text-slate-400 mt-1">Manage your public profile information</p>
		</div>

		<!-- Profile Card -->
		<div class="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
			<div class="px-6 py-4 border-b border-slate-800">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center">
						<UIcon name="i-lucide-user" class="w-5 h-5 text-sky-400" />
					</div>
					<div>
						<h3 class="font-medium text-white">Profile Information</h3>
						<p class="text-sm text-slate-400">Update your account profile details</p>
					</div>
				</div>
			</div>
			
			<div class="p-6">
				<UForm id="settings" class="divide-y divide-slate-800">
					<UFormField 
						name="username" 
						label="Username"
						description="Your unique username for logging in."
						required
						class="flex max-sm:flex-col justify-between items-start gap-4 py-4 first:pt-0 last:pb-0"
						:ui='{
							root: "w-full sm:w-auto",
							container: "w-full sm:w-auto",
						}'
					>
						<!-- <UInput v-model="os_release?.version" disabled placeholder="Enter username" class="w-full sm:w-96" /> -->
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
