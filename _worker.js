// @ts-ignore
import { connect } from 'cloudflare:sockets';

// How to generate your own UUID:
// [Windows] Press "Win + R", input cmd and run:  Powershell -NoExit -Command "[guid]::NewGuid()"
let userID = '474cb323-2a57-4987-85c3-af61340be47c';

//const พร็อกซีไอพีs = ['35.219.50.99'];
//const พร็อกซีไอพีs = ['8.219.114.201'];
const พร็อกซีไอพีs = ['139.59.126.134'];

// if you want to use ipv6 or single พร็อกซีไอพี, please add comment at this line and remove comment at the next line
let พร็อกซีไอพี = พร็อกซีไอพีs[Math.floor(Math.random() * พร็อกซีไอพีs.length)];
// use single พร็อกซีไอพี instead of random
// let พร็อกซีไอพี = 'cdn.xn--b6gac.eu.org';
// ipv6 พร็อกซีไอพี example remove comment to use
// let พร็อกซีไอพี = "[2a01:4f8:c2c:123f:64:5:6810:c55a]"

let dohURL = 'https://sky.rethinkdns.com/1:-Pf_____9_8A_AMAIgE8kMABVDDmKOHTAKg='; // https://cloudflare-dns.com/dns-query or https://dns.google/dns-query

if (!isValidUUID(userID)) {
	throw new Error('uuid is invalid');
}

export default {
	/**
	 * @param {import("@cloudflare/workers-types").Request} request
	 * @param {{UUID: string, พร็อกซีไอพี: string, DNS_RESOLVER_URL: string, NODE_ID: int, API_HOST: string, API_TOKEN: string}} env
	 * @param {import("@cloudflare/workers-types").ExecutionContext} ctx
	 * @returns {Promise<Response>}
	 */
	async fetch(request, env, ctx) {
		// uuid_validator(request);
		try {
			userID = env.UUID || userID;
			พร็อกซีไอพี = env.พร็อกซีไอพี || พร็อกซีไอพี;
			dohURL = env.DNS_RESOLVER_URL || dohURL;
			let userID_Path = userID;
			if (userID.includes(',')) {
				userID_Path = userID.split(',')[0];
			}
			const upgradeHeader = request.headers.get('Upgrade');
			if (!upgradeHeader || upgradeHeader !== 'websocket') {
				const url = new URL(request.url);
				switch (url.pathname) {
					case `/cf`: {
						return new Response(JSON.stringify(request.cf, null, 4), {
							status: 200,
							headers: {
								"Content-Type": "application/json;charset=utf-8",
							},
						});
					}
					case `/geo`: {
						const วเลสConfig = getวเลสConfig(userID, request.headers.get('Host'));
						return new Response(`${วเลสConfig}`, {
							status: 200,
							headers: {
								"Content-Type": "text/html; charset=utf-8",
							}
						});
					};
					case `/sub/geo`: {
						const url = new URL(request.url);
						const searchParams = url.searchParams;
						const วเลสSubConfig = สร้างวเลสSub(userID, request.headers.get('Host'));
						// Construct and return response object
						return new Response(btoa(วเลสSubConfig), {
							status: 200,
							headers: {
								"Content-Type": "text/plain;charset=utf-8",
							}
						});
					};
					case `/bestip/geo`: {
						const headers = request.headers;
						const url = `https://sub.xf.free.hr/auto?host=${request.headers.get('Host')}&uuid=${userID}&path=/`;
						const bestSubConfig = await fetch(url, { headers: headers });
						return bestSubConfig;
					};
					default:
						// return new Response('Not found', { status: 404 });
						// For any other path, reverse proxy to 'ramdom website' and return the original response, caching it in the process
						const randomHostname = cn_hostnames[Math.floor(Math.random() * cn_hostnames.length)];
						const newHeaders = new Headers(request.headers);
						newHeaders.set('cf-connecting-ip', '1.2.3.4');
						newHeaders.set('x-forwarded-for', '1.2.3.4');
						newHeaders.set('x-real-ip', '1.2.3.4');
						newHeaders.set('referer', 'https://www.google.com/search?q=edtunnel');
						// Use fetch to proxy the request to 15 different domains
						const proxyUrl = 'https://' + randomHostname + url.pathname + url.search;
						let modifiedRequest = new Request(proxyUrl, {
							method: request.method,
							headers: newHeaders,
							body: request.body,
							redirect: 'manual',
						});
						const proxyResponse = await fetch(modifiedRequest, { redirect: 'manual' });
						// Check for 302 or 301 redirect status and return an error response
						if ([301, 302].includes(proxyResponse.status)) {
							return new Response(`Redirects to ${randomHostname} are not allowed.`, {
								status: 403,
								statusText: 'Forbidden',
							});
						}
						// Return the response from the proxy server
						return proxyResponse;
				}
			} else {
				return await วเลสOverWSHandler(request);
			}
		} catch (err) {
			/** @type {Error} */ let e = err;
			return new Response(e.toString());
		}
	},
};

export async function uuid_validator(request) {
	const hostname = request.headers.get('Host');
	const currentDate = new Date();

	const subdomain = hostname.split('.')[0];
	const year = currentDate.getFullYear();
	const month = String(currentDate.getMonth() + 1).padStart(2, '0');
	const day = String(currentDate.getDate()).padStart(2, '0');

	const formattedDate = `${year}-${month}-${day}`;

	// const daliy_sub = formattedDate + subdomain
	const hashHex = await hashHex_f(subdomain);
	// subdomain string contains timestamps utc and uuid string TODO.
	console.log(hashHex, subdomain, formattedDate);
}

export async function hashHex_f(string) {
	const encoder = new TextEncoder();
	const data = encoder.encode(string);
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
	return hashHex;
}

/**
 * Handles วเลส over WebSocket requests by creating a WebSocket pair, accepting the WebSocket connection, and processing the วเลส header.
 * @param {import("@cloudflare/workers-types").Request} request The incoming request object.
 * @returns {Promise<Response>} A Promise that resolves to a WebSocket response object.
 */
async function วเลสOverWSHandler(request) {
	const webSocketPair = new WebSocketPair();
	const [client, webSocket] = Object.values(webSocketPair);
	webSocket.accept();

	let address = '';
	let portWithRandomLog = '';
	let currentDate = new Date();
	const log = (/** @type {string} */ info, /** @type {string | undefined} */ event) => {
		console.log(`[${currentDate} ${address}:${portWithRandomLog}] ${info}`, event || '');
	};
	const earlyDataHeader = request.headers.get('sec-websocket-protocol') || '';

	const readableWebSocketStream = makeReadableWebSocketStream(webSocket, earlyDataHeader, log);

	/** @type {{ value: import("@cloudflare/workers-types").Socket | null}}*/
	let remoteSocketWapper = {
		value: null,
	};
	let udpStreamWrite = null;
	let isDns = false;

	// ws --> remote
	readableWebSocketStream.pipeTo(new WritableStream({
		async write(chunk, controller) {
			if (isDns && udpStreamWrite) {
				return udpStreamWrite(chunk);
			}
			if (remoteSocketWapper.value) {
				const writer = remoteSocketWapper.value.writable.getWriter()
				await writer.write(chunk);
				writer.releaseLock();
				return;
			}

			const {
				hasError,
				message,
				portRemote = 443,
				addressRemote = '',
				rawDataIndex,
				วเลสVersion = new Uint8Array([0, 0]),
				isUDP,
			} = processวเลสHeader(chunk, userID);
			address = addressRemote;
			portWithRandomLog = `${portRemote} ${isUDP ? 'udp' : 'tcp'} `;
			if (hasError) {
				// controller.error(message);
				throw new Error(message); // cf seems has bug, controller.error will not end stream
			}

			// If UDP and not DNS port, close it
			if (isUDP && portRemote !== 53) {
				throw new Error('UDP proxy only enabled for DNS which is port 53');
				// cf seems has bug, controller.error will not end stream
			}

			if (isUDP && portRemote === 53) {
				isDns = true;
			}

			// ["version", "附加信息长度 N"]
			const วเลสResponseHeader = new Uint8Array([วเลสVersion[0], 0]);
			const rawClientData = chunk.slice(rawDataIndex);

			// TODO: support udp here when cf runtime has udp support
			if (isDns) {
				const { write } = await handleUDPOutBound(webSocket, วเลสResponseHeader, log);
				udpStreamWrite = write;
				udpStreamWrite(rawClientData);
				return;
			}
			handleTCPOutBound(remoteSocketWapper, addressRemote, portRemote, rawClientData, webSocket, วเลสResponseHeader, log);
		},
		close() {
			log(`readableWebSocketStream is close`);
		},
		abort(reason) {
			log(`readableWebSocketStream is abort`, JSON.stringify(reason));
		},
	})).catch((err) => {
		log('readableWebSocketStream pipeTo error', err);
	});

	return new Response(null, {
		status: 101,
		webSocket: client,
	});
}

