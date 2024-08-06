import express from 'express';
import axios from 'axios';

const app = express();
const port = 3002;

// Middleware to parse JSON bodies
app.use(express.json());

// POST route handler
app.post('/fetch-live-sports-data', async (req, res) => {
	try {
		console.log('process.env', process.env.RSC_TOKEN);
		const apiUrl = 'https://rest.datafeeds.rolling-insights.com/api/v1/live/2024-06-01/MLB?RSC_token=' + process.env.RSC_TOKEN;
		const apiResponse = await axios.get(apiUrl);

		console.log('API Response:', apiResponse.data);
		console.log('API Response status:', apiResponse.status);

		res.json(apiResponse.data);
	} catch (error) {
		console.error('Error fetching data:', error.message);
		res.status(500).send('Error fetching data');
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
