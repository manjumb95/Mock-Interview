export interface Resume {
    id: string;
    userId: string;
    s3Url: string;
    parsedData: any;
    createdAt: string;
    updatedAt: string;
}

export interface JobDescription {
    id: string;
    title: string;
    company: string;
    rawText: string;
    parsedData: any;
    createdAt: string;
    updatedAt: string;
}

export interface Interview {
    id: string;
    userId: string;
    jobDescriptionId: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    skillGapAnalysis: any;
    transcript: any[];
    evaluation: any;
    createdAt: string;
    updatedAt: string;
}
