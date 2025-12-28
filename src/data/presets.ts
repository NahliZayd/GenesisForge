/**
 * Planet presets for quick generation
 */

export interface PlanetPreset {
    name: string;
    frequency: number;
    heightMultiplier: number;
    seed: number;
    description: string;
}

export const PLANET_PRESETS: PlanetPreset[] = [
    {
        name: 'Earth-like',
        frequency: 1.0,
        heightMultiplier: 0.1,
        seed: 42,
        description: 'Balanced continents and oceans'
    },
    {
        name: 'Mars-like',
        frequency: 0.8,
        heightMultiplier: 0.15,
        seed: 128,
        description: 'Rocky desert world'
    },
    {
        name: 'Water World',
        frequency: 1.2,
        heightMultiplier: 0.05,
        seed: 256,
        description: 'Mostly ocean with small islands'
    },
    {
        name: 'Mountain World',
        frequency: 1.5,
        heightMultiplier: 0.25,
        seed: 512,
        description: 'Extreme terrain with high peaks'
    },
    {
        name: 'Smooth Planet',
        frequency: 0.5,
        heightMultiplier: 0.08,
        seed: 1024,
        description: 'Gentle rolling hills'
    },
    {
        name: 'Chaotic',
        frequency: 3.0,
        heightMultiplier: 0.2,
        seed: 2048,
        description: 'Wild, unpredictable terrain'
    }
];
