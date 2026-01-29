export const cleanNumberString = (numStr: string) => {
    if (!numStr.includes('.')) return numStr;
    let cleaned = numStr.replace(/0+$/, '');
    if (cleaned.endsWith('.')) {
        cleaned = cleaned.slice(0, -1);
    }
    
    return cleaned;
}