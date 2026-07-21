import 'dotenv/config';
import express from "express"
import cors from "cors"
import masterRouter from './routes';

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}))


app.use(express.json())

app.use("/api", masterRouter);

app.use((req, res, next) => {
    res.setHeader("Content-Type", "application/json");
    next();
});

app.use((req, res) => {
    res.status(404).json({ error: "Route not found"});
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})
