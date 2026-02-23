import PDFParser from 'pdf2json';

export class ResumeService {
    /**
     * Extract raw text from a PDF Buffer
     */
    static extractTextFromPDF(buffer: Buffer): Promise<string> {
        return new Promise((resolve, reject) => {
            try {
                const pdfParser = new (PDFParser as any)(null, 1);

                pdfParser.on('pdfParser_dataError', (errData: any) => {
                    console.error('PDF Parse Error:', errData.parserError);
                    reject(new Error('Failed to parse PDF document'));
                });

                pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
                    // pdf2json returns raw text when instantiated with (this, 1)
                    const rawText = pdfParser.getRawTextContent();
                    const cleanText = rawText.replace(/\s+/g, ' ').trim();
                    resolve(cleanText);
                });

                pdfParser.parseBuffer(buffer);
            } catch (error) {
                console.error('PDF Parse Constructor Error:', error);
                reject(new Error('Failed to initialize PDF parser'));
            }
        });
    }
}
