import mongoose from 'mongoose';

const responseSchema = new mongoose.Schema({
	request: {
        type: Object,
        required: true
    },
    response: {
        type: Object,
        required: true
    },
}, { timestamps: true });

const ApiData = mongoose.model('ApiData', responseSchema);

export default ApiData;