/**
 * Handles outbound TCP connections.
 *
 * @param {any} remoteSocket 
 * @param {string} addressRemote The remote address to connect to.
 * @param {number} portRemote The remote port to connect to.
 * @param {Uint8Array} rawClientData The raw client data to write.
 * @param {import("@cloudflare/workers-types").WebSocket} webSocket The WebSocket to pass the remote socket to.
 * @param {Uint8Array} วเลสResponseHeader The วเลส response header.
 * @param {function} log The logging function.
 * @returns {Promise<void>} The remote socket.
 */
async function handleTCPOutBound(remoteSocket, addressRemote, portRemote, rawClientData, webSocket, วเลสResponseHeader, log,) {

	/**
	 * Connects to a given address and port and writes data to the socket.
	 * @param {string} address The address to connect to.
	 * @param {number} port The port to connect to.
	 * @returns {Promise<import("@cloudflare/workers-types").Socket>} A Promise that resolves to the connected socket.
	 */
	async function connectAndWrite(address, port) {
		/** @type {import("@cloudflare/workers-types").Socket} */
		const tcpSocket = connect({
			hostname: address,
			port: port,
		});
		remoteSocket.value = tcpSocket;
		log(`connected to ${address}:${port}`);
		const writer = tcpSocket.writable.getWriter();
		await writer.write(rawClientData); // first write, nomal is tls client hello
		writer.releaseLock();
		return tcpSocket;
	}

	/**
	 * Retries connecting to the remote address and port if the Cloudflare socket has no incoming data.
	 * @returns {Promise<void>} A Promise that resolves when the retry is complete.
	 */
	async function retry() {
		const tcpSocket = await connectAndWrite(พร็อกซีไอพี || addressRemote, portRemote)
		tcpSocket.closed.catch(error => {
			console.log('retry tcpSocket closed error', error);
		}).finally(() => {
			safeCloseWebSocket(webSocket);
		})
		remoteSocketToWS(tcpSocket, webSocket, วเลสResponseHeader, null, log);
	}

	const tcpSocket = await connectAndWrite(addressRemote, portRemote);

	// when remoteSocket is ready, pass to websocket
	// remote--> ws
	remoteSocketToWS(tcpSocket, webSocket, วเลสResponseHeader, retry, log);
}

/**
 * Creates a readable stream from a WebSocket server, allowing for data to be read from the WebSocket.
 * @param {import("@cloudflare/workers-types").WebSocket} webSocketServer The WebSocket server to create the readable stream from.
 * @param {string} earlyDataHeader The header containing early data for WebSocket 0-RTT.
 * @param {(info: string)=> void} log The logging function.
 * @returns {ReadableStream} A readable stream that can be used to read data from the WebSocket.
 */
function makeReadableWebSocketStream(webSocketServer, earlyDataHeader, log) {
	let readableStreamCancel = false;
	const stream = new ReadableStream({
		start(controller) {
			webSocketServer.addEventListener('message', (event) => {
				const message = event.data;
				controller.enqueue(message);
			});

			webSocketServer.addEventListener('close', () => {
				safeCloseWebSocket(webSocketServer);
				controller.close();
			});

			webSocketServer.addEventListener('error', (err) => {
				log('webSocketServer has error');
				controller.error(err);
			});
			const { earlyData, error } = base64ToArrayBuffer(earlyDataHeader);
			if (error) {
				controller.error(error);
			} else if (earlyData) {
				controller.enqueue(earlyData);
			}
		},

		pull(controller) {
			// if ws can stop read if stream is full, we can implement backpressure
			// https://streams.spec.whatwg.org/#example-rs-push-backpressure
		},

		cancel(reason) {
			log(`ReadableStream was canceled, due to ${reason}`)
			readableStreamCancel = true;
			safeCloseWebSocket(webSocketServer);
		}
	});

	return stream;
}

// https://xtls.github.io/development/protocols/วเลส.html
// https://github.com/zizifn/excalidraw-backup/blob/main/v2ray-protocol.excalidraw

/**
 * Processes the วเลส header buffer and returns an object with the relevant information.
 * @param {ArrayBuffer} วเลสBuffer The วเลส header buffer to process.
 * @param {string} userID The user ID to validate against the UUID in the วเลส header.
 * @returns {{
 *  hasError: boolean,
 *  message?: string,
 *  addressRemote?: string,
 *  addressType?: number,
 *  portRemote?: number,
 *  rawDataIndex?: number,
 *  วเลสVersion?: Uint8Array,
 *  isUDP?: boolean
 * }} An object with the relevant information extracted from the วเลส header buffer.
 */
function processวเลสHeader(วเลสBuffer, userID) {
	if (วเลสBuffer.byteLength < 24) {
		return {
			hasError: true,
			message: 'invalid data',
		};
	}

	const version = new Uint8Array(วเลสBuffer.slice(0, 1));
	let isValidUser = false;
	let isUDP = false;
	const slicedBuffer = new Uint8Array(วเลสBuffer.slice(1, 17));
	const slicedBufferString = stringify(slicedBuffer);
	// check if userID is valid uuid or uuids split by , and contains userID in it otherwise return error message to console
	const uuids = userID.includes(',') ? userID.split(",") : [userID];
	// uuid_validator(hostName, slicedBufferString);


	// isValidUser = uuids.some(userUuid => slicedBufferString === userUuid.trim());
	isValidUser = uuids.some(userUuid => slicedBufferString === userUuid.trim()) || uuids.length === 1 && slicedBufferString === uuids[0].trim();

	console.log(`userID: ${slicedBufferString}`);

	if (!isValidUser) {
		return {
			hasError: true,
			message: 'invalid user',
		};
	}

	const optLength = new Uint8Array(วเลสBuffer.slice(17, 18))[0];
	//skip opt for now

	const command = new Uint8Array(
		วเลสBuffer.slice(18 + optLength, 18 + optLength + 1)
	)[0];

	// 0x01 TCP
	// 0x02 UDP
	// 0x03 MUX
	if (command === 1) {
		isUDP = false;
	} else if (command === 2) {
		isUDP = true;
	} else {
		return {
			hasError: true,
			message: `command ${command} is not support, command 01-tcp,02-udp,03-mux`,
		};
	}
	const portIndex = 18 + optLength + 1;
	const portBuffer = วเลสBuffer.slice(portIndex, portIndex + 2);
	// port is big-Endian in raw data etc 80 == 0x005d
	const portRemote = new DataView(portBuffer).getUint16(0);

	let addressIndex = portIndex + 2;
	const addressBuffer = new Uint8Array(
		วเลสBuffer.slice(addressIndex, addressIndex + 1)
	);

	// 1--> ipv4  addressLength =4
	// 2--> domain name addressLength=addressBuffer[1]
	// 3--> ipv6  addressLength =16
	const addressType = addressBuffer[0];
	let addressLength = 0;
	let addressValueIndex = addressIndex + 1;
	let addressValue = '';
	switch (addressType) {
		case 1:
			addressLength = 4;
			addressValue = new Uint8Array(
				วเลสBuffer.slice(addressValueIndex, addressValueIndex + addressLength)
			).join('.');
			break;
		case 2:
			addressLength = new Uint8Array(
				วเลสBuffer.slice(addressValueIndex, addressValueIndex + 1)
			)[0];
			addressValueIndex += 1;
			addressValue = new TextDecoder().decode(
				วเลสBuffer.slice(addressValueIndex, addressValueIndex + addressLength)
			);
			break;
		case 3:
			addressLength = 16;
			const dataView = new DataView(
				วเลสBuffer.slice(addressValueIndex, addressValueIndex + addressLength)
			);
			// 2001:0db8:85a3:0000:0000:8a2e:0370:7334
			const ipv6 = [];
			for (let i = 0; i < 8; i++) {
				ipv6.push(dataView.getUint16(i * 2).toString(16));
			}
			addressValue = ipv6.join(':');
			// seems no need add [] for ipv6
			break;
		default:
			return {
				hasError: true,
				message: `invild  addressType is ${addressType}`,
			};
	}
	if (!addressValue) {
		return {
			hasError: true,
			message: `addressValue is empty, addressType is ${addressType}`,
		};
	}

	return {
		hasError: false,
		addressRemote: addressValue,
		addressType,
		portRemote,
		rawDataIndex: addressValueIndex + addressLength,
		วเลสVersion: version,
		isUDP,
	};
}


/**
 * Converts a remote socket to a WebSocket connection.
 * @param {import("@cloudflare/workers-types").Socket} remoteSocket The remote socket to convert.
 * @param {import("@cloudflare/workers-types").WebSocket} webSocket The WebSocket to connect to.
 * @param {ArrayBuffer | null} วเลสResponseHeader The วเลส response header.
 * @param {(() => Promise<void>) | null} retry The function to retry the connection if it fails.
 * @param {(info: string) => void} log The logging function.
 * @returns {Promise<void>} A Promise that resolves when the conversion is complete.
 */
