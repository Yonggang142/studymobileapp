import { Router } from "express"
import multer from "multer"
import { handleLogging } from "../controller/LoggingController"

export const loggingRouter = Router()

loggingRouter.post("/analysis", handleLogging)
