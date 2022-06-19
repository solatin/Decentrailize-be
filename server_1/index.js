const fs = require('fs');
const express = require('express');
const cors = require('cors');
require('./firebase/firebaseInit');
require('dotenv').config();
const { uploadSingleFile, uploadArrayFile } = require('./utils/multer');
const CONFIG = require('./config');
const app = express();

app.use(express.json());
app.use(express.urlencoded());


app.use(cors());

app.post('/internal/upload', function (req, res) {
	uploadArrayFile(req, res, function (err) {
		if (err) {
			return res.status(400).send({ message: err.message });
		}
		res.end()
	})
})

app.post('/upload', function (req, res) {
	uploadSingleFile(req, res, function (err) {
		if (err) {
			return res.status(400).send({ message: err.message });
		}

		const file = req.file;
		res.status(200).send({
			filename: file.filename,
			mimetype: file.mimetype,
			originalname: file.originalname,
			size: file.size,
			fieldname: file.fieldname
		});
	});
});

app.get('/download', (req, res) => {
	console.log('zo')
	const hash = req.query.hash;
	const folder = hash.slice(-1).charCodeAt(0) % CONFIG.ORIGINAL_NUMS_OF_FILES;
	if (!CONFIG.FILES_TO_STORE.includes(folder)) {
		res.status(400).send({ message: 'Not my job' });
	}
	const fileName = req.query.fileName;
	const path = __dirname + '/storage/' + folder + '/' + fileName;
	if (fs.existsSync(path)) {
		res.download(path, fileName);
	} else {
		res.status(400).json({ message: 'No file found' });
	}
});

app.delete('/delete', (req, res) => {
	const hash = req.query.hash;
	const folder = hash.slice(-1).charCodeAt(0) % CONFIG.ORIGINAL_NUMS_OF_FILES;
	if (!CONFIG.FILES_TO_STORE.includes(folder)) {
		res.status(400).send({ message: 'Not my job' });
	}
	const fileName = req.query.fileName;
	const path = __dirname + '/storage/' + folder + '/' + fileName;
	if (fs.existsSync(path)) {
		fs.unlinkSync(path)
		res.end()
	} else {
		res.status(400).json({ message: 'No file found' });
	}
});


const host = '0.0.0.0';
// for local test only
const port = CONFIG.PORT || 8080;

// const port = 8080;

app.listen(port, host, () => {
  console.log(`Server 1 listening at port: ${port}`);
});
