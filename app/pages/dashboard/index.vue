<script setup lang="ts">
import type { TableColumn, TabsItem } from '#ui/types'
import type {
    GetAdminPackagesStableRequestsResponses,
    GetAdminUsersResponses,
    GetDevPackagesResponses
} from '@/api-client/types.gen'
import { UserStore } from '~/utils/stores/userStore'

type DevPackage = GetDevPackagesResponses[200]['data'][number]
type StableRequest = GetAdminPackagesStableRequestsResponses[200]['data'][number]
type AdminUser = GetAdminUsersResponses[200]['data'][number]

const toast = useToast()
const route = useRoute()
const router = useRouter()

const user = await UserStore.use().catch(() => ({
    id: 0,
    username: 'user',
    display_name: 'User',
    email: '',
    role: 'developer'
}))
const isAdmin = computed(() => user.role === 'admin')

const tabItems: TabsItem[] = [
    { label: 'Developer', value: 'developer', icon: 'i-lucide-code-2' },
    { label: 'Admin', value: 'admin', icon: 'i-lucide-shield' }
]

const activeTab = ref<TabsItem['value']>((route.query.tab as string) || 'developer')

const archOptions = [
    { label: 'amd64', value: 'amd64' },
    { label: 'arm64', value: 'arm64' }
]

const packageForm = reactive({
    name: '',
    description: '',
    homepage_url: ''
})

const releaseForm = reactive<{ packageName: string; version: string; arch: 'amd64' | 'arm64'; file: File | undefined }>(
    {
        packageName: '',
        version: '',
        arch: 'amd64',
        file: undefined
    }
)

const stableForm = reactive<{ packageName: string; version: string; arch: 'amd64' | 'arm64'; leios_patch: string }>(
    {
        packageName: '',
        version: '',
        arch: 'amd64',
        leios_patch: ''
    }
)

const adminUserForm = reactive<{ username: string; display_name: string; email: string; password: string; role: AdminUser['role'] }>(
    {
        username: '',
        display_name: '',
        email: '',
        password: '',
        role: 'developer'
    }
)

const decisionNote = reactive<Record<number, string>>({})
const packageReleases = ref<Record<string, any>>({})
const packageStable = ref<Record<string, StableRequest[]>>({})

const packageColumns: TableColumn<DevPackage>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'description', header: 'Description' },
    { accessorKey: 'homepage_url', header: 'Homepage' },
    { id: 'actions', header: 'Actions', enableSorting: false, enableHiding: false }
]

const adminRequestColumns: TableColumn<StableRequest>[] = [
    { accessorKey: 'package_name', header: 'Package' },
    { accessorKey: 'version', header: 'Version' },
    { accessorKey: 'architecture', header: 'Arch' },
    { accessorKey: 'status', header: 'Status' },
    { id: 'actions', header: 'Actions', enableSorting: false, enableHiding: false }
]

const adminUserColumns: TableColumn<AdminUser>[] = [
    { accessorKey: 'username', header: 'Username' },
    { accessorKey: 'display_name', header: 'Name' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'role', header: 'Role' }
]

const { data: devPackages, pending: loadingPackages, refresh: refreshPackages } = await useAsyncData<DevPackage[]>(
    'dev-packages',
    async () => {
        const res = await useAPI((api) => api.getDevPackages({}))
        if (!res.success) {
            toast.add({ title: 'Failed to load packages', description: res.message, color: 'error' })
            return []
        }
        return res.data
    }
)

const {
    data: adminRequests,
    pending: loadingAdminRequests,
    refresh: refreshAdminRequests,
    execute: loadAdminRequests
} = await useAsyncData<StableRequest[]>(
    'admin-stable-requests',
    async () => {
        const res = await useAPI((api) => api.getAdminPackagesStableRequests({}))
        if (!res.success) {
            toast.add({ title: 'Failed to load requests', description: res.message, color: 'error' })
            return []
        }
        return res.data
    },
    { immediate: false }
)

