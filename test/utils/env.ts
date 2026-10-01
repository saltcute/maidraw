/** Environment overrides shared by the manual test harnesses. */
export function envString(name: string, fallback: string): string {
    return process.env[name] ?? fallback;
}

export function envNumber(name: string, fallback: number, integer = false): number {
    const raw = process.env[name];
    if (raw === undefined) return fallback;
    const value = Number(raw);
    if (raw.trim() === "" || !Number.isFinite(value) || (integer && (!Number.isInteger(value) || value < 0))) {
        throw new Error(`${name} must be ${integer ? "a nonnegative integer" : "a finite number"}`);
    }
    return value;
}

export function envChoice<const T extends string>(name: string, choices: readonly T[], fallback: T): T {
    const value = process.env[name];
    if (value === undefined) return fallback;
    const choice = choices.find((choice) => choice === value);
    if (choice === undefined) throw new Error(`${name} must be one of: ${choices.join(", ")}`);
    return choice;
}

export function envBoolean(name: string, fallback: boolean): boolean {
    const value = envChoice(name, ["true", "false", "1", "0"], fallback ? "true" : "false");
    return value === "true" || value === "1";
}
