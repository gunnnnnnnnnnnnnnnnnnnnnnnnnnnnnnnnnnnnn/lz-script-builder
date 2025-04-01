export const getFormattedTimestamp = () => {
    const now = new Date();
    const MM = String(now.getMonth() + 1).padStart(2, '0'); // Month (1-based)
    const DD = String(now.getDate()).padStart(2, '0');      // Day
    const HH = String(now.getHours()).padStart(2, '0');     // Hours
    const SS = String(now.getMinutes()).padStart(2, '0');   // Minutes

    return `${MM}${DD}${HH}${SS}`;
}