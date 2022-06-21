const fs = require('fs');
const express = require('express');
const cors = require('cors');
const requestIp = require('request-ip')
require('./firebase');
require('dotenv').config();
const { uploadSingleFile, uploadArrayFile } = require('./utils/multer');
const Ref = require('./utils/ref')
const CONFIG = require('./config');
const app = express();

app.use(express.json());
app.use(express.urlencoded());

app.use(cors());

app.post('/upload', function (req, res) {
	uploadSingleFile(req, res, function (err) {
		if (err) {
			return res.status(400).send({ message: err.message });
		}

		const file = req.file;
		console.log('Upload file:', file.filename)
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
		console.log('Download file:', fileName)
		res.download(path, fileName);
	} else {
		console.log('File not found:', fileName)
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
		console.log('Delete file:', fileName)
		res.end()
	} else {
		console.log('File not found:', fileName)
		res.status(400).json({ message: 'No file found' });
	}
});

app.post('/internal/get-files', (req, res) => {
	const clientIp = requestIp.getClientIp(req);
	const listURLInLocationRef = Ref.getInstance();
	const listURLInLocation = listURLInLocationRef.getValue();
	if (!listURLInLocation.includes(`http://${clientIp}:9080`)) {
		console.log('[Internal] Request get file from not allowed IP:', clientIp);
		res.end();
		return;
	}
	const listFolder = req.body.listFolder;
	const listFolderReturn = fs
		.readdirSync('./storage')
		.filter((f) => f !== '.gitignore' && listFolder.includes(parseInt(f)));

	const listFileReturn = [];
	listFolderReturn.map((f) => {
		const files = fs.readdirSync('./storage/' + f);
		files.map((file) => {
			listFileReturn.push({
				path: './storage/' + f + '/' + file,
				buffer: fs.readFileSync('./storage/' + f + '/' + file)
			});
		});
	});
	console.log('[Internal] Request get file from server: ', clientIp, 'and return', listFileReturn);

	res.send(listFileReturn);
});


const host = '0.0.0.0';
// for local test only
// const port = CONFIG.PORT || 8080;

const port = 8080;

app.listen(port, host, () => {
  console.log(`Server 3 listening at port: ${port}`);
});
