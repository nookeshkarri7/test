const express = require("express");
const app = express();
const cors = require("cors");



app.use(cors());

app.get("/test", async (request, response) => {
    return response.send('working')
});



app.listen(4002, () => console.log("port running"));
