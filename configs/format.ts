export interface FieldDefinition {
    optional: boolean;
    mentionsOnly: boolean;
}

export const fields: Record<string, FieldDefinition> = {
    "event":        { optional: false, mentionsOnly: false },
    "host":         { optional: false, mentionsOnly: true },
    "co-host":      { optional: true, mentionsOnly: true },
    "attendees":    { optional: false, mentionsOnly: true },
    "notes":        { optional: true, mentionsOnly: false },
    "evidence":     { optional: true, mentionsOnly: false },
    "ping":         { optional: false, mentionsOnly: true }
}