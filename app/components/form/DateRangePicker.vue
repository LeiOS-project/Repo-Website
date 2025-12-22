<script setup lang="ts">
import { DateFormatter, getLocalTimeZone, CalendarDate } from '@internationalized/date'

interface Range {
    start: Date
    end: Date
}

const df = new DateFormatter('en-US', {
    dateStyle: 'medium'
})

const selected = defineModel<Range>({ required: true });

const toCalendarDate = (date: Date) => {
    return new CalendarDate(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
    )
}

const calendarRange = computed({
    get: () => ({
        start: selected.value.start ? toCalendarDate(selected.value.start) : undefined,
        end: selected.value.end ? toCalendarDate(selected.value.end) : undefined
    }),
    set: (newValue: { start: CalendarDate | null, end: CalendarDate | null }) => {
        selected.value = {
            start: newValue.start ? newValue.start.toDate(getLocalTimeZone()) : new Date(),
            end: newValue.end ? newValue.end.toDate(getLocalTimeZone()) : new Date()
        }
    }
})


const inputValue = computed(() => {
    const { start, end } = selected.value

    if (!start) return 'Pick a date'
    if (!end) return df.format(start)

    return `${df.format(start)} - ${df.format(end)}`
})

</script>

<template>
    <UPopover :content="{ align: 'start' }" :modal="true">
        <UInput color="neutral" variant="outline" icon="i-lucide-calendar" :model-value="inputValue" class="data-[state=open]:bg-elevated group">
            <template #trailing>
                <UIcon name="i-lucide-chevron-down" class="shrink-0 text-dimmed size-5 group-data-[state=open]:rotate-180 transition-transform duration-200" />
            </template>
        </UInput>

        <template #content>
            <UCalendar v-model="calendarRange" class="p-2" :number-of-months="2" range />
            <!-- </div> -->
        </template>
    </UPopover>
</template>