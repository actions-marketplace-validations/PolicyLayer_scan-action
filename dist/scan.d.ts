interface ScanResponse {
    id: string;
    url: string;
    summary: {
        serversDetected: number;
        serversMatched: number;
        serversUnknown: number;
        totalTools: number;
        toolsBySeverity: Record<string, number>;
        dangerousTools: number;
    };
}
export declare function postScan(configPath: string, apiUrl: string): Promise<ScanResponse>;
export {};
