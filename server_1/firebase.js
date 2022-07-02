const { initializeApp } = require('@firebase/app');
const { getDatabase, ref, get, child, set } = require('@firebase/database');
const { default: axios } = require('axios');
const http = require('http');
const fs = require('fs');
const config = require('./config');
const Ref = require('./utils/ref');
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
const db = getDatabase(app);
const dbRef = ref(getDatabase(app));

const listURLInLocationRef = Ref.getInstance();

get(child(dbRef, 'servers'))
	.then(async (snapshot) => {
		if (snapshot.exists()) {
			const objVal = snapshot.val();
			http.get({ host: 'api.ipify.org', port: 80, path: '/' }, function (resp) {
				resp.on('data', async function (ip) {
					const ownIP = ip.toString();
					const arrayVal = Object.values(objVal);
					Object.keys(objVal).every((key) => {
						if (objVal[key].url === `http://${ownIP}:9080` && objVal[key].status !== 'Active') {
							console.log('Activate server')
							set(ref(db, 'servers/' + key), {
								...objVal[key],
								status: 'Active'
							});
							return false;
						}
						return true;
					});

					const ownServerIdx = arrayVal.findIndex((i) => i.url === `http://${ownIP}:9080`);
					const [ownServer] = arrayVal.splice(ownServerIdx, 1);
					const ownLocation = ownServer.location;
					const listServerInLocation = arrayVal.filter((i) => i.location === ownLocation);
					const allServerHasActivated = listServerInLocation.every((server) => server.status === 'Active');
					if (allServerHasActivated) {
						const locationsObj = await (await get(child(dbRef, 'locations'))).val();
						Object.keys(locationsObj).every((key) => {
							if (locationsObj[key].name === ownLocation && locationsObj[key].status !== 'Active') {
								console.log('Activate location');
								set(ref(db, 'locations/' + key), {
									...locationsObj[key],
									status: 'Active'
								});
								return false;
							}
							return true;
						});
					}
					listURLInLocationRef.setValue(arrayVal.filter((val) => val.location === ownLocation).map((val) => val.url));
					const listURLInLocation = listURLInLocationRef.getValue();
					console.log('List server in location: ', listURLInLocation);
					console.log('My own ip: ', ownIP);

					listURLInLocation.map((url) => {
						axios
							.post(`${url}/internal/get-files`, {
								listFolder: config.FILES_TO_STORE
							})
							.then((res) => {
								const { data } = res;
								console.log('[Internal] Request get file to server: ', url, 'and return', data);

								if (data) {
									data.map((file) => {
										if (!fs.existsSync(file.path)) {
											if (!fs.existsSync('./storage/' + file.path.split('/')[2])) {
												fs.mkdirSync('./storage/' + file.path.split('/')[2]);
											}
											fs.createWriteStream(file.path).write(Buffer.from(file.buffer.data));
										}
									});
								}
							})
							.catch(() => console.log('[Internal] Request get file to server', url, 'failed'));
					});
				});
			});
		} else {
			console.log('No data available');
		}
	})
	.catch((error) => {
		console.error(error);
	});
