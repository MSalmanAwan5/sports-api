export const authMiddleware = (req : any, res : any, next : any) => {
    const authKey = req.headers['x-api-key'];
    if (authKey === process.env.AUTH_KEY) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};