const { data: adminUsers, pending: loadingAdminUsers, refresh: refreshAdminUsers, execute: loadAdminUsers } = await useAsyncData<AdminUser[]>(
    'admin-users',
    async () => {
        const res = await useAPI((api) => api.getAdminUsers({}))
        if (!res.success) {
            toast.add({ title: 'Failed to load users', description: res.message, color: 'error' })
            return []
        }
        return res.data
    },
    { immediate: false }
)

watchEffect(() => {
    if (isAdmin.value) {
        loadAdminRequests()
        loadAdminUsers()
    }
})

watch(activeTab, (val) => {
    router.replace({ query: val ? { tab: val } : {} })
})

const packageOptions = computed(() => (devPackages.value || []).map((p) => ({ label: p.name, value: p.name })))

watch(
    () => releaseForm.packageName,
    (val) => {
        if (val) fetchReleases(val)
    }
)

async function handleCreatePackage() {
    const res = await useAPI((api) => api.postDevPackages({ body: { ...packageForm } }))
    if (res.success) {
        toast.add({ title: 'Package created', description: res.message, color: 'success' })
        Object.assign(packageForm, { name: '', description: '', homepage_url: '' })
        await refreshPackages()
    } else {
        toast.add({ title: 'Create failed', description: res.message, color: 'error' })
    }
}

async function fetchReleases(packageName: string) {
    if (!packageName) return
    const [releasesRes, stableRes] = await Promise.all([
        useAPI((api) => api.getDevPackagesPackageNameReleases({ path: { packageName } })),
        useAPI((api) => api.getDevPackagesPackageNameStableRequests({ path: { packageName } }))
    ])

    if (releasesRes.success) {
        packageReleases.value[packageName] = releasesRes.data
    }
    if (stableRes.success) {
        packageStable.value[packageName] = stableRes.data
    }
}

async function handleUploadRelease() {
    if (!releaseForm.file) {
        toast.add({ title: 'File missing', description: 'Please select a release archive.', color: 'warning' })
        return
    }

    const res = await useAPI((api) =>
        api.postDevPackagesPackageNameReleasesVersionArch({
            path: {
                packageName: releaseForm.packageName,
                version: releaseForm.version,
                arch: releaseForm.arch
            },
            body: releaseForm.file
        })
    )

    if (res.success) {
        toast.add({ title: 'Release uploaded', description: `${releaseForm.version} (${releaseForm.arch}) saved`, color: 'success' })
        await fetchReleases(releaseForm.packageName)
        Object.assign(releaseForm, { version: '', arch: 'amd64', file: undefined })
    } else {
        toast.add({ title: 'Upload failed', description: res.message, color: 'error' })
    }
}

async function handleStableRequest() {
    const res = await useAPI((api) =>
        api.postDevPackagesPackageNameStableRequests({
            path: { packageName: stableForm.packageName },
            body: {
                version: stableForm.version,
                arch: stableForm.arch,
                leios_patch: stableForm.leios_patch ? Number(stableForm.leios_patch) : undefined
            }
        })
    )

    if (res.success) {
        toast.add({ title: 'Request submitted', description: 'Stable promotion requested.', color: 'success' })
        await fetchReleases(stableForm.packageName)
        Object.assign(stableForm, { version: '', arch: 'amd64', leios_patch: '' })
    } else {
        toast.add({ title: 'Request failed', description: res.message, color: 'error' })
    }
}

async function handleDecision(id: number, decision: 'approve' | 'deny') {
    const res = await useAPI((api) =>
        api.postAdminPackagesStableRequestsRequestIdDecision({
            path: { requestId: id },
            body: { decision, reason: decisionNote[id] || undefined }
        })
    )

    if (res.success) {
        toast.add({ title: 'Decision saved', description: res.message, color: 'success' })
        await refreshAdminRequests()
    } else {
        toast.add({ title: 'Action failed', description: res.message, color: 'error' })
    }
}

