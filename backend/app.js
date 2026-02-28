import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { swaggerUi, swaggerSpec } from "./utils/swagger.js";
import authRouter from "./routes/auth.route.js";
import adminRouter from "./routes/admin.route.js";
import customerRouter from "./routes/customer.route.js";
import tailorRouter from "./routes/tailor.route.js";
import deliveryRouter from "./routes/delivery.route.js";
import paymentRouter from "./routes/payment.route.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
  })
);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(
  express.json({
    limit: "16kb",
    verify: (req, _res, buf) => {
      if (req.originalUrl.startsWith("/api/v1/payments/webhook")) {
        req.rawBody = buf.toString("utf8");
      }
    }
  })
);
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/customer", customerRouter);
app.use("/api/v1/tailor", tailorRouter);
app.use("/api/v1/delivery", deliveryRouter);
app.use("/api/v1/payments", paymentRouter);

export { app };
