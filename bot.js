const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const socketIO = require('socket.io');
const qrcode = require('qrcode');
const http = require('http');

const port = process.env.PORT || 8000;
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

function delay(t, v) {
  return new Promise(function(resolve) { 
      setTimeout(resolve.bind(null, v), t)
  });
}

app.use(express.json());

app.use(express.urlencoded({
  extended: true
}));

app.use("/", express.static(__dirname + "/"))

app.get('/', (req, res) => {
  res.sendFile('index.html', {
    root: __dirname
  });
});

const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'chat-bot' }),
  puppeteer: { headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ] }
});

client.initialize();

io.on('connection', function(socket) {
  socket.emit('message', 'ChatBot Iniciado');
  socket.emit('qr', './assets/images/icon.svg');

  client.on('qr', (qr) => {
      console.log('QR RECEIVED', qr);
      qrcode.toDataURL(qr, (err, url) => {
        socket.emit('qr', url);
        socket.emit('message', 'QRCode recebido, aponte a câmera do seu celular!');
      });
  });

  client.on('ready', () => {
      socket.emit('ready', 'Dispositivo pronto!');
      socket.emit('message', 'Dispositivo pronto!');
      socket.emit('qr', './assets/images/check.svg')	
      console.log('Dispositivo pronto');
  });

  client.on('authenticated', () => {
      socket.emit('authenticated', 'Autenticado!');
      socket.emit('message', 'Autenticado!');
      console.log('Autenticado');
  });

  client.on('auth_failure', function() {
      socket.emit('message', 'Falha na autenticação, reiniciando...');
      console.error('Falha na autenticação');
  });

  client.on('change_state', state => {
    console.log('Status de conexão: ', state );
  });

  client.on('disconnected', (reason) => {
    socket.emit('message', 'Cliente desconectado!');
    console.log('Cliente desconectado', reason);
    client.initialize();
  });
});

client.on('message', async msg => {
  if (msg.type.toLowerCase() == "e2e_notification") return null;
  
  if (msg.body == null || msg.body == "") return null;

  if (msg.from.includes("@g.us")) return null;

  let groupChat = await msg.getChat();
  if (groupChat.isGroup) return null;  

  const nomeContato = msg._data.notifyName;

  if (msg.body === "1") {
    msg.reply(nomeContato + ", o ChatBot identificou que você digitou o valor igual a 1")
  } else if (msg.body === "2") {
    msg.reply(nomeContato + ", o ChatBot identificou que você digitou o valor igual a 2")
  } else if (msg.body === "3") {
    msg.reply(nomeContato + ", o ChatBot identificou que você digitou o valor igual a 3")
  } 
});

server.listen(port, function() {
  console.log('Aplicação rodando na porta: ' + port + '. Acesse o link: http://localhost:' + port);
});