type DefaultImagePath = string;
type KeyCode = {
    [index: string]: number;
};
type Unit = 'px' | '%' | 'deg';
export type FilterProperties = {
    min: number;
    max: number;
    step: number;
    unit: Unit;
    initial: number;
};
type AvailableFilters = {
    [index: string]: FilterProperties;
};
export type Config = {
    defaultImagePath: DefaultImagePath;
    keyCode: KeyCode;
    availableFilters: AvailableFilters;
};
export declare const config: Config;
export {};
//# sourceMappingURL=config.d.ts.map