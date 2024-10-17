const DEFAULT_BAR_HEIGHT_FOR_MAX_RIDERSHIP = 0.02;

export const getAbsoluteHeight = (d: { ridership: number, percentage: number }, barScale: number, showPercentage: boolean) => {
    if (showPercentage) {
        return d.ridership < 1 ? 0 : d.percentage * DEFAULT_BAR_HEIGHT_FOR_MAX_RIDERSHIP * barScale;
    }
    return d.ridership < 1 ? 0 : d.ridership * DEFAULT_BAR_HEIGHT_FOR_MAX_RIDERSHIP * barScale;
};