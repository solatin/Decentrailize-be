const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, child } = require('firebase/database');
const { default: axios } = require('axios');
const http = require('http');
const config = require('../config');
const os = require('os');
const ip = require('ip');
const firebaseConfig = {
	apiKey: 'AIzaSyABTUCPHL-_3dCay_GdlMEHHSgZB5013hM',
	authDomain: 'mobile-thesis.firebaseapp.com',
	projectId: 'mobile-thesis',
	storageBucket: 'mobile-thesis.appspot.com',
	messagingSenderId: '600265855407',
	appId: '1:600265855407:web:d1036b6f2d1ed596a85f5a',
	databaseURL: 'https://mobile-thesis-default-rtdb.firebaseio.com/'
};

const app = initializeApp(firebaseConfig);
const dbRef = ref(getDatabase(app));

get(child(dbRef, 'servers'))
	.then(async (snapshot) => {
		if (snapshot.exists()) {
			const objVal = snapshot.val();
			http.get({ host: 'api.ipify.org', port: 80, path: '/' }, function (resp) {
				resp.on('data', function (ip) {
					const ownIP = ip.toString();
					// const listServersURL = Object.keys(objVal).map(key => objVal[key].url).filter(url => url !== hostName);
					const listServersURL = [
						'http://127.0.0.1:3001',
						'http://127.0.0.1:3002',
						'http://127.0.0.1:3003',
						'http://127.0.0.1:3004'
					].filter((url) => url !== ownIP);

					console.log('firebase - list server', listServersURL, ownIP);
					// axios.all(listServersURL.map((url) => {
					//   return axios.post(`${url}/internal/update-files`, {
					//     requireHashList: config.FILES_TO_STORE }
					//   );
					// }))
				});
			});
		} else {
			console.log('No data available');
		}
	})
	.catch((error) => {
		console.error(error);
	});
