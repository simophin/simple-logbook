
export const M3ColorTypes = ['primary', 'onPrimary', 'primaryContainer', 'onPrimaryContainer',
    'secondary', 'onSecondary', 'secondaryContainer', 'onSecondaryContainer',
    'tertiary', 'onTertiary', 'tertiaryContainer', 'onTertiaryContainer',
    'error', 'onError', 'errorContainer', 'onErrorContainer', 'background', 'onBackground',
    'surface', 'onSurface', 'surfaceVariant', 'onSurfaceVariant', 'outline', 'outlineVariant',
    'scrim', 'inverseSurface', 'inverseOnSurface', 'inversePrimary'] as const;


export type M3ColorType = (typeof M3ColorTypes)[number];
