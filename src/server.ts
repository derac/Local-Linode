import express from 'express';

const app = express();
const PAT = "testtokenabcdefg"
// create token - do we need this?
// app.post('/v4/profile/tokens', (req, res) => {
//     res.send()
// })


app.get('/v4/linode/types', (req, res) => {
    res.sendFile('Types-Response.txt', {"root": "./assets"})
})




app.listen(3000, () => {
    console.log('The application is listening on port 3000!');
})