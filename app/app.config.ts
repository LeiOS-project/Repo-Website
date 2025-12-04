export default defineAppConfig({
    ui: {
        main: {
            // base: 'min-h-[calc(100vh-var(--ui-header-height))]'
        },
        colors: {
            primary: 'aurora',
            secondary: 'pulse',
            info: 'aurora',
            success: 'emerald',
            warning: 'amber',
            error: 'rose',
            neutral: 'nocturne'
        }
    },
    theme: {
        radius: 0.25,
        blackAsPrimary: true
    }
})
