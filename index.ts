import express from 'express';
import axios from 'axios';
import mongoose from 'mongoose';
import ApiData from './schema';

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

//DB Connection
mongoose.connect(`${process.env.DATABASEURL}`, {
}).then(() => {
	console.log('Connected to MongoDB');
}).catch(err => {
	console.error('Error connecting to MongoDB:', err.message);
});

// POST route handler
app.post('/fetch-live-data/mlb', async (req, res) => {
    try {
		console.log(req.body);
        const date = req.body.date || "now";
        const apiUrl = `https://rest.datafeeds.rolling-insights.com/api/v1/live/${date}/MLB?RSC_token=${process.env.RSC_TOKEN}`;
        const apiResponse = await axios.get(apiUrl);

        console.log('API Response:', apiResponse.data);
        console.log('API Response status:', apiResponse.status);

        const newRecord = new ApiData({ 
            request: req.body,
            response: apiResponse.data
        });
        await newRecord.save();

        return res.json(apiResponse.data);
    } catch (error) {
		// console.log("hit error");
        const errorRecord = new ApiData({
			request: req.body || { date: "now" },
            response: { error: (error as any).message }
        });
		// console.log(errorRecord)
        await errorRecord.save();
		// console.log(errorRecord, req.body);
        // console.error('Error fetching data:', (error as any).message);
        await errorRecord.save();
        res.status(200).json({ error }).send();
    }
});

app.get('/fetch-api-data', async (req, res) => {
    console.log('GET /fetch-api-data route hit');
    try {
        const { startTime, endTime } = req.query;
        console.log('Received query parameters:', { startTime, endTime });

        const query: any = {};
        if (startTime && endTime) {
            query.createdAt = {};
            query.createdAt.$gte = new Date(startTime as string);
            query.createdAt.$lte = new Date(endTime as string);
        }
        console.log('Constructed query:', query);

        const results = await ApiData.find(query);
        console.log('Query results:', results);

        res.json(results);
    } catch (error) {
        console.error('Error fetching data:', (error as any).message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// not found route handler
app.use((req, res) => {
	res.status(404).send('Not found');
});

// Start the server
app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`);
});