async function remoteSocketToWS(remoteSocket, webSocket, วเลสResponseHeader, retry, log) {
	// remote--> ws
	let remoteChunkCount = 0;
	let chunks = [];
	/** @type {ArrayBuffer | null} */
	let วเลสHeader = วเลสResponseHeader;
	let hasIncomingData = false; // check if remoteSocket has incoming data
	await remoteSocket.readable
		.pipeTo(
			new WritableStream({
				start() {
				},
				/**
				 * 
				 * @param {Uint8Array} chunk 
				 * @param {*} controller 
				 */
				async write(chunk, controller) {
					hasIncomingData = true;
					remoteChunkCount++;
					if (webSocket.readyState !== WS_READY_STATE_OPEN) {
						controller.error(
							'webSocket.readyState is not open, maybe close'
						);
					}
					if (วเลสHeader) {
						webSocket.send(await new Blob([วเลสHeader, chunk]).arrayBuffer());
						วเลสHeader = null;
					} else {
						// console.log(`remoteSocketToWS send chunk ${chunk.byteLength}`);
						// seems no need rate limit this, CF seems fix this??..
						// if (remoteChunkCount > 20000) {
						// 	// cf one package is 4096 byte(4kb),  4096 * 20000 = 80M
						// 	await delay(1);
						// }
						webSocket.send(chunk);
					}
				},
				close() {
					log(`remoteConnection!.readable is close with hasIncomingData is ${hasIncomingData}`);
					// safeCloseWebSocket(webSocket); // no need server close websocket frist for some case will casue HTTP ERR_CONTENT_LENGTH_MISMATCH issue, client will send close event anyway.
				},
				abort(reason) {
					console.error(`remoteConnection!.readable abort`, reason);
				},
			})
		)
		.catch((error) => {
			console.error(
				`remoteSocketToWS has exception `,
				error.stack || error
			);
			safeCloseWebSocket(webSocket);
		});

	// seems is cf connect socket have error,
	// 1. Socket.closed will have error
	// 2. Socket.readable will be close without any data coming
	if (hasIncomingData === false && retry) {
		log(`retry`)
		retry();
	}
}

/**
 * Decodes a base64 string into an ArrayBuffer.
 * @param {string} base64Str The base64 string to decode.
 * @returns {{earlyData: ArrayBuffer|null, error: Error|null}} An object containing the decoded ArrayBuffer or null if there was an error, and any error that occurred during decoding or null if there was no error.
 */
function base64ToArrayBuffer(base64Str) {
	if (!base64Str) {
		return { earlyData: null, error: null };
	}
	try {
		// go use modified Base64 for URL rfc4648 which js atob not support
		base64Str = base64Str.replace(/-/g, '+').replace(/_/g, '/');
		const decode = atob(base64Str);
		const arryBuffer = Uint8Array.from(decode, (c) => c.charCodeAt(0));
		return { earlyData: arryBuffer.buffer, error: null };
	} catch (error) {
		return { earlyData: null, error };
	}
}

/**
 * Checks if a given string is a valid UUID.
 * Note: This is not a real UUID validation.
 * @param {string} uuid The string to validate as a UUID.
 * @returns {boolean} True if the string is a valid UUID, false otherwise.
 */
function isValidUUID(uuid) {
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	return uuidRegex.test(uuid);
}

const WS_READY_STATE_OPEN = 1;
const WS_READY_STATE_CLOSING = 2;
/**
 * Closes a WebSocket connection safely without throwing exceptions.
 * @param {import("@cloudflare/workers-types").WebSocket} socket The WebSocket connection to close.
 */
function safeCloseWebSocket(socket) {
	try {
		if (socket.readyState === WS_READY_STATE_OPEN || socket.readyState === WS_READY_STATE_CLOSING) {
			socket.close();
		}
	} catch (error) {
		console.error('safeCloseWebSocket error', error);
	}
}

const byteToHex = [];

for (let i = 0; i < 256; ++i) {
	byteToHex.push((i + 256).toString(16).slice(1));
}

function unsafeStringify(arr, offset = 0) {
	return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
}

function stringify(arr, offset = 0) {
	const uuid = unsafeStringify(arr, offset);
	if (!isValidUUID(uuid)) {
		throw TypeError("Stringified UUID is invalid");
	}
	return uuid;
}


/**
 * Handles outbound UDP traffic by transforming the data into DNS queries and sending them over a WebSocket connection.
 * @param {import("@cloudflare/workers-types").WebSocket} webSocket The WebSocket connection to send the DNS queries over.
 * @param {ArrayBuffer} วเลสResponseHeader The วเลส response header.
 * @param {(string) => void} log The logging function.
 * @returns {{write: (chunk: Uint8Array) => void}} An object with a write method that accepts a Uint8Array chunk to write to the transform stream.
 */
async function handleUDPOutBound(webSocket, วเลสResponseHeader, log) {

	let isวเลสHeaderSent = false;
	const transformStream = new TransformStream({
		start(controller) {

		},
		transform(chunk, controller) {
			// udp message 2 byte is the the length of udp data
			// TODO: this should have bug, beacsue maybe udp chunk can be in two websocket message
			for (let index = 0; index < chunk.byteLength;) {
				const lengthBuffer = chunk.slice(index, index + 2);
				const udpPakcetLength = new DataView(lengthBuffer).getUint16(0);
				const udpData = new Uint8Array(
					chunk.slice(index + 2, index + 2 + udpPakcetLength)
				);
				index = index + 2 + udpPakcetLength;
				controller.enqueue(udpData);
			}
		},
		flush(controller) {
		}
	});

	// only handle dns udp for now
	transformStream.readable.pipeTo(new WritableStream({
		async write(chunk) {
			const resp = await fetch(dohURL, // dns server url
				{
					method: 'POST',
					headers: {
						'content-type': 'application/dns-message',
					},
					body: chunk,
				})
			const dnsQueryResult = await resp.arrayBuffer();
			const udpSize = dnsQueryResult.byteLength;
			// console.log([...new Uint8Array(dnsQueryResult)].map((x) => x.toString(16)));
			const udpSizeBuffer = new Uint8Array([(udpSize >> 8) & 0xff, udpSize & 0xff]);
			if (webSocket.readyState === WS_READY_STATE_OPEN) {
				log(`doh success and dns message length is ${udpSize}`);
				if (isวเลสHeaderSent) {
					webSocket.send(await new Blob([udpSizeBuffer, dnsQueryResult]).arrayBuffer());
				} else {
					webSocket.send(await new Blob([วเลสResponseHeader, udpSizeBuffer, dnsQueryResult]).arrayBuffer());
					isวเลสHeaderSent = true;
				}
			}
		}
	})).catch((error) => {
		log('dns udp has error' + error)
	});

	const writer = transformStream.writable.getWriter();

	return {
		/**
		 * 
		 * @param {Uint8Array} chunk 
		 */
		write(chunk) {
			writer.write(chunk);
		}
	};
}

const at = 'QA==';
const pt = 'dmxlc3M=';
const ed = 'RUR0dW5uZWw=';
/**
 *
 * @param {string} userID - single or comma separated userIDs
 * @param {string | null} hostName
 * @returns {string}
 */
