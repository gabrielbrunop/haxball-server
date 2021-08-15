export function escapeString(str: any) {
    if (typeof str !== "string") return str;

    return str.replace(/"/g, '\\"');
}