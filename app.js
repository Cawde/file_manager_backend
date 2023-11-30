const express = require("express");
const fileUpload = require("express-fileupload");
const path = require("path");
const fileInfo = require('./middleware/fileInfo');
const fileSizeLimit = require('./middleware/fileSizeLimit');
const fileExtHandler = require('./middleware/fileExtHandler');
const apiRouter = require('./api');  // Import apiRouter

const PORT = process.env.PORT || 3000;
const app = express();

// Add these lines to parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//middleware
const morgan = require("morgan");
app.use(morgan("dev"));

const cors = require('cors');
app.use(cors());

app.use('/api', apiRouter);  // Use the apiRouter for /api/*
// app.get("/", (req, res) => {
//     res.sendFile(path.join(__dirname, "index.html"));
// });

// app.post('/upload', 
//     fileUpload({ createParentPath: true }),
//     fileInfo,
//     fileExtHandler(['.png', '.jpg', '.jpeg', '.txt', '.pdf', '.docx', '.mp3', '.mp4']),
//     fileSizeLimit,
//     (req,res) => {
//         const files = req.files
//         console.log(files);
//         Object.keys(files).forEach(key => {
//             const filepath = path.join(__dirname, 'files', files[key].name)
//             files[key].mv(filepath, (err) => {
//                 if (err) return res.status(500).json({ status: "error", message: err})
//             })
//         })
//         return res.json({ status: 'success', message: Object.keys(files).toString()})
//     }
// )



app.listen(PORT, () => console.log(`CORS-enabled web server listening on port ${PORT}`));