async function handleCreateUser() {
    const res = await useAPI((api) => api.postAdminUsers({ body: { ...adminUserForm } }))
    if (res.success) {
        toast.add({ title: 'User created', description: res.message, color: 'success' })
        Object.assign(adminUserForm, { username: '', display_name: '', email: '', password: '', role: 'developer' })
        await refreshAdminUsers()
    } else {
        toast.add({ title: 'Failed to create user', description: res.message, color: 'error' })
    }
}

const totalPackages = computed(() => devPackages.value?.length || 0)
const pendingStable = computed(() =>
    Object.values(packageStable.value)
        .flat()
        .filter((req) => req.status === 'pending').length
)
</script>

<template>
    <div class="bg-slate-950/40 py-10">
        <UContainer class="space-y-10">
            <div class="grid gap-6 lg:grid-cols-[2fr_1fr]">
                <UCard class="border-slate-800 bg-slate-900/70">
                    <div class="flex flex-col gap-4 p-6">
                        <div class="flex items-center gap-3">
                            <UIcon name="i-lucide-layout-dashboard" class="text-sky-400" />
                            <div>
                                <p class="text-sm text-slate-400">Signed in as</p>
                                <p class="text-xl font-semibold">{{ user.display_name || user.username }}</p>
                            </div>
                        </div>
                        <p class="text-slate-400">Manage LeiOS packages, releases, and stable promotion with a lightweight Nuxt UI 4 surface.</p>
                        <div class="flex flex-wrap gap-3">
                            <UBadge color="primary" variant="soft">Role: {{ user.role }}</UBadge>
                            <UBadge color="neutral" variant="soft">Packages: {{ totalPackages }}</UBadge>
                            <UBadge color="neutral" variant="soft">Open promotions: {{ pendingStable }}</UBadge>
                        </div>
                    </div>
                </UCard>

                <UCard class="border-slate-800 bg-slate-900/70">
                    <div class="space-y-4 p-6">
                        <p class="text-sm text-slate-400">Next steps</p>
                        <div class="space-y-3 text-slate-200">
                            <p class="flex items-center gap-2"><UIcon name="i-lucide-plus-circle" class="text-sky-400" /> Create a package</p>
                            <p class="flex items-center gap-2"><UIcon name="i-lucide-upload-cloud" class="text-sky-400" /> Upload a release</p>
                            <p class="flex items-center gap-2"><UIcon name="i-lucide-shield-check" class="text-sky-400" /> Request stable promotion</p>
                        </div>
                    </div>
                </UCard>
            </div>

            <UTabs v-model="activeTab" :items="tabItems" :ui="{ list: 'bg-slate-900/60 border border-slate-800' }">
                <template #default="{ item }">
                    <div v-if="item.value === 'developer'" class="space-y-8 py-6">
                        <div class="grid gap-6 lg:grid-cols-3">
                            <UCard class="border-slate-800 bg-slate-900/70">
                                <div class="space-y-4 p-5">
                                    <div class="flex items-center gap-2">
                                        <UIcon name="i-lucide-plus" class="text-sky-400" />
                                        <h3 class="font-semibold">Create package</h3>
                                    </div>
                                    <UForm :state="packageForm" @submit.prevent="handleCreatePackage">
                                        <div class="space-y-3">
                                            <UFormGroup label="Name" name="name">
                                                <UInput v-model="packageForm.name" placeholder="z. B. leios-updater" />
                                            </UFormGroup>
                                            <UFormGroup label="Description" name="description">
                                                <UTextarea v-model="packageForm.description" :rows="3" />
                                            </UFormGroup>
                                            <UFormGroup label="Homepage" name="homepage">
                                                <UInput v-model="packageForm.homepage_url" placeholder="https://" />
                                            </UFormGroup>
                                            <UButton type="submit" color="primary" :loading="loadingPackages">Create</UButton>
                                        </div>
                                    </UForm>
                                </div>
                            </UCard>

                            <UCard class="border-slate-800 bg-slate-900/70">
                                <div class="space-y-4 p-5">
                                    <div class="flex items-center gap-2">
                                        <UIcon name="i-lucide-upload" class="text-sky-400" />
                                        <h3 class="font-semibold">Upload release</h3>
                                    </div>
                                    <div class="space-y-3">
                                        <USelect v-model="releaseForm.packageName" :options="packageOptions" placeholder="Select package" @change="fetchReleases(releaseForm.packageName)" />
                                        <UInput v-model="releaseForm.version" placeholder="Version (e.g. 1.0.0)" />
                                        <USelect v-model="releaseForm.arch" :options="archOptions" />
                                        <UInput type="file" accept=".deb,.tar.gz,.zip" @change="(e: Event) => {
                                            const file = (e.target as HTMLInputElement)?.files?.[0]
                                            releaseForm.file = file ?? undefined
                                        }" />
                                        <UButton color="primary" @click="handleUploadRelease">Upload</UButton>
                                    </div>
                                </div>
                            </UCard>

                            <UCard class="border-slate-800 bg-slate-900/70">
                                <div class="space-y-4 p-5">
                                    <div class="flex items-center gap-2">
                                        <UIcon name="i-lucide-arrow-up-right" class="text-sky-400" />
                                        <h3 class="font-semibold">Request stable</h3>
                                    </div>
                                    <div class="space-y-3">
                                        <USelect v-model="stableForm.packageName" :options="packageOptions" placeholder="Select package" />
                                        <UInput v-model="stableForm.version" placeholder="Release version" />
                                        <USelect v-model="stableForm.arch" :options="archOptions" />
                                        <UInput v-model="stableForm.leios_patch" placeholder="LeiOS patch (optional)" />
                                        <UButton color="primary" @click="handleStableRequest">Submit request</UButton>
                                    </div>
                                </div>
                            </UCard>
                        </div>

                        <UCard class="border-slate-800 bg-slate-900/70">
                            <div class="space-y-4 p-5">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-2">
                                        <UIcon name="i-lucide-package" class="text-sky-400" />
                                        <h3 class="font-semibold">Packages & releases</h3>
                                    </div>
                                    <UButton variant="ghost" size="sm" icon="i-lucide-refresh-cw" @click="() => refreshPackages()">Refresh</UButton>
                                </div>
                                <UTable :data="devPackages || []" :columns="packageColumns" :loading="loadingPackages">
                                    <template #actions-cell="{ row }">
                                        <div class="flex gap-2">
                                            <UButton size="xs" variant="soft" color="primary" @click="() => fetchReleases(row.original.name)">Releases</UButton>
                                        </div>
                                    </template>
                                </UTable>

                                <div v-for="(releases, name) in packageReleases" :key="name" class="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-2">
                                            <UIcon name="i-lucide-archive" class="text-sky-400" />
                                            <h4 class="font-semibold">{{ name }}</h4>
                                        </div>
                                        <UBadge color="neutral" variant="soft">Archive</UBadge>
                                    </div>
                                    <pre class="mt-3 overflow-auto rounded bg-slate-900/80 p-3 text-sm text-slate-200">{{ JSON.stringify(releases?.['leios-archive'] || releases, null, 2) }}</pre>

                                    <div v-if="packageStable[name]?.length" class="mt-4 space-y-2">
                                        <p class="text-sm text-slate-400">Stable requests</p>
                                        <div class="grid gap-2 md:grid-cols-2">
                                            <UCard v-for="req in packageStable[name]" :key="req.id" class="border-slate-800 bg-slate-900/70">
                                                <div class="flex items-center justify-between">
                                                    <div>
                                                        <p class="font-medium">{{ req.version }} · {{ req.architecture }}</p>
                                                        <p class="text-xs text-slate-400">Status: {{ req.status }}</p>
                                                    </div>
                                                    <UBadge :color="req.status === 'approved' ? 'success' : req.status === 'pending' ? 'warning' : 'error'" variant="soft">
                                                        {{ req.status }}
                                                    </UBadge>
                                                </div>
                                            </UCard>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </UCard>
                    </div>

                    <div v-else class="space-y-8 py-6">
                        <UCard v-if="!isAdmin" class="border-slate-800 bg-slate-900/70">
                            <div class="space-y-3 p-6">
                                <h3 class="text-xl font-semibold">Admin area</h3>
                                <p class="text-slate-400">You need admin permissions to decide stable requests or manage users.</p>
                            </div>
                        </UCard>

                        <template v-else>
                            <div class="grid gap-6 lg:grid-cols-2">
                                <UCard class="border-slate-800 bg-slate-900/70">
                                    <div class="space-y-4 p-5">
                                        <div class="flex items-center gap-2">
                                            <UIcon name="i-lucide-gavel" class="text-sky-400" />
                                            <h3 class="font-semibold">Stable requests</h3>
                                        </div>
                                        <UTable :data="adminRequests || []" :loading="loadingAdminRequests" :columns="adminRequestColumns">
                                            <template #status-cell="{ row }">
                                                <UBadge :color="row.original.status === 'approved' ? 'success' : row.original.status === 'pending' ? 'warning' : 'error'" variant="soft">
                                                    {{ row.original.status }}
                                                </UBadge>
                                            </template>
                                            <template #actions-cell="{ row }">
                                                <div class="flex flex-col gap-2">
                                                    <UTextarea v-model="decisionNote[row.original.id]" placeholder="Reason (optional)" :rows="2" />
                                                    <div class="flex gap-2">
                                                        <UButton size="xs" color="primary" variant="soft" @click="handleDecision(row.original.id, 'approve')" :disabled="row.original.status !== 'pending'">Approve</UButton>
                                                        <UButton size="xs" color="error" variant="soft" @click="handleDecision(row.original.id, 'deny')" :disabled="row.original.status !== 'pending'">Deny</UButton>
                                                    </div>
                                                </div>
                                            </template>
                                        </UTable>
                                    </div>
                                </UCard>

                                <UCard class="border-slate-800 bg-slate-900/70">
                                    <div class="space-y-4 p-5">
                                        <div class="flex items-center gap-2">
                                            <UIcon name="i-lucide-users" class="text-sky-400" />
                                            <h3 class="font-semibold">Manage users</h3>
                                        </div>
                                        <UForm :state="adminUserForm" @submit.prevent="handleCreateUser">
                                            <div class="space-y-3">
                                                <UInput v-model="adminUserForm.username" placeholder="Username" />
                                                <UInput v-model="adminUserForm.display_name" placeholder="Display name" />
                                                <UInput v-model="adminUserForm.email" placeholder="Email" />
                                                <UInput v-model="adminUserForm.password" type="password" placeholder="Password" />
                                                <USelect v-model="adminUserForm.role" :options="[
                                                    { label: 'Developer', value: 'developer' },
                                                    { label: 'Admin', value: 'admin' },
                                                    { label: 'User', value: 'user' }
                                                ]" />
                                                <UButton type="submit" color="primary" :loading="loadingAdminUsers">Create user</UButton>
                                            </div>
                                        </UForm>

                                        <div class="pt-4">
                                            <p class="mb-2 text-sm text-slate-400">Existing users</p>
                                            <UTable :data="adminUsers || []" :loading="loadingAdminUsers" :columns="adminUserColumns" />
                                        </div>
                                    </div>
                                </UCard>
                            </div>
                        </template>
                    </div>
                </template>
            </UTabs>
        </UContainer>
    </div>
</template>
