require("dotenv").config();
const cors = require("cors");
const mongoose = require("mongoose");
const Redis = require("ioredis");
const logger = require("./utils/logger");
const express = require("express");
const helmet = require("helmet");
const { RateLimiterRedis } = require("rate-limiter-flexible");
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const routes = require("./routes/identity-service");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3001;
//connect to mongodb
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => logger.info("Connected to mongodb"))
  .catch((e) => logger.error("Mongo connection error", e));

const redisClient = new Redis(process.env.REDIS_URL);
//middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body, ${req.body}`);
  next();
});

//DDos protection and rate limiting
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "middleware",
  points: 10,
  duration: 1,
});

app.use((req, res, next) => {
  rateLimiter
    .consume(req.ip)
    .then((rateLimiterRes) => {
      res.set({
        "Retry-After": Math.ceil(rateLimiterRes.msBeforeNext / 1000),
        "X-RateLimit-Remaining": rateLimiterRes.remainingPoints,
        "X-RateLimit-Reset": new Date(
          Date.now() + rateLimiterRes.msBeforeNext
        ).toISOString(),
      });
      next();
    })
    .catch(() => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({ success: false, message: "Too many requests" });
    });
});

//Ip based rate limiting for sensitive endpoints
const sensitiveEndpointsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({ success: false, message: "Too many requests" });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

//apply this sensitiveEndpointsLimiter to our routes
app.use("/api/auth/register", sensitiveEndpointsLimiter);

//Routes
app.use("/api/auth", routes);

//not-found
app.use((req, res) => res.status(404).send("route does not exist"));
//error handler
app.use(errorHandler);
app.listen(PORT, () => {
  logger.info(`Identity service running on port ${PORT}`);
});

//unhandled promise rejection

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at", promise, "reason:", reason);
});
