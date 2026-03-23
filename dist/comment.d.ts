interface ScanSummary {
    serversDetected: number;
    serversMatched: number;
    serversUnknown: number;
    totalTools: number;
    toolsBySeverity: Record<string, number>;
    dangerousTools: number;
}
export declare function formatComment(reportUrl: string, summary: ScanSummary): string;
export declare function upsertComment(octokit: any, repo: {
    owner: string;
    repo: string;
}, prNumber: number, body: string): Promise<void>;
export {};
