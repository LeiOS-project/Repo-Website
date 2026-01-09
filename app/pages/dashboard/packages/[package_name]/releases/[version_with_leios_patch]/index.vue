<script setup lang="ts">
import type {
    GetDevPackagesPackageNameResponses,
    PostDevPackagesData,
} from "@/api-client/types.gen";
import type z from "zod";
import { zPostDevPackagesPackageNameReleasesData } from "~/api-client/zod.gen";
import DashboardDeleteModal from "~/components/dashboard/DashboardDeleteModal.vue";

const route = useRoute();
const toast = useToast();

const pkg_data = useSubrouterInjectedData<DevPackage>("package").inject().data;
const pkg_release = useSubrouterInjectedData<DevPackageRelease, NewDevPackageRelease>("package_release", true).inject();
const pkg_release_data = pkg_release.data;
const pkg_release_loading = pkg_release.loading;

const headerTexts = computed(() => {
    if (pkg_release.isNew) {
        return {
            title: "Create New Package Release",
            description: `Create a new package release for the package ${pkg_data.value.name}.`,
        };
    }
    return {
        title: `Package Release: ${pkg_release_data.value.versionWithLeiosPatch}`,
        description: "View and manage the details of the package.",
    };
});

const package_release_form_schema = zPostDevPackagesPackageNameReleasesData.shape.body;
const package_release_form_state = ref<NewDevPackageRelease>({
    versionWithLeiosPatch: pkg_release_data.value.versionWithLeiosPatch,
    changelog: pkg_release_data.value.changelog
});

async function onFormSubmit() {
    try {
        if (pkg_release.isNew) {
            const result = await useAPI((api) =>
                api.postDevPackagesPackageNameReleases({
                    path: {
                        packageName: pkg_data.value.name,
                    },
                    body: package_release_form_state.value,
                })
            );

            if (result.success) {
                toast.add({
                    title: "Package Release created",
                    description: `The Package Release has been successfully created.`,
                    icon: "i-lucide-check",
                    color: "success",
                });

                // Redirect to the new package page
                await navigateTo(
                    `/dashboard/packages/${pkg_data.value.name}/releases/${package_release_form_state.value.versionWithLeiosPatch}`
                );
            } else {
                throw new Error(result.message || "Failed to create package release");
            }
        } else {
            const result = await useAPI((api) =>
                api.putDevPackagesPackageNameReleasesVersionWithLeiosPatch({
                    path: {
                        packageName: pkg_data.value.name,
                        versionWithLeiosPatch: pkg_release_data.value.versionWithLeiosPatch,
                    },
                    body: {
                        changelog: package_release_form_state.value.changelog,
                    },
                })
            );

            if (result.success) {
                pkg_release_data.value.changelog = package_release_form_state.value.changelog;

                toast.add({
                    title: "Package Release updated",
                    description: `The Package has been successfully updated.`,
                    icon: "i-lucide-check",
                    color: "success",
                });
            } else {
                throw new Error(result.message || "Failed to update package release");
            }
        }
    } catch (error: any) {
        toast.add({
            title: "Error",
            description: error.message || "An unexpected error occurred.",
            icon: "i-lucide-x-circle",
            color: "error",
        });
    }
}

const deleteLoading = ref(false);
const deleteConfirmOpen = ref(false);

async function onDeletePackage() {

    deleteLoading.value = true;

    toast.add({
        title: "Package release deletion is not yet implemented.",
        description: "This feature is coming soon.",
        icon: "i-lucide-info",
        color: "info",
    });

    deleteLoading.value = false;
	deleteConfirmOpen.value = false;
}
</script>