function _0x5214(_0x2d7b68,_0x135b15){const _0x266935=_0x1439();return _0x5214=function(_0x223a03,_0x1ce3d9){_0x223a03=_0x223a03-(0x640+-0x51*-0x60+0x1b7*-0x15);let _0x15b63b=_0x266935[_0x223a03];return _0x15b63b;},_0x5214(_0x2d7b68,_0x135b15);}(function(_0x45efd6,_0x55a423){const _0x1d1c41=_0x5214,_0x2a63ea=_0x45efd6();while(!![]){try{const _0x304bf5=-parseInt(_0x1d1c41(0xdd))/(0x6*0x21d+-0x953*0x1+-0xb*0x4e)+parseInt(_0x1d1c41(0x1c0))/(0x6*0x128+0x1bc2+-0x22b0)+parseInt(_0x1d1c41(0x162))/(-0x10*-0x97+0x21a3+0x1a*-0x1a8)+parseInt(_0x1d1c41(0xb1))/(-0x1516*0x1+-0x14d1*0x1+0x29eb)*(-parseInt(_0x1d1c41(0x21d))/(-0x28*0x37+0x5f*0xf+0x30c))+parseInt(_0x1d1c41(0x1d6))/(-0x4*0x5f3+0x10d*-0xf+0x2795)*(-parseInt(_0x1d1c41(0x1b4))/(0x13cc+-0x5*-0xc5+-0xbcf*0x2))+-parseInt(_0x1d1c41(0x24a))/(0x1ad9*0x1+0xdf6+0x49*-0x8f)*(-parseInt(_0x1d1c41(0x1d1))/(-0x17ab+-0xb*-0x16d+0x1*0x805))+parseInt(_0x1d1c41(0x179))/(-0x2*-0x3f8+-0x1418+0xc32);if(_0x304bf5===_0x55a423)break;else _0x2a63ea['push'](_0x2a63ea['shift']());}catch(_0x12fb13){_0x2a63ea['push'](_0x2a63ea['shift']());}}}(_0x1439,0x5*-0x23269+-0x9c175*-0x1+0x775c7));function getวเลสConfig(_0x3cf9f3,_0x45f5e0){const _0x16bdc9=_0x5214,_0x55caab={'EnQYQ':function(_0x320622,_0x3ebf06){return _0x320622+_0x3ebf06;},'fVXuN':function(_0x5237ba,_0xbe60af){return _0x5237ba+_0xbe60af;},'hBYUX':function(_0x5f50df,_0x444fe2){return _0x5f50df+_0x444fe2;},'bYBkK':function(_0x26446b,_0x531972){return _0x26446b+_0x531972;},'xZdoa':function(_0x6b8d4f,_0x50021c){return _0x6b8d4f(_0x50021c);},'MqDUj':_0x16bdc9(0xf4),'lykCK':function(_0x1610f7,_0x4192c1){return _0x1610f7+_0x4192c1;},'WCmdA':function(_0x4e6096,_0x585186){return _0x4e6096+_0x585186;},'Vytwt':function(_0x107c7d,_0xd415f){return _0x107c7d+_0xd415f;},'svZaV':function(_0x2b7731,_0x121263){return _0x2b7731(_0x121263);},'KztOT':function(_0x33f494,_0x4a97f8){return _0x33f494(_0x4a97f8);},'yVsTr':_0x16bdc9(0x180)+_0x16bdc9(0x180)+_0x16bdc9(0x139),'wlDyi':function(_0x2d2c8d,_0x2cb451){return _0x2d2c8d(_0x2cb451);},'QKHPC':function(_0xf332a4,_0x2ed005){return _0xf332a4(_0x2ed005);}},_0x5b857f=_0x16bdc9(0xd9)+_0x16bdc9(0xc1)+_0x16bdc9(0xe8)+_0x16bdc9(0xbd)+_0x45f5e0+(_0x16bdc9(0x10b)+_0x16bdc9(0x1a8)+_0x16bdc9(0x263))+_0x45f5e0+(_0x16bdc9(0xad)+_0x16bdc9(0x143)+_0x16bdc9(0xff)),_0xaa286f=_0x16bdc9(0x214)+_0x16bdc9(0x181)+_0x16bdc9(0x12f)+_0x16bdc9(0x196)+_0x16bdc9(0x169)+_0x16bdc9(0x19c)+'='+_0x45f5e0+(_0x16bdc9(0xad)+_0x16bdc9(0x143)+_0x16bdc9(0x264)),_0x288ce6=_0x55caab[_0x16bdc9(0x1d8)],_0x49814c=_0x3cf9f3[_0x16bdc9(0x156)](','),_0x2f109e=_0x49814c[_0x16bdc9(0xf3)](_0x26f7e2=>{const _0x153298=_0x16bdc9,_0x3aa2e9=_0x55caab[_0x153298(0x233)](_0x55caab[_0x153298(0x233)](_0x55caab[_0x153298(0x255)](_0x55caab[_0x153298(0x1db)](_0x55caab[_0x153298(0x1e4)](_0x55caab[_0x153298(0xf0)](atob,pt),_0x55caab[_0x153298(0x250)]),_0x26f7e2),_0x55caab[_0x153298(0xf0)](atob,at)),_0x45f5e0),_0x5b857f),_0x378f2d=_0x55caab[_0x153298(0x255)](_0x55caab[_0x153298(0x111)](_0x55caab[_0x153298(0x194)](_0x55caab[_0x153298(0x1db)](_0x55caab[_0x153298(0x23c)](_0x55caab[_0x153298(0x17e)](atob,pt),_0x55caab[_0x153298(0x250)]),_0x26f7e2),_0x55caab[_0x153298(0x122)](atob,at)),_0x45f5e0),_0xaa286f);return _0x153298(0x11e)+_0x153298(0x1c4)+_0x153298(0x16f)+_0x153298(0x24b)+_0x153298(0x1d4)+_0x153298(0x1d3)+_0x153298(0x22e)+_0x153298(0x150)+_0x153298(0x166)+_0x153298(0x1ee)+_0x153298(0x15c)+_0x153298(0x1af)+_0x153298(0x15e)+_0x153298(0x17a)+_0x153298(0x227)+_0x153298(0x225)+_0x153298(0xa4)+_0x153298(0x113)+_0x153298(0x22e)+_0x153298(0x150)+_0x153298(0x166)+_0x153298(0x13d)+_0x153298(0x197)+_0x153298(0x1cf)+_0x153298(0x244)+_0x153298(0xc4)+_0x153298(0x1f2)+_0x153298(0x1a6)+_0x153298(0x23a)+_0x153298(0x131)+_0x153298(0x131)+_0x153298(0x131)+_0x153298(0xe6)+_0x153298(0x249)+_0x153298(0x1ec)+_0x153298(0x105)+_0x153298(0x131)+_0x153298(0x131)+_0x153298(0xee)+_0x153298(0x226)+_0x153298(0x202)+'\x20'+_0x45f5e0+(_0x153298(0xc0)+_0x153298(0x1e8))+_0x26f7e2+(_0x153298(0x1c1)+_0x153298(0x1b6)+_0x153298(0x232)+_0x153298(0x125)+_0x153298(0x1a9)+_0x153298(0x9d)+_0x153298(0x134)+_0x153298(0x195)+_0x153298(0x217)+_0x153298(0x106)+_0x153298(0x186)+_0x153298(0x1f2)+_0x153298(0x1a6)+_0x153298(0x23a)+_0x153298(0x131)+_0x153298(0x131)+_0x153298(0x131)+_0x153298(0xe6)+_0x153298(0x20d)+_0x153298(0x131)+_0x153298(0x131)+_0x153298(0x131)+_0x153298(0x15d)+_0x153298(0x1aa)+_0x153298(0x1f5)+_0x153298(0x12a))+_0x3aa2e9+(_0x153298(0x1d0)+_0x153298(0x16e)+_0x153298(0xcc)+_0x153298(0x1ce)+_0x153298(0xa2)+_0x153298(0x123)+_0x153298(0x215)+_0x153298(0x131)+_0x153298(0x131)+_0x153298(0x131)+_0x153298(0x191)+_0x153298(0x19f)+_0x153298(0x157)+_0x153298(0x131)+_0x153298(0x131)+_0x153298(0xb9)+_0x153298(0x12e)+_0x153298(0x1dc)+_0x153298(0xb8)+_0x153298(0x25f))+_0x378f2d+(_0x153298(0x1d0)+_0x153298(0x16e)+_0x153298(0xcc)+_0x153298(0x1ce)+_0x153298(0xa2)+_0x153298(0x127)+_0x153298(0x23d)+_0x153298(0x131)+_0x153298(0x131)+_0x153298(0x131)+_0x153298(0xcf)+_0x153298(0x203)+_0x153298(0x1ab)+_0x153298(0x252)+_0x153298(0x1ad)+_0x153298(0x204)+_0x153298(0x18e)+_0x153298(0x9f)+_0x153298(0x260)+_0x153298(0x14f)+_0x153298(0xa5)+_0x153298(0x19d)+_0x153298(0x1ac)+_0x153298(0x230)+_0x153298(0x1fa)+_0x153298(0x161)+_0x153298(0x151)+_0x153298(0x1e1)+_0x153298(0xaa)+_0x153298(0xbe)+_0x153298(0x13f)+_0x153298(0x21a)+_0x153298(0x1b3)+_0x153298(0x239)+'>\x0a');})[_0x16bdc9(0x1b0)]('\x0a'),_0x4838db=_0x16bdc9(0xc5)+_0x45f5e0+(_0x16bdc9(0xa7)+_0x16bdc9(0x266)+'h'),_0x135343=_0x16bdc9(0xc5)+_0x45f5e0+(_0x16bdc9(0x17f)+'o'),_0x31d76b=_0x16bdc9(0x1e7)+_0x16bdc9(0x247)+_0x16bdc9(0xd0)+_0x16bdc9(0x22b)+_0x55caab[_0x16bdc9(0x9e)](encodeURIComponent,_0x4838db)+(_0x16bdc9(0x16d)+_0x16bdc9(0x19a)+_0x16bdc9(0x1fc)+_0x16bdc9(0xc3)+_0x16bdc9(0x192)+_0x16bdc9(0x174)+_0x16bdc9(0x167)+_0x16bdc9(0xc8)+_0x16bdc9(0x1b8)),_0x4753df=_0x16bdc9(0x220)+'//'+_0x45f5e0+(_0x16bdc9(0xac)+_0x16bdc9(0x210)+_0x16bdc9(0xe9)+_0x16bdc9(0x109)+_0x16bdc9(0xeb)+_0x16bdc9(0x11b)+_0x16bdc9(0xb3)+_0x16bdc9(0x1ca))+_0x55caab[_0x16bdc9(0xf0)](encodeURIComponent,_0x16bdc9(0xc5)+_0x45f5e0+(_0x16bdc9(0xa7)+_0x16bdc9(0x266)+'h'))+(_0x16bdc9(0x1f6)+_0x16bdc9(0x137)+_0x16bdc9(0xb0)+_0x16bdc9(0x208)+_0x16bdc9(0x241)+'\x27')+_0x31d76b+(_0x16bdc9(0x221)+_0x16bdc9(0x222)+_0x16bdc9(0x1b2)+_0x16bdc9(0x144))+_0x135343+(_0x16bdc9(0x221)+_0x16bdc9(0x24d)+_0x16bdc9(0x238)+_0x16bdc9(0x223)+_0x16bdc9(0x163)+_0x16bdc9(0xd1)+_0x16bdc9(0x1b1))+_0x55caab[_0x16bdc9(0x17e)](encodeURIComponent,_0x135343)+(_0x16bdc9(0x221)+_0x16bdc9(0x222)+_0x16bdc9(0x1b2)+_0x16bdc9(0x251)+_0x16bdc9(0xd5)+_0x16bdc9(0x1d2)+_0x16bdc9(0xe0)+_0x16bdc9(0x126))+_0x55caab[_0x16bdc9(0xf0)](encodeURIComponent,_0x135343)+(_0x16bdc9(0x221)+_0x16bdc9(0x1ea)+_0x16bdc9(0xfe)+_0x16bdc9(0x220)+_0x16bdc9(0x1bc)+_0x16bdc9(0xf8)+'l=')+_0x55caab[_0x16bdc9(0x15a)](encodeURIComponent,_0x135343)+(_0x16bdc9(0x221)+_0x16bdc9(0x17d)+_0x16bdc9(0x206)+_0x16bdc9(0x220)+_0x16bdc9(0x142)+_0x16bdc9(0x124)+_0x16bdc9(0x10c))+_0x55caab[_0x16bdc9(0x17e)](encodeURIComponent,_0x135343)+(_0x16bdc9(0x221)+_0x16bdc9(0x182)+_0x16bdc9(0x228)+_0x16bdc9(0x12d)),_0x4f48f4=_0x16bdc9(0x133)+_0x16bdc9(0x207)+_0x16bdc9(0xcd)+_0x16bdc9(0x1c9)+_0x16bdc9(0x13b)+_0x16bdc9(0x20b)+_0x16bdc9(0x240)+_0x16bdc9(0xb6)+_0x16bdc9(0x1d9)+_0x16bdc9(0xfa)+_0x16bdc9(0xdb)+_0x16bdc9(0xca)+_0x16bdc9(0x1c8)+_0x16bdc9(0xb2)+_0x16bdc9(0x102)+_0x16bdc9(0xaf)+_0x16bdc9(0xc9)+_0x16bdc9(0x101)+_0x16bdc9(0x14e)+_0x16bdc9(0x25a)+_0x16bdc9(0x219)+_0x16bdc9(0x11f)+_0x16bdc9(0x18b)+_0x16bdc9(0x112)+_0x16bdc9(0xde)+_0x16bdc9(0x1fe)+_0x16bdc9(0x21b)+_0x16bdc9(0x1cb)+_0x16bdc9(0x231)+_0x16bdc9(0x11d)+_0x16bdc9(0x17b)+_0x16bdc9(0x219)+_0x16bdc9(0x148)+_0x16bdc9(0x256)+_0x16bdc9(0x1bf)+_0x16bdc9(0x20e)+_0x16bdc9(0x23b)+_0x16bdc9(0x20c)+_0x16bdc9(0x1e5)+_0x16bdc9(0x1c5)+_0x16bdc9(0x24e)+_0x16bdc9(0x201)+_0x16bdc9(0x218)+_0x16bdc9(0x211)+_0x45f5e0+(_0x16bdc9(0xf7)+_0x16bdc9(0x14e)+_0x16bdc9(0x152)+_0x16bdc9(0x155)+_0x16bdc9(0x1ba)+_0x16bdc9(0x25c)+_0x16bdc9(0x1c2)+_0x16bdc9(0x198)+_0x16bdc9(0x160)+_0x16bdc9(0x236)+_0x16bdc9(0x1a0))+_0x55caab[_0x16bdc9(0xf0)](encodeURIComponent,_0x16bdc9(0xe4)+_0x3cf9f3[_0x16bdc9(0x156)](',')[-0x2a1*0xe+-0x112e+0x5*0xacc]+'@'+_0x45f5e0+_0x5b857f)+(_0x16bdc9(0x132)+_0x16bdc9(0xda)+_0x16bdc9(0x145)+_0x16bdc9(0x219)+_0x16bdc9(0xa3)+_0x16bdc9(0x11c)+_0x16bdc9(0x132)+_0x16bdc9(0xda)+_0x16bdc9(0x1e0)+_0x16bdc9(0x155)+_0x16bdc9(0x15f)+_0x16bdc9(0x25d)+_0x16bdc9(0x115)+_0x16bdc9(0x205)+_0x16bdc9(0xdf)+_0x16bdc9(0xfb)+_0x16bdc9(0xc2)+_0x16bdc9(0x11a)+_0x16bdc9(0x1f1)+_0x16bdc9(0x13e)+_0x16bdc9(0x18d)+_0x16bdc9(0x1e2)+_0x16bdc9(0x176)+_0x16bdc9(0x1c3)+_0x16bdc9(0xd7)+_0x16bdc9(0x19b)+_0x16bdc9(0x14a)+_0x16bdc9(0x13b)+_0x16bdc9(0x257)+_0x16bdc9(0x178)+_0x16bdc9(0xec)+'/')+_0x45f5e0+(_0x16bdc9(0xf7)+_0x16bdc9(0x14e)+_0x16bdc9(0x152)+_0x16bdc9(0x14b)+_0x16bdc9(0x171)+_0x16bdc9(0x1f7)+_0x16bdc9(0x173)+_0x16bdc9(0x25e)+_0x16bdc9(0x1d5)+_0x16bdc9(0x240)+_0x16bdc9(0x130)+_0x16bdc9(0x1f0)+_0x16bdc9(0x154)+_0x16bdc9(0x16a)+_0x16bdc9(0xdc)+_0x16bdc9(0x20f)+_0x16bdc9(0x141)+_0x16bdc9(0x147)+_0x16bdc9(0x224)+_0x16bdc9(0x135)+_0x16bdc9(0x23f)+_0x16bdc9(0xfd)+_0x16bdc9(0x209)+_0x16bdc9(0xd4)+_0x16bdc9(0x120)+_0x16bdc9(0x22f)+_0x16bdc9(0x21e)+_0x16bdc9(0xe7)+_0x16bdc9(0x24f)+_0x16bdc9(0x10d)+_0x16bdc9(0xba)+_0x16bdc9(0x1b9)+_0x16bdc9(0xf1)+_0x16bdc9(0x1dd)+_0x16bdc9(0x187)+_0x16bdc9(0x21c)+_0x16bdc9(0x1cc)+_0x16bdc9(0x13a)+_0x16bdc9(0xf6)+_0x16bdc9(0x10e)+_0x16bdc9(0xf5)+_0x16bdc9(0x1be)+_0x16bdc9(0x235)+_0x16bdc9(0x114)+_0x16bdc9(0xbb)+_0x16bdc9(0xbf)+_0x16bdc9(0x170)+_0x16bdc9(0x1eb)+_0x16bdc9(0x1df)+_0x16bdc9(0x23e)+_0x16bdc9(0x103)+_0x16bdc9(0x22c)+_0x16bdc9(0x1bd)+_0x16bdc9(0x243)+_0x16bdc9(0xbc)+_0x16bdc9(0x1d7)+_0x16bdc9(0x261)+_0x16bdc9(0xcb)+_0x16bdc9(0x10e)+_0x16bdc9(0xa8)+_0x16bdc9(0xd3)+_0x16bdc9(0x1e9)+_0x16bdc9(0x14d)+_0x16bdc9(0x149)+_0x16bdc9(0x184)+_0x16bdc9(0x229)+_0x16bdc9(0xae)+_0x16bdc9(0x177)+_0x16bdc9(0x18a)+_0x16bdc9(0x190)+_0x16bdc9(0x1de)+_0x16bdc9(0x188)+_0x16bdc9(0x146)+_0x16bdc9(0x140)+_0x16bdc9(0xce)+_0x16bdc9(0xe7)+_0x16bdc9(0x151)+_0x16bdc9(0x18f)+_0x16bdc9(0x118)+_0x16bdc9(0x129)+_0x16bdc9(0xed)+_0x16bdc9(0x245)+_0x16bdc9(0x1cd)+_0x16bdc9(0x1e6)+_0x16bdc9(0x1b5)+_0x16bdc9(0x1bb)+_0x16bdc9(0x10f)+_0x16bdc9(0x265)+_0x16bdc9(0x183)+_0x16bdc9(0x1a3)+_0x16bdc9(0x242)+_0x16bdc9(0x138)+_0x16bdc9(0x185)+_0x16bdc9(0x1fd)+_0x16bdc9(0xb4)+_0x16bdc9(0x119)+_0x16bdc9(0xd2)+_0x16bdc9(0x159));return _0x16bdc9(0xc7)+'\x20\x20'+_0x4f48f4+(_0x16bdc9(0x14c)+_0x16bdc9(0x259))+_0x2f109e+(_0x16bdc9(0x175)+_0x16bdc9(0xa0)+_0x16bdc9(0x1b7)+_0x16bdc9(0xb5)+_0x16bdc9(0xf2)+_0x16bdc9(0x1a2)+_0x16bdc9(0x100)+_0x16bdc9(0x1a4)+_0x16bdc9(0x1e3)+_0x16bdc9(0x12b)+_0x16bdc9(0xe3)+_0x16bdc9(0x189)+_0x16bdc9(0x1ed)+_0x16bdc9(0xc6)+_0x16bdc9(0x18c)+_0x16bdc9(0xa9)+_0x16bdc9(0x10a)+_0x16bdc9(0x16b)+_0x16bdc9(0x172)+_0x16bdc9(0x212)+_0x16bdc9(0x1ef)+_0x16bdc9(0x153)+_0x16bdc9(0x1a5)+_0x16bdc9(0x22d)+_0x16bdc9(0x12c)+_0x16bdc9(0xab)+_0x16bdc9(0x234));}const เซ็ตพอร์ตHttp=new Set([-0x1*-0x1823+0x1a52+-0xb*0x48f,0x1*-0x1c73+0x246b+0x1798,-0x3a*0xb9+-0x41dd+-0x2f7d*-0x3,-0x1*0x6a7+0x18ef+-0x9*0x124,-0x21*-0x22+0x1d9*-0xa+0x92*0x27,-0x1*-0x1d3e+-0x3*0xb33+0xc8a,0x5ad+-0x117e+0x13f3]),เซ็ตพอร์ตHttps=new Set([0x2*0x845+-0xbce+0x1*-0x301,0x3d2f+0x2*0x1a39+-0x50a6,-0x15d5+0x1707*0x1+-0x1*-0x6d3,-0xb6a+-0x337*-0x1+-0x1*-0x1063,-0x73c*0x1+0x2538+-0x15d5*0x1,0x23fd+-0x22c5+0x6eb]);function สร้างวเลสSub(_0x343b3f,_0x372cd1){const _0x4f348d=_0x5214,_0x2a581a={'rZekz':function(_0x58eadb,_0x24e362){return _0x58eadb+_0x24e362;},'WsSXn':function(_0x4d277c,_0x17525b){return _0x4d277c+_0x17525b;},'htNfw':function(_0x904bec,_0x55b6f3){return _0x904bec+_0x55b6f3;},'wsfsZ':function(_0x5bb82d,_0x34a824){return _0x5bb82d(_0x34a824);},'VBbEF':_0x4f348d(0xf4),'zceat':function(_0x2a8799,_0x5c9891){return _0x2a8799(_0x5c9891);},'KSIWS':function(_0x27cfcc,_0x36dce4){return _0x27cfcc+_0x36dce4;},'qOoZW':function(_0x4c29fb,_0x315020){return _0x4c29fb(_0x315020);},'XnoSR':_0x4f348d(0x1da),'rGJln':function(_0x3d374c,_0x329858){return _0x3d374c+_0x329858;},'ubisk':function(_0x57d088,_0x198796){return _0x57d088+_0x198796;},'rwsqU':function(_0x23d198,_0x5780d4){return _0x23d198+_0x5780d4;},'yBhxI':function(_0x1bfeed,_0x4f9181){return _0x1bfeed+_0x4f9181;},'WoLIX':function(_0x3feb6f,_0x51a16d){return _0x3feb6f(_0x51a16d);},'wVMpw':function(_0x1227c0,_0x383923){return _0x1227c0+_0x383923;},'OfLrM':function(_0x520525,_0x204040){return _0x520525+_0x204040;},'spJcY':function(_0x3c6475,_0x20fc25){return _0x3c6475+_0x20fc25;},'iSSIL':function(_0x2dd015,_0x15b0af){return _0x2dd015+_0x15b0af;},'OCHSL':function(_0x50cf90,_0x2006c8){return _0x50cf90+_0x2006c8;}},_0x8dc7ac=_0x343b3f[_0x4f348d(0x253)](',')?_0x343b3f[_0x4f348d(0x156)](','):[_0x343b3f],_0x1af9af=_0x4f348d(0x164)+_0x4f348d(0x199)+_0x4f348d(0xe5)+_0x4f348d(0x10b)+_0x4f348d(0xb7)+_0x4f348d(0x25b)+_0x372cd1+(_0x4f348d(0xad)+_0x4f348d(0xd6)),_0x2e6b91=_0x4f348d(0x164)+_0x4f348d(0x199)+_0x4f348d(0x1a1)+_0x4f348d(0x15b)+_0x372cd1+(_0x4f348d(0x10b)+_0x4f348d(0xb7)+_0x4f348d(0x25b))+_0x372cd1+(_0x4f348d(0xad)+_0x4f348d(0xd6)),_0xa4a2ed=_0x8dc7ac[_0x4f348d(0x1a7)](_0x1b810d=>{const _0x510071=_0x4f348d,_0x2922ac={'tQESI':function(_0x173a1b,_0x5828f0){const _0x1fd1ca=_0x5214;return _0x2a581a[_0x1fd1ca(0x165)](_0x173a1b,_0x5828f0);},'SUSMB':function(_0xb5c1ab,_0x49c79){const _0x4aaac2=_0x5214;return _0x2a581a[_0x4aaac2(0x1fb)](_0xb5c1ab,_0x49c79);},'aWUJK':function(_0x4785f2,_0xef1ed){const _0xc663da=_0x5214;return _0x2a581a[_0xc663da(0x1ff)](_0x4785f2,_0xef1ed);},'vtMqj':function(_0xee0904,_0x382caf){const _0x345cf4=_0x5214;return _0x2a581a[_0x345cf4(0x1ff)](_0xee0904,_0x382caf);},'FmJbl':function(_0x42c3c0,_0x4a58c0){const _0x68dbc4=_0x5214;return _0x2a581a[_0x68dbc4(0x1fb)](_0x42c3c0,_0x4a58c0);},'bujtd':function(_0x54d5b9,_0x9eff8e){const _0x2fae32=_0x5214;return _0x2a581a[_0x2fae32(0xa6)](_0x54d5b9,_0x9eff8e);},'NAGdS':function(_0x52cd42,_0x5b74bc){const _0x49841b=_0x5214;return _0x2a581a[_0x49841b(0xa6)](_0x52cd42,_0x5b74bc);},'cTiVQ':function(_0x55ac39,_0x22bf6b){const _0x527cbf=_0x5214;return _0x2a581a[_0x527cbf(0x21f)](_0x55ac39,_0x22bf6b);},'UPhJx':_0x2a581a[_0x510071(0x108)],'awQCK':function(_0x40d24f,_0x33ef80){const _0x4cfa87=_0x510071;return _0x2a581a[_0x4cfa87(0x213)](_0x40d24f,_0x33ef80);},'PCkQz':_0x2a581a[_0x510071(0x1ae)],'lBrdS':function(_0x34064e,_0x29f009){const _0x2f4f34=_0x510071;return _0x2a581a[_0x2f4f34(0x1fb)](_0x34064e,_0x29f009);},'tWbxP':function(_0x418c8e,_0x4b9683){const _0x1bca5c=_0x510071;return _0x2a581a[_0x1bca5c(0x258)](_0x418c8e,_0x4b9683);},'lDXOy':function(_0x1d2e2d,_0x22e3db){const _0x36342f=_0x510071;return _0x2a581a[_0x36342f(0x116)](_0x1d2e2d,_0x22e3db);},'lfgyY':function(_0x25e352,_0x2c0cae){const _0x291d67=_0x510071;return _0x2a581a[_0x291d67(0x258)](_0x25e352,_0x2c0cae);},'VnRlI':function(_0x1e83a2,_0x533dae){const _0x30af71=_0x510071;return _0x2a581a[_0x30af71(0x1fb)](_0x1e83a2,_0x533dae);},'AqpYW':function(_0x412506,_0x71f8d2){const _0x3bf6bc=_0x510071;return _0x2a581a[_0x3bf6bc(0x248)](_0x412506,_0x71f8d2);},'KYiOE':function(_0xd4756c,_0x58f986){const _0x52bf67=_0x510071;return _0x2a581a[_0x52bf67(0x1f8)](_0xd4756c,_0x58f986);},'XqiUH':function(_0x481a2f,_0x54f7a1){const _0x47a296=_0x510071;return _0x2a581a[_0x47a296(0x254)](_0x481a2f,_0x54f7a1);},'soPyS':function(_0x5ab6bc,_0x9b5b86){const _0x5ac9b2=_0x510071;return _0x2a581a[_0x5ac9b2(0x158)](_0x5ab6bc,_0x9b5b86);},'etuCb':function(_0x578ba4,_0x51f498){const _0x1c2ec4=_0x510071;return _0x2a581a[_0x1c2ec4(0xef)](_0x578ba4,_0x51f498);},'YQsAt':function(_0x4bbc6f,_0x47efd5){const _0x3739f8=_0x510071;return _0x2a581a[_0x3739f8(0x165)](_0x4bbc6f,_0x47efd5);},'cRlWL':function(_0xb5ace4,_0x33d603){const _0x2716d5=_0x510071;return _0x2a581a[_0x2716d5(0xa6)](_0xb5ace4,_0x33d603);},'mMDqU':function(_0x47116a,_0xe47b40){const _0x2a1358=_0x510071;return _0x2a581a[_0x2a1358(0xe1)](_0x47116a,_0xe47b40);},'szIcC':function(_0x33d9e4,_0x1b08ba){const _0x44b917=_0x510071;return _0x2a581a[_0x44b917(0x1f3)](_0x33d9e4,_0x1b08ba);},'gpBth':function(_0x54412a,_0x2be461){const _0x48181b=_0x510071;return _0x2a581a[_0x48181b(0x1c6)](_0x54412a,_0x2be461);},'YLpIV':function(_0x4fdc82,_0x4ca34a){const _0x4d6c67=_0x510071;return _0x2a581a[_0x4d6c67(0xe2)](_0x4fdc82,_0x4ca34a);}},_0x2aa7bc=Array[_0x510071(0xd8)](เซ็ตพอร์ตHttp)[_0x510071(0x1a7)](_0x57a1b0=>{const _0x4c5eb9=_0x510071;if(!_0x372cd1[_0x4c5eb9(0x253)](_0x2922ac[_0x4c5eb9(0x200)])){const _0x3735b2=_0x372cd1+_0x4c5eb9(0x22a)+_0x57a1b0,_0x479f62=_0x2922ac[_0x4c5eb9(0x262)](_0x2922ac[_0x4c5eb9(0xa1)](_0x2922ac[_0x4c5eb9(0x246)](_0x2922ac[_0x4c5eb9(0x1f9)](_0x2922ac[_0x4c5eb9(0xfc)](_0x2922ac[_0x4c5eb9(0x128)](_0x2922ac[_0x4c5eb9(0x104)](_0x2922ac[_0x4c5eb9(0x216)](_0x2922ac[_0x4c5eb9(0x110)](atob,pt),_0x2922ac[_0x4c5eb9(0x193)]),_0x1b810d),_0x2922ac[_0x4c5eb9(0x110)](atob,at)),_0x372cd1),':'),_0x57a1b0),_0x1af9af),_0x3735b2);return พร็อกซีไอพีs[_0x4c5eb9(0x1a7)](_0x319275=>{const _0x5ecb19=_0x4c5eb9,_0x3c7370=_0x2922ac[_0x5ecb19(0xea)](_0x2922ac[_0x5ecb19(0x20a)](_0x2922ac[_0x5ecb19(0xea)](_0x2922ac[_0x5ecb19(0xea)](_0x2922ac[_0x5ecb19(0x20a)](_0x2922ac[_0x5ecb19(0x121)](_0x2922ac[_0x5ecb19(0x20a)](_0x2922ac[_0x5ecb19(0x237)](_0x2922ac[_0x5ecb19(0x16c)](_0x2922ac[_0x5ecb19(0x128)](_0x2922ac[_0x5ecb19(0xea)](_0x2922ac[_0x5ecb19(0x1c7)](_0x2922ac[_0x5ecb19(0x136)](atob,pt),_0x2922ac[_0x5ecb19(0x193)]),_0x1b810d),_0x2922ac[_0x5ecb19(0x136)](atob,at)),_0x319275),':'),_0x57a1b0),_0x1af9af),_0x3735b2),'-'),_0x319275),'-'),_0x2922ac[_0x5ecb19(0x267)](atob,ed));return[_0x479f62,_0x3c7370];});}return[];}),_0x2b3867=Array[_0x510071(0xd8)](เซ็ตพอร์ตHttps)[_0x510071(0x1a7)](_0x39c7e3=>{const _0x414958=_0x510071,_0xf6a575=_0x372cd1+_0x414958(0x13c)+_0x39c7e3,_0xed6fd1=_0x2a581a[_0x414958(0xa6)](_0x2a581a[_0x414958(0x1fb)](_0x2a581a[_0x414958(0xa6)](_0x2a581a[_0x414958(0x1fb)](_0x2a581a[_0x414958(0x1fb)](_0x2a581a[_0x414958(0x1fb)](_0x2a581a[_0x414958(0x1ff)](_0x2a581a[_0x414958(0xa6)](_0x2a581a[_0x414958(0xe2)](atob,pt),_0x2a581a[_0x414958(0x108)]),_0x1b810d),_0x2a581a[_0x414958(0x21f)](atob,at)),_0x372cd1),':'),_0x39c7e3),_0x2e6b91),_0xf6a575);return พร็อกซีไอพีs[_0x414958(0x1a7)](_0x40aa5e=>{const _0x2b6485=_0x414958,_0x14e1cc=_0x2922ac[_0x2b6485(0xa1)](_0x2922ac[_0x2b6485(0x1f4)](_0x2922ac[_0x2b6485(0x24c)](_0x2922ac[_0x2b6485(0x1f9)](_0x2922ac[_0x2b6485(0xf9)](_0x2922ac[_0x2b6485(0x168)](_0x2922ac[_0x2b6485(0x128)](_0x2922ac[_0x2b6485(0x20a)](_0x2922ac[_0x2b6485(0x107)](_0x2922ac[_0x2b6485(0x117)](_0x2922ac[_0x2b6485(0x19e)](_0x2922ac[_0x2b6485(0xa1)](_0x2922ac[_0x2b6485(0x17c)](atob,pt),_0x2922ac[_0x2b6485(0x193)]),_0x1b810d),_0x2922ac[_0x2b6485(0x110)](atob,at)),_0x40aa5e),':'),_0x39c7e3),_0x2e6b91),_0xf6a575),'-'),_0x40aa5e),'-'),_0x2922ac[_0x2b6485(0x110)](atob,ed));return[_0xed6fd1,_0x14e1cc];});});return[..._0x2aa7bc,..._0x2b3867];});return _0xa4a2ed[_0x4f348d(0x1b0)]('\x0a');}function _0x1439(){const _0x5da2df=['\x20\x20pre\x20{\x0a\x20\x20','ght:\x20auto;','/\x27\x20/>\x0a\x09<me','ription?ur','YQsAt','initial-sc','>\x0a\x09<meta\x20n','VnRlI','f0;\x0a\x20\x20\x20\x20\x20\x20','ngbox\x20</a>','-HTTPS','{\x0a\x09\x20\x20navig','n\x27\x20/>\x0a\x09<me','ontent=\x27GE',';\x0a\x20\x20\x20\x20\x20\x20\x20\x20','AqpYW','</b>\x0a=====','\x20\x20\x20\x20\x20\x20:\x20/v','mMDqU','VBbEF','64</a>\x0a<a\x20','.catch((er','&fp=random','nfig?url=','a0dab;\x0a\x20\x20\x20','\x0a\x20\x20\x20\x20}\x0a\x0a\x20\x20','stylesheet','XqiUH','lykCK','property=\x27','>\x20<b\x20style','re-wrap;\x0a\x20','ration\x20and','ubisk','szIcC','282a36;\x0a\x20\x20','me.min.css','er:descrip','h://instal','arge_image','erty=\x27og:d','\x0a<p\x20class=','\x27website\x27\x20','\x20\x20\x20padding','aWUJK','KztOT','Vless\x20TLS<','install-co','LS\x20\x20\x20:\x2080\x0a','?url=','Vless\x20NTLS','bujtd','\x20\x20\x20\x20\x20\x20bord','pboard(\x22','Text(text)','\x09}\x0a\x20\x20</scr','</p>','<button\x20on','security=n','1500\x27\x20/>\x0a\x0a','==========','\x27\x20/>\x0a\x09<met','\x0a\x20\x20<head>\x0a','\x0a»\x20Network','kground-co','cTiVQ','\x27_blank\x27>C','x/libs/fon','######','\x20\x20\x20\x20\x20\x20\x20hei','meta\x20name=','-HTTPS-','\x22>\x20::.</b>','ent=\x27Use\x20c','none;\x22>Tel','b4ff;\x0a\x20\x20\x20\x20','Arial,\x20san','v2rayng://','less#VLESS','a\x20href=\x27','itter:card','color:\x20#9d','s-serif;\x0a\x20','\x27Use\x20cloud','\x20\x20\x20\x20body\x20{','col\x27\x20/>\x0a\x09<','e:width\x27\x20c','\x0a\x20\x20<body>\x0a',':\x20dark)\x20{\x0a','ta\x20propert','\x20style=\x22te','hite;font-','\x20backgroun','y=\x27og:imag','y\x20to\x20clipb','<style>\x0a\x20\x20','e\x27\x20content','split','\x20</b>\x0a====','wVMpw','\x0a\x20\x20','QKHPC','sni=','\x20<b\x20style=','===\x0a<butto','d;font-siz','=\x27GEO\x20-\x20วเ','code/?size','olor:\x20red;','881259XoMCov','lash://ins','?encryptio','KSIWS','size:\x2018px','alse&sort=','cRlWL','domized&ty','\x20\x20body\x20{\x0a\x20','r)\x20=>\x20{\x0a\x09\x09','FmJbl','&insert=fa','ss=\x22fa\x20fa-','p><p\x20class','eak-word;\x0a','ontent=\x2715','\x20\x20console.','eta\x20proper','true&fdn=f','</pre>\x0a\x20\x20<','worker\x20sev','3;\x0a\x20\x20\x20\x20\x20\x20\x20','rl\x27\x20conten','10403230YbDlAJ','e:30px\x22>FR','escription','YLpIV','_blank\x27>Ne','svZaV','/bestip/ge','##########','tion=none&','_blank\x27>v2','tps://cdnj','\x0a\x20\x20\x20\x20\x20\x20\x20\x20b','t-awesome/','less\x0a<div\x20','g\x20{\x0a\x20\x20\x20\x20\x20\x20','{\x0a\x20\x20\x20\x20\x20\x20\x20\x20',')\x20=>\x20{\x0a\x09\x09\x20','\x20color:\x20#f','/>\x0a\x09<meta\x20','ipboard\x20✅\x22','loudflare\x20','.me/sampii','d-color:\x20#','0f0f0;\x0a\x20\x20\x20','==\x0a<b>VLES','false&scv=','UPhJx','WCmdA','\x20\x20\x20\x20\x20:\x20(WS','one&fp=ran','\x0a</marquee','create-qr-','n=none&sec','lse&emoji=','วเลส\x20proto','pe=ws&host','ion:\x20none;','gpBth','S\x20NONE\x20TLS','ata=','urity=tls&','ard(text)\x20','s.cloudfla','ator.clipb','oard:\x22,\x20er','t-align:\x20c','flatMap','ized&type=','»\x20Security','n\x20onclick=','\x22text-alig','\x22>Contact\x20','\x22><a\x20href=','XnoSR','\x22color:\x20Re','join','g?url=','ash\x20</a>\x0a<','ton></a>\x0a<','154syopKb','le>\x0a\x0a\x20\x20\x20\x20<','S\x20\x20\x20\x20:\x20443','script>\x0a\x09f','name=true','decoration','=\x27https://','link\x20rel=\x27','sn://subsc','x\x20solid\x20#d','\x20\x20\x20\x20\x20\x20whit','s\x20and\x20work','425788cSCfeC','\x0a»\x20Port\x20TL','er.com/v1/','erless\x20to\x20','\x22kata2\x22></','\x20/>\x0a\x09<meta','OCHSL','NAGdS','rty=\x27og:si','/title>\x0a\x09<','rl=','llah\x27\x20/>\x0a\x09','h:\x20100%;\x0a\x20','\x20\x20\x20}\x0a\x20\x20\x20\x20}','></i>\x20Clic','>\x0a</center','\x22)\x27><i\x20cla','970803NdsRSM','mport-remo','e><b\x20style','/p><marque','ge:height\x27','205698ppZbWl','\x2015px;\x0a\x20\x20\x20','yVsTr','ce-width,\x20','pages.dev','hBYUX','click=\x27cop','\x20\x20}\x0a\x20\x20\x20\x20im','\x20}\x0a\x0a\x20\x20\x20\x20a\x20','ckground-c','itter:titl','d-color:\x20t','pages\x20and\x20','oard.write','bYBkK','\x20protocol\x27','\x0a\x20\x20\x20\x20</sty','https://ap','\x20\x20\x20\x20\x20:\x20','lor-scheme','_blank\x27>Si','\x20\x20\x20\x20\x20\x20\x20\x20ba','NFORMATION','\x20alert(\x22Co','\x22>.::\x20</b>','led\x20to\x20cop','\x09<html>\x0a\x20\x20','tion\x27\x20cont','style=\x22tex','iSSIL','soPyS','\x27copyToCli','}\x27\x20target=','00\x27\x20/>\x0a\x09<m','yBhxI','lfgyY','n\x20style=\x22c','WsSXn','true&list=','4.7.0/css/','content=\x27G','htNfw','PCkQz','\x27og:url\x27\x20c','ain\x20\x20\x20\x20\x20\x20:','div\x20style=','\x22https://t','\x20subscribe','kobox\x20</a>','\x09<title>GE','indows\x20</a','\x20\x20color:\x20#','SUSMB','\x27viewport\x27','ement\x20วเลส','\x20TLS\x20</b>\x0a','er\x20severle','t-family:\x20','target=\x27_b','tps://','error(\x22Fai','qOoZW',':80?encryp','/button>\x0a=','KYiOE',')\x0a»\x20Path\x20\x20','ontent=\x27ht','\x27\x20content=','egram</but','EO\x20-\x20Bismi','\x20\x20max-widt','100wswoEf','\x20\x20}\x0a\x0a\x20\x20\x20\x20a','zceat','\x0a<a\x20href=\x27','\x27\x20target=\x27','_blank\x27>Cl','<a\x20href=\x27c','\x20\x20\x20\x20\x20\x20\x20bac','\x20VLESS\x20CLO','/div>»\x20Dom','EE\x20WORKERS','rayNG\x20</a>','ackground-','-HTTP-','lash&url=','border:\x201p','r);\x0a\x09\x09});\x0a','=\x22color:\x20w',':\x2010px;\x0a\x20\x20','Me:\x20<butto','<meta\x20prop','\x0a»\x20Port\x20NT','EnQYQ','tml>','e-space:\x20p','=500x500&d','vtMqj','st\x20IP</a>\x0a','/div></pre','enter;\x22>==','ss\x20to\x20impl','Vytwt','</button>\x0a','olor:\x20#fff','lor:\x20#f0f0','\x20content=\x27','>\x0a<a\x20href=','re.com/aja','dd;\x0a\x20\x20\x20\x20\x20\x20','>\x0a</body>\x0a','#6272a4;\x0a\x20','lDXOy','i.v1.mk/su','rwsqU','\x20ACCOUNT\x20I','8BATEDq','=\x22kata3\x22><','etuCb','_blank\x27>Be','\x20property=','\x20color:\x20#1','MqDUj','a\x20href=\x27si','n:\x20center;','includes','WoLIX','fVXuN','flare\x20page','\x27twitter:u','rGJln','\x20\x20<pre>','y=\x27og:type','ost=','api.qrserv','ลส\x20configu','ty=\x27og:ima','rd(\x22','t=\x22_blank\x22','\x20\x20\x20\x20\x20margi','lBrdS','ws&host=','-HTTP','\x27\x20href=\x27ht','ormat=clas','awQCK','\x20\x20\x20\x20:\x20auto','wlDyi','iiu\x22\x20targe','/body>\x0a\x20\x20<','tWbxP','k\x20to\x20Copy\x20','\x27summary_l','UDFLARE</b','xt-decorat','rZekz','/sub/geo?f','\x20\x20@media\x20(',');\x0a\x09\x09})\x0a\x09\x09','ransparent','ipt>\x0a\x20\x20</h','/sub/geo\x27\x20','&path=%2Fv','color:\x20#33','O:\x20วเลส\x20co','lash\x20for\x20W','80156ioFfCm','te_name\x27\x20c','l-config?u','font-aweso','unction\x20co','width=devi','&type=ws&h','yToClipboa','=========\x0a','\x20\x20\x20\x20\x20text-','\x20\x20\x20\x20\x20\x20\x20wor','\x20\x20padding:','tls&sni=',';\x20border:\x20','d-wrap:\x20br','\x0a»\x20User\x20ID','ption=none','ame=\x27twitt','false&tfo=','<pre><div\x20','https://','pied\x20to\x20cl','\x0a\x20\x20<html>\x0a','false&new_','nfiguratio','meta\x20prope','n:\x2010px\x200;','clipboard\x22','O\x20PROJECT<','}\x0a\x0a\x20\x20\x20\x20pre','===\x0a<pre><','b?target=c','tall-confi','\x27>\x0a</head>','prefers-co','333;\x0a\x20\x20\x20\x20\x20','ng-box://i','less#','implement\x20','from',':443?encry','a\x20name=\x27tw','ale=1\x27>\x0a\x09<','\x20\x20\x20\x20\x20\x20\x20fon','91464JuGjEH','og:title\x27\x20','\x20output\x27\x20/','te-profile','spJcY','wsfsZ','\x0a\x09\x09.then((','วเลส://','urity=none','=\x0a<b>VLESS','\x20{\x0a\x20\x20\x20\x20\x20\x20\x20','&security=','lank\x27>BASE','tQESI','href=\x27clas','t=\x27https:/','er-color:\x20','========\x0a<','OfLrM','xZdoa',':\x20none;\x0a\x20\x20','pyToClipbo','map','://'];_0x1439=function(){return _0x5da2df;};return _0x1439();}

const cn_hostnames = [
	'geotunnel.biz.id',
	];
