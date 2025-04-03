const MAX_LEN = 5;

export function generateId(){
    let result = '';
    const chars = '123456789abcdefghijklmnopqrstuvwxyz';
    for (let i = 0; i < MAX_LEN; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        result += chars[randomIndex];
    }
    return result;
}