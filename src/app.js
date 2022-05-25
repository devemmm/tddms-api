require("./db/mongoose");
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const publicRoutes = require("./routes/publicRoutes");
const privateRoutes = require("./routes/privateRoutes");

const port = process.env.PORT;
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

app.use(express.static(path.join(__dirname, "../public")));
app.use(privateRoutes);
app.use(publicRoutes);

app.listen(port, () => console.log(`Server is runnning on port ${port}`));