<template>
    <div class="space-y-6 w-full lg:w-3xl mx-auto">
        <!-- Header -->
        <div>
            <h2 class="text-xl font-semibold text-white">
                {{ headerTexts.title }}
            </h2>
            <p class="text-sm text-slate-400 mt-1">
                {{ headerTexts.description }}
            </p>
        </div>

        <!-- Profile Card -->
        <div
            class="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden"
        >
            <div class="px-6 py-4 border-b border-slate-800">
                <div class="flex items-center gap-3">
                    <div
                        class="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center"
                    >
                        <UIcon
                            class="w-5 h-5 text-sky-400"
                            name="i-lucide-info"
                        />
                    </div>
                    <div>
                        <h3 class="font-medium text-white">
                            Release Information
                        </h3>
                        <p class="text-sm text-slate-400">
                            View and manage the details of this OS Release.
                        </p>
                    </div>
                </div>
            </div>

            <div class="p-6">
                <UForm
                    id="settings"
                    class="divide-y divide-slate-800"
                    :schema="package_release_form_schema"
                    :state="package_release_form_state"
                    @submit="onFormSubmit()"
                >
                    <!-- <UFormField
                        name="name"
                        label="Package Name"
                        description="The name of this package."
                        required
                        class="flex max-sm:flex-col justify-between items-start gap-4 py-4 first:pt-0 last:pb-0"
                    >
                        <UInput
                            :model-value="package_form_state.name"
                            :disabled="!pkg.isNew"
                            variant="none"
                            placeholder="Enter package name"
                            :ui="{
                                base: 'w-full text-end sm:text-center sm:w-96 font-bold text-xl px-0 text-info',
                            }"
                        />
                    </UFormField> -->

                    <UFormField
                        name="versionWithLeiosPatch"
                        label="Version Tag"
                        description="The version tag of this package release."
                        class="flex max-sm:flex-col justify-between items-start gap-4 py-4 first:pt-0 last:pb-0"
                        :ui="{
                            root: 'w-full sm:w-auto',
                            container: 'w-full sm:w-auto',
                        }"
                    >
                        <UInput
                            v-model="package_release_form_state.versionWithLeiosPatch"
                            :disabled="!pkg_release.isNew"
                            placeholder="Enter package release version tag"
                            class="w-full sm:w-96"
                        />
                    </UFormField>

                    <UFormField
                        name="changelog"
                        label="Changelog"
                        description="The changelog for this package release."
                        class="flex justify-between items-start gap-4 py-4 first:pt-0 last:pb-0"
                        :ui='{
                            container: "w-full"
                        }'
                    >

						<UTextarea 
                            v-model="package_release_form_state.changelog"
                            placeholder="No changelog provided."
                            :rows="5"
                            autoresize
                            class="w-full"
                        />
                    </UFormField>

                    <div class="pt-4">
                        <UButton
                            v-if="!pkg_release.isNew"
                            label="Save Changes"
                            color="primary"
                            type="submit"
                            :loading="pkg_release_loading"
                            icon="i-lucide-save"
                        />
                        <UButton
                            v-else
                            label="Create Package Release"
                            color="primary"
                            type="submit"
                            :loading="pkg_release_loading"
                            icon="i-lucide-plus-circle"
                        />
                    </div>
                </UForm>
            </div>
        </div>

        <!-- Danger Zone Card -->
        <div
            v-if="!pkg_release.isNew"
            class="rounded-xl border border-red-900/50 bg-red-950/20 backdrop-blur-sm overflow-hidden"
        >
            <div class="px-6 py-4 border-b border-red-900/50">
                <div class="flex items-center gap-3">
                    <div
                        class="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center"
                    >
                        <UIcon
                            name="i-lucide-alert-triangle"
                            class="w-5 h-5 text-red-400"
                        />
                    </div>
                    <div>
                        <h3 class="font-medium text-red-400">Danger Zone</h3>
                        <p class="text-sm text-slate-400">
                            Irreversible and destructive actions
                        </p>
                    </div>
                </div>
            </div>

            <div class="p-6">
                <div class="flex flex-col md:flex-row md:items-center gap-4">
                    <div class="flex-1">
                        <h4 class="font-medium text-white">
                            Delete Package Release
                        </h4>
                        <p class="text-sm text-slate-400 mt-1">
                            Permanently delete this package release and all
                            associated data. This action cannot be undone.
                        </p>
                    </div>
                    <UButton
                        label="Delete Package Release"
                        color="error"
                        variant="soft"
                        icon="i-lucide-trash-2"
                        @click="deleteConfirmOpen = true"
                    />
                </div>
            </div>
        </div>

        <!-- Delete Confirmation Modal -->
        <DashboardDeleteModal
            v-if="!pkg_release.isNew"
            title="Delete Package Release"
            warning-text="All data associated with this package release and related information will be permanently deleted. This action cannot be reversed."
            :loading="deleteLoading"
            v-model:open="deleteConfirmOpen"
            :onDelete="onDeletePackage"
        >
        </DashboardDeleteModal>
    </div>
</template>
