export type AppTranslator = {
    (key: string, values?: Record<string, string | number | Date>): string
    has?: (key: string) => boolean
}
