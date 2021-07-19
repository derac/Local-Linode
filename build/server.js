"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var types_json_1 = __importDefault(require("./data/types.json"));
var app = express_1.default();
var PAT = "testtokenabcdefg";
// create token - do we need this?
// app.post('/v4/profile/tokens', (req, res) => {
//     res.send()
// })
// ===== Linode Types API =====
// Types List
app.get('/v4/linode/types', function (req, res) {
    res.send(types_json_1.default);
});
// Type View
app.get('/v4/linode/types/:typeId', function (req, res) {
    var typeData = types_json_1.default.data.filter(function (type) { return type.id == req.params.typeId; });
    if (typeData.length) {
        res.send(typeData);
    }
    else {
        res.statusCode = 404;
        res.json({ "errors": [{ "reason": "Not found" }] });
    }
});
// ===== Linode Instances API =====
app.get('/v4/linode/instances', function (req, res) {
    res.send();
});
app.listen(3000, function () {
    console.log('The application is listening on port 3000!');
});
