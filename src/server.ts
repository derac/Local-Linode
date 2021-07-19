import express from 'express'
import types from './data/types.json'

const app = express();
const PAT = "testtokenabcdefg"
// create token - needed?
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
// Linodes List
app.get('/v4/linode/instances', (req, res) => {})

// Linode Create
app.post('/v4/linode/instances', (req, res) => {})

// Linode Delete
app.delete('/v4/linode/instances/:linodeId', (req, res) => {})

// Linode View
app.get('/v4/linode/instances/:linodeId', (req, res) => {})

// Linode Update
app.put('/v4/linode/instances/:linodeId', (req, res) => {})

// Linode Boot
app.post('/v4/linode/instances/:linodeId/boot', (req, res) => {})

// Configuration Profiles List
app.get('/v4/linode/instances/:linodeId/configs', (req, res) => {})

// Configuration Profile Create
app.post('/v4/linode/instances/:linodeId/configs', (req, res) => {})

// Configuration Profile Delete
app.delete('/v4/linode/instances/:linodeId/configs/:configId', (req, res) => {})

// Configuration Profile View
app.get('/v4/linode/instances/:linodeId/configs/:configId', (req, res) => {})

// Configuration Profile Update
app.put('/v4/linode/instances/:linodeId/configs/:configId', (req, res) => {})

// Disks List
app.get('/v4/linode/instances/:linodeId/disks', (req, res) => {})

// Disk Create
app.post('/v4/linode/instances/:linodeId/disks', (req, res) => {})

// Disk Delete
app.delete('/v4/linode/instances/:linodeId/disks/:diskId', (req, res) => {})

// Disk View
app.get('/v4/linode/instances/:linodeId/disks/:diskId', (req, res) => {})

// Disk Update
app.put('/v4/linode/instances/:linodeId/disks/:diskId', (req, res) => {})

// Disk Clone
app.post('/v4/linode/instances/:linodeId/disks/:diskId/clone', (req, res) => {})

// Disk Root Password Reset
app.post('/v4/linode/instances/:linodeId/disks/:diskId/password', (req, res) => {})

// Disk Resize
app.post('/v4/linode/instances/:linodeId/disks/:diskId/resize', (req, res) => {})

// Firewalls List
app.get('/v4/linode/instances/:linodeId/firewalls', (req, res) => {})

// Networking Information List
app.get('/v4/linode/instances/:linodeId/ips', (req, res) => {})

// IP Address View
app.get('/v4/linode/instances/:linodeId/ips/:address', (req, res) => {})

// IP Address Update
app.put('/v4/linode/instances/:linodeId/ips/:address', (req, res) => {})

// DC Migration/Pending Host Migration Initiate - needed?
app.post('/v4/linode/instances/:linodeId/migrate', (req, res) => {})

// Linode Upgrade
app.post('/v4/linode/instances/:linodeId/mutate', (req, res) => {})

// Linode Root Password Reset
app.post('/v4/linode/instances/:linodeId/password', (req, res) => {})

// Linode Reboot
app.post('/v4/linode/instances/:linodeId/reboot', (req, res) => {})

// Linode Rebuild
app.post('/v4/linode/instances/:linodeId/rebuild', (req, res) => {})

// Linode Resize
app.post('/v4/linode/instances/:linodeId/resize', (req, res) => {})

// Linode Shut Down
app.post('/v4/linode/instances/:linodeId/shutdown', (req, res) => {})

// Linode's Volumes List
app.get('/v4/linode/instances/:linodeId/volumes', (req, res) => {})

// ===== Linode Volumes API =====
// Volumes List
app.get('/v4/volumes', (req, res) => {})

// Volume Create
app.post('/v4/volumes', (req, res) => {})

// Volume Delete
app.delete('/v4/volumes/:volumeId', (req, res) => {})

// Volume View
app.get('/v4/volumes/:volumeId', (req, res) => {})

// Volume Update
app.put('/v4/volumes/:volumeId', (req, res) => {})

// Volume Attach
app.post('/v4/volumes/:volumeId/attach', (req, res) => {})

// Volume Clone
app.post('/v4/volumes/:volumeId/clone', (req, res) => {})

// Volume Detach
app.post('/v4/volumes/:volumeId/detach', (req, res) => {})

// Volume Resize
app.post('/v4/volumes/:volumeId/resize', (req, res) => {})

// ==== Start server =====

app.listen(3000, () => {
    console.log('The application is listening on port 3000!');
})