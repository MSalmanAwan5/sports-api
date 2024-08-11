import express from 'express';
import axios from 'axios';
import ApiData from './schema';
import { authMiddleware } from './lib/authMiddleware';
import mongoose from 'mongoose';


const app = express();
const port = 3000;

mongoose.connect(`${process.env.DATABASEURL}`, {
}).then(() => {
	console.log('Connected to MongoDB');
}).catch(err => {
	console.error('Error connecting to MongoDB:', err.message);
});


// Middleware to parse JSON bodies
app.use(express.json());

app.get('fetch-live-data/mlb', async (req, res) => {
	try {
		const apiUrl = `https://rest.datafeeds.rolling-insights.com/api/v1/live/now/MLB?RSC_token=${process.env.RSC_TOKEN}`;
		const apiResponse = await axios.get(apiUrl);

		// console.log('API Response:', apiResponse.data);
		// console.log('API Response status:', apiResponse.status);

		// const newRecord = new ApiData({ 
		//     request: req.body,
		//     response: apiResponse.data
		// });
		// await newRecord.save();

		return res.json(apiResponse.data);
	} catch (error) {
		// const errorRecord = new ApiData({
		// 	request: req.body || { date: "now" },
		//     response: { error: (error as any).message }
		// });
		// await errorRecord.save();
		console.error("Error fetching data:", (error as any).message);
		res.status(200).json({ error }).send();
	}
});

// POST route handler
app.post('/fetch-live-data/mlb', async (req, res) => {
	try {
		console.log(req.body);
		const date = req.body.date || "now";
		const apiUrl = `https://rest.datafeeds.rolling-insights.com/api/v1/live/now/MLB?RSC_token=${process.env.RSC_TOKEN}`;
		const apiResponse = await axios.get(apiUrl);

		console.log('API Response:', apiResponse.data);
		console.log('API Response status:', apiResponse.status);

		// const newRecord = new ApiData({ 
		//     request: req.body,
		//     response: apiResponse.data
		// });
		// await newRecord.save();

		return res.json(apiResponse.data);
	} catch (error) {
		const errorRecord = new ApiData({
			request: req.body || { date: "now" },
			response: { error: (error as any).message }
		});
		await errorRecord.save();
		console.error("Error fetching data:", (error as any).message);
		res.status(200).json({ error }).send();
	}
});

app.get('/fetch-api-data', authMiddleware, async (req, res) => {
	console.log('GET /fetch-api-data route hit');
	try {
		const { startTime, endTime } = req.query;
		console.log('Received query parameters:', { startTime, endTime });

		const query: any = {};
		if (startTime && endTime) {
			query.request.date = {};
			query.request.date.$gte = new Date(startTime as string);
			query.request.date.$lte = new Date(endTime as string);
		}
		console.log('Constructed query:', query);

		const results = await ApiData.find(query);

		const formattedResults: { [key: string]: any[] } = {};
		results.forEach((result) => {
			if (result?.response?.error) {
				return;
			}
			const date = result?.request?.date;
			if (!formattedResults[date]) {
				formattedResults[date] = [];
			}
			formattedResults[date].push(result);
		});
		res.json(formattedResults);
	} catch (error) {
		console.error('Error fetching data:', (error as any).message);
		res.status(500).json({ error: 'Internal Server Error' });
	}
});

app.get('/', authMiddleware, async (req, res) => {
	try {
		const { startDate, endDate } = req.query;

		if (!startDate || !endDate) {
			return res.status(400).json({ error: 'Missing required query parameters' });
		}
		const apiUrl = `${process.env.BASE_URL}/fetch-api-data`
		const apiResponse = await axios.get(apiUrl, {
			headers: {
				'x-api-key': process.env.AUTH_KEY
			}
		});
		const filteredData = Object.keys(apiResponse.data)
			.filter(date => {
				const currentDate = new Date(date);
				return currentDate >= new Date(startDate as string) && currentDate <= new Date(endDate as string);
			})
			.reduce((obj: any, key: string) => {
				obj[key] = apiResponse.data[key];
				return obj;
			}, {});

		res.json(filteredData);
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
