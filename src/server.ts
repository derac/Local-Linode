import express from 'express';
import types from './assets/types.json';

const app = express();
const PAT = "testtokenabcdefg"
// create token - do we need this?
// app.post('/v4/profile/tokens', (req, res) => {
//     res.send()
// })

// ===== Linode Types API =====
// Types List
app.get('/v4/linode/types', (req, res) => {
    res.send(types)
})

// Type View
app.get('/v4/linode/types/:typeId', (req, res) => {
    let typeData = types.data.filter(type => type.id == req.params.typeId)
    if (typeData.length) {
        res.send(typeData)
    } else {
        res.statusCode = 404
        res.json({"errors": [{"reason": "Not found"}]})
    }
})

// ===== Linode Instances API =====
app.get('/v4/linode/instances', (req, res) => {
    res.send()
})


app.listen(3000, () => {
    console.log('The application is listening on port 3000!');
})