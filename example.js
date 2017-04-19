var ls = require('./object_ls');

var server = require('http').createServer(() => {  });

console.log("HTTP Server:");
ls(server);

console.log("\nNode process:");
ls(process);

console.log("\nURL object:");
ls(require('url').parse("https://google.com"));
