import express from "express";
// import authRoutes from "./routes/auth.routes";
// import tradeRoutes from "./routes/trade.routes";

const app = express();

app.use(express.json());

// app.use("/auth", authRoutes);
// app.use("/trade", tradeRoutes);

export default app;
