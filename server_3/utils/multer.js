const fs = require('fs');
const path = require('path');
const multer = require('multer');
const CONFIG = require('../config');


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

const uploadArrayFile = upload.array('files');

module.exports = {
  uploadSingleFile, 
  uploadArrayFile
}