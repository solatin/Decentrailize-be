const fs = require('fs');
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

const CONFIG = require('./config');
const app = express();

app.use(express.json());
app.use(express.urlencoded());

app.use(cors());

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
    const path = `./storage/${req.folder}`
		if (!fs.existsSync(path)) {
			fs.mkdir(path, function (err) {
				console.log('Failed to create directory', err);
			});
		}
		cb(null, path);
	},
	filename: function (req, file, cb) {
		cb(null, req.body.hash + path.extname(file.originalname)); // not work if file does not have extension, then use mine type
	}
});

const upload = multer({
	storage: storage,
	fileFilter: (req, file, cb) => {
		const hash = req.body.hash;
		const folder = hash.slice(-1).charCodeAt(0) % CONFIG.ORIGINAL_NUMS_OF_FILES;
		if (CONFIG.FILES_TO_STORE.includes(folder)) {
			req.folder = folder;
			cb(null, true);
		} else {
			cb(new Error('Not my job'));
		}
	}
});

const uploadSingleFile = upload.single('file');

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

const host = '0.0.0.0';
const port = process.env.PORT || 8080;
console.log(process.env.PORT);
app.listen(port, host, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
