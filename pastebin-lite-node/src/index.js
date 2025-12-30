require("dotenv").config();
const express = require("express");

const health = require("./routes/health");
const pastes = require("./routes/pastes");

const app = express();
app.use(express.json());

app.use("/api", health);
app.use("/api", pastes);
app.use("/", pastes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running on " + PORT));