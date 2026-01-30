export type DataOrError<T> =
    | { data: T; err?: undefined }
    | { data?: undefined; err: BaseError };

export class BaseError extends Error {
    public constructor(
        public readonly namespace: string,
        public readonly type: string,
        public readonly message: string,
        public readonly data?: any
    ) {
        super(message);
    }
}

export class MissingThemeError extends BaseError {
    public constructor(namespace: string) {
        super(namespace, "missing-theme", "Cannot find the specified theme.");
    }
}

export class MissingChartError extends BaseError {
    public constructor(namespace: string, chartId: number) {
        super(
            namespace,
            "missing-chart",
            `Cannot find chart with ID ${chartId}.`,
            { chartId }
        );
    }
}

export class UnsupportedMethodError extends BaseError {
    public constructor(namespace: string, method: string) {
        super(
            namespace,
            "unsupported-method",
            `"${method}" is not supported by this adapter.`,
            { method }
        );
    }
}

export class FailedToFetchError extends BaseError {
    public constructor(
        namespace: string,
        subject: string,
        reason: string = "",
        data?: any
    ) {
        super(
            namespace,
            "failed-to-fetch",
            `Failed to fetch ${subject}. ${reason}`,
            data
        );
    }
}

export class IllegalArgumentError extends BaseError {
    public constructor(namespace: string, detail: string, data?: any) {
        super(
            namespace,
            "illegal-argument",
            `An argument specified is illegal. ${detail}`,
            data
        );
    }
}
