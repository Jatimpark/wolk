// worker.js
import { connect } from "cloudflare:sockets";
var listProxy = [
  { path: "/ID-CTN", proxy: "103.133.223.50:2096" },
  { path: "/ID-CTN3", proxy: "103.133.223.51:2096" },
  { path: "/ID-CTN3", proxy: "103.133.223.52:2096" },
  { path: "/CBN", proxy: "103.6.207.108:8080" },  
  { path: "/ID-HERZA", proxy: "103.168.146.169:20132" },
  { path: "/ID-INTER", proxy: "43.133.145.156:53136" },
  { path: "/ID-IDC1", proxy: "103.186.1.209:8443" },
  { path: "/OVH-SG1", proxy: "51.79.254.182:443" },
  { path: "/SG-VUTR1", proxy: "64.176.84.144:81" },
  { path: "/SG-VULTR2", proxy: "139.180.144.170:666" },
  { path: "/SG-VULTR3", proxy: "139.180.131.125:10005" },
  { path: "/SGDO1", proxy: "152.42.172.170:8443" },
  { path: "/SGDO2", proxy: "143.198.213.197:8443" },
  { path: "/SGDO3", proxy: "143.198.85.62:49270" },
  { path: "/SGDO4", proxy: "143.198.85.62:18163" },
  { path: "/SGDO5", proxy: "139.162.33.248:587" },
  { path: "/SGDO5", proxy: "188.166.255.195:8443" },
  { path: "/SGDO6", proxy: "178.128.80.43:443" },
  { path: "/SGDO7", proxy: "143.198.85.62:41536" },
  { path: "/SGDO9", proxy: "157.230.193.55:2053" },
  { path: "/SGDO8", proxy: "128.199.171.100:2053" },
  { path: "/SG-AMAZON", proxy: "54.251.167.101:443" },
  { path: "/SG-AMAZON1", proxy: "3.1.94.232:443" },
  { path: "/SG-UPCLOUD1", proxy: "94.237.75.31:62174" },
  { path: "/AKAMAI2", proxy: "139.162.48.174:10000" },
  { path: "/SG-ORACLE1", proxy: "168.138.178.6:19990" },
  { path: "/SG-ORACLE2", proxy: "168.138.183.48:9090" },
  { path: "/SG-ORACLE3", proxy: "140.245.61.163:39863" },
  { path: "/SG-TC1", proxy: "43.156.16.213:31528" },
  { path: "/SG-EDC", proxy: "38.181.70.7:16240" },
  { path: "/SG-LASEWEB", proxy: "194.127.193.240:50791" },
  { path: "/SG-LASEWEB2", proxy: "194.127.193.124:24467" },
  { path: "/SG-AZURE", proxy: "4.193.111.126:40809" },
  { path: "/SG-ARYAKA", proxy: "185.114.78.230:443" },
  { path: "/SG-HONGKONG", proxy: "103.180.161.69:587" },
  { path: "/SG-HONGKONG1", proxy: "103.180.161.10:587" },
  { path: "/SG-CONTABO1", proxy: "62.72.46.14:8443" },
  { path: "/SG-SPEDPAGE", proxy: "194.9.62.132:34646" },
  { path: "/SG-BELNET", proxy: "194.36.179.17:8443" },
  { path: "/SG-AKILE", proxy: "185.81.28.95:30503" },
  //tambahin sendiri
];
var proxyIP;
var proxyPort;
var worker_default = {
  async fetch(request, ctx) {
    try {
      proxyIP = proxyIP;
      const url = new URL(request.url);
      const upgradeHeader = request.headers.get("Upgrade");
      for (const entry of listProxy) {
        if (url.pathname === entry.path) {
          [proxyIP, proxyPort] = entry.proxy.split(':');
          break;
        }
      }
      if (upgradeHeader === "websocket" && proxyIP) {
        return await vlessOverWSHandler(request);
      }
      const allConfig = await getAllConfigVless(request.headers.get("Host"));
      return new Response(allConfig, {
        status: 200,
        headers: { "Content-Type": "text/html;charset=utf-8" }
      });
    } catch (err) {
      return new Response(err.toString(), { status: 500 });
    }
  }
};
async function getAllConfigVless(hostName) {
  try {
    let vlessConfigs = "";
    let clashConfigs = "";
    for (const entry of listProxy) {
      const { path, proxy } = entry;
      const [ipOnly] = proxy.split(':');
      const response = await fetch(`http://ip-api.com/json/${ipOnly}`);
      const data = await response.json();
      const pathFixed = encodeURIComponent(path);
      const vlessTls = `vless://${generateUUIDv4()}@bug.com:443?encryption=none&security=tls&sni=${hostName}&fp=randomized&type=ws&host=${hostName}&path=${pathFixed}#${data.isp} (${data.countryCode})`;
      const vlessNtls = `vless://${generateUUIDv4()}@bug.com:80?path=${pathFixed}&security=none&encryption=none&host=${hostName}&fp=randomized&type=ws&sni=${hostName}#${data.isp} (${data.countryCode})`;
      const vlessTlsFixed = vlessTls.replace(/ /g, "+");
      const vlessNtlsFixed = vlessNtls.replace(/ /g, "+");
      vlessConfigs += `<div class="config-section">
    <p><strong>ISP  :  ${data.isp} (${data.countryCode}) </strong> </p>
    <hr />
    <div class="config-toggle">
        <button class="button" onclick="toggleConfig(this, 'show vless', 'hide vless')">Show Vless</button>
        <div class="config-content">
            <div class="config-block">
                <h3>TLS:</h3>
                <p class="config">${vlessTlsFixed}</p>
                <button class="button" onclick='copyToClipboard("${vlessTlsFixed}")'><i class="fa fa-clipboard"></i>Copy</button>
            </div>
            <hr />
            <div class="config-block">
                <h3>NTLS:</h3>
                <p class="config">${vlessNtlsFixed}</p>
                <button class="button" onclick='copyToClipboard("${vlessNtlsFixed}")'><i class="fa fa-clipboard"></i>Copy</button>
            </div>
            <hr />
        </div>
    </div>
</div>
<hr class="config-divider" />
`;
    }
    const htmlConfigs = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>Vless | AryaBlitar | CLoudFlare</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" integrity="sha512-Fo3rlrZj/k7ujTnHg4C+6PCWJ+8zzHcXQjXGp6n5Yh9rX0x5fOdPaOqO+e2X4R5C1aE/BSqPIG+8y3O6APa8w==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <link rel="icon" href="https://raw.githubusercontent.com/Arya-Blitar22/cok/main/babi.png" type="image/png">
    <style>
    body {
    margin: 0;
    padding: 0;
    font-family: 'Poppins', sans-serif;
    color: #f5f5f5;
    background-color: #2d3b48; /* Dark Blue-gray */
    display: flex;
    align-items: center;
    flex-direction: column;
    min-height: 100vh;
    overflow: hidden;
}

.container {
    width: 100%;
    max-width: 1200px;
    margin: 3px;
    background: rgba(0, 0, 0, 0.8); /* Dark transparent background */
    backdrop-filter: blur(10px);
    animation: fadeIn 1s ease-in-out;
    overflow-y: auto;
    max-height: 100vh;
}

.overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(15, 15, 15, 0.4);
    z-index: -1;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

.header h1 {
    text-align: center;
    margin: 10px 0 40px;
    font-size: 42px;
    color: #DC143C; /* Crimson */
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 4px;
}

.nav-buttons {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin: 20px 0;
}

.nav-buttons .button {
    background-color: transparent;
    border: 3px solid #DC143C; /* Crimson */
    color: #f39c12;
    padding: 6px 12px;
    font-size: 20px;
    border-radius: 4px;
    cursor: pointer;
    transition: 0.3s;
    text-transform: uppercase;
    letter-spacing: 3px;
}

.nav-buttons .button:hover {
    background-color: #DC143C; /* Crimson */
    color: #fff;
    transform: scale(1.05);
}

.content {
    display: none;
    opacity: 0;
    transition: opacity 0.5s ease-in-out;
}

.content.active {
    display: block;
    opacity: 1;
}

.config-section {
    background: rgba(44, 62, 80, 0.7); /* Dark Slate Blue */
    padding: 20px;
    border: 2px solid #f39c12;
    border-radius: 10px;
    position: relative;
    animation: slideIn 0.5s ease-in-out;
}

@keyframes slideIn {
    from { transform: translateX(-30px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

.config-section h3 {
    color: #e74c3c; /* Red */
    font-size: 28px;
    margin-top: 0;
}

.config-section p {
    font-size: 16px;
    color: #ecf0f1; /* Light Gray */
}

.config-toggle {
    margin-bottom: 10px;
}

.config-content {
    display: none;
}

.config-content.active {
    display: block;
}

.config-block {
    margin-bottom: 10px;
    padding: 15px;
    border-radius: 10px;
    background-color: rgba(52, 152, 219, 0.2); /* Light Blue */
    transition: background-color 0.3s;
}

.config-block h4 {
    color: #2980b9; /* Blue */
    font-size: 22px;
    font-weight: 600;
    margin-bottom: 8px;
}

.config {
    background-color: rgba(44, 62, 80, 0.3); /* Dark Slate Blue */
    padding: 15px;
    border-radius: 5px;
    border: 2px solid #f39c12;
    font-family: 'Courier New', Courier, monospace;
    font-size: 15px;
    word-wrap: break-word;
    white-space: pre-wrap;
}

.button {
    background-color: transparent;
    border: 2px solid #DC143C; /* Crimson */
    color: #f39c12;
    padding: 4px 8px;
    font-size: 12px;
    border-radius: 3px;
    cursor: pointer;
    transition: 0.3s;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin-right: 4px;
}

.button i {
    margin-right: 3px;
}

.button:hover {
    background-color: #DC143C; /* Crimson */
    color: #fff;
}

.config-divider {
    height: 1px;
    background: linear-gradient(to right, transparent, #fff, transparent);
    margin: 20px 0;
}

.watermark {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.5);
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
    font-weight: bold;
    text-align: center;
}

.watermark a {
    color: #e74c3c; /* Red */
    text-decoration: none;
    font-weight: bold;
}

.watermark a:hover {
    color: #e74c3c; /* Red */
}

@media (max-width: 768px) {
    .header h1 { font-size: 32px; }
    .config-section h3 { font-size: 24px; }
    .config-block h4 { font-size: 20px; }
}

    </style>
</head>
<body>
    <div class="overlay"></div>
    <div class="container">
        <div class="header"><br>
            <h1>WELCOME TO MY JANDAKU</br>
            Upload Arya Blitar <br>
            <h1>GRATIS VLESS CLOUDFLARE</h1>
        </div>
        <hr class="config-divider" />
        <div id="vless" class="content active">
            ${vlessConfigs}
        </div>
    </div>
    <script>
        function showContent(contentId) {
            const contents = document.querySelectorAll('.content');
            contents.forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(contentId).classList.add('active');
        }
        function salinTeks() {
            var teks = document.getElementById('teksAsli');
            teks.select();
            document.execCommand('copy');
            alert('Teks telah disalin.');
        }
        function copyClash(elementId) {
            const text = document.getElementById(elementId).textContent;
            navigator.clipboard.writeText(text)
            .then(() => {
            const alertBox = document.createElement('div');
            alertBox.textContent = "Copied to clipboard!";
            alertBox.style.position = 'fixed';
            alertBox.style.bottom = '20px';
            alertBox.style.right = '20px';
            alertBox.style.backgroundColor = 'green';
            alertBox.style.color = '#fff';
            alertBox.style.padding = '10px 20px';
            alertBox.style.borderRadius = '5px';
            alertBox.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
            alertBox.style.opacity = '0';
            alertBox.style.transition = 'opacity 0.5s ease-in-out';
            document.body.appendChild(alertBox);
            setTimeout(() => {
                alertBox.style.opacity = '1';
            }, 100);
            setTimeout(() => {
                alertBox.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(alertBox);
                }, 500);
            }, 2000);
        })
        .catch((err) => {
            console.error("Failed to copy to clipboard:", err);
        });
        }
function fetchAndDisplayAlert(path) {
    fetch(path)
        .then(response => {
            if (!response.ok) {
                throw new Error(\`HTTP error! Status: \${response.status}\`);
            }
            return response.json();
        })
        .then(data => {
            const proxyStatus = data.proxyStatus || "Unknown status";
            const alertBox = document.createElement('div');
            alertBox.textContent = \`Proxy Status: \${proxyStatus}\`;
            alertBox.style.position = 'fixed';
            alertBox.style.bottom = '20px';
            alertBox.style.right = '20px';
            alertBox.style.backgroundColor = 'green';
            alertBox.style.color = '#fff';
            alertBox.style.padding = '10px 20px';
            alertBox.style.borderRadius = '5px';
            alertBox.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
            alertBox.style.opacity = '0';
            alertBox.style.transition = 'opacity 0.5s ease-in-out';
            document.body.appendChild(alertBox);
            
            setTimeout(() => {
                alertBox.style.opacity = '1';
            }, 100);
            
            setTimeout(() => {
                alertBox.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(alertBox);
                }, 500);
            }, 2000);
        })
        .catch((err) => {
            alert("Failed to fetch data or invalid response.");
        });
}
        function copyToClipboard(text) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    const alertBox = document.createElement('div');
                    alertBox.textContent = "Copied to clipboard!";
                    alertBox.style.position = 'fixed';
                    alertBox.style.bottom = '20px';
                    alertBox.style.right = '20px';
                    alertBox.style.backgroundColor = 'green';
                    alertBox.style.color = '#fff';
                    alertBox.style.padding = '10px 20px';
                    alertBox.style.borderRadius = '5px';
                    alertBox.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                    alertBox.style.opacity = '0';
                    alertBox.style.transition = 'opacity 0.5s ease-in-out';
                    document.body.appendChild(alertBox);
                    setTimeout(() => {
                        alertBox.style.opacity = '1';
                    }, 100);
                    setTimeout(() => {
                        alertBox.style.opacity = '0';
                        setTimeout(() => {
                            document.body.removeChild(alertBox);
                        }, 500);
                    }, 2000);
                })
                .catch((err) => {
                    console.error("Failed to copy to clipboard:", err);
                });
        }

        function toggleConfig(button, show, hide) {
            const configContent = button.nextElementSibling;
            if (configContent.classList.contains('active')) {
                configContent.classList.remove('active');
                button.textContent = show;
            } else {
                configContent.classList.add('active');
                button.textContent = hide;
            }
        }
    <\/script>
</body>
</html>`;
    return htmlConfigs;
  } catch (error) {
    return `An error occurred while generating the VLESS configurations. ${error}`;
  }
}
function generateUUIDv4() {
  const randomValues = crypto.getRandomValues(new Uint8Array(16));
  randomValues[6] = randomValues[6] & 15 | 64;
  randomValues[8] = randomValues[8] & 63 | 128;
  return [
    randomValues[0].toString(16).padStart(2, "0"),
    randomValues[1].toString(16).padStart(2, "0"),
    randomValues[2].toString(16).padStart(2, "0"),
    randomValues[3].toString(16).padStart(2, "0"),
    randomValues[4].toString(16).padStart(2, "0"),
    randomValues[5].toString(16).padStart(2, "0"),
    randomValues[6].toString(16).padStart(2, "0"),
    randomValues[7].toString(16).padStart(2, "0"),
    randomValues[8].toString(16).padStart(2, "0"),
    randomValues[9].toString(16).padStart(2, "0"),
    randomValues[10].toString(16).padStart(2, "0"),
    randomValues[11].toString(16).padStart(2, "0"),
    randomValues[12].toString(16).padStart(2, "0"),
    randomValues[13].toString(16).padStart(2, "0"),
    randomValues[14].toString(16).padStart(2, "0"),
    randomValues[15].toString(16).padStart(2, "0")
  ].join("").replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, "$1-$2-$3-$4-$5");
}
async function vlessOverWSHandler(request) {
  const webSocketPair = new WebSocketPair();
  const [client, webSocket] = Object.values(webSocketPair);
  webSocket.accept();
  let address = "";
  let portWithRandomLog = "";
  const log = (info, event) => {
    console.log(`[${address}:${portWithRandomLog}] ${info}`, event || "");
  };
  const earlyDataHeader = request.headers.get("sec-websocket-protocol") || "";
  const readableWebSocketStream = makeReadableWebSocketStream(webSocket, earlyDataHeader, log);
  let remoteSocketWapper = {
    value: null
  };
  let udpStreamWrite = null;
  let isDns = false;
  readableWebSocketStream.pipeTo(new WritableStream({
    async write(chunk, controller) {
      if (isDns && udpStreamWrite) {
        return udpStreamWrite(chunk);
      }
      if (remoteSocketWapper.value) {
        const writer = remoteSocketWapper.value.writable.getWriter();
        await writer.write(chunk);
        writer.releaseLock();
        return;
      }
      const {
        hasError,
        message,
        portRemote = 443,
        addressRemote = "",
        rawDataIndex,
        vlessVersion = new Uint8Array([0, 0]),
        isUDP
      } = processVlessHeader(chunk);
      address = addressRemote;
      portWithRandomLog = `${portRemote}--${Math.random()} ${isUDP ? "udp " : "tcp "} `;
      if (hasError) {
        throw new Error(message);
        return;
      }
      if (isUDP) {
        if (portRemote === 53) {
          isDns = true;
        } else {
          throw new Error("UDP proxy only enable for DNS which is port 53");
          return;
        }
      }
      const vlessResponseHeader = new Uint8Array([vlessVersion[0], 0]);
      const rawClientData = chunk.slice(rawDataIndex);
      if (isDns) {
        const { write } = await handleUDPOutBound(webSocket, vlessResponseHeader, log);
        udpStreamWrite = write;
        udpStreamWrite(rawClientData);
        return;
      }
      handleTCPOutBound(remoteSocketWapper, addressRemote, portRemote, rawClientData, webSocket, vlessResponseHeader, log);
    },
    close() {
      log(`readableWebSocketStream is close`);
    },
    abort(reason) {
      log(`readableWebSocketStream is abort`, JSON.stringify(reason));
    }
  })).catch((err) => {
    log("readableWebSocketStream pipeTo error", err);
  });
  return new Response(null, {
    status: 101,
    webSocket: client
  });
}
async function handleTCPOutBound(remoteSocket, addressRemote, portRemote, rawClientData, webSocket, vlessResponseHeader, log) {
  async function connectAndWrite(address, port) {
    const tcpSocket2 = connect({
      hostname: address,
      port
    });
    remoteSocket.value = tcpSocket2;
    log(`connected to ${address}:${port}`);
    const writer = tcpSocket2.writable.getWriter();
    await writer.write(rawClientData);
    writer.releaseLock();
    return tcpSocket2;
  }
  async function retry() {
    const tcpSocket2 = await connectAndWrite(proxyIP || addressRemote, proxyPort || portRemote);
    tcpSocket2.closed.catch((error) => {
      console.log("retry tcpSocket closed error", error);
    }).finally(() => {
      safeCloseWebSocket(webSocket);
    });
    remoteSocketToWS(tcpSocket2, webSocket, vlessResponseHeader, null, log);
  }
  const tcpSocket = await connectAndWrite(addressRemote, portRemote);
  remoteSocketToWS(tcpSocket, webSocket, vlessResponseHeader, retry, log);
}
function makeReadableWebSocketStream(webSocketServer, earlyDataHeader, log) {
  let readableStreamCancel = false;
  const stream = new ReadableStream({
    start(controller) {
      webSocketServer.addEventListener("message", (event) => {
        if (readableStreamCancel) {
          return;
        }
        const message = event.data;
        controller.enqueue(message);
      });
      webSocketServer.addEventListener(
        "close",
        () => {
          safeCloseWebSocket(webSocketServer);
          if (readableStreamCancel) {
            return;
          }
          controller.close();
        }
      );
      webSocketServer.addEventListener(
        "error",
        (err) => {
          log("webSocketServer has error");
          controller.error(err);
        }
      );
      const { earlyData, error } = base64ToArrayBuffer(earlyDataHeader);
      if (error) {
        controller.error(error);
      } else if (earlyData) {
        controller.enqueue(earlyData);
      }
    },
    pull(controller) {
    },
    cancel(reason) {
      if (readableStreamCancel) {
        return;
      }
      log(`ReadableStream was canceled, due to ${reason}`);
      readableStreamCancel = true;
      safeCloseWebSocket(webSocketServer);
    }
  });
  return stream;
}
function processVlessHeader(vlessBuffer) {
  if (vlessBuffer.byteLength < 24) {
    return {
      hasError: true,
      message: "invalid data"
    };
  }
  const version = new Uint8Array(vlessBuffer.slice(0, 1));
  let isValidUser = true;
  let isUDP = false;
  if (!isValidUser) {
    return {
      hasError: true,
      message: "invalid user"
    };
  }
  const optLength = new Uint8Array(vlessBuffer.slice(17, 18))[0];
  const command = new Uint8Array(
    vlessBuffer.slice(18 + optLength, 18 + optLength + 1)
  )[0];
  if (command === 1) {
  } else if (command === 2) {
    isUDP = true;
  } else {
    return {
      hasError: true,
      message: `command ${command} is not support, command 01-tcp,02-udp,03-mux`
    };
  }
  const portIndex = 18 + optLength + 1;
  const portBuffer = vlessBuffer.slice(portIndex, portIndex + 2);
  const portRemote = new DataView(portBuffer).getUint16(0);
  let addressIndex = portIndex + 2;
  const addressBuffer = new Uint8Array(
    vlessBuffer.slice(addressIndex, addressIndex + 1)
  );
  const addressType = addressBuffer[0];
  let addressLength = 0;
  let addressValueIndex = addressIndex + 1;
  let addressValue = "";
  switch (addressType) {
    case 1:
      addressLength = 4;
      addressValue = new Uint8Array(
        vlessBuffer.slice(addressValueIndex, addressValueIndex + addressLength)
      ).join(".");
      break;
    case 2:
      addressLength = new Uint8Array(
        vlessBuffer.slice(addressValueIndex, addressValueIndex + 1)
      )[0];
      addressValueIndex += 1;
      addressValue = new TextDecoder().decode(
        vlessBuffer.slice(addressValueIndex, addressValueIndex + addressLength)
      );
      break;
    case 3:
      addressLength = 16;
      const dataView = new DataView(
        vlessBuffer.slice(addressValueIndex, addressValueIndex + addressLength)
      );
      const ipv6 = [];
      for (let i = 0; i < 8; i++) {
        ipv6.push(dataView.getUint16(i * 2).toString(16));
      }
      addressValue = ipv6.join(":");
      break;
    default:
      return {
        hasError: true,
        message: `invild  addressType is ${addressType}`
      };
  }
  if (!addressValue) {
    return {
      hasError: true,
      message: `addressValue is empty, addressType is ${addressType}`
    };
  }
  return {
    hasError: false,
    addressRemote: addressValue,
    addressType,
    portRemote,
    rawDataIndex: addressValueIndex + addressLength,
    vlessVersion: version,
    isUDP
  };
}
async function remoteSocketToWS(remoteSocket, webSocket, vlessResponseHeader, retry, log) {
  let remoteChunkCount = 0;
  let chunks = [];
  let vlessHeader = vlessResponseHeader;
  let hasIncomingData = false;
  await remoteSocket.readable.pipeTo(
    new WritableStream({
      start() {
      },
      async write(chunk, controller) {
        hasIncomingData = true;
        if (webSocket.readyState !== WS_READY_STATE_OPEN) {
          controller.error(
            "webSocket.readyState is not open, maybe close"
          );
        }
        if (vlessHeader) {
          webSocket.send(await new Blob([vlessHeader, chunk]).arrayBuffer());
          vlessHeader = null;
        } else {
          webSocket.send(chunk);
        }
      },
      close() {
        log(`remoteConnection!.readable is close with hasIncomingData is ${hasIncomingData}`);
      },
      abort(reason) {
        console.error(`remoteConnection!.readable abort`, reason);
      }
    })
  ).catch((error) => {
    console.error(
      `remoteSocketToWS has exception `,
      error.stack || error
    );
    safeCloseWebSocket(webSocket);
  });
  if (hasIncomingData === false && retry) {
    log(`retry`);
    retry();
  }
}
function base64ToArrayBuffer(base64Str) {
  if (!base64Str) {
    return { error: null };
  }
  try {
    base64Str = base64Str.replace(/-/g, "+").replace(/_/g, "/");
    const decode = atob(base64Str);
    const arryBuffer = Uint8Array.from(decode, (c) => c.charCodeAt(0));
    return { earlyData: arryBuffer.buffer, error: null };
  } catch (error) {
    return { error };
  }
}
var WS_READY_STATE_OPEN = 1;
var WS_READY_STATE_CLOSING = 2;
function safeCloseWebSocket(socket) {
  try {
    if (socket.readyState === WS_READY_STATE_OPEN || socket.readyState === WS_READY_STATE_CLOSING) {
      socket.close();
    }
  } catch (error) {
    console.error("safeCloseWebSocket error", error);
  }
}
async function handleUDPOutBound(webSocket, vlessResponseHeader, log) {
  let isVlessHeaderSent = false;
  const transformStream = new TransformStream({
    start(controller) {
    },
    transform(chunk, controller) {
      for (let index = 0; index < chunk.byteLength; ) {
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
  transformStream.readable.pipeTo(new WritableStream({
    async write(chunk) {
      const resp = await fetch(
        "https://1.1.1.1/dns-query",
        {
          method: "POST",
          headers: {
            "content-type": "application/dns-message"
          },
          body: chunk
        }
      );
      const dnsQueryResult = await resp.arrayBuffer();
      const udpSize = dnsQueryResult.byteLength;
      const udpSizeBuffer = new Uint8Array([udpSize >> 8 & 255, udpSize & 255]);
      if (webSocket.readyState === WS_READY_STATE_OPEN) {
        log(`doh success and dns message length is ${udpSize}`);
        if (isVlessHeaderSent) {
          webSocket.send(await new Blob([udpSizeBuffer, dnsQueryResult]).arrayBuffer());
        } else {
          webSocket.send(await new Blob([vlessResponseHeader, udpSizeBuffer, dnsQueryResult]).arrayBuffer());
          isVlessHeaderSent = true;
        }
      }
    }
  })).catch((error) => {
    log("dns udp has error" + error);
  });
  const writer = transformStream.writable.getWriter();
  return {
    write(chunk) {
      writer.write(chunk);
    }
  };
}
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map
