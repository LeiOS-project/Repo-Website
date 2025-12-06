<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const links = computed<NavigationMenuItem[]>(() => [
    {
        label: 'Repository Explorer',
        to: '/explorer'
    },
    {
        label: 'Dashboard',
        to: '/dashboard',
        children: [
            { label: 'Übersicht', to: '/dashboard' },
            { label: 'Benutzer', to: '/dashboard?tab=users' },
            { label: 'Releases', to: '/dashboard?tab=releases' }
        ]
    }
]);

</script>

<template>
    <UHeader class="backdrop-blur-xl">
        <template #title>
            <NuxtLink to="/" class="flex items-center gap-2">
                <span class="font-bold text-lg">LeiOS Repository</span>
            </NuxtLink>
        </template>

        <UNavigationMenu :items="links" />

        <template #body>
            <UNavigationMenu :items="links" orientation="vertical" class="w-full" />
        </template>

        <template #right>
            <div class="flex items-center gap-2">
                <UButton
                    icon="i-lucide-user"
                    to="/auth/profile"
                    color="primary" 
                    variant="soft" 
                    class="font-medium hidden sm:inline-flex"
                >
                    Profil
                </UButton>
            </div>
        </template>
    </UHeader>
</template>
