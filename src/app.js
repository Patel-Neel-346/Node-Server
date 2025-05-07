import express from "express";
import MongoDBInsatnce from "./db/DBConnect.js";
import cookieParser from "cookie-parser";
import UserRoute from "./routes/UserRoute.js";
import cors from "cors";
const app = express();
const PORT = 5000;

MongoDBInsatnce();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.get("/", (req, res) => {
  res.send("hello world!");
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/user", UserRoute);
app.use(cookieParser());
app.listen(PORT, () => {
  console.log("SERVER IS RUNNING ON THIS PORT:", PORT);
});
