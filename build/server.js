"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var app = express_1.default();
var PAT = "testtokenabcdefg";
app.get('/', function (req, res) {
    res.send('Well done!');
});
app.get('/v4/linode/types', function (req, res) {
    res.sendFile('Types-Response.txt', { "root": "./assets" });
});
// create token - do we need this?
// app.post('/v4/profile/tokens', (req, res) => {
//     res.send()
// })
app.listen(3000, function () {
    console.log('The application is listening on port 3000!');
});
